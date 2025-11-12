import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private static instance: AIService;
  private apiKey: string | null = null;
  private baseURL = 'https://api.moonshot.cn/v1';

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey.trim();
  }

  getApiKey(): string {
    return this.apiKey || '';
  }

  async chat(message: string, context?: ChatMessage[]): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('API密钥未设置，请先设置Moonshot API密钥');
    }

    try {
      const messages = [
        {
          role: 'system',
          content: '你是一个专业的医疗助手，专门帮助抑郁症患者了解药物信息、服药指导和心理健康建议。请用中文回答，语言要温和、支持性，避免使用过于专业的医学术语。'
        },
        ...(context || []),
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'kimi-k2-thinking',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000
        }
      );

      const data = response.data;
      return {
        message: data.choices[0]?.message?.content || '抱歉，我没有得到有效的回复',
        usage: data.usage
      };
    } catch (error: any) {
      console.error('AI服务调用失败:', error);
      
      if (error.response?.status === 401) {
        throw new Error('API密钥无效，请检查您的Moonshot API密钥');
      } else if (error.response?.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('网络连接超时，请检查网络后重试');
      } else {
        throw new Error('AI服务暂时不可用，请稍后再试');
      }
    }
  }

  async getMedicineInfo(medicineName: string, signal?: AbortSignal): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('API密钥未配置');
    }

    if (!medicineName || medicineName.trim().length === 0) {
      throw new Error('药品名称不能为空');
    }

    const prompt = `请提供关于${medicineName.trim()}的简要信息，包括：
    1. 主要用途
    2. 常见剂量
    3. 可能的副作用
    4. 注意事项
    请用简洁易懂的语言描述，适合抑郁症患者理解。`;
    
    return this.chat(prompt, [], signal);
  }

  async getGeneralAdvice(signal?: AbortSignal): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('API密钥未配置');
    }

    const prompt = `请给抑郁症患者一些关于坚持服药的重要性和应对健忘的建议。语言要温和、鼓励性。`;
    return this.chat(prompt, [], signal);
  }

  isConfigured(): boolean {
    return this.apiKey && this.apiKey.trim().length > 0;
  }
}