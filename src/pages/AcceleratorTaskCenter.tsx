import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Space, Input, Select, message, Modal, Card, Row, Col, Statistic, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined, StopOutlined, ThunderboltOutlined, ApiOutlined,
  HeatMapOutlined, SafetyOutlined, DeleteOutlined,
  ExperimentOutlined, RocketOutlined, AimOutlined, AppstoreOutlined,
  VideoCameraOutlined, PlusOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
  acceleratorTaskApi, testCaseApi,
  type TaskResponse, type TaskStatus, type TestTaskResponse, type TestCategory,
} from '../services/acceleratorTaskService';
import CreateAcceleratorTaskModal from '../components/Accelerator/CreateAcceleratorTaskModal';
import AcceleratorTaskDetailDrawer from '../components/Accelerator/AcceleratorTaskDetailDrawer';
import CreateTestTaskModal from '../components/Accelerator/CreateTestTaskModal';
import TestTaskDetailDrawer from '../components/Accelerator/TestTaskDetailDrawer';

/* ---------- 常量 ---------- */
const TEST_CATEGORIES: { key: TestCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'chip_basic',       label: '芯片基础测试',   icon: <ExperimentOutlined /> },
  { key: 'model_training',   label: '模型训练性能',   icon: <RocketOutlined /> },
  { key: 'model_inference',  label: '模型推理性能',   icon: <ThunderboltOutlined /> },
  { key: 'model_accuracy',   label: '模型精度测试',   icon: <AimOutlined /> },
  { key: 'ecosystem_compat', label: '生态兼容性测试', icon: <AppstoreOutlined /> },
  { key: 'video_codec',      label: '视频编解码测试', icon: <VideoCameraOutlined /> },
];

const STATUS_COLOR: Record<TaskStatus, string> = {
  PENDING: 'default', RUNNING: 'processing', SUCCESS: 'success', FAILED: 'error', CANCELLED: 'default',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  PENDING: '等待中', RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败', CANCELLED: '已取消',
};

