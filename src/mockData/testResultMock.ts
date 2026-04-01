export interface TestModel {
  id: string;
  name: string;
  organization: string;
  params: string;
  status: 'tested' | 'testing' | 'pending';
  domain: ('general' | 'medical' | 'code' | 'finance' | 'legal')[];
  scores: {
    overall: number;
    languageUnderstanding: number;
    logicReasoning: number;
    textGeneration: number;
    knowledgeQA: number;
    codeAbility: number;
    multilingualAbility: number;
  };
  subTaskScores: {
    languageUnderstanding: {
      readingComprehension: { score: number; metric: 'EM' };
      semanticAnalysis: { score: number; metric: 'F1' };
      contextUnderstanding: { score: number; metric: 'Acc' };
    };
    logicReasoning: {
      mathReasoning: { score: number; metric: 'Acc' };
      causalInference: { score: number; metric: 'Acc' };
      deductiveReasoning: { score: number; metric: 'Acc' };
    };
    textGeneration: {
      summarization: { score: number; metric: 'ROUGE-L' };
      creativeWriting: { score: number; metric: 'Human Pref.' };
    };
    knowledgeQA: {
      professionalQA: { score: number; metric: 'Acc' };
      generalQA: { score: number; metric: 'Acc' };
    };
    codeAbility: {
      codeGeneration: { score: number; metric: 'Pass@1' };
      codeDebugging: { score: number; metric: 'Fix@1' };
      codeExplanation: { score: number; metric: 'Explain@1' };
      codeOptimization: { score: number; metric: 'Speedup@1' };
    };
    multilingualAbility: {
      chineseUnderstanding: { score: number; metric: 'EM' };
      englishUnderstanding: { score: number; metric: 'EM' };
    };
  };
  trend: number[];
  capabilities: string[];
  testProgress?: {
    current: number;
    total: number;
    currentTask: string;
    estimatedTime: string;
  };
  testedAt?: string;
  version: string;
  versionHistory?: ModelVersion[];
  taskAdaptation?: TaskAdaptation[];
  relatedTasks?: RelatedTask[];
  strengths?: string[];
  weaknesses?: string[];
  bottlenecks?: string[];
  recommendations?: string[];
}

export interface ModelVersion {
  version: string;
  date: string;
  scores: {
    overall: number;
    languageUnderstanding: number;
    logicReasoning: number;
    textGeneration: number;
    knowledgeQA: number;
    codeAbility: number;
    multilingualAbility: number;
  };
  changes: string;
}

export interface TaskAdaptation {
  taskType: string;
  taskName: string;
  score: number;
  rank: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  useCases: string[];
}

export interface RelatedTask {
  id: string;
  name: string;
  type: string;
  status: 'completed' | 'running' | 'pending' | 'failed';
  createdAt: string;
  completedAt?: string;
  capabilities: string[];
  overallScore?: number;
  duration?: string;
}

export interface ComparisonResult {
  models: TestModel[];
  dimensions: {
    name: string;
    scores: Record<string, number>;
    winner: string;
    advantage: string;
  }[];
}

const capabilitiesPool = [
  '语言理解',
  '逻辑推理',
  '文本生成',
  '知识问答',
  '代码能力',
  '多语言能力',
];

const generateTrend = (base: number): number[] => {
  const trend: number[] = [];
  let current = base - Math.random() * 5;
  for (let i = 0; i < 3; i++) {
    current += Math.random() * 3;
    trend.push(Math.min(100, Math.max(0, current)));
  }
  return trend;
};

const generateVersionHistory = (currentScores: TestModel['scores'], currentVersion: string): ModelVersion[] => {
  const versions: ModelVersion[] = [];
  const versionParts = currentVersion.replace('v', '').split('.');
  
  for (let i = 3; i >= 0; i--) {
    const majorVersion = parseInt(versionParts[0]) || 1;
    const minorVersion = (parseInt(versionParts[1]) || 0) - i;
    const version = minorVersion >= 0 ? `v${majorVersion}.${minorVersion}` : `v${majorVersion - 1}.${10 + minorVersion}`;
    
    const degradation = 0.95 + Math.random() * 0.05;
    versions.push({
      version,
      date: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      scores: {
        overall: Math.round(currentScores.overall * degradation * 10) / 10,
        languageUnderstanding: Math.round(currentScores.languageUnderstanding * degradation * 10) / 10,
        logicReasoning: Math.round(currentScores.logicReasoning * degradation * 10) / 10,
        textGeneration: Math.round(currentScores.textGeneration * degradation * 10) / 10,
        knowledgeQA: Math.round(currentScores.knowledgeQA * degradation * 10) / 10,
        codeAbility: Math.round(currentScores.codeAbility * degradation * 10) / 10,
        multilingualAbility: Math.round(currentScores.multilingualAbility * degradation * 10) / 10,
      },
      changes: i === 0 ? '当前版本' : '模型架构优化，推理能力提升',
    });
  }
  
  versions.push({
    version: currentVersion,
    date: new Date().toISOString(),
    scores: currentScores,
    changes: '最新版本',
  });
  
  return versions;
};

