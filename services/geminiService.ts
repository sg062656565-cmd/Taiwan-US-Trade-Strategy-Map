
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  return localStorage.getItem('gemini_api_key') || "";
};

const safeGenerateContent = async (primaryModel: string, contents: any, config?: any) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  
  // Use recommended models from the @google/genai SDK
  // We'll try the primary model first, with fallback to gemini-flash-latest
  const modelsToTry = [primaryModel, 'gemini-flash-latest', 'gemini-3-flash-preview'];
  let lastError: any = null;

  // Format contents to standard format if it's a string
  const formattedContents = typeof contents === 'string' 
    ? [{ role: 'user', parts: [{ text: contents }] }] 
    : contents;

  for (const modelName of modelsToTry) {
    try {
      // ✅ Correct way per @google/genai guidelines
      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config
      });
      return { response };
    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error);
      lastError = error;
      
      const errMsg = error.message || '';
      if (
        errMsg.includes('API_KEY_INVALID') || 
        errMsg.includes('INVALID_ARGUMENT')
      ) {
        throw error;
      }
      continue; // Try next model (fallback)
    }
  }
  throw lastError;
};

export const getGeopoliticalUpdate = async () => {
  try {
    const { response } = await safeGenerateContent(
      'gemini-flash-latest',
      "請根據 2026 年最新動態，分析美國最高法院對 IEEPA 關稅違憲裁定後的貿易政策轉向（如第 122 條款 10% 附加關稅、第 301 條款針對 16 國的產能過剩調查）。請聚焦於對臺灣、中國、越南的影響。請務必使用繁體中文，格式要求：1. 使用顯眼的『小標題』。2. 使用『列點式分析』。3. 內容要深入且系統化。",
      { tools: [{ googleSearch: {} }] }
    );

    const text = response.text || "未發現近期更新。";
    const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || "",
      title: chunk.web?.title || "官方參考來源"
    })).filter((l: any) => l.uri) || [];

    return { summary: text, links };
  } catch (error: any) {
    console.error("Geopolitical Update Error:", error);
    throw error;
  }
};

export const getSupplyChainInsights = async (industry: string) => {
  try {
    const { response } = await safeGenerateContent(
      'gemini-flash-latest',
      `請針對臺灣的 ${industry} 產業，分析其在《臺美對等貿易協定》(ART) 簽署後的佈局。請聚焦於「2500 億美元對美投資」與「中國+1/洗產地規避」的風險。請提供相關參考來源。以繁體中文回答。請確保輸出包含：1. 系統性的小標題。2. 清楚的列點說明。`,
      {
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
            summary: { type: Type.STRING, description: "臺灣供應鏈戰略摘要（請使用列點與小標）" },
            sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "參考來源列表" }
          },
          required: ["shifts", "summary", "sources"]
        }
      }
    );

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Supply Chain Insights Error:", error);
    throw error;
  }
};

export const getLocalImpact = async (location: string) => {
  try {
    const { response } = await safeGenerateContent(
      'gemini-flash-latest',
      `請分析 2026 年美國第 122 條款（10% 附加關稅）對 ${location} 的在地經濟影響。請討論通膨轉嫁率、家庭支出負擔、以及能源/製造業的挑戰。請以繁體中文回答。格式要求：1. 使用「列點」形式將文字系統性整理。2. 提供清晰的小標題。3. 加入文字框感的總結。`
    );
    return response.text;
  } catch (error: any) {
    console.error("Local Impact Error:", error);
    throw error;
  }
};

export const getFuturePrediction = async (scenario: string) => {
  try {
    const { response } = await safeGenerateContent(
      'gemini-3.1-pro-preview',
      `基於 2026 年《臺美對等貿易協定》(ART) 的 2500 億投資與市場開放承諾，預測未來 5 年的地緣貿易趨勢。請提供風險評估（如臺灣產業空洞化、矽盾重估）與戰略建議。情境假設： "${scenario}"。以繁體中文回答。`
    );
    return response.text;
  } catch (error: any) {
    console.error("Future Prediction Error:", error);
    throw error;
  }
};
