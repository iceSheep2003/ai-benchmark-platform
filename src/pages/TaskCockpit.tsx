import React, { useEffect, useState, useRef } from 'react';
import { Button, Space, Card, Tabs, Badge, Statistic, Row, Col, Modal, message, Alert, Table, Tag, Descriptions, Typography, Collapse, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  FileTextOutlined,
  SettingOutlined,
  DashboardOutlined,
  NodeIndexOutlined,
  WarningOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
  RobotOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  GlobalOutlined,
  BookOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
import { useAppStore } from '../store/appStore';
import { useTaskStreamStore } from '../store/taskStreamStore';
import { startWebSocketMock, stopWebSocketMock } from '../mockData/websocketMock';
import { MetricsPanel } from '../components/Task/MetricsPanel';
import { LiveLogViewer } from '../components/Task/LiveLogViewer';
import { RuntimeFlow } from '../components/Task/RuntimeFlow';

interface TaskCockpitProps {
  taskId: string;
}

export const TaskCockpit: React.FC<TaskCockpitProps> = ({ taskId }) => {
  const { selectedTask, setCurrentPage } = useAppStore();
  const { connect, disconnect, clearData } = useTaskStreamStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState('metrics');
  const [isPaused, setIsPaused] = useState(false);

  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  }, [connect, disconnect]);

  useEffect(() => {
    let mounted = true;

    if (taskId && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connectRef.current(taskId);
      startWebSocketMock();
    }

    const timer = setInterval(() => {
      if (!isPaused && mounted) {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (taskId) {
        stopWebSocketMock();
        disconnectRef.current();
        hasConnectedRef.current = false;
      }
    };
  }, [taskId, isPaused]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: string; color: string; text: string }> = {
      RUNNING: { icon: '🟢', color: 'success', text: '运行中' },
      PENDING: { icon: '🟡', color: 'warning', text: '待运行' },
      SUCCESS: { icon: '⚪', color: 'default', text: '已完成' },
      FAILED: { icon: '🔴', color: 'error', text: '失败' },
      CANCELLED: { icon: '⚪', color: 'default', text: '已取消' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge
        status={config.color as any}
        text={
          <Space>
            <span>{config.icon}</span>
            <span style={{ fontWeight: 'bold' }}>{config.text}</span>
          </Space>
        }
      />
    );
  };

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    message.success(isPaused ? '任务已恢复' : '任务已暂停');
  };

  const handleTerminate = () => {
    Modal.confirm({
      title: '终止任务',
      content: `确定要终止任务 ${taskId} 吗？此操作无法撤销。`,
      onOk: () => {
        stopWebSocketMock();
        disconnect();
        clearData();
        message.success(`任务 ${taskId} 已终止`);
        setCurrentPage('tasks');
      },
    });
  };

  const handleExportReport = () => {
    message.success('正在打开报告...');
  };

  const handleBackToList = () => {
    stopWebSocketMock();
    disconnect();
    clearData();
    setCurrentPage('tasks');
  };

  const handleResumeFromCheckpoint = (checkpointId: string) => {
    Modal.confirm({
      title: '从检查点恢复',
      content: `确定要从检查点 ${checkpointId} 恢复吗？`,
      onOk: () => {
        message.success('正在从检查点恢复...');
      },
    });
  };

  const handleRetryFromScratch = () => {
    Modal.confirm({
      title: '从头开始重试',
      content: '确定要从头开始重新启动任务吗？',
      onOk: () => {
        message.success('任务已从头开始重启');
      },
    });
  };

  const testLabels: Record<string, string> = {
    'reading_comprehension': '阅读理解',
    'semantic_analysis': '语义分析',
    'context_understanding': '上下文理解',
    'math_problem_solving': '数学问题求解',
    'logical_deduction': '逻辑推理',
    'common_sense_reasoning': '常识推理',
    'text_generation': '文本生成',
    'creative_expression': '创意表达',
    'content_creation': '内容创作',
    'fact_qa': '事实问答',
    'knowledge_reasoning': '知识推理',
    'domain_knowledge': '领域知识',
    'code_generation': '代码生成',
    'code_understanding': '代码理解',
    'code_debugging': '代码调试',
    'multilingual_understanding': '多语言理解',
    'machine_translation': '机器翻译',
    'cross_lingual_reasoning': '跨语言推理',
  };

  const datasetLabels: Record<string, string> = {
    'domain_instruction': 'DomainInstructionSet',
    'xnli': 'XNLI',
    'boolq': 'BoolQ',
    'squad': 'SQuAD',
    'mmlu': 'MMLU',
    'gsm8k': 'GSM8K',
    'race': 'RACE',
    'creative_writing': 'CreativeWriting',
    'story_generation': 'StoryGeneration',
    'text_generation': 'TextGeneration',
    'triviaqa': 'TriviaQA',
    'naturalquestions': 'NaturalQuestions',
    'webquestions': 'WebQuestions',
    'humaneval': 'HumanEval',
    'mbpp': 'MBPP',
    'codecontests': 'CodeContests',
    'flores': 'FLORES',
    'wmt': 'WMT',
    'xcopa': 'XCOPA',
    'xquad': 'XQuAD',
  };

  const capabilityIconMap: Record<string, React.ReactNode> = {
    '语言理解': <BookOutlined />,
    '逻辑推理': <BulbOutlined />,
    '文本生成': <FileTextOutlined />,
    '知识问答': <ExperimentOutlined />,
    '代码能力': <CodeOutlined />,
    '多语言能力': <GlobalOutlined />,
  };

  const renderLLMConfigDetail = () => {
    if (!selectedTask?.llmConfig) {
      return (
        <Empty
          description="无大模型配置信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const { model, version, capabilities, generatedConfigFile, configGenerationError } = selectedTask.llmConfig;

    return (
      <div>
        <Card 
          title={
            <Space>
              <RobotOutlined style={{ color: '#1890ff' }} />
              <span>模型基本信息</span>
            </Space>
          }
          style={{ marginBottom: 24, background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Descriptions column={3} labelStyle={{ color: '#999' }} contentStyle={{ color: '#fff' }}>
            <Descriptions.Item label="模型名称">
              <Space>
                <Tag color="blue">{model}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="模型版本">
              <Tag color="green">{version}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="任务ID">
              <code style={{ color: '#1890ff' }}>{selectedTask.id}</code>
            </Descriptions.Item>
            <Descriptions.Item label="配置文件">
              {generatedConfigFile ? (
                <Tag color="cyan">{generatedConfigFile.relativePath}</Tag>
              ) : (
                <Tag color="warning">未生成</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="配置状态">
              {configGenerationError ? (
                <Tag color="error">{configGenerationError}</Tag>
              ) : (
                <Tag color="success">已就绪</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card 
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#52c41a' }} />
              <span>能力维度配置</span>
            </Space>
          }
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          {capabilities && capabilities.length > 0 ? (
            <Collapse
              accordion
              items={capabilities.map((cap) => ({
                key: cap.id,
                label: (
                  <Space>
                    {capabilityIconMap[cap.title] || <ExperimentOutlined />}
                    <Text strong style={{ color: '#fff' }}>{cap.title}</Text>
                    <Tag color="blue">{cap.tests.length} 测试项</Tag>
                    <Tag color="green">{cap.datasets.length} 数据集</Tag>
                  </Space>
                ),
                children: (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card 
                          size="small" 
                          title={
                            <Space>
                              <ThunderboltOutlined style={{ color: '#faad14' }} />
                              <span>测试项</span>
                            </Space>
                          }
                          style={{ background: '#141414', border: '1px solid #303030' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                            {cap.tests.map((test, idx) => (
                              <Tag key={idx} color="orange" style={{ margin: '2px' }}>
                                {testLabels[test] || test}
                              </Tag>
                            ))}
                          </div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card 
                          size="small" 
                          title={
                            <Space>
                              <DatabaseOutlined style={{ color: '#722ed1' }} />
                              <span>数据集</span>
                            </Space>
                          }
                          style={{ background: '#141414', border: '1px solid #303030' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                            {cap.datasets.map((dataset, idx) => (
                              <Tag key={idx} color="purple" style={{ margin: '2px' }}>
                                {datasetLabels[dataset] || dataset}
                              </Tag>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty
              description="暂无能力维度配置"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </div>
    );
  };

  const renderAcceleratorConfigDetail = () => {
    if (!selectedTask?.acceleratorConfig) {
      return (
        <Empty
          description="无加速卡配置信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const {
      accelerator,
      tasks,
      offlineTests,
      generatedConfigFile,
      configGenerationError,
    } = selectedTask.acceleratorConfig;

    return (
      <div>
        <Card
          title={
            <Space>
              <ThunderboltOutlined style={{ color: '#faad14' }} />
              <span>加速卡基本信息</span>
            </Space>
          }
          style={{ marginBottom: 24, background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Descriptions column={3} labelStyle={{ color: '#999' }} contentStyle={{ color: '#fff' }}>
            <Descriptions.Item label="加速卡型号">
              <Tag color="geekblue">{accelerator}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="任务ID">
              <code style={{ color: '#1890ff' }}>{selectedTask.id}</code>
            </Descriptions.Item>
            <Descriptions.Item label="测试维度数">
              <Tag color="blue">{tasks.length}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="配置文件">
              {generatedConfigFile ? (
                <Tag color="cyan">{generatedConfigFile.relativePath}</Tag>
              ) : (
                <Tag color="warning">未生成</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="配置状态">
              {configGenerationError ? (
                <Tag color="error">{configGenerationError}</Tag>
              ) : (
                <Tag color="success">已就绪</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="线下测试">
              <Tag color="purple">{offlineTests.length}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#52c41a' }} />
              <span>维度与数据集配置</span>
            </Space>
          }
          style={{ marginBottom: 24, background: '#1f1f1f', border: '1px solid #303030' }}
        >
          {tasks.length > 0 ? (
            <Collapse
              accordion
              items={tasks.map((task) => ({
                key: task.id,
                label: (
                  <Space>
                    <Text strong style={{ color: '#fff' }}>{task.title}</Text>
                    <Tag color="blue">{task.tests.length} 测试项</Tag>
                    <Tag color="green">{task.datasets.length} 数据集</Tag>
                  </Space>
                ),
                children: (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small" title="测试项" style={{ background: '#141414', border: '1px solid #303030' }}>
                        <Space wrap>
                          {task.tests.map((test) => (
                            <Tag key={test} color="orange">{test}</Tag>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" title="数据集" style={{ background: '#141414', border: '1px solid #303030' }}>
                        <Space wrap>
                          {task.datasets.map((dataset) => (
                            <Tag key={dataset} color="green">{dataset}</Tag>
                          ))}
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无测试维度配置" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        <Card
          title={
            <Space>
              <CloudUploadOutlined style={{ color: '#722ed1' }} />
              <span>线下测试配置</span>
            </Space>
          }
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          {offlineTests.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {offlineTests.map((test) => (
                <Card key={test.id} size="small" style={{ background: '#141414', border: '1px solid #303030' }}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <Tag color={test.enabled ? 'success' : 'default'}>{test.title}</Tag>
                      <Tag color="blue">子项 {test.subItems.length}</Tag>
                    </Space>
                    {test.subItems.map((sub) => (
                      <div key={sub.value}>
                        <Text style={{ color: '#999' }}>{sub.label}：</Text>
                        <Space wrap>
                          {(sub.selected || []).map((val) => (
                            <Tag key={`${sub.value}-${val}`} color="purple">{val}</Tag>
                          ))}
                        </Space>
                      </div>
                    ))}
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <Empty description="未启用线下测试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'config-detail',
      label: (
        <Space>
          <SettingOutlined />
          <span>任务配置详情</span>
        </Space>
      ),
      children: selectedTask?.type === 'accelerator'
        ? renderAcceleratorConfigDetail()
        : renderLLMConfigDetail(),
    },
    {
      key: 'metrics',
      label: (
        <Space>
          <DashboardOutlined />
          <span>运行指标</span>
        </Space>
      ),
      children: <MetricsPanel taskId={taskId} />,
    },
    {
      key: 'logs',
      label: (
        <Space>
          <FileTextOutlined />
          <span>实时日志</span>
        </Space>
      ),
      children: <LiveLogViewer taskId={taskId} />,
    },
    {
      key: 'topology',
      label: (
        <Space>
          <NodeIndexOutlined />
          <span>运行时拓扑</span>
        </Space>
      ),
      children: <RuntimeFlow taskId={taskId} />,
    },
    {
      key: 'resources',
      label: (
        <Space>
          <CloudUploadOutlined />
          <span>资源与检查点</span>
        </Space>
      ),
      children: (
        <Card title="检查点管理" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
          <Table
            dataSource={selectedTask?.checkpoints || []}
            columns={[
              {
                title: '步骤',
                dataIndex: 'step',
                key: 'step',
                render: (step) => <Tag color="blue">步骤 {step}</Tag>,
              },
              {
                title: '时间戳',
                dataIndex: 'timestamp',
                key: 'timestamp',
                render: (timestamp) => new Date(timestamp).toLocaleString(),
              },
              {
                title: '文件大小',
                dataIndex: 'fileSizeMB',
                key: 'fileSizeMB',
                render: (size) => `${size} MB`,
              },
              {
                title: '状态',
                dataIndex: 'isValid',
                key: 'isValid',
                render: (isValid) => (
                  <Tag color={isValid ? 'success' : 'error'}>
                    {isValid ? '有效' : '无效'}
                  </Tag>
                ),
              },
              {
                title: '操作',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => handleResumeFromCheckpoint(record.id)}
                      disabled={!record.isValid}
                    >
                      恢复
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => message.success('检查点已下载')}
                    >
                      下载
                    </Button>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'config',
      label: (
        <Space>
          <FileTextOutlined />
          <span>原始配置 (JSON)</span>
        </Space>
      ),
      children: (
        <Card title="原始任务配置" style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'monospace', 
            fontSize: '12px',
            background: '#141414',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #303030',
            maxHeight: '500px',
            overflow: 'auto',
          }}>
            {JSON.stringify(selectedTask, null, 2)}
          </div>
        </Card>
      ),
    },
  ];

  if (!selectedTask) {
    return (
      <div style={{ padding: '24px' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentPage('tasks')}>
          返回任务列表
        </Button>
        <div style={{ marginTop: '24px', color: '#666' }}>未选择任务</div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #303030',
          backgroundColor: '#1f1f1f',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
                返回
              </Button>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                  {selectedTask.name}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  ID: <code>{selectedTask.id}</code>
                </div>
              </div>
            </Space>
          </Col>

          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Space orientation="vertical" size={0}>
              <div style={{ fontSize: '12px', color: '#999' }}>状态</div>
              {getStatusBadge(selectedTask.status)}
            </Space>
          </Col>

          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Space orientation="vertical" size={0}>
              <div style={{ fontSize: '12px', color: '#999' }}>已运行时间</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {formatElapsedTime(elapsedTime)}
              </div>
            </Space>
          </Col>

          <Col xs={24} sm={24} md={12} lg={6} xl={6}>
            <Space wrap>
              {selectedTask.status === 'RUNNING' && (
                <Button
                  icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handlePauseResume}
                >
                  {isPaused ? '恢复' : '暂停'}
                </Button>
              )}
              {selectedTask.status === 'RUNNING' && (
                <Button danger icon={<StopOutlined />} onClick={handleTerminate}>
                  终止
                </Button>
              )}
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExportReport}
                disabled={selectedTask.status !== 'SUCCESS'}
              >
                查看报告
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {selectedTask.status === 'FAILED' && selectedTask.failureReason && (
        <div style={{ padding: '0 24px', marginBottom: '24px' }}>
          <Alert
            message="任务失败 - 智能恢复建议"
            description={
              <div>
                <p><strong>失败原因：</strong> {selectedTask.failureReason}</p>
                <p>
                  <strong>恢复选项：</strong> 在步骤 {selectedTask.lastSuccessfulStep} 找到有效检查点。
                  是否要从该检查点恢复？
                </p>
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      const lastCheckpoint = selectedTask.checkpoints?.find(cp => cp.step === selectedTask.lastSuccessfulStep);
                      if (lastCheckpoint) {
                        handleResumeFromCheckpoint(lastCheckpoint.id);
                      }
                    }}
                  >
                    从检查点恢复
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRetryFromScratch}
                  >
                    从头开始重试
                  </Button>
                </Space>
              </div>
            }
            type="error"
            showIcon
            icon={<WarningOutlined />}
            closable
          />
        </div>
      )}

      <div style={{ padding: '24px' }}>
        {selectedTask.type === 'llm' && selectedTask.llmConfig ? (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>模型</span>}
                  prefix={<RobotOutlined style={{ color: '#1890ff' }} />}
                  value={selectedTask.llmConfig.model}
                  valueStyle={{ fontSize: '14px', color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>版本</span>}
                  prefix={<Tag color="blue">{selectedTask.llmConfig.version}</Tag>}
                  value=""
                  valueStyle={{ fontSize: '14px', color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>能力维度</span>}
                  prefix={<ExperimentOutlined style={{ color: '#52c41a' }} />}
                  value={selectedTask.llmConfig.capabilities?.length || 0}
                  suffix="项"
                  valueStyle={{ fontSize: '14px', color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>测试项</span>}
                  prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                  value={selectedTask.llmConfig.capabilities?.reduce((acc, cap) => acc + cap.tests.length, 0) || 0}
                  suffix="项"
                  valueStyle={{ fontSize: '14px', color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>数据集</span>}
                  prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
                  value={selectedTask.llmConfig.capabilities?.reduce((acc, cap) => acc + cap.datasets.length, 0) || 0}
                  suffix="个"
                  valueStyle={{ fontSize: '14px', color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
                <Statistic
                  title={<span style={{ color: '#999' }}>创建时间</span>}
                  value={new Date(selectedTask.createdAt).toLocaleString('zh-CN', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  valueStyle={{ fontSize: '12px', color: '#fff' }}
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="GPU 型号"
                  value={selectedTask.resources?.cardModel || '-'}
                  styles={{ content: { fontSize: '14px', color: '#fff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="CUDA 版本"
                  value={selectedTask.resources?.cudaVersion || 'N/A'}
                  styles={{ content: { fontSize: '14px', color: '#fff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="数据集"
                  value={selectedTask.dataLineage?.datasetName || '-'}
                  styles={{ content: { fontSize: '14px', color: '#fff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="工作流 ID"
                  value={selectedTask.workflowId}
                  styles={{ content: { fontSize: '12px', color: '#fff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="状态"
                  value={selectedTask.status}
                  styles={{ content: { fontSize: '14px', color: '#fff' } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={4} xl={4}>
              <Card>
                <Statistic
                  title="开始时间"
                  value={new Date(selectedTask.createdAt).toLocaleString()}
                  styles={{ content: { fontSize: '12px', color: '#fff' } }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </div>
  );
};
