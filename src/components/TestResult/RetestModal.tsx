import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Row, Col, Divider, Tag, Space, Alert, Card } from 'antd';
import { ReloadOutlined, LockOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import type { TaskStatus, TaskPriority } from '../../types';
import { buildOpenCompassLikeConfig } from '../../utils/opencompassConfig';
import { generateConfigFile } from '../../services/configFileService';
import { CapabilityModule } from '../Task/CapabilityModule';
import '../Task/LLMEvaluationConfig.css';
import type { TestModel } from '../../mockData/testResultMock';

interface RetestModalProps {
  visible: boolean;
  model: TestModel | null;
  onClose: () => void;
}

export const RetestModal: React.FC<RetestModalProps> = ({ visible, model, onClose }) => {
  const { addTask } = useAppStore();
  const [form] = Form.useForm();
  const [capabilities, setCapabilities] = useState<{
    id: string;
    title: string;
    selectedTests?: string[];
    selectedDatasets?: string[];
  }[]>([]);

  useEffect(() => {
    if (visible && model) {
      form.setFieldsValue({
        taskName: `${model.name} - ${model.version} 重新评测`,
      });
    }
  }, [visible, model, form]);

  const handleCapabilitiesChange = (newCapabilities: {
    id: string;
    title: string;
    selectedTests?: string[];
    selectedDatasets?: string[];
  }[]) => {
    setCapabilities(newCapabilities);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!model) {
        message.error('模型信息缺失');
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
        model: model.name,
        version: model.version,
        capabilities: selectedCapabilities,
      };

      console.log('提交重新测试任务数据:', taskData);

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
        name: taskData.taskName,
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
        message.success('重新测试任务创建成功，配置文件已生成');
      } else {
        message.warning(`任务已创建，但配置文件落盘失败：${configWriteResult.error}`);
      }
      handleClose();

    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCapabilities([]);
    onClose();
  };

  if (!model) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <ReloadOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>重新测试 - {model.name}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          创建测试任务
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
      <Alert
        type="info"
        showIcon
        icon={<LockOutlined />}
        message="模型和版本已锁定"
        description={
          <Space>
            <span>当前模型：</span>
            <Tag color="blue">{model.name}</Tag>
            <span>版本：</span>
            <Tag color="green">{model.version}</Tag>
          </Space>
        }
        style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #1890ff' }}
      />

      <Form
        form={form}
        layout="vertical"
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

        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#fff', marginBottom: 8, fontWeight: 500 }}>模型信息</div>
          <Card 
            size="small" 
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ color: '#999', marginBottom: 4 }}>模型名称</div>
                <Tag color="blue" style={{ fontSize: 14 }}>{model.name}</Tag>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', marginBottom: 4 }}>版本</div>
                <Tag color="green" style={{ fontSize: 14 }}>{model.version}</Tag>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', marginBottom: 4 }}>参数量</div>
                <Tag style={{ fontSize: 14 }}>{model.params}</Tag>
              </Col>
            </Row>
          </Card>
        </div>

        <Divider style={{ borderColor: '#434343' }} />

        <CapabilityModule
          capabilities={capabilities}
          onCapabilitiesChange={handleCapabilitiesChange}
        />
      </Form>
    </Modal>
  );
};

export default RetestModal;
