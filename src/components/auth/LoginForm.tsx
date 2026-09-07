import { useState } from "react";
import type { FormEventHandler } from "react";

import type { LoginCredentials, UserRole } from "../../types/auth";

export interface DemoUser {
  name: string;
  role: UserRole;
  carnet: string;
  password: string;
  description: string;
}

interface LoginFormProps {
  error?: string;
  users: DemoUser[];
  onSubmit: (credentials: LoginCredentials) => void;
}

const roleDetails: Record<UserRole, { label: string; icon: string }> = {
  ESTUDIANTE: { label: "Estudiante", icon: "◎" },
  TESORERO: { label: "Tesorero", icon: "¤" },
  ADMIN: { label: "Administrador", icon: "✦" },
};

function LoginForm({ error, users, onSubmit }: LoginFormProps) {
  const [carnet, setCarnet] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const selectUser = (user: DemoUser) => {
    setSelectedRole(user.role);
    setCarnet(user.carnet);
    setPassword(user.password);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const normalizedCarnet = carnet.trim();

    if (normalizedCarnet && password) {
      onSubmit({ carnet: normalizedCarnet, password });
    }
  };

  return (
    <div className="login-shell">
      <section className="login-intro" aria-label="Información de la plataforma">
        <a className="brand" href="/login" aria-label="Cobros">
          <span className="brand-mark">C</span>
          <span>Cobros</span>
        </a>
        <div className="intro-copy">
          <p className="eyebrow">Gestión académica</p>
          <h1>Todo lo que necesitas para estar al día.</h1>
          <p className="intro-description">
            Consulta, administra y mantén el control de los cobros desde un solo lugar.
          </p>
        </div>
        <div className="intro-footer">
          <span className="secure-dot" /> Acceso seguro para la comunidad
        </div>
      </section>

      <section className="login-panel" aria-label="Inicio de sesión">
        <div className="login-content">
          <div className="panel-heading">
            <p className="eyebrow">Bienvenido</p>
            <h2>Inicia sesión</h2>
            <p>Selecciona un perfil para continuar.</p>
          </div>

          <div className="profile-list" aria-label="Perfiles disponibles">
            {users.map((user) => {
              const details = roleDetails[user.role];
              const isSelected = selectedRole === user.role;
              return (
                <button
                  className={`profile-card ${isSelected ? "selected" : ""}`}
                  key={user.role}
                  type="button"
                  onClick={() => selectUser(user)}
                >
                  <span className="profile-icon" aria-hidden="true">{details.icon}</span>
                  <span className="profile-copy">
                    <strong>{details.label}</strong>
                    <small>{user.description}</small>
                  </span>
                  <span className="profile-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>

          <div className="divider"><span>o ingresa tus datos</span></div>

          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="carnet">Carnet de identidad</label>
            <input id="carnet" name="carnet" type="text" value={carnet} onChange={(event) => setCarnet(event.target.value)} placeholder="Ej. 20240001" autoComplete="username" required />

            <div className="label-row">
              <label htmlFor="password">Contraseña</label>
              <a href="#ayuda">¿Olvidaste tu contraseña?</a>
            </div>
            <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" autoComplete="current-password" required />

            {error && <p className="login-error" role="alert" aria-live="polite">{error}</p>}
            <button className="submit-button" type="submit">Ingresar <span aria-hidden="true">→</span></button>
          </form>

          <p className="help-text" id="ayuda">¿Necesitas ayuda? <a href="mailto:soporte@cobros.edu">Contacta a soporte</a></p>
        </div>
      </section>
    </div>
  );
}

export default LoginForm;
