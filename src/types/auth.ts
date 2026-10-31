export type UserRole = "ADMIN" | "TESORERO" | "ESTUDIANTE";

export interface User {
  id: string;
  name: string;
  carnet: string;
  role: UserRole;
  school?: string;
  course?: string;
}

export interface UserRecord extends User {
  password: string;
}

export interface LoginCredentials {
  carnet: string;
  password: string;
}