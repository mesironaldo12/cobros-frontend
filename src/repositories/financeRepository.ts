import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type { UserRecord, UserRole } from "../types/auth";
import type { Fine, Payment } from "../types/finance";

const USERS_KEY = "cobros_users";
const PAYMENTS_KEY = "cobros_payments";
const FINES_KEY = "cobros_fines";

const seedPayments: Payment[] = [
  { id: "payment-1", studentId: "student-1", concept: "Cuota mensual - Agosto", amount: 350, date: "2026-08-05", registeredBy: "Carlos Mendoza" },
  { id: "payment-2", studentId: "student-1", concept: "Cuota mensual - Julio", amount: 350, date: "2026-07-04", registeredBy: "Carlos Mendoza" },
];
const seedFines: Fine[] = [
  { id: "fine-1", studentId: "student-1", concept: "Cuota mensual - Septiembre", amount: 350, date: "2026-09-01", registeredBy: "Sistema" },
];

function getUsers(): UserRecord[] {
  return storageService.get<UserRecord[]>(USERS_KEY) ?? (initialUsers as UserRecord[]);
}
function id(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export const financeRepository = {
  getUsers,
  getStudents: () => getUsers().filter((user) => user.role === "ESTUDIANTE"),
  getPayments: () => storageService.get<Payment[]>(PAYMENTS_KEY) ?? seedPayments,
  getFines: () => storageService.get<Fine[]>(FINES_KEY) ?? seedFines,
  addUser(data: Omit<UserRecord, "id">) {
    const user = { ...data, id: id("user") };
    storageService.set(USERS_KEY, [...getUsers(), user]);
    return user;
  },
  addPayment(data: Omit<Payment, "id">) {
    storageService.set(PAYMENTS_KEY, [...this.getPayments(), { ...data, id: id("payment") }]);
  },
  addFine(data: Omit<Fine, "id">) {
    storageService.set(FINES_KEY, [...this.getFines(), { ...data, id: id("fine") }]);
  },
  balance(studentId: string) {
    const paid = this.getPayments().filter((item) => item.studentId === studentId).reduce((total, item) => total + item.amount, 0);
    const owed = this.getFines().filter((item) => item.studentId === studentId).reduce((total, item) => total + item.amount, 0);
    return owed - paid;
  },
  roleLabel(role: UserRole) {
    return { ADMIN: "Administrador", TESORERO: "Tesorero", ESTUDIANTE: "Estudiante" }[role];
  },
};
