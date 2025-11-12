# Moonshot AI 集成指南

## 概述
这个指南将帮助您将Moonshot AI的聊天功能集成到抑郁症药物管理应用中。

## 步骤1：安装依赖

在项目根目录运行：
```bash
npm install axios
```

## 步骤2：创建AI服务文件

创建 `src/services/aiService.ts` 文件，内容如下：

```typescript
export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async chat(message: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置');
    }

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的医疗助手，专门帮助抑郁症患者了解药物信息。'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '抱歉，我没有得到有效的回复';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
```

## 步骤3：使用示例

在您的组件中使用：

```typescript
import { AIService } from './services/aiService';

// 设置API密钥
const aiService = AIService.getInstance();
aiService.setApiKey('your-moonshot-api-key');

// 发送消息
const response = await aiService.chat('百忧解有什么副作用？');
console.log(response);
```

## 步骤4：测试API

使用您提供的curl命令测试：
```bash
curl https://api.moonshot.cn/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "kimi-k2-thinking",
    "messages": [
      {"role": "user", "content": "抑郁症患者如何提高服药依从性？"}
    ],
    "temperature": 0.7
  }'
```

## 注意事项
1. 请妥善保管您的API密钥，不要将其提交到代码仓库
2. 建议在应用中添加API密钥设置界面
3. 考虑添加错误处理和加载状态
4. 对于生产环境，建议添加请求限制和缓存机制