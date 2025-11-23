// src/components/EntropyChart.tsx
import ReactECharts from "echarts-for-react";

interface Props {
  tokens: string[];
}

export default function EntropyChart({ tokens }: Props) {
  const counts: Record<string, number> = {};
  tokens.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
  const total = tokens.length;

  const data = Object.entries(counts)
    .map(([token, count]) => ({
      name: token,
      value: count,
      prob: Number((count / total).toFixed(4)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 30);

  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    series: [
      {
        type: "pie",
        radius: ["30%", "70%"],
        data: data.map((d) => ({ name: d.name, value: d.value })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" } },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 300 }} />;
}