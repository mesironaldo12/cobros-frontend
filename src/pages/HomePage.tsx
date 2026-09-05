import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authRepository } from "../repositories/authRepository";
import { financeRepository } from "../repositories/financeRepository";
import type { UserRole } from "../types/auth";

const money = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", minimumFractionDigits: 0 });
const today = new Date().toISOString().slice(0, 10);

function HomePage() {
  const navigate = useNavigate();
  const user = authRepository.getCurrentUser();
  const [section, setSection] = useState("inicio");
  const [, setVersion] = useState(0);
  const [notice, setNotice] = useState("");
  const students = financeRepository.getStudents();
  const payments = financeRepository.getPayments();
  const fines = financeRepository.getFines();

  if (!user) { navigate("/login", { replace: true }); return null; }
  const refresh = (message: string) => { setVersion((value) => value + 1); setNotice(message); };
  const logout = () => { authRepository.logout(); navigate("/login", { replace: true }); };
  const title = user.role === "ADMIN" ? "Panel de administración" : user.role === "TESORERO" ? "Panel de tesorería" : "Mi cuenta";
  const nav = user.role === "ADMIN" ? [["inicio", "Resumen"], ["personas", "Usuarios"]] : user.role === "TESORERO" ? [["inicio", "Resumen"], ["pagos", "Registrar pago"], ["multas", "Registrar multa"], ["saldos", "Saldos"], ["reportes", "Reportes"]] : [["inicio", "Mi saldo"], ["historial", "Historial de pagos"]];

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span>¢</span><div>COBROS<small>Gestión estudiantil</small></div></div>
      <nav>{nav.map(([key, label]) => <button className={section === key ? "active" : ""} key={key} onClick={() => setSection(key)}><i>{key === "inicio" ? "⌂" : key === "pagos" ? "↓" : key === "multas" ? "!" : key === "reportes" ? "▤" : "◌"}</i>{label}</button>)}</nav>
      <div className="sidebar-user"><div className="avatar">{user.name[0]}</div><div><strong>{user.name}</strong><small>{financeRepository.roleLabel(user.role)}</small></div><button aria-label="Cerrar sesión" onClick={logout}>↪</button></div>
    </aside>
    <main className="content"><header><div><p className="eyebrow">Sistema de cobros</p><h1>{title}</h1></div><div className="date">◷ {new Intl.DateTimeFormat("es-BO", { dateStyle: "full" }).format(new Date())}</div></header>
      {notice && <div className="notice">✓ {notice}<button onClick={() => setNotice("")}>×</button></div>}
      {user.role === "ESTUDIANTE" && <StudentView section={section} userId={user.id} payments={payments} fines={fines} />}
      {user.role === "TESORERO" && <TreasurerView section={section} students={students} payments={payments} fines={fines} registrar={user.name} refresh={refresh} />}
      {user.role === "ADMIN" && <AdminView section={section} students={students} refresh={refresh} />}
    </main>
  </div>;
}

function StudentView({ section, userId, payments, fines }: { section: string; userId: string; payments: ReturnType<typeof financeRepository.getPayments>; fines: ReturnType<typeof financeRepository.getFines> }) {
  const balance = financeRepository.balance(userId); const mine = payments.filter((item) => item.studentId === userId).sort((a,b) => b.date.localeCompare(a.date));
  return <>{section === "inicio" && <><section className="hero-balance"><div><p>Saldo pendiente</p><h2>{money.format(balance)}</h2><span>{balance > 0 ? "Tienes una cuota pendiente de pago" : "No tienes pagos pendientes"}</span></div><div className="hero-icon">◴</div></section><section className="cards three"><Stat label="Pagado este periodo" value={money.format(mine.reduce((n, p) => n + p.amount, 0))} icon="↓" /><Stat label="Pagos realizados" value={String(mine.length)} icon="✓" /><Stat label="Multas pendientes" value={String(fines.filter((f) => f.studentId === userId).length)} icon="!" /></section><PaymentTable payments={mine.slice(0, 4)} title="Últimos pagos" /></>}{section === "historial" && <PaymentTable payments={mine} title="Historial de pagos" />}</>;
}

function TreasurerView({ section, students, payments, fines, registrar, refresh }: { section: string; students: ReturnType<typeof financeRepository.getStudents>; payments: ReturnType<typeof financeRepository.getPayments>; fines: ReturnType<typeof financeRepository.getFines>; registrar: string; refresh: (m:string)=>void }) {
  const balances = students.map((student) => ({ student, amount: financeRepository.balance(student.id) }));
  if (section === "pagos" || section === "multas") return <RecordForm type={section === "pagos" ? "pago" : "multa"} students={students} registrar={registrar} refresh={refresh} />;
  if (section === "saldos") return <BalanceTable balances={balances} />;
  if (section === "reportes") return <><section className="cards three"><Stat label="Recaudado" value={money.format(payments.reduce((n,p)=>n+p.amount,0))} icon="↓" /><Stat label="Multas registradas" value={money.format(fines.reduce((n,p)=>n+p.amount,0))} icon="!" /><Stat label="Estudiantes" value={String(students.length)} icon="◌" /></section><PaymentTable title="Reporte de pagos" payments={payments.sort((a,b)=>b.date.localeCompare(a.date))} /></>;
  return <><section className="cards three"><Stat label="Cobrado hoy" value={money.format(payments.filter((p)=>p.date===today).reduce((n,p)=>n+p.amount,0))} icon="↓" /><Stat label="Por cobrar" value={money.format(balances.reduce((n,b)=>n+Math.max(b.amount,0),0))} icon="◷" /><Stat label="Estudiantes con saldo" value={String(balances.filter(b=>b.amount>0).length)} icon="!" /></section><BalanceTable balances={balances.slice(0,5)} /></>;
}

