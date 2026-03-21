# AI生成问卷流式输出修改方案

## 1. 技术栈说明
- **前端**: React + TypeScript + ahooks + antd
- **后端**: NestJS + DeepSeek API
- **通信协议**: HTTP Streaming (NDJSON格式)

## 2. 整体架构设计
```
┌───────────────────────────────────────────────────────────────────┐
│                          前端组件                               │
├─────────────────────┬─────────────────────┬─────────────────────┤
│ EditAIGenerateButton │ AIGenerateModal    │ AI Service          │
└─────────────────────┴─────────────────────┴─────────────────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────┐
│                          后端API                                │
├─────────────────────┬─────────────────────┬─────────────────────┤
│ AI Controller       │ AI Service          │ DeepSeek Client     │
└─────────────────────┴─────────────────────┴─────────────────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────┐
│                         DeepSeek API                            │
└───────────────────────────────────────────────────────────────────┘
```

## 3. 前端修改方案

### 3.1 修改AI服务层 (`src/services/question.ts`)
替换现有Axios请求，实现流式请求支持：

```typescript
import { getToken } from '../utils/user-token';

// AI生成问卷 - 支持流式输出
export async function aiGenerateQuestionService(
  prompt: string,
  onChunk?: (partialData: any) => void // 流式回调函数
): Promise<any> {
  const url = `/api/question/ai-generate`;
  
  try {
    // 使用Fetch API实现流式请求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error('AI生成请求失败');
    }

    // 确保响应支持流式处理
    if (!response.body) {
      throw new Error('响应不支持流式处理');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: any = null;

    // 处理流式响应
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // 解码并拼接数据
      buffer += decoder.decode(value, { stream: true });
      
      // 按换行符分割数据（NDJSON格式）
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留最后可能不完整的行

      // 处理每一行完整的JSON数据
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const chunk = JSON.parse(line);
          
          // 根据数据类型处理
          if (chunk.type === 'final') {
            // 最终结果
            finalResult = chunk.data;
          } else if (chunk.type === 'partial') {
            // 中间结果，调用回调函数更新UI
            if (onChunk) {
              onChunk(chunk.data);
            }
          } else if (chunk.type === 'error') {
            // 错误信息
            throw new Error(chunk.message || 'AI生成过程中发生错误');
          }
        } catch (e) {
          console.error('解析流式数据失败:', e);
        }
      }
    }

    // 处理最后剩余的数据
    if (buffer.trim()) {
      try {
        const finalChunk = JSON.parse(buffer);
        if (finalChunk.type === 'final') {
          finalResult = finalChunk.data;
        }
      } catch (e) {
        console.error('解析最后一块数据失败:', e);
      }
    }

    if (!finalResult) {
      throw new Error('未获取到有效的生成结果');
    }

    return finalResult;
  } catch (error) {
    console.error('AI生成请求异常:', error);
    throw error;
  }
}
```

### 3.2 更新AI模态框组件 (`src/pages/question/Edit/EditHeader/EditAIGenerateButton/AIGenerateModal.tsx`)
修改组件以支持流式输出显示：

