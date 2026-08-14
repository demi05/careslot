// Hand-written forward-declaration of the tables the app currently reads
// from. Replace this file by running:
//   npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
// once the full schema (users, appointments, doctor_schedules,
// notifications, medications) has been created and migrated in Supabase.
export type Database = {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string;
          full_name: string;
          specialty: string;
          photo_url: string | null;
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
        };
      };
    };
  };
};
