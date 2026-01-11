import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { TimerSettings, SessionRecord } from "../types";
import { AUDIO_LIBRARY } from "../constants";

const STORAGE_KEYS = {
  SETTINGS: "pomodoro_settings",
  HISTORY: "pomodoro_history",
};

// 初期値設定
const DEFAULT_SETTINGS: TimerSettings = {
  preMeditationDuration: 3 * 60,
  studyDuration: 12 * 60,
  postMeditationDuration: 5 * 60,
  alarmDuration: 5,

  // 音声設定のデフォルト
  selectedNoiseId: AUDIO_LIBRARY.noises[0].id, // 最初のノイズ

  enablePreMeditationAlarm: false, // デフォルトはOFF
  selectedPreMeditationAlarmId: AUDIO_LIBRARY.alarms[0].id,

  selectedStudyEndAlarmId: AUDIO_LIBRARY.alarms[0].id,
  selectedSessionEndAlarmId: AUDIO_LIBRARY.alarms[1].id,
};

export const usePersistentData = () => {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<SessionRecord[]>([]);

  // 初期ロード
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);

    if (savedSettings) {
      try {
        // 新しい項目が増えた場合に対応するため、DEFAULTとマージする
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // ... updateSettings, addSessionRecord, exportData, importData は以前と同じ ...
  // (省略せずに以前のコードをそのまま使用してください。設定の型が変わっただけです)

  const updateSettings = useCallback((newSettings: TimerSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  }, []);

  const addSessionRecord = useCallback(
    (
      isCompleted: boolean,
      startTime: string,
      currentSettings: TimerSettings
    ) => {
      const record: SessionRecord = {
        id: uuidv4(),
        startTime: startTime,
        endTime: new Date().toISOString(),
        completed: isCompleted,
        durations: {
          preMeditation: currentSettings.preMeditationDuration,
          study: currentSettings.studyDuration,
          postMeditation: currentSettings.postMeditationDuration,
        },
      };

      setHistory((prev) => {
        const newHistory = [...prev, record];
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
        return newHistory;
      });
    },
    []
  );

  const exportData = useCallback(() => {
    const data = { settings, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timer_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings, history]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.settings && json.history) {
          // インポート時もマージして安全性を高める
          setSettings({ ...DEFAULT_SETTINGS, ...json.settings });
          setHistory(json.history);
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify(json.settings)
          );
          localStorage.setItem(
            STORAGE_KEYS.HISTORY,
            JSON.stringify(json.history)
          );
          alert("データのインポートに成功しました");
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        alert("ファイルの形式が正しくありません");
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    settings,
    history,
    updateSettings,
    addSessionRecord,
    exportData,
    importData,
  };
};
