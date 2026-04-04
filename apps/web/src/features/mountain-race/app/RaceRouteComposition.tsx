import { EventAlert, EventLogPanel, HUD } from "@/features/mountain-race/components";
import { RaceScreen } from "@/features/mountain-race/screens";

export function RaceRouteComposition() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      <RaceScreen />

      <section className="pointer-events-none absolute inset-0 z-10 p-3 sm:p-4">
        <div className="grid h-full grid-rows-[auto_auto_1fr] gap-2 sm:max-w-sm">
          <HUD />
          <EventAlert />
          <EventLogPanel />
        </div>
      </section>
    </main>
  );
}
