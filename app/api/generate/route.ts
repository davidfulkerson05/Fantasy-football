import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeague, getRosters, getLeagueUsers, getMatchups, getDrafts, getDraftPicks } from "@/lib/sleeper";
import { buildWeekFacts } from "@/lib/facts";
import { GUILLOTINE_SYSTEM_PROMPT, buildUserPrompt, GUILLOTINE_DRAFT_SYSTEM_PROMPT, buildDraftUserPrompt } from "@/lib/voice";
import { buildRedraftWeekFacts } from "@/lib/redraftFacts";
import {
  REDRAFT_SYSTEM_PROMPT,
  buildRedraftUserPrompt,
  REDRAFT_DRAFT_SYSTEM_PROMPT,
  buildRedraftDraftUserPrompt,
} from "@/lib/redraftVoice";
import { buildDraftFacts } from "@/lib/draftFacts";
import { buildTeamHistory, relevantHistory } from "@/lib/history";
import { getTokenRecord, getCachedWeek, setCachedWeek } from "@/lib/db";

// GET /api/generate?token=...&week=1[&regenerate=1]
// GET /api/generate?token=...&draft=1[&regenerate=1]
// The token (from a paid season pass) resolves the league server-side —
// nothing league-identifying is taken from the client, so there's nothing
// to spoof. Results are cached per league+week so repeat clicks on the
// same week don't re-spend Claude credits; ?regenerate=1 bypasses that.
// draft=1 requests the post-draft message instead of a weekly recap —
// there's no score to write about until Week 1 finishes, so this is what
// buyers get right after purchasing pre-season. Cached under week 0.
//
// League format is auto-detected from Sleeper's own league settings
// (type 3 = elimination/guillotine) so one endpoint serves both voices.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const draftMode = req.nextUrl.searchParams.get("draft") === "1";
  const weekParam = req.nextUrl.searchParams.get("week");
  const week = weekParam ? parseInt(weekParam, 10) : NaN;
  const regenerate = req.nextUrl.searchParams.get("regenerate") === "1";

  if (!token || (!draftMode && (!Number.isFinite(week) || week < 1))) {
    return NextResponse.json({ error: "token and a valid week are required" }, { status: 400 });
  }

  const grant = await getTokenRecord(token);
  if (!grant) {
    return NextResponse.json({ error: "Invalid or expired access link." }, { status: 403 });
  }
  const { leagueId } = grant;
  const cacheWeek = draftMode ? 0 : week;

  try {
    if (!regenerate) {
      const cached = await getCachedWeek(leagueId, cacheWeek);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const [league, rosters, users] = await Promise.all([
      getLeague(leagueId),
      getRosters(leagueId),
      getLeagueUsers(leagueId),
    ]);

    const isElimination = league.settings?.type === 3;

    let systemPrompt: string;
    let userPrompt: string;
    let facts: unknown;

    if (draftMode) {
      const drafts = await getDrafts(leagueId);
      const draft = drafts.find((d) => d.status === "complete") ?? drafts[0];
      const picks = draft ? await getDraftPicks(draft.draft_id) : [];
      if (!picks.length) {
        return NextResponse.json(
          { error: "This league hasn't drafted yet — check back once your draft is done." },
          { status: 400 }
        );
      }
      const f = buildDraftFacts(rosters, users, picks);
      facts = f;
      systemPrompt = isElimination ? GUILLOTINE_DRAFT_SYSTEM_PROMPT : REDRAFT_DRAFT_SYSTEM_PROMPT;
      userPrompt = isElimination ? buildDraftUserPrompt(f) : buildRedraftDraftUserPrompt(f);
    } else {
      const matchups = await getMatchups(leagueId, week);
      ({ systemPrompt, userPrompt, facts } = isElimination
        ? (() => {
            const f = buildWeekFacts(week, rosters, users, matchups);
            return { systemPrompt: GUILLOTINE_SYSTEM_PROMPT, userPrompt: buildUserPrompt(f), facts: f };
          })()
        : await (async () => {
            const f = buildRedraftWeekFacts(week, rosters, users, matchups);
            const history = await buildTeamHistory(leagueId, week, 6);
            const relevant = relevantHistory(f, history);
            return {
              systemPrompt: REDRAFT_SYSTEM_PROMPT,
              userPrompt: buildRedraftUserPrompt(f, relevant),
              facts: f,
            };
          })());
    }

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
    await setCachedWeek(leagueId, cacheWeek, result);

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
