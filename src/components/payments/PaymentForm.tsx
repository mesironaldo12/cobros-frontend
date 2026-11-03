import { useState, type FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRecord } from "../../types/auth";
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

function normalizeSearch(value: string): string {
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

  const hasConfiguredActivities = allActivities.length > 0;

  const filteredStudents = students.filter((student) => {
    const search = normalizeSearch(studentSearch);
    const searchableText = normalizeSearch(
      `${student.name} ${student.carnet}`,
    );

    return searchableText.includes(search);
  });

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  const visibleStudents =
    selectedStudent &&
    !filteredStudents.some((student) => student.id === selectedStudentId)
      ? [selectedStudent, ...filteredStudents]
      : filteredStudents;

  const selectedPayments = selectedStudentId
    ? financeRepository
        .getPayments()
        .filter((payment) => payment.studentId === selectedStudentId)
    : [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));

    const concept = hasConfiguredActivities
      ? selectedActivity
      : String(data.get("concept") ?? "").trim();

    if (hasConfiguredActivities && activeActivities.length === 0) {
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

    financeRepository.addPayment({
      studentId: String(data.get("student")),
      concept,
      amount,
      date: String(data.get("date")),
      time: String(data.get("time")),
      status: String(data.get("status")) as "PAGADO" | "PENDIENTE",
      observations: String(data.get("observations")).trim(),
      registeredBy: registrar,
    });

    form.reset();
    setSelectedActivity("");
    setStudentSearch("");
    setSelectedStudentId("");
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
            <label
              className="search-bar__label"
              htmlFor="payment-student-search"
            >
              Buscar estudiante por nombre o carnet
            </label>

            <div className="search-bar__field">
              <SearchIcon />
              <input
                id="payment-student-search"
                className="search-bar__input"
                type="search"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Escribe un nombre o carnet"
              />
            </div>
          </div>

          <label>
            Estudiante
            <select
              name="student"
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              required
            >
              <option value="" disabled>
                Selecciona un estudiante
              </option>

              {visibleStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.carnet}
                  {student.school ? ` · ${student.school}` : ""}
                  {student.course ? ` · ${student.course}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Actividad o concepto
            {activeActivities.length > 0 ? (
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
              Monto (Bs.) *
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
              />
            </label>

            <label>
              Estado del cobro
              <select name="status" defaultValue="PAGADO" required>
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
            disabled={hasConfiguredActivities && activeActivities.length === 0}
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