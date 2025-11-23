import { tokenize } from "./tokenizer"; // 同步！完美！
import { DEFAULT_FALLBACK_PHRASES } from "./phrases";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface PerTurnResult {
  content: string;
  tokens: string[];
  repetition_ratio: number;
  overlap_previous: number;
  fallback_hit: number;
  normalized_entropy: number;
  degeneration_score: number;
}

interface MetricResult {
  per_turn: PerTurnResult[];
  average_score: number;
  peak_score: number;
}

// ============== 工具函数放前面 ==============
const counter = (arr: string[]): Record<string, number> => {
  return arr.reduce((acc, cur) => {
    acc[cur] = (acc[cur] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

const tokenEntropy = (tokens: string[]): number => {
  if (tokens.length === 0) return 0;
  const counts = counter(tokens);
  const total = tokens.length;
  let entropy = 0;
  for (const cnt of Object.values(counts)) {
    const p = cnt / total;
    entropy -= p * Math.log2(p);
  }
  const unique = Object.keys(counts).length;
  const maxEntropy = unique > 0 ? Math.log2(unique) : 1;
  return maxEntropy === 0 ? 0 : Math.min(1, entropy / maxEntropy);
};

const repetitionRatio = (tokens: string[], n: number): number => {
  if (tokens.length < n) return 0;
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "));
  }
  const counts = counter(ngrams);
  const total = ngrams.length;
  const repeated = Object.values(counts)
    .filter((c) => c > 1)
    .reduce((a, b) => a + b, 0);
  return repeated / total;
};

const overlapWithPrevious = (curr: string[], prev: string[]): number => {
  const s1 = new Set(curr);
  const s2 = new Set(prev);
  if (s1.size === 0 || s2.size === 0) return 0;
  const inter = new Set([...s1].filter((x) => s2.has(x))).size;
  const union = s1.size + s2.size - inter;
  return inter / union;
};

const containsFallback = (text: string, phrases: string[]): boolean => {
  const lower = text.toLowerCase();
  return phrases.some((p) => lower.includes(p));
};

// ============== 主函数 ==============
export const calculateDegenerationMetric = (
  conversation: Turn[],
  ngramSize = 3,
  fallbackPhrases?: string[]
): MetricResult => {
  const phrases = fallbackPhrases || DEFAULT_FALLBACK_PHRASES;

  const assistantTurns = conversation
    .filter((t) => t.role === "assistant" && t.content?.trim())
    .map((t) => t.content.trim());

  if (assistantTurns.length === 0) {
    throw new Error("没有助手回复");
  }

  const perTurnResults: PerTurnResult[] = [];
  let prevTokens: string[] | null = null;

  for (const content of assistantTurns) {
    const tokens = tokenize(content);
    if (tokens.length === 0) continue;

    const entropyNorm = tokenEntropy(tokens);
    const repetitionRatioValue = repetitionRatio(tokens, ngramSize);
    const overlapPrev = prevTokens ? overlapWithPrevious(tokens, prevTokens) : 0;
    const fallbackHit = containsFallback(content, phrases) ? 1 : 0;

    const normalizedEntropy = 1 - entropyNorm;
    const degenerationScore = Math.min(
      1,
      (repetitionRatioValue + overlapPrev + fallbackHit + normalizedEntropy) / 4
    );

    perTurnResults.push({
      content,
      tokens,
      repetition_ratio: repetitionRatioValue,
      overlap_previous: overlapPrev,
      fallback_hit: fallbackHit,
      normalized_entropy: normalizedEntropy,
      degeneration_score: degenerationScore,
    });

    prevTokens = tokens;
  }

  if (perTurnResults.length === 0) throw new Error("所有回复均为空");

  const scores = perTurnResults.map((t) => t.degeneration_score);
  const average_score = scores.reduce((a, b) => a + b, 0) / scores.length;
  const peak_score = Math.max(...scores);

  return { per_turn: perTurnResults, average_score, peak_score };
};