// TypeScript types for the tables in supabase/migrations/.
//
// Supabase can generate this file with its CLI (`supabase gen types`), but we
// don't use the CLI, so it is written by hand in the same shape. Passing it to
// createClient<Database>() makes supabase-js check table names, column names
// and row types at compile time. Without it, every row would be typed `any`.
//
// If a column changes in the SQL, change it here too.

// Any value that can be stored in a jsonb column. This is the same definition
// the Supabase CLI generates. Validating the actual shape of a save is done
// later (with Zod), so this layer only promises "valid JSON".
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// saves and settings have the same columns, so they share one table type.
// Row is what a select returns. Insert and Update are what we may send.
// Timestamps travel as ISO strings (e.g. "2026-11-04T10:00:00.000Z").
type PlayerRecordTable = {
  Row: {
    user_id: string
    data: Json
    updated_at: string
  }
  Insert: {
    user_id: string
    data: Json
    updated_at: string
  }
  Update: {
    user_id?: string
    data?: Json
    updated_at?: string
  }
  // No foreign keys between our own tables (auth.users is in another schema).
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      saves: PlayerRecordTable
      settings: PlayerRecordTable
    }
    // `{ [_ in never]: never }` is an empty object type: we have no views or
    // database functions, but supabase-js expects these keys to exist.
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
