import type { OpenCompassLikeAcceleratorConfig, OpenCompassLikeBenchmarkConfig } from '../types';
import { getApiV1Base } from './apiV1Base';

export interface ConfigFileRecord {
  fileName: string;
  relativePath: string;
  absolutePath: string;
  generatedAt: string;
}

interface GenerateConfigFileRequest {
  taskId: string;
  taskName: string;
  taskType: 'llm' | 'accelerator';
  config: OpenCompassLikeBenchmarkConfig | OpenCompassLikeAcceleratorConfig;
}

interface GenerateConfigFileResponse {
  success: boolean;
  file?: ConfigFileRecord;
  error?: string;
}

export const generateConfigFile = async (
  payload: GenerateConfigFileRequest
): Promise<GenerateConfigFileResponse> => {
  try {
    const response = await fetch(`${getApiV1Base()}/config-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as GenerateConfigFileResponse;
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect local config writer',
    };
  }
};
