import { useState, type FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRecord } from "../../types/auth";

type Props = {
  students: UserRecord[];
  registrar: string;
  refresh: (message: string) => void;
};

const ACTIVITIES_KEY = "cobros_activities";
const ACTIVITY_STATUS_KEY = "cobros_activities_status";

function getActiveActivities(): string[] {
  try {
    const savedActivities = JSON.parse(
      localStorage.getItem(ACTIVITIES_KEY) ?? "[]",
    ) as unknown;

    const savedStatuses = JSON.parse(
      localStorage.getItem(ACTIVITY_STATUS_KEY) ?? "{}",
    ) as unknown;

    const activities = Array.isArray(savedActivities)
      ? savedActivities.filter(
          (activity): activity is string => typeof activity === "string",
        )
      : [];

    const statuses =
      savedStatuses &&
      typeof savedStatuses === "object" &&
      !Array.isArray(savedStatuses)
        ? (savedStatuses as Record<string, boolean>)
        : {};

    return activities.filter((activity) => statuses[activity] !== false);
  } catch {
    return [];
  }
}

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

const money = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
});

export default function FineForm({
  students,
  registrar,
  refresh,
}: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentListOpen, setStudentListOpen] = useState(false);

  const activities = getActiveActivities();
  const fines = financeRepository.getFines();

  const filteredStudents = students.filter((student) =>
    normalizeStudentSearch(`${student.name} ${student.carnet}`).includes(
      normalizeStudentSearch(studentSearch.trim()),
    ),
  );

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId,
  );

  const visibleFines = selectedStudentId
    ? fines.filter((fine) => fine.studentId === selectedStudentId)
    : fines;

  const chooseStudent = (student: UserRecord) => {
    setStudentSearch(`${student.name} · ${student.carnet}`);
    setSelectedStudentId(student.id);
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
    const concept = String(data.get("concept") ?? "").trim();
    const reason = String(data.get("reason") ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      refresh("Escribe un monto mayor que cero.");
      return;
    }

    if (!concept) {
      refresh("Selecciona o escribe una categoría para la multa.");
      return;
    }

    financeRepository.addFine({
      studentId: selectedStudentId,
      concept,
      reason: reason || undefined,
      amount,
      date: String(data.get("date")),
      registeredBy: registrar,
    });

    form.reset();

    const registeredStudent = students.find(
      (student) => student.id === selectedStudentId,
    );

    setStudentSearch(
      registeredStudent
        ? `${registeredStudent.name} · ${registeredStudent.carnet}`
        : "",
    );
    setStudentListOpen(false);
    refresh("Multa registrada correctamente.");
  };

  
    const removeFine = (fineId: string) => {
    const confirmed = window.confirm(
      "¿Seguro que quieres eliminar esta multa pendiente?",
    );

    if (!confirmed) return;

    const deleted = financeRepository.deleteFine(fineId);

    refresh(
      deleted
        ? "Multa eliminada correctamente."
        : "No se puede eliminar una multa que ya tiene pagos asociados.",
    );
  };

  return (
    <>
      <section className="form-panel">
        <div>
          <p className="eyebrow">Tesorería</p>
          <h2>Registrar multa</h2>
          <p>Registra una multa pendiente y el motivo es opcional.</p>
        </div>

        <form onSubmit={submit}>
          <div className="search-bar search-bar--form">
            <label className="search-bar__label" htmlFor="fine-student-search">
              Buscar y seleccionar estudiante por nombre o carnet
            </label>

            <div className="search-bar__field student-search__field">
              <SearchIcon />

              <input
                id="fine-student-search"
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

          <label>
            Categoría de la multa
            {activities.length > 0 ? (
              <select name="concept" required defaultValue="">
                <option value="" disabled>
                  Selecciona una categoría
                </option>

                {activities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="concept"
                required
                placeholder="Ej. Atrasos"
              />
            )}
          </label>

          <label>
            Motivo de la multa (opcional)
            <textarea
              name="reason"
              rows={3}
              placeholder="Explica por qué se registra esta multa"
            />
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
              />
            </label>

            <label>
              Fecha
              <input
                name="date"
                type="date"
                required
                defaultValue={getLocalDate()}
              />
            </label>
          </div>

          <button className="primary" type="submit">
            Registrar multa
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>
            {selectedStudentId
              ? `Multas de ${selectedStudent?.name ?? "estudiante"}`
              : "Multas registradas"}
          </h2>

          <span>
            {visibleFines.length} registro
            {visibleFines.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Categoría</th>
                <th>Motivo</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visibleFines.length > 0 ? (
                visibleFines.map((fine) => {
                  const student = students.find(
                    (item) => item.id === fine.studentId,
                  );
                  const isPaid = (fine.status ?? "PENDIENTE") === "PAGADA";

                  return (
                    <tr key={fine.id}>
                      <td>{student?.name ?? "Estudiante no encontrado"}</td>
                      <td>{fine.concept}</td>
                      <td>{fine.reason || "Sin motivo registrado"}</td>
                      <td>
                        {new Date(`${fine.date}T12:00:00`).toLocaleDateString(
                          "es-BO",
                        )}
                      </td>
                      <td className="amount">{money.format(fine.amount)}</td>
                      <td>
                        <b className={`tag ${isPaid ? "paid" : "due"}`}>
                          {isPaid ? "Pagada" : "Pendiente"}
                        </b>
                      </td>
                      <td>
                      {!isPaid && (
                        <div className="table-actions">
                          

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => removeFine(fine.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="empty">
                    {selectedStudentId
                      ? "Este estudiante no tiene multas registradas."
                      : "Aún no hay multas registradas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}