import type {
  ActiveBubble,
  Character,
  EventLog,
  GameEvent,
  GlobalEventType,
  HiddenEffectAssignment,
  Player,
} from "@mountain-race/types";
import {
  FINISH_LINE,
  GAME_SPEED,
  JITTER_RANGE,
  RACE_END_GRACE_PERIOD_MS,
  VOLCANIC_ASH_SPEED_MULT,
  initDialogueScheduler,
  initEventScheduler,
  processDialogues,
  processEvents,
} from "@mountain-race/game-logic";
import { HiddenEffectManager } from "./hiddenEffectManager";

const BROADCAST_INTERVAL_S = 0.05;

export interface RaceSnapshot {
  characters: Character[];
  rankings: string[];
  finishedIds: string[];
  elapsedTime: number;
  activeGlobalEvent: GlobalEventType | null;
  events: GameEvent[];
  eventLogs: EventLog[];
  activeBubble: ActiveBubble | null;
}

export interface RaceResult {
  rankings: string[];
  characters: Character[];
  hiddenEffects: HiddenEffectAssignment[];
}

export class RaceSimulation {
  private characters: Character[] = [];
  private rankings: string[] = [];
  private finishedIds: string[] = [];
  private firstFinishTime: number | null = null;
  private elapsedTime = 0;
  private events: GameEvent[] = [];
  private eventLogs: EventLog[] = [];
  private activeGlobalEvent: GlobalEventType | null = null;
  private globalEventEndTime = 0;
  private ultimateCount = 0;
  private activeBubble: ActiveBubble | null = null;
  private newlyFinishedIds: string[] = [];
  private lastBroadcastAt = 0;
  private lastTickWallTime = 0;
  readonly effects = new HiddenEffectManager();

  get isFinished(): boolean {
    return this._finished;
  }

  get shouldBroadcast(): boolean {
    return this.elapsedTime - this.lastBroadcastAt >= BROADCAST_INTERVAL_S;
  }

  private _finished = false;

