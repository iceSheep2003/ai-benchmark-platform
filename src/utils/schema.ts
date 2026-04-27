import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidationError } from '../types/config';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const benchmarkConfigSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['type', 'schema_version', 'name', 'work_dir', 'models', 'datasets', 'infer', 'eval', 'summarizer'],
  properties: {
    type: {
      type: 'string',
      enum: ['opencompass'],
      description: 'Unified benchmark configuration style',
    },
    schema_version: {
      type: 'string',
      description: 'Config schema version',
    },
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
    work_dir: {
      type: 'string',
      description: 'Directory to save predictions and results',
    },
    models: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['type', 'abbr', 'path', 'backend', 'max_out_len', 'batch_size', 'run_cfg'],
        properties: {
          type: { type: 'string' },
          abbr: { type: 'string' },
          path: { type: 'string' },
          backend: { type: 'string', enum: ['local', 'api'] },
          max_out_len: { type: 'integer', minimum: 1 },
          batch_size: { type: 'integer', minimum: 1 },
          run_cfg: {
            type: 'object',
            required: ['num_gpus'],
            properties: {
              num_gpus: { type: 'integer', minimum: 0 },
            },
          },
          generation_kwargs: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              top_p: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
        },
      },
    },
    datasets: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['abbr', 'type', 'reader_cfg', 'infer_cfg', 'eval_cfg'],
        properties: {
          abbr: { type: 'string' },
          type: { type: 'string' },
          capability_ids: {
            type: 'array',
            items: { type: 'string' },
          },
          selected_tests: {
            type: 'array',
            items: { type: 'string' },
          },
          reader_cfg: {
            type: 'object',
            properties: {
              test_range: { type: 'string' },
            },
          },
          infer_cfg: {
            type: 'object',
            required: ['retriever', 'inferencer'],
            properties: {
              prompt_template: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  template: { type: 'string' },
                },
              },
              retriever: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                },
              },
              inferencer: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                },
              },
            },
          },
          eval_cfg: {
            type: 'object',
            required: ['evaluator'],
            properties: {
              evaluator: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    infer: {
      type: 'object',
      required: ['partitioner', 'runner', 'task'],
      properties: {
        partitioner: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },
          },
        },
        runner: {
          type: 'object',
          required: ['type', 'max_num_workers'],
          properties: {
            type: { type: 'string' },
            max_num_workers: { type: 'integer', minimum: 1 },
          },
        },
        task: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },
          },
        },
      },
    },
    eval: {
      type: 'object',
      required: ['partitioner', 'runner', 'task'],
      properties: {
        partitioner: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },
          },
        },
        runner: {
          type: 'object',
          required: ['type', 'max_num_workers'],
          properties: {
            type: { type: 'string' },
            max_num_workers: { type: 'integer', minimum: 1 },
          },
        },
        task: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },
          },
        },
      },
    },
    summarizer: {
      type: 'object',
      required: ['type'],
      properties: {
        type: {
          type: 'string',
        },
        summary_groups: {
          type: 'array',
          items: { type: 'string' },
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
  if (fieldPath.includes('models') && fieldPath.includes('backend')) {
    return {
      description: 'Model backend type: local model or API model',
      type: 'string',
      enum: ['local', 'api'],
      default: 'local',
    };
  }

  if (fieldPath.includes('models') && fieldPath.includes('generation_kwargs') && fieldPath.includes('temperature')) {
    return {
      description: 'Generation randomness. Lower is more deterministic',
      type: 'number',
      range: { min: 0, max: 2 },
      default: 0,
    };
  }

  if (fieldPath.includes('datasets') && fieldPath.includes('reader_cfg') && fieldPath.includes('test_range')) {
    return {
      description: 'Dataset test range, for example [:100] means first 100 samples',
      type: 'string',
      default: '[:100]',
    };
  }

  if ((fieldPath.startsWith('infer.') || fieldPath.startsWith('eval.')) && fieldPath.includes('runner.max_num_workers')) {
    return {
      description: 'Max parallel workers for task execution',
      type: 'integer',
      range: { min: 1, max: 32 },
      default: 1,
    };
  }

  if (fieldPath.startsWith('summarizer.') && fieldPath.includes('summary_groups')) {
    return {
      description: 'Grouping key used by summarizer for aggregated reporting',
      type: 'array',
      default: ['language_understanding', 'logic_reasoning'],
    };
  }
  
  return null;
}