const generateTaskAdaptation = (scores: TestModel['scores']): TaskAdaptation[] => {
  const allTasks: TaskAdaptation[] = [
    {
      taskType: '对话交互',
      taskName: '智能客服对话',
      score: Math.round((scores.languageUnderstanding * 0.4 + scores.textGeneration * 0.3 + scores.knowledgeQA * 0.3) * 10) / 10,
      rank: 'excellent',
      description: '适合处理复杂的客户咨询场景',
      useCases: ['在线客服', '智能助手', 'FAQ问答'],
    },
    {
      taskType: '代码开发',
      taskName: '代码生成与补全',
      score: Math.round((scores.codeAbility * 0.5 + scores.logicReasoning * 0.3 + scores.languageUnderstanding * 0.2) * 10) / 10,
      rank: 'excellent',
      description: '擅长多种编程语言的代码生成',
      useCases: ['代码补全', '代码审查', 'Bug修复'],
    },
    {
      taskType: '知识问答',
      taskName: '专业知识问答',
      score: Math.round((scores.knowledgeQA * 0.5 + scores.languageUnderstanding * 0.3 + scores.logicReasoning * 0.2) * 10) / 10,
      rank: 'good',
      description: '知识覆盖面广，回答准确度高',
      useCases: ['企业知识库', '教育问答', '专业咨询'],
    },
    {
      taskType: '内容创作',
      taskName: '文本内容生成',
      score: Math.round((scores.textGeneration * 0.5 + scores.languageUnderstanding * 0.3 + scores.knowledgeQA * 0.2) * 10) / 10,
      rank: 'good',
      description: '能够生成流畅、有逻辑的文本内容',
      useCases: ['文章写作', '营销文案', '报告生成'],
    },
    {
      taskType: '逻辑推理',
      taskName: '复杂问题推理',
      score: Math.round((scores.logicReasoning * 0.5 + scores.languageUnderstanding * 0.3 + scores.knowledgeQA * 0.2) * 10) / 10,
      rank: 'excellent',
      description: '擅长处理需要多步推理的复杂问题',
      useCases: ['数学问题', '逻辑分析', '决策支持'],
    },
    {
      taskType: '多语言',
      taskName: '跨语言处理',
      score: Math.round(scores.multilingualAbility * 10) / 10,
      rank: 'good',
      description: '支持多种语言的翻译和处理',
      useCases: ['机器翻译', '多语言客服', '跨语言检索'],
    },
  ];
  
  allTasks.forEach(task => {
    if (task.score >= 90) task.rank = 'excellent';
    else if (task.score >= 80) task.rank = 'good';
    else if (task.score >= 60) task.rank = 'fair';
    else task.rank = 'poor';
  });
  
  return allTasks.sort((a, b) => b.score - a.score);
};

const generateRelatedTasks = (modelName: string): RelatedTask[] => {
  const capabilities = ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'];
  const statuses: RelatedTask['status'][] = ['completed', 'completed', 'completed', 'running', 'pending'];
  const taskTypes = ['能力评测', '性能测试', '安全评估', '兼容性测试', '基准测试'];
  
  return Array.from({ length: 5 }, (_, i) => {
    const status = statuses[i];
    const selectedCapabilities = [...capabilities].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
    
    return {
      id: `task-${modelName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}`,
      name: `${modelName} ${['基础能力评测', '综合能力测试', '专项能力评估', '版本对比测试', '性能基准测试'][i]}`,
      type: taskTypes[i],
      status,
      createdAt: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: status === 'completed' ? new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      capabilities: selectedCapabilities,
      overallScore: status === 'completed' ? Math.round(75 + Math.random() * 20) : undefined,
      duration: status === 'completed' ? `${Math.floor(1 + Math.random() * 3)}小时${Math.floor(Math.random() * 60)}分` : undefined,
    };
  });
};