```typescript
import { FC, useState } from 'react';
import {
  Modal,
  Input,
  Button,
  Space,
  message,
  Typography,
  Divider,
} from 'antd';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
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

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

type AIGenerateModalProps = {
  open: boolean;
  onClose: () => void;
};

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

      const comp: ComponentInfoType = {
        fe_id,
        type,
        title: title || type,
        props: props as unknown as ComponentInfoType['props'],
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

  return { pageInfo, componentList };
}

const AIGenerateModal: FC<AIGenerateModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [partialData, setPartialData] = useState<{
    pageInfo: PageInfoType;
    componentList: ComponentInfoType[];
  } | null>(null);
  const [generatedData, setGeneratedData] = useState<{
    pageInfo: PageInfoType;
    componentList: ComponentInfoType[];
  } | null>(null);

  // 处理生成
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入问卷描述');
      return;
    }

    setGenerating(true);
    setPartialData(null);
    setGeneratedData(null);

    try {
      await aiGenerateQuestionService(prompt, (chunkData) => {
        // 处理流式返回的中间数据
        const normalized = normalizeAIGenerateData(chunkData);
        if (normalized) {
          setPartialData(normalized);
        }
      });

      message.success('生成成功，请预览后确认应用');
    } catch (error: any) {
      message.error(error?.message || '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 处理确认应用
  const handleConfirm = () => {
    const dataToApply = generatedData || partialData;
    if (!dataToApply) {
      message.warning('请先生成问卷');
      return;
    }

    const { pageInfo, componentList } = dataToApply;
    const selectedId = componentList.length > 0 ? componentList[0].fe_id : '';

    // 更新Redux状态
    dispatch(resetComponents({ componentList, selectedId }));
    dispatch(ActionCreators.clearHistory());
    dispatch(resetPageInfo(pageInfo));

    message.success('问卷已生成并应用');
    handleClose();
  };

  // 处理关闭
  const handleClose = () => {
    setPrompt('');
    setGeneratedData(null);
    setPartialData(null);
    onClose();
  };

  return (
    <Modal
      title="AI生成问卷"
      open={open}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button
          key="generate"
          type="primary"
          loading={generating}
          onClick={handleGenerate}
          disabled={!prompt.trim()}
        >
          生成问卷
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={!partialData && !generatedData}
        >
          确认应用
        </Button>,
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>描述你的问卷需求：</Text>
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：创建一个用户满意度调查问卷，包含姓名输入、满意度单选（满意/一般/不满意）、建议多行文本"
            rows={6}
            disabled={generating}
          />
        </div>

        {/* 流式生成预览 */}
        {(generating && partialData) && (
          <div>
            <Divider />
            <Text strong>生成中...</Text>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              <Paragraph>
                <Text strong>问卷标题：</Text>
                {partialData.pageInfo.title}
              </Paragraph>
              {partialData.pageInfo.desc && (
                <Paragraph>
                  <Text strong>问卷描述：</Text>
                  {partialData.pageInfo.desc}
                </Paragraph>
              )}
              <Paragraph>
                <Text strong>
                  组件列表（{partialData.componentList.length}个）：
                </Text>
              </Paragraph>
              <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                {partialData.componentList.map((comp, index) => (
                  <Text key={comp.fe_id}>
                    {index + 1}. {comp.title}（{comp.type}）
                  </Text>
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* 最终结果预览 */}
        {(!generating && generatedData) && (
          <div>
            <Divider />
            <Text strong>预览：</Text>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              <Paragraph>
                <Text strong>问卷标题：</Text>
                {generatedData.pageInfo.title}
              </Paragraph>
              {generatedData.pageInfo.desc && (
                <Paragraph>
                  <Text strong>问卷描述：</Text>
                  {generatedData.pageInfo.desc}
                </Paragraph>
              )}
              <Paragraph>
                <Text strong>
                  组件列表（{generatedData.componentList.length}个）：
                </Text>
              </Paragraph>
              <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                {generatedData.componentList.map((comp, index) => (
                  <Text key={comp.fe_id}>
                    {index + 1}. {comp.title}（{comp.type}）
                  </Text>
                ))}
              </Space>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default AIGenerateModal;
```

### 3.3 更新按钮组件 (`src/pages/question/Edit/EditHeader/EditAIGenerateButton/index.tsx`)
该组件无需修改，保持原样即可：

```typescript
import { FC, useState } from 'react';
import { Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import AIGenerateModal from './AIGenerateModal';

const EditAIGenerateButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button icon={<RobotOutlined />} onClick={() => setModalOpen(true)}>
        AI生成
      </Button>
      <AIGenerateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default EditAIGenerateButton;
```

## 4. 后端修改方案

### 4.1 创建DeepSeek客户端服务
首先，我们需要创建一个DeepSeek API客户端服务：

```typescript
// src/ai/deepseek/deepseek.client.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class DeepSeekClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1';
  }

  /**
   * 流式调用DeepSeek API
   */
  async streamChatCompletion(
    prompt: string,
    onChunk: (chunk: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的问卷生成专家。请根据用户需求生成一份完整的问卷，包含问卷标题、描述和组件列表。返回格式必须是JSON，包含pageInfo和componentList字段。pageInfo包含title和desc字段；componentList是组件数组，每个组件包含type、title和props字段。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true, // 启用流式输出
      response_format: { type: 'json_object' }
    };

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // 按换行符分割数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          // 移除开头的 "data: "
          const dataStr = line.startsWith('data: ') ? line.slice(6) : line;
          
          if (dataStr === '[DONE]') {
            onComplete();
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content;
            
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('解析DeepSeek响应失败:', e);
          }
        }
      });

      res.on('end', () => {
        // 处理最后的缓冲数据
        if (buffer.trim()) {
          const dataStr = buffer.startsWith('data: ') ? buffer.slice(6) : buffer;
          if (dataStr !== '[DONE]') {
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('解析最后一块数据失败:', e);
            }
          }
        }
        onComplete();
      });
    });

    req.on('error', (e) => {
      onError(e);
    });

    req.write(JSON.stringify(requestBody));
    req.end();
  }
}
```

### 4.2 创建AI服务层
创建AI服务层处理生成逻辑：

