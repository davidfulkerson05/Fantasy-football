// Cross-week "storyline memory" for both voices, built entirely on top of
// the per-league weekly cache that already exists in db.ts — no new
// storage, just reading a few extra keys back. Tracks notable events per
// team over a rolling window so the model can make a true callback
// ("blown out again", "survived by a hair last week too") instead of
// inventing one.
import { getCachedWeek, type CachedWeek } from "./db";
import type { RedraftWeekFacts } from "./redraftFacts";
import type { WeekFacts } from "./facts";

export type HistoryEventType = "blown_out" | "disaster_start" | "close_loss" | "top_scorer" | "close_call";

export interface HistoryEvent {
  week: number;
  type: HistoryEventType;
  // The real number behind the event, when there is one: margin for
  // blown_out/close_loss/close_call, points for top_scorer/disaster_start.
  // Lets a genuine running-total callback ("two weeks running, 5.36 total
  // points") be grounded in real numbers instead of just naming the pattern.
  value?: number;
}

export type TeamHistory = Record<string, HistoryEvent[]>;

type AnyWeekFacts = RedraftWeekFacts | WeekFacts;

function isRedraftFacts(facts: unknown): facts is RedraftWeekFacts {
  return !!facts && typeof facts === "object" && "closestGame" in facts && "biggestBlowout" in facts;
}

function isGuillotineFacts(facts: unknown): facts is WeekFacts {
  return !!facts && typeof facts === "object" && "chopped" in facts && "next_closest_survivor" in facts;
}

// Scans the previous `windowSize` weeks (default 6) of cached facts for
// this league and returns a map of team name -> notable events. Only reads
// weeks that were actually cached (i.e. already generated) — a week no one
// has generated yet simply contributes nothing.
export async function buildTeamHistory(
  leagueId: string,
  uptoWeek: number,
  windowSize = 6
): Promise<TeamHistory> {
  const start = Math.max(1, uptoWeek - windowSize);
  const history: TeamHistory = {};

  const weeks = await Promise.all(
    Array.from({ length: uptoWeek - start }, (_, i) => start + i).map(
      async (w): Promise<[number, CachedWeek | null]> => [w, await getCachedWeek(leagueId, w)]
    )
  );

  for (const [w, cached] of weeks) {
    if (!cached) continue;
    const facts = cached.facts;

    const add = (team: string, type: HistoryEventType, value?: number) => {
      (history[team] ??= []).push({ week: w, type, value });
    };

    if (isRedraftFacts(facts)) {
      if (facts.biggestBlowout) add(facts.biggestBlowout.loser, "blown_out", facts.biggestBlowout.margin);
      if (facts.closestGame) add(facts.closestGame.loser, "close_loss", facts.closestGame.margin);
      if (facts.topScorer) add(facts.topScorer.team, "top_scorer", facts.topScorer.points);
      if (facts.disasterStart) add(facts.disasterStart.team, "disaster_start", facts.disasterStart.points);
    } else if (isGuillotineFacts(facts)) {
      // The chopped team is gone from future weeks, so there's no future
      // callback to make about them — only survivors' history matters here.
      if (facts.next_closest_survivor?.close_call) {
        add(facts.next_closest_survivor.team, "close_call", facts.next_closest_survivor.margin_over_chopped);
      }
      if (facts.top_scorer) add(facts.top_scorer.team, "top_scorer", facts.top_scorer.points);
      if (facts.disaster_start) add(facts.disaster_start.team, "disaster_start", facts.disaster_start.points);
    }
  }

  return history;
}

// Narrows a full team-history map down to only the teams actually featured
// in this week's facts, so the prompt carries just enough context for a
// real callback and nothing to hallucinate from.
export function relevantHistory(facts: AnyWeekFacts, history: TeamHistory): TeamHistory {
  const featured = new Set<string>();

  if (isRedraftFacts(facts)) {
    if (facts.closestGame) {
      featured.add(facts.closestGame.winner);
      featured.add(facts.closestGame.loser);
    }
    if (facts.biggestBlowout) {
      featured.add(facts.biggestBlowout.winner);
      featured.add(facts.biggestBlowout.loser);
    }
    if (facts.topScorer) featured.add(facts.topScorer.team);
    if (facts.disasterStart) featured.add(facts.disasterStart.team);
  } else if (isGuillotineFacts(facts)) {
    if (facts.next_closest_survivor) featured.add(facts.next_closest_survivor.team);
    if (facts.top_scorer) featured.add(facts.top_scorer.team);
    if (facts.disaster_start) featured.add(facts.disaster_start.team);
  }

  const relevant: TeamHistory = {};
  for (const team of featured) {
    if (history[team]?.length) relevant[team] = history[team];
  }
  return relevant;
}
