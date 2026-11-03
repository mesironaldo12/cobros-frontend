import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authRepository } from "../repositories/authRepository";
import { financeRepository } from "../repositories/financeRepository";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import PaymentTable from "../components/payments/PaymentTable";
import PaymentForm from "../components/payments/PaymentForm";
import PaymentReports from "../components/payments/PaymentReports";
import FineForm from "../components/fines/FineForm";
import StatCard from "../components/dashboard/StatCard";
import UserForm from "../components/users/UserForm";
import UserTable from "../components/users/UserTable";
import FineHistoryTable from "../components/fines/FineHistoryTable";

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
            ["historial-multas", "Historial de multas"],
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
          <AdminView
            section={section}
            students={students}
            refresh={refresh}
            registrar={user.name}
          />
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
  if (section === "historial-multas") {
    const myFines = fines
      .filter((fine) => fine.studentId === userId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return <FineHistoryTable fines={myFines} title="Historial de multas" />;
  }

  const paidMine = mine.filter(
    (payment) => (payment.status ?? "PAGADO") === "PAGADO",
  );

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
            paidMine.reduce((total, payment) => total + payment.amount, 0),
          )}
          icon="↓"
        />

        <StatCard
          label="Pagos realizados"
          value={String(paidMine.length)}
          icon="✓"
        />

        <StatCard
          label="Multas pendientes"
          value={String(
              fines.filter(
              (fine) =>
                fine.studentId === userId &&
                (fine.status ?? "PENDIENTE") === "PENDIENTE",
            ).length
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
        onMarkPaid={(paymentId) => {
          const updated = financeRepository.markPaymentPaid(
            paymentId,
            registrar,
          );

          refresh(
            updated
              ? "El cobro se marcó como pagado."
              : "No se pudo actualizar el cobro.",
          );
        }}
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
    const paidPayments = payments.filter(
      (payment) => (payment.status ?? "PAGADO") === "PAGADO",
    );

    return (
      <>
        <section className="cards three">
          <StatCard
            label="Recaudado"
            value={money.format(
              paidPayments.reduce(
                (total, payment) => total + payment.amount,
                0,
              ),
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

        <PaymentReports payments={payments} />
      </>
    );
  }

  const paidToday = payments
    .filter(
      (payment) =>
        payment.date === today &&
        (payment.status ?? "PAGADO") === "PAGADO",
    )
    .reduce((total, payment) => total + payment.amount, 0);

  return (
    <>
      <section className="cards three">
        <StatCard
          label="Cobrado hoy"
          value={money.format(paidToday)}
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
        <UserTable refresh={refresh} />
      </>
    );
  }

  if (section === "pagos") {
    return (
      <PaymentForm
        students={students}
        registrar={registrar}
        refresh={refresh}
        onMarkPaid={(paymentId) => {
          const updated = financeRepository.markPaymentPaid(
            paymentId,
            registrar,
          );

          refresh(
            updated
              ? "El cobro se marcó como pagado."
              : "No se pudo actualizar el cobro.",
          );
        }}
      />
    );
  }

  if (section === "multas") {
    return <FineForm students={students} registrar={registrar} refresh={refresh} />;
  }

  if (section === "actividades") {
    return (
      <ManageList
        title="Gestionar actividades"
        storageKey="cobros_activities"
        placeholder="Nombre de la actividad"
        refresh={refresh}
        showStatus
        
      />
      

    );
  }

  if (section === "categorias") {
    return (
      <ManageList
        title="Gestionar categorías de aportes"
        storageKey="cobros_categories"
        placeholder="Nombre de la categoría"
        refresh={refresh}
      />
    );
  }

  if (section === "configuracion") {
    return <SystemSettings refresh={refresh} />;
  }

  const all = financeRepository.getUsers();
  const payments = financeRepository.getPayments();
  const fines = financeRepository.getFines();

  if (section === "reportes") {
    const balances = students.map((student) => ({
      student,
      amount: financeRepository.balance(student.id),
    }));

    const paidPayments = payments.filter(
      (payment) => (payment.status ?? "PAGADO") === "PAGADO",
    );

    return (
      <>
        <section className="cards three">
          <StatCard
            label="Total recaudado"
            value={money.format(
              paidPayments.reduce(
                (total, payment) => total + payment.amount,
                0,
              ),
            )}
            icon="↓"
          />

          <StatCard
            label="Total de multas/cuotas"
            value={money.format(
              fines.reduce((total, fine) => total + fine.amount, 0),
            )}
            icon="!"
          />

          <StatCard
            label="Estudiantes con saldo"
            value={String(
              balances.filter((item) => item.amount > 0).length,
            )}
            icon="◌"
          />
        </section>

        <PaymentReports payments={payments} />
        <BalanceTable balances={balances} />
      </>
    );
  }

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
          value={String(
            all.filter((item) => item.role === "TESORERO").length,
          )}
          icon="◌"
        />

        <StatCard
          label="Administradores"
          value={String(all.filter((item) => item.role === "ADMIN").length)}
          icon="◌"
        />
      </section>

      <section className="welcome">
        <h2>Panel de administración</h2>
        <p>
          Desde el menú puedes gestionar usuarios y actividades, registrar
          pagos y multas, consultar reportes, administrar categorías de aportes
          y configurar el sistema.
        </p>
      </section>
    </>
  );
}

