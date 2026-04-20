import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Button, Space, Tag, message, Affix, Drawer, Spin, Alert } from 'antd';
import { 
  TrophyOutlined, 
  SwapOutlined, 
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { AcceleratorLeaderboard } from '../components/Accelerator/AcceleratorLeaderboard';
import { AcceleratorLifecycleManager } from '../components/Accelerator/AcceleratorLifecycleManager';
import { useAccelerators } from '../hooks/useAccelerators';
import type { Accelerator } from '../types/apiTypes';

const { Content } = Layout;

export const AcceleratorTestResultManagementWithAPI: React.FC = () => {
  const [selectedCards, setSelectedCards] = useState<Accelerator[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  const { 
    accelerators, 
    loading, 
    error, 
    refreshAccelerators 
  } = useAccelerators({ pageSize: 100 });

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleCardSelect = (cards: Accelerator[]) => {
    setSelectedCards(cards);
  };

  const handleStartComparison = () => {
    if (selectedCards.length < 2) {
      message.warning('请选择至少 2 张加速卡进行对比');
      return;
    }
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
  };

  const testedCount = accelerators.filter(c => c.status === 'tested').length;
  const testingCount = accelerators.filter(c => c.status === 'testing').length;
  const pendingCount = accelerators.filter(c => c.status === 'pending').length;
  const avgScore = accelerators
    .filter(c => c.status === 'tested')
    .reduce((sum, c) => sum + c.scores.overall, 0) / testedCount || 0;

  if (loading && accelerators.length === 0) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24, textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" tip="加载加速卡数据..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        {error && (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            closable
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={refreshAccelerators}>
                重试
              </Button>
            }
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #303030' }}
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={refreshAccelerators}
                  loading={loading}
                >
                  刷新
                </Button>
              }
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>已测加速卡</span>}
                    value={testedCount}
                    suffix="张"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>测试中</span>}
                    value={testingCount}
                    suffix="张"
                    prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>待测加速卡</span>}
                    value={pendingCount}
                    suffix="张"
                    prefix={<DatabaseOutlined style={{ color: '#faad14' }} />}
                    styles={{ content: { color: '#faad14' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>平均得分</span>}
                    value={avgScore.toFixed(1)}
                    prefix={<TrophyOutlined style={{ color: '#ffd700' }} />}
                    styles={{ content: { color: '#ffd700' } }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24}>
            <AcceleratorLeaderboard 
              onCardSelect={handleCardSelect as any}
            />
          </Col>

          <Col xs={24}>
            <AcceleratorLifecycleManager />
          </Col>
        </Row>

        {selectedCards.length >= 2 && !showComparison && (
          <Affix offsetBottom={24}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(24, 144, 255, 0.4)',
              }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                  <Space>
                    <SwapOutlined style={{ fontSize: 20 }} />
                    <span style={{ fontSize: 16 }}>
                      已选择 <strong>{selectedCards.length}</strong> 张加速卡
                    </span>
                    <Space>
                      {selectedCards.map(c => (
                        <Tag key={c.id} color="#fff" style={{ color: '#1890ff' }}>
                          {c.name}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setSelectedCards([])}>
                      取消选择
                    </Button>
                    <Button 
                      type="primary" 
                      ghost
                      icon={<SwapOutlined />}
                      onClick={handleStartComparison}
                      style={{ background: '#fff', color: '#1890ff' }}
                    >
                      开始对比
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Affix>
        )}

        <Drawer
          title={
            <Space>
              <DashboardOutlined style={{ color: '#1890ff' }} />
              <span>加速卡对比工作台</span>
            </Space>
          }
          placement="right"
          width="90%"
          open={showComparison}
          onClose={handleCloseComparison}
          styles={{
            body: { background: '#141414', padding: 16 },
          }}
        >
          <div style={{ textAlign: 'center', padding: 48 }}>
            <DashboardOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 24 }} />
            <h2 style={{ color: '#fff', marginBottom: 16 }}>加速卡对比分析</h2>
            <p style={{ color: '#999', marginBottom: 24 }}>
              正在对比 {selectedCards.map(c => c.name).join(' vs ')}
            </p>
            <Space>
              {selectedCards.map(c => (
                <Card 
                  key={c.id}
                  size="small"
                  style={{ 
                    background: '#1f1f1f', 
                    border: '1px solid #303030',
                    width: 200,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
                      {c.name}
                    </div>
                    <Tag color="#1890ff">{c.vendor}</Tag>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ffd700' }}>
                        {c.scores.overall.toFixed(1)}
                      </span>
                      <span style={{ color: '#666', marginLeft: 4 }}>分</span>
                    </div>
                  </div>
                </Card>
              ))}
            </Space>
          </div>
        </Drawer>
      </Content>
    </Layout>
  );
};

export default AcceleratorTestResultManagementWithAPI;

/**
 * 使用说明：
 * 
 * 1. 将此文件重命名为 AcceleratorTestResultManagement.tsx
 * 2. 或者修改现有的 AcceleratorTestResultManagement.tsx 文件，参考此文件的实现
 * 
 * 主要改动：
 * - 使用 useAccelerators Hook 替代 mock 数据
 * - 添加加载状态和错误处理
 * - 添加刷新功能
 * - 使用 API 类型定义替代 mock 类型
 * 
 * 注意：
 * - AcceleratorLeaderboard 组件也需要修改以支持 API 数据
 * - 需要确保后端 API 已经实现并正常运行
 * - 需要配置正确的 API_BASE_URL 环境变量
 */
