import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tabs, Card, Row, Col, Tag, Table, Progress, Typography, Space, Badge, Button, Empty, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  LineChartOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { TestModel, RelatedTask, ModelVersion } from '../../mockData/testResultMock';

const { Text, Paragraph } = Typography;

interface ModelReportModalProps {
  visible: boolean;
  model: TestModel | null;
  onClose: () => void;
}

const TaskReportModal: React.FC<{
  visible: boolean;
  task: RelatedTask | null;
  onClose: () => void;
}> = ({ visible, task, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const radarRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<echarts.ECharts | null>(null);

  const getTaskResultDetails = (task: RelatedTask) => {
    const capabilities = [
      { key: 'languageUnderstanding', name: '语言理解', icon: '📖' },
      { key: 'logicReasoning', name: '逻辑推理', icon: '🧠' },
      { key: 'textGeneration', name: '文本生成', icon: '✍️' },
      { key: 'knowledgeQA', name: '知识问答', icon: '❓' },
      { key: 'codeAbility', name: '代码能力', icon: '💻' },
      { key: 'multilingualAbility', name: '多语言能力', icon: '🌐' },
    ];

    const metrics = capabilities.map(cap => ({
      ...cap,
      score: Math.round(70 + Math.random() * 25),
      maxScore: 100,
      rank: Math.random() > 0.5 ? '优秀' : Math.random() > 0.3 ? '良好' : '一般',
      details: `在${cap.name}维度上表现${Math.random() > 0.5 ? '优异' : '稳定'}，测试用例通过率${Math.round(85 + Math.random() * 15)}%`,
    }));

    const totalScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length;

    const detailedMetrics = [
      { category: '语言理解', task: '阅读理解', metric: '准确率 (EM)', score: 89.2, dataset: 'SQuAD 2.0', description: '机器阅读理解' },
      { category: '语言理解', task: '阅读理解', metric: 'F1值', score: 92.1, dataset: 'SQuAD 2.0', description: '机器阅读理解' },
      { category: '语言理解', task: '文本分类', metric: '准确率', score: 94.5, dataset: 'GLUE-SST2', description: '情感分析' },
      { category: '逻辑推理', task: '数学推理', metric: '准确率', score: 78.3, dataset: 'GSM8K', description: '数学问题求解' },
      { category: '逻辑推理', task: '常识推理', metric: '准确率', score: 85.6, dataset: 'CommonsenseQA', description: '常识问答' },
      { category: '文本生成', task: '摘要生成', metric: 'ROUGE-L', score: 42.8, dataset: 'CNN/DailyMail', description: '新闻摘要' },
      { category: '文本生成', task: '翻译', metric: 'BLEU', score: 38.5, dataset: 'WMT14', description: '英中翻译' },
      { category: '知识问答', task: '开放问答', metric: '准确率', score: 76.4, dataset: 'NaturalQuestions', description: '开放域问答' },
      { category: '代码能力', task: '代码生成', metric: 'Pass@1', score: 68.9, dataset: 'HumanEval', description: 'Python代码生成' },
      { category: '代码能力', task: '代码补全', metric: '准确率', score: 82.3, dataset: 'MBPP', description: '代码补全任务' },
    ];

    return {
      metrics,
      totalScore: Math.round(totalScore * 10) / 10,
      testCases: {
        total: Math.round(100 + Math.random() * 200),
        passed: Math.round(85 + Math.random() * 15),
        failed: Math.round(Math.random() * 10),
        skipped: Math.round(Math.random() * 5),
      },
      performance: {
        avgLatency: Math.round(50 + Math.random() * 100),
        p99Latency: Math.round(150 + Math.random() * 200),
        throughput: Math.round(10 + Math.random() * 50),
      },
      duration: '2小时35分钟',
      coverage: '98.5%',
      creator: '张三',
      createdAt: '2024-01-15 14:30:00',
      summary: `本次评测任务"${task.name}"共测试了${capabilities.length}项能力指标，整体得分${Math.round(totalScore)}分。模型在各项能力上表现${totalScore >= 85 ? '优异' : totalScore >= 70 ? '良好' : '一般'}，${totalScore >= 85 ? '建议可用于生产环境部署' : '建议进一步优化后使用'}。`,
      conclusion: task.status === 'completed' 
        ? '该模型在本任务中表现良好，各项指标均达到预期水平。'
        : '任务尚未完成，暂无结论。',
      suggestions: [
        '建议持续关注模型在该类任务中的表现',
        '可考虑增加更多测试用例以验证稳定性',
        '建议与其他模型进行对比分析',
      ],
      detailedMetrics,
    };
  };

  const details = task ? getTaskResultDetails(task) : null;

  useEffect(() => {
    if (!radarRef.current || !details) return;

    if (radarChartRef.current) {
      radarChartRef.current.dispose();
    }

    const chart = echarts.init(radarRef.current);
    radarChartRef.current = chart;

    const indicator = details.metrics.map(m => ({ name: m.name, max: 100 }));

    const modelData = details.metrics.map(m => m.score);
    const avgData = [78.5, 75.2, 80.1, 76.8, 72.3, 74.5];
    const benchmarkData = [85, 82, 88, 84, 80, 83];

    chart.setOption({
      color: ['#1890ff', '#faad14', '#52c41a'],
      legend: {
        data: ['本模型', '行业平均', '标杆模型'],
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
              name: '本模型',
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
              name: '标杆模型',
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
      title: '能力大类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '子任务',
      dataIndex: 'task',
      key: 'task',
      width: 100,
    },
    {
      title: '指标名称',
      dataIndex: 'metric',
      key: 'metric',
      width: 120,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 200,
      render: (score: number) => {
        const color = score >= 85 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 8, background: '#303030', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 4 }} />
            </div>
            <span style={{ fontWeight: 'bold', color, minWidth: 40 }}>{score.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      title: '数据源/说明',
      dataIndex: 'dataset',
      key: 'dataset',
      width: 150,
      render: (dataset: string, record) => (
        <Tooltip title={record.description}>
          <span style={{ color: '#999' }}>{dataset}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: () => (
        <Button type="link" size="small" icon={<EyeOutlined />}>
          查看
        </Button>
      ),
    },
  ];

  if (!task || !details) return null;

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
                        <span>平均延迟</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1', marginTop: 8 }}>
                        {details.performance.avgLatency}ms
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
                    <span>能力雷达图</span>
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
                    <span>能力分析</span>
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
                  <div style={{ color: '#1890ff', fontSize: 13, marginBottom: 8 }}>能力得分分布</div>
                  {details.metrics.slice(0, 6).map((metric, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: 12, color: '#aaa' }}>{metric.name}</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: metric.score >= 85 ? '#52c41a' : metric.score >= 70 ? '#faad14' : '#ff4d4f' }}>
                          {metric.score}
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

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card 
                title={
                  <Space>
                    <DatabaseOutlined style={{ color: '#1890ff' }} />
                    <span>测试用例统计</span>
                  </Space>
                }
                size="small" 
                style={{ background: '#1f1f1f', border: '1px solid #303030' }}
                headStyle={{ borderBottom: '1px solid #303030' }}
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(82, 196, 26, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(82, 196, 26, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                        {details.testCases.passed}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>通过</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(255, 77, 79, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 77, 79, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                        {details.testCases.failed}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>失败</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(250, 173, 20, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(250, 173, 20, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                        {details.testCases.skipped}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>跳过</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(24, 144, 255, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(24, 144, 255, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                        {details.testCases.total}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>总计</div>
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>通过率</Text>
                  <Progress 
                    percent={Math.round(details.testCases.passed / details.testCases.total * 100)} 
                    strokeColor="#52c41a"
                    trailColor="#303030"
                  />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title={
                  <Space>
                    <ThunderboltOutlined style={{ color: '#722ed1' }} />
                    <span>性能指标</span>
                  </Space>
                }
                size="small" 
                style={{ background: '#1f1f1f', border: '1px solid #303030' }}
                headStyle={{ borderBottom: '1px solid #303030' }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(24, 144, 255, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(24, 144, 255, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                        {details.performance.avgLatency}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>平均延迟 (ms)</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(250, 173, 20, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(250, 173, 20, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                        {details.performance.p99Latency}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>P99延迟 (ms)</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div 
                      style={{ 
                        textAlign: 'center', 
                        padding: 16,
                        background: 'rgba(82, 196, 26, 0.05)',
                        borderRadius: 8,
                        border: '1px solid rgba(82, 196, 26, 0.1)',
                      }}
                    >
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        {details.performance.throughput}
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>吞吐量 (req/s)</div>
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 16, padding: '12px', background: '#141414', borderRadius: 8, border: '1px solid #303030' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    性能评估：{details.performance.avgLatency < 100 ? '响应迅速，性能优异' : details.performance.avgLatency < 200 ? '响应正常，性能良好' : '响应较慢，建议优化'}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>评测摘要</span>
              </Space>
            }
            size="small" 
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
            headStyle={{ borderBottom: '1px solid #303030' }}
          >
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 0, color: '#aaa' }}>
              {details.summary}
            </Paragraph>
          </Card>
        </div>
      ),
    },
    {
      key: 'details',
      label: '详细指标',
      children: (
        <div>
          <Card 
            title={
              <Space>
                <BarChartOutlined />
                <span>详细指标明细表</span>
              </Space>
            }
            size="small" 
            style={{ background: '#1f1f1f', marginBottom: 16 }}
          >
            <Table
              dataSource={details.detailedMetrics}
              columns={detailedMetricColumns}
              pagination={false}
              size="small"
              rowKey={(record, index) => `${record.category}-${record.task}-${index}`}
              scroll={{ x: 800 }}
            />
          </Card>

          <Card title="测试用例统计" size="small" style={{ background: '#1f1f1f', marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {details.testCases.passed}
                  </div>
                  <div style={{ color: '#999' }}>通过</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {details.testCases.failed}
                  </div>
                  <div style={{ color: '#999' }}>失败</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                    {details.testCases.skipped}
                  </div>
                  <div style={{ color: '#999' }}>跳过</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                    {details.testCases.total}
                  </div>
                  <div style={{ color: '#999' }}>总计</div>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="性能指标" size="small" style={{ background: '#1f1f1f' }}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {details.performance.avgLatency} ms
                  </div>
                  <div style={{ color: '#999' }}>平均延迟</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {details.performance.p99Latency} ms
                  </div>
                  <div style={{ color: '#999' }}>P99延迟</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {details.performance.throughput} req/s
                  </div>
                  <div style={{ color: '#999' }}>吞吐量</div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'conclusion',
      label: '结论与建议',
      children: (
        <div>
          <Card title="评测结论" size="small" style={{ background: '#1f1f1f', marginBottom: 16 }}>
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8 }}>{details.conclusion}</Paragraph>
          </Card>

          <Card title="改进建议" size="small" style={{ background: '#1f1f1f' }}>
            <div style={{ marginTop: 8 }}>
              {details.suggestions.map((item, index) => (
                <div key={index} style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start' }}>
                  <Tag color="blue" style={{ marginRight: 8 }}>{index + 1}</Tag>
                  <Text>{item}</Text>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} /> },
    running: { color: 'processing', text: '运行中', icon: <ClockCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} /> },
    pending: { color: 'default', text: '待执行', icon: <ClockCircleOutlined style={{ color: '#999', marginRight: 4 }} /> },
    failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} /> },
  };

  const statusInfo = statusConfig[task.status] || statusConfig.pending;

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>任务测试报告</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={1000}
      style={{ top: 20 }}
    >
      <Card size="small" style={{ background: '#1f1f1f', marginBottom: 16 }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">任务ID</Text>
            </div>
            <Text copyable style={{ fontFamily: 'monospace' }}>{task.id}</Text>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">任务名称</Text>
            </div>
            <Text>{task.name}</Text>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">任务类型</Text>
            </div>
            <Tag color="blue">{task.type}</Tag>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">任务状态</Text>
            </div>
            <Space>
              {statusInfo.icon}
              <Text>{statusInfo.text}</Text>
            </Space>
          </Col>
        </Row>
        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">创建时间</Text>
            </div>
            <Text>{new Date(task.createdAt).toLocaleString('zh-CN')}</Text>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">完成时间</Text>
            </div>
            <Text>{task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'}</Text>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">执行时长</Text>
            </div>
            <Text>{task.duration || '-'}</Text>
          </Col>
          <Col span={6}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">创建人</Text>
            </div>
            <Text>{details.creator}</Text>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

const SingleModelAnalysis: React.FC<{ model: TestModel }> = ({ model }) => {
  const radarRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<echarts.ECharts | null>(null);

  const AVERAGE_SCORES = {
    languageUnderstanding: 78.5,
    logicReasoning: 75.2,
    textGeneration: 80.1,
    knowledgeQA: 76.8,
    codeAbility: 72.3,
  };

  const scoreData = [
    { 
      name: '语言推理', 
      modelScore: model.scores.languageUnderstanding, 
      avgScore: AVERAGE_SCORES.languageUnderstanding,
      level: model.scores.languageUnderstanding >= 85 ? '优秀' : model.scores.languageUnderstanding >= 70 ? '良好' : '一般' 
    },
    { 
      name: '逻辑推理', 
      modelScore: model.scores.logicReasoning, 
      avgScore: AVERAGE_SCORES.logicReasoning,
      level: model.scores.logicReasoning >= 85 ? '优秀' : model.scores.logicReasoning >= 70 ? '良好' : '一般' 
    },
    { 
      name: '文本生成', 
      modelScore: model.scores.textGeneration, 
      avgScore: AVERAGE_SCORES.textGeneration,
      level: model.scores.textGeneration >= 85 ? '优秀' : model.scores.textGeneration >= 70 ? '良好' : '一般' 
    },
    { 
      name: '知识问答', 
      modelScore: model.scores.knowledgeQA, 
      avgScore: AVERAGE_SCORES.knowledgeQA,
      level: model.scores.knowledgeQA >= 85 ? '优秀' : model.scores.knowledgeQA >= 70 ? '良好' : '一般' 
    },
    { 
      name: '代码能力', 
      modelScore: model.scores.codeAbility, 
      avgScore: AVERAGE_SCORES.codeAbility,
      level: model.scores.codeAbility >= 85 ? '优秀' : model.scores.codeAbility >= 70 ? '良好' : '一般' 
    },
  ];

  useEffect(() => {
    if (!radarRef.current || !model) return;

    if (radarChartRef.current) {
      radarChartRef.current.dispose();
    }

    const chart = echarts.init(radarRef.current);
    radarChartRef.current = chart;

    const indicator = [
      { name: '语言推理', max: 100 },
      { name: '逻辑推理', max: 100 },
      { name: '文本生成', max: 100 },
      { name: '知识问答', max: 100 },
      { name: '代码能力', max: 100 },
    ];

    const modelData = [
      model.scores.languageUnderstanding,
      model.scores.logicReasoning,
      model.scores.textGeneration,
      model.scores.knowledgeQA,
      model.scores.codeAbility,
    ];

    const avgData = [
      AVERAGE_SCORES.languageUnderstanding,
      AVERAGE_SCORES.logicReasoning,
      AVERAGE_SCORES.textGeneration,
      AVERAGE_SCORES.knowledgeQA,
      AVERAGE_SCORES.codeAbility,
    ];

    chart.setOption({
      color: ['#1890ff', '#faad14'],
      legend: {
        data: ['本模型', '平均水平'],
        bottom: 5,
        textStyle: { color: '#fff', fontSize: 12 },
        itemWidth: 20,
        itemHeight: 10,
      },
      radar: {
        indicator,
        shape: 'polygon',
        splitNumber: 4,
        center: ['50%', '50%'],
        radius: '75%',
        axisName: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 'normal',
          padding: [3, 5],
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.15)',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const data = params.data;
          let html = `<div style="font-weight:bold;margin-bottom:5px;">${data.name}</div>`;
          indicator.forEach((item, index) => {
            html += `<div>${item.name}: <span style="color:#1890ff;font-weight:bold;">${data.value[index]}</span></div>`;
          });
          return html;
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: modelData,
              name: '本模型',
              areaStyle: {
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.1)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.4)' },
                ]),
              },
              lineStyle: {
                width: 3,
                color: '#1890ff',
              },
              symbol: 'circle',
              symbolSize: 8,
              itemStyle: {
                color: '#1890ff',
                borderColor: '#fff',
                borderWidth: 2,
              },
            },
            {
              value: avgData,
              name: '平均水平',
              areaStyle: {
                color: 'rgba(250, 173, 20, 0.15)',
              },
              lineStyle: {
                width: 2,
                color: '#faad14',
                type: 'dashed',
              },
              symbol: 'circle',
              symbolSize: 5,
              itemStyle: {
                color: '#faad14',
                borderColor: '#fff',
                borderWidth: 1,
              },
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
  }, [model]);

  const scoreColumns: ColumnsType<typeof scoreData[0]> = [
    {
      title: '能力维度',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '本模型得分',
      dataIndex: 'modelScore',
      key: 'modelScore',
      width: 200,
      render: (score: number, record) => {
        const diff = score - record.avgScore;
        const color = score >= 85 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f';
        return (
          <Space>
            <Progress 
              percent={score} 
              size="small" 
              style={{ width: 100 }}
              strokeColor={color}
            />
            <span style={{ fontWeight: 'bold', color }}>
              {score.toFixed(1)}
            </span>
            {diff > 0 && <span style={{ color: '#52c41a', fontSize: 12 }}>+{diff.toFixed(1)}</span>}
            {diff < 0 && <span style={{ color: '#ff4d4f', fontSize: 12 }}>{diff.toFixed(1)}</span>}
          </Space>
        );
      },
    },
    {
      title: '平均水平',
      dataIndex: 'avgScore',
      key: 'avgScore',
      width: 120,
      render: (score: number) => (
        <span style={{ color: '#999' }}>{score.toFixed(1)}</span>
      ),
    },
    {
      title: '水平',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={level === '优秀' ? 'green' : level === '良好' ? 'blue' : 'orange'}>{level}</Tag>
      ),
    },
  ];

  const getModelSummary = () => {
    const avgScore = model.scores.overall;
    const topCapabilities = scoreData.filter(s => s.modelScore >= 85).map(s => s.name);
    const weakCapabilities = scoreData.filter(s => s.modelScore < 70).map(s => s.name);
    const aboveAvgCount = scoreData.filter(s => s.modelScore > s.avgScore).length;
    
    let summary = `${model.name}（${model.version}）综合得分${avgScore.toFixed(1)}分，`;
    
    if (avgScore >= 90) {
      summary += '整体表现优异，属于顶尖水平模型。';
    } else if (avgScore >= 80) {
      summary += '整体表现良好，具有较强的综合能力。';
    } else if (avgScore >= 70) {
      summary += '整体表现中等，在部分能力上仍有提升空间。';
    } else {
      summary += '整体表现一般，建议针对性优化。';
    }
    
    summary += `在${scoreData.length}项能力指标中，有${aboveAvgCount}项超过平均水平。`;
    
    if (topCapabilities.length > 0) {
      summary += `在${topCapabilities.join('、')}等方面表现突出；`;
    }
    
    if (weakCapabilities.length > 0) {
      summary += `${weakCapabilities.join('、')}能力相对薄弱，建议重点关注。`;
    }
    
    return summary;
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="能力雷达图" 
            size="small" 
            style={{ background: '#1f1f1f', marginBottom: 16 }}
          >
            <div ref={radarRef} style={{ width: '100%', height: 340 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="能力得分对比" 
            size="small" 
            style={{ background: '#1f1f1f', marginBottom: 16 }}
          >
            <Table
              dataSource={scoreData}
              columns={scoreColumns}
              pagination={false}
              size="small"
              rowKey="name"
            />
            <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
              注：平均水平基于所有已测模型的平均得分计算
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title="模型简评" 
        size="small" 
        style={{ background: '#1f1f1f' }}
      >
        <Paragraph style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 0 }}>
          {getModelSummary()}
        </Paragraph>
      </Card>
    </div>
  );
};

const TrendAnalysis: React.FC<{ model: TestModel }> = ({ model }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !model.versionHistory || model.versionHistory.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const versions = model.versionHistory.map(v => v.version);
    const dimensions = ['overall', 'languageUnderstanding', 'logicReasoning', 'textGeneration', 'knowledgeQA', 'codeAbility', 'multilingualAbility'];
    const dimensionNames = ['综合得分', '语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'];
    const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96'];

    const series = dimensions.map((dim, index) => ({
      name: dimensionNames[index],
      type: 'line',
      data: model.versionHistory!.map(v => v.scores[dim as keyof typeof v.scores]),
      smooth: true,
      lineStyle: { width: 2 },
      itemStyle: { color: colors[index] },
    }));

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#303030',
        textStyle: { color: '#fff' },
      },
      legend: {
        data: dimensionNames,
        top: 10,
        textStyle: { color: '#fff' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: versions,
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
      },
      yAxis: {
        type: 'value',
        min: 60,
        max: 100,
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
        splitLine: { lineStyle: { color: '#303030' } },
      },
      series,
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [model]);

  const versionColumns: ColumnsType<ModelVersion> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: '发布日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '综合得分',
      dataIndex: 'scores',
      key: 'overall',
      render: (scores: ModelVersion['scores']) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{scores.overall.toFixed(1)}</span>
      ),
    },
    {
      title: '更新说明',
      dataIndex: 'changes',
      key: 'changes',
    },
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <LineChartOutlined />
            <span>版本迭代性能趋势</span>
          </Space>
        } 
        size="small" 
        style={{ background: '#1f1f1f', marginBottom: 16 }}
      >
        {model.versionHistory && model.versionHistory.length > 0 ? (
          <div ref={chartRef} style={{ width: '100%', height: 350 }} />
        ) : (
          <Empty description="暂无版本历史数据" />
        )}
      </Card>

      <Card 
        title="版本历史记录" 
        size="small" 
        style={{ background: '#1f1f1f' }}
      >
        {model.versionHistory && model.versionHistory.length > 0 ? (
          <Table
            dataSource={model.versionHistory}
            columns={versionColumns}
            pagination={false}
            size="small"
            rowKey="version"
          />
        ) : (
          <Empty description="暂无版本历史数据" />
        )}
      </Card>
    </div>
  );
};

const RelatedTasksList: React.FC<{ 
  model: TestModel; 
  onTaskClick: (task: RelatedTask) => void 
}> = ({ model, onTaskClick }) => {
  const taskColumns: ColumnsType<RelatedTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {id}
        </Text>
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RelatedTask['status']) => {
        const config: Record<RelatedTask['status'], { color: string; text: string; icon: React.ReactNode }> = {
          completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} /> },
          running: { color: 'processing', text: '运行中', icon: <ClockCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} /> },
          pending: { color: 'default', text: '待执行', icon: <ClockCircleOutlined style={{ color: '#999', marginRight: 4 }} /> },
          failed: { color: 'error', text: '失败', icon: <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} /> },
        };
        return (
          <Space>
            {config[status].icon}
            <span>{config[status].text}</span>
          </Space>
        );
      },
    },
    {
      title: '能力维度',
      dataIndex: 'capabilities',
      key: 'capabilities',
      width: 200,
      render: (capabilities: string[]) => (
        <Space size={[2, 4]} wrap>
          {capabilities.slice(0, 3).map(cap => <Tag key={cap} color="blue">{cap}</Tag>)}
          {capabilities.length > 3 && <Tag>+{capabilities.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '综合得分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 100,
      render: (score?: number) => score ? (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{score}分</span>
      ) : '-',
    },
    {
      title: '执行时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration?: string) => duration ? (
        <Space>
          <ClockCircleOutlined />
          {duration}
        </Space>
      ) : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onTaskClick(record)}
          disabled={record.status !== 'completed'}
        >
          查看报告
        </Button>
      ),
    },
  ];

  return (
    <Card 
      title={
        <Space>
          <FileTextOutlined />
          <span>关联任务列表</span>
        </Space>
      } 
      size="small" 
      style={{ background: '#1f1f1f' }}
    >
      {model.relatedTasks && model.relatedTasks.length > 0 ? (
        <Table
          dataSource={model.relatedTasks}
          columns={taskColumns}
          pagination={false}
          size="small"
          rowKey="id"
          scroll={{ x: 1100 }}
        />
      ) : (
        <Empty description="暂无关联任务" />
      )}
    </Card>
  );
};