const analyzeStrengthsAndWeaknesses = (scores: TestModel['scores']): { strengths: string[]; weaknesses: string[]; bottlenecks: string[]; recommendations: string[] } => {
  const dimensions = [
    { key: 'languageUnderstanding', name: '语言理解', score: scores.languageUnderstanding },
    { key: 'logicReasoning', name: '逻辑推理', score: scores.logicReasoning },
    { key: 'textGeneration', name: '文本生成', score: scores.textGeneration },
    { key: 'knowledgeQA', name: '知识问答', score: scores.knowledgeQA },
    { key: 'codeAbility', name: '代码能力', score: scores.codeAbility },
    { key: 'multilingualAbility', name: '多语言能力', score: scores.multilingualAbility },
  ];
  
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  
  const strengths = sorted.slice(0, 2).map(d => 
    `${d.name}能力突出（${d.score.toFixed(1)}分），在同类模型中表现优异`
  );
  
  const weaknesses = sorted.slice(-2).filter(d => d.score < 80).map(d =>
    `${d.name}能力有待提升（${d.score.toFixed(1)}分），与顶尖模型存在差距`
  );
  
  const bottlenecks: string[] = [];
  if (sorted[sorted.length - 1].score < 70) {
    bottlenecks.push(`${sorted[sorted.length - 1].name}是主要性能瓶颈，建议重点优化`);
  }
  const variance = Math.max(...dimensions.map(d => d.score)) - Math.min(...dimensions.map(d => d.score));
  if (variance > 15) {
    bottlenecks.push('各维度能力发展不均衡，存在明显短板');
  }
  
  const recommendations: string[] = [];
  if (scores.codeAbility < 85) {
    recommendations.push('建议增加代码训练数据，提升代码生成能力');
  }
  if (scores.multilingualAbility < 85) {
    recommendations.push('建议扩充多语言语料库，增强跨语言处理能力');
  }
  if (scores.logicReasoning < 90) {
    recommendations.push('建议引入更多推理链训练数据，提升复杂推理能力');
  }
  recommendations.push('建议持续跟踪版本迭代效果，优化模型性能');
  
  return { strengths, weaknesses, bottlenecks, recommendations };
};

const createTestedModel = (
  id: string,
  name: string,
  organization: string,
  params: string,
  domain: TestModel['domain'],
  scores: TestModel['scores'],
  capabilities: string[],
  testedAt: string,
  version: string
): TestModel => {
  const analysis = analyzeStrengthsAndWeaknesses(scores);
  
  const subTaskScores: TestModel['subTaskScores'] = {
    languageUnderstanding: {
      readingComprehension: { score: scores.languageUnderstanding + Math.random() * 4 - 2, metric: 'EM' },
      semanticAnalysis: { score: scores.languageUnderstanding + Math.random() * 4 - 2, metric: 'F1' },
      contextUnderstanding: { score: scores.languageUnderstanding + Math.random() * 4 - 2, metric: 'Acc' },
    },
    logicReasoning: {
      mathReasoning: { score: scores.logicReasoning + Math.random() * 6 - 3, metric: 'Acc' },
      causalInference: { score: scores.logicReasoning + Math.random() * 6 - 3, metric: 'Acc' },
      deductiveReasoning: { score: scores.logicReasoning + Math.random() * 6 - 3, metric: 'Acc' },
    },
    textGeneration: {
      summarization: { score: scores.textGeneration + Math.random() * 4 - 2, metric: 'ROUGE-L' },
      creativeWriting: { score: scores.textGeneration + Math.random() * 4 - 2, metric: 'Human Pref.' },
    },
    knowledgeQA: {
      professionalQA: { score: scores.knowledgeQA + Math.random() * 4 - 2, metric: 'Acc' },
      generalQA: { score: scores.knowledgeQA + Math.random() * 4 - 2, metric: 'Acc' },
    },
    codeAbility: {
      codeGeneration: { score: scores.codeAbility + Math.random() * 6 - 3, metric: 'Pass@1' },
      codeDebugging: { score: scores.codeAbility + Math.random() * 6 - 3, metric: 'Fix@1' },
      codeExplanation: { score: scores.codeAbility + Math.random() * 6 - 3, metric: 'Explain@1' },
      codeOptimization: { score: scores.codeAbility + Math.random() * 6 - 3, metric: 'Speedup@1' },
    },
    multilingualAbility: {
      chineseUnderstanding: { score: scores.multilingualAbility + Math.random() * 4 - 2, metric: 'EM' },
      englishUnderstanding: { score: scores.multilingualAbility + Math.random() * 4 - 2, metric: 'EM' },
    },
  };
  
  return {
    id,
    name,
    organization,
    params,
    status: 'tested',
    domain,
    scores,
    subTaskScores,
    trend: generateTrend(scores.overall),
    capabilities,
    testedAt,
    version,
    versionHistory: generateVersionHistory(scores, version),
    taskAdaptation: generateTaskAdaptation(scores),
    relatedTasks: generateRelatedTasks(name),
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    bottlenecks: analysis.bottlenecks,
    recommendations: analysis.recommendations,
  };
};

