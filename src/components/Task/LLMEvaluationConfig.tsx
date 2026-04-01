import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Row, Col, Divider } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import type { TaskStatus, TaskPriority } from '../../types';
import { ModelSelector } from './ModelSelector';
import { CapabilityModule } from './CapabilityModule';
import './LLMEvaluationConfig.css';

interface LLMEvaluationConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface TaskFormData {
  taskName: string;
  model: string;
  version: string;
  capabilities: {
    id: string;
    tests: string[];
    datasets: string[];
  }[];
}

export const LLMEvaluationConfig: React.FC<LLMEvaluationConfigProps> = ({ visible, onClose }) => {
  const { addTask } = useAppStore();
  const [form] = Form.useForm<TaskFormData>();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<Record<string, string>>({});
  const [capabilities, setCapabilities] = useState<any[]>([]);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleVersionChange = (model: string, version: string) => {
    setSelectedVersion(prev => ({ ...prev, [model]: version }));
  };

  const handleCapabilitiesChange = (newCapabilities: any[]) => {
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

      const taskData = {
        taskName: values.taskName,
        model: selectedModel,
        version: selectedVersion[selectedModel],
        capabilities: capabilities
          .filter(cap => cap.selectedTests && cap.selectedTests.length > 0)
          .map(cap => ({
            id: cap.id,
            tests: cap.selectedTests,
            datasets: cap.selectedDatasets || []
          }))
      };

      console.log('提交任务数据:', taskData);

      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          capabilities: taskData.capabilities.map(cap => ({
            id: cap.id,
            title: capabilities.find(c => c.id === cap.id)?.title || '',
            tests: cap.tests,
            datasets: cap.datasets
          }))
        },
        priority: 'P2' as TaskPriority,
        estimatedStartTime: new Date(Date.now() + Math.random() * 1800000 + 300000).toISOString(),
        queuePosition: Math.floor(Math.random() * 10) + 1,
      };

      addTask(newTask);
      message.success('评测任务创建成功');
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
