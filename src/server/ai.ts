import 'dotenv/config';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const rawKeys = [
  process.env.GEMINI_API_KEY,
  process.env.Gemini_key
].filter(Boolean).join(',');
const placeholders = [
  'MY_GEMINI_API_KEY', 
  'KEY_A', 
  'KEY_B', 
  'YOUR_KEY_HERE', 
  'YOUR_KEY_A', 
  'YOUR_KEY_B',
  'YOUR_KEY'
];

// Clean a key by stripping outer quote marks and whitespace
function cleanAndValidateKey(key: string): string {
  let cleaned = key.trim();
  // Strip starting/ending quotes if present (double or single)
  while ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

const keys = rawKeys
  .split(',')
  .map(cleanAndValidateKey)
  .filter(k => {
    if (!k) return false;
    const upperK = k.toUpperCase();
    const isPlaceholder = placeholders.some(p => upperK === p.toUpperCase() || upperK.includes(p.toUpperCase())) ||
                          upperK.includes('KEY_HERE') || 
                          upperK.includes('MY_GEMINI_API_KEY');
    return !isPlaceholder;
  });

if (keys.length === 0) {
  console.warn("[AI Request] Current configuration is in SIMULATION mode because no valid Gemini API keys are configured.");
} else {
  console.log(`[AI Request] Loaded ${keys.length} valid Gemini API key(s) for automatic rotation.`);
}

let currentKeyIndex = 0;
const badKeys = new Set<number>();

function getAI(customApiKey?: string) {
  if (customApiKey) {
    const cleaned = cleanAndValidateKey(customApiKey);
    if (cleaned) {
      return new GoogleGenAI({ 
        apiKey: cleaned,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }

  if (keys.length === 0) {
    // Return a dummy client that will fail with a clear error
    return new GoogleGenAI({ apiKey: '' });
  }

  // Find next non-bad key if possible
  let safetyCounter = 0;
  while (badKeys.has(currentKeyIndex) && safetyCounter < keys.length) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    safetyCounter++;
  }

  const key = keys[currentKeyIndex] || '';
  return new GoogleGenAI({ 
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Retries an async action with exponential backoff and rotation for specific errors.
 * Handles rate limits (429) and invalid keys (400) by rotating to next available key.
 */
async function retryWithRotation<T>(
  fn: (ai: GoogleGenAI) => Promise<T>,
  customApiKey?: string,
  maxRetries = 5,
  baseDelay = 1500,
  backoffFactor = 2
): Promise<T> {
  let activeCustomApiKey = customApiKey;

  if (!activeCustomApiKey && keys.length === 0) {
    throw new Error("No valid Gemini API key configured. Utilizing local simulation flow.");
  }

  let attempt = 0;
  let keysTriedInThisRequest = 0;

  while (true) {
    try {
      const ai = getAI(activeCustomApiKey);
      return await fn(ai);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota');
      const isInvalidKey = errorMessage.includes('400') || errorMessage.includes('API key not valid') || errorMessage.includes('INVALID_ARGUMENT');
      const isUnavailable = errorMessage.includes('503') || 
                            errorMessage.includes('UNAVAILABLE') || 
                            errorMessage.includes('temporary') || 
                            errorMessage.includes('demand') || 
                            errorMessage.includes('overloaded');

      if (activeCustomApiKey) {
        console.warn(`[AI Request] Supplied Custom API key failed with info: ${errorMessage}. Falling back to system keys...`);
        activeCustomApiKey = undefined; // Nullify custom override for next tries
        if (keys.length === 0) {
          console.warn(`[AI Request] No system keys loaded. Propagating custom key error...`);
          throw error;
        }
        // Brief pause before trying system keys
        await new Promise(r => setTimeout(r, 200));
        continue;
      }

      // 1. Rotation Logic (for quota or invalid keys)
      if (isRateLimit || isInvalidKey) {
        if (isInvalidKey && keys.length > 0) {
          console.error(`[AI Request] Key at Index ${currentKeyIndex} is INVALID. Skipping for session.`);
          badKeys.add(currentKeyIndex);
        }

        keysTriedInThisRequest++;
        if (keys.length > 1 && keysTriedInThisRequest < keys.length) {
          currentKeyIndex = (currentKeyIndex + 1) % keys.length;
          console.warn(`[AI Request] Rotating to Gemini key Index ${currentKeyIndex}...`);
          // Brief pause before trying new key
          await new Promise(r => setTimeout(r, 200));
          continue; 
        }

        // If we ran out of keys
        console.error(`[AI Request] Exhausted all ${keys.length} available keys. Final Error: ${errorMessage}`);
        throw error;
      }

      // 2. Standard Retry Logic (for temporary server errors)
      attempt++;
      if (attempt >= maxRetries || !isUnavailable) {
        console.error(`[AI Request] Permanent failure or max retries (${attempt}) reached. Error: ${errorMessage}`);
        throw error;
      }

      const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
      const jitter = Math.random() * 500;
      const totalDelay = Math.round(delay + jitter);

      console.warn(`[AI Request] Attempt ${attempt} failed (Temporary). Retrying in ${totalDelay}ms... Reason: ${errorMessage.slice(0, 100)}`);
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }
}

function getFallbackModelChain(requestedModel: string): string[] {
  const chain = [requestedModel];
  
  // Candidates in order of general availability and reliability
  const candidates = [
    'gemini-3.5-flash',       // Highly recommended basic text model from skill guidelines
    'gemini-2.5-flash',       // Secondary modern flash
    'gemini-flash-lite-latest', // Original default
    'gemini-2.1-flash'        // Past staple
  ];

  for (const cand of candidates) {
    if (!chain.includes(cand)) {
      chain.push(cand);
    }
  }

  // If pro model was chosen, try to keep pro level where possible
  if (requestedModel.includes('pro')) {
    const proCandidates = ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-3.5-flash'];
    const newChain: string[] = [];
    for (const p of proCandidates) {
      if (!newChain.includes(p)) newChain.push(p);
    }
    for (const c of chain) {
      if (!newChain.includes(c)) newChain.push(c);
    }
    return newChain;
  }

  return chain;
}

export async function generateStructured<T>(prompt: string, schema: Schema, model = "gemini-flash-lite-latest", customApiKey?: string): Promise<T> {
  const fallbackModels = getFallbackModelChain(model);
  let modelIndex = 0;

  return retryWithRotation(async (ai) => {
    while (modelIndex < fallbackModels.length) {
      const currentModel = fallbackModels[modelIndex] || model;
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.2,
          }
        });

        const text = response.text || "{}";
        try {
          return JSON.parse(text) as T;
        } catch (e) {
          console.error("Failed to parse JSON:", text);
          throw new Error("Invalid structured response from AI");
        }
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const isUnavailable = errorMessage.includes('503') || 
                              errorMessage.includes('UNAVAILABLE') || 
                              errorMessage.includes('temporary') || 
                              errorMessage.includes('demand') || 
                              errorMessage.includes('overloaded');

        if (isUnavailable && modelIndex < fallbackModels.length - 1) {
          const oldModel = currentModel;
          modelIndex++;
          console.warn(`[AI Request] Model '${oldModel}' is currently experiencing high demand. Seamlessly rotating internally to next model: '${fallbackModels[modelIndex]}' in 150ms...`);
          await new Promise(resolve => setTimeout(resolve, 150));
          continue; // Try with the newly updated modelIndex
        }
        throw error;
      }
    }
    throw new Error("All fallback models exhausted due to service unavailability.");
  }, customApiKey);
}

