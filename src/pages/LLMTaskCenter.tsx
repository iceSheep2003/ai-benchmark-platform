import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, message, Modal, Drawer, Card, Progress, Row, Col, Statistic, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, StopOutlined, FileTextOutlined, ThunderboltOutlined, ClockCircleOutlined, ApiOutlined } from '@ant-design/icons';
import type { BenchmarkTask, TaskStatus } from '../types';
import { useAppStore } from '../store/appStore';
import { LLMEvaluationConfig } from '../components/Task/LLMEvaluationConfig';

const LLMTaskCenter: React.FC = () => {
  const { tasks, setTasks, setSelectedTask, setCurrentPage } = useAppStore();
  const [filteredTasks, setFilteredTasks] = useState<BenchmarkTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [logsDrawerVisible, setLogsDrawerVisible] = useState(false);
  const [selectedTaskForLogs] = useState<BenchmarkTask | null>(null);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState(false);

  useEffect(() => {
    let filtered = tasks.filter(task => task.type === 'llm');

    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (searchText) {
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(searchText.toLowerCase()) ||
          task.id.toLowerCase().includes(searchText.toLowerCase()) ||
          task.llmConfig?.model?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, searchText]);

  const getStatusColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      PENDING: 'default',
      RUNNING: 'processing',
      SUCCESS: 'success',
      FAILED: 'error',
      CANCELLED: 'default',
    };
    return colors[status];
  };

  const getStatusBadge = (status: TaskStatus) => {
    if (status === 'RUNNING') {
      return (
        <Tag color="processing" style={{ animation: 'pulse 2s infinite' }}>
          🟢 运行中
        </Tag>
      );
    }
    const statusIcons: Record<TaskStatus, string> = {
      PENDING: '🟡',
      RUNNING: '🟢',
      SUCCESS: '✅',
      FAILED: '❌',
      CANCELLED: '⚪',
    };
    return (
      <Tag color={getStatusColor(status)}>
        {statusIcons[status]} {status}
      </Tag>
    );
  };

  const columns: ColumnsType<BenchmarkTask> = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <code style={{ color: '#1890ff', fontSize: 12 }}>{text}</code>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '模型',
      key: 'model',
      width: 200,
      render: (_, record) => {
        const model = record.llmConfig?.model || '-';
        const version = record.llmConfig?.version || '';
        
        const modelIcons: Record<string, { icon: string; color: string }> = {
          'GPT-4': { icon: '🤖', color: '#1890ff' },
          'Claude-3': { icon: '🧠', color: '#52c41a' },
          'Gemini-Pro': { icon: '💎', color: '#722ed1' },
          'Qwen-72B': { icon: '🌟', color: '#fa8c16' },
          'Baichuan2-13B': { icon: '🎯', color: '#eb2f96' },
          'Llama-3': { icon: '🦙', color: '#13c2c2' },
        };
        
        const modelInfo = modelIcons[model] || { icon: '🤖', color: '#1890ff' };
        
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 18, marginRight: 8 }}>{modelInfo.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{model}</div>
              {version && (
                <div style={{ fontSize: 12, color: '#999' }}>{version}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '能力维度',
      key: 'capabilities',
      width: 200,
      render: (_, record) => {
        const capabilities = record.llmConfig?.capabilities || [];
        if (capabilities.length === 0) return '-';
        
        const iconMap: Record<string, string> = {
          '语言理解': '📚',
          '逻辑推理': '🧠',
          '文本生成': '✍️',
          '知识问答': '🎯',
          '代码能力': '💻',
          '多语言能力': '🌐',
        };
        
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {capabilities.slice(0, 3).map((cap, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                <span style={{ marginRight: 6 }}>{iconMap[cap.title] || '📋'}</span>
                <span>{cap.title}</span>
              </div>
            ))}
            {capabilities.length > 3 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{capabilities.length - 3} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '测试项',
      key: 'tests',
      width: 220,
      render: (_, record) => {
        const capabilities = record.llmConfig?.capabilities || [];
        if (capabilities.length === 0) return '-';
        
        const allTests = capabilities.flatMap(cap => cap.tests);
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
        
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {allTests.slice(0, 4).map((test, idx) => (
              <Tag key={idx} color="blue" style={{ margin: 0, fontSize: 12 }}>
                {testLabels[test] || test}
              </Tag>
            ))}
            {allTests.length > 4 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{allTests.length - 4} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '数据集',
      key: 'datasets',
      width: 200,
      render: (_, record) => {
        const capabilities = record.llmConfig?.capabilities || [];
        if (capabilities.length === 0) return '-';
        
        const allDatasets = capabilities.flatMap(cap => cap.datasets);
        if (allDatasets.length === 0) return '-';
        
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
        
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            {allDatasets.slice(0, 3).map((dataset, idx) => (
              <Tag key={idx} color="green" style={{ margin: 0, fontSize: 12 }}>
                {datasetLabels[dataset] || dataset}
              </Tag>
            ))}
            {allDatasets.length > 3 && (
              <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                +{allDatasets.length - 3} 更多
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => getStatusBadge(status),
    },
    {
      title: '创建人',
      key: 'createdBy',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Avatar 
            size="small" 
            src={record.createdByAvatar} 
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.createdBy?.charAt(0) || 'U'}
          </Avatar>
          <span style={{ fontSize: 13 }}>{record.createdBy || 'Unknown'}</span>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTask(record)}
          >
            查看
          </Button>
          {record.status === 'RUNNING' && (
            <Button
              danger
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleStopTask(record.id)}
            >
              停止
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleViewTask = (task: BenchmarkTask) => {
    setSelectedTask(task);
    setCurrentPage('task-detail');
  };

  const handleStopTask = (taskId: string) => {
    Modal.confirm({
      title: '确认停止任务',
      content: '确定要停止这个任务吗？',
      onOk: () => {
        const updatedTasks = tasks.map(task =>
          task.id === taskId ? { ...task, status: 'CANCELLED' as TaskStatus } : task
        );
        setTasks(updatedTasks);
        message.success('任务已停止');
      },
    });
  };

  const taskStats = {
    total: filteredTasks.length,
    running: filteredTasks.filter(t => t.status === 'RUNNING').length,
    success: filteredTasks.filter(t => t.status === 'SUCCESS').length,
    failed: filteredTasks.filter(t => t.status === 'FAILED').length,
  };

  return (
    <div style={{ padding: '24px', background: '#141414', minHeight: '100vh' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #434343' }}>
            <Statistic
              title="总任务数"
              value={taskStats.total}
              prefix={<FileTextOutlined />}
              styles={{ content: { color: '#fff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #434343' }}>
            <Statistic
              title="运行中"
              value={taskStats.running}
              prefix={<ThunderboltOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #434343' }}>
            <Statistic
              title="成功"
              value={taskStats.success}
              prefix={<ApiOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #434343' }}>
            <Statistic
              title="失败"
              value={taskStats.failed}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #434343',
          marginBottom: 24 
        }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>大模型测评任务列表</span>
            <Space>
              <Input
                placeholder="搜索任务..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { label: '全部状态', value: 'all' },
                  { label: '待运行', value: 'PENDING' },
                  { label: '运行中', value: 'RUNNING' },
                  { label: '成功', value: 'SUCCESS' },
                  { label: '失败', value: 'FAILED' },
                  { label: '已取消', value: 'CANCELLED' },
                ]}
              />
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => setCreateTaskModalVisible(true)}
              >
                新建任务
              </Button>
            </Space>
          </div>
        }
      >
        <Table
          dataSource={filteredTasks}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1800 }}
          style={{ color: '#fff' }}
          rowClassName={(record) => record.status === 'RUNNING' ? 'running-row' : ''}
        />
      </Card>

      <Drawer
        title={`任务日志 - ${selectedTaskForLogs?.name}`}
        placement="right"
        styles={{ wrapper: { width: 600 } }}
        open={logsDrawerVisible}
        onClose={() => setLogsDrawerVisible(false)}
        style={{ background: '#141414' }}
      >
        <div style={{ color: '#fff' }}>
          {selectedTaskForLogs?.status === 'RUNNING' && (
            <div style={{ marginBottom: 16 }}>
              <Progress 
                percent={75} 
                status="active" 
                strokeColor="#1890ff"
              />
              <div style={{ marginTop: 8, color: '#999' }}>
                任务正在运行中...
              </div>
            </div>
          )}
          <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.8 }}>
            <div style={{ color: '#52c41a' }}>[2024-03-21 10:00:00] 任务开始执行</div>
            <div style={{ color: '#1890ff' }}>[2024-03-21 10:00:05] 加载模型配置</div>
            <div style={{ color: '#1890ff' }}>[2024-03-21 10:00:10] 初始化测试环境</div>
            <div style={{ color: '#52c41a' }}>[2024-03-21 10:00:15] 开始执行测试</div>
            {selectedTaskForLogs?.status === 'RUNNING' && (
              <div style={{ color: '#faad14' }}>[2024-03-21 10:05:00] 正在执行测试...</div>
            )}
            {selectedTaskForLogs?.status === 'SUCCESS' && (
              <>
                <div style={{ color: '#52c41a' }}>[2024-03-21 10:30:00] 测试完成</div>
                <div style={{ color: '#52c41a' }}>[2024-03-21 10:30:05] 生成测试报告</div>
                <div style={{ color: '#52c41a' }}>[2024-03-21 10:30:10] 任务执行成功</div>
              </>
            )}
            {selectedTaskForLogs?.status === 'FAILED' && (
              <>
                <div style={{ color: '#ff4d4f' }}>[2024-03-21 10:15:00] 测试失败</div>
                <div style={{ color: '#ff4d4f' }}>[2024-03-21 10:15:05] 错误: 测试超时</div>
              </>
            )}
          </div>
        </div>
      </Drawer>

      <LLMEvaluationConfig
        visible={createTaskModalVisible}
        onClose={() => setCreateTaskModalVisible(false)}
      />
    </div>
  );
};

export default LLMTaskCenter;