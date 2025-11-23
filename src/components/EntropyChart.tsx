// src/components/EntropyChart.tsx
import ReactECharts from "echarts-for-react";

interface Props {
  tokens: string[];
}

export default function EntropyChart({ tokens }: Props) {
  const counts: Record<string, number> = {};
  tokens.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
  const total = tokens.length;

  const rawData = Object.entries(counts)
    .map(([token, count]) => ({
      name: token,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const top = rawData.slice(0, 60);
  const others = rawData.slice(60);
  const othersCount = others.reduce((sum, d) => sum + d.value, 0);
  const data =
    othersCount > 0
      ? [...top, { name: "其他", value: othersCount }]
      : top;

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const p = total > 0 ? params.value / total : 0;
        const probStr = p.toFixed(4);
        const percentStr = params.percent?.toFixed
          ? params.percent.toFixed(1)
          : "";
        return `${params.name}: 次数=${params.value}, p=${probStr}${
          percentStr ? `（${percentStr}%）` : ""
        }`;
      },
    },
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
