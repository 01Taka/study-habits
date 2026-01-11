import React, { useState, useMemo, useRef } from "react";
import {
  AppShell,
  Group,
  Button,
  Stack,
  Text,
  RingProgress,
  Center,
  Modal,
  NumberInput,
  ActionIcon,
  Tooltip,
  Box,
  ThemeIcon,
  rem,
  Tabs,
  Select,
  Switch,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSettings,
  IconChartBar,
  IconPlayerStop,
  IconPlayerPlay,
  IconDownload,
  IconUpload,
  IconVolume,
  IconClock,
  IconMusic,
  IconDatabase,
} from "@tabler/icons-react";

// Hooks & Types
import { useSessionTimer } from "../hooks/useSessionTimer";
import { usePersistentData } from "../hooks/usePersistentData";
import { useAnalytics } from "../hooks/useAnalytics";
import { getPhaseColor, getPhaseLabel, formatTime } from "../utils";
import { AUDIO_LIBRARY } from "../constants"; // Import constants

// Components
import AnalyticsModal from "./AnalyticsModal";

export default function MainLayout() {
  const {
    settings,
    history,
    updateSettings,
    addSessionRecord,
    exportData,
    importData,
  } = usePersistentData();

  const {
    phase,
    timeLeft,
    startSession,
    forceStopSession,
    manualStopAlarm,
    playTestSound, // Updated hook return
  } = useSessionTimer(settings, (completed, startTime) => {
    addSessionRecord(completed, startTime, settings);
  });

  const analytics = useAnalytics(history);

  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [historyOpened, { open: openHistory, close: closeHistory }] =
    useDisclosure(false);

  // Settings Local State
  const [tempSettings, setTempSettings] = useState(settings);

  // Phase logic
  const phaseColor = getPhaseColor(phase);
  const isSessionActive = phase !== "IDLE" && phase !== "FINISHED";

  const totalDuration = useMemo(() => {
    switch (phase) {
      case "PRE_MEDITATION":
        return settings.preMeditationDuration;
      case "STUDY":
        return settings.studyDuration;
      case "POST_MEDITATION":
        return settings.postMeditationDuration;
      default:
        return 1;
    }
  }, [phase, settings]);

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const handleSaveSettings = () => {
    updateSettings(tempSettings);
    closeSettings();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importData(file);
  };

  // Select用データの作成
  const noiseOptions = AUDIO_LIBRARY.noises.map((n) => ({
    value: n.id,
    label: n.label,
  }));
  const alarmOptions = AUDIO_LIBRARY.alarms.map((a) => ({
    value: a.id,
    label: a.label,
  }));

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      bg={isSessionActive ? `${phaseColor}.0` : "gray.0"}
      style={{ transition: "background-color 0.5s ease" }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <ThemeIcon
              size="lg"
              radius="md"
              variant="gradient"
              gradient={{ from: "blue", to: "cyan" }}
            >
              <IconChartBar style={{ width: "70%", height: "70%" }} />
            </ThemeIcon>
            <Text fw={700}>Study Timer</Text>
          </Group>

          <Group>
            {isSessionActive && (
              <Button
                color="red"
                variant="subtle"
                size="xs"
                onClick={forceStopSession}
              >
                セッション破棄
              </Button>
            )}
            <Tooltip label="履歴・分析">
              <ActionIcon variant="default" size="lg" onClick={openHistory}>
                <IconChartBar size="1.2rem" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="設定">
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => {
                  setTempSettings(settings);
                  openSettings();
                }}
              >
                <IconSettings size="1.2rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Center h="calc(100vh - 100px)">
          <Stack align="center" gap="xl">
            {/* Timer Display */}
            <RingProgress
              size={320}
              thickness={16}
              roundCaps
              sections={[
                { value: phase === "IDLE" ? 100 : progress, color: phaseColor },
              ]}
              label={
                <Center>
                  <Stack gap={0} align="center">
                    <Text c="dimmed" size="lg" fw={700} tt="uppercase">
                      {getPhaseLabel(phase)}
                    </Text>
                    <Text
                      size={rem(52)}
                      fw={900}
                      style={{ fontFamily: "monospace" }}
                    >
                      {formatTime(timeLeft)}
                    </Text>
                  </Stack>
                </Center>
              }
            />

            {phase === "IDLE" && (
              <Button
                size="xl"
                radius="xl"
                color="teal"
                leftSection={<IconPlayerPlay />}
                onClick={startSession}
                styles={{
                  root: { height: 60, paddingLeft: 40, paddingRight: 40 },
                }}
              >
                セッション開始
              </Button>
            )}

            {phase === "FINISHED" && (
              <Button
                size="xl"
                radius="xl"
                color="red"
                className="animate-pulse"
                leftSection={<IconPlayerStop />}
                onClick={manualStopAlarm}
              >
                アラーム停止・完了
              </Button>
            )}

            {phase === "IDLE" && (
              <Group gap="xs">
                <Button.Group>
                  <Button variant="light" color="teal" size="xs">
                    前瞑想: {Math.floor(settings.preMeditationDuration / 60)}分
                  </Button>
                  <Button variant="light" color="indigo" size="xs">
                    学習: {Math.floor(settings.studyDuration / 60)}分
                  </Button>
                  <Button variant="light" color="grape" size="xs">
                    後瞑想: {Math.floor(settings.postMeditationDuration / 60)}分
                  </Button>
                </Button.Group>
              </Group>
            )}
          </Stack>
        </Center>
      </AppShell.Main>

      {/* Settings Modal with Tabs */}
      <Modal
        opened={settingsOpened}
        onClose={closeSettings}
        title="設定"
        centered
        size="lg"
      >
        <Tabs defaultValue="time">
          <Tabs.List grow>
            <Tabs.Tab value="time" leftSection={<IconClock size={16} />}>
              時間設定
            </Tabs.Tab>
            <Tabs.Tab value="audio" leftSection={<IconMusic size={16} />}>
              サウンド設定
            </Tabs.Tab>
            <Tabs.Tab value="data" leftSection={<IconDatabase size={16} />}>
              データ管理
            </Tabs.Tab>
          </Tabs.List>

          {/* 1. Time Settings */}
          <Tabs.Panel value="time" pt="md">
            <Stack>
              <NumberInput
                label="勉強前 瞑想時間 (秒)"
                description="ブラウンノイズが流れます"
                value={tempSettings.preMeditationDuration}
                onChange={(v) =>
                  setTempSettings({
                    ...tempSettings,
                    preMeditationDuration: Number(v),
                  })
                }
                min={10}
              />
              <NumberInput
                label="勉強時間 (秒)"
                description="無音で集中します"
                value={tempSettings.studyDuration}
                onChange={(v) =>
                  setTempSettings({ ...tempSettings, studyDuration: Number(v) })
                }
                min={10}
              />
              <NumberInput
                label="勉強後 瞑想時間 (秒)"
                description="クールダウン"
                value={tempSettings.postMeditationDuration}
                onChange={(v) =>
                  setTempSettings({
                    ...tempSettings,
                    postMeditationDuration: Number(v),
                  })
                }
                min={10}
              />
              <NumberInput
                label="瞑想移行時のアラーム時間 (秒)"
                value={tempSettings.alarmDuration}
                onChange={(v) =>
                  setTempSettings({ ...tempSettings, alarmDuration: Number(v) })
                }
                min={1}
                max={30}
              />
            </Stack>
          </Tabs.Panel>

          {/* 2. Audio Settings */}
          <Tabs.Panel value="audio" pt="md">
            <Stack gap="lg">
              {/* Noise */}
              <Box>
                <Text fw={500} size="sm" mb={4}>
                  勉強前瞑想のBGM
                </Text>
                <Group align="flex-end">
                  <Select
                    style={{ flex: 1 }}
                    data={noiseOptions}
                    value={tempSettings.selectedNoiseId}
                    onChange={(v) =>
                      v &&
                      setTempSettings({ ...tempSettings, selectedNoiseId: v })
                    }
                    allowDeselect={false}
                  />
                  <Button
                    variant="default"
                    onClick={() => playTestSound("noise")}
                  >
                    <IconVolume size={16} />
                  </Button>
                </Group>
              </Box>

              <Divider />

              {/* Pre -> Study Alarm */}
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text fw={500} size="sm">
                    瞑想終了時のアラーム
                  </Text>
                  <Switch
                    label="有効にする"
                    checked={tempSettings.enablePreMeditationAlarm}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        enablePreMeditationAlarm: e.currentTarget.checked,
                      })
                    }
                  />
                </Group>

                <Group align="flex-end">
                  <Select
                    style={{ flex: 1 }}
                    data={alarmOptions}
                    value={tempSettings.selectedPreMeditationAlarmId}
                    onChange={(v) =>
                      v &&
                      setTempSettings({
                        ...tempSettings,
                        selectedPreMeditationAlarmId: v,
                      })
                    }
                    disabled={!tempSettings.enablePreMeditationAlarm}
                    allowDeselect={false}
                  />
                  <Button
                    variant="default"
                    onClick={() => playTestSound("preAlarm")}
                    disabled={!tempSettings.enablePreMeditationAlarm}
                  >
                    <IconVolume size={16} />
                  </Button>
                </Group>
              </Box>

              <Divider />

              {/* Study -> Post Alarm */}
              <Box>
                <Text fw={500} size="sm" mb={4}>
                  勉強終了時のアラーム
                </Text>
                <Group align="flex-end">
                  <Select
                    style={{ flex: 1 }}
                    data={alarmOptions}
                    value={tempSettings.selectedStudyEndAlarmId}
                    onChange={(v) =>
                      v &&
                      setTempSettings({
                        ...tempSettings,
                        selectedStudyEndAlarmId: v,
                      })
                    }
                    allowDeselect={false}
                  />
                  <Button
                    variant="default"
                    onClick={() => playTestSound("studyAlarm")}
                  >
                    <IconVolume size={16} />
                  </Button>
                </Group>
              </Box>

              <Divider />

              {/* Session End Alarm */}
              <Box>
                <Text fw={500} size="sm" mb={4}>
                  全セッション終了時のアラーム
                </Text>
                <Group align="flex-end">
                  <Select
                    style={{ flex: 1 }}
                    data={alarmOptions}
                    value={tempSettings.selectedSessionEndAlarmId}
                    onChange={(v) =>
                      v &&
                      setTempSettings({
                        ...tempSettings,
                        selectedSessionEndAlarmId: v,
                      })
                    }
                    allowDeselect={false}
                  />
                  <Button
                    variant="default"
                    onClick={() => playTestSound("endAlarm")}
                  >
                    <IconVolume size={16} />
                  </Button>
                </Group>
              </Box>
            </Stack>
          </Tabs.Panel>

          {/* 3. Data Settings */}
          <Tabs.Panel value="data" pt="md">
            <Stack align="flex-start">
              <Text size="sm">履歴データのバックアップと復元を行います。</Text>
              <Group>
                <Button
                  leftSection={<IconDownload size={16} />}
                  variant="outline"
                  onClick={exportData}
                >
                  履歴エクスポート
                </Button>
                <Button
                  leftSection={<IconUpload size={16} />}
                  variant="outline"
                  onClick={handleImportClick}
                >
                  履歴インポート
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".json"
                  onChange={handleFileChange}
                />
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={closeSettings}>
            キャンセル
          </Button>
          <Button onClick={handleSaveSettings}>設定を保存</Button>
        </Group>
      </Modal>

      <AnalyticsModal
        opened={historyOpened}
        onClose={closeHistory}
        analytics={analytics}
        history={history}
      />
    </AppShell>
  );
}
