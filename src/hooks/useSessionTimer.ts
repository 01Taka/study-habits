import { useState, useRef, useEffect, useCallback } from "react";
import { SessionPhase, TimerSettings } from "../types";
import { AUDIO_LIBRARY } from "../constants";

const STORAGE_KEY_SESSION = "study_timer_session_state";

interface SavedSessionState {
  phase: SessionPhase;
  targetEndTime: number;
  startTime: string;
}

// ヘルパー: IDからパスを取得
const getNoisePath = (id: string) =>
  AUDIO_LIBRARY.noises.find((n) => n.id === id)?.path || "";

const getAlarmPath = (id: string) =>
  AUDIO_LIBRARY.alarms.find((a) => a.id === id)?.path || "";

export const useSessionTimer = (
  settings: TimerSettings,
  onSessionComplete: (completed: boolean, startTime: string) => void
) => {
  // --- State Restoration (Same as before) ---
  const [phase, setPhase] = useState<SessionPhase>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
    if (saved) {
      try {
        const parsed: SavedSessionState = JSON.parse(saved);
        if (parsed.phase !== "IDLE" && parsed.phase !== "FINISHED") {
          return parsed.phase;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return "IDLE";
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const endTimeRef = useRef<number>(0);

  // --- Audio Refs ---
  // 各役割ごとのAudioインスタンスを保持
  const noiseRef = useRef<HTMLAudioElement | null>(null);
  const preToStudyAlarmRef = useRef<HTMLAudioElement | null>(null); // New
  const studyEndAlarmRef = useRef<HTMLAudioElement | null>(null);
  const sessionEndAlarmRef = useRef<HTMLAudioElement | null>(null);

  // テスト再生用のRef（メインループと干渉させないため別で持つか、既存を使うか。今回は既存を一時利用する）

  // --- Initialization & Settings Update ---

  // Audioインスタンスの作成（初回のみ）
  useEffect(() => {
    noiseRef.current = new Audio();
    noiseRef.current.loop = true;

    preToStudyAlarmRef.current = new Audio();
    preToStudyAlarmRef.current.loop = false; // 切り替え音はループしないのが自然

    studyEndAlarmRef.current = new Audio();
    studyEndAlarmRef.current.loop = true; // 指定秒数鳴らすため

    sessionEndAlarmRef.current = new Audio();
    sessionEndAlarmRef.current.loop = true;

    return () => {
      [
        noiseRef,
        preToStudyAlarmRef,
        studyEndAlarmRef,
        sessionEndAlarmRef,
      ].forEach((ref) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = "";
        }
      });
    };
  }, []);

  // 設定変更時にソースパスを更新
  useEffect(() => {
    if (noiseRef.current)
      noiseRef.current.src = getNoisePath(settings.selectedNoiseId);
    if (preToStudyAlarmRef.current)
      preToStudyAlarmRef.current.src = getAlarmPath(
        settings.selectedPreMeditationAlarmId
      );
    if (studyEndAlarmRef.current)
      studyEndAlarmRef.current.src = getAlarmPath(
        settings.selectedStudyEndAlarmId
      );
    if (sessionEndAlarmRef.current)
      sessionEndAlarmRef.current.src = getAlarmPath(
        settings.selectedSessionEndAlarmId
      );
  }, [
    settings.selectedNoiseId,
    settings.selectedPreMeditationAlarmId,
    settings.selectedStudyEndAlarmId,
    settings.selectedSessionEndAlarmId,
  ]);

  // --- Persistent State Logic (Same as before) ---
  const phaseRef = useRef<SessionPhase>(phase);
  const settingsRef = useRef<TimerSettings>(settings);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SESSION);
    if (saved) {
      try {
        const parsed: SavedSessionState = JSON.parse(saved);
        if (parsed.phase !== "IDLE" && parsed.phase !== "FINISHED") {
          setStartTime(parsed.startTime);
          endTimeRef.current = parsed.targetEndTime;
          // 復元時の再生（ブラウザ制限で失敗する可能性あり）
          if (parsed.phase === "PRE_MEDITATION") {
            noiseRef.current?.play().catch(() => {});
          }
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === "IDLE" || phase === "FINISHED") {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } else {
      const stateToSave: SavedSessionState = {
        phase,
        targetEndTime: endTimeRef.current,
        startTime: startTime || new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(stateToSave));
    }
  }, [phase, startTime]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // --- Audio Helpers ---

  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const playAudio = (audio: HTMLAudioElement | null) => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((e) => console.log("Audio play blocked:", e));
    }
  };

  // --- Exposed Actions ---

  // 設定画面でのテスト再生用関数
  // type引数でどの音をテストするか指定
  const playTestSound = useCallback(
    (type: "noise" | "preAlarm" | "studyAlarm" | "endAlarm") => {
      let audio: HTMLAudioElement | null = null;

      switch (type) {
        case "noise":
          audio = noiseRef.current;
          break;
        case "preAlarm":
          audio = preToStudyAlarmRef.current;
          break;
        case "studyAlarm":
          audio = studyEndAlarmRef.current;
          break;
        case "endAlarm":
          audio = sessionEndAlarmRef.current;
          break;
      }

      if (audio) {
        // 既存の再生を停止してからテスト
        audio.currentTime = 0;
        audio.play().catch(() => alert("再生できません。"));
        // 3秒後に停止
        setTimeout(() => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
        }, 3000);
      }
    },
    []
  );

  const startSession = useCallback(() => {
    const nowISO = new Date().toISOString();
    setStartTime(nowISO);

    playAudio(noiseRef.current);

    setPhase("PRE_MEDITATION");
    setTimeLeft(settings.preMeditationDuration);
    endTimeRef.current = Date.now() + settings.preMeditationDuration * 1000;
  }, [settings]);

  const forceStopSession = useCallback(() => {
    stopAudio(noiseRef.current);
    stopAudio(preToStudyAlarmRef.current);
    stopAudio(studyEndAlarmRef.current);
    stopAudio(sessionEndAlarmRef.current);

    if (startTime) onSessionComplete(false, startTime);
    setPhase("IDLE");
    setStartTime(null);
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }, [startTime, onSessionComplete]);

  const manualStopAlarm = useCallback(() => {
    stopAudio(sessionEndAlarmRef.current);
    if (startTime) onSessionComplete(true, startTime);
    setPhase("IDLE");
    setStartTime(null);
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }, [startTime, onSessionComplete]);

  // --- Timer Tick ---
  useEffect(() => {
    if (phase === "IDLE" || phase === "FINISHED") return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.ceil((endTimeRef.current - now) / 1000);

      if (diff <= 0) {
        const currentPhase = phaseRef.current;
        const currentSettings = settingsRef.current;

        if (currentPhase === "PRE_MEDITATION") {
          // 1. ノイズ停止
          stopAudio(noiseRef.current);

          // 2. 切り替えアラーム（設定されていれば）
          if (currentSettings.enablePreMeditationAlarm) {
            playAudio(preToStudyAlarmRef.current);
            // 短いアラームなら放置でも良いが、念のため数秒で切るか、loop=falseにしておけば自然に止まる
            // ここでは念のため3秒後に強制停止を入れておく
            setTimeout(() => stopAudio(preToStudyAlarmRef.current), 3000);
          }

          // 3. 勉強フェーズへ
          setPhase("STUDY");
          endTimeRef.current =
            Date.now() + currentSettings.studyDuration * 1000;
        } else if (currentPhase === "STUDY") {
          // 勉強終了アラーム
          playAudio(studyEndAlarmRef.current);
          setTimeout(() => {
            stopAudio(studyEndAlarmRef.current);
          }, currentSettings.alarmDuration * 1000);

          setPhase("POST_MEDITATION");
          endTimeRef.current =
            Date.now() + currentSettings.postMeditationDuration * 1000;
        } else if (currentPhase === "POST_MEDITATION") {
          // 全行程終了アラーム
          playAudio(sessionEndAlarmRef.current);
          setPhase("FINISHED");
        }
      } else {
        setTimeLeft(diff);
      }
    };

    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [phase]);

  return {
    phase,
    timeLeft,
    startSession,
    forceStopSession,
    manualStopAlarm,
    playTestSound, // 修正: playTestAlarmから変更し汎用化
  };
};
