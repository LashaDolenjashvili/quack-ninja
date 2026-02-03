"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTrialCountdown } from "@/src/lib/trial";

export function useTrialCountdown(
  serverNowIso: string | null,
  endsAtIso: string | null,
  active: boolean,
  startedAtIso?: string | null
) {
  const [baseNow, setBaseNow] = useState(() =>
    serverNowIso ? new Date(serverNowIso).getTime() : Date.now()
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setBaseNow(serverNowIso ? new Date(serverNowIso).getTime() : Date.now());
    setTick(0);
  }, [serverNowIso]);

  useEffect(() => {
    if (!active || !endsAtIso) {
      return;
    }
    const interval = setInterval(() => {
      setTick((value) => value + 1);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [active, endsAtIso]);

  return useMemo(() => {
    if (!active || !endsAtIso) {
      return null;
    }
    const nowMs = baseNow + tick * 60 * 1000;
    return formatTrialCountdown(nowMs, endsAtIso, startedAtIso);
  }, [active, baseNow, endsAtIso, startedAtIso, tick]);
}
