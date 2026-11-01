import { useState, type FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRecord } from "../../types/auth";

type Props = {
  students: UserRecord[];
  registrar: string;
  refresh: (message: string) => void;
};

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  const fines = financeRepository.getFines();

  const visibleFines = selectedStudentId
    ? fines.filter((fine) => fine.studentId === selectedStudentId)
    : fines;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const studentId = String(data.get("student"));

    if (!Number.isFinite(amount) || amount <= 0) {
      refresh("Escribe un monto mayor que cero.");
      return;
    }

    financeRepository.addFine({
      studentId,
      concept: String(data.get("concept")).trim(),
      amount,
      date: String(data.get("date")),
      registeredBy: registrar,
    });

    form.reset();
    setSelectedStudentId(studentId);
    refresh("Multa registrada correctamente.");
  };

  const payFine = (fineId: string) => {
    const payment = financeRepository.settleFine(fineId, registrar);

    if (payment) {
      refresh("Pago de multa registrado correctamente.");
    } else {
      refresh("La multa ya está pagada o no se encontró.");
    }
  };

  return (
    <>
      <section className="form-panel">
        <div>
          <p className="eyebrow">Tesorería</p>
          <h2>Registrar multa</h2>
          <p>Registra una nueva multa o cuota pendiente.</p>
        </div>

        <form onSubmit={submit}>
          <label>
            Estudiante
            <select
              name="student"
              required
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
            >
              <option value="" disabled>
                Selecciona un estudiante
              </option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.carnet}
                </option>
              ))}
            </select>
          </label>

          <label>
            Concepto
            <input
              name="concept"
              required
              placeholder="Ej. Multa por retraso"
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
              ? "Multas del estudiante seleccionado"
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
                <th>Concepto</th>
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
                          <button
                            type="button"
                            onClick={() => payFine(fine.id)}
                          >
                            Registrar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
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