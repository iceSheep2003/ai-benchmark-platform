import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Button, Tag, Statistic, Space, Table, Modal, message, Badge } from 'antd';
import {
  ThunderboltOutlined,
  RocketOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorAsset } from '../../../types';
import { mockAccelerators } from '../../../mockData/assetsMock';
import {
  createTaskFromAccelerator,
  getRelatedTasks,
} from '../../../services/assetTaskLinker';
import { useAppStore } from '../../../store/appStore';

const HardwareProfile: React.FC = () => {
  const { setCurrentPage, setSelectedTask } = useAppStore();
  const [selectedAccelerator, setSelectedAccelerator] = useState<AcceleratorAsset | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const heatmapChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAccelerator && heatmapChartRef.current) {
      const heatmapChart = echarts.init(heatmapChartRef.current);
      const failureHeatmap = selectedAccelerator.failureHeatmap || [];

      const option = {
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            return `${new Date(params.name).toLocaleTimeString()}<br/>Failures: ${params.value[2]}`;
          },
        },
        grid: {
          height: '70%',
          top: '10%',
        },
        xAxis: {
          type: 'category',
          data: failureHeatmap.map(item => new Date(item.timestamp).toLocaleTimeString()),
          splitArea: {
            show: true,
          },
        },
        yAxis: {
          type: 'category',
          data: ['Failure Count'],
          splitArea: {
            show: true,
          },
        },
        visualMap: {
          min: 0,
          max: Math.max(...failureHeatmap.map(h => h.failureCount), 1),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          inRange: {
            color: ['#50a3ba', '#eac736', '#d94e5d'],
          },
        },
        series: [
          {
            name: 'Failure Count',
            type: 'heatmap',
            data: failureHeatmap.map((item, index) => [
              index,
              0,
              item.failureCount,
            ]),
            label: {
              show: false,
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      };

      heatmapChart.setOption(option);

      return () => {
        heatmapChart.dispose();
      };
    }
  }, [selectedAccelerator]);

  const handleCreateTask = (accelerator: AcceleratorAsset) => {
    createTaskFromAccelerator(accelerator);
    setCurrentPage('tasks');
    message.success(`Creating new task for accelerator: ${accelerator.gpuModel}`);
  };

  const handleViewDetail = (accelerator: AcceleratorAsset) => {
    setSelectedAccelerator(accelerator);
    setDetailModalVisible(true);
  };

  const handleViewClusterMonitoring = () => {
    setCurrentPage('tasks');
    message.info('Navigating to Task Center cluster view');
  };

  const handleViewRelatedTask = (taskId: string) => {
    const accelerator = mockAccelerators.find(a => {
      const relatedTasks = getRelatedTasks(a.id);
      return relatedTasks.includes(taskId);
    });
    
    if (accelerator) {
      setSelectedTask({
        id: taskId,
        name: `${accelerator.gpuModel} Benchmark`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        createdBy: 'System',
        workflowId: 'workflow-001',
        resources: {
          cardModel: accelerator.gpuModel,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'success';
      case 'busy':
        return 'processing';
      case 'error':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'busy':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'maintenance':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const renderClusterTopology = () => (
    <div>
      <Row gutter={[16, 16]}>
        {mockAccelerators.map((accelerator) => (
          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={accelerator.id}>
            <Badge.Ribbon
              text={accelerator.status.toUpperCase()}
              color={getStatusColor(accelerator.status)}
            >
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button
                    key="detail"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(accelerator)}
                  >
                    View Details
                  </Button>,
                  <Button
                    key="create"
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={() => handleCreateTask(accelerator)}
                  >
                    Run Task
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      {getStatusIcon(accelerator.status)}
                      <span>{accelerator.gpuModel}</span>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <Tag color="blue">{accelerator.nodeIp}</Tag>
                        <Tag color="purple">{accelerator.gpuCount} GPUs</Tag>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <ThunderboltOutlined /> Avg Utilization: {accelerator.performanceStats.avgUtilization.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <RocketOutlined /> Avg Throughput: {accelerator.performanceStats.avgThroughput.toFixed(2)} tokens/s
                      </div>
                    </div>
                  }
                />
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedAccelerator) return null;

    const relatedTasks = getRelatedTasks(selectedAccelerator.id);

    return (
      <Modal
        title={`Accelerator Details: ${selectedAccelerator.gpuModel}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="monitoring"
            icon={<EyeOutlined />}
            onClick={() => {
              handleViewClusterMonitoring();
              setDetailModalVisible(false);
            }}
          >
            View Real-time Monitoring
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              handleCreateTask(selectedAccelerator);
              setDetailModalVisible(false);
            }}
          >
            Run Task
          </Button>,
        ]}
        width={1200}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card title="Basic Information">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>Node IP:</strong> {selectedAccelerator.nodeIp}
                </div>
                <div>
                  <strong>GPU Model:</strong> {selectedAccelerator.gpuModel}
                </div>
                <div>
                  <strong>GPU Count:</strong> {selectedAccelerator.gpuCount}
                </div>
                <div>
                  <strong>Status:</strong> {getStatusIcon(selectedAccelerator.status)} {selectedAccelerator.status.toUpperCase()}
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card title="Performance Statistics">
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Statistic
                  title="Avg Utilization"
                  value={selectedAccelerator.performanceStats.avgUtilization}
                  suffix="%"
                  precision={1}
                  styles={{ content: { fontSize: '20px', color: '#1890ff' } }}
                />
                <Statistic
                  title="Avg Throughput"
                  value={selectedAccelerator.performanceStats.avgThroughput}
                  suffix="tokens/s"
                  precision={2}
                  styles={{ content: { fontSize: '20px', color: '#52c41a' } }}
                />
                <Statistic
                  title="Failure Rate"
                  value={selectedAccelerator.performanceStats.failureRate}
                  suffix="%"
                  precision={1}
                  styles={{ content: { fontSize: '20px', color: '#ff4d4f' } }}
                />
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card title="Top Performing Models">
              <Space orientation="vertical" style={{ width: '100%' }}>
                {selectedAccelerator.performanceStats.topModels.map((model, index) => (
                  <div key={index}>
                    <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'default'}>
                      {index + 1}. {model}
                    </Tag>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="Failure Heatmap (Last 24 Hours)" style={{ marginTop: '16px' }}>
          <div ref={heatmapChartRef} style={{ width: '100%', height: '300px' }} />
        </Card>

        {relatedTasks.length > 0 && (
          <Card
            title="Related Tasks"
            style={{ marginTop: '16px' }}
            extra={
              <Tag color="blue">{relatedTasks.length} tasks</Tag>
            }
          >
            <Table
              dataSource={relatedTasks.map((taskId: string) => ({
                key: taskId,
                taskId,
              }))}
              columns={[
                {
                  title: 'Task ID',
                  dataIndex: 'taskId',
                  key: 'taskId',
                  render: (text: string) => <code>{text}</code>,
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
              size="small"
            />
          </Card>
        )}
      </Modal>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Accelerator Assets Management</h2>

      <Card
        title="Cluster Topology"
        extra={
          <Button
            icon={<EyeOutlined />}
            onClick={handleViewClusterMonitoring}
          >
            View Real-time Monitoring
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Total Nodes"
                value={mockAccelerators.length}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Idle"
                value={mockAccelerators.filter(a => a.status === 'idle').length}
                styles={{ content: { color: '#52c41a' } }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Busy"
                value={mockAccelerators.filter(a => a.status === 'busy').length}
                styles={{ content: { color: '#1890ff' } }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Error"
                value={mockAccelerators.filter(a => a.status === 'error').length}
                styles={{ content: { color: '#ff4d4f' } }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Maintenance"
                value={mockAccelerators.filter(a => a.status === 'maintenance').length}
                styles={{ content: { color: '#faad14' } }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card size="small">
              <Statistic
                title="Total GPUs"
                value={mockAccelerators.reduce((sum, a) => sum + a.gpuCount, 0)}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {renderClusterTopology()}
      </Card>

      {renderDetailModal()}
    </div>
  );
};

export default HardwareProfile;