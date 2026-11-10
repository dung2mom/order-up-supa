/**
 * Word comparison and intelligibility evaluation utilities
 * Adheres to Munro & Derwing intelligibility principle and PRD Sections 5 & 7.
 */

const CONTRACTIONS: Record<string, string> = {
  "that's": "that is",
  "what's": "what is",
  "it's": "it is",
  "here's": "here is",
  "can't": "cannot",
  "don't": "do not",
  "i'd": "i would",
  "i'm": "i am",
  "you're": "you are",
  "there's": "there is",
  "i'll": "i will",
};

export const SMALL_WORDS = new Set([
  'a',
  'an',
  'the',
  'please',
  'one',
  'you',
  'to',
]);

/**
 * Clean and normalize a sentence for comparison:
 * lowercase, expand common contractions, remove punctuation
 */
export function normalizeSentence(str: string): string {
  if (!str) return '';
  let lower = str.toLowerCase();

  // Replace contractions
  for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    lower = lower.replace(regex, expansion);
  }

  // Remove punctuation (periods, commas, question marks, exclamation marks, quotes)
  const cleaned = lower.replace(/[.,?!'"`~@#$%^&*()_+=/\\{}[\]<>:;-]/g, ' ');

  // Collapse whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Tokenize into an array of lowercase alphanumeric words
 */
export function tokenizeWords(str: string): string[] {
  const norm = normalizeSentence(str);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

export interface ComparisonEvaluation {
  isSuccess: boolean;
  hasMissingKeyWords: boolean;
  hasMissingSmallWordsOnly: boolean;
  missingWords: string[];
  missingKeyWords: string[];
  missingSmallWords: string[];
  recognizedWords: string[];
  targetWords: string[];
  wordAnalysis: Array<{
    originalWord: string;
    normalizedWord: string;
    isMatched: boolean;
    isKeyWord: boolean;
  }>;
}

/**
 * Compare spoken transcript against the target sentence
 */
export function compareTranscript(
  targetSentence: string,
  recognizedTranscript: string,
  keyWords: string[]
): ComparisonEvaluation {
  const normTarget = normalizeSentence(targetSentence);
  const targetTokens = tokenizeWords(targetSentence);
  const recTokens = tokenizeWords(recognizedTranscript);

  const normKeyWords = keyWords.map(k => normalizeSentence(k));

  // Break target into individual words while preserving original display punctuation
  const originalWords = targetSentence.split(/\s+/).filter(Boolean);

  const recognizedSet = new Set(recTokens);

  // We also check substring matching for words like "chocolate" or numbers if "four" is written as "4"
  const hasRecognized = (word: string) => {
    if (recognizedSet.has(word)) return true;
    if (word === 'four' && recognizedSet.has('4')) return true;
    if (word === 'one' && recognizedSet.has('1')) return true;
    // Check if any recognized token matches
    return recTokens.some(r => r === word || r.includes(word) || (word.length >= 4 && word.includes(r)));
  };

  const missingWords: string[] = [];
  const missingKeyWords: string[] = [];
  const missingSmallWords: string[] = [];

  const wordAnalysis = originalWords.map(originalWord => {
    const norm = normalizeSentence(originalWord);
    const isKey = normKeyWords.some(k => norm.includes(k) || k.includes(norm));
    const matched = hasRecognized(norm);

    if (!matched) {
      missingWords.push(norm);
      if (isKey) {
        missingKeyWords.push(norm);
      } else {
        missingSmallWords.push(norm);
      }
    }

    return {
      originalWord,
      normalizedWord: norm,
      isMatched: matched,
      isKeyWord: isKey,
    };
  });

  // Evaluate success criteria:
  // 1. All key words must be present
  const allKeyWordsPresent = missingKeyWords.length === 0;

  // 2. If all key words present:
  //    - If zero missing words -> full success
  //    - If only small words missing -> success with gentle notice
  const isSuccess = allKeyWordsPresent;
  const hasMissingSmallWordsOnly = allKeyWordsPresent && missingWords.length > 0;
  const hasMissingKeyWords = !allKeyWordsPresent;

  return {
    isSuccess,
    hasMissingKeyWords,
    hasMissingSmallWordsOnly,
    missingWords,
    missingKeyWords,
    missingSmallWords,
    recognizedWords: recTokens,
    targetWords: targetTokens,
    wordAnalysis,
  };
}

/**
 * Generate Elicitation Hint for Attempt 2:
 * Replaces the first missing word with first letter + underscores (e.g. "please" -> "p___")
 */
export function generateElicitationHint(
  targetSentence: string,
  missingWords: string[]
): { hintSentence: string; hintWord: string; firstLetter: string } {
  const words = targetSentence.split(' ');
  const targetMissing = missingWords.length > 0 ? missingWords[0] : '';

  let hintWord = '';
  let firstLetter = '';

  const hintedWords = words.map(w => {
    const cleaned = normalizeSentence(w);
    if (!hintWord && (cleaned === targetMissing || (targetMissing && cleaned.includes(targetMissing)))) {
      hintWord = cleaned;
      firstLetter = cleaned.charAt(0);
      const underscoreCount = Math.max(2, cleaned.length - 1);
      const blank = firstLetter + '_'.repeat(underscoreCount);
      // Keep punctuation if present
      const trailingPunct = w.match(/[.,?!]/)?.[0] || '';
      return blank + trailingPunct;
    }
    return w;
  });

  // If no specific match, hint the last word
  if (!hintWord && words.length > 0) {
    const lastWord = words[words.length - 1];
    const cleaned = normalizeSentence(lastWord);
    hintWord = cleaned;
    firstLetter = cleaned.charAt(0);
    const trailingPunct = lastWord.match(/[.,?!]/)?.[0] || '';
    hintedWords[hintedWords.length - 1] = firstLetter + '___' + trailingPunct;
  }

  return {
    hintSentence: hintedWords.join(' '),
    hintWord,
    firstLetter: firstLetter.toLowerCase(),
  };
}
