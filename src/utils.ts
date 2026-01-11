import { SessionPhase } from "./types";

// フェーズごとの色定義
export const getPhaseColor = (phase: SessionPhase) => {
  switch (phase) {
    case "PRE_MEDITATION":
      return "teal";
    case "STUDY":
      return "indigo";
    case "POST_MEDITATION":
      return "grape";
    case "FINISHED":
      return "red";
    default:
      return "gray";
  }
};

// フェーズのラベル定義
export const getPhaseLabel = (phase: SessionPhase) => {
  switch (phase) {
    case "PRE_MEDITATION":
      return "準備瞑想";
    case "STUDY":
      return "学習";
    case "POST_MEDITATION":
      return "事後瞑想";
    case "FINISHED":
      return "完了";
    default:
      return "待機中";
  }
};

export const getIntensityColor = (count: number): string => {
  if (count <= 0) return "gray.1";
  if (count === 1) return "blue.2";
  if (count === 2) return "blue.4";
  if (count <= 3) return "blue.6";
  return "blue.9"; // 頻度が高い場合
};

// 時間フォーマット (mm:ss)
export const formatTime = (seconds: number) => {
  if (seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const heatmapHours = Array.from({ length: 24 }, (_, i) => i);
