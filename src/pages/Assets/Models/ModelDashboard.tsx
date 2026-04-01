import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Tag, Statistic, Space, Table, message } from 'antd';
import {
  RocketOutlined,
  EditOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ModelAsset } from '../../../types';
import { mockModels } from '../../../mockData/assetsMock';
import {
  createTaskFromModel,
  getBestHardwareForModel,
  getPerformanceTrend,
  getRelatedTasks,
} from '../../../services/assetTaskLinker';
import { useAppStore } from '../../../store/appStore';

const ModelsDashboard: React.FC = () => {
  const { setCurrentPage, setSelectedTask } = useAppStore();
  const [selectedModel, setSelectedModel] = useState<ModelAsset | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const performanceChartRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedModel && performanceChartRef.current) {
      const performanceChart = echarts.init(performanceChartRef.current);
      const performanceTrend = getPerformanceTrend(selectedModel);

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const date = new Date(params[0].name);
            return `${date.toLocaleString()}<br/>Throughput: ${params[0].value.toFixed(2)} tokens/s<br/>Latency: ${params[1].value.toFixed(2)} ms`;
          },
        },
        legend: {
          data: ['Throughput', 'Latency'],
        },
        xAxis: {
          type: 'category',
          data: performanceTrend.map(item => new Date(item.date).toLocaleDateString()),
        },
        yAxis: [
          {
            type: 'value',
            name: 'Throughput',
            position: 'left',
            axisLabel: {
              formatter: (value: number) => value.toFixed(0),
            },
          },
          {
            type: 'value',
            name: 'Latency',
            position: 'right',
            axisLabel: {
              formatter: (value: number) => value.toFixed(0),
            },
          },
        ],
        series: [
          {
            name: 'Throughput',
            type: 'line',
            data: performanceTrend.map(item => item.throughput),
            smooth: true,
            itemStyle: {
              color: '#1890ff',
            },
          },
          {
            name: 'Latency',
            type: 'line',
            yAxisIndex: 1,
            data: performanceTrend.map(item => item.latency),
            smooth: true,
            itemStyle: {
              color: '#52c41a',
            },
          },
        ],
      };

      performanceChart.setOption(option);

      return () => {
        performanceChart.dispose();
      };
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedModel && radarChartRef.current) {
      const radarChart = echarts.init(radarChartRef.current);

      const option = {
        tooltip: {
          trigger: 'item',
        },
        legend: {
          data: ['Throughput', 'Latency'],
        },
        radar: {
          indicator: selectedModel.benchmarks.map(benchmark => ({
            name: benchmark.gpuType,
            max: Math.max(
              ...selectedModel.benchmarks.map(b => b.throughput),
              ...selectedModel.benchmarks.map(b => b.latency)
            ),
          })),
        },
        series: [
          {
            name: 'Throughput',
            type: 'radar',
            data: selectedModel.benchmarks.map(benchmark => ({
              value: benchmark.throughput,
              name: benchmark.gpuType,
            })),
            itemStyle: {
              color: '#1890ff',
            },
            areaStyle: {
              color: 'rgba(24, 144, 255, 0.3)',
            },
          },
          {
            name: 'Latency',
            type: 'radar',
            data: selectedModel.benchmarks.map(benchmark => ({
              value: benchmark.latency,
              name: benchmark.gpuType,
            })),
            itemStyle: {
              color: '#52c41a',
            },
            areaStyle: {
              color: 'rgba(82, 196, 26, 0.3)',
            },
          },
        ],
      };

      radarChart.setOption(option);

      return () => {
        radarChart.dispose();
      };
    }
  }, [selectedModel]);

  const handleCreateTask = (model: ModelAsset) => {
    createTaskFromModel(model);
    setCurrentPage('tasks');
    message.success(`Creating new task for model: ${model.name}`);
  };

  const handleViewDetail = (model: ModelAsset) => {
    setSelectedModel(model);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedModel(null);
    setViewMode('list');
  };

  const handleViewRelatedTask = (taskId: string) => {
    const task = mockModels.find((m: ModelAsset) => m.benchmarks.some(b => b.taskId === taskId));
    if (task) {
      setSelectedTask({
        id: taskId,
        name: `${task.name} Benchmark`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        createdBy: 'System',
        workflowId: 'workflow-001',
        resources: {
          cardModel: task.benchmarks.find(b => b.taskId === taskId)?.gpuType || 'NVIDIA H100',
          driverVersion: '535.104',
          cudaVersion: '12.2',
        },
        dataLineage: {
          datasetName: 'MMLU-v2.1',
          datasetVersionHash: 'd4e5f6',
          modelWeightHash: 'a1b2c3',
        },
      });
      setCurrentPage('task-detail');
    }
  };

  const renderModelList = () => (
    <div>
      <Row gutter={[16, 16]}>
        {mockModels.map((model) => (
          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={model.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button
                  key="detail"
                  type="text"
                  icon={<LineChartOutlined />}
                  onClick={() => handleViewDetail(model)}
                >
                  View Details
                </Button>,
                <Button
                  key="create"
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => handleCreateTask(model)}
                >
                  New Benchmark
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    <span>{model.name}</span>
                    <Tag color="blue">{model.params}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color="green">{model.organization}</Tag>
                      <Tag color="purple">{model.architecture}</Tag>
                      <Tag color="orange">{model.quantization}</Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <TrophyOutlined /> Used {model.usageCount} times
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderModelDetail = () => {
    if (!selectedModel) return null;

    const relatedTasks = getRelatedTasks(selectedModel.id);

    return (
      <div>
        <Button
          icon={<LineChartOutlined />}
          onClick={handleBackToList}
          style={{ marginBottom: '16px' }}
        >
          Back to Models
        </Button>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card title="Model Information">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Model Name:</strong> {selectedModel.name}
                </div>
                <div>
                  <strong>Parameters:</strong> {selectedModel.params}
                </div>
                <div>
                  <strong>Architecture:</strong> {selectedModel.architecture}
                </div>
                <div>
                  <strong>Organization:</strong> {selectedModel.organization}
                </div>
                <div>
                  <strong>Quantization:</strong> {selectedModel.quantization}
                </div>
                <div>
                  <strong>Usage Count:</strong> {selectedModel.usageCount}
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card
              title="Best Configuration"
              extra={<TrophyOutlined style={{ color: '#faad14' }} />}
            >
              <Statistic
                title="Recommended Hardware"
                value={getBestHardwareForModel(selectedModel)}
                styles={{ content: { fontSize: '16px', color: '#1890ff' } }}
              />
              {selectedModel.bestConfig && (
                <div style={{ marginTop: '16px' }}>
                  <div>
                    <strong>GPU Type:</strong> {selectedModel.bestConfig.gpuType}
                  </div>
                  <div>
                    <strong>GPU Count:</strong> {selectedModel.bestConfig.gpuCount}
                  </div>
                  <div>
                    <strong>Best Throughput:</strong> {selectedModel.bestConfig.throughput.toFixed(2)} tokens/s
                  </div>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card
              title="Actions"
              extra={<EditOutlined />}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => handleCreateTask(selectedModel)}
                  block
                >
                  Start New Benchmark
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => message.info('Edit metadata feature coming soon')}
                  block
                >
                  Edit Metadata
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title="Performance Trend">
              <div ref={performanceChartRef} style={{ width: '100%', height: '300px' }} />
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card title="Hardware Compatibility">
              <div ref={radarChartRef} style={{ width: '100%', height: '300px' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title="Related Tasks"
          style={{ marginTop: '24px' }}
          extra={
            <Tag color="blue">{relatedTasks.length} tasks</Tag>
          }
        >
          <Table
            dataSource={relatedTasks.map((taskId: string) => ({
              key: taskId,
              taskId,
              benchmark: selectedModel.benchmarks.find(b => b.taskId === taskId),
            }))}
            columns={[
              {
                title: 'Task ID',
                dataIndex: 'taskId',
                key: 'taskId',
                render: (text: string) => <code>{text}</code>,
              },
              {
                title: 'GPU Type',
                dataIndex: ['benchmark', 'gpuType'],
                key: 'gpuType',
              },
              {
                title: 'Throughput',
                dataIndex: ['benchmark', 'throughput'],
                key: 'throughput',
                render: (value: number) => value?.toFixed(2) || '-',
              },
              {
                title: 'Latency',
                dataIndex: ['benchmark', 'latency'],
                key: 'latency',
                render: (value: number) => value?.toFixed(2) || '-',
              },
              {
                title: 'Date',
                dataIndex: ['benchmark', 'date'],
                key: 'date',
                render: (value: string) => value ? new Date(value).toLocaleString() : '-',
              },
              {
                title: 'Status',
                dataIndex: ['benchmark', 'status'],
                key: 'status',
                render: (status: string) => (
                  <Tag color={status === 'success' ? 'green' : 'red'}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_: any, record: any) => (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => handleViewRelatedTask(record.taskId)}
                  >
                    View Details
                  </Button>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Model Assets Management</h2>
      {viewMode === 'list' ? renderModelList() : renderModelDetail()}
    </div>
  );
};

export default ModelsDashboard;