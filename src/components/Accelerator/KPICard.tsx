import React from 'react';
import { Card, Progress, Tag, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined, 
  QuestionCircleOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface KPICardData {
  key: string;
  title: string;
  value: number | string;
  unit: string;
  maxValue?: number;
  percent?: number;
  status: 'success' | 'warning' | 'error' | 'info' | 'unknown';
  icon: React.ReactNode;
}

interface KPICardProps {
  data: KPICardData;
}

const statusConfig = {
  success: {
    color: '#52c41a',
    icon: <CheckCircleOutlined />,
    label: '正常',
    progressColor: '#52c41a',
  },
  warning: {
    color: '#faad14',
    icon: <WarningOutlined />,
    label: '接近阈值',
    progressColor: '#faad14',
  },
  error: {
    color: '#ff4d4f',
    icon: <CloseCircleOutlined />,
    label: '超标警告',
    progressColor: '#ff4d4f',
  },
  info: {
    color: '#1890ff',
    icon: <InfoCircleOutlined />,
    label: '中性提示',
    progressColor: '#1890ff',
  },
  unknown: {
    color: '#722ed1',
    icon: <QuestionCircleOutlined />,
    label: '特殊模式',
    progressColor: '#722ed1',
  },
};

export const KPICard: React.FC<KPICardProps> = ({ data }) => {
  const config = statusConfig[data.status];
  const percent = data.percent ?? (data.maxValue && typeof data.value === 'number' 
    ? Math.min((data.value / data.maxValue) * 100, 100) 
    : 0);

  return (
    <Card 
      style={{ 
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
      }}
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 8, 
          background: '#f0f5ff',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#1890ff',
          fontSize: 20,
        }}>
          {data.icon}
        </div>
        <Tag 
          icon={config.icon} 
          color={config.color}
          style={{ borderRadius: 4 }}
        >
          {config.label}
        </Tag>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>{data.title}</Text>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Title level={2} style={{ margin: 0, color: '#1f1f1f' }}>
          {data.value}
          <Text type="secondary" style={{ fontSize: 14, marginLeft: 4 }}>{data.unit}</Text>
        </Title>
      </div>

      <Progress 
        percent={percent}
        showInfo={false}
        strokeColor={config.progressColor}
        trailColor="#f0f0f0"
        size="small"
      />
    </Card>
  );
};

export const defaultKPIData: KPICardData[] = [
  {
    key: 'throughput',
    title: '吞吐量',
    value: 1500,
    unit: 'MB/s',
    maxValue: 2000,
    status: 'success',
    icon: <span style={{ fontSize: 18 }}>⚡</span>,
  },
  {
    key: 'temperature',
    title: '温度',
    value: 54,
    unit: '°C',
    maxValue: 80,
    status: 'warning',
    icon: <span style={{ fontSize: 18 }}>🌡️</span>,
  },
  {
    key: 'power',
    title: '功耗',
    value: 0.4,
    unit: 'kW',
    maxValue: 0.7,
    status: 'success',
    icon: <span style={{ fontSize: 18 }}>🔌</span>,
  },
  {
    key: 'latency',
    title: '延迟',
    value: 155,
    unit: 'ms',
    maxValue: 100,
    status: 'error',
    icon: <span style={{ fontSize: 18 }}>⏱️</span>,
  },
  {
    key: 'fps',
    title: '帧率',
    value: 11,
    unit: 'fps',
    maxValue: 30,
    status: 'info',
    icon: <span style={{ fontSize: 18 }}>📊</span>,
  },
  {
    key: 'bandwidth',
    title: '带宽',
    value: 600,
    unit: 'GB/s',
    maxValue: 1000,
    status: 'unknown',
    icon: <span style={{ fontSize: 18 }}>📈</span>,
  },
];

export default KPICard;