function ManageList({
  title,
  storageKey,
  placeholder,
  refresh,
  showStatus = false,
}: {
  title: string;
  storageKey: string;
  placeholder: string;
  refresh: (message: string) => void;
  showStatus?: boolean;
}) {
  const statusStorageKey = `${storageKey}_status`;

  const [items, setItems] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const [statuses, setStatuses] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(statusStorageKey) ?? "{}",
      ) as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  const [value, setValue] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [activitySearch, setActivitySearch] = useState("");

  const normalizedActivitySearch = activitySearch
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const filteredItems = showStatus
    ? items.filter((item) =>
        item
          .toLocaleLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .includes(normalizedActivitySearch),
      )
    : items;

  const saveItems = (nextItems: string[]) => {
    setItems(nextItems);
    localStorage.setItem(storageKey, JSON.stringify(nextItems));
  };

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = value.trim();

    if (!name) return;

    if (
      items.some(
        (item) => item.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      refresh("Ese elemento ya existe.");
      return;
    }

    saveItems([...items, name]);
    setValue("");
    refresh("Elemento añadido correctamente.");
  };

  const toggleStatus = (item: string) => {
    const nextStatuses = {
      ...statuses,
      [item]: statuses[item] === false,
    };

    setStatuses(nextStatuses);
    localStorage.setItem(statusStorageKey, JSON.stringify(nextStatuses));
    refresh(
      nextStatuses[item] ? "Actividad activada." : "Actividad desactivada.",
    );
  };

  const startEditing = (item: string) => {
    setEditingItem(item);
    setEditValue(item);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const saveEdit = (oldName: string) => {
    const newName = editValue.trim();

    if (!newName) {
      refresh("El nombre no puede estar vacío.");
      return;
    }

    const alreadyExists = items.some(
      (item) =>
        item !== oldName &&
        item.toLocaleLowerCase() === newName.toLocaleLowerCase(),
    );

    if (alreadyExists) {
      refresh("Ya existe un elemento con ese nombre.");
      return;
    }

    if (newName === oldName) {
      cancelEditing();
      return;
    }

    saveItems(items.map((item) => (item === oldName ? newName : item)));

    if (showStatus) {
      const nextStatuses = { ...statuses };

      if (Object.prototype.hasOwnProperty.call(nextStatuses, oldName)) {
        nextStatuses[newName] = nextStatuses[oldName];
        delete nextStatuses[oldName];
      }

      setStatuses(nextStatuses);
      localStorage.setItem(statusStorageKey, JSON.stringify(nextStatuses));

      if (storageKey === "cobros_activities") {
        financeRepository.renameActivity(oldName, newName);
      }
    }

    cancelEditing();
    refresh("Elemento actualizado correctamente.");
  };

  const remove = (item: string) => {
    const confirmed = window.confirm(`¿Quieres eliminar "${item}"?`);

    if (!confirmed) return;

    saveItems(items.filter((entry) => entry !== item));

    if (showStatus) {
      const nextStatuses = { ...statuses };
      delete nextStatuses[item];
      setStatuses(nextStatuses);
      localStorage.setItem(statusStorageKey, JSON.stringify(nextStatuses));
    }

    if (editingItem === item) {
      cancelEditing();
    }

    refresh("Elemento eliminado.");
  };

  return (
    <section className="panel">
     <div className="panel-head">
  <h2>{title}</h2>
  <span>
    {showStatus
      ? `${filteredItems.length} de ${items.length} actividades`
      : `${items.length} registrados`}
  </span>
</div>

<form className="form-grid" onSubmit={add}>
  <label>
    {placeholder}
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      required
    />
  </label>

  <button type="submit">Añadir</button>
</form>

{showStatus && (
  <div className="search-bar">
    <label className="search-bar__label" htmlFor="activity-search-input">
      Buscar actividad
    </label>

    <div className="search-bar__field">
      <svg className="search-bar__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
      </svg>

      <input
        id="activity-search-input"
        className="search-bar__input"
        type="search"
        value={activitySearch}
        onChange={(event) => setActivitySearch(event.target.value)}
        placeholder="Escribe el nombre de la actividad"
      />
    </div>
  </div>
)}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              {showStatus && <th>Estado</th>}
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => {
              const isActive = statuses[item] !== false;
              const isEditing = editingItem === item;

              return (
                <tr key={item}>
                  <td>
                    {isEditing ? (
                      <input
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      item
                    )}
                  </td>

                  {showStatus && (
                    <td>
                      <b className={`tag ${isActive ? "paid" : "due"}`}>
                        {isActive ? "Activa" : "Inactiva"}
                      </b>
                    </td>
                  )}

                  <td>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(item)}
                        >
                          Guardar
                        </button>

                        <button type="button" onClick={cancelEditing}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        {showStatus && (
                          <button
                            type="button"
                            onClick={() => toggleStatus(item)}
                          >
                            {isActive ? "Desactivar" : "Activar"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                        >
                          Editar
                        </button>

                        <button type="button" onClick={() => remove(item)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={showStatus ? 3 : 2}>
                  {items.length === 0
                    ? "Todavía no hay elementos registrados."
                    : "No se encontraron actividades con esa búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemSettings({ refresh }: { refresh: (message: string) => void }) {
  const [institution, setInstitution] = useState(
    () => localStorage.getItem("cobros_institution") ?? "Gestión estudiantil",
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("cobros_currency") ?? "BOB",
  );
  const [period, setPeriod] = useState(
    () => localStorage.getItem("cobros_period") ?? "2026",
  );

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem("cobros_institution", institution.trim());
    localStorage.setItem("cobros_currency", currency);
    localStorage.setItem("cobros_period", period.trim());
    refresh("Configuración guardada en este navegador.");
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Configurar sistema</h2>
        <span>Preferencias generales</span>
      </div>

      <form className="form-grid" onSubmit={save}>
        <label>
          Nombre de la institución
          <input
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
            required
          />
        </label>

        <label>
          Moneda
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="BOB">Bolivianos (BOB)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </label>

        <label>
          Gestión o periodo
          <input
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            required
          />
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