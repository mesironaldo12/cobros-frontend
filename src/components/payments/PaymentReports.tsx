import { useState } from "react";
import { financeRepository } from "../../repositories/financeRepository";
import PaymentTable from "./PaymentTable";
import type { Payment } from "../../types/finance";

type Props = {
  payments: Payment[];
};

type GroupRow = {
  label: string;
  count: number;
  total: number;
};

const money = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
});

export default function PaymentReports({ payments }: Props) {
  const [activity, setActivity] = useState("");
  const [school, setSchool] = useState("");
  const [course, setCourse] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [activityStatus, setActivityStatus] = useState("");
  const [groupBy, setGroupBy] = useState("");

  const students = financeRepository
    .getUsers()
    .filter((user) => user.role === "ESTUDIANTE");

  const studentById = new Map(
    students.map((student) => [student.id, student]),
  );

  let activityStatuses: Record<string, boolean> = {};

  try {
    const savedStatuses = JSON.parse(
      localStorage.getItem("cobros_activities_status") ?? "{}",
    ) as unknown;

    if (
      savedStatuses &&
      typeof savedStatuses === "object" &&
      !Array.isArray(savedStatuses)
    ) {
      activityStatuses = savedStatuses as Record<string, boolean>;
    }
  } catch {
    activityStatuses = {};
  }

  const activities = Array.from(
    new Set(payments.map((payment) => payment.concept).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const schools = Array.from(
    new Set(
      students
        .map((student) => student.school)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const courses = Array.from(
    new Set(
      students
        .filter((student) => !school || student.school === school)
        .map((student) => student.course)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredPayments = payments
    .filter((payment) => !activity || payment.concept === activity)
    .filter((payment) => !dateFrom || payment.date >= dateFrom)
    .filter((payment) => !dateTo || payment.date <= dateTo)
    .filter((payment) => !status || (payment.status ?? "PAGADO") === status)
    .filter((payment) => {
      if (!activityStatus) return true;

      const isActive = activityStatuses[payment.concept] !== false;
      return activityStatus === "ACTIVA" ? isActive : !isActive;
    })
    .filter((payment) => {
      const student = studentById.get(payment.studentId);
      return !school || student?.school === school;
    })
    .filter((payment) => {
      const student = studentById.get(payment.studentId);
      return !course || student?.course === course;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const total = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const groups = new Map<string, GroupRow>();

  if (groupBy) {
    filteredPayments.forEach((payment) => {
      const student = studentById.get(payment.studentId);
      let label = "";

      if (groupBy === "school") {
        label = student?.school || "Sin escuela";
      } else if (groupBy === "course") {
        label = student?.course || "Sin curso";
      } else if (groupBy === "activity") {
        label = payment.concept || "Sin actividad";
      } else {
        label = payment.date || "Sin fecha";
      }

      const current = groups.get(label) ?? {
        label,
        count: 0,
        total: 0,
      };

      current.count += 1;
      current.total += payment.amount;
      groups.set(label, current);
    });
  }

  const summaryRows = Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  const clearFilters = () => {
    setActivity("");
    setSchool("");
    setCourse("");
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setActivityStatus("");
    setGroupBy("");
  };

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Filtros del reporte</h2>
          <span>{filteredPayments.length} cobros encontrados</span>
        </div>

        <div className="form-grid">
          <label>
            Escuela
            <select
              value={school}
              onChange={(event) => {
                setSchool(event.target.value);
                setCourse("");
              }}
            >
              <option value="">Todas las escuelas</option>
              {schools.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Curso
            <select
              value={course}
              onChange={(event) => setCourse(event.target.value)}
            >
              <option value="">Todos los cursos</option>
              {courses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Actividad o concepto
            <select
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
            >
              <option value="">Todas las actividades</option>
              {activities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Estado de la actividad
            <select
              value={activityStatus}
              onChange={(event) => setActivityStatus(event.target.value)}
            >
              <option value="">Todas</option>
              <option value="ACTIVA">Activas</option>
              <option value="INACTIVA">Inactivas</option>
            </select>
          </label>

          <label>
            Desde
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <label>
            Estado del cobro
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="PAGADO">Pagado</option>
              <option value="PENDIENTE">Pendiente</option>
            </select>
          </label>

          <label>
            Agrupar reporte por
            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value)}
            >
              <option value="">Sin agrupación</option>
              <option value="school">Escuela</option>
              <option value="course">Curso</option>
              <option value="activity">Actividad</option>
              <option value="date">Fecha</option>
            </select>
          </label>

          <button type="button" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>

        <p>
          Total del reporte: <strong>{money.format(total)}</strong>
        </p>
      </section>

      {groupBy && (
        <section className="panel">
          <div className="panel-head">
            <h2>Resumen agrupado</h2>
            <span>{summaryRows.length} grupos</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    {groupBy === "school"
                      ? "Escuela"
                      : groupBy === "course"
                        ? "Curso"
                        : groupBy === "activity"
                          ? "Actividad"
                          : "Fecha"}
                  </th>
                  <th>Cantidad de cobros</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {summaryRows.length > 0 ? (
                  summaryRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.count}</td>
                      <td className="amount">{money.format(row.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>
                      No hay cobros que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PaymentTable
        title="Detalle de cobros filtrados"
        payments={filteredPayments}
      />
    </>
  );
}