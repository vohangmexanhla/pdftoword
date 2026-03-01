
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzePdfPage = async (base64Image: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        },
        {
          text: `Hãy phân tích nội dung trang PDF này và trích xuất thành cấu trúc JSON để tôi có thể tạo file Word có thể chỉnh sửa tốt nhất. 
          Phân loại các phần tử thành: 'heading' (tiêu đề), 'paragraph' (đoạn văn), 'list' (danh sách), 'table' (bảng).
          Đối với 'heading', hãy cung cấp 'level' (1-3).
          Đối với 'table', hãy cung cấp mảng các hàng, mỗi hàng chứa mảng các ô văn bản.
          Đối với 'list', hãy cung cấp mảng các item.
          Lưu ý: Chỉ trả về JSON, không kèm giải thích.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                content: { type: Type.STRING },
                level: { type: Type.NUMBER },
                items: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                rows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      cells: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              required: ["type"]
            }
          }
        }
      }
    }
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result.elements || [];
  } catch (error) {
    console.error("Lỗi phân tích JSON từ Gemini:", error);
    return [];
  }
};
