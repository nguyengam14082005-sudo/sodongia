import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProductInfo {
  name: string;
  currentPrice: number;
  shopName: string;
  platform: string;
  imageUrl?: string;
}

export interface PricePoint {
  shop: string;
  price: number;
  isCurrent: boolean;
  url: string;
}

export interface AnalysisResult {
  product: ProductInfo;
  comparisons: PricePoint[];
  summary: string;
  recommendation: string;
}

export async function analyzeProduct(url: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Phân tích link sản phẩm TMĐT sau: ${url}
    
    Nhiệm vụ:
    1. Trích xuất thông tin sản phẩm (tên, giá hiện tại, tên shop, sàn).
    2. Tìm kiếm các sản phẩm tương tự hoặc cùng loại trên cùng sàn hoặc các sàn khác để so sánh giá.
    3. Đưa ra nhận xét về mức giá hiện tại (rẻ, trung bình, hay đắt).
    4. Tổng hợp lịch sử giá hoặc biến động giá dựa trên các shop khác nhau.

    Trả về kết quả dưới dạng JSON với cấu trúc sau:
    {
      "product": {
        "name": "Tên sản phẩm",
        "currentPrice": 150000,
        "shopName": "Tên Shop",
        "platform": "Shopee/Lazada/Tiki",
        "imageUrl": "URL ảnh nếu có"
      },
      "comparisons": [
        { "shop": "Shop A", "price": 145000, "isCurrent": false, "url": "link" },
        { "shop": "Shop B", "price": 160000, "isCurrent": false, "url": "link" }
      ],
      "summary": "Mô tả ngắn gọn về sản phẩm và thị trường giá hiện tại.",
      "recommendation": "Lời khuyên có nên mua hay không."
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { urlContext: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          product: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              currentPrice: { type: Type.NUMBER },
              shopName: { type: Type.STRING },
              platform: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
            },
            required: ["name", "currentPrice", "shopName", "platform"],
          },
          comparisons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shop: { type: Type.STRING },
                price: { type: Type.NUMBER },
                isCurrent: { type: Type.BOOLEAN },
                url: { type: Type.STRING },
              },
              required: ["shop", "price", "isCurrent"],
            },
          },
          summary: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ["product", "comparisons", "summary", "recommendation"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
