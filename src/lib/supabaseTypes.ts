export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          plan: string | null;
          is_admin?: boolean | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          trial_consumed?: boolean | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          plan?: string | null;
          is_admin?: boolean | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          trial_consumed?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          plan?: string | null;
          is_admin?: boolean | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          trial_consumed?: boolean | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
