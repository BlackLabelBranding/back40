import { createClient } from "@supabase/supabase-js";

// ✅ Use the real API URL (not the dashboard URL)
export const SUPABASE_URL = "https://kilmhwlsqgjxjhvsweqb.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbG1od2xzcWdqeGpodnN3ZXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MTM1NjAsImV4cCI6MjA3NzE4OTU2MH0.RC7mNIg9pyJOegCdKwS8U_6Iu3u0zHpo_l8zp4RBQs8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
