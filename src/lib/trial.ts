import {
  TRIAL_DAYS,
  TRIAL_ENABLED,
  TRIAL_ENABLED_CLIENT,
  TRIAL_ENABLED_SERVER,
} from "@/src/config/plans";

export { TRIAL_DAYS, TRIAL_ENABLED, TRIAL_ENABLED_CLIENT, TRIAL_ENABLED_SERVER };

const TRIAL_DURATION_SECONDS = Number(
  process.env.TRIAL_DURATION_SECONDS ?? process.env.NEXT_PUBLIC_TRIAL_DURATION_SECONDS
);
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function getTrialDaysRemaining(
  nowMs: number,
  endsAtIso: string | null,
  startedAtIso?: string | null
) {
  if (startedAtIso) {
    const startedAt = new Date(startedAtIso).getTime();
    if (Number.isFinite(startedAt)) {
      const elapsedDays = Math.floor(
        Math.max(0, nowMs - startedAt) / MS_PER_DAY
      );
      return Math.max(0, Math.min(TRIAL_DAYS, TRIAL_DAYS - elapsedDays));
    }
  }
  if (!endsAtIso) {
    return 0;
  }
  const endsAt = new Date(endsAtIso).getTime();
  const remaining = endsAt - nowMs;
  if (remaining <= 0) {
    return 0;
  }
  const days = Math.ceil(remaining / MS_PER_DAY);
  return Math.max(0, Math.min(TRIAL_DAYS, days));
}

export function getTrialWindow(start: Date) {
  const startedAt = new Date(start.getTime());
  const durationMs = Number.isFinite(TRIAL_DURATION_SECONDS) && TRIAL_DURATION_SECONDS > 0
    ? TRIAL_DURATION_SECONDS * 1000
    : TRIAL_DAYS * MS_PER_DAY;
  const endsAt = new Date(start.getTime() + durationMs);
  return {
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

export function formatTrialCountdown(
  nowMs: number,
  endsAtIso: string | null,
  startedAtIso?: string | null
): string | null {
  if (!endsAtIso) {
    return null;
  }
  const endsAt = new Date(endsAtIso).getTime();
  const remaining = Math.max(0, endsAt - nowMs);
  if (remaining <= 0) {
    return "0m";
  }
  if (remaining >= 2 * MS_PER_DAY) {
    const days = getTrialDaysRemaining(nowMs, endsAtIso, startedAtIso);
    return `${days} days`;
  }
  if (remaining >= MS_PER_HOUR) {
    const hours = Math.floor(remaining / MS_PER_HOUR);
    return `${hours} hours`;
  }
  const minutes = Math.max(1, Math.floor(remaining / (60 * 1000)));
  return `${minutes} minutes`;
}

export function formatTrialEndDate(endsAtIso: string | null) {
  if (!endsAtIso) {
    return null;
  }
  const date = new Date(endsAtIso);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
