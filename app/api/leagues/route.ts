import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, getUserLeagues } from "@/lib/sleeper";
import { leaguesRatelimit, clientIp, safeLimit } from "@/lib/ratelimit";

// GET /api/leagues?username=someone&season=2025
// No login involved — Sleeper league data is public. This just looks up
// which leagues a username belongs to, so a visitor can pick theirs once.
export async function GET(req: NextRequest) {
  const success = await safeLimit(leaguesRatelimit, clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  }

  const username = req.nextUrl.searchParams.get("username")?.trim();
  const season = req.nextUrl.searchParams.get("season") || String(new Date().getFullYear());

  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  try {
    const user = await getUserByUsername(username);
    if (!user?.user_id) {
      return NextResponse.json({ error: `No Sleeper user found for "${username}"` }, { status: 404 });
    }
    const leagues = await getUserLeagues(user.user_id, season);
    return NextResponse.json({
      user: { user_id: user.user_id, display_name: user.display_name },
      leagues: leagues.map((l) => ({
        league_id: l.league_id,
        name: l.name,
        season: l.season,
        status: l.status,
        total_rosters: l.total_rosters,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
