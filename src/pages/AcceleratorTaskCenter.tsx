import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, message, Modal, Card, Progress, Row, Col, Statistic, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, StopOutlined, ThunderboltOutlined, ClockCircleOutlined, ApiOutlined, HeatMapOutlined, SafetyOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { BenchmarkTask, TaskStatus } from '../types';
import { useAppStore } from '../store/appStore';
import { AcceleratorEvaluationConfig } from '../components/Task/AcceleratorEvaluationConfig';

const AcceleratorTaskCenter: React.FC = () => {
  const { tasks, setTasks, setSelectedTask, setCurrentPage, clusterStats } = useAppStore();
  const [filteredTasks, setFilteredTasks] = useState<BenchmarkTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);

  useEffect(() => {
    let filtered = tasks.filter(task => task.type === 'accelerator');

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (searchText) {
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          task.id.toLowerCase().includes(searchText.toLowerCase()) ||
          task.resources?.cardModel?.toLowerCase().includes(searchText.toLowerCase())
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
          🟢 运行中
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
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <code style={{ color: '#1890ff', fontSize: 12 }}>{text}</code>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '加速卡',
      key: 'accelerator',
      width: 160,
      render: (_, record) => {
        const cardModel = record.resources?.cardModel || record.acceleratorConfig?.accelerator || '-';
        const acceleratorMap: Record<string, { name: string; icon: string }> = {
          'nvidia-a100': { name: 'NVIDIA A100', icon: '🟢' },
          'nvidia-v100': { name: 'NVIDIA V100', icon: '🟢' },
          'nvidia-h100': { name: 'NVIDIA H100', icon: '🟢' },
          'huawei-910b': { name: '华为昇腾 910B', icon: '🔴' },
          'hygon-k100': { name: '海光 K100', icon: '🔵' },
          'maxx-c500': { name: '沐曦 C500', icon: '🟡' },
          'maxx-c650': { name: '沐曦 C650', icon: '🟡' },
          'kunlun-480': { name: '昆仑芯 480', icon: '🟣' },
        };
        const info = acceleratorMap[cardModel] || { name: cardModel, icon: '⚡' };
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>{info.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{info.name}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '测试维度',
      key: 'testDimensions',
      width: 180,
      render: (_, record) => {
        const tasks = record.acceleratorConfig?.tasks || [];
        if (tasks.length === 0) return '-';
        
        const iconMap: Record<string, string> = {
          '性能测试': '⚡',
          '功耗测试': '🔋',
          '稳定性测试': '🛡️',
          '兼容性测试': '🔗',
          '精度测试': '🎯',
        };
        
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {tasks.slice(0, 3).map((task, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                <span style={{ marginRight: 6 }}>{iconMap[task.title] || '📋'}</span>
                <span>{task.title}</span>
              </div>
            ))}
            {tasks.length > 3 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{tasks.length - 3} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '测试项',
      key: 'testItems',
      width: 220,
      render: (_, record) => {
        const tasks = record.acceleratorConfig?.tasks || [];
        if (tasks.length === 0) return '-';
        
        const allTests = tasks.flatMap(task => task.tests);
        const testLabels: Record<string, string> = {
          'training_throughput': '训练吞吐率',
          'inference_latency': '推理延迟',
          'memory_utilization': '显存利用率',
          'peak_power': '峰值功耗',
          'avg_power': '平均功耗',
          'temperature': '温度控制',
          'long_running': '长时间运行',
          'stress_test': '压力测试',
          'framework_compatibility': '框架兼容性',
          'driver_compatibility': '驱动兼容性',
          'system_compatibility': '系统兼容性',
          'fp32_precision': 'FP32 精度',
          'fp16_precision': 'FP16 精度',
          'bf16_precision': 'BF16 精度',
          'int8_precision': 'INT8 精度',
        };
        
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {allTests.slice(0, 4).map((test, idx) => (
              <Tag key={idx} color="blue" style={{ margin: 0, fontSize: 12 }}>
                {testLabels[test] || test}
              </Tag>
            ))}
            {allTests.length > 4 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{allTests.length - 4} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '数据集',
      key: 'datasets',
      width: 180,
      render: (_, record) => {
        const tasks = record.acceleratorConfig?.tasks || [];
        if (tasks.length === 0) return '-';
        
        const allDatasets = tasks.flatMap(task => task.datasets);
        if (allDatasets.length === 0) return '-';
        
        const datasetLabels: Record<string, string> = {
          'deepspark_multi': 'DeepSpark 多卡测试',
          'mnist': 'MNIST',
          'imagenet': 'ImageNet-1K',
          'mlperf': 'MLPerf',
          'specpower': 'SpecPower',
          'deepspark_stability': 'DeepSpark 稳定性测试',
          'pytorch_compat': 'PyTorch 兼容性测试',
          'tensorflow_compat': 'TensorFlow 兼容性测试',
          'mindspore_compat': 'MindSpore 兼容性测试',
          'precision_benchmark': '精度基准测试集',
          'mlperf_precision': 'MLPerf 精度测试',
        };
        
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {allDatasets.slice(0, 3).map((dataset, idx) => (
              <Tag key={idx} color="green" style={{ margin: 0, fontSize: 12 }}>
                {datasetLabels[dataset] || dataset}
              </Tag>
            ))}
            {allDatasets.length > 3 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{allDatasets.length - 3} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '线下测试',
      key: 'offlineTests',
      width: 140,
      render: (_, record) => {
        const offlineTests = record.acceleratorConfig?.offlineTests || [];
        if (offlineTests.length === 0) return '-';
        
        const iconMap: Record<string, string> = {
          '功能测试': '✅',
          '兼容性测试': '🔗',
          '可靠性测试': '🔒',
        };
        
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {offlineTests.map((test, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                <span style={{ marginRight: 4 }}>{iconMap[test.title] || '📋'}</span>
                <span>{test.title}</span>
              </div>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => getStatusBadge(status),
    },
    {
      title: '创建人',
      key: 'createdBy',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Avatar 
            size="small" 
            src={record.createdByAvatar} 
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.createdBy?.charAt(0) || 'U'}
          </Avatar>
          <span style={{ fontSize: 13 }}>{record.createdBy || 'Unknown'}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const renderActionButtons = () => {
          const buttons = [];
          
          buttons.push(
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewTask(record)}
            >
              查看
            </Button>
          );
          
          if (record.status === 'PENDING') {
            buttons.push(
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => handleStartTask(record.id)}
              >
                启动
              </Button>
            );
            buttons.push(
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(record.id)}
              >
                删除
              </Button>
            );
          } else if (record.status === 'RUNNING') {
            buttons.push(
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleStopTask(record.id)}
              >
                停止
              </Button>
            );
          } else if (record.status === 'SUCCESS' || record.status === 'FAILED') {
            buttons.push(
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(record.id)}
              >
                删除
              </Button>
            );
          } else if (record.status === 'CANCELLED') {
            buttons.push(
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => handleContinueTask(record.id)}
              >
                继续
              </Button>
            );
            buttons.push(
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteTask(record.id)}
              >
                删除
              </Button>
            );
          }
          
          return buttons;
        };
        
        return <Space size="small">{renderActionButtons()}</Space>;
      },
    },
  ];

  const handleViewTask = (task: BenchmarkTask) => {
    setSelectedTask(task);
    setCurrentPage('task-detail');
  };

  const handleStartTask = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'RUNNING' as BenchmarkTask['status'] } : task
    );
    setTasks(updatedTasks);
    message.success(`任务 ${taskId} 已启动`);
  };

  const handleStopTask = (taskId: string) => {
    Modal.confirm({
      title: '确认停止任务',
      content: '确定要停止这个任务吗？',
      onOk: () => {
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'CANCELLED' as BenchmarkTask['status'] } : task
        );
        setTasks(updatedTasks);
        message.success(`任务 ${taskId} 已停止`);
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    Modal.confirm({
      title: '确认删除任务',
      content: '确定要删除这个任务吗？删除后无法恢复。',
      onOk: () => {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);
        message.success(`任务 ${taskId} 已删除`);
      },
    });
  };

  const handleContinueTask = (taskId: string) => {
    Modal.confirm({
      title: '确认继续任务',
      content: '确定要继续执行这个任务吗？',
      onOk: () => {
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status: 'PENDING' as BenchmarkTask['status'] } : task
        );
        setTasks(updatedTasks);
        message.success(`任务 ${taskId} 已重新提交`);
      },
    });
  };

  const acceleratorStats = {
    totalTasks: filteredTasks.length,
    runningTasks: filteredTasks.filter(t => t.status === 'RUNNING').length,
    successTasks: filteredTasks.filter(t => t.status === 'SUCCESS').length,
    failedTasks: filteredTasks.filter(t => t.status === 'FAILED').length,
  };

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

      <Card title="加速卡测评概览" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Statistic
              title="总任务数"
              value={acceleratorStats.totalTasks}
              prefix={<ThunderboltOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Statistic
              title="运行中"
              value={acceleratorStats.runningTasks}
              prefix={<ApiOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Statistic
              title="已完成"
              value={acceleratorStats.successTasks}
              prefix={<SafetyOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Statistic
              title="失败"
              value={acceleratorStats.failedTasks}
              prefix={<HeatMapOutlined />}
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="集群资源状态" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>GPU 利用率</span>
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
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>显存利用率</span>
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
                  title="可用 GPU"
                  value={clusterStats.availableGPUs}
                  prefix={<ApiOutlined />}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col xs={8} sm={8} md={8} lg={8} xl={8}>
                <Statistic
                  title="排队任务"
                  value={clusterStats.queuedTasks}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              <Col xs={8} sm={8} md={8} lg={8} xl={8}>
                <Statistic
                  title="平均等待时间"
                  value={clusterStats.avgQueueWaitTime}
                  suffix="分钟"
                  prefix={<ClockCircleOutlined />}
                  styles={{ content: { color: '#722ed1' } }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索任务..."
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'PENDING', label: '等待中' },
                { value: 'RUNNING', label: '运行中' },
                { value: 'SUCCESS', label: '成功' },
                { value: 'FAILED', label: '失败' },
                { value: 'CANCELLED', label: '已取消' },
              ]}
            />
            <Button type="primary" onClick={() => setCreateTaskModalVisible(true)}>
              创建评测任务
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个任务`,
          }}
        />
      </Card>

      <AcceleratorEvaluationConfig
        visible={createTaskModalVisible}
        onClose={() => setCreateTaskModalVisible(false)}
      />
    </div>
  );
};

export default AcceleratorTaskCenter;
