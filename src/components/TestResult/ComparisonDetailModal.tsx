import React, { useEffect, useRef, useState } from 'react';
import { Modal, Tabs, Card, Row, Col, Tag, Space, Button, Statistic, Table, Typography, Empty, message, Dropdown, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { 
  CloseOutlined, 
  SwapOutlined, 
  TrophyOutlined,
  CopyOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  StarOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { ComparisonResult } from '../../mockData/comparisonResultMock';

const { Text, Paragraph, Title } = Typography;

interface ComparisonDetailModalProps {
  visible: boolean;
  comparisonResult: ComparisonResult | null;
  onClose: () => void;
}

const modelColors = ['#1890ff', '#52c41a', '#faad14', '#eb2f96'];

export const ComparisonDetailModal: React.FC<ComparisonDetailModalProps> = ({ visible, comparisonResult, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const radarChartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!radarChartRef.current || !comparisonResult || comparisonResult.models.length < 2) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(radarChartRef.current);
    chartInstance.current = chart;

    const dimensions = ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'];
    const dimensionKeys = ['languageUnderstanding', 'logicReasoning', 'textGeneration', 'knowledgeQA', 'codeAbility', 'multilingualAbility'];

    const series = comparisonResult.models.map((model, index) => ({
      name: model.name,
      type: 'radar',
      data: [{
        value: dimensionKeys.map(key => model.scores[key as keyof typeof model.scores]),
        name: model.name,
        itemStyle: {
          color: modelColors[index % modelColors.length],
        },
        areaStyle: {
          color: modelColors[index % modelColors.length],
          opacity: 0.2,
        },
        lineStyle: {
          color: modelColors[index % modelColors.length],
          width: 2,
        },
      }],
    }));

    chart.setOption({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: comparisonResult.models.map(m => m.name),
        bottom: 0,
        textStyle: {
          color: '#fff',
        },
      },
      radar: {
        indicator: dimensions.map(d => ({ name: d, max: 100 })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#999',
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
      series,
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [comparisonResult, activeTab]);

  const handleExport = (format: string) => {
    message.success(`正在导出${format}格式报告...`);
  };

  const handleShare = () => {
    message.success('分享链接已复制到剪贴板');
  };

  const getSubTaskScore = (model: any, subTask: string) => {
    const subTaskMap: Record<string, keyof any> = {
      '阅读理解': 'readingComprehension',
      '语义分析': 'semanticAnalysis',
      '上下文理解': 'contextUnderstanding',
      '数学推理': 'mathReasoning',
      '因果推断': 'causalInference',
      '演绎推理': 'deductiveReasoning',
      '摘要生成': 'summarization',
      '创意写作': 'creativeWriting',
      '专业领域 QA': 'professionalQA',
      '通用知识 QA': 'generalQA',
      '代码生成': 'codeGeneration',
      '代码调试': 'codeDebugging',
      '代码解释': 'codeExplanation',
      '代码优化': 'codeOptimization',
      '中文理解': 'chineseUnderstanding',
      '英文理解': 'englishUnderstanding',
    };

    const key = subTaskMap[subTask];
    if (!key || !model.subTaskScores) return undefined;

    for (const category of Object.values(model.subTaskScores) as any[]) {
      if (key in category) {
        return category[key];
      }
    }
    return undefined;
  };

  const dimensionSubTaskConfig = [
    {
      dimension: '综合得分',
      scoreKey: 'overall',
      subTasks: [],
    },
    {
      dimension: '语言理解能力',
      scoreKey: 'languageUnderstanding',
      subTasks: [
        { name: '阅读理解', metric: 'EM' },
        { name: '语义分析', metric: 'F1' },
        { name: '上下文理解', metric: 'Acc' },
      ],
    },
    {
      dimension: '逻辑推理能力',
      scoreKey: 'logicReasoning',
      subTasks: [
        { name: '数学推理', metric: 'Acc' },
        { name: '因果推断', metric: 'Acc' },
        { name: '演绎推理', metric: 'Acc' },
      ],
    },
    {
      dimension: '文本生成能力',
      scoreKey: 'textGeneration',
      subTasks: [
        { name: '摘要生成', metric: 'ROUGE-L' },
        { name: '创意写作', metric: 'Human Pref.' },
      ],
    },
    {
      dimension: '知识问答能力',
      scoreKey: 'knowledgeQA',
      subTasks: [
        { name: '专业领域 QA', metric: 'Acc' },
        { name: '通用知识 QA', metric: 'Acc' },
      ],
    },
    {
      dimension: '代码能力',
      scoreKey: 'codeAbility',
      subTasks: [
        { name: '代码生成', metric: 'Pass@1' },
        { name: '代码调试', metric: 'Fix@1' },
        { name: '代码解释', metric: 'Explain@1' },
        { name: '代码优化', metric: 'Speedup@1' },
      ],
    },
    {
      dimension: '多语言能力',
      scoreKey: 'multilingualAbility',
      subTasks: [
        { name: '中文理解', metric: 'EM' },
        { name: '英文理解', metric: 'EM' },
      ],
    },
  ];

  const generateMergedData = () => {
    const data: any[] = [];
    
    dimensionSubTaskConfig.forEach((config, dimIndex) => {
      const dimensionScores: Record<string, number> = {};
      comparisonResult?.models.forEach(model => {
        dimensionScores[model.id] = model.scores[config.scoreKey as keyof typeof model.scores] || 0;
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
        comparisonResult?.models.forEach(model => {
          subTaskScores[model.id] = getSubTaskScore(model, subTask.name);
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

  const mergedColumns: ColumnsType<any> = [
    {
      title: '维度 / 子任务',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 180,
      fixed: 'left',
      render: (text: string, record: any) => {
        if (record.isDimension) {
          return (
            <span style={{ fontWeight: 'bold', color: '#1890ff', fontSize: 14 }}>
              {text}
            </span>
          );
        }
        return (
          <span style={{ color: '#d9d9d9', paddingLeft: 8 }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '指标',
      dataIndex: 'metric',
      key: 'metric',
      width: 100,
      render: (text: string, record: any) => {
        if (record.isDimension) {
          return <span style={{ color: '#666' }}>-</span>;
        }
        return <Tag color="blue" style={{ fontSize: 11 }}>{text}</Tag>;
      },
    },
    ...(comparisonResult?.models.map((model, index) => ({
      title: (
        <Space>
          <span style={{ color: modelColors[index % modelColors.length] }}>●</span>
          <span>{model.name}</span>
        </Space>
      ),
      dataIndex: model.id,
      key: model.id,
      width: 120,
      render: (value: any, record: any) => {
        if (record.isDimension) {
          const score = value as number;
          const allScores = comparisonResult?.models.map(m => 
            m.scores[dimensionSubTaskConfig.find(d => d.dimension === record.dimension.replace('  └─ ', ''))?.scoreKey as keyof typeof m.scores] || 0
          ) || [];
          const max = Math.max(...allScores);
          const min = Math.min(...allScores);

          let cellStyle: any = { fontWeight: 'bold', fontSize: 14 };
          if (score === max) {
            cellStyle = { ...cellStyle, backgroundColor: 'rgba(82, 196, 26, 0.2)', color: '#52c41a' };
          } else if (score === min) {
            cellStyle = { ...cellStyle, backgroundColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f' };
          }

          return <span style={cellStyle}>{score?.toFixed(1)}</span>;
        }

        if (!value || value.score === 0) return <span style={{ color: '#666' }}>-</span>;

        const subTaskName = record.dimension.replace('  └─ ', '');
        const allScores = comparisonResult?.models
          .map(m => {
            const subTaskData = getSubTaskScore(m, subTaskName);
            return subTaskData?.score || 0;
          }) || [];
        const max = Math.max(...allScores);
        const min = Math.min(...allScores.filter(s => s > 0));

        let cellStyle: any = {};
        if (value.score === max) {
          cellStyle = { backgroundColor: 'rgba(82, 196, 26, 0.2)', color: '#52c41a', fontWeight: 'bold' };
        }
        if (value.score === min && min > 0) {
          cellStyle = { backgroundColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f' };
        }

        return <span style={cellStyle}>{value.score.toFixed(1)}</span>;
      },
    })) || []),
  ];

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: comparisonResult ? (
        <div>
          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
              marginBottom: 16,
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>对比名称</Text>
                    <Title level={4} style={{ color: '#fff', margin: '8px 0' }}>
                      {comparisonResult.name}
                    </Title>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>描述</Text>
                    <Paragraph style={{ color: '#aaa', margin: '8px 0' }}>
                      {comparisonResult.description}
                    </Paragraph>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>核心结论</Text>
                    <div style={{ 
                      background: 'rgba(24, 144, 255, 0.1)', 
                      padding: 12, 
                      borderRadius: 8,
                      marginTop: 8,
                    }}>
                      <Text style={{ color: '#1890ff' }}>
                        {comparisonResult.overallAnalysis.summary}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col span={12}>
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic 
                      title="模型数量" 
                      value={comparisonResult.models.length} 
                      styles={{ content: { color: '#1890ff' } }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="维度数量" 
                      value={6} 
                      styles={{ content: { color: '#52c41a' } }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic 
                      title="版本" 
                      value={comparisonResult.version} 
                      styles={{ content: { color: '#faad14' } }}
                    />
                  </Col>
                </Row>
                <Divider style={{ borderColor: '#303030' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>参与模型</Text>
                  <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size={8}>
                    {comparisonResult.models.map((model, index) => (
                      <div key={model.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#141414',
                        borderRadius: 4,
                      }}>
                        <Space>
                          <span style={{ color: modelColors[index % modelColors.length], fontSize: 16 }}>●</span>
                          <Text style={{ color: '#fff' }}>{model.name}</Text>
                        </Space>
                        <Tag color={model.id === comparisonResult.overallAnalysis.bestModel ? 'green' : 'default'}>
                          {model.id === comparisonResult.overallAnalysis.bestModel ? '最佳' : '一般'}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
            }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>元数据</span>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>创建人</Text>
                  <div style={{ color: '#fff', marginTop: 4 }}>{comparisonResult.createdBy}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>创建时间</Text>
                  <div style={{ color: '#fff', marginTop: 4 }}>{comparisonResult.createdAt}</div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>分类</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">{comparisonResult.category}</Tag>
                  </div>
                </div>
              </Col>
            </Row>
            <Divider style={{ borderColor: '#303030', margin: '16px 0' }} />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>标签</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {comparisonResult.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </div>
      ) : <Empty />,
    },
    {
      key: 'detailed',
      label: '详细对比',
      children: comparisonResult ? (
        <div>
          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
              marginBottom: 16,
            }}
            title={
              <Space>
                <SwapOutlined style={{ color: '#1890ff' }} />
                <span>沉浸式对比工作台</span>
                <Tag color="blue">{comparisonResult.models.length} 个模型</Tag>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {comparisonResult.models.map((model, index) => (
                <Col xs={24} sm={12} md={6} key={model.id}>
                  <Card 
                    size="small"
                    style={{ 
                      background: '#141414', 
                      border: `2px solid ${modelColors[index % modelColors.length]}`,
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <span style={{ color: modelColors[index % modelColors.length], fontSize: 20 }}>●</span>
                        <span style={{ fontWeight: 'bold', fontSize: 16, color: '#fff' }}>{model.name}</span>
                      </Space>
                      <Tag>{model.organization}</Tag>
                      <Tag color="blue">{model.params}</Tag>
                      <Statistic 
                        title="综合得分" 
                        value={model.scores.overall} 
                        suffix="/ 100"
                        valueStyle={{ color: modelColors[index % modelColors.length] }}
                      />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>

          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
              marginBottom: 16,
            }}
            title="能力雷达图对比"
          >
            <div ref={radarChartRef} style={{ width: '100%', height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }} />
          </Card>

          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
            }}
            title={
              <Space>
                <TrophyOutlined style={{ color: '#ffd700' }} />
                <span>详细指标对比</span>
                <Tag color="green">绿色 = 最佳值</Tag>
                <Tag color="red">红色 = 最差值</Tag>
              </Space>
            }
          >
            <Table
              dataSource={generateMergedData()}
              columns={mergedColumns}
              pagination={false}
              scroll={{ x: 1000 }}
              size="small"
              rowKey="key"
            />
          </Card>
        </div>
      ) : <Empty />,
    },
    {
      key: 'advantage',
      label: '优势分析',
      children: comparisonResult ? (
        <div>
          <Row gutter={[16, 16]}>
            {comparisonResult.advantageAnalysis.map((analysis, index) => (
              <Col xs={24} lg={12} key={analysis.modelName}>
                <Card 
                  style={{ 
                    background: '#1f1f1f', 
                    border: '1px solid #303030',
                    height: '100%',
                  }}
                  title={
                    <Space>
                      <span style={{ color: modelColors[index % modelColors.length] }}>●</span>
                      <span style={{ color: '#fff' }}>{analysis.modelName}</span>
                      <Tag color="green">匹配度 {analysis.matchScore}%</Tag>
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>优势</Text>
                      </div>
                      <Space wrap>
                        {analysis.advantages.map((adv, i) => (
                          <Tag key={i} color="green">{adv}</Tag>
                        ))}
                      </Space>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <WarningOutlined style={{ color: '#faad14' }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>劣势</Text>
                      </div>
                      <Space wrap>
                        {analysis.disadvantages.map((dis, i) => (
                          <Tag key={i} color="orange">{dis}</Tag>
                        ))}
                      </Space>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <ThunderboltOutlined style={{ color: '#1890ff' }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>推荐场景</Text>
                      </div>
                      <Space wrap>
                        {analysis.recommendedScenarios.map((scenario, i) => (
                          <Tag key={i} color="blue">{scenario}</Tag>
                        ))}
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ) : <Empty />,
    },
  ];

  const getMoreMenuItems = (): MenuProps => ({
    items: [
      {
        key: 'export-pdf',
        icon: <DownloadOutlined />,
        label: '导出PDF',
        onClick: () => handleExport('PDF'),
      },
      {
        key: 'export-excel',
        icon: <DownloadOutlined />,
        label: '导出Excel',
        onClick: () => handleExport('Excel'),
      },
      {
        key: 'export-image',
        icon: <DownloadOutlined />,
        label: '导出图片',
        onClick: () => handleExport('图片'),
      },
      {
        type: 'divider',
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享',
        onClick: handleShare,
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '创建副本',
        onClick: () => message.info('已创建副本'),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确认删除',
            content: '确定要删除此对比吗？',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => {
              message.success('对比已删除');
              onClose();
            },
          });
        },
      },
    ],
  });

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      style={{ top: 20 }}
      bodyStyle={{ 
        background: '#1f1f1f', 
        padding: 0,
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ 
        padding: '16px 24px',
        borderBottom: '1px solid #303030',
        marginBottom: 16,
      }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                {comparisonResult?.name || '对比详情'}
              </Text>
              {comparisonResult?.isPublic && (
                <Tag color="green">公开</Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<StarOutlined />}>
                收藏
              </Button>
              <Dropdown menu={getMoreMenuItems()} trigger={['click']}>
                <Button icon={<MoreOutlined />}>
                  更多
                </Button>
              </Dropdown>
              <Button icon={<CloseOutlined />} onClick={onClose}>
                关闭
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        items={tabItems}
        style={{ 
          padding: '0 24px',
        }}
      />
    </Modal>
  );
};

export default ComparisonDetailModal;
