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
import type { AcceleratorCard } from '../../mockData/acceleratorMock';
import { acceleratorCards } from '../../mockData/acceleratorMock';
import AcceleratorReportModal from './AcceleratorReportModal';

interface AcceleratorLifecycleManagerProps {
  onViewReport?: (card: AcceleratorCard) => void;
  onRetest?: (card: AcceleratorCard) => void;
  onStartTest?: (cards: AcceleratorCard[], config: TestConfig) => void;
}

interface TestConfig {
  testSuite: string;
  priority: 'high' | 'medium' | 'low';
  duration: number;
}

export const AcceleratorLifecycleManager: React.FC<AcceleratorLifecycleManagerProps> = ({
  onViewReport,
  onRetest,
  onStartTest,
}) => {
  const [activeTab, setActiveTab] = useState('tested');
  const [selectedPendingCards, setSelectedPendingCards] = useState<AcceleratorCard[]>([]);
  const [batchConfigVisible, setBatchConfigVisible] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    testSuite: 'full',
    priority: 'medium',
    duration: 4,
  });
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<AcceleratorCard | null>(null);

  const testedCards = acceleratorCards.filter(c => c.status === 'tested');
  const testingCards = acceleratorCards.filter(c => c.status === 'testing');
  const pendingCards = acceleratorCards.filter(c => c.status === 'pending');

  const handleViewReport = (card: AcceleratorCard) => {
    setCurrentCard(card);
    setReportModalVisible(true);
    onViewReport?.(card);
  };

  const handleRetest = (card: AcceleratorCard) => {
    onRetest?.(card);
    message.success(`已添加 ${card.name} 到重测队列`);
  };

  const testedColumns: ColumnsType<AcceleratorCard> = [
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <Tag color="#1890ff">{record.vendor}</Tag>
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{record.model}</span>
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
      title: '显存',
      key: 'memory',
      render: (_, record) => (
        <Space>
          <span>{record.specs.memory} GB</span>
          <Tag style={{ fontSize: 10 }}>{record.specs.memoryType}</Tag>
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
          <span>{date || '2024-03-22'}</span>
        </Space>
      ),
    },
    {
      title: '固件版本',
      dataIndex: 'firmware',
      key: 'firmware',
      render: (firmware) => <Tag color="cyan">{firmware}</Tag>,
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
            onClick={() => handleViewReport(record)}
          >
            查看报告
          </Button>
          <Button 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRetest(record)}
          >
            重新测试
          </Button>
        </Space>
      ),
    },
  ];

  const testingColumns: ColumnsType<AcceleratorCard> = [
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <Badge status="processing" />
          </Space>
          <span style={{ fontSize: 12, color: '#999' }}>{record.vendor}</span>
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
          正在执行 {record.testProgress?.currentTask}...
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

  const pendingColumns: ColumnsType<AcceleratorCard> = [
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          <span style={{ fontSize: 12, color: '#999' }}>{record.vendor} - {record.model}</span>
        </Space>
      ),
    },
    {
      title: '显存',
      key: 'memory',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.specs.memory} GB</span>
          <Tag style={{ fontSize: 10 }}>{record.specs.memoryType}</Tag>
        </Space>
      ),
    },
    {
      title: '厂商',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (vendor) => <Tag color="blue">{vendor}</Tag>,
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
              setSelectedPendingCards([record]);
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
    selectedRowKeys: selectedPendingCards.map(c => c.id),
    onChange: (_: React.Key[], selectedRows: AcceleratorCard[]) => {
      setSelectedPendingCards(selectedRows);
    },
  };

  const handleBatchTest = () => {
    if (selectedPendingCards.length === 0) {
      message.warning('请先选择要测试的加速卡');
      return;
    }
    setBatchConfigVisible(true);
  };

  const handleConfirmBatchTest = () => {
    onStartTest?.(selectedPendingCards, testConfig);
    setBatchConfigVisible(false);
    setSelectedPendingCards([]);
    message.success(`已添加 ${selectedPendingCards.length} 张加速卡到测试队列`);
  };

  const tabItems = [
    {
      key: 'tested',
      label: (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>已测加速卡库</span>
          <Badge count={testedCards.length} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      children: (
        <Table
          dataSource={testedCards}
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
          <Badge count={testingCards.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      ),
      children: testingCards.length > 0 ? (
        <Table
          dataSource={testingCards}
          columns={testingColumns}
          rowKey="id"
          pagination={false}
        />
      ) : (
        <Empty description="当前没有正在测试的加速卡" />
      ),
    },
    {
      key: 'pending',
      label: (
        <Space>
          <PlayCircleOutlined style={{ color: '#faad14' }} />
          <span>待测加速卡池</span>
          <Badge count={pendingCards.length} style={{ backgroundColor: '#faad14' }} />
        </Space>
      ),
      children: (
        <div>
          {selectedPendingCards.length > 0 && (
            <Card 
              size="small" 
              style={{ marginBottom: 16, background: '#141414' }}
            >
              <Space>
                <span>已选择 {selectedPendingCards.length} 张加速卡</span>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleBatchTest}
                >
                  批量启动测试
                </Button>
                <Button 
                  icon={<DeleteOutlined />}
                  onClick={() => setSelectedPendingCards([])}
                >
                  取消选择
                </Button>
              </Space>
            </Card>
          )}
          <Table
            dataSource={pendingCards}
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
              title="已选择加速卡" 
              value={selectedPendingCards.length} 
              suffix="张"
            />
            <div style={{ marginTop: 8 }}>
              {selectedPendingCards.map(c => (
                <Tag key={c.id} style={{ marginBottom: 4 }}>{c.name}</Tag>
              ))}
            </div>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>测试套件</div>
              <Select
                value={testConfig.testSuite}
                onChange={(v) => setTestConfig({ ...testConfig, testSuite: v })}
                style={{ width: '100%' }}
                options={[
                  { label: '全量测试', value: 'full' },
                  { label: '快速测试', value: 'quick' },
                  { label: '性能测试', value: 'performance' },
                  { label: '兼容性测试', value: 'compatibility' },
                ]}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 8 }}>预估时长（小时）</div>
              <InputNumber
                min={1}
                max={24}
                value={testConfig.duration}
                onChange={(v) => setTestConfig({ ...testConfig, duration: v || 4 })}
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
                  title="已选加速卡数量" 
                  value={selectedPendingCards.length}
                  suffix="张"
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="预估测试时间" 
                  value={selectedPendingCards.length * testConfig.duration}
                  suffix="小时"
                />
              </Col>
            </Row>
          </Card>
        </Space>
      </Modal>

      <AcceleratorReportModal
        visible={reportModalVisible}
        card={currentCard}
        onClose={() => {
          setReportModalVisible(false);
          setCurrentCard(null);
        }}
      />
    </div>
  );
};

export default AcceleratorLifecycleManager;
