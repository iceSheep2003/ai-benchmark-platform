import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, Card, Button, Space, Descriptions, Tag, Row, Col, Statistic, Table, Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorCard, AcceleratorTest } from '../mockData/acceleratorMock';
import { acceleratorCards, acceleratorTests, acceleratorStatusMap, testStatusMap, testTypeOptions } from '../mockData/acceleratorMock';

const { Content } = Layout;

const AcceleratorDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const acceleratorId = searchParams.get('id') || 'acc-001';
  const [accelerator, setAccelerator] = useState<AcceleratorCard | null>(null);
  const [tests, setTests] = useState<AcceleratorTest[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const found = acceleratorCards.find(a => a.id === acceleratorId) || acceleratorCards[0];
      setAccelerator(found);
      setTests(acceleratorTests.filter(t => t.accelerator_id === found.id));
      setLoading(false);
    }, 500);
  }, [acceleratorId]);

  useEffect(() => {
    if (!chartRef.current || !accelerator) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const option = {
      title: {
        text: '性能雷达图',
        textStyle: { color: '#fff', fontSize: 14 },
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      radar: {
        indicator: [
          { name: '计算性能', max: 100 },
          { name: '内存性能', max: 100 },
          { name: '带宽', max: 100 },
          { name: '功耗效率', max: 100 },
          ...(accelerator.scores.stability ? [{ name: '稳定性', max: 100 }] : []),
          ...(accelerator.scores.compatibility ? [{ name: '兼容性', max: 100 }] : []),
        ],
        axisName: {
          color: '#fff',
        },
        splitLine: {
          lineStyle: {
            color: '#303030',
          },
        },
        splitArea: {
          areaStyle: {
            color: ['#1f1f1f', '#141414'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#303030',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [
                accelerator.scores.compute,
                accelerator.scores.memory,
                accelerator.scores.bandwidth,
                accelerator.scores.power_efficiency,
                ...(accelerator.scores.stability ? [accelerator.scores.stability] : []),
                ...(accelerator.scores.compatibility ? [accelerator.scores.compatibility] : []),
              ],
              name: accelerator.name,
              areaStyle: {
                color: 'rgba(24, 144, 255, 0.3)',
              },
              lineStyle: {
                color: '#1890ff',
              },
              itemStyle: {
                color: '#1890ff',
              },
            },
          ],
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [accelerator]);

  const handleCreateTest = () => {
    navigate('/accelerator/tasks');
    message.info('请到任务中心创建测试任务');
  };

  if (loading) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24, textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" tip="加载加速卡详情..." />
        </Content>
      </Layout>
    );
  }

  if (!accelerator) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Empty description="加速卡不存在" />
        </Content>
      </Layout>
    );
  }

  const testColumns = [
    {
      title: '测试任务',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const found = testTypeOptions.find(t => t.value === type);
        return <Tag>{found?.label || type}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = testStatusMap[status];
        return <Tag color={config?.color || 'default'}>{config?.text || status}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <Tag color={priority === 'P0' ? 'red' : priority === 'P1' ? 'orange' : 'blue'}>{priority}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '持续时间',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      render: (seconds: number) => seconds ? `${Math.floor(seconds / 60)} 分钟` : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AcceleratorTest) => (
        <Button type="link" onClick={() => navigate(`/accelerator/test-detail?id=${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Card
          title={
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/accelerator/management')}
              >
                返回
              </Button>
              <span>{accelerator.name}</span>
            </Space>
          }
          extra={
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={handleCreateTest}
              >
                开始测试
              </Button>
              <Button icon={<EditOutlined />}>编辑</Button>
              <Button danger icon={<DeleteOutlined />}>删除</Button>
            </Space>
          }
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>综合得分</span>}
                value={accelerator.scores.overall}
                prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
                styles={{ content: { color: '#ffd700' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>厂商</span>}
                value={accelerator.vendor}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>显存</span>}
                value={accelerator.memory_gb}
                suffix="GB"
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>状态</span>}
                value={acceleratorStatusMap[accelerator.status]?.text || accelerator.status}
                styles={{ content: { color: accelerator.status === 'tested' ? '#52c41a' : accelerator.status === 'testing' ? '#1890ff' : '#faad14' } }}
              />
            </Col>
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title="基本信息"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="加速卡名称">{accelerator.name}</Descriptions.Item>
                <Descriptions.Item label="厂商">{accelerator.vendor}</Descriptions.Item>
                <Descriptions.Item label="型号">{accelerator.model}</Descriptions.Item>
                <Descriptions.Item label="显存">{accelerator.memory_gb} GB</Descriptions.Item>
                <Descriptions.Item label="架构">{accelerator.architecture || '-'}</Descriptions.Item>
                <Descriptions.Item label="计算能力">{accelerator.compute_capability || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={acceleratorStatusMap[accelerator.status]?.color}>
                    {acceleratorStatusMap[accelerator.status]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{new Date(accelerator.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="性能指标"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <div ref={chartRef} style={{ width: '100%', height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Card
          title="详细性能得分"
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="计算性能"
                value={accelerator.scores.compute}
                suffix="分"
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="内存性能"
                value={accelerator.scores.memory}
                suffix="分"
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="带宽"
                value={accelerator.scores.bandwidth}
                suffix="分"
                styles={{ content: { color: '#faad14' } }}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="功耗效率"
                value={accelerator.scores.power_efficiency}
                suffix="分"
                styles={{ content: { color: '#722ed1' } }}
              />
            </Col>
            {accelerator.scores.stability && (
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="稳定性"
                  value={accelerator.scores.stability}
                  suffix="分"
                  styles={{ content: { color: '#13c2c2' } }}
                />
              </Col>
            )}
            {accelerator.scores.compatibility && (
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title="兼容性"
                  value={accelerator.scores.compatibility}
                  suffix="分"
                  styles={{ content: { color: '#eb2f96' } }}
                />
              </Col>
            )}
          </Row>
        </Card>

        <Card
          title="关键指标"
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="FP32" value={accelerator.metrics.fp32_tflops} suffix="TFLOPS" styles={{ content: { color: '#1890ff' } }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="FP16" value={accelerator.metrics.fp16_tflops} suffix="TFLOPS" styles={{ content: { color: '#52c41a' } }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="INT8" value={accelerator.metrics.int8_tops} suffix="TOPS" styles={{ content: { color: '#faad14' } }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="内存带宽" value={accelerator.metrics.memory_bandwidth_gbps} suffix="GB/s" styles={{ content: { color: '#722ed1' } }} />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic title="功耗" value={accelerator.metrics.power_consumption_w} suffix="W" styles={{ content: { color: '#ff4d4f' } }} />
            </Col>
          </Row>
        </Card>

        {accelerator.test_summary && (
          <Card
            title="测试概要"
            style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Statistic title="总测试数" value={accelerator.test_summary.total_tests} styles={{ content: { color: '#1890ff' } }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="成功" value={accelerator.test_summary.successful_tests} styles={{ content: { color: '#52c41a' } }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="失败" value={accelerator.test_summary.failed_tests} styles={{ content: { color: '#ff4d4f' } }} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title="最近测试" value={new Date(accelerator.test_summary.last_test_at).toLocaleDateString('zh-CN')} styles={{ content: { color: '#faad14' } }} />
              </Col>
            </Row>
          </Card>
        )}

        <Card
          title="测试历史"
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Table
            dataSource={tests}
            columns={testColumns}
            rowKey="id"
            locale={{ emptyText: '暂无测试记录' }}
            pagination={false}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default AcceleratorDetailPage;
