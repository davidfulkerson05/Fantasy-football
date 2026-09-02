import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRosters, getLeagueUsers, getMatchups } from "@/lib/sleeper";
import { buildWeekFacts } from "@/lib/facts";
import { GUILLOTINE_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/voice";

// GET /api/generate?league_id=...&week=1
// Fetches that week's Sleeper data, computes the storyline facts, and asks
// Claude to write the message in the Guillotine's voice.
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("league_id");
  const weekParam = req.nextUrl.searchParams.get("week");
  const week = weekParam ? parseInt(weekParam, 10) : NaN;

  if (!leagueId || !Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "league_id and a valid week are required" }, { status: 400 });
  }

  try {
    const [rosters, users, matchups] = await Promise.all([
      getRosters(leagueId),
      getLeagueUsers(leagueId),
      getMatchups(leagueId, week),
    ]);

    const facts = buildWeekFacts(week, rosters, users, matchups);

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system: GUILLOTINE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(facts) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ facts, message: text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
