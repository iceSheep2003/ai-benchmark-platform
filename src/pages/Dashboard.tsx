import React from 'react';
import { Row, Col, Card, Statistic, Progress, Tag, Space } from 'antd';
import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { mockDashboardStats, mockClusterNodes } from '../mockData';

const Dashboard: React.FC = () => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: 'green',
      offline: 'default',
      warning: 'orange',
    };
    return colors[status] || 'default';
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="Total Tasks"
              value={mockDashboardStats.totalTasks}
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="Running Tasks"
              value={mockDashboardStats.runningTasks}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={
                ((mockDashboardStats.successTasks / mockDashboardStats.totalTasks) *
                  100).toFixed(1)
              }
              suffix="%"
              prefix={<ArrowUpOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="Failed Tasks"
              value={mockDashboardStats.failedTasks}
              prefix={<CloseCircleOutlined />}
              styles={{ content: { color: '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="Performance Metrics">
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span>Average Throughput</span>
                  <span style={{ float: 'right' }}>
                    {mockDashboardStats.avgThroughput.toFixed(2)} tokens/s
                  </span>
                </div>
                <Progress
                  percent={75}
                  strokeColor="#1890ff"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span>Average Latency</span>
                  <span style={{ float: 'right' }}>
                    {mockDashboardStats.avgLatency.toFixed(2)} ms
                  </span>
                </div>
                <Progress
                  percent={25}
                  strokeColor="#52c41a"
                  showInfo={false}
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card title="Cluster Status">
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              {mockClusterNodes.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#1f1f1f',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space wrap>
                      <strong>{node.name}</strong>
                      <Tag color={getStatusColor(node.status)}>{node.status}</Tag>
                    </Space>
                    <span>{node.gpuCount} GPUs</span>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ marginBottom: '4px', fontSize: '12px', color: '#999' }}>
                      GPU Utilization: {node.gpuUtil}%
                    </div>
                    <Progress
                      percent={node.gpuUtil}
                      strokeColor={node.gpuUtil > 90 ? '#ff4d4f' : '#1890ff'}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ marginBottom: '4px', fontSize: '12px', color: '#999' }}>
                      Temperature: {node.temperature}°C
                    </div>
                    <Progress
                      percent={(node.temperature / 100) * 100}
                      strokeColor={node.temperature > 70 ? '#ff4d4f' : '#52c41a'}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={24}>
          <Card title="Recent Activity">
            <div style={{ color: '#999' }}>
              No recent activity to display
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;