  init(players: Player[]): void {
    this.characters = players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      faceImage: p.faceImage,
      progress: 0,
      speed: GAME_SPEED,
      baseSpeed: GAME_SPEED,
      status: "running" as const,
      stunEndTime: 0,
      stats: { hitCount: 0, setbackTotal: 0, ultimateUsed: 0, rankChanges: 0 },
      finishTime: null,
    }));

    this.rankings = this.characters.map((c) => c.id);
    this.finishedIds = [];
    this.firstFinishTime = null;
    this.elapsedTime = 0;
    this.events = [];
    this.eventLogs = [];
    this.activeGlobalEvent = null;
    this.globalEventEndTime = 0;
    this.ultimateCount = 0;
    this.activeBubble = null;
    this.lastBroadcastAt = 0;
    this.lastTickWallTime = Date.now();
    this._finished = false;

    initEventScheduler(0);
    initDialogueScheduler(0);
    this.effects.assignEffects(this.characters.map((c) => c.id));
  }

  tick(): void {
    const now = Date.now();
    const wallDelta = (now - this.lastTickWallTime) / 1000;
    this.lastTickWallTime = now;
    const deltaTime = Math.min(wallDelta, 0.1);

    this.elapsedTime += deltaTime;

    this.moveCharacters(deltaTime);
    this.detectFinishers();
    this.updateRankings();
    this.runEventSystem();
    this.runDialogueSystem();
    this.checkRaceEnd();
  }

  activateEffect(playerId: string): {
    assignment: HiddenEffectAssignment;
    targetName: string | undefined;
  } | null {
    if (!this.effects.canActivate(playerId)) return null;

    const assignment = this.effects.activate(playerId, this.elapsedTime);
    if (!assignment) return null;

    const result = this.effects.applyEffect(
      assignment,
      this.characters,
      this.rankings,
      this.elapsedTime,
    );
    this.characters = result.characters;

    return { assignment, targetName: result.targetName };
  }

  markBroadcasted(): void {
    this.lastBroadcastAt = this.elapsedTime;
  }

  snapshot(): RaceSnapshot {
    return {
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      elapsedTime: this.elapsedTime,
      activeGlobalEvent: this.activeGlobalEvent,
      events: this.events,
      eventLogs: this.eventLogs,
      activeBubble: this.activeBubble,
    };
  }

  result(): RaceResult {
    const finalRankings = [
      ...this.finishedIds,
      ...this.characters
        .filter((c) => !this.finishedIds.includes(c.id))
        .sort((a, b) => b.progress - a.progress)
        .map((c) => c.id),
    ];

    return {
      rankings: finalRankings,
      characters: this.characters,
      hiddenEffects: this.effects.allAssignments(),
    };
  }

  // ── Internal steps ───────────────────────────────────────────────────

  private moveCharacters(deltaTime: number): void {
    const isGlobalActive =
      this.activeGlobalEvent !== null && this.elapsedTime < this.globalEventEndTime;
    const ashActive = isGlobalActive && this.activeGlobalEvent === "volcanic_ash";

    this.characters = this.characters.map((c) => {
      if (this.finishedIds.includes(c.id)) return c;

      if (c.status === "stunned") {
        if (this.elapsedTime >= c.stunEndTime) {
          return { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
        }
        return c;
      }

      let char = c;
      if (c.status !== "running" && c.stunEndTime > 0 && this.elapsedTime >= c.stunEndTime) {
        char = { ...c, status: "running" as const, speed: c.baseSpeed, stunEndTime: 0 };
      }

      const ashMult = ashActive ? VOLCANIC_ASH_SPEED_MULT : 1;
      const jitter = 1 + (Math.random() - 0.5) * JITTER_RANGE;
      const progress = char.progress + char.speed * deltaTime * jitter * ashMult;
      return { ...char, progress };
    });
  }

  private detectFinishers(): void {
    const newlyFinished = this.characters
      .filter((c) => c.progress >= FINISH_LINE && !this.finishedIds.includes(c.id))
      .sort((a, b) => b.progress - a.progress);
    const newIds = newlyFinished.map((c) => c.id);
    this.newlyFinishedIds = newIds;
    this.finishedIds = [...this.finishedIds, ...newIds];

    if (this.firstFinishTime === null && newIds.length > 0) {
      this.firstFinishTime = this.elapsedTime;
    }

    this.characters = this.characters.map((c) => {
      const clamped = Math.min(c.progress, 1);
      if (newIds.includes(c.id)) {
        return { ...c, progress: clamped, finishTime: this.elapsedTime };
      }
      return clamped !== c.progress ? { ...c, progress: clamped } : c;
    });
  }

  private updateRankings(): void {
    this.rankings = [...this.characters].sort((a, b) => b.progress - a.progress).map((c) => c.id);
  }

  private runEventSystem(): void {
    const result = processEvents({
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      elapsedTime: this.elapsedTime,
      activeGlobalEvent: this.activeGlobalEvent,
      globalEventEndTime: this.globalEventEndTime,
      ultimateCount: this.ultimateCount,
    });

    this.characters = result.characters;
    this.activeGlobalEvent = result.activeGlobalEvent;
    this.globalEventEndTime = result.globalEventEndTime;
    this.ultimateCount = result.ultimateCount;

    if (result.newEvents.length > 0) this.events.push(...result.newEvents);
    if (result.newLogs.length > 0) this.eventLogs.push(...result.newLogs);
  }

  private runDialogueSystem(): void {
    const result = processDialogues({
      characters: this.characters,
      rankings: this.rankings,
      finishedIds: this.finishedIds,
      newlyFinishedIds: this.newlyFinishedIds,
      elapsedTime: this.elapsedTime,
      activeBubble: this.activeBubble,
      newEvents: this.events.slice(-5),
    });
    this.activeBubble = result.activeBubble;
  }

  private checkRaceEnd(): void {
    const allDone = this.finishedIds.length === this.characters.length;
    const graceSeconds = RACE_END_GRACE_PERIOD_MS / 1000;
    const graceOver =
      this.firstFinishTime !== null && this.elapsedTime - this.firstFinishTime >= graceSeconds;

    if (allDone || graceOver) {
      this._finished = true;
    }
  }
}
