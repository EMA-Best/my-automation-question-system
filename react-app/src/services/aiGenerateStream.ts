import { getToken } from '../utils/user-token';

export type AIGenerateStreamEvent =
  | {
      event: 'meta';
      data: {
        requestId?: string;
        model?: string;
        startedAt?: string;
      };
    }
  | {
      event: 'assistant_delta';
      data: {
        textDelta: string;
      };
    }
  | {
      event: 'page_info';
      data: {
        title?: string;
        desc?: string;
        js?: string;
        css?: string;
        isPublished?: boolean;
      };
    }
  | {
      event: 'component';
      data: unknown;
    }
  | {
      event: 'done';
      data: {
        ok?: boolean;
      };
    }
  | {
      event: 'error';
      data: {
        message: string;
        code?: string;
      };
    }
  | {
      event: 'ping';
      data: unknown;
    };

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_BASE || 'http://localhost:3007';
const STREAM_ENDPOINT = '/api/question/ai-generate/stream';

function parseSseEventBlock(
  block: string
): { event: string; data: string } | null {
  const lines = block
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return null;

  let eventName = 'message';
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      return;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  });

  return { event: eventName, data: dataLines.join('\n') };
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return null;
  }
}

export async function* aiGenerateQuestionStream(
  prompt: string,
  signal: AbortSignal
): AsyncGenerator<AIGenerateStreamEvent, void, void> {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${STREAM_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `请求失败（${res.status}）`);
  }

  if (!res.body) {
    throw new Error('浏览器不支持流式响应');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let sepIndex = buffer.indexOf('\n\n');
    while (sepIndex >= 0) {
      const rawBlock = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const parsed = parseSseEventBlock(rawBlock);
      if (!parsed) {
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      const { event, data } = parsed;
      const json = safeJsonParse(data);

      // 允许后端直接发字符串
      if (event === 'assistant_delta') {
        if (json && typeof json === 'object') {
          const record = json as Record<string, unknown>;
          const textDelta =
            typeof record.textDelta === 'string' ? record.textDelta : '';
          if (textDelta) {
            yield { event: 'assistant_delta', data: { textDelta } };
          }
        } else if (data) {
          yield { event: 'assistant_delta', data: { textDelta: data } };
        }
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'page_info') {
        if (json && typeof json === 'object') {
          const record = json as Record<string, unknown>;
          yield {
            event: 'page_info',
            data: {
              title:
                typeof record.title === 'string' ? record.title : undefined,
              desc: typeof record.desc === 'string' ? record.desc : undefined,
              js: typeof record.js === 'string' ? record.js : undefined,
              css: typeof record.css === 'string' ? record.css : undefined,
              isPublished:
                typeof record.isPublished === 'boolean'
                  ? record.isPublished
                  : undefined,
            },
          };
        }
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'component') {
        yield { event: 'component', data: json ?? data };
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'meta') {
        if (json && typeof json === 'object') {
          const record = json as Record<string, unknown>;
          yield {
            event: 'meta',
            data: {
              requestId:
                typeof record.requestId === 'string'
                  ? record.requestId
                  : undefined,
              model:
                typeof record.model === 'string' ? record.model : undefined,
              startedAt:
                typeof record.startedAt === 'string'
                  ? record.startedAt
                  : undefined,
            },
          };
        }
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'done') {
        yield { event: 'done', data: { ok: true } };
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'error') {
        if (json && typeof json === 'object') {
          const record = json as Record<string, unknown>;
          const message =
            typeof record.message === 'string' ? record.message : '生成失败';
          const code =
            typeof record.code === 'string' ? record.code : undefined;
          yield { event: 'error', data: { message, code } };
        } else if (typeof data === 'string' && data) {
          yield { event: 'error', data: { message: data } };
        }
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      if (event === 'ping') {
        yield { event: 'ping', data: json ?? data };
        sepIndex = buffer.indexOf('\n\n');
        continue;
      }

      // 未知事件：忽略
      sepIndex = buffer.indexOf('\n\n');
    }
  }
}
