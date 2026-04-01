import React, { useMemo } from 'react';
import { Modal, Row, Col, Card, Typography, Tag, Table, Space, Statistic, Divider, Progress, Descriptions, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { 
  TrophyOutlined, 
  FallOutlined, 
  DashboardOutlined,
} from '@ant-design/icons';
import type { AcceleratorComparisonResult } from '../../mockData/acceleratorMock';

const { Text, Paragraph } = Typography;

interface AcceleratorComparisonDetailModalProps {
  visible: boolean;
  comparisonResult: AcceleratorComparisonResult | null;
  onClose: () => void;
}

const dimensionSubTaskConfig = [
  {
    dimension: '综合得分',
    scoreKey: 'overall',
    subTasks: [],
  },
  {
    dimension: '计算性能',
    scoreKey: 'computePerformance',
    subTasks: [
      { name: 'FP32性能', metric: 'TFLOPS' },
      { name: 'FP16性能', metric: 'TFLOPS' },
      { name: 'INT8性能', metric: 'TOPS' },
      { name: '矩阵乘法', metric: 'TFLOPS' },
    ],
  },
  {
    dimension: '内存性能',
    scoreKey: 'memoryPerformance',
    subTasks: [
      { name: '内存带宽', metric: 'GB/s' },
      { name: '内存延迟', metric: 'ns' },
      { name: 'HBM容量', metric: 'GB' },
    ],
  },
  {
    dimension: '推理速度',
    scoreKey: 'inferenceSpeed',
    subTasks: [
      { name: 'BERT推理', metric: 'ms' },
      { name: 'GPT推理', metric: 'ms' },
      { name: 'ResNet推理', metric: 'ms' },
      { name: '批量吞吐', metric: 'samples/s' },
    ],
  },
  {
    dimension: '训练速度',
    scoreKey: 'trainingSpeed',
    subTasks: [
      { name: 'BERT训练', metric: 'samples/s' },
      { name: 'GPT训练', metric: 'tokens/s' },
      { name: 'ResNet训练', metric: 'images/s' },
      { name: '分布式扩展', metric: 'efficiency' },
    ],
  },
  {
    dimension: '能效',
    scoreKey: 'energyEfficiency',
    subTasks: [
      { name: '功耗', metric: 'W' },
      { name: '性能功耗比', metric: 'TFLOPS/W' },
      { name: '热设计', metric: '°C' },
    ],
  },
  {
    dimension: '性价比',
    scoreKey: 'costEfficiency',
    subTasks: [
      { name: '价格性能比', metric: 'ratio' },
      { name: 'TCO估算', metric: 'USD/year' },
      { name: 'ROI得分', metric: 'score' },
    ],
  },
];

const getSubTaskScore = (card: any, subTaskName: string): number | string => {
  const subTaskMapping: Record<string, string[]> = {
    'FP32性能': ['subTaskScores', 'computePerformance', 'fp32Performance'],
    'FP16性能': ['subTaskScores', 'computePerformance', 'fp16Performance'],
    'INT8性能': ['subTaskScores', 'computePerformance', 'int8Performance'],
    '矩阵乘法': ['subTaskScores', 'computePerformance', 'matrixMultiplication'],
    '内存带宽': ['subTaskScores', 'memoryPerformance', 'memoryBandwidth'],
    '内存延迟': ['subTaskScores', 'memoryPerformance', 'memoryLatency'],
    'HBM容量': ['subTaskScores', 'memoryPerformance', 'hbmCapacity'],
    'BERT推理': ['subTaskScores', 'inferenceSpeed', 'bertInference'],
    'GPT推理': ['subTaskScores', 'inferenceSpeed', 'gptInference'],
    'ResNet推理': ['subTaskScores', 'inferenceSpeed', 'resnetInference'],
    '批量吞吐': ['subTaskScores', 'inferenceSpeed', 'batchThroughput'],
    'BERT训练': ['subTaskScores', 'trainingSpeed', 'bertTraining'],
    'GPT训练': ['subTaskScores', 'trainingSpeed', 'gptTraining'],
    'ResNet训练': ['subTaskScores', 'trainingSpeed', 'resnetTraining'],
    '分布式扩展': ['subTaskScores', 'trainingSpeed', 'distributedScaling'],
    '功耗': ['subTaskScores', 'energyEfficiency', 'powerConsumption'],
    '性能功耗比': ['subTaskScores', 'energyEfficiency', 'performancePerWatt'],
    '热设计': ['subTaskScores', 'energyEfficiency', 'thermalDesign'],
    '价格性能比': ['subTaskScores', 'costEfficiency', 'pricePerfRatio'],
    'TCO估算': ['subTaskScores', 'costEfficiency', 'tcoEstimate'],
    'ROI得分': ['subTaskScores', 'costEfficiency', 'roiScore'],
  };

  const path = subTaskMapping[subTaskName];
  if (path && card) {
    let value: any = card;
    for (const key of path) {
      value = value?.[key];
    }
    return value?.score ?? '-';
  }
  return '-';
};

export const AcceleratorComparisonDetailModal: React.FC<AcceleratorComparisonDetailModalProps> = ({
  visible,
  comparisonResult,
  onClose,
}) => {
  const mergedColumns = useMemo(() => {
    if (!comparisonResult) return [];
    
    const cols: any[] = [
      {
        title: '维度 / 子任务',
        dataIndex: 'dimension',
        key: 'dimension',
        width: 180,
        render: (text: string, record: any) => {
          if (record.isDimension) {
            return <Text strong style={{ color: '#1890ff' }}>{text}</Text>;
          }
          return <Text type="secondary">{text}</Text>;
        },
      },
      {
        title: '指标',
        dataIndex: 'metric',
        key: 'metric',
        width: 100,
        render: (text: string) => <Tag>{text}</Tag>,
      },
    ];

    comparisonResult.cards.forEach((card) => {
      cols.push({
        title: card.name,
        dataIndex: card.id,
        key: card.id,
        width: 120,
        render: (value: number | string, record: any) => {
          if (record.isDimension) {
            const numValue = typeof value === 'number' ? value : 0;
            const color = numValue >= 90 ? '#52c41a' : numValue >= 80 ? '#1890ff' : numValue >= 70 ? '#faad14' : '#ff4d4f';
            return <Text strong style={{ color }}>{value}</Text>;
          }
          return <Text>{value}</Text>;
        },
      });
    });

    return cols;
  }, [comparisonResult]);

  const generateMergedData = () => {
    if (!comparisonResult) return [];
    
    const data: any[] = [];

    dimensionSubTaskConfig.forEach((config, dimIndex) => {
      const dimensionScores: Record<string, number> = {};
      comparisonResult.cards.forEach(card => {
        dimensionScores[card.id] = card.scores[config.scoreKey as keyof typeof card.scores] || 0;
      });

      data.push({
        key: `dim-${dimIndex}`,
        dimension: config.dimension,
        metric: '-',
        isDimension: true,
        ...dimensionScores,
      });

      config.subTasks.forEach((subTask, subIndex) => {
        const subTaskScores: Record<string, any> = {};
        comparisonResult.cards.forEach(card => {
          subTaskScores[card.id] = getSubTaskScore(card, subTask.name);
        });

        data.push({
          key: `sub-${dimIndex}-${subIndex}`,
          dimension: `  └─ ${subTask.name}`,
          metric: subTask.metric,
          isDimension: false,
          ...subTaskScores,
        });
      });
    });

    return data;
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: '对比概览',
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Card size="small" style={{ background: '#1f1f1f', marginBottom: 16 }}>
              <Descriptions column={3}>
                <Descriptions.Item label="对比名称">{comparisonResult?.name}</Descriptions.Item>
                <Descriptions.Item label="创建者">{comparisonResult?.createdBy}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{comparisonResult?.createdAt}</Descriptions.Item>
                <Descriptions.Item label="分类">
                  <Tag color="blue">{comparisonResult?.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="可见性">
                  {comparisonResult?.isPublic ? <Tag color="purple">公开</Tag> : <Tag>私有</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="版本">v{comparisonResult?.version}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title="综合分析" style={{ background: '#1f1f1f', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="最优加速卡"
                    value={comparisonResult?.overallAnalysis.bestCard || '-'}
                    prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="相对较弱"
                    value={comparisonResult?.overallAnalysis.worstCard || '-'}
                    prefix={<FallOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="参与加速卡数量"
                    value={comparisonResult?.cards.length || 0}
                    suffix="张"
                  />
                </Col>
              </Row>
              <Divider />
              <Paragraph style={{ color: '#8c8c8c' }}>
                {comparisonResult?.overallAnalysis.summary}
              </Paragraph>
            </Card>
          </Col>

          <Col span={24}>
            <Card size="small" title="参与加速卡" style={{ background: '#1f1f1f' }}>
              <Row gutter={[16, 16]}>
                {comparisonResult?.cards.map((card) => (
                  <Col span={8} key={card.id}>
                    <Card size="small" style={{ background: '#262626' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong style={{ color: '#fff' }}>{card.name}</Text>
                          <Tag>{card.vendor}</Tag>
                        </div>
                        <Progress 
                          percent={card.scores.overall} 
                          size="small"
                          strokeColor={card.scores.overall >= 90 ? '#52c41a' : '#1890ff'}
                        />
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 11 }}>显存: {card.specs.memory}GB</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>|</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>功耗: {card.specs.tdp}W</Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'dimensions',
      label: '详细指标对比',
      children: (
        <Card size="small" style={{ background: '#1f1f1f' }}>
          <Table
            dataSource={generateMergedData()}
            columns={mergedColumns}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => record.isDimension ? 'dimension-row' : 'subtask-row'}
          />
        </Card>
      ),
    },
    {
      key: 'advantages',
      label: '优势分析',
      children: (
        <Row gutter={16}>
          {comparisonResult?.advantageAnalysis.map((analysis) => (
            <Col span={12} key={analysis.cardName}>
              <Card 
                size="small" 
                title={analysis.cardName}
                style={{ background: '#1f1f1f', marginBottom: 16 }}
                extra={<Progress type="circle" percent={analysis.matchScore} size={40} />}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">优势：</Text>
                    <div style={{ marginTop: 4 }}>
                      {analysis.advantages.map((adv, idx) => (
                        <Tag key={idx} color="green" style={{ marginBottom: 4 }}>{adv}</Tag>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">劣势：</Text>
                    <div style={{ marginTop: 4 }}>
                      {analysis.disadvantages.map((dis, idx) => (
                        <Tag key={idx} color="red" style={{ marginBottom: 4 }}>{dis}</Tag>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">推荐场景：</Text>
                    <div style={{ marginTop: 4 }}>
                      {analysis.recommendedScenarios.map((scene, idx) => (
                        <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>{scene}</Tag>
                      ))}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      title={
        <Space>
          <DashboardOutlined style={{ color: '#1890ff' }} />
          <span>对比分析详情</span>
        </Space>
      }
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default AcceleratorComparisonDetailModal;
