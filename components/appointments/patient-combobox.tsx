"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { calculateAge } from "@/lib/utils/date-helpers";

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
}

interface PatientComboboxProps {
  value?: string;
  onValueChange: (patientId: string, patientName: string) => void;
  placeholder?: string;
}

export function PatientCombobox({
  value,
  onValueChange,
  placeholder = "Buscar paciente...",
}: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedPatient = patients.find((p) => p.id === value);

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("patients")
        .select("id, full_name, date_of_birth")
        .eq("is_active", true)
        .order("full_name");

      if (searchTerm) {
        query = query.ilike("full_name", `%${searchTerm}%`);
      }

      const { data } = await query.limit(50);
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11"
        >
          {selectedPatient ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{selectedPatient.full_name}</span>
              <span className="text-xs text-muted-foreground">
                • {calculateAge(selectedPatient.date_of_birth)}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false} className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border">
          <CommandInput
            placeholder="Digite o nome do paciente..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="focus:ring-0 focus:outline-none"
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <p className="text-sm text-muted-foreground">Buscando...</p>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium">Nenhum paciente encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verifique o nome ou cadastre um novo paciente
                  </p>
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    onValueChange(patient.id, patient.full_name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">{patient.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {calculateAge(patient.date_of_birth)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
