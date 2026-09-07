import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authRepository } from "../repositories/authRepository";
import { financeRepository } from "../repositories/financeRepository";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import PaymentTable from "../components/payments/PaymentTable";
import PaymentForm from "../components/payments/PaymentForm";
import FineForm from "../components/fines/FineForm";
import StatCard from "../components/dashboard/StatCard";
import UserForm from "../components/users/UserForm";
import UserTable from "../components/users/UserTable";

const money = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 0,
});

const today = new Date().toISOString().slice(0, 10);

type NavItem = [string, string];

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();

  const [section, setSection] = useState("inicio");
  const [, setVersion] = useState(0);
  const [notice, setNotice] = useState("");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const students = financeRepository.getStudents();
  const payments = financeRepository.getPayments();
  const fines = financeRepository.getFines();

  const refresh = (message: string) => {
    setVersion((value) => value + 1);
    setNotice(message);
  };

  const logout = () => {
    authRepository.logout();
    navigate("/login", { replace: true });
  };

  const title =
    user.role === "ADMIN"
      ? "Panel de administración"
      : user.role === "TESORERO"
        ? "Panel de tesorería"
        : "Mi cuenta";

  const nav: NavItem[] =
    user.role === "ADMIN"
      ? [
          ["inicio", "Resumen"],
          ["personas", "Usuarios"],
        ]
      : user.role === "TESORERO"
        ? [
            ["inicio", "Resumen"],
            ["pagos", "Registrar pago"],
            ["multas", "Registrar multa"],
            ["saldos", "Saldos"],
            ["reportes", "Reportes"],
          ]
        : [
            ["inicio", "Mi saldo"],
            ["historial", "Historial de pagos"],
          ];

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        nav={nav}
        section={section}
        onSectionChange={setSection}
        onLogout={logout}
      />

      <main className="content">
        <Header title={title} />

        {notice && (
          <div className="notice">
            ✓ {notice}
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {user.role === "ESTUDIANTE" && (
          <StudentView
            section={section}
            userId={user.id}
            payments={payments}
            fines={fines}
          />
        )}

        {user.role === "TESORERO" && (
          <TreasurerView
            section={section}
            students={students}
            payments={payments}
            fines={fines}
            registrar={user.name}
            refresh={refresh}
          />
        )}

        {user.role === "ADMIN" && (
          <AdminView section={section} students={students} refresh={refresh} />
        )}
      </main>
    </div>
  );
}

