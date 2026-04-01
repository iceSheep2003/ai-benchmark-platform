import React, { useState } from 'react';
import { Card, Tabs, Table, Tag, Space, Button, Progress, Modal, Select, InputNumber, Row, Col, Statistic, Badge, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { TestModel } from '../../mockData/testResultMock';
import { mockTestModels, domainOptions } from '../../mockData/testResultMock';

interface TestLifecycleManagerProps {
  onViewReport: (model: TestModel) => void;
  onRetest: (model: TestModel) => void;
  onStartTest: (models: TestModel[], config: TestConfig) => void;
}

interface TestConfig {
  gpuCount: number;
  gpuType: string;
  priority: 'high' | 'medium' | 'low';
}

export const TestLifecycleManager: React.FC<TestLifecycleManagerProps> = ({
  onViewReport,
  onRetest,
  onStartTest,
}) => {
  const [activeTab, setActiveTab] = useState('tested');
  const [selectedPendingModels, setSelectedPendingModels] = useState<TestModel[]>([]);
  const [batchConfigVisible, setBatchConfigVisible] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    gpuCount: 1,
    gpuType: 'A100',
    priority: 'medium',
  });

  const testedModels = mockTestModels.filter(m => m.status === 'tested');
  const testingModels = mockTestModels.filter(m => m.status === 'testing');
  const pendingModels = mockTestModels.filter(m => m.status === 'pending');

  const testedColumns: ColumnsType<TestModel> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{record.organization}</span>
        </Space>
      ),
    },
    {
      title: '综合得分',
      dataIndex: 'scores',
      key: 'overall',
      render: (scores) => (
        <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
          {scores.overall.toFixed(1)}
        </span>
      ),
    },
    {
      title: '领域',
      dataIndex: 'domain',
      key: 'domain',
      render: (domains: string[]) => (
        <Space size={[2, 4]} wrap>
          {domains.map(d => (
            <Tag key={d} color="blue">{domainOptions.find(opt => opt.value === d)?.label || d}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '测试时间',
      dataIndex: 'testedAt',
      key: 'testedAt',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <span>{date ? new Date(date).toLocaleString('zh-CN') : '-'}</span>
        </Space>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version) => <Tag color="cyan">{version}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => onViewReport(record)}
          >
            查看报告
          </Button>
          <Button 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => onRetest(record)}
          >
            重新测试
          </Button>
        </Space>
      ),
    },
  ];

  const testingColumns: ColumnsType<TestModel> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <Badge status="processing" />
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{record.organization}</span>
        </Space>
      ),
    },
    {
      title: '测试进度',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <Progress 
            percent={Math.round((record.testProgress?.current || 0) / (record.testProgress?.total || 1) * 100)}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>
            {record.testProgress?.current} / {record.testProgress?.total} 任务
          </span>
        </Space>
      ),
    },
    {
      title: '当前任务',
      key: 'currentTask',
      render: (_, record) => (
        <Tag color="processing">
          正在跑 {record.testProgress?.currentTask}...
        </Tag>
      ),
    },
    {
      title: '预计剩余时间',
      key: 'estimatedTime',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          <span>{record.testProgress?.estimatedTime || '-'}</span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Button size="small" icon={<FileTextOutlined />}>
          查看日志
        </Button>
      ),
    },
  ];

  const pendingColumns: ColumnsType<TestModel> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{record.organization}</span>
        </Space>
      ),
    },
    {
      title: '参数量',
      dataIndex: 'params',
      key: 'params',
      render: (params) => <Tag>{params}</Tag>,
    },
    {
      title: '领域',
      dataIndex: 'domain',
      key: 'domain',
      render: (domains: string[]) => (
        <Space size={[2, 4]} wrap>
          {domains.map(d => (
            <Tag key={d} color="blue">{domainOptions.find(opt => opt.value === d)?.label || d}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '能力标签',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (tags: string[]) => (
        <Space size={[2, 4]} wrap>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} color="cyan">{tag}</Tag>
          ))}
          {tags.length > 2 && <Tag>+{tags.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => {
              setSelectedPendingModels([record]);
              setBatchConfigVisible(true);
            }}
          >
            开始测试
          </Button>
          <Button 
            size="small"
            icon={<SettingOutlined />}
          >
            自定义配置
          </Button>
        </Space>
      ),
    },
  ];

  const pendingRowSelection = {
    selectedRowKeys: selectedPendingModels.map(m => m.id),
    onChange: (_: React.Key[], selectedRows: TestModel[]) => {
      setSelectedPendingModels(selectedRows);
    },
  };

  const handleBatchTest = () => {
    if (selectedPendingModels.length === 0) {
      message.warning('请先选择要测试的模型');
      return;
    }
    setBatchConfigVisible(true);
  };

  const handleConfirmBatchTest = () => {
    onStartTest(selectedPendingModels, testConfig);
    setBatchConfigVisible(false);
    setSelectedPendingModels([]);
    message.success(`已添加 ${selectedPendingModels.length} 个模型到测试队列`);
  };

  const tabItems = [
    {
      key: 'tested',
      label: (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>已测模型库</span>
          <Badge count={testedModels.length} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      children: (
        <Table
          dataSource={testedModels}
          columns={testedColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      ),
    },
    {
      key: 'testing',
      label: (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <span>测试进行中</span>
          <Badge count={testingModels.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      ),
      children: testingModels.length > 0 ? (
        <Table
          dataSource={testingModels}
          columns={testingColumns}
          rowKey="id"
          pagination={false}
        />
      ) : (
        <Empty description="当前没有正在测试的模型" />
      ),
    },
    {
      key: 'pending',
      label: (
        <Space>
          <PlayCircleOutlined style={{ color: '#faad14' }} />
          <span>待测模型池</span>
          <Badge count={pendingModels.length} style={{ backgroundColor: '#faad14' }} />
        </Space>
      ),
      children: (
        <div>
          {selectedPendingModels.length > 0 && (
            <Card 
              size="small" 
              style={{ marginBottom: 16, background: '#141414' }}
            >
              <Space>
                <span>已选择 {selectedPendingModels.length} 个模型</span>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleBatchTest}
                >
                  批量启动测试
                </Button>
                <Button 
                  icon={<DeleteOutlined />}
                  onClick={() => setSelectedPendingModels([])}
                >
                  取消选择
                </Button>
              </Space>
            </Card>
          )}
          <Table
            dataSource={pendingModels}
            columns={pendingColumns}
            rowKey="id"
            rowSelection={pendingRowSelection}
            pagination={{ pageSize: 5 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card 
        style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            <span>测试全生命周期管理</span>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      <Modal
        title="批量测试配置"
        open={batchConfigVisible}
        onCancel={() => setBatchConfigVisible(false)}
        onOk={handleConfirmBatchTest}
        okText="开始测试"
        cancelText="取消"
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card size="small" style={{ background: '#141414' }}>
            <Statistic 
              title="已选择模型" 
              value={selectedPendingModels.length} 
              suffix="个"
            />
            <div style={{ marginTop: 8 }}>
              {selectedPendingModels.map(m => (
                <Tag key={m.id} style={{ marginBottom: 4 }}>{m.name}</Tag>
              ))}
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>GPU 类型</div>
              <Select
                value={testConfig.gpuType}
                onChange={(v) => setTestConfig({ ...testConfig, gpuType: v })}
                style={{ width: '100%' }}
                options={[
                  { label: 'NVIDIA A100 80GB', value: 'A100' },
                  { label: 'NVIDIA A100 40GB', value: 'A100-40' },
                  { label: 'NVIDIA V100 32GB', value: 'V100' },
                  { label: 'NVIDIA A10 24GB', value: 'A10' },
                ]}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>GPU 数量</div>
              <InputNumber
                min={1}
                max={8}
                value={testConfig.gpuCount}
                onChange={(v) => setTestConfig({ ...testConfig, gpuCount: v || 1 })}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <div>
            <div style={{ marginBottom: 8 }}>任务优先级</div>
            <Select
              value={testConfig.priority}
              onChange={(v) => setTestConfig({ ...testConfig, priority: v })}
              style={{ width: '100%' }}
              options={[
                { label: '🔴 高优先级', value: 'high' },
                { label: '🟡 中优先级', value: 'medium' },
                { label: '🟢 低优先级', value: 'low' },
              ]}
            />
          </div>

          <Card size="small" style={{ background: '#141414' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="已选模型数量" 
                  value={selectedPendingModels.length}
                  suffix="个"
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="预估测试时间" 
                  value={selectedPendingModels.length * 2.5}
                  suffix="小时"
                />
              </Col>
            </Row>
          </Card>
        </Space>
      </Modal>
    </div>
  );
};

export default TestLifecycleManager;
