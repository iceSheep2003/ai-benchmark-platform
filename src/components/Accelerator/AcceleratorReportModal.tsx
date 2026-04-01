import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tabs, Card, Row, Col, Tag, Table, Progress, Typography, Space, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  FileTextOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WarningOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorCard } from '../../mockData/acceleratorMock';

const { Text, Paragraph } = Typography;

interface AcceleratorReportModalProps {
  visible: boolean;
  card: AcceleratorCard | null;
  onClose: () => void;
}

const getAcceleratorResultDetails = (card: AcceleratorCard) => {
  const capabilities = [
    { key: 'computePerformance', name: '计算性能', icon: '⚡' },
    { key: 'memoryPerformance', name: '内存性能', icon: '💾' },
    { key: 'inferenceSpeed', name: '推理速度', icon: '🚀' },
    { key: 'trainingSpeed', name: '训练速度', icon: '🏋️' },
    { key: 'energyEfficiency', name: '能效', icon: '🔋' },
    { key: 'costEfficiency', name: '性价比', icon: '💰' },
  ];

  const metrics = capabilities.map(cap => ({
    ...cap,
    score: card.scores[cap.key as keyof typeof card.scores] || 0,
    maxScore: 100,
    rank: card.scores[cap.key as keyof typeof card.scores] >= 90 ? '优秀' : 
          card.scores[cap.key as keyof typeof card.scores] >= 80 ? '良好' : '一般',
    details: `在${cap.name}维度上表现${card.scores[cap.key as keyof typeof card.scores] >= 85 ? '优异' : '稳定'}`,
  }));

  const totalScore = card.scores.overall;

  const detailedMetrics = [
    { category: '计算性能', task: 'FP32性能', metric: 'TFLOPS', score: 19.5, unit: 'TFLOPS', description: '单精度浮点运算' },
    { category: '计算性能', task: 'FP16性能', metric: 'TFLOPS', score: 312, unit: 'TFLOPS', description: '半精度浮点运算' },
    { category: '计算性能', task: 'INT8性能', metric: 'TOPS', score: 624, unit: 'TOPS', description: 'INT8整数运算' },
    { category: '计算性能', task: '矩阵乘法', metric: 'TFLOPS', score: 312, unit: 'TFLOPS', description: 'Tensor Core性能' },
    { category: '内存性能', task: '内存带宽', metric: 'GB/s', score: 2039, unit: 'GB/s', description: 'HBM2e带宽' },
    { category: '内存性能', task: '内存延迟', metric: 'ns', score: 85, unit: 'ns', description: '内存访问延迟' },
    { category: '内存性能', task: 'HBM容量', metric: 'GB', score: 80, unit: 'GB', description: '高带宽内存容量' },
    { category: '推理性能', task: 'BERT推理', metric: 'samples/s', score: 1250, unit: 'samples/s', description: 'BERT-Large推理' },
    { category: '推理性能', task: 'ResNet推理', metric: 'images/s', score: 8500, unit: 'images/s', description: 'ResNet-50推理' },
    { category: '训练性能', task: 'GPT-3训练', metric: 'TFLOPS', score: 156, unit: 'TFLOPS', description: '实际训练吞吐' },
    { category: '能效', task: '功耗', metric: 'W', score: 400, unit: 'W', description: 'TDP功耗' },
    { category: '能效', task: '能效比', metric: 'TFLOPS/W', score: 0.78, unit: 'TFLOPS/W', description: '每瓦性能' },
  ];

  return {
    metrics,
    totalScore: Math.round(totalScore * 10) / 10,
    testCases: {
      total: 156,
      passed: 152,
      failed: 2,
      skipped: 2,
    },
    performance: {
      avgLatency: 45,
      p99Latency: 120,
      throughput: 1250,
      powerConsumption: 385,
      temperature: 72,
    },
    duration: '4小时20分钟',
    coverage: '99.2%',
    creator: '系统管理员',
    createdAt: card.testedAt || '2024-03-22 10:30:00',
    summary: `本次评测任务针对${card.name}进行了全面性能测试，共测试${capabilities.length}项核心指标，整体得分${totalScore.toFixed(1)}分。加速卡在各项性能上表现${totalScore >= 90 ? '优异' : totalScore >= 80 ? '良好' : '一般'}，${totalScore >= 90 ? '建议用于大规模AI训练和推理场景' : '建议根据具体场景选择使用'}。`,
    conclusion: card.status === 'tested' 
      ? '该加速卡在本次评测中表现良好，各项指标均达到预期水平。'
      : '加速卡尚未完成测试，暂无结论。',
    suggestions: [
      '建议在高负载场景下持续监控温度和功耗',
      '可考虑优化内存访问模式以提升带宽利用率',
      '建议与其他同级别加速卡进行对比分析',
    ],
    detailedMetrics,
    specs: card.specs,
  };
};