function AdminView({ section, students, refresh }: { section:string; students: ReturnType<typeof financeRepository.getStudents>; refresh:(m:string)=>void }) {
  if (section === "personas") return <><UserForm refresh={refresh} /><UserTable /></>;
  const all = financeRepository.getUsers(); return <><section className="cards three"><Stat label="Estudiantes registrados" value={String(students.length)} icon="◌" /><Stat label="Tesoreros activos" value={String(all.filter(u=>u.role==="TESORERO").length)} icon="◌" /><Stat label="Administradores" value={String(all.filter(u=>u.role==="ADMIN").length)} icon="◌" /></section><section className="welcome"><h2>Administra tu sistema con facilidad</h2><p>Utiliza el menú <strong>Usuarios</strong> para registrar estudiantes y tesoreros que podrán acceder a la plataforma.</p></section></>;
}

function Stat({ label, value, icon }: {label:string;value:string;icon:string}) { return <article className="stat"><div className="stat-icon">{icon}</div><div><p>{label}</p><h2>{value}</h2></div></article>; }
function PaymentTable({ payments, title }: { payments: ReturnType<typeof financeRepository.getPayments>; title: string }) { return <section className="panel"><div className="panel-head"><h2>{title}</h2><span>{payments.length} registro{payments.length !== 1 ? "s" : ""}</span></div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Registrado por</th><th>Monto</th><th>Estado</th></tr></thead><tbody>{payments.length ? payments.map(p=><tr key={p.id}><td>{new Date(`${p.date}T12:00:00`).toLocaleDateString("es-BO")}</td><td>{p.concept}</td><td>{p.registeredBy}</td><td className="amount">{money.format(p.amount)}</td><td><b className="tag paid">Pagado</b></td></tr>) : <tr><td colSpan={5} className="empty">Aún no hay pagos registrados.</td></tr>}</tbody></table></div></section>; }
function BalanceTable({ balances }: {balances: {student: ReturnType<typeof financeRepository.getStudents>[number];amount:number}[]}) { return <section className="panel"><div className="panel-head"><h2>Consulta de saldos</h2><span>{balances.length} estudiantes</span></div><div className="table-wrap"><table><thead><tr><th>Estudiante</th><th>Carnet</th><th>Saldo pendiente</th><th>Estado</th></tr></thead><tbody>{balances.map(({student,amount})=><tr key={student.id}><td><strong>{student.name}</strong></td><td>{student.carnet}</td><td className="amount">{money.format(amount)}</td><td><b className={`tag ${amount > 0 ? "due" : "paid"}`}>{amount > 0 ? "Pendiente" : "Al día"}</b></td></tr>)}</tbody></table></div></section>; }
function RecordForm({type, students, registrar, refresh}:{type:"pago"|"multa";students:ReturnType<typeof financeRepository.getStudents>;registrar:string;refresh:(m:string)=>void}) { const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const data=new FormData(event.currentTarget);const item={studentId:String(data.get("student")),concept:String(data.get("concept")),amount:Number(data.get("amount")),date:String(data.get("date")),registeredBy:registrar}; if(type==="pago") financeRepository.addPayment(item);else financeRepository.addFine(item);event.currentTarget.reset();refresh(`${type === "pago" ? "Pago" : "Multa"} registrado correctamente.`)}; return <section className="form-panel"><div><p className="eyebrow">Tesorería</p><h2>Registrar {type}</h2><p>{type === "pago" ? "Registra los pagos recibidos de los estudiantes." : "Registra una nueva multa o cuota pendiente."}</p></div><form onSubmit={submit}><label>Estudiante<select name="student" required><option value="">Selecciona un estudiante</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.carnet}</option>)}</select></label><label>Concepto<input name="concept" required placeholder={type === "pago" ? "Ej. Cuota mensual - Septiembre" : "Ej. Multa por retraso"}/></label><div className="form-row"><label>Monto (Bs.)<input name="amount" type="number" min="1" required placeholder="0"/></label><label>Fecha<input name="date" type="date" required defaultValue={today}/></label></div><button className="primary" type="submit">Registrar {type}</button></form></section>; }
function UserForm({refresh}:{refresh:(m:string)=>void}) { const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const data=new FormData(event.currentTarget);financeRepository.addUser({name:String(data.get("name")),carnet:String(data.get("carnet")),password:String(data.get("password")),role:String(data.get("role")) as UserRole});event.currentTarget.reset();refresh("Usuario añadido correctamente.")};return <section className="form-panel compact"><div><p className="eyebrow">Administración</p><h2>Añadir usuario</h2><p>Crea una cuenta para un estudiante o tesorero.</p></div><form onSubmit={submit}><div className="form-row"><label>Nombre completo<input name="name" required placeholder="Nombre y apellido"/></label><label>Carnet<input name="carnet" required placeholder="Ej. 20241003"/></label></div><div className="form-row"><label>Rol<select name="role"><option value="ESTUDIANTE">Estudiante</option><option value="TESORERO">Tesorero</option></select></label><label>Contraseña<input name="password" type="password" required minLength={4} placeholder="Contraseña temporal"/></label></div><button className="primary" type="submit">Añadir usuario</button></form></section>; }
function UserTable(){const users=financeRepository.getUsers();return <section className="panel"><div className="panel-head"><h2>Usuarios del sistema</h2><span>{users.length} usuarios</span></div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Carnet</th><th>Rol</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.carnet}</td><td><b className="tag neutral">{financeRepository.roleLabel(u.role)}</b></td></tr>)}</tbody></table></div></section>}
export default HomePage;
