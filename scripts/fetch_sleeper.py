#!/usr/bin/env python3
"""Fetch a Sleeper league's data and cache it locally as JSON.

Usage:
    python3 fetch_sleeper.py <league_id> [--week N | --weeks 1-9] [--out DIR]

Always fetches league.json, rosters.json, users.json. Matchup weeks are
fetched into <out>/matchups/week_<N>.json.

Run this from a machine with normal internet access (Sleeper's API is public,
no auth needed). It intentionally has zero third-party dependencies.
"""
import argparse
import json
import os
import urllib.request

BASE = "https://api.sleeper.app/v1"


def fetch(url: str):
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def save(obj, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)
    print(f"wrote {path}")


def parse_weeks(args) -> list[int]:
    if args.week:
        return [args.week]
    if args.weeks:
        lo, hi = args.weeks.split("-")
        return list(range(int(lo), int(hi) + 1))
    return []


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("league_id")
    parser.add_argument("--week", type=int, help="fetch a single week's matchups")
    parser.add_argument("--weeks", help="fetch a range, e.g. 1-9")
    parser.add_argument("--out", default=None, help="output directory (default: data/<league_id>)")
    args = parser.parse_args()

    out_dir = args.out or os.path.join(os.path.dirname(__file__), "..", "data", args.league_id)
    out_dir = os.path.abspath(out_dir)

    save(fetch(f"{BASE}/league/{args.league_id}"), os.path.join(out_dir, "league.json"))
    save(fetch(f"{BASE}/league/{args.league_id}/rosters"), os.path.join(out_dir, "rosters.json"))
    save(fetch(f"{BASE}/league/{args.league_id}/users"), os.path.join(out_dir, "users.json"))

    for week in parse_weeks(args):
        data = fetch(f"{BASE}/league/{args.league_id}/matchups/{week}")
        save(data, os.path.join(out_dir, "matchups", f"week_{week}.json"))


if __name__ == "__main__":
    main()
