import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    const msg = "CRITICAL ERROR: Supabase Environment Variables are missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel/Netlify project settings.";
    console.error(msg);
    // Use a small timeout to ensure the alert renders after specific browser events if needed, though direct alert is fine usually.
    setTimeout(() => alert(msg), 500);
}

export const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder_key"
);
