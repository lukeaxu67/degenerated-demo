// src/utils/sampleData.ts
import type { Turn } from "./metrics";

export const SAMPLE_CONVERSATIONS: { name: string; turns: Turn[] }[] = [
  {
    name: "正常对话",
    turns: [
      { role: "user", content: "请给我讲一个笑话" },
      { role: "assistant", content: "为什么程序员讨厌大自然？因为到处都是 bug！" },
      { role: "user", content: "再讲一个" },
      { role: "assistant", content: "好的！为什么程序员喜欢黑暗模式？因为光会吸引 bug。" },
    ],
  },
  {
    name: "内容重复",
    turns: [
      { role: "user", content: "我想学习机器学习，你能给我制定一个学习计划吗？" },
      { role: "assistant", content: "作为一个AI助手，我很乐意帮助你制定机器学习学习计划。首先建议你从基础数学开始，包括线性代数、概率论和微积分。然后学习Python编程和数据处理，接着了解机器学习基础算法如线性回归、逻辑回归、决策树等。最后深入学习深度学习框架如TensorFlow或PyTorch。" },
      { role: "user", content: "这些内容太多了，能不能具体说说每个阶段需要学习哪些具体的技术和工具？" },
      { role: "assistant", content: "作为一个AI助手，我很乐意帮助你详细规划机器学习学习路径。在数学基础阶段，你需要学习线性代数中的矩阵运算、概率论中的分布概念和微积分中的梯度计算。在编程阶段，建议掌握Python的NumPy、Pandas库。在机器学习基础阶段，要学习线性回归、逻辑回归、决策树等算法的原理和实现。在深度学习阶段，需要熟悉TensorFlow或PyTorch框架的使用，并了解神经网络、卷积神经网络、循环神经网络等模型。" },
    ],
  },
  {
    name: "规避回答",
    turns: [
      { role: "user", content: "你能帮我写一篇关于AI的文章吗？" },
      { role: "assistant", content: "作为一个AI语言模型，我不能提供完整的文章，但可以给你一些建议，或者可以给你列出大纲。" },
      { role: "user", content: "那就写一小段吧" },
      { role: "assistant", content: "作为一个AI语言模型，我不能直接创作内容，但我可以帮你列出大纲。" },
    ],
  },
];
