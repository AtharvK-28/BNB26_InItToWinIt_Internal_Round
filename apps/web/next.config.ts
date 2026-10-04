import type { NextConfig } from "next";

// A hosted build must not publish the anonymous local workspace.
if (process.env.VERCEL) {
  if (
    process.env.NEXT_PUBLIC_APP_MODE !== "cloud" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !process.env.NEXT_PUBLIC_API_URL?.startsWith("https://")
  ) {
    throw new Error(
      "Configure cloud mode, Supabase and the HTTPS API URL before deploying.",
    );
  }
}

const config: NextConfig = { devIndicators: false };
export default config;
