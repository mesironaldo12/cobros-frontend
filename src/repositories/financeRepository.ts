import initialUsers from "../data/users.json";
import { storageService } from "../services/storageService";
import type { UserRecord, UserRole } from "../types/auth";
import type { Fine, Payment } from "../types/finance";

const USERS_KEY = "cobros_users";
const PAYMENTS_KEY = "cobros_payments";
const FINES_KEY = "cobros_fines";

const seedPayments: Payment[] = [
  {
    id: "payment-1",
    studentId: "student-1",
    concept: "Cuota mensual - Agosto",
    amount: 350,
    date: "2026-08-05",
    registeredBy: "Carlos Mendoza",
  },
  {
    id: "payment-2",
    studentId: "student-1",
    concept: "Cuota mensual - Julio",
    amount: 350,
    date: "2026-07-04",
    registeredBy: "Carlos Mendoza",
  },
];

const seedFines: Fine[] = [
  {
    id: "fine-1",
    studentId: "student-1",
    concept: "Cuota mensual - Septiembre",
    amount: 350,
    date: "2026-09-01",
    registeredBy: "Sistema",
    status: "PENDIENTE",
  },
];

function getUsers(): UserRecord[] {
  return storageService.get<UserRecord[]>(USERS_KEY) ?? (initialUsers as UserRecord[]);
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalTime(): string {
  const date = new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export const financeRepository = {
  getUsers,

  getStudents: () => getUsers().filter((user) => user.role === "ESTUDIANTE"),

  getPayments: () =>
    storageService.get<Payment[]>(PAYMENTS_KEY) ?? seedPayments,

  getFines() {
    const fines = storageService.get<Fine[]>(FINES_KEY) ?? seedFines;
    const payments = this.getPayments();

    return fines.map((fine) => {
      const relatedPayments = payments.filter(
        (payment) =>
          payment.fineId === fine.id &&
          (payment.status ?? "PAGADO") === "PAGADO",
      );

      const paidAmount = relatedPayments.reduce(
        (total, payment) => total + payment.amount,
        0,
      );

      const lastPayment = [...relatedPayments].sort((a, b) =>
        b.date.localeCompare(a.date),
      )[0];

      if (paidAmount >= fine.amount) {
        return {
          ...fine,
          status: "PAGADA" as const,
          paidDate: lastPayment?.date ?? fine.paidDate,
        };
      }

      return {
        ...fine,
        status: "PENDIENTE" as const,
        paidDate: undefined,
      };
    });
  },
  addUser(data: Omit<UserRecord, "id">) {
    const user = { ...data, id: id("user") };
    storageService.set(USERS_KEY, [...getUsers(), user]);
    return user;
  },

  updateUser(id: string, data: Partial<Omit<UserRecord, "id">>) {
    const updatedUsers = getUsers().map((user) =>
      user.id === id ? { ...user, ...data } : user,
    );

    storageService.set(USERS_KEY, updatedUsers);

    return updatedUsers.find((user) => user.id === id) ?? null;
  },
  renameActivity(oldName: string, newName: string) {
    const payments = this.getPayments().map((payment) =>
      payment.concept === oldName
        ? { ...payment, concept: newName }
        : payment,
    );

    const fines = this.getFines().map((fine) =>
      fine.concept === oldName ? { ...fine, concept: newName } : fine,
    );

    storageService.set(PAYMENTS_KEY, payments);
    storageService.set(FINES_KEY, fines);
  },
  deleteUser(userId: string): boolean {
    const hasFinancialRecords =
      this.getPayments().some((payment) => payment.studentId === userId) ||
      this.getFines().some((fine) => fine.studentId === userId);

    if (hasFinancialRecords) {
      return false;
    }

    const users = getUsers();
    const remainingUsers = users.filter((user) => user.id !== userId);

    if (remainingUsers.length === users.length) {
      return false;
    }

    storageService.set(USERS_KEY, remainingUsers);
    return true;
  },
  markPaymentPaid(paymentId: string, registeredBy: string): Payment | null {
    const payments = this.getPayments();

    const currentPayment = payments.find(
      (payment) => payment.id === paymentId,
    );

    if (
      !currentPayment ||
      (currentPayment.status ?? "PAGADO") !== "PENDIENTE"
    ) {
      return null;
    }

    const updatedPayment: Payment = {
      ...currentPayment,
      status: "PAGADO",
      date: getLocalDate(),
      time: getLocalTime(),
      registeredBy,
      observations: [
        currentPayment.observations?.trim(),
        `Marcado como pagado por ${registeredBy}`,
      ]
        .filter(Boolean)
        .join(" · "),
    };

    storageService.set(
      PAYMENTS_KEY,
      payments.map((payment) =>
        payment.id === paymentId ? updatedPayment : payment,
      ),
    );

    return updatedPayment;
  },
  addPayment(data: Omit<Payment, "id">) {
    let fineId = data.fineId;

    if (!fineId) {
      const normalizedConcept = data.concept
        .trim()
        .toLocaleLowerCase();

      const matchingFines = this.getFines().filter(
        (fine) =>
          fine.studentId === data.studentId &&
          fine.concept.trim().toLocaleLowerCase() === normalizedConcept &&
          fine.status === "PENDIENTE",
      );

      if (matchingFines.length === 1) {
        fineId = matchingFines[0].id;
      }
    }

    const payment: Payment = {
      ...data,
      ...(fineId ? { fineId } : {}),
      id: id("payment"),
    };

    const payments = [...this.getPayments(), payment];
    storageService.set(PAYMENTS_KEY, payments);

    if (
      payment.fineId &&
      (payment.status ?? "PAGADO") === "PAGADO"
    ) {
      const fine = this.getFines().find(
        (item) => item.id === payment.fineId,
      );

      if (fine) {
        const paidAmount = payments
          .filter(
            (item) =>
              item.fineId === fine.id &&
              (item.status ?? "PAGADO") === "PAGADO",
          )
          .reduce((total, item) => total + item.amount, 0);

        if (paidAmount >= fine.amount) {
          const storedFines =
            storageService.get<Fine[]>(FINES_KEY) ?? seedFines;

          storageService.set(
            FINES_KEY,
            storedFines.map((item) =>
              item.id === fine.id
                ? {
                    ...item,
                    status: "PAGADA" as const,
                    paidDate: payment.date,
                  }
                : item,
            ),
          );
        }
      }
    }

    return payment;
  },

  addFine(data: Omit<Fine, "id" | "status" | "paidDate">) {
    const fine: Fine = {
      ...data,
      id: id("fine"),
      status: "PENDIENTE",
    };

    storageService.set(FINES_KEY, [...this.getFines(), fine]);
    return fine;
  },

  settleFine(fineId: string, registeredBy: string) {
    const fine = this.getFines().find((item) => item.id === fineId);

    if (!fine || fine.status === "PAGADA") {
      return null;
    }

    const alreadyPaid = this.getPayments()
    .filter(
      (payment) =>
        payment.fineId === fineId &&
        (payment.status ?? "PAGADO") === "PAGADO",
    )
    .reduce((total, payment) => total + payment.amount, 0);

    const remaining = Math.max(fine.amount - alreadyPaid, 0);

    if (remaining === 0) {
      return null;
    }

    return this.addPayment({
      studentId: fine.studentId,
      concept: fine.concept,
      amount: remaining,
      date: getLocalDate(),
      time: getLocalTime(),
      status: "PAGADO",
      observations: `Pago de multa: ${fine.concept}`,
      registeredBy,
      fineId,
    });
  },

  balance(studentId: string) {
    const payments = this.getPayments();
    const studentFines = this.getFines().filter(
      (fine) => fine.studentId === studentId,
    );

    // Calcula cada multa por separado.
    // Solo descuenta pagos enlazados a esa multa o con el mismo concepto.
    const finesBalance = studentFines.reduce((total, fine) => {
      const fineConcept = fine.concept.trim().toLocaleLowerCase();

      const paidForThisFine = payments
        .filter((payment) => {
          const isPaid = (payment.status ?? "PAGADO") === "PAGADO";
          const isLinkedById = payment.fineId === fine.id;
          const isLinkedByConcept =
            !payment.fineId &&
            payment.studentId === fine.studentId &&
            payment.concept.trim().toLocaleLowerCase() === fineConcept;

          return (
            payment.studentId === studentId &&
            isPaid &&
            (isLinkedById || isLinkedByConcept)
          );
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

      return total + Math.max(fine.amount - paidForThisFine, 0);
    }, 0);

    // También incluye cobros pendientes que no estén representados por una multa.
    const otherPendingPayments = payments
      .filter((payment) => {
        if (
          payment.studentId !== studentId ||
          payment.status !== "PENDIENTE" ||
          payment.fineId
        ) {
          return false;
        }

        const paymentConcept = payment.concept.trim().toLocaleLowerCase();

        return !studentFines.some(
          (fine) =>
            fine.concept.trim().toLocaleLowerCase() === paymentConcept,
        );
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    return finesBalance + otherPendingPayments;
  },
  roleLabel(role: UserRole) {
    return {
      ADMIN: "Administrador",
      TESORERO: "Tesorero",
      ESTUDIANTE: "Estudiante",
    }[role];
  },
};
