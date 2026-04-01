import React from 'react';
import { Card, Row, Col, Statistic, Button, Space, Progress, Tag } from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';

interface LLMPlatformProps {
  onNavigate: (page: string) => void;
}

export const LLMPlatform: React.FC<LLMPlatformProps> = ({ onNavigate }) => {
  const { tasks, setSelectedTask } = useAppStore();

  const llmTasks = tasks.filter(task => 
    task.name.includes('Llama') || 
    task.name.includes('Mistral') || 
    task.name.includes('GPT') ||
    task.name.includes('Qwen')
  );

  const runningTasks = llmTasks.filter(t => t.status === 'RUNNING').length;
  const successTasks = llmTasks.filter(t => t.status === 'SUCCESS').length;
  const totalTasks = llmTasks.length;

  const avgThroughput = llmTasks
    .filter(t => t.status === 'SUCCESS' && t.metrics && t.metrics.length > 0)
    .reduce((sum, task) => {
      const avgTaskThroughput = task.metrics!.reduce((s, m) => s + m.throughput, 0) / task.metrics!.length;
      return sum + avgTaskThroughput;
    }, 0) / successTasks || 0;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          <RocketOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          大模型测评平台
        </h1>
        <p style={{ color: '#999', marginTop: '8px', marginBottom: 0 }}>
          Large Language Model Evaluation Platform
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="总测评任务"
              value={totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
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
              title="平均吞吐量"
              value={avgThroughput.toFixed(1)}
              suffix="tokens/s"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
            onClick={() => onNavigate('llm-create-task')}
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
              onClick={() => onNavigate('llm-tasks')}
              bodyStyle={{ padding: '24px' }}
            >
              <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>任务管理</h3>
              <p style={{ color: '#999', margin: 0 }}>查看和管理所有大模型测评任务</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('llm-models')}
              bodyStyle={{ padding: '24px' }}
            >
              <RocketOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>模型库</h3>
              <p style={{ color: '#999', margin: 0 }}>管理和查看大模型资产</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('llm-datasets')}
              bodyStyle={{ padding: '24px' }}
            >
              <ThunderboltOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>数据集</h3>
              <p style={{ color: '#999', margin: 0 }}>管理和查看测评数据集</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card 
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => onNavigate('llm-comparison')}
              bodyStyle={{ padding: '24px' }}
            >
              <BarChartOutlined style={{ fontSize: '32px', color: '#fa8c16', marginBottom: '16px' }} />
              <h3 style={{ margin: '12px 0 8px 0', color: '#fff' }}>性能对比</h3>
              <p style={{ color: '#999', margin: 0 }}>多模型性能对比分析</p>
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
        {llmTasks.slice(0, 5).map(task => (
          <Card 
            key={task.id}
            size="small" 
            style={{ marginBottom: '12px', cursor: 'pointer' }}
            onClick={() => {
              setSelectedTask(task);
              onNavigate('llm-task-detail');
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

export default LLMPlatform;