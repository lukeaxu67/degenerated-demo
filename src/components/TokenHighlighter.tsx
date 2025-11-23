// src/components/TokenHighlighter.tsx
import { Space, Tag } from "antd";

interface Props {
  text: string;
  tokens: string[];
}

export default function TokenHighlighter({ text, tokens }: Props) {
  if (!tokens.length) return <div>{text}</div>;

  let index = 0;
  const elements = tokens.map((token, i) => {
    const start = text.toLowerCase().indexOf(token, index);
    const end = start + token.length;
    const before = text.slice(index, start);
    index = end;
    return (
      <span key={i}>
        {before}
        <Tag color="blue" style={{ margin: 0 }}>
          {text.slice(start, end)}
        </Tag>
      </span>
    );
  });

  return (
    <div style={{ lineHeight: "2rem", fontSize: "16px" }}>
      <Space wrap>{elements}{text.slice(index)}</Space>
    </div>
  );
}