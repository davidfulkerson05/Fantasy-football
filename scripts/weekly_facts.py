#!/usr/bin/env python3
"""Turn a week's raw Sleeper data into the storyline facts the Guillotine
narrator needs, so nobody has to eyeball JSON and do the arithmetic by hand.

Usage:
    python3 weekly_facts.py <league_dir> <week>

<league_dir> holds league.json, rosters.json, users.json, and
matchups/week_<N>.json (see fetch_sleeper.py, or data/guillotine-2025 for a
worked example from the completed 2025 season).

"Close" means within CLOSE_MARGIN points of the block, per house rules.
Prints a human-readable summary and the same data as JSON.
"""
import argparse
import json
import os
import sys

CLOSE_MARGIN = 8.0
CARRIED_SHARE = 0.30  # a starter contributing >=30% of the team total is "carrying" it


def load(league_dir: str, name: str):
    with open(os.path.join(league_dir, name)) as f:
        return json.load(f)


def load_week(league_dir: str, week: int):
    with open(os.path.join(league_dir, "matchups", f"week_{week}.json")) as f:
        return json.load(f)


def team_name(roster, users_by_id):
    user = users_by_id.get(roster.get("owner_id"), {})
    meta = user.get("metadata") or {}
    return meta.get("team_name") or user.get("display_name") or f"roster {roster['roster_id']}"


def build_facts(league_dir: str, week: int) -> dict:
    rosters = load(league_dir, "rosters.json")
    users = load(league_dir, "users.json")
    matchups = load_week(league_dir, week)

    users_by_id = {u["user_id"]: u for u in users}
    rosters_by_id = {r["roster_id"]: r for r in rosters}
    matchups_by_roster = {m["roster_id"]: m for m in matchups}

    def eliminated_week(roster_id):
        return (rosters_by_id[roster_id].get("settings") or {}).get("eliminated")

    # A roster played this week if it wasn't already chopped in an earlier week.
    participating = [
        rid for rid in rosters_by_id
        if eliminated_week(rid) is None or eliminated_week(rid) >= week
    ]
    participating.sort(key=lambda rid: matchups_by_roster[rid]["points"])

    chopped_id = next((rid for rid in participating if eliminated_week(rid) == week), None)
    if chopped_id is None:
        # Fallback: lowest scorer this week (useful for the live/current week
        # before Sleeper has written the eliminated flag yet).
        chopped_id = participating[0]

    scores = [(rid, matchups_by_roster[rid]["points"]) for rid in participating]
    scores.sort(key=lambda x: x[1])

    chopped_score = matchups_by_roster[chopped_id]["points"]
    survivors = [(rid, pts) for rid, pts in scores if rid != chopped_id]
    next_lowest = min(survivors, key=lambda x: x[1]) if survivors else None
    margin = round(next_lowest[1] - chopped_score, 2) if next_lowest else None
    is_close = margin is not None and margin <= CLOSE_MARGIN

    top_scorer_id, top_score = max(scores, key=lambda x: x[1])

    def weak_link(roster_id):
        starters_points = matchups_by_roster[roster_id].get("starters_points") or []
        if not starters_points:
            return None
        return round(min(starters_points), 2)

    def carried_by_share(roster_id):
        """Fraction of the team's total that came from its single best starter."""
        m = matchups_by_roster[roster_id]
        starters_points = m.get("starters_points") or []
        total = m.get("points") or 0
        if not starters_points or not total:
            return None
        best = max(starters_points)
        share = round(best / total, 3)
        return {"best_starter_points": best, "share_of_total": share, "carried": share >= CARRIED_SHARE}

    facts = {
        "week": week,
        "chopped": {
            "roster_id": chopped_id,
            "team": team_name(rosters_by_id[chopped_id], users_by_id),
            "points": chopped_score,
            "weakest_starter_points": weak_link(chopped_id),
        },
        "next_closest_survivor": None,
        "top_scorer": {
            "roster_id": top_scorer_id,
            "team": team_name(rosters_by_id[top_scorer_id], users_by_id),
            "points": top_score,
            **({"outlier": carried_by_share(top_scorer_id)} if top_scorer_id != chopped_id else {}),
        },
        "field": [
            {"team": team_name(rosters_by_id[rid], users_by_id), "points": pts}
            for rid, pts in scores
        ],
        "teams_remaining_after_this_week": len(participating) - 1,
    }

    if next_lowest:
        nl_id, nl_pts = next_lowest
        facts["next_closest_survivor"] = {
            "roster_id": nl_id,
            "team": team_name(rosters_by_id[nl_id], users_by_id),
            "points": nl_pts,
            "margin_over_chopped": margin,
            "close_call": is_close,
            "outlier": carried_by_share(nl_id),
        }

    return facts


def print_summary(facts: dict):
    w = facts["week"]
    chopped = facts["chopped"]
    top = facts["top_scorer"]
    surv = facts["next_closest_survivor"]

    print(f"=== Week {w} ===")
    print(f"Chopped: {chopped['team']} — {chopped['points']} pts "
          f"(weakest starter: {chopped['weakest_starter_points']})")
    if surv:
        close = "CLOSE CALL" if surv["close_call"] else "not close"
        print(f"Closest survivor: {surv['team']} — {surv['points']} pts "
              f"(margin {surv['margin_over_chopped']}, {close})")
        if surv["outlier"] and surv["outlier"]["carried"]:
            o = surv["outlier"]
            print(f"  -> carried by one starter: {o['best_starter_points']} pts "
                  f"({o['share_of_total']:.0%} of their total)")
    print(f"Top score: {top['team']} — {top['points']} pts")
    if top.get("outlier") and top["outlier"] and top["outlier"]["carried"]:
        o = top["outlier"]
        print(f"  -> carried by one starter: {o['best_starter_points']} pts "
              f"({o['share_of_total']:.0%} of their total)")
    print(f"Teams remaining after this week: {facts['teams_remaining_after_this_week']}")
    print()
    print("Full field (low to high):")
    for row in facts["field"]:
        print(f"  {row['points']:>7.2f}  {row['team']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("league_dir")
    parser.add_argument("week", type=int)
    parser.add_argument("--json", action="store_true", help="print JSON instead of the summary")
    args = parser.parse_args()

    facts = build_facts(args.league_dir, args.week)
    if args.json:
        json.dump(facts, sys.stdout, indent=2)
        print()
    else:
        print_summary(facts)


if __name__ == "__main__":
    main()
