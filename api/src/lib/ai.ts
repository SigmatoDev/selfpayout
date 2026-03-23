import { env } from '../config/env.js';

export type AiProviderName = 'gemini' | 'openai';

export interface GenerateTextParams {
  prompt: string;
  systemPrompt?: string;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateImageParams {
  prompt: string;
  size?: '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'low' | 'medium' | 'high';
}

export interface GeneratedImageResult {
  provider: AiProviderName;
  model: string;
  mimeType: string;
  base64Data: string;
}

const parseJsonishText = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('AI provider returned an empty response');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const invalidProviderResponse = (message: string) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  return error;
};

const ensureConfigured = (provider: AiProviderName) => {
  if (provider === 'gemini' && !env.GEMINI_API_KEY) {
    const error = new Error('Gemini is not configured. Set GEMINI_API_KEY in the backend .env file.');
    error.name = 'ValidationError';
    throw error;
  }

  if (provider === 'openai' && !env.OPENAI_API_KEY) {
    const error = new Error('OpenAI is not configured. Set OPENAI_API_KEY in the backend .env file.');
    error.name = 'ValidationError';
    throw error;
  }
};

const resolveTextProvider = (): AiProviderName => env.AI_TEXT_PROVIDER ?? env.AI_PROVIDER;
const resolveImageProvider = (): AiProviderName => env.AI_IMAGE_PROVIDER ?? env.AI_PROVIDER;

const fetchJson = async (url: string, init: RequestInit) => {
  const response = await fetch(url, init);
  const text = await response.text();

  let payload: any = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null
        ? payload.error?.message ?? payload.message ?? 'AI provider request failed'
        : 'AI provider request failed';
    const error = new Error(message);
    error.name = 'ValidationError';
    throw error;
  }

  return payload;
};

const generateTextWithGemini = async (params: GenerateTextParams) => {
  ensureConfigured('gemini');

  const prompt = [params.systemPrompt, params.prompt].filter(Boolean).join('\n\n');
  const payload = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_TEXT_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: params.temperature ?? 0.4,
          maxOutputTokens: params.maxOutputTokens ?? 4096,
          ...(params.json ? { responseMimeType: 'application/json' } : {})
        }
      })
    }
  );

  const text = (payload?.candidates ?? [])
    .flatMap((candidate: any) => candidate?.content?.parts ?? [])
    .map((part: any) => part?.text)
    .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n');

  if (!text.trim()) {
    throw invalidProviderResponse('Gemini returned an empty text response');
  }

  return params.json ? parseJsonishText(text) : text;
};

const generateTextWithOpenAi = async (params: GenerateTextParams) => {
  ensureConfigured('openai');

  const input = [
    params.systemPrompt
      ? {
          role: 'system',
          content: [{ type: 'input_text', text: params.systemPrompt }]
        }
      : null,
    {
      role: 'user',
      content: [{ type: 'input_text', text: params.prompt }]
    }
  ].filter(Boolean);

  const payload = await fetchJson('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_TEXT_MODEL,
      input,
      temperature: params.temperature ?? 0.4,
      max_output_tokens: params.maxOutputTokens ?? 4096
    })
  });

  const text =
    payload?.output_text ??
    (payload?.output ?? [])
      .flatMap((item: any) => item?.content ?? [])
      .map((part: any) => part?.text)
      .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('\n');

  if (!text.trim()) {
    throw invalidProviderResponse('OpenAI returned an empty text response');
  }

  return params.json ? parseJsonishText(text) : text;
};

const generateImageWithGemini = async (params: GenerateImageParams): Promise<GeneratedImageResult> => {
  ensureConfigured('gemini');

  const payload = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }]
      })
    }
  );

  const imagePart = (payload?.candidates ?? [])
    .flatMap((candidate: any) => candidate?.content?.parts ?? [])
    .find((part: any) => typeof part?.inlineData?.data === 'string');

  if (!imagePart?.inlineData?.data) {
    const error = new Error('Gemini did not return an image');
    error.name = 'ValidationError';
    throw error;
  }

  return {
    provider: 'gemini',
    model: env.GEMINI_IMAGE_MODEL,
    mimeType: imagePart.inlineData.mimeType ?? 'image/png',
    base64Data: imagePart.inlineData.data
  };
};

const generateImageWithOpenAi = async (params: GenerateImageParams): Promise<GeneratedImageResult> => {
  ensureConfigured('openai');

  const payload = await fetchJson('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_IMAGE_MODEL,
      prompt: params.prompt,
      size: params.size ?? '1024x1024',
      quality: params.quality ?? 'low',
      response_format: 'b64_json'
    })
  });

  const image = payload?.data?.[0];
  if (!image?.b64_json) {
    const error = new Error('OpenAI did not return an image');
    error.name = 'ValidationError';
    throw error;
  }

  return {
    provider: 'openai',
    model: env.OPENAI_IMAGE_MODEL,
    mimeType: 'image/png',
    base64Data: image.b64_json
  };
};

export const generateAiText = async (params: GenerateTextParams) => {
  const provider = resolveTextProvider();
  return provider === 'gemini' ? generateTextWithGemini(params) : generateTextWithOpenAi(params);
};

export const generateAiJson = async <T>(params: GenerateTextParams): Promise<T> => {
  const text = await generateAiText({ ...params, json: true });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw invalidProviderResponse('AI provider returned invalid JSON');
  }
};

export const generateAiImage = async (params: GenerateImageParams) => {
  const provider = resolveImageProvider();
  return provider === 'gemini' ? generateImageWithGemini(params) : generateImageWithOpenAi(params);
};