export const mockTestModels: TestModel[] = [
  createTestedModel(
    'model-1',
    'GPT-4-Turbo',
    'OpenAI',
    '1.8T',
    ['general', 'code'],
    {
      overall: 92.5,
      languageUnderstanding: 91.2,
      logicReasoning: 94.5,
      textGeneration: 89.8,
      knowledgeQA: 93.2,
      codeAbility: 95.1,
      multilingualAbility: 88.6,
    },
    ['语言理解', '逻辑推理', '代码能力', '知识问答'],
    '2024-03-20T10:30:00Z',
    'v2024-03-15'
  ),
  createTestedModel(
    'model-2',
    'Claude-3-Opus',
    'Anthropic',
    '未知',
    ['general', 'medical', 'legal'],
    {
      overall: 91.8,
      languageUnderstanding: 93.5,
      logicReasoning: 92.1,
      textGeneration: 94.2,
      knowledgeQA: 91.8,
      codeAbility: 88.9,
      multilingualAbility: 87.5,
    },
    ['语言理解', '文本生成', '知识问答', '逻辑推理'],
    '2024-03-19T14:20:00Z',
    'v2024-03-10'
  ),
  createTestedModel(
    'model-3',
    'Qwen-72B-Chat',
    '阿里云',
    '72B',
    ['general', 'code'],
    {
      overall: 85.2,
      languageUnderstanding: 84.6,
      logicReasoning: 82.3,
      textGeneration: 86.5,
      knowledgeQA: 85.8,
      codeAbility: 83.2,
      multilingualAbility: 89.1,
    },
    ['多语言能力', '代码能力', '逻辑推理', '文本生成'],
    '2024-03-18T09:15:00Z',
    'v1.1.0'
  ),
  createTestedModel(
    'model-4',
    'Llama-3-70B',
    'Meta',
    '70B',
    ['general', 'code'],
    {
      overall: 83.6,
      languageUnderstanding: 82.4,
      logicReasoning: 81.5,
      textGeneration: 84.2,
      knowledgeQA: 83.8,
      codeAbility: 85.6,
      multilingualAbility: 78.9,
    },
    ['代码能力', '文本生成', '知识问答', '语言理解'],
    '2024-03-17T16:45:00Z',
    'v3-70b'
  ),
  createTestedModel(
    'model-5',
    'Baichuan2-13B',
    '百川智能',
    '13B',
    ['general'],
    {
      overall: 72.4,
      languageUnderstanding: 74.5,
      logicReasoning: 68.2,
      textGeneration: 75.8,
      knowledgeQA: 72.1,
      codeAbility: 65.3,
      multilingualAbility: 76.4,
    },
    ['文本生成', '语言理解', '多语言能力'],
    '2024-03-16T11:30:00Z',
    'v2.1'
  ),
  {
    id: 'model-6',
    name: 'DeepSeek-V2',
    organization: 'DeepSeek',
    params: '236B',
    status: 'testing',
    domain: ['general', 'code'],
    scores: {
      overall: 0,
      languageUnderstanding: 0,
      logicReasoning: 0,
      textGeneration: 0,
      knowledgeQA: 0,
      codeAbility: 0,
      multilingualAbility: 0,
    },
    subTaskScores: {
      languageUnderstanding: {
        readingComprehension: { score: 0, metric: 'EM' },
        semanticAnalysis: { score: 0, metric: 'F1' },
        contextUnderstanding: { score: 0, metric: 'Acc' },
      },
      logicReasoning: {
        mathReasoning: { score: 0, metric: 'Acc' },
        causalInference: { score: 0, metric: 'Acc' },
        deductiveReasoning: { score: 0, metric: 'Acc' },
      },
      textGeneration: {
        summarization: { score: 0, metric: 'ROUGE-L' },
        creativeWriting: { score: 0, metric: 'Human Pref.' },
      },
      knowledgeQA: {
        professionalQA: { score: 0, metric: 'Acc' },
        generalQA: { score: 0, metric: 'Acc' },
      },
      codeAbility: {
        codeGeneration: { score: 0, metric: 'Pass@1' },
        codeDebugging: { score: 0, metric: 'Fix@1' },
        codeExplanation: { score: 0, metric: 'Explain@1' },
        codeOptimization: { score: 0, metric: 'Speedup@1' },
      },
      multilingualAbility: {
        chineseUnderstanding: { score: 0, metric: 'EM' },
        englishUnderstanding: { score: 0, metric: 'EM' },
      },
    },
    trend: [],
    capabilities: ['代码能力', '逻辑推理'],
    testProgress: {
      current: 3,
      total: 6,
      currentTask: '逻辑推理',
      estimatedTime: '2小时15分',
    },
    version: 'v2.0',
  },
  {
    id: 'model-7',
    name: 'Yi-34B-Chat',
    organization: '零一万物',
    params: '34B',
    status: 'testing',
    domain: ['general'],
    scores: {
      overall: 0,
      languageUnderstanding: 0,
      logicReasoning: 0,
      textGeneration: 0,
      knowledgeQA: 0,
      codeAbility: 0,
      multilingualAbility: 0,
    },
    subTaskScores: {
      languageUnderstanding: {
        readingComprehension: { score: 0, metric: 'EM' },
        semanticAnalysis: { score: 0, metric: 'F1' },
        contextUnderstanding: { score: 0, metric: 'Acc' },
      },
      logicReasoning: {
        mathReasoning: { score: 0, metric: 'Acc' },
        causalInference: { score: 0, metric: 'Acc' },
        deductiveReasoning: { score: 0, metric: 'Acc' },
      },
      textGeneration: {
        summarization: { score: 0, metric: 'ROUGE-L' },
        creativeWriting: { score: 0, metric: 'Human Pref.' },
      },
      knowledgeQA: {
        professionalQA: { score: 0, metric: 'Acc' },
        generalQA: { score: 0, metric: 'Acc' },
      },
      codeAbility: {
        codeGeneration: { score: 0, metric: 'Pass@1' },
        codeDebugging: { score: 0, metric: 'Fix@1' },
        codeExplanation: { score: 0, metric: 'Explain@1' },
        codeOptimization: { score: 0, metric: 'Speedup@1' },
      },
      multilingualAbility: {
        chineseUnderstanding: { score: 0, metric: 'EM' },
        englishUnderstanding: { score: 0, metric: 'EM' },
      },
    },
    trend: [],
    capabilities: ['语言理解', '文本生成'],
    testProgress: {
      current: 1,
      total: 6,
      currentTask: '语言理解',
      estimatedTime: '4小时30分',
    },
    version: 'v1.0',
  },
  {
    id: 'model-8',
    name: 'Mixtral-8x7B',
    organization: 'Mistral AI',
    params: '47B (MoE)',
    status: 'pending',
    domain: ['general', 'code'],
    scores: {
      overall: 0,
      languageUnderstanding: 0,
      logicReasoning: 0,
      textGeneration: 0,
      knowledgeQA: 0,
      codeAbility: 0,
      multilingualAbility: 0,
    },
    subTaskScores: {
      languageUnderstanding: {
        readingComprehension: { score: 0, metric: 'EM' },
        semanticAnalysis: { score: 0, metric: 'F1' },
        contextUnderstanding: { score: 0, metric: 'Acc' },
      },
      logicReasoning: {
        mathReasoning: { score: 0, metric: 'Acc' },
        causalInference: { score: 0, metric: 'Acc' },
        deductiveReasoning: { score: 0, metric: 'Acc' },
      },
      textGeneration: {
        summarization: { score: 0, metric: 'ROUGE-L' },
        creativeWriting: { score: 0, metric: 'Human Pref.' },
      },
      knowledgeQA: {
        professionalQA: { score: 0, metric: 'Acc' },
        generalQA: { score: 0, metric: 'Acc' },
      },
      codeAbility: {
        codeGeneration: { score: 0, metric: 'Pass@1' },
        codeDebugging: { score: 0, metric: 'Fix@1' },
        codeExplanation: { score: 0, metric: 'Explain@1' },
        codeOptimization: { score: 0, metric: 'Speedup@1' },
      },
      multilingualAbility: {
        chineseUnderstanding: { score: 0, metric: 'EM' },
        englishUnderstanding: { score: 0, metric: 'EM' },
      },
    },
    trend: [],
    capabilities: ['代码能力', '逻辑推理', '知识问答'],
    version: 'v0.1',
  },
  {
    id: 'model-9',
    name: 'Gemini-Pro',
    organization: 'Google',
    params: '未知',
    status: 'pending',
    domain: ['general', 'medical', 'code'],
    scores: {
      overall: 0,
      languageUnderstanding: 0,
      logicReasoning: 0,
      textGeneration: 0,
      knowledgeQA: 0,
      codeAbility: 0,
      multilingualAbility: 0,
    },
    subTaskScores: {
      languageUnderstanding: {
        readingComprehension: { score: 0, metric: 'EM' },
        semanticAnalysis: { score: 0, metric: 'F1' },
        contextUnderstanding: { score: 0, metric: 'Acc' },
      },
      logicReasoning: {
        mathReasoning: { score: 0, metric: 'Acc' },
        causalInference: { score: 0, metric: 'Acc' },
        deductiveReasoning: { score: 0, metric: 'Acc' },
      },
      textGeneration: {
        summarization: { score: 0, metric: 'ROUGE-L' },
        creativeWriting: { score: 0, metric: 'Human Pref.' },
      },
      knowledgeQA: {
        professionalQA: { score: 0, metric: 'Acc' },
        generalQA: { score: 0, metric: 'Acc' },
      },
      codeAbility: {
        codeGeneration: { score: 0, metric: 'Pass@1' },
        codeDebugging: { score: 0, metric: 'Fix@1' },
        codeExplanation: { score: 0, metric: 'Explain@1' },
        codeOptimization: { score: 0, metric: 'Speedup@1' },
      },
      multilingualAbility: {
        chineseUnderstanding: { score: 0, metric: 'EM' },
        englishUnderstanding: { score: 0, metric: 'EM' },
      },
    },
    trend: [],
    capabilities: ['多语言能力', '知识问答', '语言理解'],
    version: 'v1.0',
  },
  {
    id: 'model-10',
    name: 'ChatGLM3-6B',
    organization: '智谱AI',
    params: '6B',
    status: 'pending',
    domain: ['general'],
    scores: {
      overall: 0,
      languageUnderstanding: 0,
      logicReasoning: 0,
      textGeneration: 0,
      knowledgeQA: 0,
      codeAbility: 0,
      multilingualAbility: 0,
    },
    subTaskScores: {
      languageUnderstanding: {
        readingComprehension: { score: 0, metric: 'EM' },
        semanticAnalysis: { score: 0, metric: 'F1' },
        contextUnderstanding: { score: 0, metric: 'Acc' },
      },
      logicReasoning: {
        mathReasoning: { score: 0, metric: 'Acc' },
        causalInference: { score: 0, metric: 'Acc' },
        deductiveReasoning: { score: 0, metric: 'Acc' },
      },
      textGeneration: {
        summarization: { score: 0, metric: 'ROUGE-L' },
        creativeWriting: { score: 0, metric: 'Human Pref.' },
      },
      knowledgeQA: {
        professionalQA: { score: 0, metric: 'Acc' },
        generalQA: { score: 0, metric: 'Acc' },
      },
      codeAbility: {
        codeGeneration: { score: 0, metric: 'Pass@1' },
        codeDebugging: { score: 0, metric: 'Fix@1' },
        codeExplanation: { score: 0, metric: 'Explain@1' },
        codeOptimization: { score: 0, metric: 'Speedup@1' },
      },
      multilingualAbility: {
        chineseUnderstanding: { score: 0, metric: 'EM' },
        englishUnderstanding: { score: 0, metric: 'EM' },
      },
    },
    trend: [],
    capabilities: ['文本生成', '语言理解'],
    version: 'v3',
  },
];

export const domainOptions = [
  { label: '通用', value: 'general' },
  { label: '医疗', value: 'medical' },
  { label: '代码', value: 'code' },
  { label: '金融', value: 'finance' },
  { label: '法律', value: 'legal' },
];

export const sortByOptions = [
  { label: '综合得分', value: 'overall' },
  { label: '语言理解', value: 'languageUnderstanding' },
  { label: '逻辑推理', value: 'logicReasoning' },
  { label: '文本生成', value: 'textGeneration' },
  { label: '知识问答', value: 'knowledgeQA' },
  { label: '代码能力', value: 'codeAbility' },
  { label: '多语言能力', value: 'multilingualAbility' },
];

export const allCapabilities = capabilitiesPool;
