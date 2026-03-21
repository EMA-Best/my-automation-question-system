import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';
import { aiGenerateQuestionStream } from '../services/aiGenerateStream';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type AIGenerateStreamDelta = {
  event: 'page_info' | 'component';
  data: unknown;
};

/* eslint-disable no-unused-vars */
export type AIGenerateStartFn = (
  prompt: string,
  assistantPreamble?: string
) => Promise<'done' | 'aborted' | 'error'>;
/* eslint-enable no-unused-vars */

// eslint-disable-next-line no-unused-vars
export type AIGenerateDeltaHandler = (delta: AIGenerateStreamDelta) => void;

export type UseAIGenerateStreamResult = {
  generating: boolean;
  start: AIGenerateStartFn;
  stop: () => void;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  errorMessage: string;
  assistantMessageId: string;
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function useAIGenerateStream(
  onDelta?: AIGenerateDeltaHandler
): UseAIGenerateStreamResult {
  const [generating, setGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const controllerRef = useRef<AbortController | null>(null);
  const assistantMessageIdRef = useRef<string>('');
  const avgDeltaIntervalMsRef = useRef<number>(48);
  const lastDeltaTsRef = useRef<number>(0);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setGenerating(false);
  }, []);

  const start = useCallback(
    async (prompt: string, assistantPreamble?: string) => {
      setErrorMessage('');
      setGenerating(true);

      const controller = new AbortController();
      controllerRef.current = controller;

      const userId = createId('user');
      const assistantId = createId('assistant');
      assistantMessageIdRef.current = assistantId;

      // 用于保证“统一打字机效果”：不管后端一次推多少字，前端都按队列平滑输出
      const outputQueue: string[] = [];
      let backlogLength = 0;
      let currentTargetAssistantId = assistantId;
      let streamDone = false;
      let summaryInserted = false;
      let hasStructuredDelta = false;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', content: prompt },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
        },
      ]);

      avgDeltaIntervalMsRef.current = 48;
      lastDeltaTsRef.current = 0;

      const enqueueText = (text: string) => {
        if (!text) return;
        outputQueue.push(text);
        backlogLength += text.length;
      };

      const appendToAssistantMessage = (targetId: string, text: string) => {
        if (!text) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === targetId ? { ...m, content: `${m.content}${text}` } : m
          )
        );
      };

      const insertSummaryMessage = () => {
        const summaryId = createId('assistant');
        currentTargetAssistantId = summaryId;
        setMessages((prev) => [
          ...prev,
          {
            id: summaryId,
            role: 'assistant',
            content: '',
          },
        ]);
        enqueueText(
          '——\n问卷生成完毕！你可以预览确认无误后，点击「确认应用」将内容应用到画布。'
        );
      };

      // 打字机任务：统一消费 outputQueue，平滑输出
      const typewriterTask = (async () => {
        const baseChunkSize = 2;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (controller.signal.aborted) {
            throw new Error('aborted');
          }

          if (outputQueue.length === 0) {
            if (streamDone && !summaryInserted && hasStructuredDelta) {
              summaryInserted = true;
              insertSummaryMessage();
              // eslint-disable-next-line no-continue
              continue;
            }
            if (streamDone && (summaryInserted || !hasStructuredDelta)) {
              break;
            }
            // eslint-disable-next-line no-await-in-loop
            await sleep(16);
            // eslint-disable-next-line no-continue
            continue;
          }

          const current = outputQueue[0];

          const dynamicChunkSize =
            backlogLength > 900
              ? 10
              : backlogLength > 360
                ? 6
                : backlogLength > 140
                  ? 4
                  : baseChunkSize;

          const chunk = current.slice(0, dynamicChunkSize);
          const rest = current.slice(dynamicChunkSize);

          if (rest) outputQueue[0] = rest;
          else outputQueue.shift();

          backlogLength = Math.max(0, backlogLength - chunk.length);

          appendToAssistantMessage(currentTargetAssistantId, chunk);

          const interval = clamp(avgDeltaIntervalMsRef.current, 18, 120);
          const speedUp =
            backlogLength > 240 ? 0.45 : backlogLength > 90 ? 0.65 : 0.85;
          const delayMs = clamp(Math.floor(interval * speedUp), 12, 80);
          // eslint-disable-next-line no-await-in-loop
          await sleep(delayMs);
        }
      })();

      // 开场文案也进入队列，保证一致的输出节奏
      if (assistantPreamble) enqueueText(assistantPreamble);

      try {
        for await (const evt of aiGenerateQuestionStream(
          prompt,
          controller.signal
        )) {
          if (evt.event === 'assistant_delta') {
            const { textDelta } = evt.data;
            if (!textDelta) continue;

            const now = Date.now();
            const last = lastDeltaTsRef.current;
            if (last > 0) {
              const interval = now - last;
              // EMA：让“打字速度”跟随流式节奏，但别抖动太厉害
              avgDeltaIntervalMsRef.current =
                avgDeltaIntervalMsRef.current * 0.8 + interval * 0.2;
            }
            lastDeltaTsRef.current = now;

            enqueueText(textDelta);
            continue;
          }

          if (evt.event === 'page_info') {
            hasStructuredDelta = true;
            onDelta?.({ event: 'page_info', data: evt.data });
            continue;
          }

          if (evt.event === 'component') {
            hasStructuredDelta = true;
            onDelta?.({ event: 'component', data: evt.data });
            continue;
          }

          if (evt.event === 'error') {
            setErrorMessage(evt.data.message);
            streamDone = true;
            await typewriterTask;
            setGenerating(false);
            controllerRef.current = null;
            return 'error' as const;
          }

          if (evt.event === 'done') {
            streamDone = true;
            break;
          }
        }

        // 结束后等待队列全部输出（包括总结消息）
        streamDone = true;
        await typewriterTask;

        setGenerating(false);
        controllerRef.current = null;
        return 'done' as const;
      } catch (err) {
        const message = err instanceof Error ? err.message : '生成失败';
        if (controller.signal.aborted || message === 'aborted') {
          setErrorMessage('已停止生成');
          setGenerating(false);
          controllerRef.current = null;
          return 'aborted' as const;
        } else {
          setErrorMessage(message);
        }
        setGenerating(false);
        controllerRef.current = null;
        return 'error' as const;
      }
    },
    [onDelta]
  );

  return {
    generating,
    start,
    stop,
    messages,
    setMessages,
    errorMessage,
    assistantMessageId: assistantMessageIdRef.current,
  };
}
