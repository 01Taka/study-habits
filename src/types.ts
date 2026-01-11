// src/types.ts

export type SessionPhase =
  | "IDLE" // 待機中
  | "PRE_MEDITATION" // 勉強前瞑想 (ブラウンノイズ)
  | "STUDY" // 勉強 (無音)
  | "POST_MEDITATION" // 勉強後瞑想 (無音だが開始時にアラーム)
  | "FINISHED"; // 完了 (アラーム鳴動中・手動停止待ち)

export interface TimerSettings {
  // 時間設定
  preMeditationDuration: number;
  studyDuration: number;
  postMeditationDuration: number;
  alarmDuration: number; // 勉強→後瞑想の移動時アラーム長さ

  // --- 新規追加: 音声設定 ---

  // 1. 準備瞑想 (ノイズ)
  selectedNoiseId: string;

  // 2. 準備瞑想 -> 勉強 (切り替えアラーム)
  enablePreMeditationAlarm: boolean; // 鳴らすかどうか
  selectedPreMeditationAlarmId: string; // どのアラーム音を使うか

  // 3. 勉強 -> 事後瞑想 (切り替えアラーム)
  selectedStudyEndAlarmId: string;

  // 4. 事後瞑想 -> 完了 (終了アラーム)
  selectedSessionEndAlarmId: string;
}

export interface SessionRecord {
  id: string; // UUID
  startTime: string; // ISO string
  endTime: string; // ISO string
  completed: boolean; // 完走フラグ
  // 設定変更に影響されないよう、実施時の長さを記録
  durations: {
    preMeditation: number;
    study: number;
    postMeditation: number;
  };
}

type HourKey = string; // "0" ～ "23"
type DateKey = string; // "2026-01-11"

// ヒートマップ用: 特定の日付・時間帯のセッション開始回数
export interface HeatmapData {
  // Key: YYYY-MM-DD, Value: { "0": 1, "13": 2 ... } (0-23時のカウント)
  [date: DateKey]: {
    [hour: HourKey]: number; // 回数
  };
}

export interface AnalyticsData {
  totalSessions: number;
  heatmap: HeatmapData;
  // カレンダー用: 日付ごとの回数
  calendarCounts: { [date: string]: number };
}

// 棒グラフの期間指定
export type BarChartRange = "YEAR" | "MONTH" | "LAST_7_DAYS";
