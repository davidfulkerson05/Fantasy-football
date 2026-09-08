import { NextRequest, NextResponse } from "next/server";
import { getLeaguePaidRecord, getTokenRecord } from "@/lib/db";
import { sendAccessEmail } from "@/lib/email";
import { resendLinkRatelimit, clientIp, safeLimit } from "@/lib/ratelimit";

// POST { leagueId, email } -> { ok: true } always, regardless of whether a
// match was actually found. This is self-service link recovery for anyone
// who lost their access link — deliberately doesn't reveal whether a given
// league/email combination has a season pass, so it can't be used to
// enumerate purchasers. If leagueId has a paid record and email matches
// (case-insensitive) the one on file, the access email is resent.
export async function POST(req: NextRequest) {
  const success = await safeLimit(resendLinkRatelimit, clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests, try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const leagueId = body?.leagueId as string | undefined;
  const email = body?.email as string | undefined;

  if (!leagueId || !email) {
    return NextResponse.json({ error: "leagueId and email are required" }, { status: 400 });
  }

  const paid = await getLeaguePaidRecord(leagueId);
  if (paid && paid.email.trim().toLowerCase() === email.trim().toLowerCase()) {
    const grant = await getTokenRecord(paid.token);
    if (grant) {
      const origin = new URL(req.url).origin;
      const link = `${origin}/app?token=${paid.token}`;
      try {
        await sendAccessEmail(paid.email, grant.leagueName, link, grant.isElimination);
      } catch (err) {
        console.error("Failed to resend access email", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
