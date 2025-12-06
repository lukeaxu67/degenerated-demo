import { tokenize, stripSentencePunctuationFromTokens } from "./tokenizer";
import { DEFAULT_FALLBACK_PHRASES } from "./phrases";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface PerTurnResult {
  content: string;
  // 原始 token（包含标点，用于界面高亮展示）
  tokens: string[];
  // 去掉句读标点后的 token（用于所有统计分析：熵 / 重复率 / 重叠率）
  analysis_tokens: string[];

  // 3-gram 重复率（用于退化评分）
  repetition_ratio: number;

  // 与上一轮助手回复的 token 重叠率（Jaccard）
  overlap_previous: number;

  // 是否命中拒答模式（0/1）以及具体命中短语
  fallback_hit: number;
  fallback_matches: string[];

  // 信息熵相关指标
  entropy: number; // H(X)
  entropy_max: number; // log2(|V|)
  entropy_normalized: number; // H(X) / log2(|V|)

  // 低多样性分量：1 - entropy_normalized（作为退化特征之一）
  normalized_entropy: number;

  // 综合退化分数
  degeneration_score: number;
}

export interface MetricResult {
  per_turn: PerTurnResult[];
  average_score: number;
  peak_score: number;
}

// ============== 工具函数 ==============

const counter = (arr: string[]): Record<string, number> => {
  return arr.reduce((acc, cur) => {
    acc[cur] = (acc[cur] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

interface EntropyStats {
  entropy: number;
  maxEntropy: number;
  normalized: number;
}

const tokenEntropy = (tokens: string[]): EntropyStats => {
  if (tokens.length === 0) {
    return { entropy: 0, maxEntropy: 0, normalized: 0 };
  }

  const counts = counter(tokens);
  const total = tokens.length;

  let entropy = 0;
  for (const cnt of Object.values(counts)) {
    const p = cnt / total;
    entropy -= p * Math.log2(p);
  }

  const unique = Object.keys(counts).length;
  const maxEntropy = unique > 0 ? Math.log2(unique) : 0;
  if (maxEntropy === 0) {
    return { entropy: 0, maxEntropy: 0, normalized: 0 };
  }

  const normalized = Math.min(1, entropy / maxEntropy);
  return { entropy, maxEntropy, normalized };
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
  return total === 0 ? 0 : repeated / total;
};

const overlapWithPrevious = (curr: string[], prev: string[]): number => {
  const s1 = new Set(curr);
  const s2 = new Set(prev);
  if (s1.size === 0 || s2.size === 0) return 0;
  const inter = new Set([...s1].filter((x) => s2.has(x))).size;
  const union = s1.size + s2.size - inter;
  return union === 0 ? 0 : inter / union;
};

const collectFallbackMatches = (text: string, phrases: string[]): string[] => {
  const lower = text.toLowerCase();
  return phrases.filter((p) => p && lower.includes(p.toLowerCase()));
};

// ============== 主函数 ==============

export const calculateDegenerationMetric = (
  conversation: Turn[],
  ngramSize = 2,
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
  let prevAnalysisTokens: string[] | null = null;

  for (const content of assistantTurns) {
    const tokens = tokenize(content);
    if (tokens.length === 0) continue;

    // 去掉句读标点后再做统计分析，避免标点对熵 / 重复度和重叠率的噪声影响
    const analysis_tokens = stripSentencePunctuationFromTokens(tokens);

    const { entropy, maxEntropy, normalized } = tokenEntropy(analysis_tokens);
    const repetition_ratio = repetitionRatio(analysis_tokens, ngramSize);
    const overlap_previous = prevAnalysisTokens
      ? overlapWithPrevious(analysis_tokens, prevAnalysisTokens)
      : 0;
    const fallback_matches = collectFallbackMatches(content, phrases);
    const fallback_hit = fallback_matches.length > 0 ? 1 : 0;

    // 低多样性：熵越低，退化风险越高
    const entropy_normalized = normalized;
    const normalized_entropy = 1 - entropy_normalized;

    const degeneration_score = Math.min(
      1,
      (repetition_ratio + overlap_previous + fallback_hit + normalized_entropy) / 4
    );

    perTurnResults.push({
      content,
      tokens,
      analysis_tokens,
      repetition_ratio,
      overlap_previous,
      fallback_hit,
      fallback_matches,
      entropy,
      entropy_max: maxEntropy,
      entropy_normalized,
      normalized_entropy,
      degeneration_score,
    });

    prevAnalysisTokens = analysis_tokens;
  }

  if (perTurnResults.length === 0) throw new Error("所有回复均为空");

  const scores = perTurnResults.map((t) => t.degeneration_score);
  const average_score = scores.reduce((a, b) => a + b, 0) / scores.length;
  const peak_score = Math.max(...scores);

  return { per_turn: perTurnResults, average_score, peak_score };
};

