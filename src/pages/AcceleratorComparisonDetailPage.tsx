import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, Card, Button, Space, Descriptions, Tag, Row, Col, Table, Empty, Spin, Statistic } from 'antd';
import { ArrowLeftOutlined, StarOutlined, StarFilled, DeleteOutlined, DownloadOutlined, ShareAltOutlined, TrophyOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorComparison, AcceleratorCard } from '../mockData/acceleratorMock';
import { acceleratorComparisons, acceleratorCards } from '../mockData/acceleratorMock';

const { Content } = Layout;

const dimensionLabels: Record<string, string> = {
  compute: '计算性能',
  memory: '内存性能',
  bandwidth: '带宽',
  power_efficiency: '功耗效率',
  stability: '稳定性',
  compatibility: '兼容性',
};

const chartColors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];

const AcceleratorComparisonDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const comparisonId = searchParams.get('id') || '';
  const [comparison, setComparison] = useState<AcceleratorComparison | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const radarChartRef = useRef<HTMLDivElement>(null);
  const radarChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);

  const detailedAccelerators = useMemo(() => {
    if (!comparison) return [];
    return comparison.accelerator_ids
      .map(id => acceleratorCards.find(c => c.id === id))
      .filter((c): c is AcceleratorCard => !!c);
  }, [comparison]);

  useEffect(() => {
    setTimeout(() => {
      const found = comparisonId
        ? acceleratorComparisons.find(c => c.id === comparisonId)
        : acceleratorComparisons[0];
      setComparison(found || null);
      setIsStarred(found?.is_starred || false);
      setLoading(false);
    }, 500);
  }, [comparisonId]);

  useEffect(() => {
    if (!radarChartRef.current || !comparison || detailedAccelerators.length === 0) return;

    if (radarChartInstance.current) {
      radarChartInstance.current.dispose();
    }

    const chart = echarts.init(radarChartRef.current);
    radarChartInstance.current = chart;

    const indicators = detailedAccelerators[0]
      ? [
          { name: '计算性能', max: 100 },
          { name: '内存性能', max: 100 },
          { name: '带宽', max: 100 },
          { name: '功耗效率', max: 100 },
        ]
      : [];

    const seriesData = detailedAccelerators.map((acc, index) => ({
      value: [
        acc.scores.compute,
        acc.scores.memory,
        acc.scores.bandwidth,
        acc.scores.power_efficiency,
      ],
      name: acc.name,
      areaStyle: {
        color: chartColors[index % chartColors.length] + '4D',
      },
      lineStyle: {
        color: chartColors[index % chartColors.length],
      },
      itemStyle: {
        color: chartColors[index % chartColors.length],
      },
    }));

    const option = {
      title: {
        text: '性能雷达对比',
        textStyle: { color: '#fff', fontSize: 14 },
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: detailedAccelerators.map(acc => acc.name),
        textStyle: { color: '#fff' },
        top: 30,
      },
      radar: {
        indicator: indicators,
        axisName: { color: '#fff' },
        splitLine: { lineStyle: { color: '#303030' } },
        splitArea: { areaStyle: { color: ['#1f1f1f', '#141414'] } },
        axisLine: { lineStyle: { color: '#303030' } },
      },
      series: [{ type: 'radar', data: seriesData }],
    };

    chart.setOption(option);

    const handleResize = () => radarChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      radarChartInstance.current?.dispose();
    };
  }, [comparison, detailedAccelerators]);

  useEffect(() => {
    if (!barChartRef.current || !comparison || detailedAccelerators.length === 0) return;

    if (barChartInstance.current) {
      barChartInstance.current.dispose();
    }

    const chart = echarts.init(barChartRef.current);
    barChartInstance.current = chart;

    const dimensions = Object.keys(comparison.dimensions || {});
    const dimensionNames = dimensions.map(d => dimensionLabels[d] || d);

    const option = {
      title: {
        text: '维度柱状对比',
        textStyle: { color: '#fff', fontSize: 14 },
        left: 'center',
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        data: detailedAccelerators.map(acc => acc.name),
        textStyle: { color: '#fff' },
        top: 30,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
      xAxis: {
        type: 'category',
        data: dimensionNames,
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
        splitLine: { lineStyle: { color: '#303030' } },
      },
      series: detailedAccelerators.map((acc, index) => ({
        name: acc.name,
        type: 'bar',
        data: dimensions.map(d => comparison.dimensions?.[d]?.[acc.id] || 0),
        itemStyle: { color: chartColors[index % chartColors.length] },
      })),
    };

    chart.setOption(option);

    const handleResize = () => barChartInstance.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      barChartInstance.current?.dispose();
    };
  }, [comparison, detailedAccelerators]);

  if (loading) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24, textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" tip="加载对比详情..." />
        </Content>
      </Layout>
    );
  }

  if (!comparison) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Empty description="对比不存在" />
        </Content>
      </Layout>
    );
  }

  const handleToggleStar = () => {
    setIsStarred(!isStarred);
  };

  const tableColumns = [
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 120,
      render: (text: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>,
    },
    ...detailedAccelerators.map((acc, index) => ({
      title: acc.name,
      dataIndex: `acc_${index}`,
      key: `acc_${index}`,
      width: 120,
      render: (value: number) => (
        <span style={{ color: chartColors[index % chartColors.length], fontWeight: 'bold' }}>
          {value?.toFixed(1) || '-'}
        </span>
      ),
    })),
    ...(detailedAccelerators.length >= 2
      ? [
          {
            title: '差异',
            key: 'difference',
            width: 150,
            render: (_: any, record: any) => {
              const v0 = record.acc_0 || 0;
              const v1 = record.acc_1 || 0;
              if (v1 === 0) return '-';
              const diff = v0 - v1;
              const pct = ((diff / v1) * 100).toFixed(1);
              const color = diff > 0 ? '#52c41a' : diff < 0 ? '#ff4d4f' : '#999';
              return (
                <span style={{ color }}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} ({pct}%)
                </span>
              );
            },
          },
        ]
      : []),
  ];

  const dimensions = comparison.dimensions || {};
  const tableData = Object.entries(dimensions).map(([key, values]) => {
    const row: any = {
      key,
      dimension: dimensionLabels[key] || key,
    };
    detailedAccelerators.forEach((acc, index) => {
      row[`acc_${index}`] = values[acc.id] || 0;
    });
    return row;
  });

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/accelerator/comparison')}
              >
                返回
              </Button>
              <span>{comparison.name}</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                onClick={handleToggleStar}
              >
                {isStarred ? '已收藏' : '收藏'}
              </Button>
              <Button icon={<ShareAltOutlined />}>分享</Button>
              <Button icon={<DownloadOutlined />}>导出报告</Button>
              <Button danger icon={<DeleteOutlined />}>删除</Button>
            </Space>
          }
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>创建时间</span>}
                value={new Date(comparison.created_at).toLocaleDateString('zh-CN')}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>参与加速卡</span>}
                value={detailedAccelerators.length}
                suffix="张"
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>对比维度</span>}
                value={Object.keys(dimensions).length}
                suffix="项"
                styles={{ content: { color: '#faad14' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>获胜者</span>}
                value={comparison.summary?.winner_name || '-'}
                prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
                styles={{ content: { color: '#ffd700' } }}
              />
            </Col>
          </Row>
        </Card>

        {comparison.description && (
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="描述">{comparison.description}</Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space size={[0, 4]} wrap>
                  {comparison.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              {comparison.created_by && (
                <Descriptions.Item label="创建者">{comparison.created_by.full_name || comparison.created_by.username}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        <Card
          title="参与对比的加速卡"
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            {detailedAccelerators.map((acc, index) => (
              <Col xs={24} md={12} key={acc.id}>
                <Card
                  size="small"
                  style={{
                    background: '#141414',
                    border: `1px solid ${chartColors[index % chartColors.length]}`,
                  }}
                >
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="名称">{acc.name}</Descriptions.Item>
                    <Descriptions.Item label="厂商">
                      <Tag color="blue">{acc.vendor}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="型号">{acc.model}</Descriptions.Item>
                    <Descriptions.Item label="显存">{acc.memory_gb} GB</Descriptions.Item>
                    <Descriptions.Item label="综合得分" span={2}>
                      <span style={{ color: chartColors[index % chartColors.length], fontWeight: 'bold', fontSize: 16 }}>
                        {acc.scores.overall}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title="性能雷达对比"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <div ref={radarChartRef} style={{ width: '100%', height: 400 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title="维度柱状对比"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <div ref={barChartRef} style={{ width: '100%', height: 400 }} />
            </Card>
          </Col>
        </Row>

        <Card
          title="详细对比数据"
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Table
            dataSource={tableData}
            columns={tableColumns}
            pagination={false}
            rowKey="key"
            scroll={{ x: 'max-content' }}
          />
        </Card>

        {comparison.summary && (
          <Card
            title="对比总结"
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <strong style={{ color: '#ffd700' }}>获胜者：</strong>
                <span style={{ color: '#fff' }}>{comparison.summary.winner_name}</span>
              </div>
              {comparison.summary.recommendation && (
                <div>
                  <strong style={{ color: '#1890ff' }}>推荐建议：</strong>
                  <span style={{ color: '#fff' }}>{comparison.summary.recommendation}</span>
                </div>
              )}
              {comparison.summary.improvement_percentage && (
                <div>
                  <strong style={{ color: '#52c41a' }}>提升百分比：</strong>
                  <Space size={[8, 4]} wrap>
                    {Object.entries(comparison.summary.improvement_percentage).map(([dim, pct]) => (
                      <Tag key={dim} color={(pct as number) > 0 ? 'green' : (pct as number) < 0 ? 'red' : 'default'}>
                        {dimensionLabels[dim] || dim}: {(pct as number) > 0 ? '+' : ''}{(pct as number).toFixed(1)}%
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        )}
      </Content>
    </Layout>
  );
};

export default AcceleratorComparisonDetailPage;
