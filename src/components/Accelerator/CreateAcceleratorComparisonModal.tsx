import React, { useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Tag, Card, Row, Col, Space, Button, Typography, Progress, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { AcceleratorCard } from '../../mockData/acceleratorMock';
import { acceleratorCards, acceleratorCategories, acceleratorTags } from '../../mockData/acceleratorMock';

const { Text } = Typography;

export interface ComparisonFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  cardIds: string[];
  weights: Record<string, number>;
}

interface CreateAcceleratorComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ComparisonFormData) => void;
}

const vendorColors: Record<string, string> = {
  'NVIDIA': '#76b900',
  'AMD': '#ed1c24',
  '华为': '#cf0a2c',
  '寒武纪': '#1890ff',
  '英特尔': '#0071c5',
  '壁仞': '#722ed1',
  '燧原': '#faad14',
};

const dimensionOptions = [
  { key: 'computePerformance', label: '计算性能', defaultWeight: 25 },
  { key: 'memoryPerformance', label: '内存性能', defaultWeight: 20 },
  { key: 'inferenceSpeed', label: '推理速度', defaultWeight: 15 },
  { key: 'trainingSpeed', label: '训练速度', defaultWeight: 20 },
  { key: 'energyEfficiency', label: '能效', defaultWeight: 10 },
  { key: 'costEfficiency', label: '性价比', defaultWeight: 10 },
];

export const CreateAcceleratorComparisonModal: React.FC<CreateAcceleratorComparisonModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [selectedCards, setSelectedCards] = useState<AcceleratorCard[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    dimensionOptions.forEach(d => {
      initial[d.key] = d.defaultWeight;
    });
    return initial;
  });

  const filteredCards = useMemo(() => {
    return acceleratorCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           card.vendor.toLowerCase().includes(searchText.toLowerCase());
      const matchesVendor = selectedVendor === 'all' || card.vendor === selectedVendor;
      return matchesSearch && matchesVendor;
    });
  }, [searchText, selectedVendor]);

  const handleAddCard = (card: AcceleratorCard) => {
    if (selectedCards.find(c => c.id === card.id)) {
      message.warning('该加速卡已添加');
      return;
    }
    if (selectedCards.length >= 5) {
      message.warning('最多选择5张加速卡进行对比');
      return;
    }
    setSelectedCards([...selectedCards, card]);
  };

  const handleRemoveCard = (cardId: string) => {
    setSelectedCards(selectedCards.filter(c => c.id !== cardId));
  };

  const handleWeightChange = (key: string, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (selectedCards.length < 2) {
        message.error('请至少选择2张加速卡进行对比');
        return;
      }
      onSubmit({
        ...values,
        cardIds: selectedCards.map(c => c.id),
        weights,
      });
      form.resetFields();
      setSelectedCards([]);
    });
  };

  const handleClose = () => {
    form.resetFields();
    setSelectedCards([]);
    onClose();
  };

  const vendors = useMemo(() => {
    return ['all', ...new Set(acceleratorCards.map(c => c.vendor))];
  }, []);

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      onOk={handleSubmit}
      width={1000}
      title="新建加速卡对比"
      okText="创建对比"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="对比名称"
              rules={[{ required: true, message: '请输入对比名称' }]}
            >
              <Input placeholder="请输入对比名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="对比分类"
              rules={[{ required: true, message: '请选择对比分类' }]}
            >
              <Select
                placeholder="选择对比分类"
                options={acceleratorCategories.map(c => ({ label: c, value: c }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="对比描述">
          <Input.TextArea rows={2} placeholder="请输入对比描述" />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="选择或输入标签"
            options={acceleratorTags.map(t => ({ label: t, value: t }))}
          />
        </Form.Item>

        <Card size="small" title="维度权重配置" style={{ marginBottom: 16, background: '#1f1f1f' }}>
          <Row gutter={16}>
            {dimensionOptions.map((dim) => (
              <Col span={8} key={dim.key}>
                <Space>
                  <Text>{dim.label}</Text>
                  <Select
                    value={weights[dim.key]}
                    onChange={(v) => handleWeightChange(dim.key, v)}
                    style={{ width: 80 }}
                    options={Array.from({ length: 11 }, (_, i) => ({ 
                      label: `${i * 10}%`, 
                      value: i * 10 
                    }))}
                  />
                </Space>
              </Col>
            ))}
          </Row>
        </Card>

        <Card size="small" title={`已选加速卡 (${selectedCards.length}/5)`} style={{ marginBottom: 16, background: '#1f1f1f' }}>
          {selectedCards.length === 0 ? (
            <Text type="secondary">请从下方列表选择加速卡</Text>
          ) : (
            <Row gutter={[8, 8]}>
              {selectedCards.map((card) => (
                <Col span={8} key={card.id}>
                  <Card 
                    size="small" 
                    style={{ background: '#262626' }}
                    styles={{ body: { padding: 8 } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Text strong style={{ color: '#fff' }}>{card.name}</Text>
                        <Tag color={vendorColors[card.vendor]}>{card.vendor}</Tag>
                      </Space>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveCard(card.id)}
                        danger
                      />
                    </div>
                    <Progress 
                      percent={card.scores.overall} 
                      size="small"
                      strokeColor="#1890ff"
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        <Card size="small" title="选择加速卡" style={{ background: '#1f1f1f' }}>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Input
                placeholder="搜索加速卡名称、厂商..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                value={selectedVendor}
                onChange={setSelectedVendor}
                style={{ width: '100%' }}
                options={vendors.map(v => ({ label: v === 'all' ? '全部厂商' : v, value: v }))}
              />
            </Col>
          </Row>

          <Row gutter={[8, 8]}>
            {filteredCards.map((card) => {
              const isSelected = selectedCards.find(c => c.id === card.id);
              return (
                <Col span={6} key={card.id}>
                  <Card
                    hoverable
                    size="small"
                    style={{ 
                      background: isSelected ? '#177ddc' : '#262626',
                      border: isSelected ? '1px solid #1890ff' : '1px solid #303030',
                      cursor: isSelected ? 'default' : 'pointer',
                    }}
                    styles={{ body: { padding: 8 } }}
                    onClick={() => !isSelected && handleAddCard(card)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong style={{ color: '#fff', fontSize: 12 }}>{card.name}</Text>
                      {isSelected && <Tag color="success">已选</Tag>}
                    </div>
                    <Space size={4} style={{ marginTop: 4 }}>
                      <Tag color={vendorColors[card.vendor]} style={{ fontSize: 10 }}>
                        {card.vendor}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 10 }}>{card.memory_gb}GB</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: isSelected ? '#fff' : '#8c8c8c' }}>
                        得分: <Text strong style={{ color: '#52c41a' }}>{card.scores.overall}</Text>
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};

export default CreateAcceleratorComparisonModal;
