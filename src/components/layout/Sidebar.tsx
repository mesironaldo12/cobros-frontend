import type { User } from "../../types/auth";
import { financeRepository } from "../../repositories/financeRepository";

type NavItem = [string, string];

type Props = {
  user: User;
  nav: NavItem[];
  section: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
};

function getIcon(key: string) {
  if (key === "inicio") return "⌂";
  if (key === "pagos") return "↓";
  if (key === "multas") return "!";
  if (key === "saldos") return "◷";
  if (key === "reportes") return "▤";
  if (key === "personas") return "♙";
  if (key === "historial") return "▤";

  return "◌";
}

function Sidebar({ user, nav, section, onSectionChange, onLogout }: Props) {
  const roleLabel = financeRepository.roleLabel(user.role);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">C</div>

        <div>
          <strong>Cobros</strong>
          <span>Gestión estudiantil</span>
        </div>
      </div>

      <div className="user-card">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>

        <div className="user-info">
          <strong>{user.name}</strong>
          <span>{roleLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-title">MENÚ</p>

        {nav.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`nav-item ${section === key ? "active" : ""}`}
            onClick={() => onSectionChange(key)}>
            <span className="nav-icon">{getIcon(key)}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="logout-button" onClick={onLogout}>
          <span>↪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
