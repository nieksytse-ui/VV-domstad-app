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
        Insert: Omit<Database["public"]["Tables"]["players"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
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
      };
      matches: {
        Row: {
          id: string;
          season_id: string;
          date: string;
          opponent: string;
          home_away: "thuis" | "uit";
          location: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["matches"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["rotation_swaps"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["rotation_swaps"]["Insert"]>;
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
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
