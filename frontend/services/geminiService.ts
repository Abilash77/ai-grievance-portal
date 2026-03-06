import { GoogleGenAI } from "@google/genai";
import { Priority } from "../types";

// Initialize Gemini Client
// NOTE: In a real production app, this should be proxied through a backend to hide the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictPriority = async (title: string, description: string, department: string): Promise<Priority> => {
  try {
    const prompt = `
      Analyze the following grievance complaint and assign a priority level: "High" or "Low".
      
      Context: A citizen grievance redressal portal.
      Criteria for High Priority:
      - Safety hazards (fire, electricity, structural damage)
      - Immediate health risks
      - Violence, harassment, or crime
      - Urgent water/power outages affecting large areas
      - Child or elderly welfare issues
      
      Complaint Details:
      Department: ${department}
      Title: ${title}
      Description: ${description}
      
      Respond ONLY with the word "High" or "Low".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim().toLowerCase();
    
    if (text?.includes('high')) {
      return Priority.HIGH;
    }
    return Priority.LOW;

  } catch (error) {
    console.error("Gemini Priority Prediction Failed:", error);
    // Fallback logic
    const urgentKeywords = ['danger', 'fire', 'blood', 'accident', 'death', 'emergency', 'shock', 'harassment'];
    const combinedText = (title + description).toLowerCase();
    if (urgentKeywords.some(kw => combinedText.includes(kw))) {
      return Priority.HIGH;
    }
    return Priority.LOW;
  }
};

export const chatWithBot = async (history: {role: 'user' | 'model', parts: string}[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are the helpful AI assistant for the "Grievance Redressal Portal". 
        Your role is to guide citizens on how to lodge complaints, track status, and explain the process.
        
        Key Information:
        - To lodge a complaint, go to the "Lodge Complaint" page.
        - You need a valid email and phone number.
        - You can upload text, voice notes, and images.
        - High priority issues (safety, health) are prioritized by our AI.
        - Tracking requires the "Complaint Tracking Number" (e.g., GRV-2023...).
        
        IMPORTANT:
        If the user message contains "[SYSTEM: ...]" data, this is real-time database information fetched by the system.
        You MUST use this data to answer the user's question about their complaint status. 
        Do not make up status information. If the system says "Found complaint", summarize the status details politely.
        If the system says "NOT found", inform the user that the ID seems incorrect.

        Keep answers concise, polite, and helpful.`,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }],
      })),
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I didn't catch that. Could you please rephrase?";
  } catch (error) {
    console.error("Gemini Chat Failed:", error);
    return "I am currently experiencing technical difficulties. Please try again later.";
  }
};