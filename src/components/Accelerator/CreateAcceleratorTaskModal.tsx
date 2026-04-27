import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, message, Space, Tag, Card, Row, Col, Statistic } from 'antd';
import { ThunderboltOutlined, CloudServerOutlined } from '@ant-design/icons';
import {
  acceleratorTaskApi,
  type SystemInfo,
  type CreateTaskRequest,
  type SshTargetInfo,
} from '../../services/acceleratorTaskService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DATASET_OPTIONS = [
  { value: 'gsm8k', label: 'GSM8K (数学推理)' },
  { value: 'mmlu', label: 'MMLU (多学科知识)' },
  { value: 'ceval', label: 'C-Eval (中文能力)' },
  { value: 'humaneval', label: 'HumanEval (代码生成)' },
  { value: 'hellaswag', label: 'HellaSwag (常识推理)' },
  { value: 'winogrande', label: 'WinoGrande (指代消解)' },
  { value: 'arc', label: 'ARC-C (科学推理)' },
];

const BACKEND_OPTIONS = [
  { value: 'huggingface', label: 'HuggingFace (标准)', description: '标准推理，无额外优化' },
  { value: 'vllm', label: 'vLLM (高性能)', description: 'PagedAttention，约3x加速' },
  { value: 'lmdeploy', label: 'LMDeploy (TurboMind)', description: '压缩部署，约2x加速' },
];

const MODEL_PRESETS = [
  { value: 'internlm/internlm2_5-1_8b-chat', label: 'InternLM2.5-1.8B-Chat' },
  { value: 'Qwen/Qwen2-7B-Instruct', label: 'Qwen2-7B-Instruct' },
  { value: 'meta-llama/Meta-Llama-3-8B-Instruct', label: 'Llama-3-8B-Instruct' },
  { value: 'THUDM/chatglm3-6b', label: 'ChatGLM3-6B' },
  { value: 'deepseek-ai/deepseek-llm-7b-chat', label: 'DeepSeek-7B-Chat' },
];

const CreateAcceleratorTaskModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [sshTargets, setSshTargets] = useState<SshTargetInfo[]>([]);

  useEffect(() => {
    if (open) {
      acceleratorTaskApi
        .listSshTargets()
        .then((r) => setSshTargets(r.data.items))
        .catch(() => setSshTargets([]));
      acceleratorTaskApi
        .getSystemInfo()
        .then((res) => {
          setSystemInfo(res.data);
          setBackendConnected(true);
        })
        .catch(() => {
          setBackendConnected(false);
        });
    }
  }, [open]);

  const execMode = Form.useWatch('execution_mode', form) ?? 'local';

  useEffect(() => {
    if (!open) return;
    if (execMode !== 'ssh') {
      acceleratorTaskApi.getSystemInfo().then((r) => setSystemInfo(r.data)).catch(() => {});
    }
  }, [open, execMode]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const mode = values.execution_mode as 'local' | 'ssh';
      const req: CreateTaskRequest = {
        name: values.name,
        model_path: values.model_path,
        datasets: values.datasets,
        backend: values.backend,
        num_gpus: values.num_gpus,
        batch_size: values.batch_size,
        max_out_len: values.max_out_len,
        priority: values.priority,
        execution: {
          mode,
          target_id: mode === 'ssh' ? values.ssh_target_id : undefined,
        },
      };

      const res = await acceleratorTaskApi.create(req);
      message.success(`评测任务已创建: ${res.data.id}`);
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        message.error(`创建失败: ${axiosErr.response?.data?.detail || '未知错误'}`);
      } else if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      } else {
        message.error('创建失败: 请检查后端服务是否启动');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined />
          <span>创建加速卡评测任务</span>
          {backendConnected === true && <Tag color="success">后端已连接</Tag>}
          {backendConnected === false && <Tag color="error">后端未连接</Tag>}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={720}
      okText="创建并启动"
      cancelText="取消"
    >
      {systemInfo && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="GPU 数量"
                value={systemInfo.gpu_count}
                prefix={<CloudServerOutlined />}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="GPU 型号"
                value={systemInfo.gpus[0]?.name?.replace('NVIDIA ', '') || 'N/A'}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总显存"
                value={`${(systemInfo.total_gpu_memory_mb / 1024).toFixed(0)} GB`}
                valueStyle={{ fontSize: 18 }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="主机"
                value={systemInfo.hostname}
                valueStyle={{ fontSize: 14 }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          backend: 'huggingface',
          datasets: ['gsm8k'],
          num_gpus: 1,
          batch_size: 8,
          max_out_len: 256,
          priority: 'P2',
          execution_mode: 'local',
        }}
      >
        <Form.Item name="execution_mode" label="执行位置">
          <Select
            options={[
              { value: 'local', label: '本机（运行后端的机器）' },
              { value: 'ssh', label: 'SSH 远程主机' },
            ]}
            onChange={() => form.setFieldsValue({ ssh_target_id: undefined })}
          />
        </Form.Item>

        {execMode === 'ssh' && (
          <Form.Item
            name="ssh_target_id"
            label="远程主机"
            rules={[{ required: true, message: '请选择已配置的 SSH 目标' }]}
          >
            <Select
              placeholder="从 BENCHMARK_SSH_TARGETS 加载"
              options={sshTargets.map((t) => ({
                value: t.id,
                label: `${t.id} (${t.user}@${t.host}:${t.port})`,
              }))}
              showSearch
              optionFilterProp="label"
              onChange={() => {
                const tid = form.getFieldValue('ssh_target_id') as string | undefined;
                if (tid) acceleratorTaskApi.getSystemInfo(tid).then((r) => setSystemInfo(r.data));
              }}
            />
          </Form.Item>
        )}

        {execMode === 'ssh' && sshTargets.length === 0 && (
          <div style={{ marginBottom: 12, color: '#faad14', fontSize: 13 }}>
            未配置 SSH 目标：在后端设置环境变量 BENCHMARK_SSH_TARGETS（JSON）或 BENCHMARK_SSH_TARGETS_FILE（文件路径），参考
            backend/ssh-targets.example.json
          </div>
        )}

        <Form.Item
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="例：InternLM2.5-1.8B vLLM加速评测" />
        </Form.Item>

        <Form.Item
          name="model_path"
          label="模型路径"
          rules={[{ required: true, message: '请选择或输入模型路径' }]}
        >
          <Select
            showSearch
            placeholder="选择预设模型或输入HuggingFace模型路径"
            options={MODEL_PRESETS}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
              (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          name="backend"
          label="推理后端"
          rules={[{ required: true }]}
        >
          <Select>
            {BACKEND_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <div>
                  <div style={{ fontWeight: 500 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{opt.description}</div>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="datasets"
          label="评测数据集"
          rules={[{ required: true, message: '请至少选择一个数据集' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择评测数据集"
            options={DATASET_OPTIONS}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="num_gpus" label="GPU 数量">
              <InputNumber min={1} max={systemInfo?.gpu_count || 8} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="batch_size" label="Batch Size">
              <InputNumber min={1} max={256} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="max_out_len" label="最大输出长度">
              <InputNumber min={64} max={4096} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="priority" label="优先级">
              <Select>
                <Select.Option value="P0">P0 (最高)</Select.Option>
                <Select.Option value="P1">P1</Select.Option>
                <Select.Option value="P2">P2 (默认)</Select.Option>
                <Select.Option value="P3">P3 (低)</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateAcceleratorTaskModal;
