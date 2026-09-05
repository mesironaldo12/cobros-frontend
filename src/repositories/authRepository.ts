import { storageService } from "../services/storageService";
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

    storageService.set<User>(SESSION_KEY, sessionUser);

    return sessionUser;
  },

  logout(): void {
    storageService.remove(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    return storageService.get<User>(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};
