// src/components/NgramChart.tsx
import ReactECharts from "echarts-for-react";

interface Ngram {
  ngram: string;
  count: number;
}

interface Props {
  tokens: string[];
  n: number;
}

export default function NgramChart({ tokens, n }: Props) {
  if (tokens.length < n) return <div>长度不足，无法生成 {n}-gram</div>;

  const ngrams: Ngram[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join(" ");
    const existing = ngrams.find((g) => g.ngram === gram);
    if (existing) existing.count++;
    else ngrams.push({ ngram: gram, count: 1 });
  }

  const repeated = ngrams.filter((g) => g.count > 1);
  const data = repeated.length > 0 ? repeated : ngrams.slice(0, 15);

  const option = {
    tooltip: {},
    xAxis: { type: "value" },
    yAxis: { type: "category", data: data.map((d) => d.ngram) },
    series: [{ type: "bar", data: data.map((d) => ({ value: d.count, itemStyle: { color: d.count > 1 ? "#ff4d4f" : "#1890ff" } })) }],
  };

  return <ReactECharts option={option} style={{ height: Math.max(300, data.length * 35) }} />;
}