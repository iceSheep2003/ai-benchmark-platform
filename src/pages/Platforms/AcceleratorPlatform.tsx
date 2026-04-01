import React from 'react';
import { Card, Row, Col, Statistic, Button, Space, Progress, Tag } from 'antd';
import {
  ThunderboltOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  HddOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';

interface AcceleratorPlatformProps {
  onNavigate: (page: string) => void;
}

export const AcceleratorPlatform: React.FC<AcceleratorPlatformProps> = ({ onNavigate }) => {
  const { tasks, clusterStats, setSelectedTask } = useAppStore();

  const acceleratorTasks = tasks.filter(task => 
    (task.resources?.cardModel?.includes('NVIDIA') || false) ||
    (task.resources?.cardModel?.includes('AMD') || false) ||
    (task.resources?.cardModel?.includes('Huawei') || false)
  );

  const runningTasks = acceleratorTasks.filter(t => t.status === 'RUNNING').length;
  const successTasks = acceleratorTasks.filter(t => t.status === 'SUCCESS').length;
  const totalTasks = acceleratorTasks.length;

  const avgUtilization = clusterStats ? (clusterStats.usedGPUs / clusterStats.totalGPUs * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          加速卡测评平台
        </h1>
        <p style={{ color: '#999', marginTop: '8px', marginBottom: 0 }}>
          Accelerator Evaluation Platform
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="总测评任务"
              value={totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="运行中"
              value={runningTasks}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="已完成"
              value={successTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="GPU利用率"
              value={avgUtilization.toFixed(1)}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="快速操作"
        extra={
          <Button 
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onNavigate('accelerator-create-task')}
          >
            创建测评任务
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('accelerator-tasks')}
              bodyStyle={{ padding: '24px' }}
            >
              <FileTextOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>任务管理</h3>
              <p style={{ color: '#999', margin: 0 }}>查看和管理加速卡测评任务</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('accelerator-hardware')}
              bodyStyle={{ padding: '24px' }}
            >
              <HddOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>硬件库</h3>
              <p style={{ color: '#999', margin: 0 }}>管理和查看加速卡资产</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('accelerator-performance')}
              bodyStyle={{ padding: '24px' }}
            >
              <BarChartOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>性能分析</h3>
              <p style={{ color: '#999', margin: 0 }}>加速卡性能深度分析</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('accelerator-comparison')}
              bodyStyle={{ padding: '24px' }}
            >
              <DatabaseOutlined style={{ fontSize: '32px', color: '#3f8600', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>性能对比</h3>
              <p style={{ color: '#999', margin: 0 }}>多加速卡性能对比</p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="最近测评任务">
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <span>状态筛选：</span>
            <Tag color="blue" onClick={() => {}}>全部</Tag>
            <Tag color="green" onClick={() => {}}>成功</Tag>
            <Tag color="processing" onClick={() => {}}>运行中</Tag>
            <Tag color="error" onClick={() => {}}>失败</Tag>
          </Space>
        </div>
        {acceleratorTasks.slice(0, 5).map(task => (
          <Card 
            key={task.id}
            size="small"
            style={{ marginBottom: '12px', cursor: 'pointer' }}
            onClick={() => {
              setSelectedTask(task);
              onNavigate('accelerator-task-detail');
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff' }}>{task.name}</h4>
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>
                  {task.resources?.cardModel || '-'} | {task.dataLineage?.datasetName || '-'}
                </p>
              </div>
              <div>
                <Tag color={
                  task.status === 'SUCCESS' ? 'success' : 
                  task.status === 'RUNNING' ? 'processing' : 
                  task.status === 'FAILED' ? 'error' : 'default'
                }>
                  {task.status}
                </Tag>
              </div>
            </div>
            {task.status === 'RUNNING' && (
              <Progress 
                percent={Math.random() * 100} 
                status="active"
                style={{ marginTop: '12px' }}
              />
            )}
          </Card>
        ))}
      </Card>
    </div>
  );
};

export default AcceleratorPlatform;