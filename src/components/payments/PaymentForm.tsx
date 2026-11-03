import { useState, type FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRecord } from "../../types/auth";
import type { Fine } from "../../types/finance";
import PaymentTable from "./PaymentTable";

type Props = {
  students: UserRecord[];
  registrar: string;
  refresh: (message: string) => void;
  onMarkPaid?: (paymentId: string) => void;
};

const ACTIVITIES_KEY = "cobros_activities";
const ACTIVITY_STATUS_KEY = "cobros_activities_status";

type ActivityData = {
  allActivities: string[];
  activeActivities: string[];
};

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getActivityData(): ActivityData {
  try {
    const savedActivities = JSON.parse(
      localStorage.getItem(ACTIVITIES_KEY) ?? "[]",
    ) as unknown;

    const allActivities = Array.isArray(savedActivities)
      ? savedActivities.filter(
          (item): item is string => typeof item === "string",
        )
      : [];

    const savedStatuses = JSON.parse(
      localStorage.getItem(ACTIVITY_STATUS_KEY) ?? "{}",
    ) as unknown;

    const statuses =
      savedStatuses &&
      typeof savedStatuses === "object" &&
      !Array.isArray(savedStatuses)
        ? (savedStatuses as Record<string, boolean>)
        : {};

    return {
      allActivities,
      activeActivities: allActivities.filter(
        (activity) => statuses[activity] !== false,
      ),
    };
  } catch {
    return {
      allActivities: [],
      activeActivities: [],
    };
  }
}

