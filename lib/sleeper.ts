// Thin client for Sleeper's public, unauthenticated fantasy football API.
// No login/OAuth exists for this — league data is public by design, you
// just need a username or league id. See https://docs.sleeper.com/

const BASE = "https://api.sleeper.app/v1";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Sleeper API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  settings: Record<string, number>;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string | null;
  settings: {
    eliminated?: number;
    wins: number;
    losses: number;
    fpts?: number;
    fpts_decimal?: number;
  };
}

export interface SleeperLeagueUser {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string } | null;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  starters: string[];
  starters_points: number[];
  players_points: Record<string, number>;
}

export function getUserByUsername(username: string) {
  return get<SleeperUser>(`/user/${encodeURIComponent(username)}`);
}

export function getUserLeagues(userId: string, season: string) {
  return get<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`);
}

export function getLeague(leagueId: string) {
  return get<SleeperLeague>(`/league/${leagueId}`);
}

export function getRosters(leagueId: string) {
  return get<SleeperRoster[]>(`/league/${leagueId}/rosters`);
}

export function getLeagueUsers(leagueId: string) {
  return get<SleeperLeagueUser[]>(`/league/${leagueId}/users`);
}

export function getMatchups(leagueId: string, week: number) {
  return get<SleeperMatchup[]>(`/league/${leagueId}/matchups/${week}`);
}

export function getNflState() {
  return get<{ week: number; season: string; season_type: string }>(`/state/nfl`);
}
