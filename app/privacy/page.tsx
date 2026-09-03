export default function Privacy() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px", color: "#3a362f" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Privacy</h1>
      <p>
        We store the minimum needed to run your season pass: your league ID, the email address you
        provide at checkout, and an access token. Payments are processed by Stripe — we never see
        or store your card details.
      </p>
      <p>
        League data (rosters, matchups, scores) is fetched live from Sleeper's public API using
        your league ID and is not stored beyond a short-lived cache used to avoid re-generating the
        same week's message twice.
      </p>
      <p>We don't sell or share your data with anyone.</p>
    </main>
  );
}
