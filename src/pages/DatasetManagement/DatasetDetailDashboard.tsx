import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Tag, 
  Space, 
  Tabs, 
  Button, 
  Modal, 
  message,
  Typography,
  Timeline,
  Alert,
  Select,
  Descriptions,
  Table,
  Avatar,
} from 'antd';
import {
  DatabaseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  DiffOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { Dataset } from '../../types/dataset';
import { TASK_TYPE_LABELS, TASK_TYPE_ICONS, EVALUATION_DIMENSION_LABELS, DATASET_SOURCE_LABELS } from '../../types/dataset';
import { getRelatedTasks } from '../../services/assetTaskLinker';
import { useAppStore } from '../../store/appStore';

const { Text } = Typography;

interface DatasetDetailDashboardProps {
  dataset: Dataset;
  visible: boolean;
  onClose: () => void;
  category: 'llm' | 'hardware';
}

interface QualityDimension {
  name: string;
  max: number;
  value: number;
}

export const DatasetDetailDashboard: React.FC<DatasetDetailDashboardProps> = ({ dataset, visible, onClose, category }) => {
  const { setCurrentPage, setSelectedTask } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVersions, setSelectedVersions] = useState<[string, string]>(['', '']);
  const [compareModalVisible, setCompareModalVisible] = useState(false);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [selectedVersionForRollback, setSelectedVersionForRollback] = useState<string>('');

  const radarChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const robustnessChartRef = useRef<HTMLDivElement>(null);

  const radarChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);
  const robustnessChartInstance = useRef<echarts.ECharts | null>(null);

  const qualityDimensions = useMemo<QualityDimension[]>(() => {
    const baseDimensions = [
      { name: '准确性', max: 100, value: dataset.qualityScore },
      { name: '一致性', max: 100, value: 85 },
      { name: '覆盖度', max: 100, value: 78 },
      { name: '鲁棒性', max: 100, value: 82 },
    ];

    if (dataset.taskType === 'training') {
      return [
        { name: '训练速度', max: 100, value: dataset.qualityScore },
        { name: '收敛精度', max: 100, value: 88 },
        { name: '能效比', max: 100, value: 85 },
        { name: '稳定性', max: 100, value: 82 },
      ];
    }

    if (dataset.taskType === 'inference') {
      return [
        { name: '延迟', max: 100, value: 90 },
        { name: '吞吐率', max: 100, value: dataset.qualityScore },
        { name: '正确率', max: 100, value: 87 },
        { name: '资源利用率', max: 100, value: 85 },
      ];
    }

    if (dataset.taskType === 'matrix-computation') {
      return [
        { name: '计算吞吐率', max: 100, value: dataset.qualityScore },
        { name: '内存带宽利用率', max: 100, value: 88 },
        { name: '并行扩展性', max: 100, value: 85 },
        { name: '计算精度', max: 100, value: 90 },
      ];
    }

    return baseDimensions;
  }, [dataset.taskType, dataset.qualityScore]);

  const taskDistribution = useMemo(() => {
    if (dataset.taskType === 'training') {
      return [
        { name: 'ResNet', value: Math.floor(dataset.sampleCount * 0.4) },
        { name: 'ViT', value: Math.floor(dataset.sampleCount * 0.3) },
        { name: 'Transformer', value: Math.floor(dataset.sampleCount * 0.2) },
        { name: 'GPT/BERT', value: Math.floor(dataset.sampleCount * 0.1) },
      ];
    }

    if (dataset.taskType === 'inference') {
      return [
        { name: 'GLUE', value: Math.floor(dataset.sampleCount * 0.35) },
        { name: 'SuperGLUE', value: Math.floor(dataset.sampleCount * 0.3) },
        { name: 'SQuAD', value: Math.floor(dataset.sampleCount * 0.35) },
      ];
    }

    if (dataset.taskType === 'matrix-computation') {
      return [
        { name: '稠密矩阵', value: Math.floor(dataset.sampleCount * 0.5) },
        { name: '稀疏矩阵', value: Math.floor(dataset.sampleCount * 0.3) },
        { name: 'LU分解', value: Math.floor(dataset.sampleCount * 0.1) },
        { name: 'SVD分解', value: Math.floor(dataset.sampleCount * 0.1) },
      ];
    }

    return [
      { name: TASK_TYPE_LABELS[dataset.taskType], value: dataset.sampleCount },
      { name: '其他任务', value: Math.floor(dataset.sampleCount * 0.3) },
    ];
  }, [dataset.taskType, dataset.sampleCount]);

  const languageDistribution = useMemo(() => {
    if (dataset.languageDistribution === 'N/A') {
      return [{ name: '不适用', value: 100 }];
    }
    const languages = dataset.languageDistribution.split('/');
    const baseValue = 100 / languages.length;
    return languages.map((lang, index) => ({
      name: lang,
      value: baseValue + (index * 5),
    }));
  }, [dataset.languageDistribution]);

  const robustnessData = useMemo(() => [
    { name: '常规样本', value: 60 },
    { name: '对抗样本', value: 15 },
    { name: '噪声样本', value: 15 },
    { name: '边界值算例', value: 10 },
  ], []);



  const initRadarChart = useCallback(() => {
    if (!radarChartRef.current) return;
    
    radarChartInstance.current = echarts.init(radarChartRef.current);
    
    const option = {
      tooltip: {
        trigger: 'item',
      },
      radar: {
        indicator: qualityDimensions.map(d => ({ name: d.name, max: d.max })),
        center: ['50%', '50%'],
        radius: '70%',
      },
      series: [{
        type: 'radar',
        data: [{
          value: qualityDimensions.map(d => d.value),
          name: '质量评估',
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.3)',
          },
          lineStyle: {
            color: '#1890ff',
            width: 2,
          },
          itemStyle: {
            color: '#1890ff',
          },
        }],
      }],
    };

    radarChartInstance.current.setOption(option);
  }, [qualityDimensions]);

  const initBarChart = useCallback(() => {
    if (!barChartRef.current) return;
    
    barChartInstance.current = echarts.init(barChartRef.current);
    
    const option = {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: taskDistribution.map(d => d.name),
      },
      yAxis: {
        type: 'value',
        name: '样本数量',
      },
      series: [{
        type: 'bar',
        data: taskDistribution.map(d => d.value),
        itemStyle: {
          color: '#1890ff',
        },
      }],
    };

    barChartInstance.current.setOption(option);
  }, [taskDistribution]);

  const initPieChart = useCallback(() => {
    if (!pieChartRef.current) return;
    
    pieChartInstance.current = echarts.init(pieChartRef.current);
    
    const option = {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [{
        type: 'pie',
        radius: '60%',
        data: languageDistribution.map(d => ({
          name: d.name,
          value: d.value,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }],
    };

    pieChartInstance.current.setOption(option);
  }, [languageDistribution]);

  const initRobustnessChart = useCallback(() => {
    if (!robustnessChartRef.current) return;
    
    robustnessChartInstance.current = echarts.init(robustnessChartRef.current);
    
    const option = {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: robustnessData.map(d => d.name),
      },
      yAxis: {
        type: 'value',
        name: '占比 (%)',
        max: 100,
      },
      series: [{
        type: 'bar',
        data: robustnessData.map(d => d.value),
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const colors = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f'];
            return colors[params.dataIndex % colors.length];
          },
        },
      }],
    };

    robustnessChartInstance.current.setOption(option);
  }, [robustnessData]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      if (activeTab === 'overview') {
        initRadarChart();
      } else if (activeTab === 'distribution') {
        initBarChart();
        initPieChart();
        initRobustnessChart();
      }
    }, 100);

    const handleResize = () => {
      radarChartInstance.current?.resize();
      barChartInstance.current?.resize();
      pieChartInstance.current?.resize();
      robustnessChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      radarChartInstance.current?.dispose();
      barChartInstance.current?.dispose();
      pieChartInstance.current?.dispose();
      robustnessChartInstance.current?.dispose();
    };
  }, [visible, activeTab, initRadarChart, initBarChart, initPieChart, initRobustnessChart, dataset]);

  const handleVersionCompare = () => {
    if (selectedVersions[0] && selectedVersions[1]) {
      setCompareModalVisible(true);
    } else {
      message.warning('请选择两个版本进行对比');
    }
  };

  const handleViewRelatedTask = (taskId: string) => {
    setSelectedTask({
      id: taskId,
      name: `${dataset.name} Benchmark`,
      status: 'SUCCESS',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
      createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      workflowId: 'workflow-001',
      resources: {
        cardModel: 'NVIDIA H100',
        driverVersion: '535.104',
        cudaVersion: '12.2',
      },
      dataLineage: {
        datasetName: dataset.name,
        datasetVersionHash: 'd4e5f6',
        modelWeightHash: 'a1b2c3',
      },
    });
    setCurrentPage('task-detail');
  };

  const handleRollback = (version: string) => {
    setSelectedVersionForRollback(version);
    setRollbackModalVisible(true);
  };

  const confirmRollback = () => {
    message.success(`已回滚到版本 ${selectedVersionForRollback}`);
    setRollbackModalVisible(false);
  };

  const renderOverviewTab = () => (
    <div>
      <Card title="基础信息" style={{ marginBottom: '24px' }}>
        <Descriptions 
          column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2, xxl: 2 }} 
          bordered
        >
          <Descriptions.Item label="数据集名称">{dataset.name}</Descriptions.Item>
          <Descriptions.Item label="版本号">v{dataset.version}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(dataset.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="数据来源">
            <Tag color={dataset.source === 'open-source' ? 'blue' : 'green'}>
              {DATASET_SOURCE_LABELS[dataset.source]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="任务类型">
            <Space>
              <span>{TASK_TYPE_ICONS[dataset.taskType]}</span>
              <span>{TASK_TYPE_LABELS[dataset.taskType]}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="测评维度">
            {EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension]}
          </Descriptions.Item>
          {dataset.source === 'self-built' && dataset.uploadedBy && (
            <Descriptions.Item label="上传人" span={2}>
              <Space>
                <Avatar 
                  size="small" 
                  src={dataset.uploadedByAvatar}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {dataset.uploadedBy?.charAt(0) || 'U'}
                </Avatar>
                <span>{dataset.uploadedBy}</span>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="样本总量"
              value={dataset.sampleCount}
              prefix={<DatabaseOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="平均精度要求"
              value={dataset.qualityScore}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: dataset.qualityScore >= 99 ? '#52c41a' : '#faad14' } }}
            />
            {dataset.qualityScore >= 99 && (
              <Tag color="success" style={{ marginTop: '8px' }}>
                达到99%以上
              </Tag>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="覆盖任务数"
              value={1}
              prefix={<DatabaseOutlined />}
              styles={{ content: { color: '#722ed1' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="语言分布"
              value={dataset.languageDistribution === 'N/A' ? 1 : dataset.languageDistribution.split('/').length}
              prefix={<UserOutlined />}
              styles={{ content: { color: '#eb2f96' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title="最近任务"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<RocketOutlined />}
                onClick={() => {
                  const targetPage = category === 'llm' ? 'llm-tasks' : 'accelerator-tasks';
                  setCurrentPage(targetPage);
                  message.success(`正在为数据集 ${dataset.name} 创建任务`);
                }}
              >
                创建任务
              </Button>
            }
          >
            {(() => {
              const relatedTasks = getRelatedTasks(dataset.id);
              if (relatedTasks.length > 0) {
                return (
                  <Table
                    dataSource={relatedTasks.slice(0, 5).map((taskId: string) => ({
                      key: taskId,
                      taskId,
                    }))}
                    columns={[
                      {
                        title: '任务ID',
                        dataIndex: 'taskId',
                        key: 'taskId',
                        render: (text: string) => <code>{text}</code>,
                      },
                      {
                        title: '操作',
                        key: 'actions',
                        render: (_: unknown, record: { taskId: string }) => (
                          <Button
                            size="small"
                            type="link"
                            icon={<RocketOutlined />}
                            onClick={() => handleViewRelatedTask(record.taskId)}
                          >
                            查看详情
                          </Button>
                        ),
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                );
              } else {
                return (
                  <Alert
                    message="暂无相关任务"
                    description="点击右上角按钮创建新任务"
                    type="info"
                    showIcon
                  />
                );
              }
            })()}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="质量四维雷达图">
            <div ref={radarChartRef} style={{ width: '100%', height: '400px' }} />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderDistributionTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="任务分布">
            <div ref={barChartRef} style={{ width: '100%', height: '400px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="语言/场景分布">
            <div ref={pieChartRef} style={{ width: '100%', height: '400px' }} />
          </Card>
        </Col>
      </Row>

      <Card title="难度与鲁棒性分析">
        <Alert
          message="鲁棒性测试数据覆盖情况"
          description="展示常规样本、对抗样本、噪声样本、边界值算例的比例分布"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        <div ref={robustnessChartRef} style={{ width: '100%', height: '400px' }} />
      </Card>
    </div>
  );

  const renderVersionTab = () => (
    <div>
      <Card title="版本操作" style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Select
            placeholder="选择版本1"
            style={{ width: '100%', minWidth: '200px', maxWidth: '300px' }}
            value={selectedVersions[0]}
            onChange={(value) => setSelectedVersions([value, selectedVersions[1]])}
            options={dataset.versions.map(v => ({ label: v.version, value: v.version }))}
          />
          <Select
            placeholder="选择版本2"
            style={{ width: '100%', minWidth: '200px', maxWidth: '300px' }}
            value={selectedVersions[1]}
            onChange={(value) => setSelectedVersions([selectedVersions[0], value])}
            options={dataset.versions.map(v => ({ label: v.version, value: v.version }))}
          />
          <Button
            type="primary"
            icon={<DiffOutlined />}
            onClick={handleVersionCompare}
          >
            差分对比
          </Button>
        </Space>
      </Card>

      <Card title="版本时间轴">
        <Timeline
          items={dataset.versions.map((version, index) => ({
            color: index === 0 ? 'green' : 'blue',
            dot: index === 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
            children: (
              <div>
                <Space>
                  <Text strong>v{version.version}</Text>
                  <Tag color="blue">{new Date(version.createdAt).toLocaleDateString('zh-CN')}</Tag>
                  <Tag color="purple">
                    {index === 0 ? '新增' : version.changes.some(c => c.includes('修复')) ? '修复' : '优化'}
                  </Tag>
                </Space>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">{version.changes.join(', ')}</Text>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Space>
                    <Button
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={() => message.info('查看元数据详情')}
                    >
                      元数据详情
                    </Button>
                    {index > 0 && (
                      <Button
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => handleRollback(version.version)}
                      >
                        回滚
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );

  const renderSamplePreviewTab = () => {
    const previewData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      text: `Sample text ${i + 1}`,
      label: i % 2 === 0 ? 'positive' : 'negative',
      score: Math.random().toFixed(2),
    }));

    const mockSamples = useMemo(() => {
      const baseSamples = [
        {
          id: '1',
          type: 'text' as const,
          content: '这是一个典型的文本样本，用于评估模型的语言理解能力。',
          evaluationDimension: EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension],
          difficulty: 'easy' as const,
        },
        {
          id: '2',
          type: 'code' as const,
          content: 'def calculate_metrics(predictions, labels):\n    accuracy = sum(p == l for p, l in zip(predictions, labels)) / len(labels)\n    return accuracy',
          evaluationDimension: EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension],
          difficulty: 'medium' as const,
        },
        {
          id: '3',
          type: 'text' as const,
          content: '这是一个中等难度的样本，需要模型具备一定的推理能力。',
          evaluationDimension: EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension],
          difficulty: 'medium' as const,
        },
        {
          id: '4',
          type: 'matrix' as const,
          content: '[[0.8, 0.2, 0.0], [0.1, 0.7, 0.2], [0.0, 0.3, 0.7]]',
          evaluationDimension: EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension],
          difficulty: 'hard' as const,
        },
        {
          id: '5',
          type: 'text' as const,
          content: '这是一个高难度样本，测试模型的极限性能和鲁棒性。',
          evaluationDimension: EVALUATION_DIMENSION_LABELS[dataset.evaluationDimension],
          difficulty: 'hard' as const,
        },
      ];

      if (dataset.taskType === 'training') {
        return [
          {
            id: '1',
            type: 'text' as const,
            content: 'ImageNet训练样本：ResNet-50模型训练速度测试',
            evaluationDimension: '性能',
            difficulty: 'easy' as const,
          },
          {
            id: '2',
            type: 'text' as const,
            content: 'ViT模型收敛精度测试：训练轮次100，学习率0.001',
            evaluationDimension: '性能',
            difficulty: 'medium' as const,
          },
          {
            id: '3',
            type: 'text' as const,
            content: 'Transformer模型能效比测试：GPU利用率95%，能耗12.5W',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
          {
            id: '4',
            type: 'text' as const,
            content: 'GPT模型训练稳定性测试：梯度爆炸检测，损失函数收敛',
            evaluationDimension: '性能',
            difficulty: 'medium' as const,
          },
          {
            id: '5',
            type: 'text' as const,
            content: 'BERT模型训练速度优化：混合精度训练，批处理大小256',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
        ];
      }

      if (dataset.taskType === 'inference') {
        return [
          {
            id: '1',
            type: 'text' as const,
            content: 'GLUE推理延迟测试：平均延迟15ms，P99延迟45ms',
            evaluationDimension: '性能',
            difficulty: 'easy' as const,
          },
          {
            id: '2',
            type: 'text' as const,
            content: 'SuperGLUE吞吐率测试：QPS=1250，并发数=8',
            evaluationDimension: '性能',
            difficulty: 'medium' as const,
          },
          {
            id: '3',
            type: 'text' as const,
            content: 'SQuAD正确率测试：F1=89.5，EM=82.3',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
          {
            id: '4',
            type: 'text' as const,
            content: '推理资源利用率测试：GPU显存占用85%，计算单元92%',
            evaluationDimension: '性能',
            difficulty: 'medium' as const,
          },
          {
            id: '5',
            type: 'text' as const,
            content: '批量推理性能测试：batch_size=32，吞吐率提升3.2倍',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
        ];
      }

      if (dataset.taskType === 'matrix-computation') {
        return [
          {
            id: '1',
            type: 'matrix' as const,
            content: '稠密矩阵乘法：10000×10000，计算吞吐率850 GFLOPS',
            evaluationDimension: '性能',
            difficulty: 'easy' as const,
          },
          {
            id: '2',
            type: 'matrix' as const,
            content: '稀疏矩阵运算：非零元素占比5%，内存带宽利用率78%',
            evaluationDimension: '性能',
            difficulty: 'medium' as const,
          },
          {
            id: '3',
            type: 'matrix' as const,
            content: 'LU分解：5000×5000矩阵，计算时间125ms',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
          {
            id: '4',
            type: 'matrix' as const,
            content: 'SVD分解：3000×3000矩阵，并行扩展性92%',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
          {
            id: '5',
            type: 'matrix' as const,
            content: '张量并行计算：4卡并行，加速比3.8倍',
            evaluationDimension: '性能',
            difficulty: 'hard' as const,
          },
        ];
      }

      return baseSamples;
    }, [dataset.taskType, dataset.evaluationDimension]);

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Tag color={dataset.source === 'open-source' ? 'blue' : 'green'}>
              {DATASET_SOURCE_LABELS[dataset.source]}
            </Tag>
            <Tag color="purple">{dataset.version}</Tag>
            <Tag color="orange">{dataset.sampleCount.toLocaleString()} rows</Tag>
          </Space>
        </div>

        <Card title="Data Preview (First 100 rows)" style={{ marginTop: '16px' }}>
          <Table
            dataSource={previewData.slice(0, 100)}
            columns={Object.keys(previewData[0] || {}).map(key => ({
              title: key,
              dataIndex: key,
              key,
              ellipsis: true,
              width: key === 'id' ? 80 : undefined,
            }))}
            pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            scroll={{ x: 'max-content', y: 400 }}
            size="small"
          />
        </Card>

        <Card title="样本预览" style={{ marginTop: '24px' }}>
          <Alert
            message="随机抽取展示5-10条典型数据"
            description="根据数据类型动态渲染：文本/代码（代码高亮）、图像（缩略图）、矩阵/数值（表格或热力图）"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Row gutter={[16, 16]}>
            {mockSamples.map((sample) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={sample.id}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <Text>样本 #{sample.id}</Text>
                      <Tag color="blue">{sample.evaluationDimension}</Tag>
                      <Tag 
                        color={
                          sample.difficulty === 'easy' ? 'green' : 
                          sample.difficulty === 'medium' ? 'orange' : 'red'
                        }
                      >
                        {sample.difficulty === 'easy' ? '简单' : 
                         sample.difficulty === 'medium' ? '中等' : '困难'}
                      </Tag>
                    </Space>
                  }
                >
                  {sample.type === 'text' && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      maxHeight: '100px',
                      overflow: 'auto'
                    }}>
                      {sample.content}
                    </div>
                  )}
                  {sample.type === 'code' && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#1e1e1e', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#d4d4d4',
                      fontFamily: 'monospace',
                      maxHeight: '120px',
                      overflow: 'auto'
                    }}>
                      <pre style={{ margin: 0 }}>{sample.content}</pre>
                    </div>
                  )}
                  {sample.type === 'matrix' && (
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}>
                      <pre style={{ margin: 0 }}>{sample.content}</pre>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  };

  const renderCompareModal = () => {
    if (!selectedVersions[0] || !selectedVersions[1]) return null;

    const version1 = dataset.versions.find(v => v.version === selectedVersions[0]);
    const version2 = dataset.versions.find(v => v.version === selectedVersions[1]);

    return (
      <Modal
        title={`版本对比: ${selectedVersions[0]} vs ${selectedVersions[1]}`}
        open={compareModalVisible}
        onCancel={() => setCompareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCompareModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label={`${selectedVersions[0]} 更新时间`}>
            {version1 ? new Date(version1.createdAt).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={`${selectedVersions[1]} 更新时间`}>
            {version2 ? new Date(version2.createdAt).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={`${selectedVersions[0]} 变更内容`} span={2}>
            {version1 ? version1.changes.join(', ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={`${selectedVersions[1]} 变更内容`} span={2}>
            {version2 ? version2.changes.join(', ') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    );
  };

  return (
    <>
      <Modal
        title={`${dataset.name} - 数据集详情`}
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="close" onClick={onClose}>
            关闭
          </Button>,
        ]}
        width="90%"
        style={{ top: '5vh', maxWidth: '1400px' }}
        styles={{
          body: {
            maxHeight: 'calc(90vh - 150px)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: (
                <span>
                  <DatabaseOutlined />
                  概览与元数据
                </span>
              ),
              children: renderOverviewTab(),
            },
            {
              key: 'distribution',
              label: (
                <span>
                  <DatabaseOutlined />
                  数据分布分析
                </span>
              ),
              children: renderDistributionTab(),
            },
            {
              key: 'version',
              label: (
                <span>
                  <ClockCircleOutlined />
                  版本管理
                </span>
              ),
              children: renderVersionTab(),
            },
            {
              key: 'preview',
              label: (
                <span>
                  <EyeOutlined />
                  样本预览
                </span>
              ),
              children: renderSamplePreviewTab(),
            },
          ]}
        />
      </Modal>

      {visible && renderCompareModal()}

      <Modal
        title="确认回滚"
        open={rollbackModalVisible}
        onOk={confirmRollback}
        onCancel={() => setRollbackModalVisible(false)}
        destroyOnClose
      >
        <Alert
          message="确认要回滚到该版本吗？"
          description={`此操作将把数据集回滚到版本 ${selectedVersionForRollback}，此操作不可撤销。`}
          type="warning"
          showIcon
        />
      </Modal>
    </>
  );
};

export default DatasetDetailDashboard;