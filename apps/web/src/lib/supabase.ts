import { createClient } from "@supabase/supabase-js";

export const cloudMode = process.env.NEXT_PUBLIC_APP_MODE === "cloud";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  cloudMode && url && publicKey ? createClient(url, publicKey) : null;

export async function accessToken() {
  if (!cloudMode) return null;
  if (!supabase)
    throw new Error("The workspace connection is not configured yet.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session)
    throw new Error("Your session has ended. Sign in to keep working.");
  return data.session.access_token;
}
