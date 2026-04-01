import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Row, Col, Divider } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import type { TaskStatus, TaskPriority } from '../../types';
import { AcceleratorSelector } from './AcceleratorSelector';
import { TaskConfigurator, type TaskDimension } from './TaskConfigurator';
import { OfflineTestSelector, type OfflineTest } from './OfflineTestSelector';
import './LLMEvaluationConfig.css';

interface AcceleratorEvaluationConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface AcceleratorEvaluationFormData {
  taskName: string;
  accelerator: string;
  tasks: TaskDimension[];
  offlineTests: OfflineTest[];
}

export const AcceleratorEvaluationConfig: React.FC<AcceleratorEvaluationConfigProps> = ({ 
  visible, 
  onClose 
}) => {
  const { addTask } = useAppStore();
  const [form] = Form.useForm<AcceleratorEvaluationFormData>();
  const [selectedAccelerator, setSelectedAccelerator] = useState<string>('');
  const [tasks, setTasks] = useState<TaskDimension[]>([]);
  const [offlineTests, setOfflineTests] = useState<OfflineTest[]>([]);

  const handleAcceleratorChange = (accelerator: string) => {
    setSelectedAccelerator(accelerator);
  };

  const handleTasksChange = (newTasks: TaskDimension[]) => {
    setTasks(newTasks);
  };

  const handleOfflineTestsChange = (newTests: OfflineTest[]) => {
    setOfflineTests(newTests);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedAccelerator) {
        message.error('请选择加速卡');
        return;
      }

      const hasSelectedTask = tasks.some(task => 
        task.selectedTests && task.selectedTests.length > 0
      );

      if (!hasSelectedTask) {
        message.error('请至少选择一个任务维度的测试项');
        return;
      }

      const hasSelectedDataset = tasks.some(task => 
        task.selectedDatasets && task.selectedDatasets.length > 0
      );

      if (!hasSelectedDataset) {
        message.error('请至少选择一个数据集');
        return;
      }

      const taskData = {
        taskName: values.taskName,
        accelerator: selectedAccelerator,
        tasks: tasks
          .filter(task => task.selectedTests && task.selectedTests.length > 0)
          .map(task => ({
            id: task.id,
            title: task.title,
            tests: task.selectedTests || [],
            datasets: task.selectedDatasets || [],
          })),
        offlineTests: offlineTests.filter(test => test.enabled),
      };

      console.log('提交任务数据:', taskData);

      const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: taskData.taskName || `${taskData.accelerator} - 加速卡评测`,
        type: 'accelerator' as const,
        status: 'PENDING' as TaskStatus,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'accelerator-evaluation',
        resources: {
          cardModel: taskData.accelerator,
          driverVersion: '535.104',
          cudaVersion: '12.2',
        },
        acceleratorConfig: {
          accelerator: taskData.accelerator,
          tasks: taskData.tasks,
          offlineTests: taskData.offlineTests,
        },
        priority: 'P2' as TaskPriority,
        estimatedStartTime: new Date(Date.now() + Math.random() * 1800000 + 300000).toISOString(),
        queuePosition: Math.floor(Math.random() * 10) + 1,
      };

      addTask(newTask);
      message.success('加速卡评测任务创建成功');
      onClose();
      form.resetFields();
      setSelectedAccelerator('');
      setTasks([]);
      setOfflineTests([]);

    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedAccelerator('');
    setTasks([]);
    setOfflineTests([]);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>创建加速卡评测</span>
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

        <AcceleratorSelector
          selectedAccelerator={selectedAccelerator}
          onAcceleratorChange={handleAcceleratorChange}
        />

        <Divider style={{ borderColor: '#434343' }} />

        <TaskConfigurator
          tasks={tasks}
          onTasksChange={handleTasksChange}
        />

        <Divider style={{ borderColor: '#434343' }} />

        <OfflineTestSelector
          offlineTests={offlineTests}
          onOfflineTestsChange={handleOfflineTestsChange}
        />
      </Form>
    </Modal>
  );
};
