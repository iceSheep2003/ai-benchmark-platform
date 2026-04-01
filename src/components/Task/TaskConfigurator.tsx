import React, { useState } from 'react';
import { Button, Checkbox, Card, Row, Col, Select, Divider, Space, Pagination, Table } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import './LLMEvaluationConfig.css';

interface TaskConfiguratorProps {
  tasks: TaskDimension[];
  onTasksChange: (tasks: TaskDimension[]) => void;
}

export interface TaskDimension {
  id: string;
  title: string;
  icon: string;
  description: string;
  tests: { label: string; value: string }[];
  datasets: { label: string; value: string }[];
  selectedTests?: string[];
  selectedDatasets?: string[];
}

const initialTasks: TaskDimension[] = [
  {
    id: 'performance',
    title: '性能测试',
    icon: '⚡',
    description: '评估加速卡的训练和推理性能',
    tests: [
      { label: '训练吞吐率', value: 'training_throughput' },
      { label: '推理延迟', value: 'inference_latency' },
      { label: '显存利用率', value: 'memory_utilization' },
    ],
    datasets: [
      { label: 'DeepSpark 多卡测试', value: 'deepspark_multi' },
      { label: 'MNIST', value: 'mnist' },
      { label: 'ImageNet-1K', value: 'imagenet' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'power',
    title: '功耗测试',
    icon: '🔋',
    description: '测量加速卡的能耗和散热性能',
    tests: [
      { label: '峰值功耗', value: 'peak_power' },
      { label: '平均功耗', value: 'avg_power' },
      { label: '温度控制', value: 'temperature' },
    ],
    datasets: [
      { label: 'MLPerf', value: 'mlperf' },
      { label: 'SpecPower', value: 'specpower' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'stability',
    title: '稳定性测试',
    icon: '🛡️',
    description: '验证长时间运行的稳定性',
    tests: [
      { label: '长时间运行', value: 'long_running' },
      { label: '压力测试', value: 'stress_test' },
    ],
    datasets: [
      { label: 'DeepSpark 稳定性测试', value: 'deepspark_stability' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'compatibility',
    title: '兼容性测试',
    icon: '🔗',
    description: '测试加速卡与软硬件的兼容性',
    tests: [
      { label: '框架兼容性', value: 'framework_compatibility' },
      { label: '驱动兼容性', value: 'driver_compatibility' },
      { label: '系统兼容性', value: 'system_compatibility' },
    ],
    datasets: [
      { label: 'PyTorch 兼容性测试', value: 'pytorch_compat' },
      { label: 'TensorFlow 兼容性测试', value: 'tensorflow_compat' },
      { label: 'MindSpore 兼容性测试', value: 'mindspore_compat' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'precision',
    title: '精度测试',
    icon: '🎯',
    description: '验证不同精度下的计算准确性',
    tests: [
      { label: 'FP32 精度', value: 'fp32_precision' },
      { label: 'FP16 精度', value: 'fp16_precision' },
      { label: 'BF16 精度', value: 'bf16_precision' },
      { label: 'INT8 精度', value: 'int8_precision' },
    ],
    datasets: [
      { label: '精度基准测试集', value: 'precision_benchmark' },
      { label: 'MLPerf 精度测试', value: 'mlperf_precision' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
];

export const TaskConfigurator: React.FC<TaskConfiguratorProps> = ({
  tasks,
  onTasksChange,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [localTasks, setLocalTasks] = React.useState<TaskDimension[]>(
    tasks.length > 0 ? tasks : initialTasks
  );

  React.useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const handleToggleAll = () => {
    const allSelected = localTasks.every(
      task => task.selectedTests && task.selectedTests.length > 0
    );

    const updatedTasks = localTasks.map(task => {
      if (allSelected) {
        return {
          ...task,
          selectedTests: [],
          selectedDatasets: [],
        };
      } else {
        return {
          ...task,
          selectedTests: task.tests.map(test => test.value),
          selectedDatasets: task.datasets.map(dataset => dataset.value),
        };
      }
    });

    setLocalTasks(updatedTasks);
    onTasksChange(updatedTasks);
  };

  const handleTestChange = (taskId: string, checkedValues: string[]) => {
    const updatedTasks = localTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          selectedTests: checkedValues,
        };
      }
      return task;
    });

    setLocalTasks(updatedTasks);
    onTasksChange(updatedTasks);
  };

  const handleDatasetChange = (taskId: string, selectedValues: string[]) => {
    const updatedTasks = localTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          selectedDatasets: selectedValues,
        };
      }
      return task;
    });

    setLocalTasks(updatedTasks);
    onTasksChange(updatedTasks);
  };

  const isAllSelected = localTasks.every(
    task => task.selectedTests && task.selectedTests.length > 0
  );

  const paginatedTasks = localTasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      title: '任务维度',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: TaskDimension) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 20, marginRight: 12 }}>{record.icon}</span>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{text}</span>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span style={{ color: '#999', fontSize: 14 }}>{text}</span>
      ),
    },
    {
      title: '测试项',
      key: 'tests',
      render: (_: unknown, record: TaskDimension) => (
        <Checkbox.Group
          value={record.selectedTests || []}
          onChange={(values) => handleTestChange(record.id, values as string[])}
        >
          <Space direction="vertical" size="small">
            {record.tests.map((test) => (
              <Checkbox key={test.value} value={test.value} style={{ color: '#fff' }}>
                {test.label}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      ),
    },
    {
      title: '测试数据集',
      key: 'datasets',
      render: (_: unknown, record: TaskDimension) => (
        <Select
          mode="multiple"
          placeholder="请选择测试数据集"
          value={record.selectedDatasets || []}
          onChange={(values) => handleDatasetChange(record.id, values as string[])}
          options={record.datasets}
          style={{ width: '100%' }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#fff' }}>
          任务配置
        </h3>
        <Space>
          <Button 
            type="link" 
            onClick={handleToggleAll}
            style={{ padding: 0, color: '#1890ff' }}
          >
            {isAllSelected ? (
              <>
                <CloseOutlined style={{ marginRight: 4 }} />
                全不选
              </>
            ) : (
              <>
                <CheckOutlined style={{ marginRight: 4 }} />
                全选
              </>
            )}
          </Button>
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
            options={[
              { label: '卡片视图', value: 'card' },
              { label: '表格视图', value: 'table' },
            ]}
          />
        </Space>
      </div>

      {viewMode === 'card' ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedTasks.map((task) => (
              <Col key={task.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  style={{
                    border: task.selectedTests && task.selectedTests.length > 0 
                      ? '2px solid #1890ff' 
                      : '1px solid #434343',
                    backgroundColor: task.selectedTests && task.selectedTests.length > 0 
                      ? '#2a2a3a' 
                      : '#1f1f1f',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 24, marginRight: 12 }}>{task.icon}</span>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>
                        {task.title}
                      </h4>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 14, 
                      color: '#999',
                      lineHeight: 1.5 
                    }}>
                      {task.description}
                    </p>
                  </div>

                  <Divider style={{ margin: '12px 0', borderColor: '#434343' }} />

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: '#fff'
                    }}>
                      测试项：
                    </label>
                    <Checkbox.Group
                      value={task.selectedTests || []}
                      onChange={(values) => handleTestChange(task.id, values as string[])}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {task.tests.map((test) => (
                          <Checkbox key={test.value} value={test.value} style={{ color: '#fff' }}>
                            {test.label}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: '#fff'
                    }}>
                      测试数据集：
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="请选择测试数据集"
                      value={task.selectedDatasets || []}
                      onChange={(values) => handleDatasetChange(task.id, values as string[])}
                      options={task.datasets}
                      style={{ width: '100%' }}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {localTasks.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={localTasks.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                style={{ color: '#fff' }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Table
            dataSource={paginatedTasks}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ backgroundColor: '#1f1f1f' }}
            rowClassName={(record) => 
              record.selectedTests && record.selectedTests.length > 0 ? 'selected-row' : ''
            }
          />
          {localTasks.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={localTasks.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                style={{ color: '#fff' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
