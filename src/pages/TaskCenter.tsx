import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, message, Modal, Drawer, Card, Progress, Row, Col, Statistic, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, StopOutlined, FileTextOutlined, ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { BenchmarkTask, TaskStatus, TaskPriority } from '../types';
import { useAppStore } from '../store/appStore';
import { LLMEvaluationConfig } from '../components/Task/LLMEvaluationConfig';
import { simulatePriorityAdjustment } from '../mockData/schedulerSimulator';

const TaskCenter: React.FC = () => {
  const { tasks, setTasks, setSelectedTask, setCurrentPage, clusterStats, updateTaskPriority } = useAppStore();
  const [filteredTasks, setFilteredTasks] = useState<BenchmarkTask[]>(tasks);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [logsDrawerVisible, setLogsDrawerVisible] = useState(false);
  const [selectedTaskForLogs, setSelectedTaskForLogs] = useState<BenchmarkTask | null>(null);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);

  useEffect(() => {
    let filtered = tasks;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (searchText) {
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          task.id.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchText]);

  const getStatusColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      PENDING: 'default',
      RUNNING: 'processing',
      SUCCESS: 'success',
      FAILED: 'error',
      CANCELLED: 'default',
    };
    return colors[status];
  };

  const getStatusBadge = (status: TaskStatus) => {
    if (status === 'RUNNING') {
      return (
        <Tag color="processing" style={{ animation: 'pulse 2s infinite' }}>
          🟢 Running
        </Tag>
      );
    }
    const statusIcons: Record<TaskStatus, string> = {
      PENDING: '🟡',
      RUNNING: '🟢',
      SUCCESS: '✅',
      FAILED: '❌',
      CANCELLED: '⚪',
    };
    return (
      <Tag color={getStatusColor(status)}>
        {statusIcons[status]} {status}
      </Tag>
    );
  };

  const columns: ColumnsType<BenchmarkTask> = [
    {
      title: 'Task ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <code>{text}</code>,
    },
    {
      title: 'Task Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        if (type === 'llm') {
          return <Tag color="blue">大模型测评</Tag>;
        }
        return <Tag color="green">硬件测评</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: TaskStatus) => getStatusBadge(status),
    },
    {
      title: 'Target',
      key: 'target',
      width: 250,
      render: (_, record) => {
        if (record.type === 'llm') {
          return (
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {record.llmConfig?.model}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {record.llmConfig?.version}
              </div>
            </div>
          );
        }
        return record.resources?.cardModel || '-';
      },
    },
    {
      title: 'Details',
      key: 'details',
      width: 300,
      render: (_, record) => {
        if (record.type === 'llm') {
          const capabilities = record.llmConfig?.capabilities || [];
          return (
            <div>
              {capabilities.map((cap) => (
                <div key={cap.id} style={{ marginBottom: 8 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue">{cap.title}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {cap.tests.length} 测试项 · {cap.datasets.length} 数据集
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return record.dataLineage?.datasetName || '-';
      },
    },
    {
      title: '创建人',
      key: 'createdBy',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.createdByAvatar} 
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.createdBy?.charAt(0) || 'U'}
          </Avatar>
          <span>{record.createdBy || 'Unknown'}</span>
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: TaskPriority, record) => (
        <Select
          value={priority || 'P2'}
          size="small"
          style={{ width: '100%' }}
          disabled={record.status !== 'PENDING'}
          onChange={(newPriority) => handlePriorityChange(record.id, newPriority)}
          options={[
            { label: 'P0 (Critical)', value: 'P0' },
            { label: 'P1 (High)', value: 'P1' },
            { label: 'P2 (Normal)', value: 'P2' },
            { label: 'P3 (Low)', value: 'P3' },
          ]}
        />
      ),
    },
    {
      title: 'ETA',
      dataIndex: 'estimatedStartTime',
      key: 'estimatedStartTime',
      width: 150,
      render: (estimatedStartTime, record) => {
        if (record.status !== 'PENDING' || !estimatedStartTime) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        const eta = new Date(estimatedStartTime);
        const now = new Date();
        const diffMinutes = Math.floor((eta.getTime() - now.getTime()) / 60000);
        
        if (diffMinutes <= 0) {
          return <Tag color="green">Starting soon</Tag>;
        }
        
        return (
          <Tag color="blue" icon={<ClockCircleOutlined />}>
            {diffMinutes} min
          </Tag>
        );
      },
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTask(record)}
          >
            View
          </Button>
          {record.status === 'RUNNING' && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleStopTask(record.id)}
            >
              Stop
            </Button>
          )}
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewLogs(record)}
          >
            Logs
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewTask = (task: BenchmarkTask) => {
    setSelectedTask(task);
    setCurrentPage('task-detail');
  };

  const handleStopTask = (taskId: string) => {
    Modal.confirm({
      title: 'Stop Task',
      content: `Are you sure you want to stop task ${taskId}?`,
      onOk: () => {
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'CANCELLED' as BenchmarkTask['status'] } : task
        );
        setTasks(updatedTasks);
        message.success(`Task ${taskId} stopped`);
      },
    });
  };

  const handleViewLogs = (task: BenchmarkTask) => {
    setSelectedTaskForLogs(task);
    setLogsDrawerVisible(true);
  };

  const handlePriorityChange = (taskId: string, newPriority: TaskPriority) => {
    updateTaskPriority(taskId, newPriority);
    
    const result = simulatePriorityAdjustment(tasks, taskId, newPriority);
    setTasks(result.updatedTasks);
    
    message.success(`Priority updated to ${newPriority}. New ETA: ${new Date(result.newEta).toLocaleTimeString()}`);
  };



  const mockLogs = [
    '[2024-03-15 10:30:00] [INFO] Starting task execution',
    '[2024-03-15 10:30:01] [INFO] Loading model weights',
    '[2024-03-15 10:30:02] [INFO] Initializing CUDA context',
    '[2024-03-15 10:30:03] [INFO] Batch processing started',
    '[2024-03-15 10:30:04] [INFO] Processing batch 1/100',
    '[2024-03-15 10:30:05] [INFO] Processing batch 2/100',
    '[2024-03-15 10:30:06] [WARNING] GPU temperature slightly elevated',
    '[2024-03-15 10:30:07] [INFO] Processing batch 3/100',
    '[2024-03-15 10:30:08] [INFO] Processing batch 4/100',
    '[2024-03-15 10:30:09] [INFO] Processing batch 5/100',
  ];

  return (
    <div>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      <Card title="Cluster Resource Status" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>GPU Utilization</span>
                  <span style={{ color: clusterStats.gpuUtilization > 80 ? '#ff4d4f' : '#52c41a' }}>
                    {clusterStats.usedGPUs} / {clusterStats.totalGPUs}
                  </span>
                </div>
                <Progress
                  percent={clusterStats.gpuUtilization}
                  status={clusterStats.gpuUtilization > 80 ? 'exception' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Memory Utilization</span>
                  <span style={{ color: clusterStats.memoryUtilization > 80 ? '#ff4d4f' : '#52c41a' }}>
                    {clusterStats.usedMemoryGB} / {clusterStats.totalMemoryGB} GB
                  </span>
                </div>
                <Progress
                  percent={clusterStats.memoryUtilization}
                  status={clusterStats.memoryUtilization > 80 ? 'exception' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Row gutter={[16, 16]}>
              <Col xs={8} sm={8} md={8} lg={8} xl={8}>
                <Statistic
                  title="Available GPUs"
                  value={clusterStats.availableGPUs}
                  prefix={<ThunderboltOutlined />}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col xs={8} sm={8} md={8} lg={8} xl={8}>
                <Statistic
                  title="Queued Tasks"
                  value={clusterStats.queuedTasks}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              <Col xs={8} sm={8} md={8} lg={8} xl={8}>
                <Statistic
                  title="Avg Wait Time"
                  value={clusterStats.avgQueueWaitTime}
                  suffix="min"
                  prefix={<ClockCircleOutlined />}
                  styles={{ content: { color: '#722ed1' } }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Input.Search
            placeholder="Search tasks..."
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'SUCCESS', label: 'Success' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
          <Button type="primary" onClick={() => setCreateTaskModalVisible(true)}>
            Create New Task
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredTasks}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} tasks`,
        }}
      />

      <Drawer
        title={`Logs - ${selectedTaskForLogs?.name || 'Task'}`}
        placement="right"
        size="large"
        open={logsDrawerVisible}
        onClose={() => setLogsDrawerVisible(false)}
      >
        <div
          style={{
            backgroundColor: '#000',
            padding: '12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          {mockLogs.map((log, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              {log.includes('[ERROR]') ? (
                <span style={{ color: '#ff4d4f' }}>{log}</span>
              ) : log.includes('[WARNING]') ? (
                <span style={{ color: '#faad14' }}>{log}</span>
              ) : (
                <span style={{ color: '#52c41a' }}>{log}</span>
              )}
            </div>
          ))}
        </div>
      </Drawer>

      <LLMEvaluationConfig
        visible={createTaskModalVisible}
        onClose={() => setCreateTaskModalVisible(false)}
      />
    </div>
  );
};

export default TaskCenter;
