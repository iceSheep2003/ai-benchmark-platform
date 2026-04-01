import React, { useState } from 'react';
import { Layout, Card, Row, Col, Statistic, Button, Space, Tag, message, Affix, Drawer } from 'antd';
import { 
  TrophyOutlined, 
  SwapOutlined, 
  DatabaseOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { SmartLeaderboard } from '../components/TestResult/SmartLeaderboard';
import { ComparisonArena } from '../components/TestResult/ComparisonArena';
import { TestLifecycleManager } from '../components/TestResult/TestLifecycleManager';
import { TestReportModal } from '../components/TestResult/TestReportModal';
import { RetestModal } from '../components/TestResult/RetestModal';
import type { TestModel } from '../mockData/testResultMock';
import { mockTestModels } from '../mockData/testResultMock';

const { Content } = Layout;

export const TestResultManagement: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<TestModel[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [retestModalVisible, setRetestModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TestModel | null>(null);

  const handleModelSelect = (models: TestModel[]) => {
    setSelectedModels(models);
  };

  const handleStartComparison = () => {
    if (selectedModels.length < 2) {
      message.warning('请选择至少 2 个模型进行对比');
      return;
    }
    setShowComparison(true);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
  };

  const handleViewReport = (model: TestModel) => {
    setSelectedModel(model);
    setReportModalVisible(true);
  };

  const handleRetest = (model: TestModel) => {
    setSelectedModel(model);
    setRetestModalVisible(true);
  };

  const handleStartTest = (models: TestModel[], _config: unknown) => {
    message.success(`已启动 ${models.length} 个模型的测试任务`);
  };

  const testedCount = mockTestModels.filter(m => m.status === 'tested').length;
  const testingCount = mockTestModels.filter(m => m.status === 'testing').length;
  const pendingCount = mockTestModels.filter(m => m.status === 'pending').length;
  const avgScore = mockTestModels
    .filter(m => m.status === 'tested')
    .reduce((sum, m) => sum + m.scores.overall, 0) / testedCount || 0;

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card 
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #303030' }}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>已测模型</span>}
                    value={testedCount}
                    suffix="个"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>测试中</span>}
                    value={testingCount}
                    suffix="个"
                    prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title={<span style={{ color: '#999' }}>待测模型</span>}
                    value={pendingCount}
                    suffix="个"
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
            <SmartLeaderboard 
              onModelSelect={handleModelSelect}
            />
          </Col>

          <Col xs={24}>
            <TestLifecycleManager
              onViewReport={handleViewReport}
              onRetest={handleRetest}
              onStartTest={handleStartTest}
            />
          </Col>
        </Row>

        {selectedModels.length >= 2 && !showComparison && (
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
                      已选择 <strong>{selectedModels.length}</strong> 个模型
                    </span>
                    <Space>
                      {selectedModels.map(m => (
                        <Tag key={m.id} color="#fff" style={{ color: '#1890ff' }}>
                          {m.name}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setSelectedModels([])}>
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
              <SwapOutlined style={{ color: '#1890ff' }} />
              <span>模型对比工作台</span>
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
          <ComparisonArena 
            models={selectedModels}
            onClose={handleCloseComparison}
          />
        </Drawer>

        <TestReportModal
          visible={reportModalVisible}
          model={selectedModel}
          onClose={() => {
            setReportModalVisible(false);
            setSelectedModel(null);
          }}
        />

        <RetestModal
          visible={retestModalVisible}
          model={selectedModel}
          onClose={() => {
            setRetestModalVisible(false);
            setSelectedModel(null);
          }}
        />
      </Content>
    </Layout>
  );
};

export default TestResultManagement;