function StudentView({
  section,
  userId,
  payments,
  fines,
}: {
  section: string;
  userId: string;
  payments: ReturnType<typeof financeRepository.getPayments>;
  fines: ReturnType<typeof financeRepository.getFines>;
}) {
  const balance = financeRepository.balance(userId);

  const mine = [...payments]
    .filter((item) => item.studentId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (section === "historial") {
    return <PaymentTable payments={mine} title="Historial de pagos" />;
  }

  return (
    <>
      <section className="hero-balance">
        <div>
          <p>Saldo pendiente</p>

          <h2>{money.format(balance)}</h2>

          <span>
            {balance > 0
              ? "Tienes una cuota pendiente de pago"
              : "No tienes pagos pendientes"}
          </span>
        </div>

        <div className="hero-icon">◴</div>
      </section>

      <section className="cards three">
        <StatCard
          label="Pagado este periodo"
          value={money.format(
            mine.reduce((total, payment) => total + payment.amount, 0),
          )}
          icon="↓"
        />

        <StatCard
          label="Pagos realizados"
          value={String(mine.length)}
          icon="✓"
        />

        <StatCard
          label="Multas pendientes"
          value={String(
            fines.filter((fine) => fine.studentId === userId).length,
          )}
          icon="!"
        />
      </section>

      <PaymentTable payments={mine.slice(0, 4)} title="Últimos pagos" />
    </>
  );
}

function TreasurerView({
  section,
  students,
  payments,
  fines,
  registrar,
  refresh,
}: {
  section: string;
  students: ReturnType<typeof financeRepository.getStudents>;
  payments: ReturnType<typeof financeRepository.getPayments>;
  fines: ReturnType<typeof financeRepository.getFines>;
  registrar: string;
  refresh: (message: string) => void;
}) {
  const balances = students.map((student) => ({
    student,
    amount: financeRepository.balance(student.id),
  }));

  if (section === "pagos") {
    return (
      <PaymentForm
        students={students}
        registrar={registrar}
        refresh={refresh}
      />
    );
  }

  if (section === "multas") {
    return (
      <FineForm students={students} registrar={registrar} refresh={refresh} />
    );
  }

  if (section === "saldos") {
    return <BalanceTable balances={balances} />;
  }

  if (section === "reportes") {
    return (
      <>
        <section className="cards three">
          <StatCard
            label="Recaudado"
            value={money.format(
              payments.reduce((total, payment) => total + payment.amount, 0),
            )}
            icon="↓"
          />

          <StatCard
            label="Multas registradas"
            value={money.format(
              fines.reduce((total, fine) => total + fine.amount, 0),
            )}
            icon="!"
          />

          <StatCard
            label="Estudiantes"
            value={String(students.length)}
            icon="◌"
          />
        </section>

        <PaymentTable
          title="Reporte de pagos"
          payments={[...payments].sort((a, b) => b.date.localeCompare(a.date))}
        />
      </>
    );
  }

  return (
    <>
      <section className="cards three">
        <StatCard
          label="Cobrado hoy"
          value={money.format(
            payments
              .filter((payment) => payment.date === today)
              .reduce((total, payment) => total + payment.amount, 0),
          )}
          icon="↓"
        />

        <StatCard
          label="Por cobrar"
          value={money.format(
            balances.reduce(
              (total, balance) => total + Math.max(balance.amount, 0),
              0,
            ),
          )}
          icon="◷"
        />

        <StatCard
          label="Estudiantes con saldo"
          value={String(
            balances.filter((balance) => balance.amount > 0).length,
          )}
          icon="!"
        />
      </section>

      <BalanceTable balances={balances.slice(0, 5)} />
    </>
  );
}

function AdminView({
  section,
  students,
  refresh,
}: {
  section: string;
  students: ReturnType<typeof financeRepository.getStudents>;
  refresh: (message: string) => void;
}) {
  if (section === "personas") {
    return (
      <>
        <UserForm refresh={refresh} />
        <UserTable />
      </>
    );
  }

  const all = financeRepository.getUsers();

  return (
    <>
      <section className="cards three">
        <StatCard
          label="Estudiantes registrados"
          value={String(students.length)}
          icon="◌"
        />

        <StatCard
          label="Tesoreros activos"
          value={String(all.filter((user) => user.role === "TESORERO").length)}
          icon="◌"
        />

        <StatCard
          label="Administradores"
          value={String(all.filter((user) => user.role === "ADMIN").length)}
          icon="◌"
        />
      </section>

      <section className="welcome">
        <h2>Administra tu sistema con facilidad</h2>

        <p>
          Utiliza el menú <strong>Usuarios</strong> para registrar estudiantes y
          tesoreros que podrán acceder a la plataforma.
        </p>
      </section>
    </>
  );
}

function BalanceTable({
  balances,
}: {
  balances: {
    student: ReturnType<typeof financeRepository.getStudents>[number];
    amount: number;
  }[];
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Consulta de saldos</h2>
        <span>{balances.length} estudiantes</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Carnet</th>
              <th>Saldo pendiente</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {balances.map(({ student, amount }) => (
              <tr key={student.id}>
                <td>
                  <strong>{student.name}</strong>
                </td>

                <td>{student.carnet}</td>

                <td className="amount">{money.format(amount)}</td>

                <td>
                  <b className={`tag ${amount > 0 ? "due" : "paid"}`}>
                    {amount > 0 ? "Pendiente" : "Al día"}
                  </b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default HomePage;
