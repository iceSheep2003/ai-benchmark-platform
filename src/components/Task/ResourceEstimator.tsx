import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Space, Alert, Progress, Tag, Typography, Row, Col, Statistic, message } from 'antd';
import { ThunderboltOutlined, CheckCircleOutlined, WarningOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import { simulateResourceAvailability } from '../../mockData/schedulerSimulator';
import type { ResourceEstimation } from '../../types';

const { Title, Text } = Typography;

interface ResourceEstimatorProps {
  onEstimationComplete?: (estimation: ResourceEstimation) => void;
}

export const ResourceEstimator: React.FC<ResourceEstimatorProps> = ({ onEstimationComplete }) => {
  const { clusterStats, estimateResources } = useAppStore();
  
  const [modelSize, setModelSize] = useState<number>(7);
  const [precision, setPrecision] = useState<'FP16' | 'INT8'>('FP16');
  const [datasetSize, setDatasetSize] = useState<number>(1000);
  const [estimation, setEstimation] = useState<ResourceEstimation | null>(null);
  const [resourceCheck, setResourceCheck] = useState<{
    available: boolean;
    estimatedWaitTime?: number;
    suggestion?: string;
  } | null>(null);

  useEffect(() => {
    handleEstimate();
  }, [modelSize, precision, datasetSize]);

  const handleEstimate = () => {
    const estimationResult = estimateResources({ modelSize, precision, datasetSize });
    setEstimation(estimationResult);
    
    const availabilityCheck = simulateResourceAvailability(
      estimationResult.recommendedGpuCount,
      estimationResult.recommendedMemoryGB,
      clusterStats
    );
    setResourceCheck(availabilityCheck);
    
    if (onEstimationComplete) {
      onEstimationComplete(estimationResult);
    }
  };

  const handleJoinHighPriorityQueue = () => {
    message.success('Added to high priority queue. Estimated wait time reduced by 50%.');
  };

  const getPriorityColor = () => {
    if (!resourceCheck) return 'default';
    if (resourceCheck.available) return 'success';
    if (resourceCheck.estimatedWaitTime && resourceCheck.estimatedWaitTime < 10) return 'warning';
    return 'error';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div style={{ padding: '16px' }}>
      <Title level={4} style={{ marginBottom: '24px' }}>
        <ThunderboltOutlined style={{ marginRight: '8px' }} />
        Smart Resource Estimation
      </Title>

      <Card title="Task Parameters" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Model Size (B parameters)
            </Text>
            <Input
              type="number"
              value={modelSize}
              onChange={(e) => setModelSize(Number(e.target.value))}
              placeholder="Enter model size (e.g., 7, 72)"
              suffix="B"
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Precision
            </Text>
            <Select
              value={precision}
              onChange={setPrecision}
              style={{ width: '100%' }}
              options={[
                { label: 'FP16 (Half Precision)', value: 'FP16' },
                { label: 'INT8 (8-bit Integer)', value: 'INT8' },
              ]}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Dataset Size (samples)
            </Text>
            <Input
              type="number"
              value={datasetSize}
              onChange={(e) => setDatasetSize(Number(e.target.value))}
              placeholder="Enter dataset size"
              suffix="samples"
            />
          </div>
        </Space>
      </Card>

      {estimation && (
        <Card title="Resource Recommendations" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="Recommended GPUs"
                value={estimation.recommendedGpuCount}
                prefix={<ThunderboltOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Memory Required"
                value={estimation.recommendedMemoryGB}
                suffix="GB"
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Est. Duration"
                value={formatDuration(estimation.estimatedDuration)}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: '#722ed1' } }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Est. Cost"
                value={estimation.estimatedCost.toFixed(2)}
                prefix={<DollarOutlined />}
                suffix="$"
                styles={{ content: { color: '#faad14' } }}
              />
            </Col>
          </Row>

          {estimation.warnings.length > 0 && (
            <Alert
              message="Resource Warnings"
              description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {estimation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}

          {estimation.suggestions.length > 0 && (
            <Alert
              message="Optimization Suggestions"
              description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {estimation.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              }
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </Card>
      )}

      {resourceCheck && (
        <Card title="Resource Availability Check">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Cluster GPU Utilization
              </Text>
              <Progress
                percent={clusterStats.gpuUtilization}
                status={clusterStats.gpuUtilization > 80 ? 'exception' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {clusterStats.usedGPUs} / {clusterStats.totalGPUs} GPUs in use
              </Text>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Cluster Memory Utilization
              </Text>
              <Progress
                percent={clusterStats.memoryUtilization}
                status={clusterStats.memoryUtilization > 80 ? 'exception' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {clusterStats.usedMemoryGB} / {clusterStats.totalMemoryGB} GB in use
              </Text>
            </div>

            {resourceCheck.available ? (
              <Alert
                message="Resources Available"
                description="Your task can start immediately with the recommended configuration."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Alert
                message="Resources Insufficient"
                description={
                  <div>
                    <p>{resourceCheck.suggestion}</p>
                    <p>
                      <strong>Estimated queue wait time: {formatDuration(resourceCheck.estimatedWaitTime || 0)}</strong>
                    </p>
                  </div>
                }
                type="error"
                showIcon
                icon={<WarningOutlined />}
                action={
                  <Button type="primary" size="small" onClick={handleJoinHighPriorityQueue}>
                    Join High Priority Queue
                  </Button>
                }
              />
            )}

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Current Queue Status
              </Text>
              <Space>
                <Tag color="blue">{clusterStats.queuedTasks} tasks in queue</Tag>
                <Tag color="orange">Avg wait: {clusterStats.avgQueueWaitTime} min</Tag>
                <Tag color={getPriorityColor()}>
                  {resourceCheck?.available ? 'Ready to start' : 'Waiting for resources'}
                </Tag>
              </Space>
            </div>
          </Space>
        </Card>
      )}
    </div>
  );
};