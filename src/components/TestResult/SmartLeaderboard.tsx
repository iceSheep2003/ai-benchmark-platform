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
import type { TestModel } from '../../mockData/testResultMock';
import { mockTestModels, domainOptions, sortByOptions, allCapabilities } from '../../mockData/testResultMock';
import ModelReportModal from './ModelReportModal';

interface SparklineChartProps {
  modelId: string;
  trend: number[];
}

const SparklineChart: React.FC<SparklineChartProps> = ({ modelId, trend }) => {
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
  }, [modelId, trend]);

  return <div ref={chartRef} style={{ width: 60, height: 24 }} />;
};

interface SmartLeaderboardProps {
  onModelSelect: (models: TestModel[]) => void;
}

export const SmartLeaderboard: React.FC<SmartLeaderboardProps> = ({ onModelSelect }) => {
  const [domainFilter, setDomainFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('overall');
  const [capabilityFilter, setCapabilityFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentModel, setCurrentModel] = useState<TestModel | null>(null);

  const filteredAndSortedModels = useMemo(() => {
    let models = [...mockTestModels];

    if (domainFilter.length > 0) {
      models = models.filter(m => m.domain.some(d => domainFilter.includes(d)));
    }

    if (capabilityFilter.length > 0) {
      models = models.filter(m => m.capabilities.some(c => capabilityFilter.includes(c)));
    }

    if (searchText) {
      models = models.filter(m => 
        m.name.toLowerCase().includes(searchText.toLowerCase()) ||
        m.organization.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    models.sort((a, b) => {
      const scoreKey = sortBy as keyof typeof a.scores;
      return (b.scores[scoreKey] || 0) - (a.scores[scoreKey] || 0);
    });

    return models;
  }, [domainFilter, sortBy, capabilityFilter, searchText]);

  const getStatusBadge = (status: TestModel['status']) => {
    switch (status) {
      case 'tested':
        return <Badge status="success" text="已测" />;
      case 'testing':
        return <Badge status="processing" text="测试中" />;
      case 'pending':
        return <Badge status="default" text="待测" />;
    }
  };

  const columns: ColumnsType<TestModel> = [
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
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <Tag color="blue">{record.version}</Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{record.organization}</span>
        </Space>
      ),
    },
    {
      title: '参数量',
      dataIndex: 'params',
      key: 'params',
      width: 80,
      render: (params) => <Tag>{params}</Tag>,
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
          {record.trend.length > 0 && <SparklineChart modelId={record.id} trend={record.trend} />}
          {record.trend.length >= 2 && record.trend[record.trend.length - 1] >= record.trend[0] ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
        </Space>
      ),
    },
    {
      title: '语言理解',
      key: 'languageUnderstanding',
      width: 100,
      sorter: (a, b) => a.scores.languageUnderstanding - b.scores.languageUnderstanding,
      render: (_, record) => (
        <span style={{ color: record.scores.languageUnderstanding >= 80 ? '#52c41a' : record.scores.languageUnderstanding >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.languageUnderstanding.toFixed(1)}
        </span>
      ),
    },
    {
      title: '逻辑推理',
      key: 'logicReasoning',
      width: 100,
      sorter: (a, b) => a.scores.logicReasoning - b.scores.logicReasoning,
      render: (_, record) => (
        <span style={{ color: record.scores.logicReasoning >= 80 ? '#52c41a' : record.scores.logicReasoning >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.logicReasoning.toFixed(1)}
        </span>
      ),
    },
    {
      title: '文本生成',
      key: 'textGeneration',
      width: 100,
      sorter: (a, b) => a.scores.textGeneration - b.scores.textGeneration,
      render: (_, record) => (
        <span style={{ color: record.scores.textGeneration >= 80 ? '#52c41a' : record.scores.textGeneration >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.textGeneration.toFixed(1)}
        </span>
      ),
    },
    {
      title: '知识问答',
      key: 'knowledgeQA',
      width: 100,
      sorter: (a, b) => a.scores.knowledgeQA - b.scores.knowledgeQA,
      render: (_, record) => (
        <span style={{ color: record.scores.knowledgeQA >= 80 ? '#52c41a' : record.scores.knowledgeQA >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.knowledgeQA.toFixed(1)}
        </span>
      ),
    },
    {
      title: '代码能力',
      key: 'codeAbility',
      width: 100,
      sorter: (a, b) => a.scores.codeAbility - b.scores.codeAbility,
      render: (_, record) => (
        <span style={{ color: record.scores.codeAbility >= 80 ? '#52c41a' : record.scores.codeAbility >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.codeAbility.toFixed(1)}
        </span>
      ),
    },
    {
      title: '多语言能力',
      key: 'multilingualAbility',
      width: 100,
      sorter: (a, b) => a.scores.multilingualAbility - b.scores.multilingualAbility,
      render: (_, record) => (
        <span style={{ color: record.scores.multilingualAbility >= 80 ? '#52c41a' : record.scores.multilingualAbility >= 60 ? '#faad14' : '#ff4d4f' }}>
          {record.scores.multilingualAbility.toFixed(1)}
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
            <Tag 
              key={cap} 
              color="cyan" 
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (!capabilityFilter.includes(cap)) {
                  setCapabilityFilter([...capabilityFilter, cap]);
                }
              }}
            >
              {cap}
            </Tag>
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
            setCurrentModel(record);
            setReportModalVisible(true);
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
      const selected = filteredAndSortedModels.filter(m => 
        newSelectedRowKeys.includes(m.id)
      );
      onModelSelect(selected);
    },
    getCheckboxProps: (record: TestModel) => ({
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
              placeholder="搜索模型名称或组织..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              mode="multiple"
              placeholder="选择领域"
              options={domainOptions}
              value={domainFilter}
              onChange={setDomainFilter}
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
          <Col xs={24} sm={24} md={6}>
            <Select
              mode="multiple"
              placeholder="能力标签筛选"
              options={allCapabilities.map(c => ({ label: c, value: c }))}
              value={capabilityFilter}
              onChange={setCapabilityFilter}
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
            <span>智能领域榜单</span>
            <Tag color="blue">{filteredAndSortedModels.length} 个模型</Tag>
          </Space>
        }
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Tag color="green">已选择 {selectedRowKeys.length} 个模型</Tag>
            )}
            {capabilityFilter.length > 0 && (
              <Button size="small" onClick={() => setCapabilityFilter([])}>
                清除标签筛选
              </Button>
            )}
          </Space>
        }
      >
        <Table
          dataSource={filteredAndSortedModels}
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
          style={{
            '--row-hover-bg': '#2a2a2a',
          } as React.CSSProperties}
        />
      </Card>

      <ModelReportModal
        visible={reportModalVisible}
        model={currentModel}
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
          transform: scale(1.01);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default SmartLeaderboard;
