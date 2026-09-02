// Port of scripts/weekly_facts.py — computes the storyline facts for one
// week from raw Sleeper data, so the LLM writes from verified numbers
// instead of us (or it) doing arithmetic by eye. Keep this in sync with the
// Python version; the two are meant to produce identical output.
import type { SleeperLeagueUser, SleeperMatchup, SleeperRoster } from "./sleeper";

const CLOSE_MARGIN = 8;
const CARRIED_SHARE = 0.3;

export interface OutlierInfo {
  best_starter_points: number;
  share_of_total: number;
  carried: boolean;
}

export interface TeamScore {
  team: string;
  points: number;
}

export interface WeekFacts {
  week: number;
  chopped: {
    roster_id: number;
    team: string;
    points: number;
    weakest_starter_points: number | null;
  };
  next_closest_survivor: {
    roster_id: number;
    team: string;
    points: number;
    margin_over_chopped: number;
    close_call: boolean;
    outlier: OutlierInfo | null;
  } | null;
  top_scorer: {
    roster_id: number;
    team: string;
    points: number;
    outlier: OutlierInfo | null;
  };
  field: TeamScore[];
  teams_remaining_after_this_week: number;
}

function teamName(roster: SleeperRoster, usersById: Map<string, SleeperLeagueUser>): string {
  const user = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
  return user?.metadata?.team_name || user?.display_name || `roster ${roster.roster_id}`;
}

function carriedByShare(m: SleeperMatchup): OutlierInfo | null {
  const starters = m.starters_points || [];
  const total = m.points || 0;
  if (!starters.length || !total) return null;
  const best = Math.max(...starters);
  const share = Math.round((best / total) * 1000) / 1000;
  return { best_starter_points: best, share_of_total: share, carried: share >= CARRIED_SHARE };
}

function weakestStarter(m: SleeperMatchup): number | null {
  const starters = m.starters_points || [];
  if (!starters.length) return null;
  return Math.round(Math.min(...starters) * 100) / 100;
}

export function buildWeekFacts(
  week: number,
  rosters: SleeperRoster[],
  users: SleeperLeagueUser[],
  matchups: SleeperMatchup[]
): WeekFacts {
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const rostersById = new Map(rosters.map((r) => [r.roster_id, r]));
  const matchupsByRoster = new Map(matchups.map((m) => [m.roster_id, m]));

  const eliminatedWeek = (rosterId: number) => rostersById.get(rosterId)?.settings?.eliminated;

  const participating = rosters
    .map((r) => r.roster_id)
    .filter((rid) => {
      const el = eliminatedWeek(rid);
      return el === undefined || el === null || el >= week;
    });

  const scores = participating
    .map((rid) => ({ rid, points: matchupsByRoster.get(rid)?.points ?? 0 }))
    .sort((a, b) => a.points - b.points);

  let choppedId = participating.find((rid) => eliminatedWeek(rid) === week);
  if (choppedId === undefined) {
    choppedId = scores[0]?.rid;
  }
  if (choppedId === undefined) {
    throw new Error(`No participating rosters found for week ${week}`);
  }

  const choppedMatchup = matchupsByRoster.get(choppedId)!;
  const choppedScore = choppedMatchup.points;

  const survivors = scores.filter((s) => s.rid !== choppedId);
  const nextLowest = survivors.length
    ? survivors.reduce((min, s) => (s.points < min.points ? s : min))
    : null;

  const topEntry = scores.reduce((max, s) => (s.points > max.points ? s : max));
  const topMatchup = matchupsByRoster.get(topEntry.rid)!;

  const facts: WeekFacts = {
    week,
    chopped: {
      roster_id: choppedId,
      team: teamName(rostersById.get(choppedId)!, usersById),
      points: choppedScore,
      weakest_starter_points: weakestStarter(choppedMatchup),
    },
    next_closest_survivor: null,
    top_scorer: {
      roster_id: topEntry.rid,
      team: teamName(rostersById.get(topEntry.rid)!, usersById),
      points: topEntry.points,
      outlier: topEntry.rid !== choppedId ? carriedByShare(topMatchup) : null,
    },
    field: scores.map((s) => ({
      team: teamName(rostersById.get(s.rid)!, usersById),
      points: s.points,
    })),
    teams_remaining_after_this_week: participating.length - 1,
  };

  if (nextLowest) {
    const nlMatchup = matchupsByRoster.get(nextLowest.rid)!;
    const margin = Math.round((nextLowest.points - choppedScore) * 100) / 100;
    facts.next_closest_survivor = {
      roster_id: nextLowest.rid,
      team: teamName(rostersById.get(nextLowest.rid)!, usersById),
      points: nextLowest.points,
      margin_over_chopped: margin,
      close_call: margin <= CLOSE_MARGIN,
      outlier: carriedByShare(nlMatchup),
    };
  }

  return facts;
}
