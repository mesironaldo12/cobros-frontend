import type { Fine } from "../../types/finance";

type Props = {
  fines: Fine[];
  title: string;
};

const money = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
});

export default function FineHistoryTable({ fines, title }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span>
          {fines.length} registro{fines.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Fecha de pago</th>
            </tr>
          </thead>

          <tbody>
            {fines.length > 0 ? (
              fines.map((fine) => {
                const isPaid = (fine.status ?? "PENDIENTE") === "PAGADA";

                return (
                  <tr key={fine.id}>
                    <td>
                      {new Date(`${fine.date}T12:00:00`).toLocaleDateString(
                        "es-BO",
                      )}
                    </td>
                    <td>{fine.concept}</td>
                    <td className="amount">{money.format(fine.amount)}</td>
                    <td>
                      <b className={`tag ${isPaid ? "paid" : "due"}`}>
                        {isPaid ? "Pagada" : "Pendiente"}
                      </b>
                    </td>
                    <td>
                      {fine.paidDate
                        ? new Date(
                            `${fine.paidDate}T12:00:00`,
                          ).toLocaleDateString("es-BO")
                        : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="empty">
                  No tienes multas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}