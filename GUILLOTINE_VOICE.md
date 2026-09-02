# The Guillotine — Voice Guide

Weekly recap messages for a 10-team Sleeper "guillotine" (elimination) fantasy
football league. Every week the lowest scorer among remaining teams is
eliminated. This doc is the locked style spec, refined across weeks 1-5 of
the completed 2025 season (league id `1269138438339174400`) as test data.
Read this before writing a new week's message.

## Output contract

- **Format:** plain text for a group chat. No emoji. Bold only for something
  that truly earns it (rare). No markdown headers/lists in the actual message.
- **Length:** ~4-6 sentences. Can flex longer only when the week's story
  genuinely earns it (record score, brutal margin, big collapse). Default
  short — this is a text people read in a group chat, not an essay.
- **Cadence:** sent Tuesday, after Monday Night Football finishes and before
  the Wednesday 2am waiver clear. FAAB/waiver-bait lines are fair game every
  week for this reason.

## Voice

- **Speaker:** the guillotine itself, third person ("it," "the blade," "the
  guillotine"). Never first-person "I" for the guillotine.
  - Exception: the *eliminated manager's own eulogy*, sent by the same
    person playing both roles in the group chat, is first-person ("my head
    rolls..."). That's a distinct, occasional mode — not the default.
- **Tone:** merciless and cold, always. Never softens for bad luck,
  inexperience, or someone having a rough go of it — if anything, the
  guillotine takes pleasure in misfortune. No sympathy, ever.
- **Humor:** mostly grim/unsettling. A dark joke is welcome if it's earned by
  the data — not a punchline forced into every message.
- **Names:** name the eliminated team by default — it makes the recap land.
  Withhold the name only when a situation specifically calls for restraint
  (dial this in case by case, not a fixed rule).
- **Recurring vocabulary:** words like "the blade," "hungers," "waits,"
  "mercy," "the block" show up naturally across weeks. Don't avoid them, but
  don't force them into every message either — let repetition happen
  organically, not as a checklist.

## What goes into a message

Pull structured facts with `scripts/weekly_facts.py` (see below) rather than
eyeballing raw JSON — team totals are reliable, hand-computed margins have
bitten us before (see Week 4 note in git history: a stale `starters_points`
sub-array nearly got miscited as a real close call).

1. **Who got chopped, and their score.** Always the anchor of the message.
2. **The close-call check.** Margin between the chopped team and the next
   safest survivor. **Only call it "close" if the margin is ≤ 8 points.**
   Anything wider — don't manufacture tension that isn't there.
3. **Outlier detection**, when it strengthens the story, not by default:
   - A single starter scoring far outside the norm (very high, e.g. 40+, or
     very low, e.g. 5) who plausibly caused the death or the survival.
   - "Carried by one player" — one starter contributing ~30%+ of a team's
     total. Worth noting for the team that barely survived, or for the
     week's top scorer if it wasn't a balanced effort.
4. **The week's top score**, as a contrast beat — optional, use when it adds
   something (a record, a big gap from the field).
5. **Forward-looking FAAB tease** — a line baiting the waiver wire, since the
   message always lands before Wednesday's bid clear. Not mandatory every
   single week, but a strong recurring beat.

Don't cram in every fact every week. Pick 2-3 that make the best story; skip
the rest. A message reciting the full box score is worse than one with one
sharp detail.

## Reference examples (target quality bar)

**Week 1** — the season-opener, no dramatic close call detection needed yet
since it was the first cut, but happened to be the tightest margin of the
whole season:

> Week One. First blood.
>
> FreeBallersDranik led all of you with 122.02 — the closest anyone came to
> impressing me.
>
> But I don't watch the top. I watch the bottom. McGoo99 offered me 89.98
> points, and beside it sat reedwheeler's 90.42 — a margin of 0.44. Forty-four
> hundredths of a point stood between staying and dying this week.
>
> McGoo99 didn't have it.
>
> One down. Nine to go. I'll see the rest of you next Sunday.

**Week 3** — best example of naming the fallen with real specificity, plus
an outlier that explains a close survival:

> Another week, another fallen comrade. Davidfulkerson05 went this time — not
> for one fatal mistake, but for none of you showing up at all. Every starter
> finished within a stone's throw of mediocre, top to bottom. No hero. No
> traitor. Just eleven bodies who all quietly did nothing, together, at the
> worst possible time.
>
> Somewhere else, Kylerm3 stood one bad Sunday from joining him. Ninety-six
> points, barely enough — and nearly a quarter of it came from one man's
> night alone. Whoever that was just bought the whole roster another week.
> Remember him. He may be the only reason that team is still breathing.
>
> The blade doesn't care how you survive. Only that you did — this time.

**Week 5** — good example of the "top score contrast" and "weak link killed
them" beats, no false close-call:

> The blade falls again in Week 5. DMoses11 offered the least, and paid for
> it — one man in that lineup managed only 4.9 points, and that alone was
> nearly enough to seal it.
>
> Not far away, reedwheeler put up the loudest week of the season — 191.72,
> the biggest number anyone has posted all year. No single hero to thank.
> Four different players each cleared 27. For one week, that roster looked
> untouchable.
>
> The rest of you should take note. The line between them and the block is
> thinner than it looks.
>
> Place your bids. The guillotine waits, and it always hungers.

## Real historical messages (raw inspiration, not the template)

These are messages actually sent to the league in past seasons. They're
looser and less specific than the target above (no names, no numbers at
all) — treat them as tone/atmosphere reference, not the bar to hit. The
target is more specific and story-driven than these, per direct feedback.

> Another week, another fallen comrade. The guillotine shows no mercy, and
> the crowd grows smaller. Some of you cling to life with desperation,
> others stride confidently toward the future — but all of you remain under
> the same shadow. One mistake, one unlucky bounce, and your head could be
> next. The bids await, spend too much, spend too little both are mistakes.
> The blade is patient… but never merciful.

> The guillotine falls again in Week 4. Another headless body joins the
> pile, another roster scattered to the winds. Each week the blade grows
> heavier, each swing closer to your own neck. You may feel safe today, but
> the axe cares little for comfort — it only craves another victim. Place
> your bids. The guillotine waits, and it always hungers.

**Eliminated manager's own eulogy** (first-person, occasional, not the
default mode — sent by the same person who runs the guillotine account,
playing the victim's role this time):

> The guillotine has claimed me in Week 3. My head rolls, my season ends,
> and my roster is scattered for the vultures to feast upon. Learn from my
> downfall — no name is too big to fall, no team too safe to escape the
> blade. Bid wisely, play fiercely, for the guillotine spares no one. My
> time is done… but yours may be next.

## Tooling

- `scripts/fetch_sleeper.py <league_id> --weeks 1-9` — pulls league/rosters/
  users/matchups from Sleeper's public API (no auth) and caches them as JSON.
  Run this from a machine with normal internet access.
- `scripts/weekly_facts.py <league_dir> <week>` — computes the facts above
  (chopped team, margin, close-call flag, outliers, top score) from cached
  JSON. Use `--json` for machine-readable output.
- `data/guillotine-2025/` — the completed 2025 season, cached, used as the
  test fixture for the two scripts above and for calibrating this voice
  guide. Elimination order: McGoo99 (wk1) → theincrediblefulk (wk2) →
  Davidfulkerson05 (wk3) → baezk (wk4) → DMoses11 (wk5) →
  FreeBallersDranik (wk6) → Tfranklin30 (wk7) → jasesimon (wk8) →
  reedwheeler (wk9, runner-up) → **Kylerm3 (champion)**.

## Open questions / not yet decided

- Player-name mapping (Sleeper player IDs → real player names) isn't wired
  up yet — `weekly_facts.py` only works at the team level. Needed if we want
  to name specific NFL players in outlier call-outs instead of "one man's
  night."
- No live-fetch path from inside a Claude Code sandbox session yet — this
  environment's network egress blocks `api.sleeper.app` directly. `fetch_sleeper.py`
  needs to be run somewhere with normal internet (your own machine, or a
  deployed version of this tool) until that's resolved.
- Actual weekly workflow for the live 2026 season isn't finalized: run the
  scripts yourself and paste facts into a Claude conversation, or build this
  into a small app/UI. Revisit once the season's underway and the manual
  flow either does or doesn't feel like enough friction.
