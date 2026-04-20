import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Table, Tag, Select, Space, Row, Col, Progress, Badge, Input, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  TrophyOutlined, 
  RiseOutlined,
  FallOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorCard } from '../../mockData/acceleratorMock';
import { acceleratorCards, vendorOptions, memoryTypeOptions } from '../../mockData/acceleratorMock';
import AcceleratorReportModal from './AcceleratorReportModal';

interface AcceleratorLeaderboardProps {
  onCardSelect?: (cards: AcceleratorCard[]) => void;
  onViewDetail?: (card: AcceleratorCard) => void;
}

interface AcceleratorSparklineChartProps {
  cardId: string;
  trend: number[];
}

const AcceleratorSparklineChart: React.FC<AcceleratorSparklineChartProps> = ({ cardId, trend }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || trend.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const isUp = trend.length >= 2 && trend[trend.length - 1] >= trend[0];
    const color = isUp ? '#52c41a' : '#ff4d4f';

    chart.setOption({
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: trend.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        show: false,
        min: Math.min(...trend) - 2,
        max: Math.max(...trend) + 2,
      },
      series: [
        {
          type: 'line',
          data: trend,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2,
            color: color,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '00' },
            ]),
          },
        },
      ],
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [cardId, trend]);

  return <div ref={chartRef} style={{ width: 60, height: 24 }} />;
};

const vendorColors: Record<string, string> = {
  'NVIDIA': '#76b900',
  'AMD': '#ed1c24',
  '华为': '#cf0a2c',
  '寒武纪': '#1890ff',
  '英特尔': '#0071c5',
  '壁仞': '#722ed1',
  '燧原': '#faad14',
};

const sortByOptions = [
  { label: '综合得分', value: 'overall' },
  { label: '计算性能', value: 'computePerformance' },
  { label: '内存性能', value: 'memoryPerformance' },
  { label: '推理速度', value: 'inferenceSpeed' },
  { label: '训练速度', value: 'trainingSpeed' },
  { label: '能效', value: 'energyEfficiency' },
  { label: '性价比', value: 'costEfficiency' },
];