function normalizeStudentSearch(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function SearchIcon() {
  return (
    <svg className="search-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function getRemainingFineAmount(fine: Fine): number {
  const paidAmount = financeRepository
    .getPayments()
    .filter(
      (payment) =>
        payment.fineId === fine.id &&
        (payment.status ?? "PAGADO") === "PAGADO",
    )
    .reduce((total, payment) => total + payment.amount, 0);

  return Math.max(fine.amount - paidAmount, 0);
}

export default function PaymentForm({
  students,
  registrar,
  refresh,
  onMarkPaid,
}: Props) {
  const [activityData] = useState<ActivityData>(getActivityData);
  const { allActivities, activeActivities } = activityData;

  const [selectedActivity, setSelectedActivity] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [selectedFineId, setSelectedFineId] = useState("");
  const [amountValue, setAmountValue] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<"PAGADO" | "PENDIENTE">("PAGADO");

  const hasConfiguredActivities = allActivities.length > 0;

  const filteredStudents = students.filter((student) =>
    normalizeStudentSearch(`${student.name} ${student.carnet}`).includes(
      normalizeStudentSearch(studentSearch.trim()),
    ),
  );

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  const pendingFines = selectedStudentId
    ? financeRepository
        .getFines()
        .filter(
          (fine) =>
            fine.studentId === selectedStudentId &&
            fine.status === "PENDIENTE",
        )
    : [];

  const selectedFine = pendingFines.find(
    (fine) => fine.id === selectedFineId,
  );

  const selectedPayments = selectedStudentId
    ? financeRepository
        .getPayments()
        .filter((payment) => payment.studentId === selectedStudentId)
    : [];

  const chooseStudent = (student: UserRecord) => {
    setStudentSearch(`${student.name} · ${student.carnet}`);
    setSelectedStudentId(student.id);
    setSelectedFineId("");
    setAmountValue("");
    setStudentListOpen(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    if (!selectedStudentId) {
      refresh("Elige un estudiante de la lista de sugerencias.");
      return;
    }

    const amount = Number(data.get("amount"));

    const concept = selectedFine
      ? selectedFine.concept
      : hasConfiguredActivities
        ? selectedActivity
        : String(data.get("concept") ?? "").trim();

    if (
      !selectedFine &&
      hasConfiguredActivities &&
      activeActivities.length === 0
    ) {
      refresh("Primero activa una actividad para poder registrar el cobro.");
      return;
    }

    if (!concept) {
      refresh("Selecciona o escribe una actividad.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      refresh("Escribe un monto mayor que cero.");
      return;
    }

    if (
      selectedFine &&
      amount > getRemainingFineAmount(selectedFine) + 0.001
    ) {
      refresh("El monto supera el saldo pendiente de esta multa.");
      return;
    }

    const extraObservations = String(
      data.get("observations") ?? "",
    ).trim();

    const observations = selectedFine
      ? [
          `Pago de multa: ${
            selectedFine.reason || selectedFine.concept
          }`,
          extraObservations,
        ]
          .filter(Boolean)
          .join(" · ")
      : extraObservations;

    financeRepository.addPayment({
      studentId: selectedStudentId,
      concept,
      amount,
      date: String(data.get("date")),
      time: String(data.get("time") ?? ""),
      status: selectedFine ? "PAGADO" : paymentStatus,
      observations,
      registeredBy: registrar,
      ...(selectedFine ? { fineId: selectedFine.id } : {}),
    });

    form.reset();
    setSelectedActivity("");
    setStudentSearch("");
    setSelectedStudentId("");
    setStudentListOpen(false);
    setSelectedFineId("");
    setAmountValue("");
    setPaymentStatus("PAGADO");
    refresh("Cobro registrado correctamente.");
  };

  return (
    <>
      <section className="form-panel">
        <div>
          <p className="eyebrow">Tesorería</p>
          <h2>Registrar cobro</h2>
          <p>Busca al estudiante y registra el detalle del cobro.</p>
        </div>

        <form onSubmit={submit}>
          <div className="search-bar search-bar--form">
            <label className="search-bar__label" htmlFor="payment-student-search">
              Buscar y seleccionar estudiante por nombre o carnet
            </label>

            <div className="search-bar__field student-search__field">
              <SearchIcon />

              <input
                id="payment-student-search"
                className="search-bar__input"
                type="text"
                value={studentSearch}
                onFocus={() => setStudentListOpen(true)}
                onBlur={() =>
                  window.setTimeout(() => setStudentListOpen(false), 120)
                }
                onChange={(event) => {
                  const value = event.target.value;
                  setStudentSearch(value);

                  const matchedStudent = students.find(
                    (student) =>
                      `${student.name} · ${student.carnet}`.toLocaleLowerCase() ===
                      value.trim().toLocaleLowerCase(),
                  );

                  setSelectedStudentId(matchedStudent?.id ?? "");
                  setSelectedFineId("");
                  setAmountValue("");
                  setStudentListOpen(true);
                }}
                placeholder="Escribe un nombre o carnet"
                autoComplete="off"
                required
              />

              {studentListOpen && (
                <div className="student-search__dropdown">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className="student-search__option"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => chooseStudent(student)}
                      >
                        <strong>{student.name}</strong>
                        <span>
                          Carnet: {student.carnet}
                          {student.school ? ` · ${student.school}` : ""}
                          {student.course ? ` · ${student.course}` : ""}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="student-search__empty">
                      No se encontraron estudiantes.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {pendingFines.length > 0 && (
            <label>
              Multa pendiente que se paga
              <select
                value={selectedFineId}
                onChange={(event) => {
                  const fineId = event.target.value;
                  const fine = pendingFines.find(
                    (item) => item.id === fineId,
                  );

                  setSelectedFineId(fineId);
                  setAmountValue(
                    fine
                      ? getRemainingFineAmount(fine).toFixed(2)
                      : "",
                  );
                }}
              >
                <option value="">Es un cobro normal</option>

                {pendingFines.map((fine) => (
                  <option key={fine.id} value={fine.id}>
                    {fine.concept} · {fine.reason || "Sin motivo"} · Bs{" "}
                    {getRemainingFineAmount(fine).toFixed(2)} · {fine.date}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Actividad o concepto
            {selectedFine ? (
              <input value={selectedFine.concept} readOnly />
            ) : activeActivities.length > 0 ? (
              <select
                name="activity"
                value={selectedActivity}
                onChange={(event) => setSelectedActivity(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona una actividad
                </option>

                {activeActivities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            ) : hasConfiguredActivities ? (
              <p>
                No hay actividades activas. Activa una desde “Gestionar
                actividades”.
              </p>
            ) : (
              <input
                name="concept"
                required
                placeholder="Ej. Moles Curso"
              />
            )}
          </label>

          <div className="form-row">
            <label>
              Monto (Bs.)
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amountValue}
                onChange={(event) => setAmountValue(event.target.value)}
              />
            </label>

            <label>
              Estado del cobro
              <select
                name="status"
                value={selectedFine ? "PAGADO" : paymentStatus}
                disabled={Boolean(selectedFine)}
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value as "PAGADO" | "PENDIENTE",
                  )
                }
                required
              >
                <option value="PAGADO">Pagado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Fecha de pago
              <input
                name="date"
                type="date"
                required
                defaultValue={getLocalDate()}
              />
            </label>

            <label>
              Hora de pago
              <input name="time" type="time" />
            </label>
          </div>

          <label>
            Observaciones
            <textarea
              name="observations"
              rows={3}
              placeholder="Detalles adicionales del cobro"
            />
          </label>

          <button
            className="primary"
            type="submit"
            disabled={
              !selectedFine &&
              hasConfiguredActivities &&
              activeActivities.length === 0
            }
          >
            Registrar cobro
          </button>
        </form>
      </section>

      {selectedStudentId && (
        <PaymentTable
          payments={selectedPayments}
          title={`Cobros de ${selectedStudent?.name ?? "estudiante"}`}
          onMarkPaid={onMarkPaid}
        />
      )}
    </>
  );
}