export const ModelReportModal: React.FC<ModelReportModalProps> = ({ visible, model, onClose }) => {
  const [selectedTask, setSelectedTask] = useState<RelatedTask | null>(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);

  const handleTaskClick = (task: RelatedTask) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
  };

  if (!model) return null;

  const tabItems = [
    {
      key: 'analysis',
      label: (
        <Space>
          <LineChartOutlined />
          单模型分析
        </Space>
      ),
      children: <SingleModelAnalysis model={model} />,
    },
    {
      key: 'trend',
      label: (
        <Space>
          <LineChartOutlined />
          时序趋势分析
        </Space>
      ),
      children: <TrendAnalysis model={model} />,
    },
    {
      key: 'tasks',
      label: (
        <Space>
          <FileTextOutlined />
          关联任务
          {model.relatedTasks && <Badge count={model.relatedTasks.length} style={{ backgroundColor: '#1890ff' }} />}
        </Space>
      ),
      children: <RelatedTasksList model={model} onTaskClick={handleTaskClick} />,
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{model.name}</span>
            <Tag color="blue">{model.version}</Tag>
            <Tag>{model.organization}</Tag>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
        width={1100}
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Card size="small" style={{ background: '#1f1f1f', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff' }}>
                  {model.scores.overall.toFixed(1)}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>综合得分</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#1f1f1f', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                  {model.capabilities.length}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>能力标签</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#1f1f1f', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                  {model.relatedTasks?.length || 0}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>关联任务</div>
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#1f1f1f', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#722ed1' }}>
                  {model.versionHistory?.length || 0}
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>历史版本</div>
              </Card>
            </Col>
          </Row>
        </div>

        <Tabs defaultActiveKey="analysis" items={tabItems} />
      </Modal>

      <TaskReportModal
        visible={taskModalVisible}
        task={selectedTask}
        onClose={() => setTaskModalVisible(false)}
      />
    </>
  );
};

export default ModelReportModal;
