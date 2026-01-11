// 1. Heatmap View (Updated)
// 縦軸: 時間(0-23), 横軸: 日付(過去->未来)

import { Box, Stack, Group, Button, Tooltip, Text } from "@mantine/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  parseISO,
  startOfDay,
  subDays,
  eachDayOfInterval,
  format,
} from "date-fns";
import { useRef, useMemo } from "react";
import { HeatmapData } from "../types";
import { heatmapHours, getIntensityColor } from "../utils";

export const HeatmapView = ({ data }: { data: HeatmapData }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const oldestDate = useMemo(() => {
    const keys = Object.keys(data);
    // 2. 最小値（最古）を取得
    const oldestKey = keys.reduce((oldest, current) =>
      current < oldest ? current : oldest
    );
    return parseISO(oldestKey);
  }, [data]);

  const heatmapDates = useMemo(() => {
    const end = startOfDay(new Date());

    // 最小表示期間の基準点（例：60日前）
    const minStartDate = subDays(end, 29); // 今日を含めて60日間

    // 「最古のデータ日」と「最小基準点」のうち、より古い方を選択
    const start = oldestDate < minStartDate ? oldestDate : minStartDate;

    return eachDayOfInterval({ start, end });
  }, [oldestDate]);

  const rowVirtualizer = useVirtualizer({
    horizontal: true,
    count: heatmapDates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22,
    overscan: 10,
  });

  const jumpOptions = useMemo(() => {
    const options = [{ label: "最新", offset: 0 }];
    const interval = 90;
    for (let i = interval; i < heatmapDates.length; i += interval) {
      options.push({ label: `${i}日前`, offset: i });
    }
    return options;
  }, [heatmapDates.length]);

  const handleJump = (daysAgo: number) => {
    const targetIndex = Math.max(0, heatmapDates.length - 1 - daysAgo);
    rowVirtualizer.scrollToIndex(targetIndex, { align: "start" });
  };

  // 共通のY軸ラベルコンポーネント
  const HourLabels = ({ side }: { side: "left" | "right" }) => (
    <Box
      style={{
        position: "sticky",
        [side]: 0,
        zIndex: 2,
        backgroundColor: "white",
        padding: "0 4px",
        boxShadow:
          side === "left"
            ? "2px 0 5px -2px rgba(0,0,0,0.1)"
            : "-2px 0 5px -2px rgba(0,0,0,0.1)",
      }}
    >
      {/* 日付ヘッダー分のスペーサー(20px) */}
      <Box h={20} />
      {heatmapHours.map((h) => (
        <Box
          key={h}
          h={20}
          mb={2}
          display="flex"
          style={{ alignItems: "center" }}
        >
          <Text
            size="xs"
            c="dimmed"
            style={{ fontSize: 10, whiteSpace: "nowrap" }}
          >
            {h}:00
          </Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Stack gap="md">
      <Group gap="xs">
        {jumpOptions.map((opt) => (
          <Button
            key={opt.offset}
            variant="light"
            size="compact-xs"
            onClick={() => handleJump(opt.offset)}
          >
            {opt.label}
          </Button>
        ))}
      </Group>

      <div
        ref={parentRef}
        style={{
          width: "100%",
          overflow: "auto",
          position: "relative",
          border: "1px solid #eee",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            width: `${rowVirtualizer.getTotalSize() + 80}px`, // 左右ラベル分の幅を確保
            height: "560px",
            display: "flex", // 横並びにする
            position: "relative",
          }}
        >
          {/* 左側固定ラベル */}
          <HourLabels side="left" />

          {/* 仮想レンダリング領域 */}
          <div style={{ flex: 1, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualColumn) => {
              const date = heatmapDates[virtualColumn.index];
              const dateKey = format(date, "yyyy-MM-dd");
              const dayData = data[dateKey] || {};
              const isFirstDay = date.getDate() === 1;

              return (
                <div
                  key={virtualColumn.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "20px",
                    // 左ラベルの幅(想定約40px)を考慮してオフセット
                    transform: `translateX(${virtualColumn.start + 10}px)`,
                  }}
                >
                  {/* 日付ヘッダー */}
                  <Box h={20}>
                    {isFirstDay && (
                      <Text
                        size="xs"
                        c="blue"
                        style={{ fontSize: 10, whiteSpace: "nowrap" }}
                      >
                        {format(date, "M/d")}
                      </Text>
                    )}
                  </Box>

                  {heatmapHours.map((h) => {
                    const count = dayData[h.toString()] || 0;
                    const color = getIntensityColor(count);
                    return count === 0 ? (
                      <Box
                        key={h}
                        w={20}
                        h={20}
                        mb={2}
                        bg={color}
                        style={{ borderRadius: 2 }}
                      />
                    ) : (
                      <Tooltip
                        key={h}
                        label={`${dateKey} ${h}:00 - ${count}回`}
                        position="right"
                        withArrow
                      >
                        <Box
                          w={20}
                          h={20}
                          mb={2}
                          bg={color}
                          style={{ borderRadius: 2 }}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* 右側固定ラベル */}
          <HourLabels side="right" />
        </div>
      </div>
    </Stack>
  );
};
