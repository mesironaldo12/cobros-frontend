import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm, { type DemoUser } from "../../components/auth/LoginForm";
import { authRepository } from "../../repositories/authRepository";
import { financeRepository } from "../../repositories/financeRepository";
import type { LoginCredentials, UserRole } from "../../types/auth";

const profileDescriptions: Record<UserRole, string> = {
  ESTUDIANTE: "Consulta tus cuotas y pagos.",
  TESORERO: "Gestiona pagos y movimientos.",
  ADMIN: "Administra la plataforma.",
};

const profileRoles: UserRole[] = ["ESTUDIANTE", "TESORERO", "ADMIN"];

function getLoginProfiles(): DemoUser[] {
  const users = financeRepository.getUsers();

  return profileRoles.flatMap((role) => {
    const user = users.find((candidate) => candidate.role === role);

    return user
      ? [{ ...user, description: profileDescriptions[role] }]
      : [];
  });
}

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const users = getLoginProfiles();

  if (authRepository.isAuthenticated()) return <Navigate to="/" replace />;

  const handleLogin = (credentials: LoginCredentials) => {
    setError("");
    if (!authRepository.login(credentials)) {
      setError("El carnet o la contraseña son incorrectos.");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <main className="login-page">
      <LoginForm error={error} users={users} onSubmit={handleLogin} />
    </main>
  );
}

export default LoginPage;