/* ================================================================ */
const AcceleratorTaskCenter: React.FC = () => {
  /* --- state: opencompass tab --- */
  const [ocTasks, setOcTasks] = useState<TaskResponse[]>([]);
  const [ocLoading, setOcLoading] = useState(false);
  const [ocStatus, setOcStatus] = useState<TaskStatus | 'all'>('all');
  const [ocSearch, setOcSearch] = useState('');
  const [createOcVisible, setCreateOcVisible] = useState(false);
  const [ocDetailTask, setOcDetailTask] = useState<TaskResponse | null>(null);

  /* --- state: test-case tabs --- */
  const [testTasks, setTestTasks] = useState<TestTaskResponse[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<TaskStatus | 'all'>('all');
  const [testSearch, setTestSearch] = useState('');
  const [createTestVisible, setCreateTestVisible] = useState(false);
  const [createTestCategory, setCreateTestCategory] = useState<TestCategory>('chip_basic');
  const [testDetailTask, setTestDetailTask] = useState<TestTaskResponse | null>(null);

  const [activeTab, setActiveTab] = useState('opencompass');

  /* ---------- 数据加载 ---------- */
  const fetchOcTasks = useCallback(async () => {
    setOcLoading(true);
    try {
      const { data } = await acceleratorTaskApi.list({ limit: 200 });
      setOcTasks(data.items);
    } catch { /* ignore */ }
    setOcLoading(false);
  }, []);

  const fetchTestTasks = useCallback(async (category?: string) => {
    setTestLoading(true);
    try {
      const { data } = await testCaseApi.list({ category, limit: 200 });
      setTestTasks(data.items);
    } catch { /* ignore */ }
    setTestLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'opencompass') fetchOcTasks();
    else fetchTestTasks(activeTab);
  }, [activeTab, fetchOcTasks, fetchTestTasks]);

  /* ---------- opencompass 过滤 ---------- */
  const filteredOc = ocTasks.filter(t => {
    if (ocStatus !== 'all' && t.status !== ocStatus) return false;
    if (ocSearch) {
      const s = ocSearch.toLowerCase();
      return t.name.toLowerCase().includes(s) || t.id.toLowerCase().includes(s);
    }
    return true;
  });

  /* ---------- test 过滤 ---------- */
  const filteredTest = testTasks.filter(t => {
    if (testStatus !== 'all' && t.status !== testStatus) return false;
    if (testSearch) {
      const s = testSearch.toLowerCase();
      return t.name.toLowerCase().includes(s) || t.id.toLowerCase().includes(s);
    }
    return true;
  });

  /* ---------- OpenCompass columns ---------- */
  const ocColumns: ColumnsType<TaskResponse> = [
    { title: '任务ID', dataIndex: 'id', width: 120, render: v => <code style={{ color: '#1890ff', fontSize: 12 }}>{v}</code> },
    { title: '任务名称', dataIndex: 'name', width: 200, ellipsis: true },
    { title: '模型', dataIndex: 'model_path', width: 220, ellipsis: true, render: v => v?.split('/').pop() || '-' },
    { title: '数据集', dataIndex: 'datasets', width: 180, render: (ds: string[]) => ds?.map((d, i) => <Tag key={i} color="blue" style={{ margin: 2 }}>{d}</Tag>) || '-' },
    { title: '后端', dataIndex: 'backend', width: 90, render: v => <Tag color="purple">{v}</Tag> },
    { title: 'GPU', dataIndex: 'num_gpus', width: 60 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: TaskStatus) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: v => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setOcDetailTask(r)}>详情</Button>
          {r.status === 'RUNNING' && (
            <Button danger size="small" icon={<StopOutlined />} onClick={() => handleOcCancel(r.id)}>停止</Button>
          )}
          {r.status === 'FAILED' && (
            <Button size="small" icon={<ReloadOutlined />} onClick={() => handleOcRetry(r)}>重新测试</Button>
          )}
          {['SUCCESS', 'FAILED', 'CANCELLED', 'PENDING'].includes(r.status) && (
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleOcDelete(r.id)}>删除</Button>
          )}
        </Space>
      ),
    },
  ];

  /* ---------- Test columns ---------- */
  const testColumns: ColumnsType<TestTaskResponse> = [
    { title: '任务ID', dataIndex: 'id', width: 120, render: v => <code style={{ color: '#1890ff', fontSize: 12 }}>{v}</code> },
    { title: '任务名称', dataIndex: 'name', width: 200, ellipsis: true },
    { title: '测试类型', dataIndex: 'test_type', width: 150 },
    { title: '描述', dataIndex: 'description', width: 220, ellipsis: true },
    { title: 'GPU', dataIndex: 'num_gpus', width: 60 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: TaskStatus) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: v => new Date(v).toLocaleString('zh-CN') },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setTestDetailTask(r)}>详情</Button>
          {r.status === 'RUNNING' && (
            <Button danger size="small" icon={<StopOutlined />} onClick={() => handleTestCancel(r.id)}>停止</Button>
          )}
          {r.status === 'FAILED' && (
            <Button size="small" icon={<ReloadOutlined />} onClick={() => handleTestRetry(r)}>重新测试</Button>
          )}
          {['SUCCESS', 'FAILED', 'CANCELLED', 'PENDING'].includes(r.status) && (
            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleTestDelete(r.id)}>删除</Button>
          )}
        </Space>
      ),
    },
  ];

  /* ---------- 操作 ---------- */
  const handleOcCancel = async (id: string) => {
    Modal.confirm({
      title: '确认停止', content: `确定要停止任务 ${id}？`,
      onOk: async () => { await acceleratorTaskApi.cancel(id); message.success('已停止'); fetchOcTasks(); },
    });
  };
  const handleOcDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除', content: `删除后无法恢复，确定？`,
      onOk: async () => { await acceleratorTaskApi.delete(id); message.success('已删除'); fetchOcTasks(); },
    });
  };
  const handleOcRetry = async (task: TaskResponse) => {
    try {
      await acceleratorTaskApi.create({
        name: `${task.name}-重试`,
        model_path: task.model_path,
        datasets: task.datasets,
        backend: task.backend,
        num_gpus: task.num_gpus,
        batch_size: task.batch_size,
        max_out_len: task.max_out_len,
        priority: task.priority || 'normal',
        execution: task.execution_mode
          ? { mode: task.execution_mode, target_id: task.ssh_target_id || undefined }
          : undefined,
      });
      message.success('已创建重试任务');
      fetchOcTasks();
    } catch {
      message.error('重试创建失败');
    }
  };
  const handleTestCancel = async (id: string) => {
    Modal.confirm({
      title: '确认停止', content: `确定要停止任务 ${id}？`,
      onOk: async () => { await testCaseApi.cancel(id); message.success('已停止'); fetchTestTasks(activeTab); },
    });
  };
  const handleTestDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除', content: `删除后无法恢复，确定？`,
      onOk: async () => { await testCaseApi.delete(id); message.success('已删除'); fetchTestTasks(activeTab); },
    });
  };
  const handleTestRetry = async (task: TestTaskResponse) => {
    try {
      await testCaseApi.create({
        name: `${task.name}-重试`,
        category: task.category as TestCategory,
        test_type: task.test_type,
        config: task.config || {},
        num_gpus: task.num_gpus,
        description: task.description || undefined,
        execution: task.execution_mode
          ? { mode: task.execution_mode, target_id: task.ssh_target_id || undefined }
          : undefined,
      });
      message.success('已创建重试任务');
      fetchTestTasks(activeTab);
    } catch {
      message.error('重试创建失败');
    }
  };

  /* ---------- 统计 ---------- */
  const makeStats = (list: { status: string }[]) => ({
    total: list.length,
    running: list.filter(t => t.status === 'RUNNING').length,
    success: list.filter(t => t.status === 'SUCCESS').length,
    failed:  list.filter(t => t.status === 'FAILED').length,
  });

  /* ---------- 渲染公共统计卡 ---------- */
  const renderStats = (stats: ReturnType<typeof makeStats>) => (
    <Card style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><Statistic title="总任务数" value={stats.total} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#1890ff' }} /></Col>
        <Col xs={12} sm={6}><Statistic title="运行中"   value={stats.running} prefix={<ApiOutlined />} valueStyle={{ color: '#52c41a' }} /></Col>
        <Col xs={12} sm={6}><Statistic title="已完成"   value={stats.success} prefix={<SafetyOutlined />} valueStyle={{ color: '#1890ff' }} /></Col>
        <Col xs={12} sm={6}><Statistic title="失败"     value={stats.failed}  prefix={<HeatMapOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Col>
      </Row>
    </Card>
  );

  /* ---------- 渲染 OpenCompass Tab 内容 ---------- */
  const renderOcTab = () => (
    <>
      {renderStats(makeStats(filteredOc))}
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search placeholder="搜索任务..." style={{ width: 300 }} onChange={e => setOcSearch(e.target.value)} allowClear />
          <Select value={ocStatus} onChange={setOcStatus} style={{ width: 130 }}
            options={[{ value: 'all', label: '全部状态' }, ...(['PENDING','RUNNING','SUCCESS','FAILED','CANCELLED'] as TaskStatus[]).map(s => ({ value: s, label: STATUS_LABEL[s] }))]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOcVisible(true)}>创建评测任务</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchOcTasks}>刷新</Button>
        </Space>
        <Table columns={ocColumns} dataSource={filteredOc} rowKey="id" loading={ocLoading}
          scroll={{ x: 1400 }} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 个任务` }} />
      </Card>
    </>
  );

  /* ---------- 渲染 Test Tab 内容 ---------- */
  const renderTestTab = (category: TestCategory) => (
    <>
      {renderStats(makeStats(filteredTest))}
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search placeholder="搜索任务..." style={{ width: 300 }} onChange={e => setTestSearch(e.target.value)} allowClear />
          <Select value={testStatus} onChange={setTestStatus} style={{ width: 130 }}
            options={[{ value: 'all', label: '全部状态' }, ...(['PENDING','RUNNING','SUCCESS','FAILED','CANCELLED'] as TaskStatus[]).map(s => ({ value: s, label: STATUS_LABEL[s] }))]} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateTestCategory(category); setCreateTestVisible(true); }}>创建测试任务</Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTestTasks(category)}>刷新</Button>
        </Space>
        <Table columns={testColumns} dataSource={filteredTest} rowKey="id" loading={testLoading}
          scroll={{ x: 1200 }} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 个任务` }} />
      </Card>
    </>
  );

  /* ---------- tabs ---------- */
  const tabItems = [
    { key: 'opencompass', label: <span><ExperimentOutlined /> OpenCompass 精度评测</span>, children: renderOcTab() },
    ...TEST_CATEGORIES.map(c => ({
      key: c.key,
      label: <span>{c.icon} {c.label}</span>,
      children: renderTestTab(c.key),
    })),
  ];

  return (
    <div style={{ padding: 0 }}>
      <Tabs activeKey={activeTab} onChange={k => { setActiveTab(k); setTestStatus('all'); setTestSearch(''); }}
        items={tabItems} type="card" style={{ padding: '0 16px' }} />

      {/* Modals & Drawers */}
      <CreateAcceleratorTaskModal open={createOcVisible} onClose={() => setCreateOcVisible(false)}
        onSuccess={() => { setCreateOcVisible(false); fetchOcTasks(); }} />
      <AcceleratorTaskDetailDrawer task={ocDetailTask} open={!!ocDetailTask}
        onClose={() => setOcDetailTask(null)} />
      <CreateTestTaskModal open={createTestVisible} category={createTestCategory}
        onClose={() => setCreateTestVisible(false)}
        onSuccess={() => { setCreateTestVisible(false); fetchTestTasks(activeTab); }} />
      <TestTaskDetailDrawer task={testDetailTask} open={!!testDetailTask}
        onClose={() => setTestDetailTask(null)} />
    </div>
  );
};

export default AcceleratorTaskCenter;
