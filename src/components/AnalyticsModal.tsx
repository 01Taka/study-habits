import { useState } from "react";
import {
  Modal,
  Tabs,
  ScrollArea,
  Box,
  Text,
  Group,
  SimpleGrid,
  Center,
  Badge,
  Stack,
  Button,
  ActionIcon,
} from "@mantine/core";
import {
  format,
  eachDayOfInterval,
  getDate,
  startOfMonth,
  startOfWeek,
  addMonths,
  subMonths,
  addDays,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { AnalyticsData, BarChartRange, SessionRecord } from "../types";
import { HeatmapView } from "./HeatmapView";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useBarChartData } from "../hooks/useBarChartData";

// --- Sub Components ---

// 2. BarChart View (Same as before but moved)
const BarChartView = ({
  history,
  range,
}: {
  history: SessionRecord[];
  range: BarChartRange;
}) => {
  const {
    chartData,
    isCurrent,
    maxCount,
    handleGoToToday,
    handleNext,
    handlePrev,
  } = useBarChartData(history, range);

  return (
    <Box mt="md">
      {/* ナビゲーション */}
      <Group justify="apart" mb="md">
        <Group>
          <Text fw={700} size="lg" style={{ minWidth: "120px" }}>
            {chartData.title}
          </Text>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={handleGoToToday}
            disabled={isCurrent}
          >
            今日
          </Button>
        </Group>
        <Group gap="xs">
          <ActionIcon variant="outline" onClick={handlePrev}>
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon variant="outline" onClick={handleNext}>
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <ScrollArea>
        {/* チャート描画部分は変更なし */}
        <Group align="flex-end" h={250} gap="xs" wrap="nowrap" pb="sm">
          {chartData.counts.map((count, i) => (
            <Stack
              key={i}
              gap={4}
              align="center"
              style={{ flex: 1, minWidth: 10 }}
            >
              <Text size="xs">{count > 0 ? count : ""}</Text>
              <Box
                w="100%"
                bg="blue"
                style={{
                  height: `${(count / maxCount) * 200}px`,
                  borderRadius: "4px 4px 0 0",
                  minHeight: count > 0 ? 4 : 0,
                }}
              />
              <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                {chartData.labels[i]}
              </Text>
            </Stack>
          ))}
        </Group>
      </ScrollArea>
    </Box>
  );
};
// 3. Calendar View (Same as before but moved)

const CalendarView = ({
  calendarCounts,
}: {
  calendarCounts: { [key: string]: number };
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  // 常に6週間（42日）分を表示するための計算
  const start = startOfWeek(startOfMonth(currentMonth));
  const days = eachDayOfInterval({
    start,
    end: addDays(start, 41),
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleGoToToday = () => setCurrentMonth(new Date());

  return (
    <Box>
      {/* ナビゲーションヘッダー */}
      <Group justify="apart" mb="md">
        <Group>
          <Text fw={700} size="xl" style={{ minWidth: "100px" }}>
            {format(currentMonth, "yyyy-MM")}
          </Text>
          <Button
            variant="subtle"
            size="compact-sm"
            onClick={handleGoToToday}
            disabled={isSameMonth(currentMonth, today)}
          >
            今日
          </Button>
        </Group>

        <Group gap="xs">
          <ActionIcon
            variant="outline"
            onClick={handlePrevMonth}
            aria-label="先月"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon
            variant="outline"
            onClick={handleNextMonth}
            aria-label="来月"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <SimpleGrid
        cols={7}
        spacing={1}
        verticalSpacing={1}
        bg="gray.3"
        style={{ border: "1px solid #dee2e6" }}
      >
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <Center key={d} bg="white" h={30}>
            <Text size="sm" fw={700}>
              {d}
            </Text>
          </Center>
        ))}
        {days.map((d) => {
          const dateKey = format(d, "yyyy-MM-dd");
          const count = calendarCounts[dateKey] || 0;
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isToday = isSameDay(d, today);

          return (
            <Box
              key={dateKey}
              bg={isCurrentMonth ? "white" : "gray.0"}
              h={80}
              p={4}
              style={{
                position: "relative",
                // 当日の枠を強調
                outline: isToday ? "2px solid #228be6" : "none",
                zIndex: isToday ? 1 : 0,
              }}
            >
              <Text
                size="xs"
                c={isCurrentMonth ? "dark" : "dimmed"}
                fw={isToday ? 700 : 400}
              >
                {getDate(d)}
              </Text>
              {count > 0 && (
                <Center h="100%">
                  <Badge size="lg" circle color="blue">
                    {count}
                  </Badge>
                </Center>
              )}
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
};

// --- Main Modal Export ---

interface AnalyticsModalProps {
  opened: boolean;
  onClose: () => void;
  analytics: AnalyticsData;
  history: SessionRecord[];
}

export default function AnalyticsModal({
  opened,
  onClose,
  analytics,
  history,
}: AnalyticsModalProps) {
  const [barChartRange, setBarChartRange] =
    useState<BarChartRange>("LAST_7_DAYS");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="活動履歴"
      size="xl" // ヒートマップが大きくなったのでサイズ調整
      centered
    >
      <Tabs defaultValue="calendar">
        <Tabs.List mb="md">
          <Tabs.Tab value="calendar">カレンダー</Tabs.Tab>
          <Tabs.Tab value="bar">棒グラフ</Tabs.Tab>
          <Tabs.Tab value="heatmap">ヒートマップ</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="calendar">
          <CalendarView calendarCounts={analytics.calendarCounts} />
        </Tabs.Panel>

        <Tabs.Panel value="bar">
          <Group mb="md" justify="center">
            <Button.Group>
              <Button
                variant={barChartRange === "LAST_7_DAYS" ? "filled" : "default"}
                onClick={() => setBarChartRange("LAST_7_DAYS")}
                size="xs"
              >
                直近7日
              </Button>
              <Button
                variant={barChartRange === "MONTH" ? "filled" : "default"}
                onClick={() => setBarChartRange("MONTH")}
                size="xs"
              >
                月別
              </Button>
              <Button
                variant={barChartRange === "YEAR" ? "filled" : "default"}
                onClick={() => setBarChartRange("YEAR")}
                size="xs"
              >
                年別
              </Button>
            </Button.Group>
          </Group>
          <BarChartView history={history} range={barChartRange} />
        </Tabs.Panel>

        <Tabs.Panel value="heatmap">
          <HeatmapView data={analytics.heatmap} />
          <Text size="xs" c="dimmed" mt="xs">
            横軸: 日付 (右端が最新) / 縦軸: 時間帯 (0時〜23時)
          </Text>
        </Tabs.Panel>
      </Tabs>

      <Text size="sm" c="dimmed" mt="xl" ta="right">
        総セッション数: {analytics.totalSessions}回
      </Text>
    </Modal>
  );
}
