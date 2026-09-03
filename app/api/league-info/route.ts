import { NextRequest, NextResponse } from "next/server";
import { getTokenRecord } from "@/lib/db";

// GET ?token=... -> { leagueName, isElimination }
// Lets the generator page know which voice to label itself with (League
// Update vs The Guillotine) immediately on load, without waiting on a
// generate call — this also covers opening the emailed link directly,
// which never passes through the success page's localStorage write.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const grant = await getTokenRecord(token);
  if (!grant) {
    return NextResponse.json({ error: "Invalid or expired access link." }, { status: 403 });
  }

  return NextResponse.json({ leagueName: grant.leagueName, isElimination: grant.isElimination });
}
