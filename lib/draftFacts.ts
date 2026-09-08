// Facts extraction for a "just drafted" recap — sent right after purchase,
// before Week 1 has any scores to write about. Built from the league's
// completed draft picks instead of matchups. Shared by both voices; each
// voice file picks what it wants out of this.
import type { SleeperDraftPick, SleeperLeagueUser, SleeperRoster } from "./sleeper";

export interface DraftPickFact {
  round: number;
  pickNo: number;
  team: string;
  player: string;
  position: string;
  nflTeam: string | null;
}

export interface DraftStack {
  team: string;
  nflTeam: string;
  players: string[];
}

export interface DraftRun {
  position: string;
  picks: DraftPickFact[];
}

export interface DraftFacts {
  totalRounds: number;
  totalPicks: number;
  firstPick: DraftPickFact;
  lastPick: DraftPickFact;
  firstRoundQBs: DraftPickFact[];
  runs: DraftRun[];
  biggestStack: DraftStack | null;
  picksByTeam: Record<string, DraftPickFact[]>;
}

function teamName(roster: SleeperRoster, usersById: Map<string, SleeperLeagueUser>): string {
  const user = roster.owner_id ? usersById.get(roster.owner_id) : undefined;
  return user?.metadata?.team_name || user?.display_name || `roster ${roster.roster_id}`;
}

export function buildDraftFacts(
  rosters: SleeperRoster[],
  users: SleeperLeagueUser[],
  picks: SleeperDraftPick[]
): DraftFacts {
  const usersById = new Map(users.map((u) => [u.user_id, u]));
  const rostersById = new Map(rosters.map((r) => [r.roster_id, r]));

  const sorted = [...picks].sort((a, b) => a.pick_no - b.pick_no);

  const toFact = (p: SleeperDraftPick): DraftPickFact => {
    const roster = rostersById.get(p.roster_id);
    const meta = p.metadata;
    const player = meta ? `${meta.first_name ?? ""} ${meta.last_name ?? ""}`.trim() : "Unknown Player";
    return {
      round: p.round,
      pickNo: p.pick_no,
      team: roster ? teamName(roster, usersById) : `roster ${p.roster_id}`,
      player: player || "Unknown Player",
      position: meta?.position || "N/A",
      nflTeam: meta?.team || null,
    };
  };

  const facts = sorted.map(toFact);

  const picksByTeam: Record<string, DraftPickFact[]> = {};
  for (const f of facts) {
    (picksByTeam[f.team] ??= []).push(f);
  }

  const firstRoundQBs = facts.filter((f) => f.round === 1 && f.position === "QB");

  // Runs: 3+ consecutive picks (by overall pick order) at the same position.
  const runs: DraftRun[] = [];
  let streak: DraftPickFact[] = [];
  for (const f of facts) {
    if (streak.length && streak[streak.length - 1].position === f.position) {
      streak.push(f);
    } else {
      if (streak.length >= 3) runs.push({ position: streak[0].position, picks: streak });
      streak = [f];
    }
  }
  if (streak.length >= 3) runs.push({ position: streak[0].position, picks: streak });

  // Biggest "stack": the team that drafted the most players from one real
  // NFL team (2+ to count at all).
  let biggestStack: DraftStack | null = null;
  for (const [team, teamPicks] of Object.entries(picksByTeam)) {
    const byNflTeam = new Map<string, DraftPickFact[]>();
    for (const p of teamPicks) {
      if (!p.nflTeam) continue;
      const group = byNflTeam.get(p.nflTeam) ?? [];
      group.push(p);
      byNflTeam.set(p.nflTeam, group);
    }
    for (const [nflTeam, group] of byNflTeam.entries()) {
      if (group.length < 2) continue;
      if (!biggestStack || group.length > biggestStack.players.length) {
        biggestStack = { team, nflTeam, players: group.map((p) => p.player) };
      }
    }
  }

  return {
    totalRounds: sorted.length ? Math.max(...sorted.map((p) => p.round)) : 0,
    totalPicks: facts.length,
    firstPick: facts[0],
    lastPick: facts[facts.length - 1],
    firstRoundQBs,
    runs,
    biggestStack,
    picksByTeam,
  };
}
