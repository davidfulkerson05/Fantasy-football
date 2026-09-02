"use client";

import { useEffect, useState } from "react";

interface LeagueOption {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
}

interface SavedLeague {
  league_id: string;
  name: string;
  season: string;
}

const STORAGE_KEY = "guillotine.league";

export default function Home() {
  const [username, setUsername] = useState("");
  const [season, setSeason] = useState(String(new Date().getFullYear()));
  const [leagues, setLeagues] = useState<LeagueOption[] | null>(null);
  const [selected, setSelected] = useState<SavedLeague | null>(null);
  const [week, setWeek] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSelected(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

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

  function chooseLeague(l: LeagueOption) {
    const saved: SavedLeague = { league_id: l.league_id, name: l.name, season: l.season };
    setSelected(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    setLeagues(null);
  }

  function changeLeague() {
    setSelected(null);
    localStorage.removeItem(STORAGE_KEY);
    setMessage("");
  }

  async function generate() {
    if (!selected) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`/api/generate?league_id=${selected.league_id}&week=${week}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setMessage(data.message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>The Guillotine</h1>
      <p style={{ color: "#9a9691", marginTop: 0, marginBottom: 32 }}>
        Weekly recap messages for elimination fantasy football leagues.
      </p>

      {!selected && (
        <section>
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
            <p style={{ color: "#9a9691" }}>No leagues found for that username/season.</p>
          )}
          {leagues && leagues.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={label}>Pick your league</p>
              {leagues.map((l) => (
                <button key={l.league_id} style={leagueRow} onClick={() => chooseLeague(l)}>
                  {l.name} <span style={{ color: "#6f6b66" }}>({l.season})</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {selected && (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{selected.name}</div>
              <div style={{ color: "#6f6b66", fontSize: 13 }}>{selected.season}</div>
            </div>
            <button style={linkButton} onClick={changeLeague}>
              change league
            </button>
          </div>

          <label style={label}>Week</label>
          <input
            style={{ ...input, width: 80 }}
            type="number"
            min={1}
            max={18}
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
          />
          <button style={button} onClick={generate} disabled={loading}>
            {loading ? "Sharpening..." : `Generate Week ${week}`}
          </button>

          {message && (
            <div style={{ marginTop: 24 }}>
              <pre style={messageBox}>{message}</pre>
              <button style={button} onClick={copy}>
                {copied ? "Copied!" : "Copy message"}
              </button>
            </div>
          )}
        </section>
      )}

      {error && <p style={{ color: "#e0645a", marginTop: 16 }}>{error}</p>}
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
  padding: "10px 18px",
  background: "#8a1c1c",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  fontSize: 15,
  cursor: "pointer",
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
};
