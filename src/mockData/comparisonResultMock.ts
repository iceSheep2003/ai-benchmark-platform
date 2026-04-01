import type { TestModel } from './testResultMock';

export interface ComparisonResult {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorId: string;
  
  models: TestModel[];
  dimensionWeights: Record<string, number>;
  customDimensions?: string[];
  
  overallAnalysis: {
    bestModel: string;
    worstModel: string;
    summary: string;
  };
  dimensionAnalysis: DimensionAnalysis[];
  advantageAnalysis: AdvantageAnalysis[];
  
  tags: string[];
  category: string;
  isPublic: boolean;
  isStarred: boolean;
  version: number;
  parentId?: string;
}

export interface DimensionAnalysis {
  dimension: string;
  bestModel: string;
  worstModel: string;
  avgScore: number;
  stdDev: number;
  analysis: string;
}

export interface AdvantageAnalysis {
  modelName: string;
  advantages: string[];
  disadvantages: string[];
  recommendedScenarios: string[];
  matchScore: number;
}

export const comparisonResults: ComparisonResult[] = [
  {
    id: 'comp-001',
    name: 'GPT-4 vs Claude-3 vs Gemini',
    description: '三大主流大模型综合能力对比分析',
    createdAt: '2024-03-15 10:30:00',
    updatedAt: '2024-03-15 10:30:00',
    createdBy: '张三',
    models: [
      {
        id: 'model-001',
        name: 'GPT-4',
        organization: 'OpenAI',
        params: '175B',
        status: 'tested',
        domain: ['general', 'code'],
        scores: {
          overall: 92,
          languageUnderstanding: 95,
          logicReasoning: 90,
          textGeneration: 93,
          knowledgeQA: 91,
          codeAbility: 94,
          multilingualAbility: 88,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 96.2, metric: 'EM' },
            semanticAnalysis: { score: 94.5, metric: 'F1' },
            contextUnderstanding: { score: 94.3, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 92.1, metric: 'Acc' },
            causalInference: { score: 89.5, metric: 'Acc' },
            deductiveReasoning: { score: 88.4, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 94.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 91.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 92.5, metric: 'Acc' },
            generalQA: { score: 89.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 96.8, metric: 'Pass@1' },
            codeDebugging: { score: 93.2, metric: 'Fix@1' },
            codeExplanation: { score: 92.5, metric: 'Explain@1' },
            codeOptimization: { score: 93.5, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 87.5, metric: 'EM' },
            englishUnderstanding: { score: 88.5, metric: 'EM' },
          },
        },
        trend: [85, 87, 89, 90, 91, 92],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-15 10:00:00',
        version: 'v4.0',
      },
      {
        id: 'model-002',
        name: 'Claude-3',
        organization: 'Anthropic',
        params: '200B',
        status: 'tested',
        domain: ['general', 'medical', 'legal'],
        scores: {
          overall: 89,
          languageUnderstanding: 92,
          logicReasoning: 88,
          textGeneration: 91,
          knowledgeQA: 87,
          codeAbility: 86,
          multilingualAbility: 90,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 93.5, metric: 'EM' },
            semanticAnalysis: { score: 91.8, metric: 'F1' },
            contextUnderstanding: { score: 90.7, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 89.2, metric: 'Acc' },
            causalInference: { score: 87.5, metric: 'Acc' },
            deductiveReasoning: { score: 87.3, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 92.8, metric: 'ROUGE-L' },
            creativeWriting: { score: 89.2, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 88.5, metric: 'Acc' },
            generalQA: { score: 85.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 88.2, metric: 'Pass@1' },
            codeDebugging: { score: 85.3, metric: 'Fix@1' },
            codeExplanation: { score: 84.5, metric: 'Explain@1' },
            codeOptimization: { score: 86.0, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 91.2, metric: 'EM' },
            englishUnderstanding: { score: 88.8, metric: 'EM' },
          },
        },
        trend: [82, 84, 85, 87, 88, 89],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-15 10:00:00',
        version: 'v3.0',
      },
      {
        id: 'model-003',
        name: 'Gemini',
        organization: 'Google',
        params: '180B',
        status: 'tested',
        domain: ['general', 'code', 'finance'],
        scores: {
          overall: 87,
          languageUnderstanding: 89,
          logicReasoning: 86,
          textGeneration: 88,
          knowledgeQA: 89,
          codeAbility: 85,
          multilingualAbility: 85,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 90.5, metric: 'EM' },
            semanticAnalysis: { score: 88.7, metric: 'F1' },
            contextUnderstanding: { score: 87.8, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 87.2, metric: 'Acc' },
            causalInference: { score: 85.5, metric: 'Acc' },
            deductiveReasoning: { score: 85.3, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 89.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 86.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 90.5, metric: 'Acc' },
            generalQA: { score: 87.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 87.2, metric: 'Pass@1' },
            codeDebugging: { score: 84.3, metric: 'Fix@1' },
            codeExplanation: { score: 83.5, metric: 'Explain@1' },
            codeOptimization: { score: 85.0, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 86.2, metric: 'EM' },
            englishUnderstanding: { score: 83.8, metric: 'EM' },
          },
        },
        trend: [80, 82, 83, 85, 86, 87],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-15 10:00:00',
        version: 'v1.5',
      },
    ],
    dimensionWeights: {
      languageUnderstanding: 16.7,
      logicReasoning: 16.7,
      textGeneration: 16.7,
      knowledgeQA: 16.7,
      codeAbility: 16.7,
      multilingualAbility: 16.5,
    },
    overallAnalysis: {
      bestModel: 'GPT-4',
      worstModel: 'Gemini',
      summary: 'GPT-4在综合能力上表现最佳，特别是在代码能力和语言理解方面优势明显。Claude-3在多语言能力和文本生成方面表现优异。Gemini整体均衡，但在代码能力方面相对较弱。',
    },
    dimensionAnalysis: [
      {
        dimension: '语言理解',
        bestModel: 'GPT-4',
        worstModel: 'Gemini',
        avgScore: 92,
        stdDev: 3.0,
        analysis: 'GPT-4在语言理解方面表现突出，得分95分，远超平均水平。',
      },
      {
        dimension: '逻辑推理',
        bestModel: 'GPT-4',
        worstModel: 'Gemini',
        avgScore: 88,
        stdDev: 2.0,
        analysis: '各模型在逻辑推理方面差距较小，GPT-4略占优势。',
      },
      {
        dimension: '文本生成',
        bestModel: 'GPT-4',
        worstModel: 'Gemini',
        avgScore: 90.7,
        stdDev: 2.5,
        analysis: 'GPT-4和Claude-3在文本生成方面表现接近，Gemini稍逊一筹。',
      },
      {
        dimension: '知识问答',
        bestModel: 'GPT-4',
        worstModel: 'Claude-3',
        avgScore: 89,
        stdDev: 2.0,
        analysis: '各模型在知识问答方面表现均衡，差距不大。',
      },
      {
        dimension: '代码能力',
        bestModel: 'GPT-4',
        worstModel: 'Gemini',
        avgScore: 88.3,
        stdDev: 4.5,
        analysis: 'GPT-4在代码能力方面优势明显，领先第二名8分。',
      },
      {
        dimension: '多语言能力',
        bestModel: 'Claude-3',
        worstModel: 'Gemini',
        avgScore: 87.7,
        stdDev: 2.5,
        analysis: 'Claude-3在多语言能力方面表现最佳。',
      },
    ],
    advantageAnalysis: [
      {
        modelName: 'GPT-4',
        advantages: ['代码能力突出', '语言理解优秀', '综合得分最高'],
        disadvantages: ['多语言能力相对较弱', '推理成本较高'],
        recommendedScenarios: ['代码生成', '技术文档编写', '复杂逻辑推理'],
        matchScore: 95,
      },
      {
        modelName: 'Claude-3',
        advantages: ['多语言能力最佳', '文本生成流畅', '安全性高'],
        disadvantages: ['代码能力一般', '知识问答稍弱'],
        recommendedScenarios: ['多语言对话', '文本创作', '安全敏感场景'],
        matchScore: 90,
      },
      {
        modelName: 'Gemini',
        advantages: ['综合均衡', '知识问答不错', '成本较低'],
        disadvantages: ['代码能力较弱', '多语言能力一般'],
        recommendedScenarios: ['通用对话', '知识查询', '成本敏感场景'],
        matchScore: 85,
      },
    ],
    tags: ['性能对比', '选型决策', '综合评测'],
    category: '综合对比',
    isPublic: false,
    isStarred: true,
    creatorId: 'user-001',
    version: 1,
  },
  {
    id: 'comp-002',
    name: '代码能力专项对比',
    description: '针对代码生成能力的专项对比分析',
    createdAt: '2024-03-14 15:20:00',
    updatedAt: '2024-03-14 15:20:00',
    createdBy: '李四',
    models: [
      {
        id: 'model-001',
        name: 'GPT-4',
        organization: 'OpenAI',
        params: '175B',
        status: 'tested',
        domain: ['code'],
        scores: {
          overall: 92,
          languageUnderstanding: 95,
          logicReasoning: 90,
          textGeneration: 93,
          knowledgeQA: 91,
          codeAbility: 94,
          multilingualAbility: 88,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 96.2, metric: 'EM' },
            semanticAnalysis: { score: 94.5, metric: 'F1' },
            contextUnderstanding: { score: 94.3, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 92.1, metric: 'Acc' },
            causalInference: { score: 89.5, metric: 'Acc' },
            deductiveReasoning: { score: 88.4, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 94.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 91.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 92.5, metric: 'Acc' },
            generalQA: { score: 89.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 96.8, metric: 'Pass@1' },
            codeDebugging: { score: 93.2, metric: 'Fix@1' },
            codeExplanation: { score: 92.5, metric: 'Explain@1' },
            codeOptimization: { score: 93.5, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 87.5, metric: 'EM' },
            englishUnderstanding: { score: 88.5, metric: 'EM' },
          },
        },
        trend: [85, 87, 89, 90, 91, 92],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-14 14:00:00',
        version: 'v4.0',
      },
      {
        id: 'model-004',
        name: 'CodeLlama',
        organization: 'Meta',
        params: '70B',
        status: 'tested',
        domain: ['code'],
        scores: {
          overall: 85,
          languageUnderstanding: 82,
          logicReasoning: 88,
          textGeneration: 83,
          knowledgeQA: 80,
          codeAbility: 92,
          multilingualAbility: 75,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 83.5, metric: 'EM' },
            semanticAnalysis: { score: 81.8, metric: 'F1' },
            contextUnderstanding: { score: 80.7, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 89.2, metric: 'Acc' },
            causalInference: { score: 87.5, metric: 'Acc' },
            deductiveReasoning: { score: 87.3, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 84.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 81.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 81.5, metric: 'Acc' },
            generalQA: { score: 78.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 94.2, metric: 'Pass@1' },
            codeDebugging: { score: 91.3, metric: 'Fix@1' },
            codeExplanation: { score: 90.5, metric: 'Explain@1' },
            codeOptimization: { score: 92.0, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 74.5, metric: 'EM' },
            englishUnderstanding: { score: 75.5, metric: 'EM' },
          },
        },
        trend: [78, 80, 82, 83, 84, 85],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-14 14:00:00',
        version: 'v2.0',
      },
      {
        id: 'model-005',
        name: 'StarCoder',
        organization: 'Hugging Face',
        params: '15B',
        status: 'tested',
        domain: ['code'],
        scores: {
          overall: 80,
          languageUnderstanding: 78,
          logicReasoning: 85,
          textGeneration: 79,
          knowledgeQA: 77,
          codeAbility: 88,
          multilingualAbility: 70,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 79.5, metric: 'EM' },
            semanticAnalysis: { score: 77.8, metric: 'F1' },
            contextUnderstanding: { score: 76.7, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 86.2, metric: 'Acc' },
            causalInference: { score: 84.5, metric: 'Acc' },
            deductiveReasoning: { score: 84.3, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 80.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 77.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 77.5, metric: 'Acc' },
            generalQA: { score: 74.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 90.2, metric: 'Pass@1' },
            codeDebugging: { score: 87.3, metric: 'Fix@1' },
            codeExplanation: { score: 86.5, metric: 'Explain@1' },
            codeOptimization: { score: 88.0, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 71.5, metric: 'EM' },
            englishUnderstanding: { score: 72.5, metric: 'EM' },
          },
        },
        trend: [72, 75, 77, 78, 79, 80],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-14 14:00:00',
        version: 'v1.0',
      },
      {
        id: 'model-006',
        name: 'CodeT5',
        organization: 'Salesforce',
        params: '16B',
        status: 'tested',
        domain: ['code'],
        scores: {
          overall: 78,
          languageUnderstanding: 75,
          logicReasoning: 82,
          textGeneration: 76,
          knowledgeQA: 74,
          codeAbility: 86,
          multilingualAbility: 68,
        },
        subTaskScores: {
          languageUnderstanding: {
            readingComprehension: { score: 76.5, metric: 'EM' },
            semanticAnalysis: { score: 74.8, metric: 'F1' },
            contextUnderstanding: { score: 73.7, metric: 'Acc' },
          },
          logicReasoning: {
            mathReasoning: { score: 83.2, metric: 'Acc' },
            causalInference: { score: 81.5, metric: 'Acc' },
            deductiveReasoning: { score: 81.3, metric: 'Acc' },
          },
          textGeneration: {
            summarization: { score: 77.3, metric: 'ROUGE-L' },
            creativeWriting: { score: 74.7, metric: 'Human Pref.' },
          },
          knowledgeQA: {
            professionalQA: { score: 75.5, metric: 'Acc' },
            generalQA: { score: 72.5, metric: 'Acc' },
          },
          codeAbility: {
            codeGeneration: { score: 88.2, metric: 'Pass@1' },
            codeDebugging: { score: 85.3, metric: 'Fix@1' },
            codeExplanation: { score: 84.5, metric: 'Explain@1' },
            codeOptimization: { score: 86.0, metric: 'Speedup@1' },
          },
          multilingualAbility: {
            chineseUnderstanding: { score: 67.5, metric: 'EM' },
            englishUnderstanding: { score: 68.5, metric: 'EM' },
          },
        },
        trend: [70, 73, 75, 76, 77, 78],
        capabilities: ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'],
        testedAt: '2024-03-14 14:00:00',
        version: 'v1.1',
      },
    ],
    dimensionWeights: {
      codeAbility: 40,
      logicReasoning: 30,
      languageUnderstanding: 20,
      textGeneration: 10,
      knowledgeQA: 0,
      multilingualAbility: 0,
    },
    overallAnalysis: {
      bestModel: 'GPT-4',
      worstModel: 'CodeT5',
      summary: 'GPT-4在代码能力专项对比中表现最佳，综合得分92分。CodeLlama作为开源模型表现优异，代码能力得分92分。StarCoder和CodeT5在代码能力方面也有不错表现。',
    },
    dimensionAnalysis: [
      {
        dimension: '代码能力',
        bestModel: 'GPT-4',
        worstModel: 'CodeT5',
        avgScore: 90,
        stdDev: 3.5,
        analysis: 'GPT-4和CodeLlama在代码能力方面表现突出。',
      },
      {
        dimension: '逻辑推理',
        bestModel: 'CodeLlama',
        worstModel: 'CodeT5',
        avgScore: 86.3,
        stdDev: 2.9,
        analysis: '各模型在逻辑推理方面差距较小。',
      },
    ],
    advantageAnalysis: [
      {
        modelName: 'GPT-4',
        advantages: ['代码能力最强', '综合表现最佳'],
        disadvantages: ['成本较高'],
        recommendedScenarios: ['复杂代码生成', '代码审查', '技术文档'],
        matchScore: 98,
      },
      {
        modelName: 'CodeLlama',
        advantages: ['开源免费', '代码能力强', '可本地部署'],
        disadvantages: ['综合能力一般', '多语言能力弱'],
        recommendedScenarios: ['代码辅助', '本地开发', '成本敏感场景'],
        matchScore: 88,
      },
      {
        modelName: 'StarCoder',
        advantages: ['轻量级', '响应快', '成本低'],
        disadvantages: ['综合能力较弱', '多语言能力差'],
        recommendedScenarios: ['简单代码生成', '快速原型', '移动端部署'],
        matchScore: 80,
      },
      {
        modelName: 'CodeT5',
        advantages: ['轻量级', '成本低'],
        disadvantages: ['综合能力最弱', '多语言能力差'],
        recommendedScenarios: ['简单代码生成', '成本敏感场景'],
        matchScore: 75,
      },
    ],
    tags: ['代码能力', '专项测试', '开源模型'],
    category: '专项对比',
    isPublic: true,
    isStarred: false,
    creatorId: 'user-002',
    version: 1,
  },
];

export const comparisonTags = [
  '性能对比',
  '选型决策',
  '综合评测',
  '代码能力',
  '专项测试',
  '开源模型',
  '成本分析',
  '安全评估',
  '多语言',
  '对话系统',
];

export const comparisonCategories = [
  '综合对比',
  '专项对比',
  '成本分析',
  '安全评估',
  '性能测试',
];
