import React, { useState, useEffect } from 'react';
import {
  List,
  Input,
  Select,
  Space,
  Button,
  Typography,
  Tooltip,
  Badge,
  message,
} from 'antd';
import {
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { BenchmarkTask, TaskStatus } from '../../types';
import { useTaskListStore } from '../../store/taskListStore';

const { Text, Title } = Typography;

const STATUS_CONFIG = {
  PENDING: {
    color: 'default',
    icon: <ClockCircleOutlined />,
    label: 'Pending',
  },
  RUNNING: {
    color: 'processing',
    icon: <PlayCircleOutlined />,
    label: 'Running',
  },
  SUCCESS: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: 'Success',
  },
  FAILED: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: 'Failed',
  },
  CANCELLED: {
    color: 'default',
    icon: <StopOutlined />,
    label: 'Cancelled',
  },
};

export const TaskListPanel: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [cardModelFilter, setCardModelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status'>('createdAt');

  const { tasks, selectedTask, setSelectedTask, updateTaskStatus } = useTaskListStore();

  useEffect(() => {
    const mockTasks: BenchmarkTask[] = [
      {
        id: 'task-001',
        name: 'Llama3-8B FP16 Inference',
        status: 'RUNNING',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'workflow-001',
        resources: {
          cardModel: 'NVIDIA H100',
          driverVersion: '535.129.03',
          cudaVersion: '12.2',
        },
        dataLineage: {
          datasetName: 'C-Eval',
          datasetVersionHash: 'a1b2c3d',
          modelWeightHash: 'e4f5g6h',
        },
      },
      {
        id: 'task-002',
        name: 'Qwen-14B INT8 Evaluation',
        status: 'SUCCESS',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'workflow-002',
        resources: {
          cardModel: 'NVIDIA A100',
          driverVersion: '535.129.03',
          cudaVersion: '12.2',
        },
        dataLineage: {
          datasetName: 'MMLU',
          datasetVersionHash: 'b2c3d4e',
          modelWeightHash: 'f5g6h7i',
        },
      },
      {
        id: 'task-003',
        name: 'GPT-4 FP32 Benchmark',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'workflow-003',
        resources: {
          cardModel: 'NVIDIA H100',
          driverVersion: '535.129.03',
          cudaVersion: '12.2',
        },
        dataLineage: {
          datasetName: 'C-Eval',
          datasetVersionHash: 'a1b2c3d',
          modelWeightHash: 'g6h7i8j',
        },
      },
      {
        id: 'task-004',
        name: 'Claude-3 Evaluation',
        status: 'FAILED',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'workflow-004',
        resources: {
          cardModel: 'Huawei 910B',
          driverVersion: '23.0.3',
        },
        dataLineage: {
          datasetName: 'MMLU',
          datasetVersionHash: 'c3d4e5f',
          modelWeightHash: 'h7i8j9k',
        },
      },
      {
        id: 'task-005',
        name: 'Llama3-70B INT4 Evaluation',
        status: 'RUNNING',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        createdBy: 'Admin User',
        createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        workflowId: 'workflow-005',
        resources: {
          cardModel: 'AMD MI300X',
          driverVersion: '5.7.1',
        },
        dataLineage: {
          datasetName: 'C-Eval',
          datasetVersionHash: 'a1b2c3d',
          modelWeightHash: 'i8j9k0l',
        },
      },
    ];

    useTaskListStore.setState({ tasks: mockTasks });
  }, []);

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchText.toLowerCase()) ||
        task.id.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesCardModel =
        cardModelFilter === 'all' || task.resources?.cardModel === cardModelFilter;
      return matchesSearch && matchesStatus && matchesCardModel;
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const statusOrder = ['RUNNING', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      }
    });

  const cardModels = Array.from(new Set(tasks.map((task) => task.resources?.cardModel || 'Unknown')));

  const handleTaskAction = (taskId: string, action: 'start' | 'pause' | 'stop') => {
    switch (action) {
      case 'start':
        updateTaskStatus(taskId, 'RUNNING');
        message.success('Task started');
        break;
      case 'pause':
        updateTaskStatus(taskId, 'PENDING');
        message.info('Task paused');
        break;
      case 'stop':
        updateTaskStatus(taskId, 'CANCELLED');
        message.warning('Task stopped');
        break;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <Badge
        status={config.color as any}
        text={
          <Space size={4}>
            {config.icon}
            <span>{config.label}</span>
          </Space>
        }
      />
    );
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ color: '#fff', margin: 0 }}>
          Task List
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {tasks.length} tasks total
        </Text>
      </div>

      <Space orientation="vertical" style={{ width: '100%', marginBottom: '16px' }} size="small">
        <Input
          placeholder="Search tasks..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
        />

        <Space size="small" style={{ width: '100%' }}>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ flex: 1 }}
            size="small"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'SUCCESS', label: 'Success' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />

          <Select
            value={cardModelFilter}
            onChange={setCardModelFilter}
            style={{ flex: 1 }}
            size="small"
            options={[
              { value: 'all', label: 'All Cards' },
              ...cardModels.map((model) => ({ value: model, label: model })),
            ]}
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ flex: 1 }}
            size="small"
            options={[
              { value: 'createdAt', label: 'Time' },
              { value: 'status', label: 'Status' },
            ]}
          />
        </Space>
      </Space>

      <List
        dataSource={filteredTasks}
        renderItem={(task) => (
          <List.Item
            key={task.id}
            style={{
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: selectedTask?.id === task.id ? '#1890ff' : '#262626',
              borderRadius: '8px',
              border: selectedTask?.id === task.id ? '1px solid #1890ff' : '1px solid #303030',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onClick={() => setSelectedTask(task)}
          >
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1 }}>
                  <Text
                    strong
                    style={{
                      color: selectedTask?.id === task.id ? '#fff' : '#fff',
                      fontSize: '14px',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {task.name}
                  </Text>
                  <Text
                    code
                    style={{
                      fontSize: '11px',
                      backgroundColor: selectedTask?.id === task.id ? 'rgba(255,255,255,0.2)' : '#1f1f1f',
                      color: selectedTask?.id === task.id ? '#fff' : '#999',
                    }}
                  >
                    {task.id}
                  </Text>
                </div>
                {getStatusBadge(task.status)}
              </div>

              <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <Text type="secondary">
                    {task.resources?.cardModel || '-'}
                  </Text>
                  <Text type="secondary">
                    {task.dataLineage?.datasetName || '-'}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {new Date(task.createdAt).toLocaleString()}
                  </Text>
                  <Space size="small">
                    {task.status === 'PENDING' && (
                      <Tooltip title="Start Task">
                        <Button
                          type="text"
                          size="small"
                          icon={<PlayCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskAction(task.id, 'start');
                          }}
                          style={{ color: '#52c41a' }}
                        />
                      </Tooltip>
                    )}
                    {task.status === 'RUNNING' && (
                      <Tooltip title="Pause Task">
                        <Button
                          type="text"
                          size="small"
                          icon={<PauseCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskAction(task.id, 'pause');
                          }}
                          style={{ color: '#faad14' }}
                        />
                      </Tooltip>
                    )}
                    {(task.status === 'RUNNING' || task.status === 'PENDING') && (
                      <Tooltip title="Stop Task">
                        <Button
                          type="text"
                          size="small"
                          icon={<StopOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskAction(task.id, 'stop');
                          }}
                          style={{ color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    )}
                  </Space>
                </div>
              </Space>
            </div>
          </List.Item>
        )}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 4px',
        }}
      />
    </div>
  );
};
