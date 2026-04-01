import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidationError } from '../types/config';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const benchmarkConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['name', 'model', 'dataset', 'resources', 'evaluation'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Configuration name',
    },
    description: {
      type: 'string',
      maxLength: 500,
      description: 'Configuration description',
    },
    model: {
      type: 'object',
      required: ['name', 'precision'],
      properties: {
        name: {
          type: 'string',
          enum: ['Llama3-8B', 'Llama3-70B', 'Qwen-14B', 'Qwen-72B', 'GPT-4', 'Claude-3'],
          description: 'Model name',
        },
        precision: {
          type: 'string',
          enum: ['FP16', 'FP32', 'INT8', 'INT4'],
          description: 'Model precision',
        },
        maxContextLength: {
          type: 'integer',
          minimum: 1,
          maximum: 128000,
          description: 'Maximum context length in tokens',
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 2,
          description: 'Sampling temperature (0.0 to 2.0)',
        },
        topP: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Nucleus sampling threshold',
        },
      },
    },
    dataset: {
      type: 'object',
      required: ['name', 'version'],
      properties: {
        name: {
          type: 'string',
          enum: ['MMLU', 'GSM8K', 'Custom'],
          description: 'Dataset name',
        },
        version: {
          type: 'string',
          description: 'Dataset version',
        },
        batchSize: {
          type: 'integer',
          minimum: 1,
          maximum: 1024,
          description: 'Batch size for processing',
        },
        shuffle: {
          type: 'boolean',
          description: 'Whether to shuffle the dataset',
        },
      },
    },
    resources: {
      type: 'object',
      required: ['cardModel', 'gpuCount'],
      properties: {
        cardModel: {
          type: 'string',
          enum: ['NVIDIA H100', 'NVIDIA A100', 'NVIDIA A800', 'Huawei 910B', 'AMD MI300X'],
          description: 'Accelerator model',
        },
        resourceId: {
          type: 'string',
          description: 'Specific resource instance ID',
        },
        gpuCount: {
          type: 'integer',
          minimum: 1,
          maximum: 8,
          description: 'Number of GPU devices',
        },
        memoryLimit: {
          type: 'number',
          minimum: 1,
          maximum: 192,
          description: 'Memory limit per GPU in GB',
        },
        tensorParallel: {
          type: 'boolean',
          description: 'Enable tensor parallelism',
        },
      },
    },
    evaluation: {
      type: 'object',
      required: ['metrics', 'mode'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['accuracy', 'throughput', 'latency', 'latency_p99', 'memory_usage', 'energy_efficiency', 'cost_per_token'],
          },
          minItems: 1,
          description: 'Evaluation metrics',
        },
        mode: {
          type: 'string',
          enum: ['inference', 'training', 'finetuning'],
          description: 'Evaluation mode',
        },
        numSamples: {
          type: 'integer',
          minimum: 0,
          description: 'Number of samples to evaluate (0 for all)',
        },
        customParams: {
          type: 'string',
          description: 'Custom parameters for evaluation',
        },
      },
    },
    export: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['pdf', 'html', 'json', 'csv', 'excel'],
          description: 'Export format',
        },
        includeCharts: {
          type: 'boolean',
          description: 'Include charts in export',
        },
        includeLogs: {
          type: 'boolean',
          description: 'Include logs in export',
        },
        outputPath: {
          type: 'string',
          description: 'Output file path',
        },
        emailNotify: {
          type: 'string',
          format: 'email',
          description: 'Email notification address',
        },
      },
    },
  },
};

const validate = ajv.compile(benchmarkConfigSchema);

export function validateConfig(config: any): ValidationError[] {
  const valid = validate(config);
  
  if (!valid && validate.errors) {
    return validate.errors.map((error) => ({
      line: 0,
      column: 0,
      message: error.message || 'Validation error',
      severity: 'error',
      path: error.instancePath,
    }));
  }
  
  return [];
}

export function getFieldDocumentation(fieldPath: string): {
  description: string;
  type: string;
  enum?: string[];
  range?: { min: number; max: number };
  default?: any;
} | null {
  const path = fieldPath.split('.');
  
  if (path[0] === 'model') {
    if (path[1] === 'precision') {
      return {
        description: 'Model precision affects memory usage and inference speed',
        type: 'string',
        enum: ['FP16', 'FP32', 'INT8', 'INT4'],
        default: 'FP16',
      };
    }
    if (path[1] === 'temperature') {
      return {
        description: 'Controls randomness in generation. Lower = more deterministic, Higher = more creative',
        type: 'number',
        range: { min: 0, max: 2 },
        default: 0.7,
      };
    }
  }
  
  if (path[0] === 'dataset') {
    if (path[1] === 'batchSize') {
      return {
        description: 'Number of samples processed in each batch. Larger batches use more memory but may be faster',
        type: 'integer',
        range: { min: 1, max: 1024 },
        default: 32,
      };
    }
  }
  
  if (path[0] === 'resources') {
    if (path[1] === 'memoryLimit') {
      return {
        description: 'Maximum memory allocation per GPU. Should be less than total GPU memory',
        type: 'number',
        range: { min: 1, max: 192 },
        default: 70,
      };
    }
  }
  
  if (path[0] === 'evaluation') {
    if (path[1] === 'metrics') {
      return {
        description: 'Select metrics to evaluate. Multiple metrics can be selected',
        type: 'array',
        enum: ['accuracy', 'throughput', 'latency', 'latency_p99', 'memory_usage', 'energy_efficiency', 'cost_per_token'],
        default: ['throughput', 'latency'],
      };
    }
  }
  
  return null;
}