/// <reference types="vite/client" />

/**
 * Centralized Environment Configuration
 * This module provides a single source of truth for all environment variables
 * across the frontend application.
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_ELEVENLABS_AGENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Get the API base URL for backend communication
 * Defaults to localhost:4000 for local development
 * In production, this should be set via environment variables in the deployment platform
 */
export const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  
  if (!url) {
    console.warn(
      '⚠️ VITE_API_URL not configured. Defaulting to http://localhost:4000\n' +
      'For production deployment, set VITE_API_URL in your environment.'
    );
    return 'http://localhost:4000';
  }
  
  // Remove trailing slash if present
  return url.replace(/\/$/, '');
};

/**
 * Get the Gemini API Key for AI features
 * This is exposed in the frontend for the chat and priority prediction features.
 * 
 * ⚠️ SECURITY WARNING:
 * API keys in frontend code are visible to all users.
 * For production, consider:
 * - Using a backend API proxy to call Gemini
 * - Setting usage limits on the API key
 * - Using a service layer pattern
 */
export const getGeminiApiKey = (): string | null => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!key) {
    console.warn(
      '⚠️ VITE_GEMINI_API_KEY not configured.\n' +
      'AI features (priority prediction, chatbot) will not work.\n' +
      'Get your key from: https://aistudio.google.com/app/apikeys'
    );
    return null;
  }
  
  return key;
};

/**
 * Get the ElevenLabs Conversational AI Agent ID
 * Create an agent at: https://elevenlabs.io/app/conversational-ai
 */
export const getElevenLabsAgentId = (): string | null => {
  const id = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  if (!id) {
    console.warn(
      '⚠️ VITE_ELEVENLABS_AGENT_ID not set.\n' +
      'Create an agent at https://elevenlabs.io/app/conversational-ai and add the ID to your .env file.'
    );
    return null;
  }
  return id;
};

/**
 * Check if we're in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

/**
 * Log configuration info (for debugging)
 */
export const logConfig = (): void => {
  if (!isProduction()) {
    console.log('📋 Config:', {
      API_BASE_URL: getApiBaseUrl(),
      GEMINI_API_KEY_SET: !!getGeminiApiKey(),
      ENVIRONMENT: isProduction() ? 'production' : 'development'
    });
  }
};
