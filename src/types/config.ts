export interface ConfigTemplate {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  versions: ConfigVersion[];
}

export interface ConfigVersion {
  versionId: string;
  versionNumber: string;
  content: string;
  format: 'json' | 'yaml';
  changeLog?: string;
  author: string;
  createdAt: string;
}

export interface EditorState {
  mode: 'visual' | 'code';
  currentFormat: 'json' | 'yaml';
  rawContent: string;
  parsedConfig: any | null;
  validationErrors: ValidationError[];
  selectedTemplateId: string | null;
  isDirty: boolean;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  path?: string;
}

export interface ConfigMetadata {
  name: string;
  description?: string;
  tags: string[];
}

export interface VersionDiff {
  versionId: string;
  versionNumber: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export interface FileUploadResult {
  content: string;
  format: 'json' | 'yaml';
  filename: string;
}

export interface TemplateFilter {
  search: string;
  tags: string[];
}