import { financeRepository } from "../../repositories/financeRepository";
import type { Payment } from "../../types/finance";

type Props = {
  payments: Payment[];
  title: string;
};

const money = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
});

export default function PaymentTable({ payments, title }: Props) {
  const users = financeRepository.getUsers();

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span>
          {payments.length} registro{payments.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              
              <th>Hora</th>
              <th>Estudiante</th>
              <th>Escuela</th>
              <th>Curso</th>
              <th>Actividad o concepto</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Detalle</th>
            </tr>
          </thead>

          <tbody>
            {payments.length > 0 ? (
              payments.map((payment) => {
                const student = users.find(
                  (user) => user.id === payment.studentId,
                );
                const isPaid = (payment.status ?? "PAGADO") === "PAGADO";

                return (
                  <tr key={payment.id}>
                    <td>
                      {payment.date
                        ? new Date(
                            `${payment.date}T12:00:00`,
                          ).toLocaleDateString("es-BO")
                        : "—"}
                    </td>

                    <td>{payment.time || "—"}</td>
                    <td>{student?.name ?? "Estudiante no encontrado"}</td>
                    <td>{student?.school || "—"}</td>
                    <td>{student?.course || "—"}</td>
                    <td>{payment.concept}</td>
                    <td className="amount">{money.format(payment.amount)}</td>

                    <td>
                      <b className={`tag ${isPaid ? "paid" : "due"}`}>
                        {isPaid ? "Pagado" : "Pendiente"}
                      </b>
                    </td>

                    <td>
                      {payment.observations && (
                        <details>
                          <summary>Ver observaciones</summary>
                          <p>{payment.observations}</p>
                        </details>
                      )}
                      <small>Registrado por: {payment.registeredBy}</small>
                    </td>
                    <td>
                      {payment.collectionStartDate
                        ? new Date(
                            `${payment.collectionStartDate}T12:00:00`,
                          ).toLocaleDateString("es-BO")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="empty">
                  Aún no hay cobros registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}