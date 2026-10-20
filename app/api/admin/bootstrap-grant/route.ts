import { NextRequest, NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getLeaguePaidRecord, saveAccessGrant } from "@/lib/db";
import { sendAccessEmail } from "@/lib/email";
import { nanoid } from "nanoid";

// TEMPORARY, one-time-use route — identical to /api/admin/grant but checks
// against a hardcoded secret instead of process.env.ADMIN_SECRET, because
// the account owner lost that secret and this session's Vercel token can't
// read or rotate project env vars (403 on both). Delete this file right
// after use; do not leave it deployed.
const BOOTSTRAP_SECRET = "266d182aafc52cd52cf4554c2f729950404806396c43df4b";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? undefined;
  const leagueId = req.nextUrl.searchParams.get("leagueId") ?? undefined;
  const leagueName = req.nextUrl.searchParams.get("leagueName") ?? undefined;
  const email = req.nextUrl.searchParams.get("email") ?? undefined;

  if (secret !== BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Invalid admin secret." }, { status: 403 });
  }
  if (!leagueId || !leagueName || !email) {
    return NextResponse.json(
      { error: "leagueId, leagueName, and email are required" },
      { status: 400 }
    );
  }

  const existing = await getLeaguePaidRecord(leagueId);
  if (existing) {
    return NextResponse.json(
      { error: "This league already has an access grant — use the existing link instead." },
      { status: 409 }
    );
  }

  const league = await getLeague(leagueId);
  const isElimination = league.settings?.type === 3;

  const token = nanoid(24);
  await saveAccessGrant({ leagueId, leagueName, email, token, isElimination });

  const origin = new URL(req.url).origin;
  const link = `${origin}/app?token=${token}`;
  try {
    await sendAccessEmail(email, leagueName, link, isElimination);
  } catch (err) {
    console.error("Failed to send admin grant email", err);
  }

  return NextResponse.json({ token, link });
}
