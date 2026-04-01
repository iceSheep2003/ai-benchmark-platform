export interface Dataset {
  id: string;
  name: string;
  version: string;
  taskType: TaskType;
  evaluationDimension: EvaluationDimension;
  sampleCount: number;
  qualityScore: number;
  languageDistribution: string;
  hardwareDependencies: string[];
  frameworks: string[];
  source: DatasetSource;
  uploadedBy?: string;
  uploadedByAvatar?: string;
  updatedAt: Date;
  createdAt: Date;
  versions: DatasetVersion[];
  tags: string[];
}

export type TaskType = 
  | 'multi-turn-dialogue'
  | 'instruction-following'
  | 'reasoning'
  | 'multilingual-understanding'
  | 'knowledge-application'
  | 'code-understanding'
  | 'training'
  | 'inference'
  | 'matrix-computation';

export type EvaluationDimension = 
  | 'functionality'
  | 'performance'
  | 'compatibility'
  | 'reliability';

export type DatasetSource = 'open-source' | 'self-built';

export interface DatasetVersion {
  version: string;
  createdAt: Date;
  changes: string[];
  parentVersion?: string;
}

export interface DatasetFilter {
  taskTypes?: TaskType[];
  evaluationDimensions?: EvaluationDimension[];
  frameworks?: string[];
  hardware?: string[];
  sources?: DatasetSource[];
  searchKeyword?: string;
}

export interface DatasetStats {
  openSourceCount: number;
  selfBuiltCount: number;
  totalCount: number;
  openSourcePercentage: number;
  selfBuiltPercentage: number;
  isCompliant: boolean;
}

export interface QualityReport {
  datasetId: string;
  datasetName: string;
  overallScore: number;
  dimensions: {
    functionality: number;
    performance: number;
    compatibility: number;
    reliability: number;
  };
  details: {
    dataQuality: number;
    labelAccuracy: number;
    diversity: number;
    completeness: number;
  };
  recommendations: string[];
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'multi-turn-dialogue': '多轮对话',
  'instruction-following': '指令遵循',
  'reasoning': '推理',
  'multilingual-understanding': '多语种理解',
  'knowledge-application': '知识应用',
  'code-understanding': '代码理解',
  'training': '训练任务',
  'inference': '推理任务',
  'matrix-computation': '矩阵运算',
};

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  'multi-turn-dialogue': '💭',
  'instruction-following': '📝',
  'reasoning': '🧠',
  'multilingual-understanding': '🌐',
  'knowledge-application': '📚',
  'code-understanding': '💻',
  'training': '🚀',
  'inference': '⚡',
  'matrix-computation': '🔲',
};

export const EVALUATION_DIMENSION_LABELS: Record<EvaluationDimension, string> = {
  'functionality': '功能',
  'performance': '性能',
  'compatibility': '兼容性',
  'reliability': '可靠性',
};

export const DATASET_SOURCE_LABELS: Record<DatasetSource, string> = {
  'open-source': '开源',
  'self-built': '自建',
};