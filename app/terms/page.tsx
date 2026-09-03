export default function Terms() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px", color: "#c7c3be" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Terms</h1>
      <p>
        Recapped generates AI-written weekly recap messages for Sleeper fantasy football leagues
        using publicly available league data. Standard redraft/dynasty leagues get League Update;
        elimination ("guillotine") leagues get The Guillotine. Season passes are a one-time
        purchase per league, valid for the season the league is played in, and are non-refundable
        once your first message has been generated.
      </p>
      <p>
        We are not affiliated with Sleeper, the NFL, or any NFL team. League data is fetched
        directly from Sleeper's public API using the league ID you provide.
      </p>
      <p>Questions about your purchase? Contact the person who set up this app for your league.</p>
    </main>
  );
}
