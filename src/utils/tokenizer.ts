// src/utils/tokenizer.ts
import { ready, init, cut } from "@congcongcai/jieba.js";

let jiebaReady = false;
let jiebaInitPromise: Promise<void> | null = null;

// 在 App 里调用一次
export const initJieba = () => {
  if (!jiebaInitPromise) {
    jiebaInitPromise = ready()
      .then(() => {
        init();          // 用内置词典
        jiebaReady = true;
        console.log("jieba ready")
      })
      .catch((err) => {
        console.error("初始化 jieba wasm 失败", err);
        jiebaReady = false;
      });
  }
  return jiebaInitPromise;
};

const fallbackTokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[\u3000-\u303F\uFF00-\uFFEF\s\n\r]+/g, " ")
    .split(/[\s,，。！!?？！“”'"（）()【】[\]、\\\/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

export const tokenize = (text: string): string[] => {
  if (!text?.trim()) return [];

  if (!jiebaReady) {
    // wasm 还没 ready，就先用兜底分词
    return fallbackTokenize(text);
  }

  try {
    const words = cut(text);
    return words.map((w) => w.toLowerCase().trim()).filter((w) => w.length > 0);
  } catch (err) {
    console.warn("jieba wasm 分词失败，降级到简单正则", err);
    return fallbackTokenize(text);
  }
};




// // src/utils/tokenizer.ts

// import initJiebaWasm, { cut } from "@congcongcai/jieba.js"; // 包名按实际改

// let jiebaReady = false;
// let jiebaInitPromise: Promise<void> | null = null;

// // 提供一个显式初始化函数，在 App 里调用一次
// export const initJieba = () => {
//   if (!jiebaInitPromise) {
//     jiebaInitPromise = initJiebaWasm().then(() => {
//       jiebaReady = true;
//     }).catch((err) => {
//       console.error("初始化 jieba wasm 失败", err);
//       // 初始化失败就保持 ready = false，后面一直用兜底分词
//     });
//   }
//   return jiebaInitPromise;
// };

// // 兜底：你原来的简单中文分词逻辑
// const fallbackTokenize = (text: string): string[] => {
//   return text
//     .toLowerCase()
//     .replace(/[\u3000-\u303F\uFF00-\uFFEF\s\n\r]+/g, " ") // 处理中文标点/空格
//     .split(/[\s,，。！!?？！“”'"（）()【】[\]、\\\/]+/)
//     .map((s) => s.trim())
//     .filter((s) => s.length > 0);
// };

// // 对外暴露的同步 tokenize，metrics.ts 不用改
// export const tokenize = (text: string): string[] => {
//   if (!text?.trim()) return [];

//   // wasm 还没 ready，先用兜底
//   if (!jiebaReady) {
//     return fallbackTokenize(text);
//   }

//   try {
//     const words = cut(text); // wasm 版 jieba，同步调用
//     return words
//       .map((w) => w.toLowerCase().trim())
//       .filter((w) => w.length > 0);
//   } catch (err) {
//     console.warn("jieba wasm 分词失败，降级到简单正则", err);
//     return fallbackTokenize(text);
//   }
// };

