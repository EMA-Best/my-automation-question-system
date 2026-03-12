import {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  Modal,
  Input,
  Button,
  message,
  Typography,
  Avatar,
  Spin,
  Tooltip,
} from 'antd';
import { useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';
import { ActionCreators } from 'redux-undo';
import { resetComponents } from '../../../../../store/componentsReducer';
import {
  resetPageInfo,
  PageInfoType,
} from '../../../../../store/pageInfoReducer';
import type { ComponentInfoType } from '../../../../../store/componentsReducer';
import { aiGenerateQuestionService } from '../../../../../services/question';
import { getComponentConfigByType } from '../../../../../components/QuestionComponents';
import useAIGenerateStream from '../../../../../hooks/useAIGenerateStream';
import AIGeneratePreview from './AIGeneratePreview';
import styles from './AIGenerateModal.module.scss';
import classNames from 'classnames';
import {
  CopyOutlined,
  RedoOutlined,
  RobotOutlined,
  ArrowDownOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

type AIGenerateModalProps = {
  open: boolean;
  onClose: () => void;
};

function isPlainObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input != null && !Array.isArray(input);
}

function normalizeOptionArray(
  input: unknown,
  withChecked: boolean
): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(input)) return undefined;

  const list = input
    .map((raw, idx) => {
      if (typeof raw === 'string') {
        return {
          value: `item${idx + 1}`,
          text: raw,
          ...(withChecked ? { checked: false } : {}),
        };
      }

      if (isPlainObject(raw)) {
        const value =
          typeof raw.value === 'string' ? raw.value : `item${idx + 1}`;
        const text =
          typeof raw.text === 'string'
            ? raw.text
            : typeof raw.label === 'string'
              ? raw.label
              : value;
        const checked =
          withChecked && typeof raw.checked === 'boolean' ? raw.checked : false;
        return {
          value,
          text,
          ...(withChecked ? { checked } : {}),
        };
      }

      return null;
    })
    .filter(Boolean) as Array<Record<string, unknown>>;

  return list.length > 0 ? list : undefined;
}

function mergePropsWithDefaults(params: {
  type: string;
  title: string;
  rawProps: Record<string, unknown>;
}): Record<string, unknown> {
  const { type, title, rawProps } = params;
  const componentConfig = getComponentConfigByType(type);
  if (!componentConfig) return rawProps;

  const defaultProps = componentConfig.defaultProps as unknown as Record<
    string,
    unknown
  >;
  const merged: Record<string, unknown> = { ...defaultProps, ...rawProps };

  // 常见字段别名兼容（避免命中默认值）
  if (!Object.prototype.hasOwnProperty.call(rawProps, 'title')) {
    if (typeof rawProps.label === 'string' && rawProps.label.trim()) {
      merged.title = rawProps.label;
    }
  }
  if (!Object.prototype.hasOwnProperty.call(rawProps, 'text')) {
    if (typeof rawProps.content === 'string' && rawProps.content.trim()) {
      merged.text = rawProps.content;
    }
  }

  // 将 component.title 映射到真实渲染使用的 props 字段
  if (title) {
    if (type === 'questionTitle' || type === 'questionParagraph') {
      if (!Object.prototype.hasOwnProperty.call(rawProps, 'text')) {
        merged.text = title;
      }
    } else if (type === 'questionInfo') {
      if (!Object.prototype.hasOwnProperty.call(rawProps, 'title')) {
        merged.title = title;
      }
    } else {
      if (!Object.prototype.hasOwnProperty.call(rawProps, 'title')) {
        merged.title = title;
      }
    }
  }

  // options 兜底：允许 AI 返回 string[]
  if (type === 'questionRadio') {
    const normalized = normalizeOptionArray(merged.options, false);
    if (normalized) merged.options = normalized;
  }
  if (type === 'questionCheckbox') {
    const normalized = normalizeOptionArray(merged.options, true);
    if (normalized) merged.options = normalized;
  }

  return merged;
}

function getDisplayTitle(
  type: string,
  title: string,
  props: Record<string, unknown>
) {
  if (title) return title;
  if (type === 'questionTitle' || type === 'questionParagraph') {
    return typeof props.text === 'string' && props.text ? props.text : type;
  }
  if (typeof props.title === 'string' && props.title) return props.title;
  return type;
}

function pickString(input: unknown): string {
  return typeof input === 'string' ? input : '';
}

