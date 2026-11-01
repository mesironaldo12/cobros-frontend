import type { LoginCredentials, User } from "../types/auth";
import { financeRepository } from "./financeRepository";

const SESSION_KEY = "app_session";

export const authRepository = {
  login(credentials: LoginCredentials): User | null {
    const foundUser = financeRepository.getUsers().find(
      (user) =>
        user.carnet === credentials.carnet &&
        user.password === credentials.password,
    );

    if (!foundUser) {
      return null;
    }

    const sessionUser: User = {
      id: foundUser.id,
      name: foundUser.name,
      carnet: foundUser.carnet,
      role: foundUser.role,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

    return sessionUser;
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const savedSession = sessionStorage.getItem(SESSION_KEY);

      return savedSession ? (JSON.parse(savedSession) as User) : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};