export const AcceleratorLeaderboard: React.FC<AcceleratorLeaderboardProps> = ({ onCardSelect, onViewDetail }) => {
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('overall');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<AcceleratorCard | null>(null);

  const filteredAndSortedCards = useMemo(() => {
    let cards = [...acceleratorCards];

    if (vendorFilter.length > 0) {
      cards = cards.filter(c => vendorFilter.includes(c.vendor));
    }

    if (memoryTypeFilter.length > 0) {
      cards = cards.filter(c => memoryTypeFilter.includes(c.specs.memoryType));
    }

    if (searchText) {
      cards = cards.filter(c => 
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.vendor.toLowerCase().includes(searchText.toLowerCase()) ||
        c.model.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    cards.sort((a, b) => {
      const scoreKey = sortBy as keyof typeof a.scores;
      return (b.scores[scoreKey] || 0) - (a.scores[scoreKey] || 0);
    });

    return cards;
  }, [vendorFilter, sortBy, memoryTypeFilter, searchText]);

  const getStatusBadge = (status: AcceleratorCard['status']) => {
    switch (status) {
      case 'tested':
        return <Badge status="success" text="已测" />;
      case 'testing':
        return <Badge status="processing" text="测试中" />;
      case 'pending':
        return <Badge status="default" text="待测" />;
    }
  };

  const columns: ColumnsType<AcceleratorCard> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => {
        const rank = index + 1;
        if (rank <= 3) {
          const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
          return (
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: '50%', 
              background: colors[rank - 1],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: rank === 1 ? '#000' : '#fff',
            }}>
              {rank}
            </div>
          );
        }
        return <span style={{ color: '#999' }}>{rank}</span>;
      },
    },
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <Tag color={vendorColors[record.vendor]}>{record.vendor}</Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{record.model}</span>
        </Space>
      ),
    },
    {
      title: '显存',
      key: 'memory',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.specs.memory} GB</span>
          <Tag style={{ fontSize: 10 }}>{record.specs.memoryType}</Tag>
        </Space>
      ),
    },
    {
      title: '综合得分',
      dataIndex: 'scores',
      key: 'overall',
      width: 140,
      sorter: (a, b) => a.scores.overall - b.scores.overall,
      render: (scores, record) => (
        <Space>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
            {scores.overall.toFixed(1)}
          </span>
          {record.trend.length > 0 && <AcceleratorSparklineChart cardId={record.id} trend={record.trend} />}
          {record.trend.length >= 2 && record.trend[record.trend.length - 1] >= record.trend[0] ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
        </Space>
      ),
    },
    {
      title: '计算性能',
      key: 'computePerformance',
      width: 100,
      sorter: (a, b) => a.scores.computePerformance - b.scores.computePerformance,
      render: (_, record) => (
        <span style={{ color: record.scores.computePerformance >= 90 ? '#52c41a' : record.scores.computePerformance >= 80 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.computePerformance.toFixed(1)}
        </span>
      ),
    },
    {
      title: '内存性能',
      key: 'memoryPerformance',
      width: 100,
      sorter: (a, b) => a.scores.memoryPerformance - b.scores.memoryPerformance,
      render: (_, record) => (
        <span style={{ color: record.scores.memoryPerformance >= 90 ? '#52c41a' : record.scores.memoryPerformance >= 80 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.memoryPerformance.toFixed(1)}
        </span>
      ),
    },
    {
      title: '推理速度',
      key: 'inferenceSpeed',
      width: 100,
      sorter: (a, b) => a.scores.inferenceSpeed - b.scores.inferenceSpeed,
      render: (_, record) => (
        <span style={{ color: record.scores.inferenceSpeed >= 90 ? '#52c41a' : record.scores.inferenceSpeed >= 80 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.inferenceSpeed.toFixed(1)}
        </span>
      ),
    },
    {
      title: '训练速度',
      key: 'trainingSpeed',
      width: 100,
      sorter: (a, b) => a.scores.trainingSpeed - b.scores.trainingSpeed,
      render: (_, record) => (
        <span style={{ color: record.scores.trainingSpeed >= 90 ? '#52c41a' : record.scores.trainingSpeed >= 80 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.trainingSpeed.toFixed(1)}
        </span>
      ),
    },
    {
      title: '能效',
      key: 'energyEfficiency',
      width: 80,
      sorter: (a, b) => a.scores.energyEfficiency - b.scores.energyEfficiency,
      render: (_, record) => (
        <span style={{ color: record.scores.energyEfficiency >= 90 ? '#52c41a' : '#fff' }}>
          {record.scores.energyEfficiency.toFixed(1)}
        </span>
      ),
    },
    {
      title: '性价比',
      key: 'costEfficiency',
      width: 80,
      sorter: (a, b) => a.scores.costEfficiency - b.scores.costEfficiency,
      render: (_, record) => (
        <span style={{ color: record.scores.costEfficiency >= 90 ? '#52c41a' : '#fff' }}>
          {record.scores.costEfficiency.toFixed(1)}
        </span>
      ),
    },
    {
      title: '能力标签',
      dataIndex: 'capabilities',
      key: 'capabilities',
      width: 180,
      render: (capabilities: string[]) => (
        <Space size={[2, 4]} wrap>
          {capabilities.slice(0, 3).map(cap => (
            <Tag key={cap} color="cyan">{cap}</Tag>
          ))}
          {capabilities.length > 3 && <Tag>+{capabilities.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        if (status === 'testing') {
          return (
            <Space direction="vertical" size={0}>
              <Badge status="processing" text="测试中" />
              <Progress 
                percent={Math.round((record.testProgress?.current || 0) / (record.testProgress?.total || 1) * 100)} 
                size="small"
                status="active"
              />
              <span style={{ fontSize: 11, color: '#999' }}>
                {record.testProgress?.currentTask}
              </span>
            </Space>
          );
        }
        return getStatusBadge(status);
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            if (onViewDetail) {
              onViewDetail(record);
            } else {
              setCurrentCard(record);
              setReportModalVisible(true);
            }
          }}
          disabled={record.status !== 'tested'}
        >
          查看报告
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      const selected = filteredAndSortedCards.filter(c => 
        newSelectedRowKeys.includes(c.id)
      );
      onCardSelect?.(selected);
    },
    getCheckboxProps: (record: AcceleratorCard) => ({
      disabled: record.status === 'testing',
    }),
  };

  return (
    <div>
      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #303030',
          marginBottom: 16,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索加速卡名称或厂商..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              mode="multiple"
              placeholder="选择厂商"
              options={vendorOptions.map(v => ({ label: v, value: v }))}
              value={vendorFilter}
              onChange={setVendorFilter}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="排序方式"
              options={sortByOptions}
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              mode="multiple"
              placeholder="显存类型"
              options={memoryTypeOptions.map(m => ({ label: m, value: m }))}
              value={memoryTypeFilter}
              onChange={setMemoryTypeFilter}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Card 
        style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#ffd700' }} />
            <span>加速卡排行榜</span>
            <Tag color="blue">{filteredAndSortedCards.length} 张加速卡</Tag>
          </Space>
        }
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Tag color="green">已选择 {selectedRowKeys.length} 张加速卡</Tag>
            )}
          </Space>
        }
      >
        <Table
          dataSource={filteredAndSortedCards}
          columns={columns}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1500 }}
          rowClassName={(record) => record.status === 'testing' ? 'testing-row' : ''}
        />
      </Card>

      <AcceleratorReportModal
        visible={reportModalVisible}
        card={currentCard}
        onClose={() => setReportModalVisible(false)}
      />

      <style>{`
        .testing-row {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { background-color: #1f1f1f; }
          50% { background-color: #2a3f2a; }
          100% { background-color: #1f1f1f; }
        }
        .ant-table-tbody > tr:hover > td {
          background: #2a2a2a !important;
        }
      `}</style>
    </div>
  );
};

export default AcceleratorLeaderboard;
