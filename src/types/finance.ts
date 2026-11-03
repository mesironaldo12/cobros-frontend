export interface Payment {
  id: string;
  studentId: string;
  concept: string;
  amount: number;
  date: string;
  registeredBy: string;
  fineId?: string;
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
  status?: "PENDIENTE" | "PAGADA";
  paidDate?: string;
  reason?: string;
}