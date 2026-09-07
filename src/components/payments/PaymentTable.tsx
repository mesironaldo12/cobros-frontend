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
              <th>Concepto</th>
              <th>Registrado por</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {payments.length ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    {new Date(`${payment.date}T12:00:00`).toLocaleDateString(
                      "es-BO",
                    )}
                  </td>
                  <td>{payment.concept}</td>
                  <td>{payment.registeredBy}</td>
                  <td className="amount">{money.format(payment.amount)}</td>
                  <td>
                    <b className="tag paid">Pagado</b>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty">
                  Aún no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
