import { Link } from "@tanstack/react-router";

export function SetupScreen() {
  return (
    <main className="route-shell route-view">
      <h1>Setup</h1>
      <p>Configure player info and race params.</p>
      <p>
        Proceed to <Link to="/race">/race</Link> when setup is ready.
      </p>
    </main>
  );
}
