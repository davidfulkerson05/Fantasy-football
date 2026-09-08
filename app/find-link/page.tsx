"use client";

import { useState } from "react";

interface LeagueOption {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
}

// Self-service recovery for anyone who lost their access link/email.
// Reuses the same username -> leagues lookup as the homepage, then posts
// to /api/resend-link — which always returns success regardless of
// whether a match was found, so this page can't be used to check whether
// a given league/email has a season pass.
export default function FindLinkPage() {
  const [username, setUsername] = useState("");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [leagues, setLeagues] = useState<LeagueOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});

  async function findLeagues() {
    setError("");
    setLeagues(null);
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

  async function resend(league: LeagueOption) {
    const email = emails[league.league_id]?.trim();
    if (!email) return;
    setSending((s) => ({ ...s, [league.league_id]: true }));
    try {
      await fetch("/api/resend-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId: league.league_id, email }),
      });
    } catch {
      // fall through — we still show the same confirmation either way
    } finally {
      setSending((s) => ({ ...s, [league.league_id]: false }));
      setSent((s) => ({ ...s, [league.league_id]: true }));
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Find your link</h1>
      <p style={{ color: "#57524a", marginTop: 0, marginBottom: 24 }}>
        Lost your access link? Look up your league, enter the email you purchased with, and
        we&rsquo;ll send it again.
      </p>

      <label style={label}>Sleeper username</label>
      <input
        style={input}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && findLeagues()}
      />
      <label style={label}>Season</label>
      <input style={input} value={season} onChange={(e) => setSeason(e.target.value)} />
      <button style={button} onClick={findLeagues} disabled={loading}>
        {loading ? "Looking..." : "Find leagues"}
      </button>

      {error && <p style={{ color: "#c2410c", marginTop: 16 }}>{error}</p>}

      {leagues?.length === 0 && (
        <p style={{ color: "#57524a", marginTop: 16 }}>No leagues found for that username/season.</p>
      )}

      {leagues?.map((l) => (
        <div key={l.league_id} style={card}>
          <div style={{ fontWeight: 600 }}>
            {l.name} <span style={{ color: "#8c8579", fontWeight: 400 }}>({l.season})</span>
          </div>
          {sent[l.league_id] ? (
            <p style={{ color: "#57524a", fontSize: 14, marginTop: 12, marginBottom: 0 }}>
              If we have a season pass on file for this league and email, the link is on its way.
            </p>
          ) : (
            <>
              <label style={label}>Email used at purchase</label>
              <input
                style={input}
                value={emails[l.league_id] || ""}
                onChange={(e) => setEmails((v) => ({ ...v, [l.league_id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && resend(l)}
              />
              <button
                style={button}
                onClick={() => resend(l)}
                disabled={sending[l.league_id] || !emails[l.league_id]?.trim()}
              >
                {sending[l.league_id] ? "Sending..." : "Resend my link"}
              </button>
            </>
          )}
        </div>
      ))}
    </main>
  );
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  color: "#57524a",
  marginTop: 16,
  marginBottom: 6,
};

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "#ffffff",
  border: "1px solid #e4e0d8",
  borderRadius: 6,
  color: "#211f1c",
  fontSize: 15,
};

const button: React.CSSProperties = {
  marginTop: 16,
  padding: "10px 18px",
  background: "#c2410c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
};

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e4e0d8",
  borderRadius: 12,
  padding: 20,
  marginTop: 16,
};