export const AcceleratorReportModal: React.FC<AcceleratorReportModalProps> = ({
  visible,
  card,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const radarRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<echarts.ECharts | null>(null);

  const details = card ? getAcceleratorResultDetails(card) : null;

  useEffect(() => {
    if (!radarRef.current || !details) return;

    if (radarChartRef.current) {
      radarChartRef.current.dispose();
    }

    const chart = echarts.init(radarRef.current);
    radarChartRef.current = chart;

    const indicator = details.metrics.map(m => ({ name: m.name, max: 100 }));

    const modelData = details.metrics.map(m => m.score);
    const avgData = [85, 82, 88, 84, 80, 83];
    const benchmarkData = [92, 90, 95, 91, 88, 87];

    chart.setOption({
      color: ['#1890ff', '#faad14', '#52c41a'],
      legend: {
        data: ['本加速卡', '行业平均', '标杆加速卡'],
        bottom: 5,
        textStyle: { color: '#fff', fontSize: 11 },
        itemWidth: 16,
        itemHeight: 8,
      },
      radar: {
        indicator,
        shape: 'polygon',
        splitNumber: 4,
        center: ['50%', '50%'],
        radius: '70%',
        axisName: {
          color: '#fff',
          fontSize: 11,
          padding: [3, 5],
        },
        splitLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.15)' },
        },
        splitArea: {
          show: true,
          areaStyle: { color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'] },
        },
        axisLine: {
          lineStyle: { color: 'rgba(255, 255, 255, 0.2)' },
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: modelData,
              name: '本加速卡',
              areaStyle: { color: 'rgba(24, 144, 255, 0.3)' },
              lineStyle: { width: 2, color: '#1890ff' },
              symbol: 'circle',
              symbolSize: 5,
            },
            {
              value: avgData,
              name: '行业平均',
              areaStyle: { color: 'rgba(250, 173, 20, 0.15)' },
              lineStyle: { width: 1.5, color: '#faad14', type: 'dashed' },
              symbol: 'circle',
              symbolSize: 3,
            },
            {
              value: benchmarkData,
              name: '标杆加速卡',
              areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
              lineStyle: { width: 1.5, color: '#52c41a', type: 'dotted' },
              symbol: 'circle',
              symbolSize: 3,
            },
          ],
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [details]);

  const detailedMetricColumns: ColumnsType<NonNullable<typeof details>['detailedMetrics'][0]> = [
    {
      title: '性能类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '测试项',
      dataIndex: 'task',
      key: 'task',
      width: 100,
    },
    {
      title: '指标',
      dataIndex: 'metric',
      key: 'metric',
      width: 100,
    },
    {
      title: '数值',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number, record) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {score} {record.unit}
        </span>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      width: 150,
      render: (text: string) => <span style={{ color: '#999' }}>{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          详情
        </Button>
      ),
    },
  ];

  if (!card || !details) return null;

  const handleExportReport = () => {
    message.success('报告导出中，请稍候...');
    setTimeout(() => {
      message.success('报告已成功导出！');
    }, 1500);
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: '#52c41a', glowColor: 'rgba(82, 196, 26, 0.2)' };
    if (score >= 80) return { text: '良好', color: '#1890ff', glowColor: 'rgba(24, 144, 255, 0.2)' };
    if (score >= 70) return { text: '中等', color: '#faad14', glowColor: 'rgba(250, 173, 20, 0.2)' };
    return { text: '一般', color: '#ff4d4f', glowColor: 'rgba(255, 77, 79, 0.2)' };
  };

  const scoreLevel = getScoreLevel(details.totalScore);

  const strengths = details.metrics.filter(m => m.score >= 85).map(m => m.name);
  const weaknesses = details.metrics.filter(m => m.score < 75).map(m => m.name);

  const tabItems = [
    {
      key: 'overview',
      label: '评测概览',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportReport}>
              导出报告
            </Button>
          </div>

          <Card 
            size="small" 
            style={{ 
              background: '#1f1f1f',
              border: '1px solid #303030',
              marginBottom: 16,
            }}
          >
            <Row gutter={24} align="middle">
              <Col span={6} style={{ textAlign: 'center' }}>
                <div 
                  style={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    padding: '16px 24px',
                    background: `radial-gradient(circle at center, ${scoreLevel.glowColor} 0%, transparent 70%)`,
                    borderRadius: 8,
                  }}
                >
                  <div 
                    style={{ 
                      fontSize: 56, 
                      fontWeight: 'bold', 
                      color: scoreLevel.color,
                      lineHeight: 1,
                      textShadow: `0 0 20px ${scoreLevel.glowColor}`,
                    }}
                  >
                    {details.totalScore}
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>综合得分</div>
                  <Tag 
                    style={{ 
                      marginTop: 8, 
                      fontSize: 12, 
                      padding: '2px 10px',
                      background: 'transparent',
                      border: `1px solid ${scoreLevel.color}`,
                      color: scoreLevel.color,
                    }}
                  >
                    {scoreLevel.text}
                  </Tag>
                </div>
              </Col>
              <Col span={18}>
                <Row gutter={16}>
                  <Col span={6}>
                    <div 
                      style={{ 
                        background: '#141414', 
                        borderRadius: 8, 
                        padding: 16,
                        border: '1px solid #303030',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#666', fontSize: 12 }}>
                        <DatabaseOutlined />
                        <span>测试用例</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>
                        {details.testCases.total}
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        background: '#141414', 
                        borderRadius: 8, 
                        padding: 16,
                        border: '1px solid #303030',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#666', fontSize: 12 }}>
                        <CheckCircleOutlined />
                        <span>通过率</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginTop: 8 }}>
                        {Math.round(details.testCases.passed / details.testCases.total * 100)}%
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        background: '#141414', 
                        borderRadius: 8, 
                        padding: 16,
                        border: '1px solid #303030',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#666', fontSize: 12 }}>
                        <ClockCircleOutlined />
                        <span>执行时长</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14', marginTop: 8 }}>
                        {details.duration}
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        background: '#141414', 
                        borderRadius: 8, 
                        padding: 16,
                        border: '1px solid #303030',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#666', fontSize: 12 }}>
                        <ThunderboltOutlined />
                        <span>功耗</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1', marginTop: 8 }}>
                        {details.performance.powerConsumption}W
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={14}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#1890ff' }} />
                    <span>性能雷达图</span>
                  </Space>
                }
                size="small" 
                style={{ background: '#1f1f1f', border: '1px solid #303030', height: '100%' }}
                headStyle={{ borderBottom: '1px solid #303030' }}
              >
                <div ref={radarRef} style={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
              </Card>
            </Col>
            <Col span={10}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <span>性能分析</span>
                  </Space>
                }
                size="small" 
                style={{ background: '#1f1f1f', border: '1px solid #303030', height: '100%' }}
                headStyle={{ borderBottom: '1px solid #303030' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#52c41a', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrophyOutlined /> 表现突出
                  </div>
                  {strengths.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {strengths.map((s, i) => (
                        <Tag 
                          key={i} 
                          style={{ 
                            background: 'rgba(82, 196, 26, 0.1)', 
                            border: '1px solid rgba(82, 196, 26, 0.3)',
                            color: '#52c41a',
                          }}
                        >
                          {s}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">暂无明显优势项</Text>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#faad14', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WarningOutlined /> 待改进项
                  </div>
                  {weaknesses.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {weaknesses.map((s, i) => (
                        <Tag 
                          key={i}
                          style={{ 
                            background: 'rgba(250, 173, 20, 0.1)', 
                            border: '1px solid rgba(250, 173, 20, 0.3)',
                            color: '#faad14',
                          }}
                        >
                          {s}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">无明显短板</Text>
                  )}
                </div>
                <div>
                  <div style={{ color: '#1890ff', fontSize: 13, marginBottom: 8 }}>性能得分分布</div>
                  {details.metrics.slice(0, 6).map((metric, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, color: '#aaa' }}>{metric.name}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: metric.score >= 85 ? '#52c41a' : metric.score >= 70 ? '#faad14' : '#ff4d4f' }}>
                          {metric.score.toFixed(1)}
                        </Text>
                      </div>
                      <Progress 
                        percent={metric.score} 
                        showInfo={false}
                        size="small"
                        strokeColor={metric.score >= 85 ? '#52c41a' : metric.score >= 70 ? '#faad14' : '#ff4d4f'}
                        trailColor="#303030"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#1890ff' }} />
                <span>详细性能指标</span>
              </Space>
            }
            size="small" 
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
            headStyle={{ borderBottom: '1px solid #303030' }}
          >
            <Table
              dataSource={details.detailedMetrics}
              columns={detailedMetricColumns}
              rowKey={(record) => `${record.category}-${record.task}`}
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'specs',
      label: '硬件规格',
      children: (
        <Card 
          size="small" 
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>厂商</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>{card.vendor}</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>型号</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>{card.model}</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>架构/制程</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>{details.specs.process}</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>核心数</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>{details.specs.cores?.toLocaleString() || '-'}</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>互联带宽</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>{details.specs.interconnect}</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>制程工艺</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#13c2c2' }}>{details.specs.process}</div>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'summary',
      label: '评测总结',
      children: (
        <Card 
          size="small" 
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#1890ff', fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTextOutlined /> 评测摘要
                </div>
                <Paragraph style={{ color: '#aaa', marginBottom: 0 }}>
                  {details.summary}
                </Paragraph>
              </div>
            </Col>
            <Col span={24}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#52c41a', fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined /> 评测结论
                </div>
                <Paragraph style={{ color: '#aaa', marginBottom: 0 }}>
                  {details.conclusion}
                </Paragraph>
              </div>
            </Col>
            <Col span={24}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#faad14', fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <WarningOutlined /> 使用建议
                </div>
                <ul style={{ color: '#aaa', marginBottom: 0, paddingLeft: 20 }}>
                  {details.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>测试人员</div>
                <div style={{ color: '#fff' }}>{details.creator}</div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#141414', borderRadius: 8, padding: 16, border: '1px solid #303030' }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>测试时间</div>
                <div style={{ color: '#fff' }}>{details.createdAt}</div>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DashboardOutlined style={{ color: '#1890ff' }} />
          <span>{card.name} 评测报告</span>
          <Tag color="blue">{card.vendor}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      styles={{
        body: { 
          background: '#141414', 
          padding: 16,
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
};

export default AcceleratorReportModal;
