// src/hooks/useAnalytics.ts
import { useMemo } from "react";
import { format, parseISO, getHours } from "date-fns";
import { SessionRecord, AnalyticsData } from "../types";

export const useAnalytics = (history: SessionRecord[]): AnalyticsData => {
  return useMemo(() => {
    const heatmap: AnalyticsData["heatmap"] = {};
    const calendarCounts: AnalyticsData["calendarCounts"] = {};

    history.forEach((session) => {
      if (!session.startTime) return;

      const dateObj = parseISO(session.startTime);
      const dateKey = format(dateObj, "yyyy-MM-dd");
      const hourKey = getHours(dateObj).toString(); // 0-23

      // 1. カレンダー用集計
      calendarCounts[dateKey] = (calendarCounts[dateKey] || 0) + 1;

      // 2. ヒートマップ用集計 (開始時間の時間帯別カウント)
      if (!heatmap[dateKey]) {
        heatmap[dateKey] = {};
      }
      if (!heatmap[dateKey][hourKey]) {
        heatmap[dateKey][hourKey] = 0;
      }
      heatmap[dateKey][hourKey] += 1;
    });

    return {
      totalSessions: history.length,
      heatmap,
      calendarCounts,
    };
  }, [history]);
};
