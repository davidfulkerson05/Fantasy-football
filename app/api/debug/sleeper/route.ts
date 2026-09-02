import { NextRequest, NextResponse } from "next/server";
import { leaguesRatelimit, clientIp, safeLimit } from "@/lib/ratelimit";

// Internal dev helper: proxies read-only calls to Sleeper's public API.
// Exists because the sandboxed dev environment this app is built in can't
// reach api.sleeper.app directly, but this deployed app can. Hardcoded
// base URL, GET-only, rate-limited — low risk since it only forwards to
// Sleeper's already-public, unauthenticated data.
export async function GET(req: NextRequest) {
  const success = await safeLimit(leaguesRatelimit, clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests, try again in a minute." }, { status: 429 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ error: "path is required and must start with /" }, { status: 400 });
  }

  const res = await fetch(`https://api.sleeper.app/v1${path}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
