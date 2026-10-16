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
          ["actividades", "Gestionar actividades"],
          ["pagos", "Registrar pagos"],
          ["multas", "Registrar multas"],
          ["reportes", "Generar reportes"],
          ["categorias", "Categorías de aportes"],
          ["configuracion", "Configurar sistema"],
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
          <AdminView section={section} students={students} refresh={refresh} registrar={user.name} />
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
  registrar,
}: {
  section: string;
  students: ReturnType<typeof financeRepository.getStudents>;
  refresh: (message: string) => void;
  registrar: string;
}) {
  if (section === "personas") {
    return (
      <>
        <UserForm refresh={refresh} />
        <UserTable />
      </>
    );
  }

  if (section === "pagos") {
    return <PaymentForm students={students} registrar={registrar} refresh={refresh} />;
  }

  if (section === "multas") {
    return <FineForm students={students} registrar={registrar} refresh={refresh} />;
  }

  if (section === "actividades") {
    return <ManageList title="Gestionar actividades" storageKey="cobros_activities" placeholder="Nombre de la actividad" refresh={refresh} />;
  }

  if (section === "categorias") {
    return <ManageList title="Gestionar categorías de aportes" storageKey="cobros_categories" placeholder="Nombre de la categoría" refresh={refresh} />;
  }

  if (section === "configuracion") {
    return <SystemSettings refresh={refresh} />;
  }

  const all = financeRepository.getUsers();
  const payments = financeRepository.getPayments();
  const fines = financeRepository.getFines();

  if (section === "reportes") {
    const balances = students.map((student) => ({ student, amount: financeRepository.balance(student.id) }));
    return (
      <>
        <section className="cards three">
          <StatCard label="Total recaudado" value={money.format(payments.reduce((total, item) => total + item.amount, 0))} icon="↓" />
          <StatCard label="Total de multas/cuotas" value={money.format(fines.reduce((total, item) => total + item.amount, 0))} icon="!" />
          <StatCard label="Estudiantes con saldo" value={String(balances.filter((item) => item.amount > 0).length)} icon="◌" />
        </section>
        <PaymentTable title="Reporte general de pagos" payments={[...payments].sort((a, b) => b.date.localeCompare(a.date))} />
        <BalanceTable balances={balances} />
      </>
    );
  }

  return (
    <>
      <section className="cards three">
        <StatCard label="Estudiantes registrados" value={String(students.length)} icon="◌" />
        <StatCard label="Tesoreros activos" value={String(all.filter((item) => item.role === "TESORERO").length)} icon="◌" />
        <StatCard label="Administradores" value={String(all.filter((item) => item.role === "ADMIN").length)} icon="◌" />
      </section>
      <section className="welcome">
        <h2>Panel de administración</h2>
        <p>Desde el menú puedes gestionar usuarios y actividades, registrar pagos y multas, consultar reportes, administrar categorías de aportes y configurar el sistema.</p>
      </section>
    </>
  );
}

function ManageList({
  title,
  storageKey,
  placeholder,
  refresh,
}: {
  title: string;
  storageKey: string;
  placeholder: string;
  refresh: (message: string) => void;
}) {
  const [items, setItems] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const [value, setValue] = useState("");

  const save = (next: string[]) => {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    if (items.some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      refresh("Ese elemento ya existe.");
      return;
    }
    save([...items, name]);
    setValue("");
    refresh("Elemento añadido correctamente.");
  };

  return (
    <section className="panel">
      <div className="panel-head"><h2>{title}</h2><span>{items.length} registrados</span></div>
      <form className="form-grid" onSubmit={add}>
        <label>
          {placeholder}
          <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} required />
        </label>
        <button type="submit">Añadir</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item}>
                <td>{item}</td>
                <td><button type="button" onClick={() => { save(items.filter((entry) => entry !== item)); refresh("Elemento eliminado."); }}>Eliminar</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={2}>Todavía no hay elementos registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemSettings({ refresh }: { refresh: (message: string) => void }) {
  const [institution, setInstitution] = useState(() => localStorage.getItem("cobros_institution") ?? "Gestión estudiantil");
  const [currency, setCurrency] = useState(() => localStorage.getItem("cobros_currency") ?? "BOB");
  const [period, setPeriod] = useState(() => localStorage.getItem("cobros_period") ?? "2026");

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem("cobros_institution", institution.trim());
    localStorage.setItem("cobros_currency", currency);
    localStorage.setItem("cobros_period", period.trim());
    refresh("Configuración guardada en este navegador.");
  };

  return (
    <section className="panel">
      <div className="panel-head"><h2>Configurar sistema</h2><span>Preferencias generales</span></div>
      <form className="form-grid" onSubmit={save}>
        <label>Nombre de la institución
          <input value={institution} onChange={(event) => setInstitution(event.target.value)} required />
        </label>
        <label>Moneda
          <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="BOB">Bolivianos (BOB)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </label>
        <label>Gestión o periodo
          <input value={period} onChange={(event) => setPeriod(event.target.value)} required />
        </label>
        <button type="submit">Guardar configuración</button>
      </form>
      <p>Estas preferencias se guardan localmente en el navegador actual.</p>
    </section>
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