```typescript
// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { DeepSeekClient } from './deepseek/deepseek.client';

@Injectable()
export class AiService {
  constructor(private readonly deepSeekClient: DeepSeekClient) {}

  /**
   * 生成问卷（流式）
   */
  async generateQuestionnaireStream(
    prompt: string,
    onChunk: (partialData: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let accumulatedResponse = '';

    const handleChunk = (content: string) => {
      accumulatedResponse += content;
      
      try {
        // 尝试解析当前累积的响应
        const parsed = JSON.parse(accumulatedResponse);
        
        // 发送部分数据
        onChunk({
          type: 'partial',
          data: parsed
        });
      } catch (e) {
        // 解析失败，继续累积
        // 这是正常的，因为流式返回的是部分JSON
      }
    };

    const handleComplete = () => {
      try {
        // 最终解析完整响应
        const finalData = JSON.parse(accumulatedResponse);
        
        // 发送最终结果
        onChunk({
          type: 'final',
          data: finalData
        });
        
        onComplete();
      } catch (e) {
        onError(new Error('生成结果解析失败'));
      }
    };

    await this.deepSeekClient.streamChatCompletion(
      prompt,
      handleChunk,
      handleComplete,
      onError
    );
  }
}
```

### 4.3 创建AI控制器
创建控制器处理HTTP请求并返回流式响应：

```typescript
// src/question/ai/ai.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../../ai/ai.service';

@Controller('api/question')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ai-generate')
  async generateQuestionnaire(
    @Body() body: { prompt: string },
    @Res() res: Response
  ): Promise<void> {
    const { prompt } = body;
    
    if (!prompt) {
      res.status(400).json({ errno: 1, msg: '缺少prompt参数' });
      return;
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 处理生成过程
    await this.aiService.generateQuestionnaireStream(
      prompt,
      (chunk) => {
        // 发送NDJSON格式的数据块
        res.write(JSON.stringify(chunk) + '\n');
      },
      () => {
        // 生成完成，结束响应
        res.end();
      },
      (error) => {
        // 发送错误信息
        res.write(JSON.stringify({
          type: 'error',
          message: error.message
        }) + '\n');
        res.end();
      }
    );
  }
}
```

### 4.4 注册模块和服务
更新模块配置，注册新创建的服务和控制器：

```typescript
// src/question/question.module.ts
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AiController } from './ai/ai.controller';

@Module({
  imports: [AiModule],
  controllers: [AiController]
})
export class QuestionModule {}

// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { DeepSeekClient } from './deepseek/deepseek.client';
import { AiService } from './ai.service';

@Module({
  providers: [DeepSeekClient, AiService],
  exports: [AiService]
})
export class AiModule {}
```

## 5. 通信协议规范
### 5.1 NDJSON格式说明
- 每个数据块独立成行，以换行符分隔
- 每个数据块包含`type`字段区分数据类型
- 支持三种数据类型：
  ```json
  // 中间结果
  {"type":"partial","data":{"pageInfo":{"title":"...","desc":"..."},"componentList":[...]}}
  
  // 最终结果
  {"type":"final","data":{"pageInfo":{"title":"...","desc":"..."},"componentList":[...]}}
  
  // 错误信息
  {"type":"error","message":"生成失败"}
  ```

## 6. 错误处理机制
1. **前端错误处理**：
   - 网络错误：显示"网络连接失败"提示
   - 解析错误：显示"生成结果格式错误"提示
   - 超时错误：显示"生成超时"提示

2. **后端错误处理**：
   - DeepSeek API错误：返回包含错误信息的NDJSON
   - 内部服务器错误：返回500状态码和错误信息
   - 参数错误：返回400状态码和错误信息

## 7. 性能优化建议
1. **前端优化**：
   - 使用防抖或节流减少频繁的UI更新
   - 限制每次更新的频率，避免过度渲染
   - 实现生成过程中的取消功能

2. **后端优化**：
   - 添加请求超时处理
   - 实现请求队列，避免并发请求过多
   - 缓存常见问卷模板，加速生成过程

## 8. 测试建议
1. **单元测试**：
   - 测试前端AI服务的流式处理逻辑
   - 测试后端DeepSeek客户端的流式调用
   - 测试异常情况下的错误处理

2. **集成测试**：
   - 测试完整的前后端流式通信流程
   - 测试不同网络条件下的表现
   - 测试大数据量下的性能

3. **用户测试**：
   - 测试用户体验，确保生成过程流畅
   - 收集用户反馈，优化生成质量
   - 测试不同复杂度的问卷生成

## 9. 预期效果
1. **用户体验提升**：
   - 点击生成按钮后立即看到生成进度
   - 问卷内容逐步显示，减少等待焦虑
   - 可以提前预览生成结果，决定是否继续

2. **技术优势**：
   - 降低后端内存压力，无需等待完整结果
   - 提高系统响应速度，支持更多并发请求
   - 更灵活的错误处理，便于调试和监控

3. **功能完善**：
   - 支持生成过程中的取消操作
   - 提供明确的生成进度反馈
   - 兼容现有系统架构，无需大规模重构

通过以上修改，AI生成问卷功能将实现流式输出，显著提升用户体验，同时保持系统的稳定性和可扩展性。