function buildAssistantPreamble(prompt: string) {
  const topic = prompt.trim().replace(/\s+/g, ' ');
  const shortTopic = topic.length > 40 ? `${topic.slice(0, 40)}…` : topic;
  return `当然可以！我将开始为你生成一份关于「${shortTopic}」的问卷整体结构。\n`;
}

function isQuestionGenerationIntent(prompt: string) {
  const text = prompt.trim();
  if (!text) return false;
  // 生成问卷意图识别（前端）：
  // - 放宽中间描述长度，避免“生成一份关于xxx的调查问卷”被误判；
  // - 兼容“调查问卷/问卷/调查表/survey/questionnaire”关键词；
  // - 规则与后端保持一致，避免前后端行为不一致。
  return /(?:生成|创建|制作|设计|做(?:一份|个)|帮我(?:出|做)|生成一份).{0,80}?(?:调查问卷|问卷|调查表|survey|questionnaire)|(?:调查问卷|问卷|调查表|survey|questionnaire).{0,30}?(?:生成|创建|制作|设计)/i.test(
    text
  );
}

function finalizeComponentList(params: {
  pageInfo: PageInfoType;
  componentList: ComponentInfoType[];
  headerFeId: string;
}): ComponentInfoType[] {
  const { pageInfo, componentList, headerFeId } = params;

  const title = pageInfo.title?.trim() || '';
  const desc = pageInfo.desc?.trim() || '';
  if (!title && !desc) return componentList;

  const list = componentList.slice();

  // 1) 若存在与 pageInfo 对应的 questionInfo，移到最前
  const infoIdx = list.findIndex((c) => {
    if (c.type !== 'questionInfo') return false;
    const props = isPlainObject(c.props) ? c.props : {};
    const pTitle = pickString(props.title).trim();
    const pDesc = pickString(props.desc).trim();
    if (!pTitle) return false;
    if (title && pTitle !== title) return false;
    if (desc && pDesc && pDesc !== desc) return false;
    return true;
  });

  if (infoIdx === 0) return list;
  if (infoIdx > 0) {
    const header = list[infoIdx];
    return [header, ...list.slice(0, infoIdx), ...list.slice(infoIdx + 1)];
  }

  // 2) 若存在与 pageInfo.title 对应的 questionTitle，移到最前
  const titleIdx = list.findIndex((c) => {
    if (c.type !== 'questionTitle') return false;
    const props = isPlainObject(c.props) ? c.props : {};
    const text = pickString(props.text).trim();
    return title && text === title;
  });
  if (titleIdx === 0) return list;
  if (titleIdx > 0) {
    const header = list[titleIdx];
    return [header, ...list.slice(0, titleIdx), ...list.slice(titleIdx + 1)];
  }

  // 3) 兜底：插入一个 questionInfo 作为问卷头部（用于让画布结构与预览一致）
  const infoConfig = getComponentConfigByType('questionInfo');
  if (!infoConfig) return list;
  const defaultInfoProps = infoConfig.defaultProps as unknown as Record<
    string,
    unknown
  >;
  const infoProps: Record<string, unknown> = {
    ...defaultInfoProps,
    title: title || pickString(defaultInfoProps.title) || '问卷标题',
    desc: desc || pickString(defaultInfoProps.desc),
  };

  const infoComponent: ComponentInfoType = {
    fe_id: headerFeId,
    type: 'questionInfo',
    title: '问卷信息',
    props: infoProps as unknown as ComponentInfoType['props'],
  };

  return [infoComponent, ...list];
}

// 验证和清理AI返回的组件列表
function sanitizeComponentList(input: unknown): ComponentInfoType[] | null {
  if (!Array.isArray(input)) return null;

  const usedIds = new Set<string>();

  const list: ComponentInfoType[] = input
    .map((raw) => {
      if (typeof raw !== 'object' || raw == null) return null;
      const record = raw as Record<string, unknown>;

      const type = typeof record.type === 'string' ? record.type : '';
      const title = typeof record.title === 'string' ? record.title : '';
      const props =
        typeof record.props === 'object' && record.props != null
          ? (record.props as Record<string, unknown>)
          : {};

      // 验证组件类型是否存在
      const componentConfig = getComponentConfigByType(type);
      if (!componentConfig) return null;

      // 修复/去重 fe_id
      let fe_id = typeof record.fe_id === 'string' ? record.fe_id : '';
      if (!fe_id || usedIds.has(fe_id)) fe_id = nanoid();
      usedIds.add(fe_id);

      const isHidden =
        typeof record.isHidden === 'boolean' ? record.isHidden : undefined;
      const isLocked =
        typeof record.isLocked === 'boolean' ? record.isLocked : undefined;

      if (!type) return null;

      const mergedProps = mergePropsWithDefaults({
        type,
        title,
        rawProps: props,
      });
      const displayTitle = getDisplayTitle(type, title, mergedProps);

      const comp: ComponentInfoType = {
        fe_id,
        type,
        title: displayTitle,
        props: mergedProps as unknown as ComponentInfoType['props'],
        ...(isHidden != null ? { isHidden } : {}),
        ...(isLocked != null ? { isLocked } : {}),
      };

      return comp;
    })
    .filter(Boolean) as ComponentInfoType[];

  return list;
}

