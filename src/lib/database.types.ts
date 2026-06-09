export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "admin" | "aanvoerder" | "player";
          shirt_number: number | null;
          position: string | null;
          photo_url: string | null;
          onboarded: boolean;
          season_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["players"]["Row"], "created_at" | "season_id"> & {
          season_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["seasons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["seasons"]["Insert"]>;
        Relationships: [];
      };
      trainings: {
        Row: {
          id: string;
          season_id: string;
          date: string;
          time: string;
          location: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trainings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["trainings"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          season_id: string;
          date: string;
          time: string;
          opponent: string;
          home_away: "thuis" | "uit";
          location: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["matches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      rsvps: {
        Row: {
          id: string;
          player_id: string;
          event_id: string;
          event_type: "training" | "match";
          status: "aanwezig" | "afwezig" | "misschien";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rsvps"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["rsvps"]["Insert"]>;
        Relationships: [];
      };
      fines: {
        Row: {
          id: string;
          player_id: string;
          player_name: string;
          category: string;
          amount: number;
          reason: string | null;
          match_id: string | null;
          training_id: string | null;
          added_by: string;
          added_by_name: string;
          created_at: string;
          paid: boolean;
          paid_at: string | null;
          paid_received_by: string | null;
          is_correction: boolean;
          correction_of: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["fines"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["fines"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          emoji: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["announcements"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
      announcement_reactions: {
        Row: {
          id: string;
          announcement_id: string;
          player_id: string;
          emoji: string;
        };
        Insert: Omit<Database["public"]["Tables"]["announcement_reactions"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["announcement_reactions"]["Insert"]>;
        Relationships: [];
      };
      rotation_cycles: {
        Row: {
          id: string;
          season_id: string;
          order: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rotation_cycles"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["rotation_cycles"]["Insert"]>;
        Relationships: [];
      };
      rotation_swaps: {
        Row: {
          id: string;
          cycle_id: string;
          requested_by: string;
          requested_with: string;
          slot_a: number;
          slot_b: number;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["rotation_swaps"]["Row"], "id" | "created_at" | "resolved_at"> & {
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rotation_swaps"]["Insert"]>;
        Relationships: [];
      };
      match_stats: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          goals: number;
          assists: number;
          yellow_cards: number;
          red_cards: number;
        };
        Insert: Omit<Database["public"]["Tables"]["match_stats"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["match_stats"]["Insert"]>;
        Relationships: [];
      };
      motm_votes: {
        Row: {
          id: string;
          match_id: string;
          voter_id: string;
          voted_for_id: string;
        };
        Insert: Omit<Database["public"]["Tables"]["motm_votes"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["motm_votes"]["Insert"]>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          code: string;
          created_by: string | null;
          used_by: string | null;
          used_at: string | null;
          active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["invites"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
        Relationships: [];
      };
      lineups: {
        Row: {
          id: string;
          match_id: string;
          formation: string;
          positions: { player_id: string; x: number; y: number; label: string }[];
          substitutes: string[];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lineups"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["lineups"]["Insert"]>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          season_id: string | null;
          title: string;
          date: string;
          time: string | null;
          location: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activities"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      email_exists: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
