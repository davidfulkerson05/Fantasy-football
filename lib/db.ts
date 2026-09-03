import { Redis } from "@upstash/redis";

// Support both the Upstash-direct env var names and the names Vercel's
// Storage/Marketplace integration may populate instead — whichever the
// user's integration actually sets, one of these pairs will be present.
const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  (process.env.KV_URL as string);
const token = process.env.UPSTASH_REDIS_REST_TOKEN || (process.env.KV_REST_API_TOKEN as string);

export const redis = new Redis({ url: url as string, token: token as string });

export interface TokenRecord {
  leagueId: string;
  leagueName: string;
  email: string;
  isElimination: boolean;
}

export interface LeaguePaidRecord {
  token: string;
  email: string;
  purchasedAt: number;
  isElimination: boolean;
}

export interface CachedWeek {
  facts: unknown;
  message: string;
}

const tokenKey = (token: string) => `token:${token}`;
const paidKey = (leagueId: string) => `league:${leagueId}:paid`;
const cacheKey = (leagueId: string, week: number) => `cache:${leagueId}:${week}`;

export function getTokenRecord(token: string) {
  return redis.get<TokenRecord>(tokenKey(token));
}

export function getLeaguePaidRecord(leagueId: string) {
  return redis.get<LeaguePaidRecord>(paidKey(leagueId));
}

export async function saveAccessGrant(params: {
  leagueId: string;
  leagueName: string;
  email: string;
  token: string;
  isElimination: boolean;
}) {
  const { leagueId, leagueName, email, token, isElimination } = params;
  await Promise.all([
    redis.set(tokenKey(token), { leagueId, leagueName, email, isElimination } satisfies TokenRecord),
    redis.set(paidKey(leagueId), {
      token,
      email,
      purchasedAt: Date.now(),
      isElimination,
    } satisfies LeaguePaidRecord),
  ]);
}

export function getCachedWeek(leagueId: string, week: number) {
  return redis.get<CachedWeek>(cacheKey(leagueId, week));
}

export function setCachedWeek(leagueId: string, week: number, data: CachedWeek) {
  return redis.set(cacheKey(leagueId, week), data);
}
