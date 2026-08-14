// Hand-written forward-declaration of the tables/functions the app reads
// from, matching the SQL files in supabase/migrations/. Replace this file
// by running:
//   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
// once those migrations have actually been run against your Supabase project.
//
// Every table below declares Row/Insert/Update/Relationships because
// @supabase/postgrest-js's GenericTable requires all four — omitting any
// of them silently collapses every query on that table to `never`. This
// file has no Relationships entries, so embedded (joined) selects like
// `doctors(profiles(full_name))` aren't type-checked precisely; call
// sites cast those results explicitly instead.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: "patient" | "doctor" | "front-desk" | "admin";
          avatar_url: string | null;
          sms_reminders: boolean;
          email_reminders: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: "patient" | "doctor" | "front-desk" | "admin";
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          sms_reminders?: boolean;
          email_reminders?: boolean;
        };
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          specialty: string;
          bio: string | null;
          photo_url: string | null;
          is_active: boolean;
        };
        Insert: {
          id: string;
          specialty: string;
          bio?: string | null;
          photo_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          specialty?: string;
          bio?: string | null;
          photo_url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      doctor_schedules: {
        Row: {
          id: string;
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          is_active: boolean;
        };
        Insert: {
          doctor_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration_minutes?: number;
          is_active?: boolean;
        };
        Update: {
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          slot_duration_minutes?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          appointment_date: string;
          appointment_time: string;
          status: "pending" | "confirmed" | "cancelled" | "no-show";
          reason: string | null;
          created_at: string;
        };
        Insert: {
          patient_id: string;
          doctor_id: string;
          appointment_date: string;
          appointment_time: string;
          reason?: string | null;
        };
        Update: {
          appointment_date?: string;
          appointment_time?: string;
          status?: "pending" | "confirmed" | "cancelled" | "no-show";
          reason?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          appointment_id: string;
          channel: "sms" | "email";
          recipient: string;
          delivery_status: "pending" | "sent" | "failed";
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          appointment_id: string;
          channel: "sms" | "email";
          recipient: string;
          delivery_status?: "pending" | "sent" | "failed";
        };
        Update: {
          delivery_status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          sent_at?: string | null;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          patient_id: string;
          appointment_id: string | null;
          medication_name: string;
          dosage: string | null;
          status: "pending" | "collected";
          logged_by: string;
          logged_at: string;
          collected_at: string | null;
        };
        Insert: {
          patient_id: string;
          appointment_id?: string | null;
          medication_name: string;
          dosage?: string | null;
          logged_by: string;
        };
        Update: {
          status?: "pending" | "collected";
          collected_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_available_slots: {
        Args: { p_doctor_id: string; p_date: string };
        Returns: { slot_time: string }[];
      };
    };
  };
};
