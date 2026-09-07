import type { FormEvent } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import type { UserRecord } from "../../types/auth";

type Props = {
  students: UserRecord[];
  registrar: string;
  refresh: (message: string) => void;
};

const today = new Date().toISOString().slice(0, 10);

export default function PaymentForm({
  students,
  registrar,
  refresh,
}: Props) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    financeRepository.addPayment({
      studentId: String(data.get("student")),
      concept: String(data.get("concept")),
      amount: Number(data.get("amount")),
      date: String(data.get("date")),
      registeredBy: registrar,
    });

    form.reset();
    refresh("Pago registrado correctamente.");
  };

  return (
    <section className="form-panel">
      <div>
        <p className="eyebrow">Tesorería</p>
        <h2>Registrar pago</h2>
        <p>Registra los pagos recibidos de los estudiantes.</p>
      </div>

      <form onSubmit={submit}>
        <label>
          Estudiante
          <select name="student" required>
            <option value="">Selecciona un estudiante</option>
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
            placeholder="Ej. Cuota mensual - Septiembre"
          />
        </label>

        <div className="form-row">
          <label>
            Monto (Bs.)
            <input
              name="amount"
              type="number"
              min="1"
              required
              placeholder="0"
            />
          </label>

          <label>
            Fecha
            <input name="date" type="date" required defaultValue={today} />
          </label>
        </div>

        <button className="primary" type="submit">
          Registrar pago
        </button>
      </form>
    </section>
  );
}
