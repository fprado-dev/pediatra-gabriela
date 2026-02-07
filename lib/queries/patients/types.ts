import { Database } from "@/types/database.types";

type PatientsRow = Database['public']['Tables']['patients']['Row'];

// Tipo customizado para appointments com paciente incluído
export interface ActivePatients {
  totalActivePatients: number;
}