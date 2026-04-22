
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  return localStorage.getItem('gemini_api_key') || process.env.API_KEY || "";
};

export const getGeopoliticalUpdate = async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "請根據 2026 年最新動態，分析美國最高法院對 IEEPA 關稅違憲裁定後的貿易政策轉向（如第 122 條款 10% 附加關稅、第 301 條款針對 16 國的產能過剩調查）。請聚焦於對臺灣、中國、越南的影響，並整理成『標題』與『列點式分析』。請使用繁體中文。",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "未發現近期更新。";
  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    uri: chunk.web?.uri || "",
    title: chunk.web?.title || "官方參考來源"
  })).filter((l: any) => l.uri) || [];

  return { summary: text, links };
};

export const getSupplyChainInsights = async (industry: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `請針對臺灣的 ${industry} 產業，分析其在《臺美對等貿易協定》(ART) 簽署後的佈局。請聚焦於「2500 億美元對美投資」與「中國+1/洗產地規避」的風險。請提供相關參考來源。以繁體中文回答。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shifts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING, description: "來源地" },
                to: { type: Type.STRING, description: "目的地" },
                value: { type: Type.STRING, description: "投資規模或影響量" },
                reason: { type: Type.STRING, description: "具體轉移或投資原因" }
              },
              required: ["from", "to", "value", "reason"]
            }
          },
          summary: { type: Type.STRING, description: "臺灣供應鏈戰略摘要" },
          sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "參考來源列表" }
        },
        required: ["shifts", "summary", "sources"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getLocalImpact = async (location: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `請分析 2026 年美國第 122 條款（10% 附加關稅）對 ${location} 的在地經濟影響。請討論通膨轉嫁率、家庭支出負擔、以及能源/製造業的挑戰。請以繁體中文回答。`,
  });
  return response.text;
};

export const getFuturePrediction = async (scenario: string) => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `基於 2026 年《臺美對等貿易協定》(ART) 的 2500 億投資與市場開放承諾，預測未來 5 年的地緣貿易趨勢。請提供風險評估（如臺灣產業空洞化、矽盾重估）與戰略建議。情境假設： "${scenario}"。以繁體中文回答。`,
    config: { thinkingConfig: { thinkingBudget: 4000 } }
  });
  return response.text;
};
