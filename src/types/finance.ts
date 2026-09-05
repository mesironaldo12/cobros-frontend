export interface Payment {
  id: string;
  studentId: string;
  concept: string;
  amount: number;
  date: string;
  registeredBy: string;
}

export interface Fine {
  id: string;
  studentId: string;
  concept: string;
  amount: number;
  date: string;
  registeredBy: string;
}
