import React, { useState, useMemo } from 'react';
import { 
  Modal, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Space, 
  Input, 
  Select, 
  Checkbox, 
  Table, 
  Statistic, 
  Typography, 
  message, 
  Divider, 
  Badge, 
  Tooltip,
  Steps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  SwapOutlined,
  StarOutlined,
  StarFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { TestModel } from '../../mockData/testResultMock';
import { mockTestModels } from '../../mockData/testResultMock';

const { Text } = Typography;
const { Search } = Input;

interface CreateComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ComparisonFormData) => void;
}

export interface ComparisonFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  selectedModels: TestModel[];
}

const domainColors: Record<string, string> = {
  general: 'blue',
  medical: 'green',
  code: 'purple',
  finance: 'gold',
  legal: 'red',
};

const domainLabels: Record<string, string> = {
  general: '通用',
  medical: '医疗',
  code: '代码',
  finance: '金融',
  legal: '法律',
};

export const CreateComparisonModal: React.FC<CreateComparisonModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedModels, setSelectedModels] = useState<TestModel[]>([]);
  const [starredModels, setStarredModels] = useState<Set<string>>(new Set());

  const [comparisonName, setComparisonName] = useState('');
  const [comparisonDescription, setComparisonDescription] = useState('');
  const [comparisonCategory, setComparisonCategory] = useState('综合对比');
  const [comparisonTags, setComparisonTags] = useState<string[]>([]);

  const filteredModels = useMemo(() => {
    return mockTestModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           model.organization.toLowerCase().includes(searchText.toLowerCase());
      const matchesDomain = selectedDomain === 'all' || model.domain.includes(selectedDomain as any);
      return matchesSearch && matchesDomain && model.status === 'tested';
    });
  }, [searchText, selectedDomain]);

  const handleToggleModel = (model: TestModel) => {
    const isSelected = selectedModels.some(m => m.id === model.id);
    if (isSelected) {
      setSelectedModels(selectedModels.filter(m => m.id !== model.id));
    } else {
      if (selectedModels.length >= 5) {
        message.warning('最多只能选择5个模型进行对比');
        return;
      }
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleToggleStar = (modelId: string) => {
    const newStarred = new Set(starredModels);
    if (newStarred.has(modelId)) {
      newStarred.delete(modelId);
    } else {
      newStarred.add(modelId);
    }
    setStarredModels(newStarred);
  };

  const handleRemoveSelected = (modelId: string) => {
    setSelectedModels(selectedModels.filter(m => m.id !== modelId));
  };

  const handleClearAll = () => {
    setSelectedModels([]);
  };

  const handleNextStep = () => {
    if (currentStep === 0 && selectedModels.length < 2) {
      message.warning('请至少选择2个模型进行对比');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!comparisonName.trim()) {
      message.warning('请输入对比名称');
      return;
    }

    const formData: ComparisonFormData = {
      name: comparisonName,
      description: comparisonDescription,
      category: comparisonCategory,
      tags: comparisonTags,
      selectedModels,
    };

    onSubmit(formData);
    message.success('对比创建成功');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedModels([]);
    setComparisonName('');
    setComparisonDescription('');
    setComparisonCategory('综合对比');
    setComparisonTags([]);
    setSearchText('');
    setSelectedDomain('all');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const modelColumns: ColumnsType<TestModel> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          <Checkbox 
            checked={selectedModels.some(m => m.id === record.id)}
            onChange={() => handleToggleModel(record)}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.organization}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '参数量',
      dataIndex: 'params',
      key: 'params',
      width: 100,
      render: (text) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: '领域',
      dataIndex: 'domain',
      key: 'domain',
      width: 150,
      render: (domains: string[]) => (
        <Space size={4}>
          {domains.map(d => (
            <Tag key={d} color={domainColors[d]}>{domainLabels[d]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '综合得分',
      dataIndex: ['scores', 'overall'],
      key: 'overall',
      width: 120,
      sorter: (a, b) => a.scores.overall - b.scores.overall,
      render: (score) => (
        <Statistic 
          value={score} 
          suffix="/ 100" 
          valueStyle={{ fontSize: 14, color: score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : '#faad14' }}
        />
      ),
    },
    {
      title: '能力标签',
      dataIndex: 'capabilities',
      key: 'capabilities',
      width: 200,
      render: (capabilities: string[]) => (
        <Space size={4} wrap>
          {capabilities.slice(0, 3).map(cap => (
            <Tag key={cap} style={{ fontSize: 11 }}>{cap}</Tag>
          ))}
          {capabilities.length > 3 && (
            <Tag style={{ fontSize: 11 }}>+{capabilities.length - 3}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title={starredModels.has(record.id) ? '取消收藏' : '收藏'}>
            <Button 
              type="text" 
              size="small"
              icon={starredModels.has(record.id) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStar(record.id);
              }}
            />
          </Tooltip>
          <Button 
            type={selectedModels.some(m => m.id === record.id) ? 'primary' : 'default'}
            size="small"
            icon={selectedModels.some(m => m.id === record.id) ? <CheckCircleOutlined /> : <PlusOutlined />}
            onClick={() => handleToggleModel(record)}
          >
            {selectedModels.some(m => m.id === record.id) ? '已选' : '选择'}
          </Button>
        </Space>
      ),
    },
  ];

  const tagOptions = [
    '性能对比',
    '选型决策',
    '综合评测',
    '代码能力',
    '语言理解',
    '逻辑推理',
    '知识问答',
    '专项测试',
  ];

  const categoryOptions = [
    '综合对比',
    '代码能力对比',
    '语言能力对比',
    '推理能力对比',
    '知识问答对比',
    '多语言对比',
  ];

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Search
                  placeholder="搜索模型名称或组织"
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Select
                  value={selectedDomain}
                  onChange={setSelectedDomain}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="all">全部领域</Select.Option>
                  <Select.Option value="general">通用</Select.Option>
                  <Select.Option value="medical">医疗</Select.Option>
                  <Select.Option value="code">代码</Select.Option>
                  <Select.Option value="finance">金融</Select.Option>
                  <Select.Option value="legal">法律</Select.Option>
                </Select>
              </Col>
              <Col span={4}>
                <Text type="secondary">
                  共 {filteredModels.length} 个已测试模型
                </Text>
              </Col>
            </Row>
          </div>

          {selectedModels.length > 0 && (
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                background: '#1a1a2e', 
                border: '1px solid #303030',
              }}
              title={
                <Space>
                  <Badge count={selectedModels.length} style={{ backgroundColor: '#1890ff' }} />
                  <span>已选模型</span>
                </Space>
              }
              extra={
                <Button 
                  type="text" 
                  size="small" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleClearAll}
                >
                  清空
                </Button>
              }
            >
              <Space wrap>
                {selectedModels.map(model => (
                  <Tag 
                    key={model.id} 
                    closable 
                    onClose={() => handleRemoveSelected(model.id)}
                    style={{ padding: '4px 8px' }}
                  >
                    <Space size={4}>
                      <span style={{ fontWeight: 500 }}>{model.name}</span>
                      <Text type="secondary" style={{ fontSize: 11 }}>{model.params}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        得分: {model.scores.overall}
                      </Text>
                    </Space>
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          <Table
            dataSource={filteredModels}
            columns={modelColumns}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size="small"
            scroll={{ x: 900 }}
            onRow={(record) => ({
              onClick: () => handleToggleModel(record),
              style: { 
                cursor: 'pointer',
                background: selectedModels.some(m => m.id === record.id) ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
              },
            })}
          />
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Card style={{ background: '#1a1a2e', border: '1px solid #303030' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>对比名称 *</Text>
                <Input
                  placeholder="请输入对比名称"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>对比描述</Text>
                <Input.TextArea
                  placeholder="请输入对比描述（可选）"
                  value={comparisonDescription}
                  onChange={(e) => setComparisonDescription(e.target.value)}
                  rows={3}
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>对比分类</Text>
                <Select
                  value={comparisonCategory}
                  onChange={setComparisonCategory}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {categoryOptions.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>标签</Text>
                <Select
                  mode="multiple"
                  placeholder="选择标签"
                  value={comparisonTags}
                  onChange={setComparisonTags}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {tagOptions.map(tag => (
                    <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                  ))}
                </Select>
              </div>

              <Divider style={{ borderColor: '#303030' }} />

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>已选模型 ({selectedModels.length})</Text>
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {selectedModels.map((model, index) => (
                      <Tag key={model.id} color={index === 0 ? 'blue' : index === 1 ? 'green' : 'gold'}>
                        {model.name} ({model.scores.overall}分)
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>
            </Space>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={null}
      style={{ top: 20 }}
      bodyStyle={{ padding: 24 }}
      title={
        <Space>
          <SwapOutlined style={{ color: '#1890ff' }} />
          <span>创建模型对比</span>
        </Space>
      }
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          { title: '选择模型', description: '选择要对比的模型' },
          { title: '配置信息', description: '填写对比基本信息' },
        ]}
      />

      {renderStepContent()}

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          {currentStep > 0 && (
            <Button onClick={handlePrevStep}>
              上一步
            </Button>
          )}
          {currentStep < 1 && (
            <Button 
              type="primary" 
              onClick={handleNextStep}
              disabled={selectedModels.length < 2}
            >
              下一步 ({selectedModels.length}/5 已选)
            </Button>
          )}
          {currentStep === 1 && (
            <Button 
              type="primary" 
              onClick={handleSubmit}
              icon={<ThunderboltOutlined />}
            >
              创建对比
            </Button>
          )}
          <Button onClick={handleClose}>
            取消
          </Button>
        </Space>
      </div>
    </Modal>
  );
};
