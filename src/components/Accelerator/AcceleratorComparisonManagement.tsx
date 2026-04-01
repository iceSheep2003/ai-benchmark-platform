import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Tag, Button, Space, Input, Select, Empty, message, Dropdown, Typography, Tabs, Badge, Statistic } from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  MoreOutlined, 
  EyeOutlined, 
  EditOutlined, 
  CopyOutlined, 
  DeleteOutlined, 
  ShareAltOutlined,
  StarOutlined,
  StarFilled,
  AppstoreOutlined,
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { AcceleratorComparisonResult } from '../../mockData/acceleratorMock';
import { acceleratorComparisonResults, acceleratorCategories } from '../../mockData/acceleratorMock';
import { AcceleratorComparisonDetailModal } from '../Accelerator/AcceleratorComparisonDetailModal';
import { CreateAcceleratorComparisonModal, type ComparisonFormData } from '../Accelerator/CreateAcceleratorComparisonModal';

const { Text } = Typography;

const categoryColors: Record<string, string> = {
  '训练对比': 'blue',
  '推理对比': 'green',
  '国产对比': 'purple',
  '能效对比': 'orange',
  '成本对比': 'cyan',
};

export const AcceleratorComparisonManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [starredIds, setStarredIds] = useState<Set<string>>(
    new Set(acceleratorComparisonResults.filter(r => r.isStarred).map(r => r.id))
  );
  const [currentUserId] = useState<string>('user-001');
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<AcceleratorComparisonResult | null>(null);

  const filteredResults = useMemo(() => {
    let results = [...acceleratorComparisonResults];
    
    results = results.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           r.description.toLowerCase().includes(searchText.toLowerCase()) ||
                           r.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (activeTab) {
      case 'starred':
        results = results.filter(r => starredIds.has(r.id));
        break;
      case 'mine':
        results = results.filter(r => r.creatorId === currentUserId);
        break;
      case 'shared':
        results = results.filter(r => r.isPublic);
        break;
    }

    return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [searchText, selectedCategory, activeTab, starredIds, currentUserId]);

  const stats = useMemo(() => ({
    total: acceleratorComparisonResults.length,
    starred: starredIds.size,
    mine: acceleratorComparisonResults.filter(r => r.creatorId === currentUserId).length,
    shared: acceleratorComparisonResults.filter(r => r.isPublic).length,
    involvedCards: new Set(acceleratorComparisonResults.flatMap(r => r.cards.map(c => c.id))).size,
  }), [starredIds, currentUserId]);

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarred = new Set(starredIds);
    if (newStarred.has(id)) {
      newStarred.delete(id);
      message.success('已取消收藏');
    } else {
      newStarred.add(id);
      message.success('已添加收藏');
    }
    setStarredIds(newStarred);
  };

  const handleViewDetail = (result: AcceleratorComparisonResult) => {
    setSelectedComparison(result);
    setDetailModalVisible(true);
  };

  const handleCreateComparison = () => {
    setCreateModalVisible(true);
  };

  const getCardMenuItems = (result: AcceleratorComparisonResult): MenuProps => ({
    items: [
      { key: 'view', icon: <EyeOutlined />, label: '查看详情', onClick: () => handleViewDetail(result) },
      { key: 'edit', icon: <EditOutlined />, label: '编辑对比' },
      { key: 'copy', icon: <CopyOutlined />, label: '复制对比' },
      { key: 'share', icon: <ShareAltOutlined />, label: '分享对比' },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除对比', danger: true },
    ],
  });

  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: (
        <Space>
          <AppstoreOutlined />
          <span>全部对比</span>
          <Badge count={stats.total} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      ),
    },
    {
      key: 'starred',
      label: (
        <Space>
          <StarFilled style={{ color: '#faad14' }} />
          <span>收藏对比</span>
          <Badge count={stats.starred} style={{ backgroundColor: '#faad14' }} />
        </Space>
      ),
    },
    {
      key: 'mine',
      label: (
        <Space>
          <UserOutlined />
          <span>我的对比</span>
          <Badge count={stats.mine} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
    },
    {
      key: 'shared',
      label: (
        <Space>
          <TeamOutlined />
          <span>公开对比</span>
          <Badge count={stats.shared} style={{ backgroundColor: '#722ed1' }} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#141414', minHeight: '100vh' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title={<span style={{ color: '#8c8c8c' }}>当前筛选结果</span>} 
                  value={filteredResults.length} 
                  suffix="项" 
                  valueStyle={{ color: '#1890ff' }} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<span style={{ color: '#8c8c8c' }}>涉及加速卡</span>} 
                  value={stats.involvedCards} 
                  suffix="张" 
                  valueStyle={{ color: '#52c41a' }} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<span style={{ color: '#8c8c8c' }}>已收藏</span>} 
                  value={stats.starred} 
                  suffix="项" 
                  valueStyle={{ color: '#faad14' }} 
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<span style={{ color: '#8c8c8c' }}>公开对比</span>} 
                  value={stats.shared} 
                  suffix="项" 
                  valueStyle={{ color: '#722ed1' }} 
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              tabBarExtraContent={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateComparison}>
                  新建对比
                </Button>
              }
            />

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Input
                  placeholder="搜索对比名称、描述、标签..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <Select
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  style={{ width: '100%' }}
                  placeholder="选择分类"
                  options={[
                    { label: '全部分类', value: 'all' },
                    ...acceleratorCategories.map(c => ({ label: c, value: c })),
                  ]}
                />
              </Col>
            </Row>

            {filteredResults.length === 0 ? (
              <Empty
                description={
                  activeTab === 'starred' 
                    ? '暂无收藏的对比，点击对比卡片上的星标进行收藏'
                    : activeTab === 'mine'
                    ? '您还没有创建过对比'
                    : activeTab === 'shared'
                    ? '暂无公开的对比'
                    : '暂无对比结果'
                }
                style={{ padding: '60px 0' }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {filteredResults.map((result) => (
                  <Col span={8} key={result.id}>
                    <Card
                      hoverable
                      style={{ 
                        background: '#141414', 
                        border: '1px solid #303030',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      styles={{ body: { padding: 16 } }}
                      onClick={() => handleViewDetail(result)}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: 15, 
                              fontWeight: 'bold', 
                              color: '#fff',
                              marginBottom: 4,
                            }}>
                              {result.name}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {result.description}
                            </Text>
                          </div>
                          <Button
                            type="text"
                            size="small"
                            icon={starredIds.has(result.id) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={(e) => handleToggleStar(result.id, e)}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Space size={4} wrap>
                          {result.cards.slice(0, 3).map((card, index) => (
                            <Tag 
                              key={card.id} 
                              color={index === 0 ? 'blue' : index === 1 ? 'green' : 'gold'}
                            >
                              {card.name}
                            </Tag>
                          ))}
                          {result.cards.length > 3 && (
                            <Tag>+{result.cards.length - 3}</Tag>
                          )}
                        </Space>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Space size={4} wrap>
                          {result.tags.slice(0, 2).map(tag => (
                            <Tag key={tag} style={{ fontSize: 11 }}>{tag}</Tag>
                          ))}
                          {result.tags.length > 2 && (
                            <Tag style={{ fontSize: 11 }}>+{result.tags.length - 2}</Tag>
                          )}
                        </Space>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Row gutter={8}>
                          <Col span={12}>
                            <div style={{ 
                              background: '#1a1a2e', 
                              borderRadius: 4, 
                              padding: 8,
                              textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                                {result.overallAnalysis.bestCard}
                              </div>
                              <div style={{ fontSize: 11, color: '#666' }}>最佳加速卡</div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ 
                              background: '#1a1a2e', 
                              borderRadius: 4, 
                              padding: 8,
                              textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                                {result.cards.length}
                              </div>
                              <div style={{ fontSize: 11, color: '#666' }}>对比加速卡</div>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          {result.isPublic ? (
                            <Tag color="green" icon={<TeamOutlined />}>公开</Tag>
                          ) : (
                            <Tag color="default" icon={<UserOutlined />}>私有</Tag>
                          )}
                          <Tag color={categoryColors[result.category] || 'default'}>{result.category}</Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {result.updatedAt.split(' ')[0]}
                        </Text>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(result);
                            }}
                          >
                            查看详情
                          </Button>
                        </Space>
                        <Dropdown menu={getCardMenuItems(result)} trigger={['click']}>
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<MoreOutlined />} 
                            onClick={(e) => e.stopPropagation()} 
                          />
                        </Dropdown>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <AcceleratorComparisonDetailModal
        visible={detailModalVisible}
        comparisonResult={selectedComparison}
        onClose={() => setDetailModalVisible(false)}
      />

      <CreateAcceleratorComparisonModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={(values: ComparisonFormData) => {
          console.log('Create comparison:', values);
          setCreateModalVisible(false);
          message.success('对比创建成功');
        }}
      />
    </div>
  );
};

export default AcceleratorComparisonManagement;
