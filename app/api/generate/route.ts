import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeague, getRosters, getLeagueUsers, getMatchups } from "@/lib/sleeper";
import { buildWeekFacts } from "@/lib/facts";
import { GUILLOTINE_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/voice";
import { buildRedraftWeekFacts } from "@/lib/redraftFacts";
import { REDRAFT_SYSTEM_PROMPT, buildRedraftUserPrompt } from "@/lib/redraftVoice";
import { buildTeamHistory, relevantHistory } from "@/lib/history";
import { getTokenRecord, getCachedWeek, setCachedWeek } from "@/lib/db";

// GET /api/generate?token=...&week=1[&regenerate=1]
// The token (from a paid season pass) resolves the league server-side —
// nothing league-identifying is taken from the client, so there's nothing
// to spoof. Results are cached per league+week so repeat clicks on the
// same week don't re-spend Claude credits; ?regenerate=1 bypasses that.
//
// League format is auto-detected from Sleeper's own league settings
// (type 3 = elimination/guillotine) so one endpoint serves both voices.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const weekParam = req.nextUrl.searchParams.get("week");
  const week = weekParam ? parseInt(weekParam, 10) : NaN;
  const regenerate = req.nextUrl.searchParams.get("regenerate") === "1";

  if (!token || !Number.isFinite(week) || week < 1) {
    return NextResponse.json({ error: "token and a valid week are required" }, { status: 400 });
  }

  const grant = await getTokenRecord(token);
  if (!grant) {
    return NextResponse.json({ error: "Invalid or expired access link." }, { status: 403 });
  }
  const { leagueId } = grant;

  try {
    if (!regenerate) {
      const cached = await getCachedWeek(leagueId, week);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const [league, rosters, users, matchups] = await Promise.all([
      getLeague(leagueId),
      getRosters(leagueId),
      getLeagueUsers(leagueId),
      getMatchups(leagueId, week),
    ]);

    const isElimination = league.settings?.type === 3;

    const { systemPrompt, userPrompt, facts } = isElimination
      ? (() => {
          const f = buildWeekFacts(week, rosters, users, matchups);
          return { systemPrompt: GUILLOTINE_SYSTEM_PROMPT, userPrompt: buildUserPrompt(f), facts: f };
        })()
      : await (async () => {
          const f = buildRedraftWeekFacts(week, rosters, users, matchups);
          const history = await buildTeamHistory(leagueId, week, 6);
          const relevant = relevantHistory(f, history);
          return { systemPrompt: REDRAFT_SYSTEM_PROMPT, userPrompt: buildRedraftUserPrompt(f, relevant), facts: f };
        })();

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const result = { facts, message: text };
    await setCachedWeek(leagueId, week, result);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
