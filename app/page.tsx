"use client";

import { useState } from "react";
import { PRICE_LABEL } from "@/lib/pricing";

interface LeagueOption {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
}

const EXAMPLES = [
  {
    week: "Week 1",
    text: `Week One. First blood.

FreeBallersDranik led all of you with 122.02 — the closest anyone came to impressing me.

But I don't watch the top. I watch the bottom. McGoo99 offered me 89.98 points, and beside it sat reedwheeler's 90.42 — a margin of 0.44. Forty-four hundredths of a point stood between staying and dying this week.

McGoo99 didn't have it.

One down. Nine to go. I'll see the rest of you next Sunday.`,
  },
  {
    week: "Week 3",
    text: `Another week, another fallen comrade. Davidfulkerson05 went this time — not for one fatal mistake, but for none of you showing up at all. Every starter finished within a stone's throw of mediocre, top to bottom. No hero. No traitor. Just eleven bodies who all quietly did nothing, together, at the worst possible time.

Somewhere else, Kylerm3 stood one bad Sunday from joining him. Ninety-six points, barely enough — and nearly a quarter of it came from one man's night alone. Whoever that was just bought the whole roster another week. Remember him. He may be the only reason that team is still breathing.

The blade doesn't care how you survive. Only that you did — this time.`,
  },
  {
    week: "Week 5",
    text: `The blade falls again in Week 5. DMoses11 offered the least, and paid for it — one man in that lineup managed only 4.9 points, and that alone was nearly enough to seal it.

Not far away, reedwheeler put up the loudest week of the season — 191.72, the biggest number anyone has posted all year. No single hero to thank. Four different players each cleared 27. For one week, that roster looked untouchable.

The rest of you should take note. The line between them and the block is thinner than it looks.

Place your bids. The guillotine waits, and it always hungers.`,
  },
];

