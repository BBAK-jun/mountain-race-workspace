import { Link } from "@tanstack/react-router";

export function LandingScreen() {
  return (
    <main className="route-shell route-view">
      <h1>Mountain Race</h1>
      <p>Game flow starts from the landing screen.</p>
      <p>
        Move to <Link to="/setup">/setup</Link> to begin the game setup flow.
      </p>
    </main>
  );
}
