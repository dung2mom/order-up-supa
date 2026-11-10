import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BarChart2,
  Calendar,
  Clock,
  CheckCircle2,
  Coffee,
  Mic,
  TrendingUp,
  RefreshCw,
  Award,
  UserCheck,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import { PracticeRecord } from '../types';
import { fetchPracticeRecords, computePracticeSummary } from '../lib/practiceRecords';
import { useAuth } from '../context/AuthContext';
import { DIALOGUE_DATA } from '../data/dialogue';

interface ActivitySummaryScreenProps {
  onBack: () => void;
  onStartPractice: () => void;
}

export const ActivitySummaryScreen: React.FC<ActivitySummaryScreenProps> = ({
  onBack,
  onStartPractice,
}) => {
  const { user, profile, isAuthenticated } = useAuth();
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

  const loadRecords = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const options = filterMode === 'mine' && user ? { userId: user.id } : {};
      const { records: data, error } = await fetchPracticeRecords(options);
      if (!error) {
        setRecords(data);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [filterMode, user]);

  const summary = useMemo(() => {
    return computePracticeSummary(records);
  }, [records]);

  // Format timestamp helper
  const formatDateTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      if (isNaN(date.getTime())) return timestampStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch {
      return timestampStr;
    }
  };

  return (
    <div className="flex flex-col min-h-full flex-1 w-full px-4 sm:px-7 py-5 sm:py-7 space-y-5">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between gap-3 border-b border-[#F7E7DA] pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-[#FFF3E8] text-[#7C5E54] hover:text-[#9A3412] text-xs sm:text-sm font-bold border border-[#FBD9BF] shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#EA580C]" />
          <span>뒤로가기</span>
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF1E6] text-[#9A3412] text-xs font-bold border border-[#FCD8C1]">
            <BarChart2 className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>스피킹 활동 기록 요약</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-[#431407] font-['Fredoka',sans-serif] mt-0.5">
            Activity Summary
          </h1>
        </div>

        <button
          onClick={() => loadRecords(true)}
          disabled={isRefreshing || loading}
          className="p-2 rounded-xl bg-white/90 hover:bg-[#FFF3E8] text-[#7C5E54] hover:text-[#9A3412] border border-[#FBD9BF] shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 text-[#EA580C] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* User Info & Filter */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 bg-white/90 p-3 sm:p-3.5 rounded-2xl border border-[#FBE3D0] shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FFEBD8] flex items-center justify-center text-[#EA580C] shrink-0 font-bold text-xs">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : isAuthenticated ? (
              <UserCheck className="w-4 h-4" />
            ) : (
              <UserIcon className="w-4 h-4 text-[#A89287]" />
            )}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold text-[#431407] truncate">
              {profile?.name || (isAuthenticated ? '로그인 사용자' : '게스트 연습생')}
            </p>
            <p className="text-[11px] text-[#8C7A73] truncate">
              {isAuthenticated ? profile?.email || 'Google 계정 연동됨' : 'Supabase 클라우드에 자동 기록 저장됨'}
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-1 bg-[#FFF4EB] p-1 rounded-xl border border-[#FCDAC3] text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterMode === 'all'
                  ? 'bg-[#EA580C] text-white shadow-2xs'
                  : 'text-[#8C7A73] hover:text-[#431407]'
              }`}
            >
              전체 기록
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                filterMode === 'mine'
                  ? 'bg-[#EA580C] text-white shadow-2xs'
                  : 'text-[#8C7A73] hover:text-[#431407]'
              }`}
            >
              내 기록만
            </button>
          </div>
        )}
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
        <div className="bg-white/95 rounded-2xl p-3.5 border border-[#FBE4D2] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C7A73]">
            <span className="text-[11px] font-bold uppercase tracking-wider">총 연습 횟수</span>
            <Coffee className="w-4 h-4 text-[#EA580C]" />
          </div>
          <div className="mt-2 text-left">
            <span className="text-2xl font-black text-[#431407] font-['Fredoka',sans-serif]">
              {summary.totalSessions}
            </span>
            <span className="text-xs text-[#8C7A73] ml-1">회 세션</span>
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl p-3.5 border border-[#FBE4D2] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C7A73]">
            <span className="text-[11px] font-bold uppercase tracking-wider">총 발화 탭 수</span>
            <Mic className="w-4 h-4 text-[#C2410C]" />
          </div>
          <div className="mt-2 text-left">
            <span className="text-2xl font-black text-[#C2410C] font-['Fredoka',sans-serif]">
              {summary.totalTaps}
            </span>
            <span className="text-xs text-[#8C7A73] ml-1">회 탭</span>
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl p-3.5 border border-[#FBE4D2] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C7A73]">
            <span className="text-[11px] font-bold uppercase tracking-wider">문장당 평균</span>
            <TrendingUp className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 text-left">
            <span className="text-2xl font-black text-[#0284C7] font-['Fredoka',sans-serif]">
              {summary.overallAvgTaps}
            </span>
            <span className="text-xs text-[#8C7A73] ml-1">회 / 문장</span>
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl p-3.5 border border-[#FBE4D2] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8C7A73]">
            <span className="text-[11px] font-bold uppercase tracking-wider">완료 성공률</span>
            <Award className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-2 text-left">
            <span className="text-2xl font-black text-[#16A34A] font-['Fredoka',sans-serif]">
              {summary.completionRate}%
            </span>
            <span className="text-xs text-[#8C7A73] ml-1">달성</span>
          </div>
        </div>
      </div>

      {/* Sentence-by-Sentence Tap Distribution Analysis */}
      <div className="w-full bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.05)] border border-[#FBE4D2]">
        <div className="flex items-center justify-between border-b border-[#F8E8DA] pb-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-sm font-black text-[#431407]">
              문장별 평균 스피킹 횟수 분석
            </h2>
          </div>
          <span className="text-xs text-[#8C7A73]">
            낮을수록 유창하게 발화 완료
          </span>
        </div>

        <div className="space-y-2.5">
          {DIALOGUE_DATA.map((item, idx) => {
            const key = `s${idx + 1}` as keyof typeof summary.avgBySentence;
            const avgVal = summary.avgBySentence[key] || 0;
            // Max bar width reference (e.g. 5 taps)
            const barPercent = Math.min(Math.max((avgVal / 4) * 100, 15), 100);

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-[#FFF0E2] text-[#9A3412] font-black flex items-center justify-center text-[10px] shrink-0 border border-[#FCD8C1]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#5C453E] truncate">
                      {item.targetSentence}
                    </span>
                  </div>
                  <span className="font-bold text-[#EA580C] shrink-0">
                    평균 {avgVal}회 탭
                  </span>
                </div>

                <div className="w-full bg-[#FFF5EC] h-2.5 rounded-full overflow-hidden border border-[#FCDAC3]/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#FB923C] to-[#EA580C] rounded-full transition-all duration-700"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity History Logs from Supabase */}
      <div className="w-full bg-white/95 rounded-[26px] p-4.5 sm:p-5 shadow-[0_6px_25px_rgb(251,146,60,0.05)] border border-[#FBE4D2] flex-1">
        <div className="flex items-center justify-between border-b border-[#F8E8DA] pb-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-sm font-black text-[#431407]">
              활동 기록 로그 (Timestamp 순)
            </h2>
          </div>
          <span className="text-xs font-bold text-[#9A3412] bg-[#FFF0E2] px-2.5 py-0.5 rounded-full border border-[#FCD8C1]">
            총 {records.length}건 저장됨
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#8C7A73]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#EA580C]" />
            <p className="text-xs font-semibold">Supabase에서 활동 기록을 불러오는 중…</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-bold text-[#7D665E]">아직 저장된 스피킹 활동 기록이 없습니다.</p>
            <p className="text-xs text-[#A89287]">
              스피킹 연습을 완료하면 여기에 날짜와 함께 스피킹 횟수가 자동으로 기록됩니다!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {records.map((rec, index) => (
              <div
                key={rec.id || index}
                className="p-3.5 rounded-2xl bg-[#FFFDFB] hover:bg-[#FFF9F2] border border-[#FCE6D4] transition shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#8C7A73]">
                    <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span className="font-semibold text-[#431407]">
                      {formatDateTime(rec.timestamp)}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-black text-[#EA580C] bg-[#FFF0E2] px-1.5 py-0.5 rounded-md border border-[#FCD8C1]">
                        최근 기록
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#EA580C] bg-[#FFEBD8] px-2 py-0.5 rounded-full">
                      총 {rec.total_taps}회 탭
                    </span>
                    <span className="text-xs font-bold text-[#6D544C]">
                      평균 {rec.avg_taps}회
                    </span>
                  </div>
                </div>

                {/* Per sentence breakdown */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { label: 'S1', count: rec.sentence1_taps },
                    { label: 'S2', count: rec.sentence2_taps },
                    { label: 'S3', count: rec.sentence3_taps },
                    { label: 'S4', count: rec.sentence4_taps },
                    { label: 'S5', count: rec.sentence5_taps },
                  ].map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-1.5 rounded-lg bg-white border border-[#FBD9BF] text-center"
                    >
                      <div className="text-[10px] text-[#8C7A73] font-semibold">{step.label}</div>
                      <div className="text-xs font-black text-[#C2410C]">{step.count}회</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="w-full flex flex-col gap-2.5 max-w-md mx-auto pt-2">
        <button
          onClick={onStartPractice}
          className="w-full min-h-[52px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#F97316] to-[#FB923C] hover:brightness-105 active:scale-98 text-white font-bold text-base shadow-[0_10px_25px_-5px_rgba(249,115,22,0.35)] ring-4 ring-[#FFEAD8] transition flex items-center justify-center gap-2 font-['Fredoka',sans-serif]"
        >
          <Coffee className="w-4 h-4 text-white shrink-0" />
          <span>새로운 스피킹 연습 시작하기</span>
        </button>

        <button
          onClick={onBack}
          className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-white hover:bg-[#FFF9F2] text-[#5C453E] border border-[#F8DEC9] font-bold text-sm shadow-2xs transition active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-[#9A3412]" />
          <span>이전 화면으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
