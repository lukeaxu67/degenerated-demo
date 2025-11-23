// src/components/OverlapChart.tsx
import ReactECharts from "echarts-for-react";

interface Props {
  prevTokens?: string[] | null;
  currTokens: string[];
}

const buildCounter = (tokens: string[]): Record<string, number> => {
  const c: Record<string, number> = {};
  tokens.forEach((t) => {
    c[t] = (c[t] || 0) + 1;
  });
  return c;
};

export default function OverlapChart({ prevTokens, currTokens }: Props) {
  if (!prevTokens || prevTokens.length === 0) {
    return (
      <div>
        本轮是第一轮助手回复，没有上一轮对话用于计算重叠率。
        重叠率在这里被定义为两个 token 集合的 Jaccard 指数：
        <code>J(A,B) = |A ∩ B| / |A ∪ B|</code>。从第二轮开始，我们会展示具体的重叠词分布。
      </div>
    );
  }

  const prevCount = buildCounter(prevTokens);
  const currCount = buildCounter(currTokens);

  const sharedTokens = Object.keys(prevCount).filter(
    (t) => currCount[t] !== undefined
  );

  if (sharedTokens.length === 0) {
    return <div>连续两轮回复之间没有任何重复的 token，重叠率为 0。</div>;
  }

  const merged = sharedTokens
    .map((token) => ({
      token,
      prev: prevCount[token],
      curr: currCount[token],
      total: prevCount[token] + currCount[token],
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);

  const option = {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      data: ["上一轮", "本轮"],
    },
    xAxis: {
      type: "category",
      data: merged.map((d) => d.token),
      axisLabel: {
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "上一轮",
        type: "bar",
        data: merged.map((d) => d.prev),
        itemStyle: { color: "#91caff" },
      },
      {
        name: "本轮",
        type: "bar",
        data: merged.map((d) => d.curr),
        itemStyle: { color: "#ff9c6e" },
      },
    ],
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        下图展示的是连续两轮回复中重复出现的 token 频次分布（取前 30 个）。蓝色柱子对应上一轮，橙色柱子对应本轮。
      </div>
      <ReactECharts option={option} style={{ height: 320 }} />
    </div>
  );
}

