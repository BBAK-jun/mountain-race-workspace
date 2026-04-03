import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundScreen,
});

function RootLayout() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">MR</span>
          <span>
            <strong>Mountain Race</strong>
            <small>Single-route starter</small>
          </span>
        </Link>

        <span className="status-chip">Route: /</span>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <section className="panel panel-wide not-found-panel">
      <p className="eyebrow">Lost Trail</p>
      <h1>Route not found</h1>
      <p className="body-copy">
        The path you asked for does not exist in the current file-based route tree.
      </p>
      <Link className="primary-link" to="/">
        Return to base camp
      </Link>
    </section>
  );
}
