import React, { useEffect, useRef, useState } from 'react';
import { Modal, Tabs, Card, Row, Col, Statistic, Tag, Space, Progress, Table, Alert, Descriptions, Empty, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  TrophyOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  BulbOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { TestModel, ModelVersion, TaskAdaptation, RelatedTask } from '../../mockData/testResultMock';
import { domainOptions } from '../../mockData/testResultMock';

interface TestReportModalProps {
  visible: boolean;
  model: TestModel | null;
  onClose: () => void;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({ visible, model, onClose }) => {
  const radarChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const radarChartInstance = useRef<echarts.ECharts | null>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const [selectedTask, setSelectedTask] = useState<RelatedTask | null>(null);
  const [taskReportVisible, setTaskReportVisible] = useState(false);

  useEffect(() => {
    if (!radarChartRef.current || !model || model.scores.overall === 0) return;

    if (radarChartInstance.current) {
      radarChartInstance.current.dispose();
    }
    
    const radarChart = echarts.init(radarChartRef.current);
    radarChartInstance.current = radarChart;
    
    const dimensions = ['语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'];
    const dimensionKeys: (keyof typeof model.scores)[] = ['languageUnderstanding', 'logicReasoning', 'textGeneration', 'knowledgeQA', 'codeAbility', 'multilingualAbility'];
    
    const values = dimensionKeys.map(key => model.scores[key]);

    radarChart.setOption({
      tooltip: {
        trigger: 'item',
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
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: model.name,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.3)',
          },
          lineStyle: {
            color: '#1890ff',
            width: 2,
          },
        }],
      }],
    });

    const handleRadarResize = () => {
      radarChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleRadarResize);

    return () => {
      window.removeEventListener('resize', handleRadarResize);
      radarChartInstance.current?.dispose();
    };
  }, [model]);

  useEffect(() => {
    if (!trendChartRef.current || !model?.versionHistory || model.versionHistory.length === 0) return;

    if (trendChartInstance.current) {
      trendChartInstance.current.dispose();
    }
    
    const trendChart = echarts.init(trendChartRef.current);
    trendChartInstance.current = trendChart;
    
    const versions = model.versionHistory.map(v => v.version);
    const overallScores = model.versionHistory.map(v => v.scores.overall);

    trendChart.setOption({
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: versions,
        axisLine: { lineStyle: { color: '#666' } },
        axisLabel: { color: '#999' },
      },
      yAxis: {
        type: 'value',
        min: 60,
        max: 100,
        axisLine: { lineStyle: { color: '#666' } },
        axisLabel: { color: '#999' },
        splitLine: { lineStyle: { color: '#303030' } },
      },
      series: [{
        type: 'line',
        data: overallScores,
        smooth: true,
        itemStyle: {
          color: '#52c41a',
        },
        lineStyle: {
          color: '#52c41a',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0)' },
            ],
          },
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高' },
            { type: 'min', name: '最低' },
          ],
        },
      }],
    });

    const handleTrendResize = () => {
      trendChartInstance.current?.resize();
    };

    window.addEventListener('resize', handleTrendResize);

    return () => {
      window.removeEventListener('resize', handleTrendResize);
      trendChartInstance.current?.dispose();
    };
  }, [model]);

  const handleViewTaskReport = (task: RelatedTask) => {
    setSelectedTask(task);
    setTaskReportVisible(true);
  };

  if (!model) return null;

  const capabilityColumns: ColumnsType<{ name: string; score: number }> = [
    {
      title: '能力维度',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Space>
          <Progress 
            percent={score} 
            size="small" 
            style={{ width: 100 }}
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
          />
          <span style={{ 
            color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {score.toFixed(1)}
          </span>
        </Space>
      ),
    },
    {
      title: '评级',
      dataIndex: 'score',
      key: 'level',
      width: 80,
      render: (score: number) => {
        if (score >= 90) return <Tag color="gold">优秀</Tag>;
        if (score >= 80) return <Tag color="green">良好</Tag>;
        if (score >= 60) return <Tag color="orange">及格</Tag>;
        return <Tag color="red">待提升</Tag>;
      },
    },
  ];

  const capabilityData = [
    { name: '语言理解', score: model.scores.languageUnderstanding },
    { name: '逻辑推理', score: model.scores.logicReasoning },
    { name: '文本生成', score: model.scores.textGeneration },
    { name: '知识问答', score: model.scores.knowledgeQA },
    { name: '代码能力', score: model.scores.codeAbility },
    { name: '多语言能力', score: model.scores.multilingualAbility },
  ];

  const taskAdaptationColumns: ColumnsType<TaskAdaptation> = [
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
    },
    {
      title: '适配得分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number) => (
        <span style={{ 
          color: score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : score >= 60 ? '#faad14' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {score.toFixed(1)}
        </span>
      ),
    },
    {
      title: '评级',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: string) => {
        const colors: Record<string, string> = {
          excellent: 'gold',
          good: 'green',
          fair: 'orange',
          poor: 'red',
        };
        const labels: Record<string, string> = {
          excellent: '优秀',
          good: '良好',
          fair: '一般',
          poor: '较差',
        };
        return <Tag color={colors[rank]}>{labels[rank]}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '应用场景',
      dataIndex: 'useCases',
      key: 'useCases',
      width: 200,
      render: (useCases: string[]) => (
        <Space size={[2, 4]} wrap>
          {useCases.slice(0, 2).map(uc => (
            <Tag key={uc} color="cyan">{uc}</Tag>
          ))}
          {useCases.length > 2 && <Tag>+{useCases.length - 2}</Tag>}
        </Space>
      ),
    },
  ];

  const relatedTaskColumns: ColumnsType<RelatedTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewTaskReport(record)} style={{ padding: 0 }}>
          {text}
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          completed: 'green',
          running: 'blue',
          pending: 'orange',
          failed: 'red',
        };
        const labels: Record<string, string> = {
          completed: '已完成',
          running: '运行中',
          pending: '待执行',
          failed: '失败',
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 150,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-',
    },
    {
      title: '测试能力',
      dataIndex: 'capabilities',
      key: 'capabilities',
      width: 200,
      render: (capabilities: string[]) => (
        <Space size={[2, 4]} wrap>
          {capabilities.slice(0, 3).map(cap => (
            <Tag key={cap} color="purple">{cap}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '得分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 80,
      render: (score: number) => score ? (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{score.toFixed(1)}</span>
      ) : '-',
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: string) => duration || '-',
    },
  ];

  const versionColumns: ColumnsType<ModelVersion> = [
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: '发布日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '综合得分',
      dataIndex: 'scores',
      key: 'overall',
      width: 100,
      render: (scores: ModelVersion['scores']) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {scores.overall.toFixed(1)}
        </span>
      ),
    },
    {
      title: '更新说明',
      dataIndex: 'changes',
      key: 'changes',
    },
  ];

  const tabItems = [
    {
      key: 'analysis',
      label: (
        <Space>
          <LineChartOutlined />
          <span>单模型分析</span>
        </Space>
      ),
      children: (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Card 
                title="能力雷达图" 
                style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
              >
                <div ref={radarChartRef} style={{ width: '100%', height: 300 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title="能力得分详情" 
                style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
              >
                <Table
                  dataSource={capabilityData}
                  columns={capabilityColumns}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Card 
                title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} />长处</Space>}
                style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
              >
                {model.strengths && model.strengths.length > 0 ? (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {model.strengths.map((s, i) => (
                      <li key={i} style={{ color: '#52c41a', marginBottom: 8 }}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title={<Space><WarningOutlined style={{ color: '#faad14' }} />短板</Space>}
                style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
              >
                {model.weaknesses && model.weaknesses.length > 0 ? (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {model.weaknesses.map((w, i) => (
                      <li key={i} style={{ color: '#faad14', marginBottom: 8 }}>{w}</li>
                    ))}
                  </ul>
                ) : (
                  <Alert message="无明显短板" type="success" showIcon />
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title={<Space><ThunderboltOutlined style={{ color: '#ff4d4f' }} />性能瓶颈</Space>}
                style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
              >
                {model.bottlenecks && model.bottlenecks.length > 0 ? (
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {model.bottlenecks.map((b, i) => (
                      <li key={i} style={{ color: '#ff4d4f', marginBottom: 8 }}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <Alert message="无明显瓶颈" type="success" showIcon />
                )}
              </Card>
            </Col>
          </Row>

          <Card 
            title={<Space><BulbOutlined style={{ color: '#1890ff' }} />改进建议</Space>}
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
          >
            {model.recommendations && model.recommendations.length > 0 ? (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {model.recommendations.map((r, i) => (
                  <li key={i} style={{ color: '#1890ff', marginBottom: 8 }}>{r}</li>
                ))}
              </ul>
            ) : (
              <Empty description="暂无建议" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'trend',
      label: (
        <Space>
          <LineChartOutlined />
          <span>时序趋势</span>
        </Space>
      ),
      children: (
        <div>
          <Card 
            title="版本迭代性能趋势" 
            style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
          >
            <div ref={trendChartRef} style={{ width: '100%', height: 300 }} />
          </Card>

          <Card 
            title="版本历史详情" 
            style={{ background: '#1f1f1f', border: '1px solid #303030' }}
          >
            <Table
              dataSource={model.versionHistory}
              columns={versionColumns}
              pagination={false}
              size="small"
              rowKey="version"
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'adaptation',
      label: (
        <Space>
          <ThunderboltOutlined />
          <span>任务适配</span>
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            showIcon
            message="任务适配分析"
            description="评估模型在不同任务类型上的适配性，帮助您选择最适合的应用场景。"
            style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #1890ff' }}
          />
          <Table
            dataSource={model.taskAdaptation}
            columns={taskAdaptationColumns}
            pagination={false}
            size="small"
            rowKey="taskType"
            style={{ background: '#1f1f1f' }}
          />
        </div>
      ),
    },
    {
      key: 'tasks',
      label: (
        <Space>
          <FileTextOutlined />
          <span>关联任务</span>
          {model.relatedTasks && <Tag color="blue">{model.relatedTasks.length}</Tag>}
        </Space>
      ),
      children: (
        <div>
          <Alert
            type="info"
            showIcon
            message="关联任务列表"
            description="展示该模型参与过的所有评测任务，点击任务名称可查看详细报告。"
            style={{ marginBottom: 16, background: '#1f1f1f', border: '1px solid #1890ff' }}
          />
          <Table
            dataSource={model.relatedTasks}
            columns={relatedTaskColumns}
            pagination={{ pageSize: 5 }}
            size="small"
            rowKey="id"
            style={{ background: '#1f1f1f' }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#ffd700' }} />
            <span>{model.name} 测试报告</span>
            <Tag color="blue">{model.version}</Tag>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1200}
        style={{ top: 20 }}
        styles={{
          body: { 
            background: '#141414', 
            padding: 16,
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto'
          }
        }}
      >
        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
            border: '1px solid #303030',
            marginBottom: 16 
          }}
        >
          <Row gutter={24}>
            <Col span={4}>
              <Statistic
                title={<span style={{ color: '#999' }}>综合得分</span>}
                value={model.scores.overall}
                suffix="/ 100"
                styles={{ 
                  content: {
                    color: model.scores.overall >= 80 ? '#52c41a' : model.scores.overall >= 60 ? '#faad14' : '#ff4d4f',
                    fontSize: 28
                  }
                }}
                prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={<span style={{ color: '#999' }}>参数量</span>}
                value={model.params}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={<span style={{ color: '#999' }}>机构</span>}
                value={model.organization}
                styles={{ content: { color: '#fff' } }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={<span style={{ color: '#999' }}>版本</span>}
                value={model.version}
                styles={{ content: { color: '#eb2f96' } }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title={<span style={{ color: '#999' }}>测试时间</span>}
                value={model.testedAt ? new Date(model.testedAt).toLocaleDateString('zh-CN') : '-'}
                styles={{ content: { color: '#fff' } }}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={4}>
              <div style={{ color: '#999', marginBottom: 4 }}>应用领域</div>
              <Space size={[4, 4]} wrap>
                {model.domain.map(d => (
                  <Tag key={d} color="blue">
                    {domainOptions.find(opt => opt.value === d)?.label || d}
                  </Tag>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs defaultActiveKey="analysis" items={tabItems} />
      </Modal>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>任务报告 - {selectedTask?.name}</span>
          </Space>
        }
        open={taskReportVisible}
        onCancel={() => {
          setTaskReportVisible(false);
          setSelectedTask(null);
        }}
        footer={null}
        width={800}
        styles={{
          body: { 
            background: '#141414', 
            padding: 24,
          }
        }}
      >
        {selectedTask && (
          <div>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
                border: '1px solid #303030',
                marginBottom: 16 
              }}
            >
              <Row gutter={24}>
                <Col span={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>任务状态</span>}
                    value={selectedTask.status === 'completed' ? '已完成' : selectedTask.status === 'running' ? '运行中' : '待执行'}
                    styles={{ 
                      content: {
                        color: selectedTask.status === 'completed' ? '#52c41a' : '#1890ff',
                      }
                    }}
                    prefix={selectedTask.status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>综合得分</span>}
                    value={selectedTask.overallScore || '-'}
                    suffix={selectedTask.overallScore ? '/ 100' : ''}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>执行耗时</span>}
                    value={selectedTask.duration || '-'}
                    styles={{ content: { color: '#fff' } }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>测试能力数</span>}
                    value={selectedTask.capabilities.length}
                    suffix="项"
                    styles={{ content: { color: '#eb2f96' } }}
                  />
                </Col>
              </Row>
            </Card>

            <Card style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}>
              <Descriptions column={2} labelStyle={{ color: '#999' }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="任务ID">{selectedTask.id}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(selectedTask.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="测试能力">
                  <Space size={[4, 4]} wrap>
                    {selectedTask.capabilities.map(cap => (
                      <Tag key={cap} color="purple">{cap}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedTask.status === 'completed' && selectedTask.overallScore && (
              <Card title="测试结果摘要" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Row gutter={16}>
                  {selectedTask.capabilities.map((cap) => (
                    <Col span={8} key={cap}>
                      <Card size="small" style={{ background: '#141414', marginBottom: 8 }}>
                        <Statistic
                          title={cap}
                          value={Math.round(selectedTask.overallScore! * (0.9 + Math.random() * 0.2))}
                          suffix="/ 100"
                          styles={{ 
                            content: {
                              color: '#1890ff',
                              fontSize: 18,
                            }
                          }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default TestReportModal;
