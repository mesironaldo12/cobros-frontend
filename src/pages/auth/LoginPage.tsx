import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "../../components/auth/LoginForm";
import { authRepository } from "../../repositories/authRepository";
import type { LoginCredentials } from "../../types/auth";

const demoUsers = [
  { name: "Valentina Rojas", role: "ESTUDIANTE" as const, carnet: "20240001", password: "estudiante123", description: "Consulta tus cuotas y pagos." },
  { name: "Miguel Herrera", role: "TESORERO" as const, carnet: "20240002", password: "tesorero123", description: "Gestiona pagos y movimientos." },
  { name: "Sofía Martínez", role: "ADMIN" as const, carnet: "20240003", password: "admin123", description: "Administra la plataforma." },
];

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

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
      <LoginForm error={error} onSubmit={handleLogin} />
    </main>
  );
}

export default LoginPage;
