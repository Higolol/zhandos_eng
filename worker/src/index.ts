export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

export interface Env {
  OPENROUTER_KEY: string;
  ACCESS_CODES: string;
  ALLOWED_ORIGINS?: string;
  DAILY_LIMIT_PER_CODE?: string;
  LIMITS?: KVNamespace;
}

interface FreeModelItem {
  id: string;
  name: string;
  context_length?: number;
  supported_parameters?: string[];
  pricing?: { prompt: string; completion: string };
}

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CACHE_KEY_URL = 'https://ea-proxy.internal/cache/free-models-v1';
const CACHE_TTL_SECONDS = 3600;

function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowedList = (env.ALLOWED_ORIGINS || 'https://higolol.github.io,http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin = allowedList.includes(origin) ? origin : allowedList[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Access-Code',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

async function getFreeModels(ctx?: ExecutionContext): Promise<FreeModelItem[]> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheReq = new Request(CACHE_KEY_URL, { method: 'GET' });

  if (cache) {
    const cached = await cache.match(cacheReq);
    if (cached) {
      try {
        return (await cached.json()) as FreeModelItem[];
      } catch {
        // ignore corrupted cache
      }
    }
  }

  const res = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      'User-Agent': 'English-Algorithm-Worker/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter models status ${res.status}`);
  }

  const raw = (await res.json()) as { data?: any[] };
  const list = Array.isArray(raw.data) ? raw.data : [];

  const filtered: FreeModelItem[] = list
    .filter((m) => {
      if (!m || typeof m.id !== 'string') return false;
      const isFree =
        m.pricing &&
        String(m.pricing.prompt) === '0' &&
        String(m.pricing.completion) === '0';
      return isFree;
    })
    .map((m) => ({
      id: m.id,
      name: m.name || m.id,
      context_length: m.context_length,
      supported_parameters: Array.isArray(m.supported_parameters) ? m.supported_parameters : [],
      pricing: { prompt: '0', completion: '0' },
    }));

  if (!filtered.some((m) => m.id === 'openrouter/free')) {
    filtered.push({
      id: 'openrouter/free',
      name: 'OpenRouter Free Auto-Router',
      supported_parameters: [],
      pricing: { prompt: '0', completion: '0' },
    });
  }

  if (cache) {
    const toCache = new Response(JSON.stringify(filtered), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
    const putPromise = cache.put(cacheReq, toCache);
    if (ctx) {
      ctx.waitUntil(putPromise);
    } else {
      await putPromise;
    }
  }

  return filtered;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && path === '/models') {
      try {
        const models = await getFreeModels(ctx);
        return jsonResponse(models, 200, corsHeaders);
      } catch {
        return jsonResponse({ error: 'models_unavailable' }, 502, corsHeaders);
      }
    }

    if (request.method === 'POST' && path === '/chat') {
      // 1. Проверка X-Access-Code
      const code = (request.headers.get('X-Access-Code') || '').trim();
      const validCodes = (env.ACCESS_CODES || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      if (!code || !validCodes.includes(code)) {
        return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
      }

      // Читаем тело запроса
      let body: any;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
      }

      // 3. Проверка длины messages (≤ 16 000 символов) и обрезка max_tokens ≤ 1500
      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        return jsonResponse({ error: 'missing_messages' }, 400, corsHeaders);
      }

      const totalChars = body.messages.reduce((sum: number, msg: any) => {
        const content = typeof msg?.content === 'string' ? msg.content : JSON.stringify(msg?.content ?? '');
        return sum + content.length;
      }, 0);

      if (totalChars > 16000) {
        return jsonResponse({ error: 'payload_too_large' }, 413, corsHeaders);
      }

      // 2. Проверка что model и все models[] бесплатные
      let freeModels: FreeModelItem[];
      try {
        freeModels = await getFreeModels(ctx);
      } catch {
        return jsonResponse({ error: 'models_unavailable' }, 502, corsHeaders);
      }
      const allowedIds = new Set(freeModels.map((m) => m.id));
      allowedIds.add('openrouter/free');

      const requestedModels: string[] = [];
      if (typeof body.model === 'string' && body.model.trim()) {
        requestedModels.push(body.model.trim());
      }
      if (Array.isArray(body.models)) {
        for (const m of body.models) {
          if (typeof m === 'string' && m.trim()) {
            requestedModels.push(m.trim());
          }
        }
      }

      if (requestedModels.length === 0) {
        return jsonResponse({ error: 'missing_model' }, 400, corsHeaders);
      }

      for (const reqModel of requestedModels) {
        if (!allowedIds.has(reqModel)) {
          return jsonResponse({ error: 'paid_or_unknown_model_forbidden', model: reqModel }, 400, corsHeaders);
        }
      }

      // 4. Дневной лимит по KV
      const dailyLimit = Math.max(1, parseInt(env.DAILY_LIMIT_PER_CODE || '60', 10) || 60);
      const dayIso = new Date().toISOString().slice(0, 10);
      const kvKey = `day:${dayIso}:${code}`;

      if (env.LIMITS) {
        const currentRaw = await env.LIMITS.get(kvKey);
        const currentCount = currentRaw ? parseInt(currentRaw, 10) || 0 : 0;
        if (currentCount >= dailyLimit) {
          return jsonResponse({ error: 'daily_limit' }, 429, corsHeaders);
        }
        await env.LIMITS.put(kvKey, String(currentCount + 1), {
          expirationTtl: 172800, // 48 часов
        });
      }

      // Собираем безопасный запрос в OpenRouter (без стриминга, max_tokens ≤ 1500)
      const requestedMaxTokens = typeof body.max_tokens === 'number' ? body.max_tokens : 1200;
      const clampedMaxTokens = Math.max(1, Math.min(requestedMaxTokens, 1500));

      const upstreamPayload: Record<string, unknown> = {
        messages: body.messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
        max_tokens: clampedMaxTokens,
        stream: false,
      };

      if (Array.isArray(body.models) && body.models.length > 0) {
        upstreamPayload.models = body.models;
      } else if (typeof body.model === 'string') {
        upstreamPayload.model = body.model;
      }

      if (body.response_format) {
        upstreamPayload.response_format = body.response_format;
      }

      const originHeader = request.headers.get('Origin') || 'https://higolol.github.io';

      const upstreamRes = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENROUTER_KEY}`,
          'HTTP-Referer': originHeader,
          'X-Title': 'English Algorithm Trainer',
        },
        body: JSON.stringify(upstreamPayload),
      });

      const responseText = await upstreamRes.text();
      return new Response(responseText, {
        status: upstreamRes.status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
  },
};