// 验证和清理AI返回的数据
function normalizeAIGenerateData(data: unknown): {
  pageInfo: PageInfoType;
  componentList: ComponentInfoType[];
} | null {
  if (typeof data !== 'object' || data == null) return null;

  const record = data as Record<string, unknown>;

  // 处理 pageInfo
  let pageInfo: PageInfoType;
  if (record.pageInfo && typeof record.pageInfo === 'object') {
    const pageInfoRecord = record.pageInfo as Record<string, unknown>;
    pageInfo = {
      title:
        (typeof pageInfoRecord.title === 'string'
          ? pageInfoRecord.title
          : '') || '未命名问卷',
      desc: typeof pageInfoRecord.desc === 'string' ? pageInfoRecord.desc : '',
      js: typeof pageInfoRecord.js === 'string' ? pageInfoRecord.js : '',
      css: typeof pageInfoRecord.css === 'string' ? pageInfoRecord.css : '',
      isPublished:
        typeof pageInfoRecord.isPublished === 'boolean'
          ? pageInfoRecord.isPublished
          : false,
    };
  } else {
    // 兼容扁平结构
    pageInfo = {
      title:
        (typeof record.title === 'string' ? record.title : '') || '未命名问卷',
      desc: typeof record.desc === 'string' ? record.desc : '',
      js: typeof record.js === 'string' ? record.js : '',
      css: typeof record.css === 'string' ? record.css : '',
      isPublished:
        typeof record.isPublished === 'boolean' ? record.isPublished : false,
    };
  }

  // 处理 componentList
  const componentList = sanitizeComponentList(record.componentList);
  if (!componentList) return null;

  // 返回前做一次结构修正（让标题/描述不跑到列表末尾）
  const headerFeId = nanoid();
  const finalList = finalizeComponentList({
    pageInfo,
    componentList,
    headerFeId,
  });

  return { pageInfo, componentList: finalList };
}

