import React from 'react';
import { Card, Progress, Typography, Space, List } from 'antd';
import { 
  FunctionOutlined, 
  ApiOutlined, 
  SafetyOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface GaugeCardData {
  key: string;
  title: string;
  score: number;
  color: string;
  icon: React.ReactNode;
  subItems: {
    name: string;
    score: number;
    status?: 'success' | 'warning' | 'error';
  }[];
}

interface GaugeCardProps {
  data: GaugeCardData;
}

export const GaugeCard: React.FC<GaugeCardProps> = ({ data }) => {
  return (
    <Card 
      style={{ 
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Progress 
          type="dashboard"
          percent={data.score}
          strokeColor={data.color}
          trailColor="#f0f0f0"
          strokeWidth={10}
          format={(percent) => (
            <div>
              <Title level={3} style={{ margin: 0, color: data.color }}>{percent}%</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>{data.title}</Text>
            </div>
          )}
          style={{ marginBottom: 8 }}
        />
      </div>

      <List
        size="small"
        dataSource={data.subItems}
        renderItem={(item) => (
          <List.Item style={{ padding: '8px 0', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Text style={{ fontSize: 13 }}>{item.name}</Text>
              <Space>
                <Progress 
                  percent={item.score} 
                  size="small" 
                  style={{ width: 60 }}
                  showInfo={false}
                  strokeColor={item.status === 'error' ? '#ff4d4f' : item.status === 'warning' ? '#faad14' : '#52c41a'}
                />
                <Text 
                  strong 
                  style={{ 
                    fontSize: 13,
                    color: item.status === 'error' ? '#ff4d4f' : item.status === 'warning' ? '#faad14' : '#52c41a',
                    minWidth: 40,
                    textAlign: 'right',
                  }}
                >
                  {item.score}分
                </Text>
              </Space>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export const defaultGaugeData: GaugeCardData[] = [
  {
    key: 'functionality',
    title: '功能性',
    score: 87,
    color: '#1890ff',
    icon: <FunctionOutlined />,
    subItems: [
      { name: '基础功能支持度', score: 90, status: 'success' },
      { name: '高级功能支持度', score: 85, status: 'success' },
      { name: 'API完整性', score: 88, status: 'success' },
      { name: '文档完善度', score: 82, status: 'success' },
    ],
  },
  {
    key: 'compatibility',
    title: '兼容性',
    score: 87,
    color: '#fa8c16',
    icon: <ApiOutlined />,
    subItems: [
      { name: '平台兼容性', score: 90, status: 'success' },
      { name: '驱动兼容性', score: 85, status: 'success' },
      { name: '软件兼容性', score: 88, status: 'success' },
      { name: '框架支持', score: 86, status: 'success' },
    ],
  },
  {
    key: 'reliability',
    title: '可靠性',
    score: 87,
    color: '#52c41a',
    icon: <SafetyOutlined />,
    subItems: [
      { name: '稳定性', score: 92, status: 'success' },
      { name: '故障率', score: 95, status: 'success' },
      { name: 'MTBF', score: 88, status: 'success' },
      { name: '错误恢复', score: 75, status: 'warning' },
    ],
  },
];

export default GaugeCard;
