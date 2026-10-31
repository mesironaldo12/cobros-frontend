export interface Payment {
  id: string;
  studentId: string;
  concept: string;
  amount: number;
  date: string;
  registeredBy: string;
  collectionStartDate?: string;

  // Estos campos son opcionales para conservar los pagos ya guardados.
  time?: string;
  status?: "PAGADO" | "PENDIENTE";
  observations?: string;
}

export interface Fine {
  id: string;
  studentId: string;
  concept: string;
  amount: number;
  date: string;
  registeredBy: string;
}