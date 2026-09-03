import { NextRequest, NextResponse } from "next/server";
import { getLeague } from "@/lib/sleeper";
import { getLeaguePaidRecord, saveAccessGrant } from "@/lib/db";
import { sendAccessEmail } from "@/lib/email";
import { nanoid } from "nanoid";

// POST { secret, leagueId, leagueName, email } -> { token, link }
// Manually grants a free season pass, bypassing Stripe entirely — for
// friends/beta testers before this is opened up publicly. Unlike the rest
// of this app's external-service gating (which fails open when
// unconfigured), this fails closed: no ADMIN_SECRET set means no grants,
// ever, since this bypasses payment.
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const secret = body?.secret as string | undefined;
  const leagueId = body?.leagueId as string | undefined;
  const leagueName = body?.leagueName as string | undefined;
  const email = body?.email as string | undefined;

  if (secret !== adminSecret) {
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
    // Don't fail the grant over a flaky email send — the link is still
    // returned in the response either way.
    console.error("Failed to send admin grant email", err);
  }

  return NextResponse.json({ token, link });
}
