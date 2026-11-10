import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Star,
  Check,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  FileSpreadsheet,
  Settings,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BarChart2,
  X,
  ExternalLink,
  Database,
} from 'lucide-react';
import { SentenceResult, GoogleSheetsPayload } from '../types';
import { DIALOGUE_DATA } from '../data/dialogue';
import { CafeIllustration } from './CafeIllustration';
import { savePracticeRecord } from '../lib/practiceRecords';
import { useAuth } from '../context/AuthContext';

const LOCAL_STORAGE_SHEETS_KEY = 'CAFE_TALK_SHEETS_URL';

// Read Web App URL from environment variable (.env.local NEXT_PUBLIC_GOOGLE_SCRIPT_URL)
const DEFAULT_SHEETS_URL: string =
  (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_SCRIPT_URL) ||
  '';

interface ResultScreenProps {
  results: Record<number, SentenceResult>;
  onStartOver: () => void;
  onPracticeSkipped: () => void;
  onViewSummary?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  results,
  onStartOver,
  onPracticeSkipped,
  onViewSummary,
}) => {
  const completedCount = Object.values(results).filter(
    (r) => r.completed && !r.skipped
  ).length;
  const skippedCount = Object.values(results).filter((r) => r.skipped).length;

  const [playingDialogueId, setPlayingDialogueId] = useState<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Google Sheets configuration state
  const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
    return (
      localStorage.getItem(LOCAL_STORAGE_SHEETS_KEY) ||
      DEFAULT_SHEETS_URL ||
      ''
    );
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>(() => {
    return (
      localStorage.getItem(LOCAL_STORAGE_SHEETS_KEY) ||
      DEFAULT_SHEETS_URL ||
      ''
    );
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [hasCopiedScript, setHasCopiedScript] = useState<boolean>(false);
  const autoSavedRef = useRef<boolean>(false);

  // Supabase activity saving state
  const { user } = useAuth();
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [supabaseMessage, setSupabaseMessage] = useState<string>('');
  const supabaseSavedRef = useRef<boolean>(false);


  // Calculate tap statistics
  const tapStats = useMemo(() => {
    const s1 = results[1]?.tapCount ?? results[1]?.attempts ?? 0;
    const s2 = results[2]?.tapCount ?? results[2]?.attempts ?? 0;
    const s3 = results[3]?.tapCount ?? results[3]?.attempts ?? 0;
    const s4 = results[4]?.tapCount ?? results[4]?.attempts ?? 0;
    const s5 = results[5]?.tapCount ?? results[5]?.attempts ?? 0;
    const total = s1 + s2 + s3 + s4 + s5;
    const avg = Number((total / 5).toFixed(2));

    return {
      s1,
      s2,
      s3,
      s4,
      s5,
      total,
      avg,
    };
  }, [results]);

  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Save to Google Sheets
  const sendDataToGoogleSheets = async (targetUrl?: string) => {
    const effectiveUrl = (targetUrl || sheetsUrl || DEFAULT_SHEETS_URL || '').trim();
    if (!effectiveUrl) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('saving');
    setSyncMessage('Saving practice tap data to Google Sheet…');


    const now = new Date();
    // e.g. "2026-10-27 17:50:00"
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const payload: GoogleSheetsPayload = {
      timestamp: timestampStr,
      sentence1: tapStats.s1,
      sentence2: tapStats.s2,
      sentence3: tapStats.s3,
      sentence4: tapStats.s4,
      sentence5: tapStats.s5,
      avg: tapStats.avg,
    };

    try {
      // 1. Try server proxy route first (avoids browser CORS constraints with Google Apps Script)
      const res = await fetch('/api/sheets/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptUrl: effectiveUrl,
          data: payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSyncStatus('success');
          setSyncMessage(`Saved successfully! (${payload.timestamp})`);
          return;
        }
      }

      // 2. Fallback to direct client-side fetch (with no-cors mode for Google Apps Script Web Apps)
      await fetch(effectiveUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setSyncStatus('success');
      setSyncMessage(`Saved to Google Sheet! (${payload.timestamp})`);
    } catch (err: unknown) {
      console.warn('Google Sheets sync error:', err);
      setSyncStatus('error');
      setSyncMessage('Failed to save to Google Sheet. Check URL permissions.');
    }
  };

  // Auto-save on page load if Web App URL exists
  useEffect(() => {
    const activeUrl = sheetsUrl || DEFAULT_SHEETS_URL;
    if (activeUrl && !autoSavedRef.current) {
      autoSavedRef.current = true;
      sendDataToGoogleSheets(activeUrl);
    }
  }, [sheetsUrl]);

  // Auto-save practice activity record to Supabase with timestamp
  useEffect(() => {
    if (!supabaseSavedRef.current) {
      supabaseSavedRef.current = true;
      setSupabaseStatus('saving');

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      savePracticeRecord({
        userId: user?.id ?? null,
        completedCount,
        sentence1Taps: tapStats.s1,
        sentence2Taps: tapStats.s2,
        sentence3Taps: tapStats.s3,
        sentence4Taps: tapStats.s4,
        sentence5Taps: tapStats.s5,
        totalTaps: tapStats.total,
        avgTaps: tapStats.avg,
        timestamp: now.toISOString(),
      }).then(({ error }) => {
        if (!error) {
          setSupabaseStatus('success');
          setSupabaseMessage(timeStr);
        } else {
          console.warn('Supabase save error:', error);
          setSupabaseStatus('error');
          setSupabaseMessage('저장 오류');
        }
      });
    }
  }, [completedCount, tapStats, user]);


  const handleSaveConfig = () => {
    const trimmed = inputUrl.trim();
    setSheetsUrl(trimmed);
    localStorage.setItem(LOCAL_STORAGE_SHEETS_KEY, trimmed);
    setIsConfigModalOpen(false);
    if (trimmed) {
      sendDataToGoogleSheets(trimmed);
    }
  };

  const handleTogglePlayRecording = (dialogueId: number, audioUrl: string) => {
    if (playingDialogueId === dialogueId && activeAudioRef.current) {
      activeAudioRef.current.pause();
      setPlayingDialogueId(null);
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    audio.onended = () => {
      setPlayingDialogueId(null);
      activeAudioRef.current = null;
    };
    audio.onerror = () => {
      setPlayingDialogueId(null);
      activeAudioRef.current = null;
    };

    audio
      .play()
      .then(() => {
        setPlayingDialogueId(dialogueId);
      })
      .catch((err) => {
        console.warn('Playback error:', err);
        setPlayingDialogueId(null);
      });
  };

  const copyGoogleAppsScript = () => {
    const scriptCode = `/**
 * Order Up! — Café Talk: Google Sheets Practice Tap Logger
 * Target Sheet Columns: timestamp, sentence1, sentence2, sentence3, sentence4, sentence5, avg
 */
function setupHeaders(sheet) {
  var headers = ["timestamp", "sentence1", "sentence2", "sentence3", "sentence4", "sentence5", "avg"];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground("#FFF3E0");
    range.setFontColor("#E65100");
    range.setFontWeight("bold");
    range.setHorizontalAlignment("center");
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    setupHeaders(sheet);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch(err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var timestamp = data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    var s1 = Number(data.sentence1 || 0);
    var s2 = Number(data.sentence2 || 0);
    var s3 = Number(data.sentence3 || 0);
    var s4 = Number(data.sentence4 || 0);
    var s5 = Number(data.sentence5 || 0);
    var avg = data.avg !== undefined ? Number(data.avg) : Number(((s1 + s2 + s3 + s4 + s5) / 5).toFixed(2));

    sheet.appendRow([timestamp, s1, s2, s3, s4, s5, avg]);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 7).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Cafe Talk Logger Ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

    navigator.clipboard.writeText(scriptCode).then(() => {
      setHasCopiedScript(true);
      setTimeout(() => setHasCopiedScript(false), 2500);
    });
  };

  let starCount = 1;
  if (completedCount === 5) {
    starCount = 3;
  } else if (completedCount >= 3) {
    starCount = 2;
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-full flex-1 w-full px-4 sm:px-7 py-6 sm:py-8 space-y-5">
      {/* Top Header - Center Aligned */}
      <div className="w-full text-center pt-1">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFF0E2] text-[#9A3412] text-xs sm:text-sm font-bold tracking-wide mb-2.5 border border-[#FCD8C1] shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#EA580C]" />
          <span>Order Complete</span>
        </div>

        <h1 className="text-fluid-title font-black text-[#431407] tracking-tight font-['Fredoka',sans-serif] leading-tight text-center">
          Thank you! Enjoy your drink! ☕
        </h1>
        <p className="text-base sm:text-lg font-semibold text-[#8C4F35] mt-1.5 text-center leading-[1.5]">
          Your warm and delicious hot chocolate is ready!
        </p>
      </div>

      {/* Middle: Stars, Completed Score & Practiced Sentences */}
      <div className="w-full flex flex-col items-center my-auto space-y-4 max-w-md">
        {/* Soft-Edge Star Rating Card */}
        <div className="w-full bg-gradient-to-br from-white via-[#FFFDFB] to-[#FFF7ED] rounded-[30px] p-5 sm:p-6 shadow-[0_10px_35px_rgb(251,146,60,0.07)] border-2 border-[#FBE3D0] text-center relative overflow-hidden">
          <div className="mb-2">
            <CafeIllustration variant="cup" size="sm" />
          </div>

          {/* 1 - 3 Stars Display */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((starIndex) => {
              const isFilled = starIndex <= starCount;
              return (
                <div
                  key={starIndex}
                  className={`transition-all duration-500 transform ${
                    isFilled ? 'scale-110' : 'scale-90 opacity-30'
                  }`}
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 ${
                      isFilled
                        ? 'fill-[#FBBF24] text-[#F59E0B] drop-shadow-[0_4px_8px_rgba(245,158,11,0.35)]'
                        : 'text-[#E5D7CD]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Completion Count Heading */}
          <p className="text-lg sm:text-xl font-black text-[#431407] text-center leading-snug">
            You completed {completedCount} out of 5 sentences!
          </p>

          {/* Left-aligned encouragement text */}
          <p className="text-left text-base sm:text-[17px] text-[#7D665E] mt-3 bg-[#FFF3E8] p-3.5 sm:p-4 rounded-2xl border border-[#FCDAC3] leading-[1.6] break-keep">
            {starCount === 3
              ? 'Outstanding! You can order like a pro at any café! 🎉'
              : starCount === 2
              ? "Great job! You're almost a master café talker! 👍"
              : 'Wonderful effort! Practice makes perfect! 👏'}
          </p>
        </div>

        {/* Practice Tap Statistics Card */}
        <div className="w-full bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.05)] border border-[#FBE4D2]">
          <div className="flex items-center justify-between gap-2 border-b border-[#F8E8DA] pb-2.5 mb-3.5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#EA580C]" />
              <h3 className="text-sm font-black text-[#8C7A73] uppercase tracking-wider">
                Practice Tap Frequency
              </h3>
            </div>
            <span className="text-xs font-bold text-[#9A3412] bg-[#FFF0E2] px-2.5 py-0.5 rounded-full border border-[#FCD8C1]">
              Average: <strong className="text-[#EA580C]">{tapStats.avg}</strong> / step
            </span>
          </div>

          {/* 5-step tap frequency visual breakdown */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3.5">
            {[
              { label: 'S1', count: tapStats.s1 },
              { label: 'S2', count: tapStats.s2 },
              { label: 'S3', count: tapStats.s3 },
              { label: 'S4', count: tapStats.s4 },
              { label: 'S5', count: tapStats.s5 },
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#FFF9F2] border border-[#FBE2CD] text-center"
              >
                <span className="text-[11px] font-bold text-[#8C7A73] uppercase">
                  {step.label}
                </span>
                <span className="text-base sm:text-lg font-black text-[#C2410C]">
                  {step.count}
                </span>
                <span className="text-[10px] text-[#A89287]">taps</span>
              </div>
            ))}
          </div>

          {/* Supabase Activity Record Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#FFF8F2] border border-[#FCDAC3] mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FFEBD8] text-[#EA580C] flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-[#431407] truncate">
                  Supabase 활동 기록
                </p>
                <p className="text-[11px] text-[#8C7A73] truncate">
                  {supabaseStatus === 'saving' && '스피킹 활동 기록 저장 중…'}
                  {supabaseStatus === 'success' && `스피킹 ${tapStats.total}회 저장 완료 (${supabaseMessage})`}
                  {supabaseStatus === 'error' && '활동 기록 저장 실패'}
                  {supabaseStatus === 'idle' && '저장 준비 중'}
                </p>
              </div>
            </div>

            {onViewSummary && (
              <button
                onClick={onViewSummary}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer shrink-0"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>요약 보기</span>
              </button>
            )}
          </div>

          {/* Google Sheets Sync Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-[#FFF8F2] border border-[#FCDAC3]">
            <div className="flex items-center gap-2 min-w-0">
              <FileSpreadsheet className="w-4 h-4 text-[#16A34A] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#431407] truncate">
                  Google Sheets Sync
                </p>
                <p className="text-[11px] text-[#8C7A73] truncate">
                  {syncStatus === 'saving' && 'Saving practice taps…'}
                  {syncStatus === 'success' && syncMessage}
                  {syncStatus === 'error' && 'Sync error. Check settings.'}
                  {syncStatus === 'idle' && (sheetsUrl ? 'Ready to sync' : 'Spreadsheet link not set')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {sheetsUrl && (
                <button
                  onClick={() => sendDataToGoogleSheets(sheetsUrl)}
                  disabled={syncStatus === 'saving'}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF3E8] border border-[#FCD8C1] text-xs font-bold text-[#9A3412] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Resend to Google Sheet"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncStatus === 'saving' ? 'animate-spin' : ''}`}
                  />
                  <span>Save</span>
                </button>
              )}
              <button
                onClick={() => {
                  setInputUrl(sheetsUrl);
                  setIsConfigModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-[#FB923C] hover:bg-[#F97316] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Configure Google Sheet Link"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{sheetsUrl ? 'Config' : 'Set Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Five Practiced Sentences List (With User Voice Playback!) */}
        <div className="w-full bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.05)] border border-[#FBE4D2]">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#F8E8DA] pb-2.5">
            <h3 className="text-sm font-black text-[#8C7A73] uppercase tracking-wider">
              Dialogue Review
            </h3>
            <span className="text-xs sm:text-sm text-[#9A3412] font-bold lowercase bg-[#FFF0E2] px-2.5 py-0.5 rounded-full border border-[#FCD8C1]">
              {completedCount}/5 completed
            </span>
          </div>

          {/* Sentence list with multi-line auto-wrap and audio playback buttons */}
          <div className="space-y-3">
            {DIALOGUE_DATA.map((item, idx) => {
              const res = results[item.id];
              const isCompleted = res?.completed && !res?.skipped;
              const hasRecording = !!res?.audioBlobUrl;
              const isPlayingThis = playingDialogueId === item.id;
              const stepTaps = res?.tapCount ?? res?.attempts ?? 0;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border text-sm flex flex-col gap-2 transition ${
                    isCompleted
                      ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                      : 'bg-[#FFF9F2] border-[#FED7AA]/80 text-[#7D665E]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#EADBCE] text-[#5C453E] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#431407] text-left text-sm sm:text-base leading-[1.5] break-keep">
                          {item.targetSentence}
                        </p>
                        <p className="text-[11px] font-semibold text-[#8C7A73] mt-0.5">
                          Taps: <strong className="text-[#EA580C] font-bold">{stepTaps}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full border border-[#BBF7D0] whitespace-nowrap">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#9A3412] bg-[#FFEDD5] px-2.5 py-1 rounded-full border border-[#FED7AA] whitespace-nowrap">
                          <span>Try Again</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Playback Button for Student's Recorded Voice */}
                  {hasRecording && (
                    <div className="flex items-center justify-between pt-1 border-t border-[#E8F5E9]/60">
                      <button
                        onClick={() => handleTogglePlayRecording(item.id, res.audioBlobUrl!)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                          isPlayingThis
                            ? 'bg-[#F97316] text-white ring-2 ring-[#FFEDD5]'
                            : 'bg-[#FFF0E2] text-[#9A3412] hover:bg-[#FFE6D4] border border-[#FCD8C1]'
                        }`}
                        title="Listen to your recording"
                      >
                        {isPlayingThis ? (
                          <>
                            <Pause className="w-3 h-3 fill-current shrink-0" />
                            <span>Playing My Voice…</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                            <span>Play My Voice</span>
                          </>
                        )}
                      </button>

                      {isPlayingThis && (
                        <div className="flex items-center gap-0.5 h-3.5 px-2">
                          <span className="w-1 h-2.5 bg-[#EA580C] rounded-full animate-bounce" />
                          <span className="w-1 h-3.5 bg-[#EA580C] rounded-full animate-bounce [animation-delay:0.15s]" />
                          <span className="w-1 h-2 bg-[#EA580C] rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Buttons - Responsive, min 50px height, text >= 16px */}
      <div className="w-full flex flex-col gap-2.5 max-w-md pt-2">
        {onViewSummary && (
          <button
            onClick={onViewSummary}
            className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#EA580C] to-[#FB923C] hover:brightness-105 active:scale-98 text-white font-black text-base shadow-[0_10px_25px_-5px_rgba(234,88,12,0.35)] ring-4 ring-[#FFEAD8] transition flex items-center justify-center gap-2 cursor-pointer font-['Fredoka',sans-serif]"
          >
            <BarChart2 className="w-4.5 h-4.5 text-white shrink-0" />
            <span>스피킹 활동 기록 요약 보기</span>
          </button>
        )}

        {skippedCount > 0 && (
          <button
            onClick={onPracticeSkipped}
            className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-white hover:bg-[#FFF9F2] text-[#9A3412] border-2 border-[#FBD9BF] font-bold text-base shadow-2xs transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>Practice Skipped Sentences</span>
          </button>
        )}

        <button
          onClick={onStartOver}
          className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-white hover:bg-[#FFF9F2] text-[#5C453E] border border-[#F8DEC9] font-bold text-sm shadow-2xs transition active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-[#9A3412] shrink-0" />
          <span>처음으로 돌아가기</span>
        </button>
      </div>

      {/* Google Sheets Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#291811]/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-[28px] p-6 shadow-2xl border-2 border-[#FCD8C1] space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#F5E5D8] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#16A34A]" />
                <h2 className="text-lg font-black text-[#431407]">
                  Google Sheets Integration
                </h2>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-1 rounded-full text-[#8C7A73] hover:text-[#431407] hover:bg-[#FFF3E8]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target columns preview */}
            <div className="bg-[#FFF9F2] p-3.5 rounded-2xl border border-[#FCDAC3] space-y-2">
              <p className="text-xs font-bold text-[#9A3412] uppercase tracking-wide">
                Target Sheet Columns (Auto-Configured)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs text-[#5C453E]">
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  timestamp
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  sentence1: {tapStats.s1}
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  sentence2: {tapStats.s2}
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  sentence3: {tapStats.s3}
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  sentence4: {tapStats.s4}
                </div>
                <div className="bg-white px-2 py-1 rounded-md border border-[#FBE3D0]">
                  sentence5: {tapStats.s5}
                </div>
                <div className="bg-[#FFF0E2] font-bold text-[#EA580C] px-2 py-1 rounded-md border border-[#FCD8C1] col-span-2">
                  avg: {tapStats.avg}
                </div>
              </div>
            </div>

            {/* Input field for Google Apps Script Web App URL */}
            <div className="space-y-1.5">
              <label
                htmlFor="sheets-url-input"
                className="block text-sm font-bold text-[#431407]"
              >
                Google Apps Script Web App URL
              </label>
              <input
                id="sheets-url-input"
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#F0D5C0] bg-[#FFFDFB] focus:outline-hidden focus:border-[#FB923C]"
              />
              <p className="text-[11px] text-[#8C7A73] leading-relaxed">
                Paste your deployed Google Apps Script Web App URL here. Practice tap frequencies and average will automatically append to your spreadsheet!
              </p>
            </div>

            {/* Instructions & Copy Apps Script Code Button */}
            <div className="bg-[#FAF5EF] p-3.5 rounded-2xl border border-[#EFE3D5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5C453E]">
                  Google Apps Script (GoogleAppsScript.gs)
                </span>
                <button
                  onClick={copyGoogleAppsScript}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#FFF3E8] border border-[#E5D7CD] text-xs font-bold text-[#9A3412] flex items-center gap-1 shadow-2xs transition"
                >
                  {hasCopiedScript ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <ol className="text-[11px] text-[#7D665E] space-y-1 list-decimal list-inside leading-relaxed">
                <li>Create a new Google Sheet (or open your existing one).</li>
                <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Paste the copied script and click <strong>Deploy &gt; New deployment</strong>.</li>
                <li>Select <strong>Web app</strong>, set access to <strong>Anyone</strong>, and copy the Web app URL.</li>
              </ol>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F5E5D8]">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#8C7A73] hover:bg-[#FFF3E8] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F97316] to-[#FB923C] text-white text-sm font-bold shadow-2xs hover:brightness-105 transition"
              >
                Save &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
