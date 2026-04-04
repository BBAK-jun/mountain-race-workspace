import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { markResultReady } from "@/features/mountain-race/app";
import { useGameStore } from "@/features/mountain-race/store";

export function InGameOverlaySlot() {
  const navigate = useNavigate();
  const hasResult = useGameStore((s) => s.hasResult);

  useEffect(() => {
    if (!hasResult) return;
    markResultReady();
    void navigate({ to: "/result" });
  }, [hasResult, navigate]);

  return (
    <aside className="pointer-events-none absolute inset-0 z-20" aria-label="In-game overlay slot">
      <div className="absolute bottom-4 left-4 pointer-events-auto md:bottom-6 md:left-6">
        <section className="rounded-xl border border-white/55 bg-white/85 px-3 py-2 text-xs text-zinc-700 shadow-lg backdrop-blur">
          HUD/알림/로그 컴포넌트 통합 슬롯
        </section>
      </div>

      {hasResult ? (
        <div className="pointer-events-auto absolute top-4 right-4 md:top-6 md:right-6">
          <Button
            type="button"
            onClick={() => {
              markResultReady();
              void navigate({ to: "/result" });
            }}
          >
            결과 보기
          </Button>
        </div>
      ) : null}

      <div className="absolute right-4 bottom-4 pointer-events-auto md:right-6 md:bottom-6">
        <section className="rounded-xl border border-white/55 bg-white/85 px-3 py-2 text-xs text-zinc-700 shadow-lg backdrop-blur">
          Event Log 통합 슬롯
        </section>
      </div>
    </aside>
  );
}
