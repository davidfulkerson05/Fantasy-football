import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getLeaguePaidRecord } from "@/lib/db";

// GET ?session_id=... -> polled by the success page. Returns ready:false
// until the checkout.session.completed webhook has processed.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const leagueId = session.metadata?.leagueId;
  const leagueName = session.metadata?.leagueName;
  if (!leagueId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const paid = await getLeaguePaidRecord(leagueId);
  if (!paid) {
    return NextResponse.json({ ready: false });
  }

  return NextResponse.json({ ready: true, token: paid.token, leagueName });
}
