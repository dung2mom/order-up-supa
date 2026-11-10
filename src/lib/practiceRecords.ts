import { createClient } from '@/lib/supabase/client';
import { PracticeRecord } from '../types';

/**
 * Save user speaking practice activity to Supabase practice_records table
 */
export async function savePracticeRecord(data: {
  userId?: string | null;
  completedCount: number;
  sentence1Taps: number;
  sentence2Taps: number;
  sentence3Taps: number;
  sentence4Taps: number;
  sentence5Taps: number;
  totalTaps: number;
  avgTaps: number;
  timestamp?: string;
}): Promise<{ data: PracticeRecord | null; error: Error | null }> {
  try {
    const supabase = createClient();
    
    // Resolve user ID: if not passed explicitly, attempt to get currently logged-in user
    let effectiveUserId = data.userId;
    if (effectiveUserId === undefined) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveUserId = authData?.user?.id ?? null;
    }

    // Format timestamp: ISO 8601 string with local time representation
    const recordTimestamp = data.timestamp || new Date().toISOString();

    const recordPayload = {
      user_id: effectiveUserId,
      timestamp: recordTimestamp,
      completed_count: data.completedCount,
      sentence1_taps: data.sentence1Taps,
      sentence2_taps: data.sentence2Taps,
      sentence3_taps: data.sentence3Taps,
      sentence4_taps: data.sentence4Taps,
      sentence5_taps: data.sentence5Taps,
      total_taps: data.totalTaps,
      avg_taps: data.avgTaps,
    };

    const { data: inserted, error } = await supabase
      .from('practice_records')
      .insert(recordPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to save practice record to Supabase:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: inserted as PracticeRecord, error: null };
  } catch (err: any) {
    console.error('Exception in savePracticeRecord:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Fetch practice records from Supabase
 * If userId is provided, filters for that user, otherwise returns recent records
 */
export async function fetchPracticeRecords(options?: {
  userId?: string | null;
  limit?: number;
}): Promise<{ records: PracticeRecord[]; error: Error | null }> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('practice_records')
      .select('*')
      .order('timestamp', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch practice records:', error);
      return { records: [], error: new Error(error.message) };
    }

    return { records: (data as PracticeRecord[]) || [], error: null };
  } catch (err: any) {
    console.error('Exception in fetchPracticeRecords:', err);
    return { records: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Calculate aggregate summary statistics from a list of practice records
 */
export function computePracticeSummary(records: PracticeRecord[]) {
  if (records.length === 0) {
    return {
      totalSessions: 0,
      totalTaps: 0,
      overallAvgTaps: 0,
      completionRate: 0,
      avgBySentence: { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0 },
    };
  }

  const totalSessions = records.length;
  let totalTaps = 0;
  let totalCompletedSentences = 0;
  let sumS1 = 0;
  let sumS2 = 0;
  let sumS3 = 0;
  let sumS4 = 0;
  let sumS5 = 0;

  records.forEach((r) => {
    totalTaps += r.total_taps;
    totalCompletedSentences += r.completed_count;
    sumS1 += r.sentence1_taps;
    sumS2 += r.sentence2_taps;
    sumS3 += r.sentence3_taps;
    sumS4 += r.sentence4_taps;
    sumS5 += r.sentence5_taps;
  });

  const overallAvgTaps = Number((totalTaps / (totalSessions * 5)).toFixed(2));
  const completionRate = Math.round((totalCompletedSentences / (totalSessions * 5)) * 100);

  return {
    totalSessions,
    totalTaps,
    overallAvgTaps,
    completionRate,
    avgBySentence: {
      s1: Number((sumS1 / totalSessions).toFixed(1)),
      s2: Number((sumS2 / totalSessions).toFixed(1)),
      s3: Number((sumS3 / totalSessions).toFixed(1)),
      s4: Number((sumS4 / totalSessions).toFixed(1)),
      s5: Number((sumS5 / totalSessions).toFixed(1)),
    },
  };
}
