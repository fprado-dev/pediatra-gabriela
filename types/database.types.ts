export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string | null
          cancellation_reason: string | null
          checked_in_at: string | null
          created_at: string | null
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type?: string | null
          cancellation_reason?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string | null
          cancellation_reason?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          audio_duration_seconds: number | null
          audio_format: string | null
          audio_hash: string | null
          audio_size_bytes: number | null
          audio_url: string | null
          chief_complaint: string | null
          cleaned_transcription: string | null
          conduct: string | null
          consultation_date: string | null
          consultation_subtype: string | null
          consultation_type: string
          created_at: string | null
          deleted_at: string | null
          development_notes: string | null
          diagnosis: string | null
          doctor_id: string
          edit_history: Json | null
          edited_by_doctor: boolean | null
          family_history: string | null
          head_circumference_cm: number | null
          height_cm: number | null
          history: string | null
          hma: string | null
          id: string
          notes: string | null
          original_ai_version: Json | null
          original_audio_url: string | null
          patient_id: string
          physical_exam: string | null
          plan: string | null
          prenatal_perinatal_history: string | null
          prescription: string | null
          prescription_data: Json | null
          previous_consultations_summary: Json | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_steps: Json | null
          raw_transcription: string | null
          reused_from_consultation_id: string | null
          status: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_format?: string | null
          audio_hash?: string | null
          audio_size_bytes?: number | null
          audio_url?: string | null
          chief_complaint?: string | null
          cleaned_transcription?: string | null
          conduct?: string | null
          consultation_date?: string | null
          consultation_subtype?: string | null
          consultation_type: string
          created_at?: string | null
          deleted_at?: string | null
          development_notes?: string | null
          diagnosis?: string | null
          doctor_id: string
          edit_history?: Json | null
          edited_by_doctor?: boolean | null
          family_history?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          history?: string | null
          hma?: string | null
          id?: string
          notes?: string | null
          original_ai_version?: Json | null
          original_audio_url?: string | null
          patient_id: string
          physical_exam?: string | null
          plan?: string | null
          prenatal_perinatal_history?: string | null
          prescription?: string | null
          prescription_data?: Json | null
          previous_consultations_summary?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_steps?: Json | null
          raw_transcription?: string | null
          reused_from_consultation_id?: string | null
          status?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_format?: string | null
          audio_hash?: string | null
          audio_size_bytes?: number | null
          audio_url?: string | null
          chief_complaint?: string | null
          cleaned_transcription?: string | null
          conduct?: string | null
          consultation_date?: string | null
          consultation_subtype?: string | null
          consultation_type?: string
          created_at?: string | null
          deleted_at?: string | null
          development_notes?: string | null
          diagnosis?: string | null
          doctor_id?: string
          edit_history?: Json | null
          edited_by_doctor?: boolean | null
          family_history?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          history?: string | null
          hma?: string | null
          id?: string
          notes?: string | null
          original_ai_version?: Json | null
          original_audio_url?: string | null
          patient_id?: string
          physical_exam?: string | null
          plan?: string | null
          prenatal_perinatal_history?: string | null
          prescription?: string | null
          prescription_data?: Json | null
          previous_consultations_summary?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_steps?: Json | null
          raw_transcription?: string | null
          reused_from_consultation_id?: string | null
          status?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_reused_from_consultation_id_fkey"
            columns: ["reused_from_consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      growth_alerts: {
        Row: {
          ai_insights: string | null
          alert_type: string
          consultation_id: string | null
          created_at: string
          current_measurement: Json | null
          data: Json | null
          description: string | null
          dismissed_at: string | null
          doctor_id: string | null
          id: string
          patient_id: string
          percentile_change: number | null
          previous_measurement: Json | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seen_at: string | null
          severity: string
          status: string
          suggested_actions: string[] | null
          title: string
        }
        Insert: {
          ai_insights?: string | null
          alert_type: string
          consultation_id?: string | null
          created_at?: string
          current_measurement?: Json | null
          data?: Json | null
          description?: string | null
          dismissed_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id: string
          percentile_change?: number | null
          previous_measurement?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seen_at?: string | null
          severity?: string
          status?: string
          suggested_actions?: string[] | null
          title: string
        }
        Update: {
          ai_insights?: string | null
          alert_type?: string
          consultation_id?: string | null
          created_at?: string
          current_measurement?: Json | null
          data?: Json | null
          description?: string | null
          dismissed_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string
          percentile_change?: number | null
          previous_measurement?: Json | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seen_at?: string | null
          severity?: string
          status?: string
          suggested_actions?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_alerts_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_alerts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_certificates: {
        Row: {
          certificate_data: Json
          certificate_type: string
          consultation_id: string | null
          created_at: string | null
          doctor_id: string
          generated_at: string | null
          id: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          certificate_data: Json
          certificate_type: string
          consultation_id?: string | null
          created_at?: string | null
          doctor_id: string
          generated_at?: string | null
          id?: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          certificate_data?: Json
          certificate_type?: string
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string
          generated_at?: string | null
          id?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_certificates_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_certificates_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vaccines: {
        Row: {
          applied_at: string | null
          batch_number: string | null
          created_at: string | null
          id: string
          notes: string | null
          patient_id: string
          status: string
          updated_at: string | null
          vaccine_code: string
        }
        Insert: {
          applied_at?: string | null
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          updated_at?: string | null
          vaccine_code: string
        }
        Update: {
          applied_at?: string | null
          batch_number?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          updated_at?: string | null
          vaccine_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vaccines_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vaccines_vaccine_code_fkey"
            columns: ["vaccine_code"]
            isOneToOne: false
            referencedRelation: "vaccine_reference"
            referencedColumns: ["code"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string | null
          blood_type: string | null
          cpf: string
          created_at: string | null
          current_medications: string | null
          date_of_birth: string
          deleted_at: string | null
          doctor_id: string
          email: string | null
          full_name: string
          head_circumference_cm: number | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          medical_history: string | null
          notes: string | null
          phone: string
          responsible_cpf: string | null
          responsible_name: string | null
          sex: string | null
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          cpf: string
          created_at?: string | null
          current_medications?: string | null
          date_of_birth: string
          deleted_at?: string | null
          doctor_id: string
          email?: string | null
          full_name: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          notes?: string | null
          phone: string
          responsible_cpf?: string | null
          responsible_name?: string | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_type?: string | null
          cpf?: string
          created_at?: string | null
          current_medications?: string | null
          date_of_birth?: string
          deleted_at?: string | null
          doctor_id?: string
          email?: string | null
          full_name?: string
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          medical_history?: string | null
          notes?: string | null
          phone?: string
          responsible_cpf?: string | null
          responsible_name?: string | null
          sex?: string | null
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_exam_templates: {
        Row: {
          age_group: string
          created_at: string | null
          doctor_id: string | null
          id: string
          is_default: boolean | null
          sex: string
          system_label: string
          system_name: string
          template_text: string
          updated_at: string | null
        }
        Insert: {
          age_group: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_default?: boolean | null
          sex: string
          system_label: string
          system_name: string
          template_text: string
          updated_at?: string | null
        }
        Update: {
          age_group?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_default?: boolean | null
          sex?: string
          system_label?: string
          system_name?: string
          template_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prescription_templates: {
        Row: {
          alert_signs: string | null
          category: string | null
          created_at: string | null
          description: string | null
          doctor_id: string
          id: string
          instructions: string | null
          is_favorite: boolean | null
          is_open_template: boolean
          medications: Json | null
          name: string
          notes: string | null
          orientations: string | null
          prevention: string | null
          updated_at: string | null
          usage_count: number | null
          warnings: string | null
        }
        Insert: {
          alert_signs?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id: string
          id?: string
          instructions?: string | null
          is_favorite?: boolean | null
          is_open_template?: boolean
          medications?: Json | null
          name: string
          notes?: string | null
          orientations?: string | null
          prevention?: string | null
          updated_at?: string | null
          usage_count?: number | null
          warnings?: string | null
        }
        Update: {
          alert_signs?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string
          id?: string
          instructions?: string | null
          is_favorite?: boolean | null
          is_open_template?: boolean
          medications?: Json | null
          name?: string
          notes?: string | null
          orientations?: string | null
          prevention?: string | null
          updated_at?: string | null
          usage_count?: number | null
          warnings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_templates_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          crm: string
          email: string
          full_name: string
          id: string
          phone: string
          specialty: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          crm: string
          email: string
          full_name: string
          id: string
          phone: string
          specialty: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          crm?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          specialty?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          created_at: string | null
          doctor_id: string
          end_datetime: string
          id: string
          reason: string | null
          start_datetime: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          end_datetime: string
          id?: string
          reason?: string | null
          start_datetime: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          end_datetime?: string
          id?: string
          reason?: string | null
          start_datetime?: string
        }
        Relationships: []
      }
      vaccine_reference: {
        Row: {
          age_group: string
          age_months_max: number | null
          age_months_min: number
          category: string | null
          code: string
          display_order: number | null
          dose_label: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          type: string
        }
        Insert: {
          age_group: string
          age_months_max?: number | null
          age_months_min: number
          category?: string | null
          code: string
          display_order?: number | null
          dose_label: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          type: string
        }
        Update: {
          age_group?: string
          age_months_max?: number | null
          age_months_min?: number
          category?: string | null
          code?: string
          display_order?: number | null
          dose_label?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          type?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      soft_delete_patient: { Args: { patient_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
