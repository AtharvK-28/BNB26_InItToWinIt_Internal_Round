import { claudeEnabled, MODEL } from "@/lib/ai/claude";

export async function GET() {
  return Response.json({ claude: claudeEnabled(), model: claudeEnabled() ? MODEL : "local engine" });
}