// Blurred, so the exact words don't matter — just needs to look like a
// real message is sitting right there, personalized to the league they
// just picked, so the paywall reads as "unlock this" not "buy blind."
function PREVIEW_TEXT(leagueName: string): string {
  return `${leagueName} — Week 1

The blade has been watching your league all week, and it already knows exactly who's getting chopped, by how much, and who almost joined them.

Every name. Every score. Every detail that makes your group chat go off — written and ready to paste, the moment you unlock it.`;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [leagues, setLeagues] = useState<LeagueOption[] | null>(null);
  const [selected, setSelected] = useState<LeagueOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  async function findLeagues() {
    setError("");
    setLeagues(null);
    setSelected(null);
    if (!username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leagues?username=${encodeURIComponent(username.trim())}&season=${season}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setLeagues(data.leagues);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function buy() {
    if (!selected) return;
    setError("");
    setBuying(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: selected.league_id, leagueName: selected.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setBuying(false);
    }
  }

  return (
    <main>
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "64px 20px 40px" }}>
        <h1 style={{ fontSize: 40, marginBottom: 12, lineHeight: 1.1 }}>The Guillotine</h1>
        <p style={{ color: "#c7c3be", fontSize: 18, marginTop: 0, marginBottom: 8 }}>
          Every week, one of your Sleeper fantasy managers gets chopped. Every week, The
          Guillotine writes the recap — merciless, specific, and ready to paste straight into
          your group chat.
        </p>
        <p style={{ color: "#6f6b66", fontSize: 15 }}>
          Built for guillotine / elimination leagues. Connects to Sleeper — no account setup, just
          your league.
        </p>
      </section>

      <section style={{ maxWidth: 640, margin: "0 auto", padding: "8px 20px 48px" }}>
        {EXAMPLES.map((ex) => (
          <div key={ex.week} style={{ marginBottom: 20 }}>
            <div style={{ color: "#6f6b66", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              {ex.week} — real output
            </div>
            <pre style={messageBox}>{ex.text}</pre>
          </div>
        ))}
      </section>

      <section style={{ maxWidth: 640, margin: "0 auto", padding: "8px 20px 64px" }}>
        {!selected && (
          <div style={pricingCard}>
            <div style={{ fontSize: 13, color: "#e0645a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Founding price
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{PRICE_LABEL}</div>
            <div style={{ color: "#9a9691", marginBottom: 24 }}>
              One-time, for your league&rsquo;s whole season. No subscription.
            </div>

            <label style={label}>Sleeper username</label>
            <input
              style={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Davidfulkerson05"
              onKeyDown={(e) => e.key === "Enter" && findLeagues()}
            />
            <label style={label}>Season</label>
            <input style={input} value={season} onChange={(e) => setSeason(e.target.value)} />
            <button style={button} onClick={findLeagues} disabled={loading}>
              {loading ? "Looking..." : "Find my leagues"}
            </button>

            {leagues && leagues.length === 0 && (
              <p style={{ color: "#9a9691", marginTop: 12 }}>No leagues found for that username/season.</p>
            )}
            {leagues && leagues.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={label}>Pick your league</p>
                {leagues.map((l) => (
                  <button key={l.league_id} style={leagueRow} onClick={() => setSelected(l)}>
                    {l.name} <span style={{ color: "#6f6b66" }}>({l.season})</span>
                  </button>
                ))}
              </div>
            )}

            {error && <p style={{ color: "#e0645a", marginTop: 16 }}>{error}</p>}
          </div>
        )}

        {selected && (
          <div style={{ position: "relative" }}>
            {/* Teaser: a mock of the actual generator, blurred and inert — shows
                there's a real thing waiting on the other side of the paywall. */}
            <div style={previewPane} aria-hidden="true">
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{selected.name}</div>
              <div style={{ color: "#6f6b66", fontSize: 13, marginBottom: 16 }}>{selected.season}</div>
              <label style={label}>Week</label>
              <input style={{ ...input, width: 80 }} value={1} readOnly tabIndex={-1} />
              <button style={button} tabIndex={-1}>
                Generate Week 1
              </button>
              <pre style={{ ...messageBox, marginTop: 24 }}>{PREVIEW_TEXT(selected.name)}</pre>
            </div>

            <div style={overlayBackdrop}>
              <div style={{ ...pricingCard, width: "100%", maxWidth: 380, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                <div style={{ fontSize: 13, color: "#e0645a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                  Founding price
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{PRICE_LABEL}</div>
                <div style={{ color: "#9a9691", marginBottom: 20 }}>
                  One-time, for your league&rsquo;s whole season. No subscription.
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selected.name}</div>
                    <div style={{ color: "#6f6b66", fontSize: 13 }}>{selected.season}</div>
                  </div>
                  <button style={linkButton} onClick={() => setSelected(null)}>
                    change league
                  </button>
                </div>
                <button style={button} onClick={buy} disabled={buying}>
                  {buying ? "Redirecting to checkout..." : `Unlock Season Pass — ${PRICE_LABEL}`}
                </button>
                <p style={{ color: "#6f6b66", fontSize: 12, marginTop: 8 }}>
                  You&rsquo;ll enter your email on the payment screen — your access link is shown
                  immediately after and emailed to you too.
                </p>

                {error && <p style={{ color: "#e0645a", marginTop: 16 }}>{error}</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      <footer style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 48px", color: "#6f6b66", fontSize: 13 }}>
        <a href="/terms" style={{ color: "#6f6b66", marginRight: 16 }}>
          Terms
        </a>
        <a href="/privacy" style={{ color: "#6f6b66" }}>
          Privacy
        </a>
      </footer>
    </main>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#9a9691",
  marginTop: 16,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  color: "#e8e6e3",
  fontSize: 15,
};

const button: React.CSSProperties = {
  marginTop: 16,
  padding: "12px 20px",
  background: "#8a1c1c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
};

const linkButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#9a9691",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: 13,
};

const leagueRow: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  marginBottom: 8,
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  color: "#e8e6e3",
  fontSize: 15,
  cursor: "pointer",
};

const messageBox: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  fontFamily: "inherit",
  fontSize: 15,
  lineHeight: 1.6,
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 6,
  padding: 16,
  color: "#d8d4cf",
};

const pricingCard: React.CSSProperties = {
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 12,
  padding: 28,
};

const previewPane: React.CSSProperties = {
  background: "#151516",
  border: "1px solid #2a2a2c",
  borderRadius: 12,
  padding: 28,
  filter: "blur(5px)",
  userSelect: "none",
  pointerEvents: "none",
};

const overlayBackdrop: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 12,
  background: "rgba(11, 11, 12, 0.55)",
  borderRadius: 12,
};
