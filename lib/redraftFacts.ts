// Facts extraction for standard head-to-head (redraft/dynasty) leagues —
// the counterpart to facts.ts, which is elimination-specific. Pairs
// matchups by matchup_id (there's no "chopped" team here) and surfaces
// the storylines worth writing about: closest game, biggest blowout, top
// scorer, and the single worst individual starter performance league-wide.
import type { SleeperLeagueUser, SleeperMatchup, SleeperRoster } from "./sleeper";

export interface GameResult {
  winner: string;
  loser: string;
  winnerPoints: number;
  loserPoints: number;
  margin: number;
}

export interface TeamWeekResult {
  rosterId: number;
  team: string;
  points: number;
  won: boolean;
  margin: number; // signed: positive if won, negative if lost
}

export interface RedraftWeekFacts {
  week: number;
  closestGame: GameResult | null;
  biggestBlowout: GameResult | null;
  topScorer: { rosterId: number; team: string; points: number } | null;
  disasterStart: { rosterId: number; team: string; points: number } | null;
  results: TeamWeekResult[];
}

function teamName(roster: SleeperRoster, usersById: Map<string, SleeperLeagueUser>): string {
  const user = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
  return user?.metadata?.team_name || user?.display_name || `roster ${roster.roster_id}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildRedraftWeekFacts(
  week: number,
  rosters: SleeperRoster[],
  users: SleeperLeagueUser[],
  matchups: SleeperMatchup[]
): RedraftWeekFacts {
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const rostersById = new Map(rosters.map((r) => [r.roster_id, r]));

  const played = matchups.filter((m) => m.matchup_id != null);

  const byMatchup = new Map<number, SleeperMatchup[]>();
  for (const m of played) {
    const arr = byMatchup.get(m.matchup_id) ?? [];
    arr.push(m);
    byMatchup.set(m.matchup_id, arr);
  }

  let closestGame: GameResult | null = null;
  let biggestBlowout: GameResult | null = null;
  const results: TeamWeekResult[] = [];

  for (const pair of byMatchup.values()) {
    if (pair.length !== 2) continue; // bye / unpaired consolation slot
    const [a, b] = pair;
    const margin = round2(Math.abs(a.points - b.points));
    const winner = a.points >= b.points ? a : b;
    const loser = a.points >= b.points ? b : a;
    const winnerTeam = teamName(rostersById.get(winner.roster_id)!, usersById);
    const loserTeam = teamName(rostersById.get(loser.roster_id)!, usersById);

    const game: GameResult = {
      winner: winnerTeam,
      loser: loserTeam,
      winnerPoints: winner.points,
      loserPoints: loser.points,
      margin,
    };
    if (!closestGame || margin < closestGame.margin) closestGame = game;
    if (!biggestBlowout || margin > biggestBlowout.margin) biggestBlowout = game;

    results.push({ rosterId: winner.roster_id, team: winnerTeam, points: winner.points, won: true, margin });
    results.push({ rosterId: loser.roster_id, team: loserTeam, points: loser.points, won: false, margin: -margin });
  }

  let topScorer: RedraftWeekFacts["topScorer"] = null;
  let disasterStart: RedraftWeekFacts["disasterStart"] = null;

  for (const m of played) {
    const team = teamName(rostersById.get(m.roster_id)!, usersById);
    if (!topScorer || m.points > topScorer.points) {
      topScorer = { rosterId: m.roster_id, team, points: m.points };
    }
    const starters = m.starters_points || [];
    if (starters.length) {
      const worst = round2(Math.min(...starters));
      if (!disasterStart || worst < disasterStart.points) {
        disasterStart = { rosterId: m.roster_id, team, points: worst };
      }
    }
  }

  return { week, closestGame, biggestBlowout, topScorer, disasterStart, results };
}
