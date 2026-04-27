import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Row, Col, Divider } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import type { TaskStatus, TaskPriority } from '../../types';
import { buildOpenCompassLikeConfig } from '../../utils/opencompassConfig';
import { generateConfigFile } from '../../services/configFileService';
import { ModelSelector } from './ModelSelector';
import { CapabilityModule } from './CapabilityModule';
import './LLMEvaluationConfig.css';

interface LLMEvaluationConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface TaskFormData {
  taskName: string;
}

interface CapabilitySelection {
  id: string;
  title: string;
  selectedTests?: string[];
  selectedDatasets?: string[];
}

export const LLMEvaluationConfig: React.FC<LLMEvaluationConfigProps> = ({ visible, onClose }) => {
  const { addTask } = useAppStore();
  const [form] = Form.useForm<TaskFormData>();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState<CapabilitySelection[]>([]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleVersionChange = (model: string, version: string) => {
    setSelectedVersion(prev => ({ ...prev, [model]: version }));
  };

  const handleCapabilitiesChange = (newCapabilities: CapabilitySelection[]) => {
    setCapabilities(newCapabilities);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedModel) {
        message.error('请选择模型');
        return;
      }

      if (!selectedVersion[selectedModel]) {
        message.error('请选择模型版本');
        return;
      }

      const hasSelectedCapability = capabilities.some(cap => 
        cap.selectedTests && cap.selectedTests.length > 0
      );

      if (!hasSelectedCapability) {
        message.error('请至少选择一个能力测试');
        return;
      }

      const selectedCapabilities = capabilities
        .filter(cap => cap.selectedTests && cap.selectedTests.length > 0)
        .map(cap => ({
          id: cap.id,
          title: cap.title || '',
          tests: cap.selectedTests || [],
          datasets: cap.selectedDatasets || []
        }));

      const taskData = {
        taskName: values.taskName,
        model: selectedModel,
        version: selectedVersion[selectedModel],
        capabilities: selectedCapabilities
      };

      console.log('提交任务数据:', taskData);

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const openCompassConfig = buildOpenCompassLikeConfig({
        taskName: taskData.taskName,
        model: taskData.model,
        version: taskData.version,
        capabilities: taskData.capabilities,
      });
      const configWriteResult = await generateConfigFile({
        taskId,
        taskName: taskData.taskName,
        taskType: 'llm',
        config: openCompassConfig,
      });

      const newTask = {
        id: taskId,
        name: taskData.taskName || `${taskData.model} - ${taskData.version} 评测`,
        type: 'llm' as const,
        status: 'PENDING' as TaskStatus,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'llm-evaluation',
        llmConfig: {
          model: taskData.model,
          version: taskData.version,
          capabilities: taskData.capabilities,
          openCompassConfig,
          generatedConfigFile: configWriteResult.success ? configWriteResult.file : undefined,
          configGenerationError: configWriteResult.success ? undefined : configWriteResult.error,
        },
        priority: 'P2' as TaskPriority,
        estimatedStartTime: new Date(Date.now() + Math.random() * 1800000 + 300000).toISOString(),
        queuePosition: Math.floor(Math.random() * 10) + 1,
      };

      addTask(newTask);
      if (configWriteResult.success) {
        message.success('评测任务创建成功，配置文件已生成');
      } else {
        message.warning(`任务已创建，但配置文件落盘失败：${configWriteResult.error}`);
      }
      onClose();
      form.resetFields();
      setSelectedModel('');
      setSelectedVersion({});
      setCapabilities([]);

    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedModel('');
    setSelectedVersion({});
    setCapabilities([]);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>创建大模型自动化评测</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          创建任务
        </Button>,
      ]}
      width={1200}
      style={{ top: 20 }}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#141414'
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          taskName: ''
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label={<span style={{ color: '#fff' }}>任务标题</span>}
              name="taskName"
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input
                placeholder="请为任务设定名称"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#434343' }} />

        <ModelSelector
          selectedModel={selectedModel}
          selectedVersion={selectedVersion}
          onModelChange={handleModelChange}
          onVersionChange={handleVersionChange}
        />

        <Divider style={{ borderColor: '#434343' }} />

        <CapabilityModule
          capabilities={capabilities}
          onCapabilitiesChange={handleCapabilitiesChange}
        />
      </Form>
    </Modal>
  );
};
