// Hand-written forward-declaration of the tables the app currently reads
// from, matching supabase/migrations/20260814120000_init_schema.sql.
// Replace this file by running:
//   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
// once that migration has actually been run against your Supabase project.
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
        };
      };
      doctors: {
        Row: {
          id: string;
          specialty: string;
          bio: string | null;
          photo_url: string | null;
          is_active: boolean;
        };
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
        };
      };
    };
  };
};
