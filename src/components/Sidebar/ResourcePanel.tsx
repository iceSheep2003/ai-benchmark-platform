import { useState, useCallback } from 'react';
import { 
  Layout, 
  Tabs, 
  List, 
  Card, 
  Tag, 
  Input, 
  Space, 
  Typography, 
  Button, 
  Tooltip,
  Empty,
} from 'antd';
import { 
  SearchOutlined, 
  AppstoreOutlined, 
  FileTextOutlined,
  PlusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useOrchestratorStore } from '../../store/orchestratorStore';
import { mockWorkflowTemplates } from '../../mockData/workflowTemplates';

const { Sider } = Layout;
const { Text, Title } = Typography;
const { Search } = Input;

const NODE_TYPES = [
  {
    type: 'data_loader',
    label: 'Data Loader',
    icon: <AppstoreOutlined />,
    description: 'Load and preprocess datasets',
    color: '#1890ff',
  },
  {
    type: 'model_inference',
    label: 'Model Inference',
    icon: <FileTextOutlined />,
    description: 'Execute model inference',
    color: '#52c41a',
  },
  {
    type: 'resource_alloc',
    label: 'Resource Allocation',
    icon: <AppstoreOutlined />,
    description: 'Allocate GPU/CPU resources',
    color: '#faad14',
  },
  {
    type: 'evaluator',
    label: 'Evaluator',
    icon: <InfoCircleOutlined />,
    description: 'Evaluate model performance',
    color: '#722ed1',
  },
  {
    type: 'reporter',
    label: 'Reporter',
    icon: <FileTextOutlined />,
    description: 'Generate reports',
    color: '#eb2f96',
  },
];

export const ResourcePanel = () => {
  const [searchText, setSearchText] = useState('');
  const [templateSearchText, setTemplateSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'components' | 'templates'>('components');
  
  const { loadTemplate } = useOrchestratorStore();

  const filteredTemplates = mockWorkflowTemplates.filter((template) =>
    template.name.toLowerCase().includes(templateSearchText.toLowerCase()) ||
    template.description.toLowerCase().includes(templateSearchText.toLowerCase()) ||
    template.tags.some((tag) => tag.toLowerCase().includes(templateSearchText.toLowerCase()))
  );

  const handleTemplateLoad = useCallback((templateId: string) => {
    loadTemplate(templateId);
  }, [loadTemplate]);

  const handleNodeDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <Sider 
      width={320} 
      style={{ 
        backgroundColor: '#1f1f1f', 
        borderRight: '1px solid #303030',
        overflow: 'auto',
      }}
    >
      <div style={{ padding: '16px' }}>
        <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
          Orchestration Center
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'components' | 'templates')}
          style={{ color: '#ffffff' }}
          items={[
            {
              key: 'components',
              label: (
                <Space>
                  <AppstoreOutlined />
                  Components
                </Space>
              ),
              children: (
                <div>
                  <Search
                    placeholder="Search components..."
                    allowClear
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />

                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Drag components to the canvas
                    </Text>
                  </div>

                  <List
                    dataSource={NODE_TYPES.filter((node) =>
                      node.label.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    renderItem={(node) => (
                      <Card
                        key={node.type}
                        size="small"
                        hoverable
                        draggable
                        onDragStart={(e) => handleNodeDragStart(e, node.type)}
                        style={{
                          marginBottom: 8,
                          backgroundColor: '#2a2a2a',
                          borderColor: '#303030',
                          cursor: 'grab',
                        }}
                        bodyStyle={{ padding: '12px' }}
                      >
                        <Space orientation="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span 
                              style={{ 
                                marginRight: 8, 
                                fontSize: 18, 
                                color: node.color 
                              }}
                            >
                              {node.icon}
                            </span>
                            <Text strong style={{ color: '#ffffff' }}>
                              {node.label}
                            </Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {node.description}
                          </Text>
                          <Tag color={node.color} style={{ alignSelf: 'flex-start' }}>
                            {node.type}
                          </Tag>
                        </Space>
                      </Card>
                    )}
                  />
                </div>
              ),
            },
            {
              key: 'templates',
              label: (
                <Space>
                  <FileTextOutlined />
                  Templates
                </Space>
              ),
              children: (
                <div>
                  <Search
                    placeholder="Search templates..."
                    allowClear
                    prefix={<SearchOutlined />}
                    value={templateSearchText}
                    onChange={(e) => setTemplateSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />

                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Click to load a template
                    </Text>
                  </div>

                  {filteredTemplates.length === 0 ? (
                    <Empty
                      description="No templates found"
                      style={{ marginTop: 32 }}
                    />
                  ) : (
                    <List
                      dataSource={filteredTemplates}
                      renderItem={(template) => (
                        <Card
                          key={template.id}
                          size="small"
                          hoverable
                          onClick={() => handleTemplateLoad(template.id)}
                          style={{
                            marginBottom: 12,
                            backgroundColor: '#2a2a2a',
                            borderColor: '#303030',
                            cursor: 'pointer',
                          }}
                          bodyStyle={{ padding: '12px' }}
                        >
                          <Space orientation="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Text strong style={{ color: '#ffffff', flex: 1 }}>
                                {template.name}
                              </Text>
                              <Tooltip title="Load template">
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTemplateLoad(template.id);
                                  }}
                                />
                              </Tooltip>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {template.description}
                            </Text>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <Tag color="blue">{template.category}</Tag>
                              {template.tags.slice(0, 2).map((tag) => (
                                <Tag key={tag} style={{ fontSize: 11 }}>
                                  {tag}
                                </Tag>
                              ))}
                              {template.tags.length > 2 && (
                                <Tag style={{ fontSize: 11 }}>
                                  +{template.tags.length - 2}
                                </Tag>
                              )}
                            </div>
                          </Space>
                        </Card>
                      )}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </Sider>
  );
};