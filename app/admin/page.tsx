"use client";

import { useEffect, useState } from "react";

interface LeagueOption {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
}

const SECRET_KEY = "admin.secret";

// Unlisted page — not linked anywhere on the site. Reuses the same
// /api/leagues lookup as the landing page, then grants free access via
// /api/admin/grant instead of sending the visitor to Stripe. For handing
// out access to friends/beta testers before opening this up publicly.
export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [username, setUsername] = useState("");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [leagues, setLeagues] = useState<LeagueOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [granting, setGranting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY);
    if (saved) {
      setSecret(saved);
      setUnlocked(true);
    }
  }, []);

  function unlock() {
    if (!secret.trim()) return;
    sessionStorage.setItem(SECRET_KEY, secret.trim());
    setUnlocked(true);
  }

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

  async function grant(league: LeagueOption) {
    const email = emails[league.league_id]?.trim();
    if (!email) return;
    setGranting((g) => ({ ...g, [league.league_id]: true }));
    setResults((r) => ({ ...r, [league.league_id]: "" }));
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          leagueId: league.league_id,
          leagueName: league.name,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResults((r) => ({ ...r, [league.league_id]: data.link }));
    } catch (e) {
      setResults((r) => ({ ...r, [league.league_id]: `Error: ${(e as Error).message}` }));
    } finally {
      setGranting((g) => ({ ...g, [league.league_id]: false }));
    }
  }

  if (!unlocked) {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Admin</h1>
        <label style={label}>Admin secret</label>
        <input
          style={input}
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
        />
        <button style={button} onClick={unlock}>
          Unlock
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Grant free access</h1>
      <p style={{ color: "#57524a", marginTop: 0, marginBottom: 24 }}>
        Bypasses Stripe entirely, for friends and beta testers. Sends the real access email too.
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
          <label style={label}>Friend&rsquo;s email</label>
          <input
            style={input}
            value={emails[l.league_id] || ""}
            onChange={(e) => setEmails((v) => ({ ...v, [l.league_id]: e.target.value }))}
          />
          <button
            style={button}
            onClick={() => grant(l)}
            disabled={granting[l.league_id] || !emails[l.league_id]?.trim()}
          >
            {granting[l.league_id] ? "Granting..." : "Grant free access"}
          </button>
          {results[l.league_id] && (
            <p style={{ wordBreak: "break-all", marginTop: 8, fontSize: 13, color: "#57524a" }}>
              {results[l.league_id]}
            </p>
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
