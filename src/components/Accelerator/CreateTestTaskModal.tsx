import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Spin, Card, Tag, Space, Divider } from 'antd';
import {
  testCaseApi,
  acceleratorTaskApi,
  type TestCaseCatalogItem,
  type TestCategory,
  type CreateTestRequest,
  type SshTargetInfo,
} from '../../services/acceleratorTaskService';

interface Props {
  open: boolean;
  category?: TestCategory;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  chip_basic: 'AI芯片基础测试',
  model_training: '模型训练性能测试',
  model_inference: '模型推理性能测试',
  model_accuracy: '模型精度测试',
  ecosystem_compat: '生态兼容性测试',
  video_codec: '视频编解码测试',
};

const CreateTestTaskModal: React.FC<Props> = ({ open, category, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [catalogItems, setCatalogItems] = useState<TestCaseCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTestType, setSelectedTestType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<TestCaseCatalogItem | null>(null);
  const [sshTargets, setSshTargets] = useState<SshTargetInfo[]>([]);
  const execMode = Form.useWatch('execution_mode', form) ?? 'local';

  useEffect(() => {
    if (open) {
      setLoading(true);
      acceleratorTaskApi.listSshTargets().then((r) => setSshTargets(r.data.items)).catch(() => setSshTargets([]));
      testCaseApi
        .getCatalog(category)
        .then((res) => setCatalogItems(res.data.items))
        .catch(() => message.error('获取测试用例目录失败'))
        .finally(() => setLoading(false));
    }
  }, [open, category]);

  useEffect(() => {
    const item = catalogItems.find((c) => c.test_type === selectedTestType);
    setSelectedItem(item || null);
    if (item) {
      form.setFieldsValue({
        name: item.name,
        description: item.description,
        ...(item.default_config?.num_gpus ? { num_gpus: item.default_config.num_gpus } : {}),
      });
    }
  }, [selectedTestType, catalogItems, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const config: Record<string, unknown> = {
        test_type: selectedTestType,
        ...selectedItem?.default_config,
      };

      if (values.model_path) config.model_path = values.model_path;

      const mode = values.execution_mode as 'local' | 'ssh';
      const req: CreateTestRequest = {
        name: values.name,
        category: (category || selectedItem?.category || 'chip_basic') as TestCategory,
        test_type: selectedTestType,
        config,
        num_gpus: values.num_gpus || 1,
        description: values.description,
        execution: {
          mode,
          target_id: mode === 'ssh' ? values.ssh_target_id : undefined,
        },
      };

      await testCaseApi.create(req);
      message.success('测试任务已创建');
      form.resetFields();
      setSelectedTestType('');
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        message.error(`创建失败: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderConfigPreview = () => {
    if (!selectedItem?.default_config) return null;
    const cfg = selectedItem.default_config;
    return (
      <Card size="small" title="预设配置" style={{ marginTop: 12 }}>
        <Space wrap size={[8, 4]}>
          {Object.entries(cfg).map(([k, v]) => (
            <Tag key={k} color="blue">
              {k}: {Array.isArray(v) ? JSON.stringify(v) : String(v)}
            </Tag>
          ))}
        </Space>
        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
          指标: {selectedItem.metric}
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={`创建${category ? CATEGORY_LABELS[category] : '加速卡测试'}任务`}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      width={640}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ execution_mode: 'local', num_gpus: 1 }}
        >
          <Form.Item name="execution_mode" label="执行位置">
            <Select
              options={[
                { value: 'local', label: '本机（API 服务器）' },
                { value: 'ssh', label: 'SSH 远程（需远程已部署同仓库）' },
              ]}
              onChange={() => form.setFieldsValue({ ssh_target_id: undefined })}
            />
          </Form.Item>

          {execMode === 'ssh' && (
            <Form.Item
              name="ssh_target_id"
              label="远程主机"
              rules={[{ required: true, message: '请选择 SSH 目标' }]}
            >
              <Select
                placeholder="BENCHMARK_SSH_TARGETS"
                options={sshTargets.map((t) => ({
                  value: t.id,
                  label: `${t.id} (${t.user}@${t.host})`,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          )}

          {execMode === 'ssh' && sshTargets.length === 0 && (
            <div style={{ marginBottom: 12, color: '#faad14', fontSize: 12 }}>
              未配置 SSH 目标，见 backend/ssh-targets.example.json
            </div>
          )}

          <Form.Item label="选择测试项" required>
            <Select
              placeholder="请选择测试项"
              value={selectedTestType || undefined}
              onChange={setSelectedTestType}
              options={catalogItems.map((item) => ({
                value: item.test_type,
                label: (
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>
                      {item.description}
                    </span>
                  </div>
                ),
              }))}
              showSearch
              filterOption={(input, option) => {
                const item = catalogItems.find((c) => c.test_type === option?.value);
                return !!item?.name.toLowerCase().includes(input.toLowerCase());
              }}
            />
          </Form.Item>

          {renderConfigPreview()}

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item
            label="任务名称"
            name="name"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="如: ResNet50训练性能测试-H20" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="可选的任务描述" />
          </Form.Item>

          {(category === 'model_inference' ||
            category === 'model_accuracy' ||
            category === 'model_training') && (
            <Form.Item label="模型路径" name="model_path">
              <Input placeholder="如: /mnt/.../model/Qwen3-32B" />
            </Form.Item>
          )}

          <Form.Item label="GPU 数量" name="num_gpus">
            <InputNumber min={1} max={64} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default CreateTestTaskModal;
