import { GoogleGenAI } from "@google/genai";
import { Priority } from "../types";
import { getGeminiApiKey } from "./config";

/**
 * Initialize Gemini Client
 * 
 * ⚠️ SECURITY NOTE:
 * The API key is exposed in frontend code. For production:
 * - Consider implementing a backend API proxy
 * - Set usage limits and monitoring on the API key
 * - Use a rate limiting service
 */
let ai: GoogleGenAI | null = null;

const initializeAI = (): GoogleGenAI | null => {
  if (ai) return ai;
  
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn('⚠️ Gemini API Key not configured. AI features will be disabled.');
    return null;
  }
  
  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
    return null;
  }
};

export const predictPriority = async (title: string, description: string, department: string): Promise<Priority> => {
  const aiClient = initializeAI();
  
  if (!aiClient) {
    return keywordBasedPriority(title, description);
  }

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

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim().toLowerCase();
    
    if (text?.includes('high')) {
      return Priority.HIGH;
    }
    return Priority.LOW;

  } catch (error) {
    console.warn('⚠️ Gemini Priority Prediction Failed, using keyword fallback:', error);
    return keywordBasedPriority(title, description);
  }
};

const keywordBasedPriority = (title: string, description: string): Priority => {
  const urgentKeywords = [
    'danger', 'fire', 'blood', 'accident', 'death', 'emergency',
    'shock', 'harassment', 'violence', 'assault', 'structural',
    'collapse', 'flood', 'electrical', 'child', 'elderly'
  ];
  const combinedText = (title + ' ' + description).toLowerCase();
  if (urgentKeywords.some(kw => combinedText.includes(kw))) {
    return Priority.HIGH;
  }
  return Priority.LOW;
};

export const chatWithBot = async (history: {role: 'user' | 'model', parts: string}[], message: string): Promise<string> => {
  const aiClient = initializeAI();
  
  if (!aiClient) {
    return 'AI features are currently unavailable. Please try again later or contact support.';
  }

  try {
    const chat = aiClient.chats.create({
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
    console.error('❌ Gemini Chat Failed:', error);
    return 'I am currently experiencing technical difficulties. Please try again later.';
  }
};