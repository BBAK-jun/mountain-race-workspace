import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundScreen,
});

function RootLayout() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}

function NotFoundScreen() {
  return (
    <main className="route-not-found">
      <p>Lost Trail</p>
      <h1>Route not found</h1>
      <p>
        The path you asked for does not exist in the current file-based route
        tree.
      </p>
      <Link to="/">Return to base camp</Link>
    </main>
  );
}
