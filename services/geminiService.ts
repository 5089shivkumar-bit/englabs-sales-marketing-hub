
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Use AI to fetch trending industrial expos specifically in India
   */
  async fetchUpcomingExpos(industry: string = "Manufacturing & 3D Printing"): Promise<any[]> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Act as an industrial event researcher. Find 6-8 major upcoming manufacturing, engineering, additive manufacturing, or machine tool expos happening in India between mid-2024 and 2026. 
                   Focus on major hubs: Pune (Auto cluster), Bengaluru (Aerospace/Tech), Delhi/NCR (General), Mumbai, Chennai, and Ahmedabad.
                   Return a clean JSON array. Each object must have: 
                   - name: Full event name
                   - date: Clear date string (e.g. Oct 12-14, 2024)
                   - location: City, State (e.g. Pune, Maharashtra)
                   - industry: Specific sub-sector (e.g. Die & Mould, AM, CNC)
                   - region: 'India'
                   - description: A brief 10-word summary of the event scale.
                   - link: A valid-looking placeholder URL if real one isn't known.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                date: { type: Type.STRING },
                location: { type: Type.STRING },
                industry: { type: Type.STRING },
                region: { type: Type.STRING },
                description: { type: Type.STRING },
                link: { type: Type.STRING }
              },
              required: ["name", "date", "location", "industry", "region", "description"]
            }
          }
        }
      });
      
      const text = response.text;
      return JSON.parse(text);
    } catch (error) {
      console.error("Error fetching expos with Gemini:", error);
      return [];
    }
  },

  /**
   * Analytics summary generator for the Indian market
   */
  async generateMarketSummary(data: any): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this Indian manufacturing sales data: ${JSON.stringify(data)}. 
                   Provide a concise 2-sentence executive summary of the performance in the Indian context and one strategic recommendation. Use INR currency terms.`,
      });
      return response.text || "Unable to generate summary.";
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Market summary currently unavailable.";
    }
  }
};
