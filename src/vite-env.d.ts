// Types for our own variables in import.meta.env.
//
// Vite types every unknown import.meta.env key as `any`. Declaring ours here
// (this is called "declaration merging": it adds to Vite's ImportMetaEnv
// interface) gives them a real type. They are optional because .env.local
// may not exist, and the code must check for that.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
