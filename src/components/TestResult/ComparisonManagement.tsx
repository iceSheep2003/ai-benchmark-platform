import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Tag, Button, Space, Input, Select, Empty, Modal, message, Dropdown, Typography, Tabs, Badge, Statistic } from 'antd';
import type { MenuProps, TabsProps } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
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
import type { ComparisonResult } from '../../mockData/comparisonResultMock';
import { comparisonResults, comparisonTags, comparisonCategories } from '../../mockData/comparisonResultMock';
import { ComparisonDetailModal } from './ComparisonDetailModal';
import { CreateComparisonModal } from './CreateComparisonModal';
import type { ComparisonFormData } from './CreateComparisonModal';

const { Text } = Typography;

const currentUserId = 'user-001';

export const ComparisonManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(
    new Set(comparisonResults.filter(r => r.isStarred).map(r => r.id))
  );

  const allResults = useMemo(() => {
    return comparisonResults.map(r => ({
      ...r,
      isStarred: starredIds.has(r.id),
    }));
  }, [starredIds]);

  const filteredResults = useMemo(() => {
    let results = allResults;

    if (activeTab === 'starred') {
      results = results.filter(r => r.isStarred);
    } else if (activeTab === 'mine') {
      results = results.filter(r => r.creatorId === currentUserId);
    } else if (activeTab === 'shared') {
      results = results.filter(r => r.isPublic);
    }

    return results.filter(result => {
      const matchesSearch = result.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           result.description.toLowerCase().includes(searchText.toLowerCase()) ||
                           result.models.some(m => m.name.toLowerCase().includes(searchText.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || result.tags.some(tag => selectedTags.includes(tag));
      const matchesCategory = selectedCategory === 'all' || result.category === selectedCategory;
      return matchesSearch && matchesTags && matchesCategory;
    });
  }, [allResults, activeTab, searchText, selectedTags, selectedCategory]);

  const stats = useMemo(() => ({
    total: allResults.length,
    starred: allResults.filter(r => r.isStarred).length,
    mine: allResults.filter(r => r.creatorId === currentUserId).length,
    shared: allResults.filter(r => r.isPublic).length,
  }), [allResults]);

  const handleCreateComparison = () => {
    setCreateVisible(true);
  };

  const handleCreateSubmit = (data: ComparisonFormData) => {
    console.log('创建对比:', data);
    message.success(`对比 "${data.name}" 创建成功`);
  };

  const handleViewDetail = (result: ComparisonResult) => {
    setSelectedResult(result);
    setDetailVisible(true);
  };

  const handleEdit = (result: ComparisonResult) => {
    message.info(`编辑对比: ${result.name}`);
  };

  const handleCopy = (result: ComparisonResult) => {
    message.success(`已复制对比: ${result.name}`);
  };

  const handleDelete = (result: ComparisonResult) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除对比 "${result.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('对比已删除');
      },
    });
  };

  const handleShare = (result: ComparisonResult) => {
    message.info(`分享对比: ${result.name}`);
  };

  const handleToggleStar = (resultId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const newStarred = new Set(starredIds);
    if (newStarred.has(resultId)) {
      newStarred.delete(resultId);
      message.info('已取消收藏');
    } else {
      newStarred.add(resultId);
      message.success('已收藏');
    }
    setStarredIds(newStarred);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredResults.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResults.map(r => r.id));
    }
  };

  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedIds.length} 个对比吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.success('批量删除成功');
        setSelectedIds([]);
      },
    });
  };

  const getMoreMenuItems = (result: ComparisonResult): MenuProps => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEdit(result),
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '创建副本',
        onClick: () => handleCopy(result),
      },
      {
        key: 'share',
        icon: <ShareAltOutlined />,
        label: '分享',
        onClick: () => handleShare(result),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(result),
      },
    ],
  });

  const renderComparisonCard = (result: ComparisonResult & { isStarred: boolean }) => (
    <Col xs={24} sm={12} lg={8} xl={6} key={result.id}>
      <Card
        hoverable
        style={{ 
          background: '#141414', 
          border: '1px solid #303030',
          height: '100%',
          cursor: 'pointer',
        }}
        onClick={() => handleViewDetail(result)}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={4}>
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
                icon={result.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                onClick={(e) => handleToggleStar(result.id, e)}
              />
            </div>
          </Space>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Space size={4} wrap>
            {result.models.slice(0, 3).map((model, index) => (
              <Tag key={model.id} color={index === 0 ? 'blue' : index === 1 ? 'green' : 'gold'}>
                {model.name}
              </Tag>
            ))}
            {result.models.length > 3 && (
              <Tag>+{result.models.length - 3}</Tag>
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
                  {result.overallAnalysis.bestModel}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>最佳模型</div>
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
                  {result.models.length}
                </div>
                <div style={{ fontSize: 11, color: '#666' }}>对比模型</div>
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
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {result.createdAt}
            </Text>
          </Space>
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
              查看
            </Button>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(result)}
            >
              编辑
            </Button>
          </Space>
          <Dropdown menu={getMoreMenuItems(result)} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>

        {selectedIds.includes(result.id) && (
          <div style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            background: '#1890ff',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
          }}>
            ✓ 已选择
          </div>
        )}
      </Card>
    </Col>
  );

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
    <div>
      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #303030',
          marginBottom: 16,
        }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
                对比分析管理
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateComparison}
              >
                新建对比
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #303030',
          marginBottom: 16,
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: -16 }}
        />
      </Card>

      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #303030',
          marginBottom: 16,
        }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="搜索对比名称、模型名称..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              style={{ width: '100%' }}
              value={selectedTags}
              onChange={setSelectedTags}
              options={comparisonTags.map(tag => ({ label: tag, value: tag }))}
              maxTagCount={2}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="选择分类"
              style={{ width: '100%' }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={[
                { label: '全部', value: 'all' },
                ...comparisonCategories.map(cat => ({ label: cat, value: cat })),
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              {selectedIds.length > 0 && (
                <>
                  <Button onClick={handleBatchDelete} danger>
                    批量删除 ({selectedIds.length})
                  </Button>
                  <Button onClick={() => setSelectedIds([])}>
                    取消选择
                  </Button>
                </>
              )}
              {selectedIds.length === 0 && (
                <Button icon={<FilterOutlined />}>
                  高级筛选
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {filteredResults.length === 0 ? (
        <Card 
          style={{ 
            background: '#1f1f1f', 
            border: '1px solid #303030',
            textAlign: 'center',
            padding: '60px 0',
          }}
        >
          <Empty
            description={
              activeTab === 'starred' 
                ? '暂无收藏的对比，点击对比卡片上的星标进行收藏'
                : activeTab === 'mine'
                ? '您还没有创建过对比'
                : activeTab === 'shared'
                ? '暂无公开的对比'
                : searchText || selectedTags.length > 0 || selectedCategory !== 'all' 
                  ? '未找到匹配的对比结果' 
                  : '暂无对比结果，点击"新建对比"开始创建'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateComparison}>
              新建对比
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          <Card 
            style={{ 
              background: '#1f1f1f', 
              border: '1px solid #303030',
              marginBottom: 16,
            }}
          >
            <Row gutter={24}>
              <Col span={6}>
                <Statistic 
                  title="当前筛选结果" 
                  value={filteredResults.length} 
                  suffix="个对比"
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="涉及模型" 
                  value={new Set(filteredResults.flatMap(r => r.models.map(m => m.id))).size}
                  suffix="个"
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="已收藏" 
                  value={filteredResults.filter(r => r.isStarred).length}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="公开对比" 
                  value={filteredResults.filter(r => r.isPublic).length}
                  styles={{ content: { color: '#722ed1' } }}
                />
              </Col>
            </Row>
          </Card>

          {selectedIds.length === 0 && (
            <div style={{ marginBottom: 16 }}>
              <Button onClick={handleSelectAll}>
                全选
              </Button>
            </div>
          )}

          <Row gutter={[16, 16]}>
            {filteredResults.map(renderComparisonCard)}
          </Row>
        </>
      )}

      <ComparisonDetailModal
        visible={detailVisible}
        comparisonResult={selectedResult}
        onClose={() => {
          setDetailVisible(false);
          setSelectedResult(null);
        }}
      />

      <CreateComparisonModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};

export default ComparisonManagement;
