import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd';
import { 
  TrophyOutlined, 
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { AcceleratorCard } from '../mockData/acceleratorMock';
import { acceleratorCards, acceleratorStatusMap } from '../mockData/acceleratorMock';
import type { ColumnsType } from 'antd/es/table';

const { Content } = Layout;

export const AcceleratorTestResultManagement: React.FC = () => {
  const navigate = useNavigate();

  const testedCount = acceleratorCards.filter(c => c.status === 'tested').length;
  const testingCount = acceleratorCards.filter(c => c.status === 'testing').length;
  const pendingCount = acceleratorCards.filter(c => c.status === 'pending').length;
  const avgScore = acceleratorCards
    .filter(c => c.status === 'tested')
    .reduce((sum, c) => sum + c.scores.overall, 0) / testedCount || 0;

  const columns: ColumnsType<AcceleratorCard> = [
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      render: (text: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '厂商',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '显存',
      dataIndex: 'memory_gb',
      key: 'memory_gb',
      render: (value: number) => `${value} GB`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AcceleratorCard['status']) => {
        const config = acceleratorStatusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '综合得分',
      dataIndex: ['scores', 'overall'],
      key: 'overall',
      sorter: (a, b) => a.scores.overall - b.scores.overall,
      render: (score: number) => (
        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 16 }}>
          {score.toFixed(1)}
        </span>
      ),
    },
    {
      title: '计算性能',
      dataIndex: ['scores', 'compute'],
      key: 'compute',
      render: (score: number) => <span style={{ color: '#1890ff' }}>{score.toFixed(1)}</span>,
    },
    {
      title: '内存性能',
      dataIndex: ['scores', 'memory'],
      key: 'memory',
      render: (score: number) => <span style={{ color: '#52c41a' }}>{score.toFixed(1)}</span>,
    },
    {
      title: '带宽',
      dataIndex: ['scores', 'bandwidth'],
      key: 'bandwidth',
      render: (score: number) => <span style={{ color: '#faad14' }}>{score.toFixed(1)}</span>,
    },
    {
      title: '功耗效率',
      dataIndex: ['scores', 'power_efficiency'],
      key: 'power_efficiency',
      render: (score: number) => <span style={{ color: '#722ed1' }}>{score.toFixed(1)}</span>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/accelerator/detail?id=${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              title="测试结果统计"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #303030' }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>已测加速卡</span>}
                    value={testedCount}
                    suffix="张"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>测试中</span>}
                    value={testingCount}
                    suffix="张"
                    prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>待测加速卡</span>}
                    value={pendingCount}
                    suffix="张"
                    prefix={<DatabaseOutlined style={{ color: '#faad14' }} />}
                    styles={{ content: { color: '#faad14' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>平均得分</span>}
                    value={avgScore.toFixed(1)}
                    prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
                    styles={{ content: { color: '#ffd700' } }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title="测试结果列表"
              extra={
                <Space>
                  <Button onClick={() => navigate('/accelerator/comparison')}>
                    创建对比分析
                  </Button>
                </Space>
              }
              style={{ background: '#1f1f1f', border: '1px solid #303030' }}
            >
              <Table
                dataSource={acceleratorCards.filter(c => c.status === 'tested')}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 'max-content' }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default AcceleratorTestResultManagement;