const AIGenerateModal: FC<AIGenerateModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');

  const [isAtBottom, setIsAtBottom] = useState(true);

  const [draft, setDraft] = useState<{
    pageInfo: PageInfoType;
    componentList: ComponentInfoType[];
  }>({
    pageInfo: {
      title: '未命名问卷',
      desc: '',
      js: '',
      css: '',
      isPublished: false,
    },
    componentList: [],
  });

  const [isDone, setIsDone] = useState(false);
  const hasAnyStreamChunkRef = useRef(false);
  const headerFeIdRef = useRef(nanoid());

  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const getIsAtBottom = useCallback((el: HTMLDivElement) => {
    const threshold = 24;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }, []);

  const syncIsAtBottom = useCallback(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    const next = getIsAtBottom(el);
    setIsAtBottom((prev) => (prev === next ? prev : next));
  }, [getIsAtBottom]);

  const scrollToBottom = useCallback(() => {
    const el = chatBodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  const handleStreamDelta = useCallback(
    (delta: { event: 'page_info' | 'component'; data: unknown }) => {
      hasAnyStreamChunkRef.current = true;

      if (delta.event === 'page_info') {
        const record =
          delta.data && typeof delta.data === 'object'
            ? (delta.data as Record<string, unknown>)
            : null;
        if (!record) return;
        setDraft((prev) => ({
          ...prev,
          pageInfo: {
            title:
              (typeof record.title === 'string'
                ? record.title
                : prev.pageInfo.title) || '未命名问卷',
            desc:
              typeof record.desc === 'string'
                ? record.desc
                : prev.pageInfo.desc,
            js: typeof record.js === 'string' ? record.js : prev.pageInfo.js,
            css:
              typeof record.css === 'string' ? record.css : prev.pageInfo.css,
            isPublished:
              typeof record.isPublished === 'boolean'
                ? record.isPublished
                : prev.pageInfo.isPublished,
          },
        }));
        return;
      }

      if (delta.event === 'component') {
        const sanitized = sanitizeComponentList([delta.data]);
        if (!sanitized || sanitized.length === 0) return;
        setDraft((prev) => {
          const usedIds = new Set(prev.componentList.map((c) => c.fe_id));
          const next = sanitized.map((c) => {
            if (!c.fe_id || usedIds.has(c.fe_id)) {
              return { ...c, fe_id: nanoid() };
            }
            usedIds.add(c.fe_id);
            return c;
          });
          return {
            ...prev,
            componentList: [...prev.componentList, ...next],
          };
        });
      }
    },
    []
  );

  const {
    generating,
    start: startStream,
    stop: stopStream,
    messages,
    setMessages,
    errorMessage,
    assistantMessageId,
  } = useAIGenerateStream(handleStreamDelta);

  const finalComponentList = useMemo(
    () =>
      finalizeComponentList({
        pageInfo: draft.pageInfo,
        componentList: draft.componentList,
        headerFeId: headerFeIdRef.current,
      }),
    [draft.pageInfo, draft.componentList]
  );

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === 'assistant') return m.id;
    }
    return '';
  }, [messages]);

  const handleCopy = useCallback(async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制');
    } catch {
      message.error('复制失败');
    }
  }, []);

  // 处理生成
  const handleGenerate = useCallback(
    async (inputText?: string) => {
      const trimmed = (inputText ?? prompt).trim();
      if (!trimmed) {
        message.warning('请输入问卷描述');
        return;
      }

      const shouldGenerateQuestion = isQuestionGenerationIntent(trimmed);

      setLastPrompt(trimmed);

      setIsDone(false);
      hasAnyStreamChunkRef.current = false;
      setDraft({
        pageInfo: {
          title: '未命名问卷',
          desc: '',
          js: '',
          css: '',
          isPublished: false,
        },
        componentList: [],
      });

      // 新一轮生成时，清空历史消息
      setMessages([]);

      try {
        const status = await startStream(
          trimmed,
          shouldGenerateQuestion ? buildAssistantPreamble(trimmed) : undefined
        );
        if (status !== 'done') {
          setIsDone(false);
          return;
        }

        if (!shouldGenerateQuestion) {
          setIsDone(false);
          message.success('回答完成');
          return;
        }

        setIsDone(true);

        // 如果后端暂未实现流式（或只返回 done），兜底走一次非流式接口
        if (!hasAnyStreamChunkRef.current) {
          const response = await aiGenerateQuestionService(trimmed);
          const normalized = normalizeAIGenerateData(response);
          if (!normalized) {
            throw new Error('AI返回的数据格式不正确，请重新生成');
          }
          setDraft(normalized);
        }

        message.success('生成完成，请预览后确认应用');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成失败，请重试';
        message.error(msg);
        setIsDone(false);
      }
    },
    [prompt, scrollToBottom, setMessages, startStream]
  );

  const handleRetry = useCallback(async () => {
    const trimmed = lastPrompt.trim();
    if (!trimmed) {
      message.warning('没有可重试的内容');
      return;
    }
    if (generating) return;
    setPrompt(trimmed);
    await handleGenerate(trimmed);
  }, [generating, handleGenerate, lastPrompt]);

  const handleStop = useCallback(() => {
    stopStream();
    setIsDone(false);
  }, [stopStream]);

  const handlePromptKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== 'Enter') return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (generating) return;
      void handleGenerate();
    },
    [generating, handleGenerate]
  );

  // 处理确认应用
  const handleConfirm = useCallback(() => {
    const { pageInfo } = draft;
    if (!isDone || finalComponentList.length === 0) {
      message.warning('请先生成完成并确保有可用组件');
      return;
    }

    const selectedId = finalComponentList[0]?.fe_id || '';

    // 更新Redux状态
    dispatch(
      resetComponents({ componentList: finalComponentList, selectedId })
    );
    dispatch(ActionCreators.clearHistory());
    dispatch(resetPageInfo(pageInfo));

    message.success('问卷已生成并应用');
    handleClose();
  }, [dispatch, draft, finalComponentList, isDone]);

  // 处理关闭
  const handleClose = useCallback(() => {
    stopStream();
    setPrompt('');
    setMessages([]);
    setIsDone(false);
    setDraft({
      pageInfo: {
        title: '未命名问卷',
        desc: '',
        js: '',
        css: '',
        isPublished: false,
      },
      componentList: [],
    });
    onClose();
  }, [onClose, setMessages, stopStream]);

  // 不自动滚动：仅在内容变更时同步“是否在底部”的状态，用于显示悬浮按钮
  useEffect(() => {
    window.requestAnimationFrame(() => {
      syncIsAtBottom();
    });
  }, [messages, generating, finalComponentList.length, syncIsAtBottom]);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      syncIsAtBottom();
    });
  }, [open, syncIsAtBottom]);

  return (
    <Modal
      title="AI生成问卷"
      open={open}
      onCancel={handleClose}
      width={980}
      footer={null}
    >
      <div className={styles.modalBody}>
        <div className={styles.left}>
          <div className={styles.chatHeader}>
            <Text strong>对话生成</Text>
            {generating ? (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                <Spin size="small" style={{ marginRight: 6 }} />
                正在生成…
              </Text>
            ) : (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {isDone ? '已完成' : '等待输入'}
              </Text>
            )}
          </div>

          <div className={styles.chatBodyWrap}>
            <div
              className={styles.chatBody}
              ref={chatBodyRef}
              onScroll={syncIsAtBottom}
            >
              {messages.length === 0 && !generating ? (
                <div className={styles.greeting}>你好，我是问卷助手小伦！</div>
              ) : null}

              {messages.map((m) => {
                const isUser = m.role === 'user';
                const rowClassName = classNames(styles.msgRow, {
                  [styles.msgRowUser]: isUser,
                  [styles.msgRowAssistant]: !isUser,
                });

                const bubbleClassName = classNames(styles.bubble, {
                  [styles.bubbleUser]: isUser,
                  [styles.bubbleAssistant]: !isUser,
                });

                return (
                  <div key={m.id} className={rowClassName}>
                    {!isUser && <Avatar size={28} icon={<RobotOutlined />} />}
                    <div className={bubbleClassName}>
                      {m.content || (generating && !isUser ? '…' : '')}
                      {!isUser &&
                      generating &&
                      m.id === lastAssistantMessageId ? (
                        <span className={styles.cursor} />
                      ) : null}

                      {!isUser ? (
                        <div className={styles.bubbleActions}>
                          <Tooltip title="复制">
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => void handleCopy(m.content)}
                            />
                          </Tooltip>
                          <Tooltip title="重试">
                            <Button
                              type="text"
                              size="small"
                              icon={<RedoOutlined />}
                              onClick={() => void handleRetry()}
                              disabled={generating}
                            />
                          </Tooltip>
                        </div>
                      ) : null}

                      {!isUser &&
                      assistantMessageId &&
                      m.id === assistantMessageId &&
                      draft.componentList.length > 0 ? (
                        <div className={styles.assistantPreview}>
                          <AIGeneratePreview
                            pageInfo={draft.pageInfo}
                            componentList={finalComponentList}
                          />
                        </div>
                      ) : null}
                    </div>
                    {isUser && <Avatar size={28} icon={<UserOutlined />} />}
                  </div>
                );
              })}
            </div>

            {!isAtBottom ? (
              <div
                className={classNames(styles.scrollToBottomWrap, {
                  [styles.scrollToBottomWrapGenerating]: generating,
                })}
              >
                <Button
                  aria-label="滚动到最新内容"
                  shape="circle"
                  className={styles.scrollToBottomButton}
                  icon={
                    <ArrowDownOutlined
                      className={classNames({
                        [styles.scrollToBottomIconGenerating]: generating,
                      })}
                    />
                  }
                  onClick={scrollToBottom}
                />
              </div>
            ) : null}
          </div>

          <div className={styles.chatFooter}>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="像 ChatGPT 一样描述需求：例如 创建一个用户满意度调查问卷…"
              rows={4}
              disabled={generating}
              onKeyDown={handlePromptKeyDown}
            />

            <div className={styles.inputActions}>
              <Text type="secondary">Ctrl + Enter 发送</Text>

              <div className={styles.actionButtons}>
                <Button
                  type="primary"
                  icon={generating ? <StopOutlined /> : <SendOutlined />}
                  onClick={
                    generating ? handleStop : () => void handleGenerate()
                  }
                  disabled={!generating && !prompt.trim()}
                >
                  {generating ? '停止' : '发送'}
                </Button>

                <Button
                  type="primary"
                  ghost
                  onClick={handleConfirm}
                  disabled={!isDone || finalComponentList.length === 0}
                >
                  确认应用
                </Button>
              </div>
            </div>
            {errorMessage ? (
              <div className={styles.error}>{errorMessage}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AIGenerateModal;
