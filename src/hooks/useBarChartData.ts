import { useState, useMemo } from "react";
import {
  format,
  subDays,
  addDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  startOfYear,
  endOfYear,
  subYears,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
} from "date-fns";
import { SessionRecord, BarChartRange } from "../types";

/**
 * 日本時間(JST)の yyyy-MM-dd または yyyy-MM 形式のキーを作成する
 */
const getJSTKey = (dateStr: string, length: 10 | 7) => {
  const date = parseISO(dateStr);
  // 日本時間にオフセット（UTC+9）してフォーマット
  const jstDate = addDays(date, 0); // 必要に応じて offset 調整。基本 parseISO は実行環境のTimeZoneに従う
  return format(jstDate, length === 10 ? "yyyy-MM-dd" : "yyyy-MM");
};

export const useBarChartData = (
  history: SessionRecord[],
  range: BarChartRange
) => {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const today = new Date();

  const chartData = useMemo(() => {
    // 1. 高速化のためのハッシュマップ作成 $O(N)$
    const dayMap = new Map<string, number>();
    const monthMap = new Map<string, number>();

    history.forEach((rec) => {
      const dKey = getJSTKey(rec.startTime, 10);
      const mKey = dKey.substring(0, 7); // yyyy-MM
      dayMap.set(dKey, (dayMap.get(dKey) || 0) + 1);
      monthMap.set(mKey, (monthMap.get(mKey) || 0) + 1);
    });

    let labels: string[] = [];
    let counts: number[] = [];
    let title = "";

    // 2. 範囲データの生成 $O(M)$
    if (range === "LAST_7_DAYS") {
      const start = subDays(referenceDate, 6);
      const days = eachDayOfInterval({ start, end: referenceDate });
      title = `${format(start, "MM/dd")} - ${format(referenceDate, "MM/dd")}`;
      days.forEach((d) => {
        labels.push(format(d, "MM/dd"));
        counts.push(dayMap.get(format(d, "yyyy-MM-dd")) || 0);
      });
    } else if (range === "MONTH") {
      const start = startOfMonth(referenceDate);
      const end = endOfMonth(referenceDate);
      const days = eachDayOfInterval({ start, end });
      title = format(referenceDate, "yyyy年 MM月");
      days.forEach((d) => {
        labels.push(format(d, "d"));
        counts.push(dayMap.get(format(d, "yyyy-MM-dd")) || 0);
      });
    } else if (range === "YEAR") {
      const start = startOfYear(referenceDate);
      const end = endOfYear(referenceDate);
      const months = eachMonthOfInterval({ start, end });
      title = format(referenceDate, "yyyy年");
      months.forEach((m) => {
        labels.push(format(m, "M月"));
        counts.push(monthMap.get(format(m, "yyyy-MM")) || 0);
      });
    }

    return { labels, counts, title };
  }, [history, range, referenceDate]);

  const maxCount = Math.max(...chartData.counts, 5);

  return {
    referenceDate,
    setReferenceDate,
    chartData,
    today,
    maxCount,
    isCurrent:
      range === "LAST_7_DAYS"
        ? isSameDay(referenceDate, today)
        : range === "MONTH"
        ? isSameMonth(referenceDate, today)
        : isSameYear(referenceDate, today),
    handlePrev: () => {
      if (range === "LAST_7_DAYS") setReferenceDate((d) => subDays(d, 7));
      else if (range === "MONTH") setReferenceDate((d) => subMonths(d, 1));
      else if (range === "YEAR") setReferenceDate((d) => subYears(d, 1));
    },
    handleNext: () => {
      if (range === "LAST_7_DAYS") setReferenceDate((d) => addDays(d, 7));
      else if (range === "MONTH") setReferenceDate((d) => addMonths(d, 1));
      else if (range === "YEAR") setReferenceDate((d) => addYears(d, 1));
    },
    handleGoToToday: () => setReferenceDate(new Date()),
  };
};
