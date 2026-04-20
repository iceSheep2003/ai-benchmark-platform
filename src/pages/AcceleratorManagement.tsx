import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Table, Button, Space, Tag, Modal, Form, Input, Select, InputNumber, message, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AcceleratorCard } from '../mockData/acceleratorMock';
import { acceleratorCards, acceleratorStatusMap, vendorOptions } from '../mockData/acceleratorMock';

const { Content } = Layout;
const { TextArea } = Input;

const AcceleratorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [accelerators, setAccelerators] = useState<AcceleratorCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccelerators();
  }, []);

  const loadAccelerators = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAccelerators(acceleratorCards);
    } catch (error) {
      message.error('加载加速卡列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      console.log('创建加速卡:', values);
      message.success('加速卡创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadAccelerators();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleViewDetail = (id: string) => {
    navigate(`/accelerator/detail?id=${id}`);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个加速卡吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          console.log('删除加速卡:', id);
          message.success('删除成功');
          loadAccelerators();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<AcceleratorCard> = [
    {
      title: '加速卡名称',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text: string) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '厂商',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 120,
      render: (vendor: string) => <Tag color="blue">{vendor}</Tag>,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 150,
    },
    {
      title: '显存',
      dataIndex: 'memory_gb',
      key: 'memory_gb',
      width: 100,
      render: (value: number) => `${value} GB`,
    },
    {
      title: '架构',
      dataIndex: 'architecture',
      key: 'architecture',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AcceleratorCard['status']) => {
        const config = acceleratorStatusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '综合评分',
      dataIndex: ['scores', 'overall'],
      key: 'overall',
      width: 120,
      render: (score: number) => (
        <span style={{ color: score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f', fontWeight: 'bold' }}>
          {score?.toFixed(1) || '-'}
        </span>
      ),
      sorter: (a, b) => (a.scores?.overall || 0) - (b.scores?.overall || 0),
    },
    {
      title: '计算性能',
      dataIndex: ['scores', 'compute'],
      key: 'compute',
      width: 120,
      render: (score: number) => <span style={{ color: '#1890ff' }}>{score?.toFixed(1) || '-'}</span>,
    },
    {
      title: '内存性能',
      dataIndex: ['scores', 'memory'],
      key: 'memory',
      width: 120,
      render: (score: number) => <span style={{ color: '#52c41a' }}>{score?.toFixed(1) || '-'}</span>,
    },
    {
      title: '带宽',
      dataIndex: ['scores', 'bandwidth'],
      key: 'bandwidth',
      width: 100,
      render: (score: number) => score?.toFixed(1) || '-',
    },
    {
      title: '功耗效率',
      dataIndex: ['scores', 'power_efficiency'],
      key: 'power_efficiency',
      width: 120,
      render: (score: number) => score?.toFixed(1) || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space size={[0, 4]} wrap>
          {tags?.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => message.info('编辑功能开发中')}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: accelerators.length,
    tested: accelerators.filter(a => a.status === 'tested').length,
    testing: accelerators.filter(a => a.status === 'testing').length,
    pending: accelerators.filter(a => a.status === 'pending').length,
    avgScore: accelerators
      .filter(a => a.scores?.overall)
      .reduce((sum, a) => sum + (a.scores?.overall || 0), 0) / accelerators.filter(a => a.scores?.overall).length || 0,
  };

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #303030' }}
            >
              <Row gutter={16}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>总加速卡数</span>}
                    value={stats.total}
                    suffix="张"
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>已测试</span>}
                    value={stats.tested}
                    suffix="张"
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>测试中</span>}
                    value={stats.testing}
                    suffix="张"
                    styles={{ content: { color: '#faad14' } }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>平均评分</span>}
                    value={stats.avgScore.toFixed(1)}
                    styles={{ content: { color: '#722ed1' } }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title="加速卡列表"
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadAccelerators}>
                    刷新
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    添加加速卡
                  </Button>
                </Space>
              }
              style={{ background: '#1f1f1f', border: '1px solid #303030' }}
            >
              <Table
                dataSource={accelerators}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 1800 }}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          title="添加加速卡"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
          >
            <Form.Item
              label="加速卡名称"
              name="name"
              rules={[{ required: true, message: '请输入加速卡名称' }]}
            >
              <Input placeholder="例如：NVIDIA H100" />
            </Form.Item>

            <Form.Item
              label="厂商"
              name="vendor"
              rules={[{ required: true, message: '请选择厂商' }]}
            >
              <Select placeholder="选择厂商">
                {vendorOptions.map(v => (
                  <Select.Option key={v} value={v}>{v}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="型号"
              name="model"
              rules={[{ required: true, message: '请输入型号' }]}
            >
              <Input placeholder="例如：H100" />
            </Form.Item>

            <Form.Item
              label="显存大小 (GB)"
              name="memory_gb"
              rules={[{ required: true, message: '请输入显存大小' }]}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label="计算能力"
              name="compute_capability"
            >
              <Input placeholder="例如：9.0" />
            </Form.Item>

            <Form.Item
              label="架构"
              name="architecture"
            >
              <Input placeholder="例如：Hopper" />
            </Form.Item>

            <Form.Item
              label="描述"
              name="description"
            >
              <TextArea rows={4} placeholder="加速卡描述信息" />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setCreateModalVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  创建
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default AcceleratorManagement;
