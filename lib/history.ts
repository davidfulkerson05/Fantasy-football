// Cross-week "storyline memory" for the redraft voice, built entirely on
// top of the per-league weekly cache that already exists in db.ts — no new
// storage, just reading a few extra keys back. Tracks four event types per
// team over a rolling window so the model can make a true callback
// ("blown out again") instead of inventing one.
import { getCachedWeek, type CachedWeek } from "./db";
import type { RedraftWeekFacts } from "./redraftFacts";

export type HistoryEventType = "blown_out" | "disaster_start" | "close_loss" | "top_scorer";

export interface HistoryEvent {
  week: number;
  type: HistoryEventType;
}

export type TeamHistory = Record<string, HistoryEvent[]>;

function isRedraftFacts(facts: unknown): facts is RedraftWeekFacts {
  return !!facts && typeof facts === "object" && "closestGame" in facts && "biggestBlowout" in facts;
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
    if (!cached || !isRedraftFacts(cached.facts)) continue;
    const facts = cached.facts;

    const add = (team: string, type: HistoryEventType) => {
      (history[team] ??= []).push({ week: w, type });
    };

    if (facts.biggestBlowout) add(facts.biggestBlowout.loser, "blown_out");
    if (facts.closestGame) add(facts.closestGame.loser, "close_loss");
    if (facts.topScorer) add(facts.topScorer.team, "top_scorer");
    if (facts.disasterStart) add(facts.disasterStart.team, "disaster_start");
  }

  return history;
}

// Narrows a full team-history map down to only the teams actually featured
// in this week's facts, so the prompt carries just enough context for a
// real callback and nothing to hallucinate from.
export function relevantHistory(facts: RedraftWeekFacts, history: TeamHistory): TeamHistory {
  const featured = new Set<string>();
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

  const relevant: TeamHistory = {};
  for (const team of featured) {
    if (history[team]?.length) relevant[team] = history[team];
  }
  return relevant;
}
