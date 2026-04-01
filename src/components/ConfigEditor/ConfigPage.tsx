import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Tabs, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  message, 
  Alert,
  Divider,
  Tooltip,
  Card,
  Row,
  Col,
} from 'antd';
import { 
  SaveOutlined, 
  DownloadOutlined, 
  UploadOutlined, 
  FormatPainterOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useConfigStore } from '../../store/configStore';
import CodeEditor from './CodeEditor';
import TemplateSidebar from './TemplateSidebar';

const { Sider, Content } = Layout;
const { TabPane } = Tabs;

const ConfigPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveForm] = Form.useForm();
  const [dragOver, setDragOver] = useState(false);

  const {
    parsedConfig,
    validationErrors,
    selectedTemplate,
    isDirty,
    setMode,
    setFormat,
    setContent,
    saveTemplate,
    exportConfig,
    importConfig,
    formatContent,
  } = useConfigStore();

  useEffect(() => {
    setMode(activeTab);
  }, [activeTab, setMode]);

  const handleSave = () => {
    if (parsedConfig) {
      saveForm.setFieldsValue({
        name: parsedConfig.name || '',
        description: parsedConfig.description || '',
        tags: [],
      });
      setIsSaveModalOpen(true);
    } else {
      message.error('Invalid configuration. Please fix errors before saving.');
    }
  };

  const handleSaveSubmit = (values: { name: string; description: string; tags: string[] }) => {
    saveTemplate(values);
    setIsSaveModalOpen(false);
    message.success('Configuration saved successfully');
  };

  const handleExport = () => {
    exportConfig();
    message.success('Configuration exported successfully');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const content = event.target.result;
      const format = file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? 'yaml' : 'json';
      
      if (importConfig(content, format)) {
        message.success('Configuration imported successfully');
        setFormat(format);
      } else {
        message.error('Failed to import configuration. Please check the file format.');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleFormat = () => {
    const formatted = formatContent();
    setContent(formatted);
    message.success('Configuration formatted');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImport(files[0]);
    }
  };

  const hasErrors = validationErrors.length > 0;
  const hasCriticalErrors = validationErrors.some((e) => e.severity === 'error');

  const renderVisualEditor = () => (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      {parsedConfig ? (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Card title="Configuration Details" bordered={false} style={{ backgroundColor: '#1f1f1f' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Configuration Name
                  </label>
                  <Input 
                    value={parsedConfig.name || ''} 
                    onChange={(e) => {
                      const updated = { ...parsedConfig, name: e.target.value };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    placeholder="Enter configuration name"
                  />
                </div>
              </Col>
              
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Description
                  </label>
                  <Input.TextArea 
                    value={parsedConfig.description || ''} 
                    onChange={(e) => {
                      const updated = { ...parsedConfig, description: e.target.value };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    rows={3}
                    placeholder="Enter configuration description"
                  />
                </div>
              </Col>
              
              <Divider style={{ borderColor: '#303030' }} />
              
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Model Configuration</span>
                  </Space>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Model Name
                  </label>
                  <Select
                    value={parsedConfig.model?.name}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        model: { ...parsedConfig.model, name: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'Llama3-8B', label: 'Llama3-8B' },
                      { value: 'Llama3-70B', label: 'Llama3-70B' },
                      { value: 'Qwen-14B', label: 'Qwen-14B' },
                      { value: 'Qwen-72B', label: 'Qwen-72B' },
                      { value: 'GPT-4', label: 'GPT-4' },
                      { value: 'Claude-3', label: 'Claude-3' },
                    ]}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Precision
                  </label>
                  <Select
                    value={parsedConfig.model?.precision}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        model: { ...parsedConfig.model, precision: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'FP16', label: 'FP16' },
                      { value: 'FP32', label: 'FP32' },
                      { value: 'INT8', label: 'INT8' },
                      { value: 'INT4', label: 'INT4' },
                    ]}
                  />
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Temperature
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.model?.temperature || 0.7} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        model: { ...parsedConfig.model, temperature: parseFloat(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={0.1}
                    min={0}
                    max={2}
                  />
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Top P
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.model?.topP || 0.9} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        model: { ...parsedConfig.model, topP: parseFloat(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={0.05}
                    min={0}
                    max={1}
                  />
                </div>
              </Col>
              
              <Col span={8}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Max Context Length
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.model?.maxContextLength || 4096} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        model: { ...parsedConfig.model, maxContextLength: parseInt(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={1024}
                    min={1}
                    max={128000}
                  />
                </div>
              </Col>
              
              <Divider style={{ borderColor: '#303030' }} />
              
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <AppstoreOutlined style={{ color: '#52c41a' }} />
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Dataset Configuration</span>
                  </Space>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Dataset Name
                  </label>
                  <Select
                    value={parsedConfig.dataset?.name}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        dataset: { ...parsedConfig.dataset, name: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'MMLU', label: 'MMLU' },
                      { value: 'GSM8K', label: 'GSM8K' },
                      { value: 'Custom', label: 'Custom' },
                    ]}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Version
                  </label>
                  <Input 
                    value={parsedConfig.dataset?.version || ''} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        dataset: { ...parsedConfig.dataset, version: e.target.value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    placeholder="e.g., v2.1"
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Batch Size
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.dataset?.batchSize || 32} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        dataset: { ...parsedConfig.dataset, batchSize: parseInt(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={16}
                    min={1}
                    max={1024}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Shuffle
                  </label>
                  <Select
                    value={parsedConfig.dataset?.shuffle || true}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        dataset: { ...parsedConfig.dataset, shuffle: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ]}
                  />
                </div>
              </Col>
              
              <Divider style={{ borderColor: '#303030' }} />
              
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <ThunderboltOutlined style={{ color: '#faad14' }} />
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Resource Configuration</span>
                  </Space>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Accelerator Model
                  </label>
                  <Select
                    value={parsedConfig.resources?.cardModel}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        resources: { ...parsedConfig.resources, cardModel: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'NVIDIA H100', label: 'NVIDIA H100' },
                      { value: 'NVIDIA A100', label: 'NVIDIA A100' },
                      { value: 'NVIDIA A800', label: 'NVIDIA A800' },
                      { value: 'Huawei 910B', label: 'Huawei 910B' },
                      { value: 'AMD MI300X', label: 'AMD MI300X' },
                    ]}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    GPU Count
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.resources?.gpuCount || 1} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        resources: { ...parsedConfig.resources, gpuCount: parseInt(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={1}
                    min={1}
                    max={8}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Memory Limit (GB)
                  </label>
                  <Input 
                    type="number"
                    value={parsedConfig.resources?.memoryLimit || 70} 
                    onChange={(e) => {
                      const updated = { 
                        ...parsedConfig, 
                        resources: { ...parsedConfig.resources, memoryLimit: parseFloat(e.target.value) } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    step={5}
                    min={1}
                    max={192}
                  />
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    Tensor Parallel
                  </label>
                  <Select
                    value={parsedConfig.resources?.tensorParallel || false}
                    onChange={(value) => {
                      const updated = { 
                        ...parsedConfig, 
                        resources: { ...parsedConfig.resources, tensorParallel: value } 
                      };
                      setContent(JSON.stringify(updated, null, 2));
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: true, label: 'Enabled' },
                      { value: false, label: 'Disabled' },
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#999',
        }}>
          <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>No configuration loaded</p>
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#141414' }}>
      <Sider width={300} style={{ backgroundColor: '#1f1f1f', borderRight: '1px solid #303030' }}>
        <TemplateSidebar />
      </Sider>
      
      <Content style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ 
          padding: '12px 24px', 
          backgroundColor: '#1f1f1f', 
          borderBottom: '1px solid #303030',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <Space>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>
                Configuration Editor
              </h2>
              {selectedTemplate && (
                <Tag color="blue">{selectedTemplate.name}</Tag>
              )}
              {isDirty && (
                <Tag color="orange">Unsaved Changes</Tag>
              )}
            </Space>
          </div>
          
          <Space>
            <Tooltip title="Import Configuration">
              <Button
                icon={<UploadOutlined />}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json,.yaml,.yml';
                  input.onchange = (e: any) => {
                    if (e.target.files.length > 0) {
                      handleImport(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                Import
              </Button>
            </Tooltip>
            
            <Tooltip title="Export Configuration">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
            </Tooltip>
            
            <Tooltip title="Format Configuration">
              <Button
                icon={<FormatPainterOutlined />}
                onClick={handleFormat}
              >
                Format
              </Button>
            </Tooltip>
            
            <Divider type="vertical" style={{ borderColor: '#303030' }} />
            
            <Tooltip title="Save Configuration">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={!parsedConfig}
              >
                Save
              </Button>
            </Tooltip>
          </Space>
        </div>
        
        {hasErrors && (
          <Alert
            message={
              <Space>
                {hasCriticalErrors ? (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                ) : (
                  <WarningOutlined style={{ color: '#faad14' }} />
                )}
                <span>
                  {hasCriticalErrors ? 'Validation Errors' : 'Validation Warnings'}
                </span>
                <Tag color={hasCriticalErrors ? 'error' : 'warning'}>
                  {validationErrors.length}
                </Tag>
              </Space>
            }
            description={
              <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                {validationErrors.slice(0, 3).map((error, index) => (
                  <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                    {error.message}
                  </div>
                ))}
                {validationErrors.length > 3 && (
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    ...and {validationErrors.length - 3} more
                  </div>
                )}
              </div>
            }
            type={hasCriticalErrors ? 'error' : 'warning'}
            showIcon
            closable
            style={{ margin: '12px 24px', borderRadius: '4px' }}
          />
        )}
        
        <div 
          style={{ 
            flex: 1, 
            position: 'relative',
            backgroundColor: dragOver ? '#1a1a1a' : 'transparent',
            border: dragOver ? '2px dashed #1890ff' : 'none',
            borderRadius: '4px',
            margin: dragOver ? '12px 24px' : '0',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => setActiveTab(key as 'visual' | 'code')}
            style={{ height: '100%' }}
            tabBarStyle={{ 
              backgroundColor: '#1f1f1f', 
              margin: 0, 
              padding: '0 24px',
              borderBottom: '1px solid #303030',
            }}
          >
            <TabPane 
              tab={
                <Space>
                  <AppstoreOutlined />
                  <span>Visual Editor</span>
                </Space>
              } 
              key="visual"
            >
              {renderVisualEditor()}
            </TabPane>
            
            <TabPane 
              tab={
                <Space>
                  <FileTextOutlined />
                  <span>Code Editor</span>
                </Space>
              } 
              key="code"
            >
              <CodeEditor height="100%" />
            </TabPane>
          </Tabs>
        </div>
      </Content>
      
      <Modal
        title="Save Configuration"
        open={isSaveModalOpen}
        onCancel={() => setIsSaveModalOpen(false)}
        footer={null}
      >
        <Form
          form={saveForm}
          layout="vertical"
          onFinish={handleSaveSubmit}
        >
          <Form.Item
            name="name"
            label="Configuration Name"
            rules={[{ required: true, message: 'Please enter configuration name' }]}
          >
            <Input placeholder="Enter configuration name" />
          </Form.Item>
          
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter configuration description" rows={3} />
          </Form.Item>
          
          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              placeholder="Add tags"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block>
              Save Configuration
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ConfigPage;