import { createFileRoute } from "@tanstack/react-router";

const highlights = [
  "Single root page kept intentionally",
  "TanStack Router file-based setup stays in place",
  "Cloudflare Pages-ready static build",
] as const;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="page-grid">
      <section className="hero-card panel panel-wide">
        <p className="eyebrow">Base Camp</p>
        <h1>Ship the mountain race client from a file-based route tree.</h1>
        <p className="body-copy">
          The web app now keeps only the root page. Add new route files later under{" "}
          <code>src/routes</code> when the actual game flow is ready.
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Current Scope</p>
        <ul className="detail-list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <p className="eyebrow">Next Build</p>
        <p className="body-copy">
          When you are ready, reintroduce routes such as lobby, play, or result as separate files
          instead of overloading the root page.
        </p>
      </section>
    </div>
  );
}
