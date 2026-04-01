import { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer, Tabs, Button, Space, Alert, Typography, Divider, Tag, Tooltip, Form, Input, Select, Table, Card, Row, Col, Statistic } from 'antd';
import { 
  SaveOutlined, 
  CloseOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { debounce } from 'lodash';
import type { editor } from 'monaco-editor';
import * as yaml from 'js-yaml';
import { useOrchestratorStore } from '../../store/orchestratorStore';
import type { WorkflowNode } from '../../types/workflow';

const { Text } = Typography;

interface NodeConfigDrawerProps {
  visible: boolean;
  node: WorkflowNode | null;
  onClose: () => void;
}

const NODE_TYPE_LABELS = {
  data_loader: 'Data Loader',
  model_inference: 'Model Inference',
  resource_alloc: 'Resource Allocation',
  evaluator: 'Evaluator',
  reporter: 'Reporter',
};

const NODE_TYPE_DESCRIPTIONS = {
  data_loader: 'Load and preprocess data for model training or inference',
  model_inference: 'Execute model inference with specified parameters',
  resource_alloc: 'Allocate GPU/CPU resources for computation',
  evaluator: 'Evaluate model performance with specified metrics',
  reporter: 'Generate and export evaluation reports',
};

const DATASET_VERSIONS = [
  {
    id: 'ds_v1',
    name: 'C-Eval',
    version: 'v1.0.0',
    commitHash: 'a1b2c3d',
    createdAt: '2024-01-15',
    sampleData: [
      { id: 1, question: 'What is the capital of China?', answer: 'Beijing' },
      { id: 2, question: 'What is 2+2?', answer: '4' },
      { id: 3, question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare' },
      { id: 4, question: 'What is the largest planet?', answer: 'Jupiter' },
      { id: 5, question: 'What year was WW2?', answer: '1939' },
      { id: 6, question: 'What is H2O?', answer: 'Water' },
      { id: 7, question: 'Who painted Mona Lisa?', answer: 'Da Vinci' },
      { id: 8, question: 'What is the speed of light?', answer: '299,792,458 m/s' },
      { id: 9, question: 'What is the currency of Japan?', answer: 'Yen' },
      { id: 10, question: 'What is the largest ocean?', answer: 'Pacific' },
    ],
  },
  {
    id: 'ds_v2',
    name: 'MMLU',
    version: 'v2.1.0',
    commitHash: 'e4f5g6h',
    createdAt: '2024-02-20',
    sampleData: [
      { id: 1, question: 'What is the derivative of x^2?', answer: '2x' },
      { id: 2, question: 'What is Newton\'s first law?', answer: 'Inertia' },
      { id: 3, question: 'What is the chemical symbol for gold?', answer: 'Au' },
      { id: 4, question: 'Who discovered penicillin?', answer: 'Fleming' },
      { id: 5, question: 'What is the largest mammal?', answer: 'Blue whale' },
      { id: 6, question: 'What is the capital of Australia?', answer: 'Canberra' },
      { id: 7, question: 'What is photosynthesis?', answer: 'Converting light to energy' },
      { id: 8, question: 'Who wrote 1984?', answer: 'Orwell' },
      { id: 9, question: 'What is the smallest prime?', answer: '2' },
      { id: 10, question: 'What is the currency of UK?', answer: 'Pound' },
    ],
  },
];

const ACCELERATOR_MODELS = [
  { value: 'NVIDIA H100', label: 'NVIDIA H100 (80GB)', memory: 80, available: true },
  { value: 'NVIDIA A100', label: 'NVIDIA A100 (80GB)', memory: 80, available: true },
  { value: 'NVIDIA A800', label: 'NVIDIA A800 (80GB)', memory: 80, available: false },
  { value: 'Huawei 910B', label: 'Huawei Ascend 910B (64GB)', memory: 64, available: true },
  { value: 'AMD MI300X', label: 'AMD MI300X (192GB)', memory: 192, available: true },
];

const MODEL_OPTIONS = [
  { value: 'Llama3-8B', label: 'Llama3-8B' },
  { value: 'Llama3-70B', label: 'Llama3-70B' },
  { value: 'Qwen-14B', label: 'Qwen-14B' },
  { value: 'Qwen-72B', label: 'Qwen-72B' },
  { value: 'GPT-4', label: 'GPT-4' },
  { value: 'Claude-3', label: 'Claude-3' },
];

const EVALUATION_METRICS = [
  { value: 'accuracy', label: 'Accuracy' },
  { value: 'throughput', label: 'Throughput (tokens/s)' },
  { value: 'latency', label: 'Latency (ms)' },
  { value: 'latency_p99', label: 'Latency P99 (ms)' },
  { value: 'memory_usage', label: 'Memory Usage (GB)' },
  { value: 'energy_efficiency', label: 'Energy Efficiency' },
  { value: 'cost_per_token', label: 'Cost per Token' },
];

export const NodeConfigDrawer = ({ visible, node, onClose }: NodeConfigDrawerProps) => {
  const [form] = Form.useForm();
  const [configJson, setConfigJson] = useState('');
  const [configYaml, setConfigYaml] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'json' | 'yaml'>('form');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  
  const { updateNodeConfig, workflow } = useOrchestratorStore();

  useEffect(() => {
    if (node && visible) {
      try {
        const jsonStr = JSON.stringify(node.data.config, null, 2);
        setConfigJson(jsonStr);
        setConfigYaml(jsonToYaml(node.data.config));
        form.setFieldsValue({
          label: node.data.label,
          ...node.data.config,
        });
        setIsValid(true);
        setErrorMessage('');
      } catch (error) {
        setIsValid(false);
        setErrorMessage('Failed to parse node configuration');
      }
    }
  }, [node, visible, form]);

  const jsonToYaml = (obj: any): string => {
    try {
      return yaml.dump(obj, { indent: 2 });
    } catch {
      return '';
    }
  };

  const yamlToJson = (yamlStr: string): any => {
    try {
      return yaml.load(yamlStr);
    } catch {
      return null;
    }
  };

  const handleJsonChange = useCallback(
    debounce((value: string | undefined) => {
      if (value !== undefined) {
        try {
          const parsed = JSON.parse(value);
          setConfigJson(value);
          setConfigYaml(jsonToYaml(parsed));
          setIsValid(true);
          setErrorMessage('');
        } catch (error) {
          setIsValid(false);
          setErrorMessage('Invalid JSON syntax');
        }
      }
    }, 300),
    []
  );

  const handleYamlChange = useCallback(
    debounce((value: string | undefined) => {
      if (value !== undefined) {
        try {
          const parsed = yamlToJson(value);
          if (parsed) {
            setConfigYaml(value);
            setConfigJson(JSON.stringify(parsed, null, 2));
            setIsValid(true);
            setErrorMessage('');
          } else {
            setIsValid(false);
            setErrorMessage('Invalid YAML syntax');
          }
        } catch (error) {
          setIsValid(false);
          setErrorMessage('Invalid YAML syntax');
        }
      }
    }, 300),
    []
  );

  const handleSave = async () => {
    if (!node) return;

    try {
      let config: any;

      if (activeTab === 'form') {
        const values = await form.validateFields();
        config = { ...values };
        delete config.label;
      } else {
        config = JSON.parse(configJson);
      }

      updateNodeConfig(node.id, config);
      onClose();
    } catch (error) {
      setIsValid(false);
      setErrorMessage('Failed to save configuration');
    }
  };

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }, []);

  const handleFormatDocument = useCallback(() => {
    if (editorRef.current) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
      }
    }
  }, []);

  const getResourceEstimate = () => {
    if (!node) return null;
    
    const config = activeTab === 'form' ? form.getFieldsValue() : node.data.config;
    
    if (node.type === 'resource_alloc') {
      return {
        gpus: config.gpuCount || 0,
        memory: config.memoryLimit || 0,
        estimated: false,
      };
    }
    
    if (node.type === 'model_inference') {
      const memoryPerGPU = config.precision === 'FP16' ? 16 : config.precision === 'INT8' ? 8 : 32;
      return {
        gpus: 1,
        memory: memoryPerGPU,
        estimated: true,
      };
    }
    
    return null;
  };

  const resourceEstimate = getResourceEstimate();

  const getUpstreamNodes = () => {
    if (!node || !workflow) return [];
    
    return workflow.nodes.filter((n) => 
      workflow.edges.some((e) => e.source === n.id && e.target === node.id)
    );
  };

  const upstreamNodes = getUpstreamNodes();

  const renderFormConfig = () => {
    if (!node) return null;

    switch (node.type) {
      case 'data_loader':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Data source label" />
            </Form.Item>

            <Form.Item
              label="Dataset"
              name="dataset"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select dataset"
                options={DATASET_VERSIONS.map((ds) => ({
                  value: ds.id,
                  label: `${ds.name} ${ds.version}`,
                }))}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {() => {
                const datasetId = form.getFieldValue('dataset');
                const dataset = DATASET_VERSIONS.find((ds) => ds.id === datasetId);

                if (dataset) {
                  return (
                    <>
                      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#1f1f1f' }}>
                        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">Version: </Text>
                            <Tag color="blue">{dataset.version}</Tag>
                          </div>
                          <div>
                            <Text type="secondary">Git Commit: </Text>
                            <Tag color="green" style={{ fontFamily: 'monospace' }}>
                              {dataset.commitHash}
                            </Tag>
                          </div>
                          <div>
                            <Text type="secondary">Created: </Text>
                            <Text>{dataset.createdAt}</Text>
                          </div>
                        </Space>
                      </Card>

                      <Divider>Data Preview (First 10 rows)</Divider>

                      <Table
                        dataSource={dataset.sampleData}
                        pagination={false}
                        size="small"
                        scroll={{ y: 200 }}
                        rowKey="id"
                      >
                        <Table.Column title="ID" dataIndex="id" width={60} />
                        <Table.Column title="Question" dataIndex="question" ellipsis width={200} />
                        <Table.Column title="Answer" dataIndex="answer" ellipsis width={150} />
                      </Table>
                    </>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Batch Size"
              name="batchSize"
              rules={[{ required: true }]}
              tooltip="Number of samples processed per batch"
            >
              <Input type="number" placeholder="e.g., 32" />
            </Form.Item>

            <Form.Item
              label="Shuffle"
              name="shuffle"
              valuePropName="checked"
            >
              <Select
                options={[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ]}
              />
            </Form.Item>
          </>
        );

      case 'model_inference':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Model label" />
            </Form.Item>

            <Form.Item
              label="Model Name"
              name="modelName"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select model"
                options={MODEL_OPTIONS}
              />
            </Form.Item>

            <Form.Item
              label="Precision"
              name="precision"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select precision"
                options={[
                  { value: 'FP16', label: 'FP16 (Half Precision)' },
                  { value: 'FP32', label: 'FP32 (Full Precision)' },
                  { value: 'INT8', label: 'INT8 (8-bit Integer)' },
                  { value: 'INT4', label: 'INT4 (4-bit Integer)' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Max Context Length"
              name="maxContextLength"
              rules={[{ required: true }]}
              tooltip="Maximum number of tokens in context window"
            >
              <Input type="number" placeholder="e.g., 4096" />
            </Form.Item>

            <Form.Item
              label="Temperature"
              name="temperature"
              tooltip="Sampling temperature (0.0 to 2.0)"
            >
              <Input type="number" step={0.1} min={0} max={2} placeholder="e.g., 0.7" />
            </Form.Item>

            <Form.Item
              label="Top P"
              name="topP"
              tooltip="Nucleus sampling threshold"
            >
              <Input type="number" step={0.1} min={0} max={1} placeholder="e.g., 0.9" />
            </Form.Item>
          </>
        );

      case 'resource_alloc':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Resource label" />
            </Form.Item>

            <Form.Item
              label="Accelerator Model"
              name="cardModel"
              rules={[{ required: true }]}
              tooltip="Select GPU/NPU model to use"
            >
              <Select
                placeholder="Select accelerator"
                showSearch
                optionFilterProp="children"
                options={ACCELERATOR_MODELS}
              />
            </Form.Item>

            <Form.Item
              label="GPU Count"
              name="gpuCount"
              rules={[{ required: true }]}
              tooltip="Number of GPU devices to use"
            >
              <Input type="number" min={1} max={8} placeholder="e.g., 1" />
            </Form.Item>

            <Form.Item
              label="Memory Limit (GB)"
              name="memoryLimit"
              rules={[{ required: true }]}
              tooltip="Maximum memory allocation per GPU"
            >
              <Input type="number" placeholder="e.g., 70" />
            </Form.Item>

            <Form.Item
              label="Tensor Parallelism"
              name="tensorParallel"
              tooltip="Enable tensor parallelism across GPUs"
            >
              <Select
                options={[
                  { value: false, label: 'Disabled' },
                  { value: true, label: 'Enabled' },
                ]}
              />
            </Form.Item>
          </>
        );

      case 'evaluator':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Evaluation label" />
            </Form.Item>

            <Form.Item
              label="Evaluation Metrics"
              name="metrics"
              rules={[{ required: true }]}
              tooltip="Select metrics to evaluate"
            >
              <Select
                mode="multiple"
                placeholder="Select metrics"
                options={EVALUATION_METRICS}
              />
            </Form.Item>

            <Form.Item
              label="Evaluation Mode"
              name="evalMode"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'inference', label: 'Inference' },
                  { value: 'training', label: 'Training' },
                  { value: 'finetuning', label: 'Fine-tuning' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Number of Samples"
              name="numSamples"
              tooltip="Number of samples to evaluate (0 for all)"
            >
              <Input type="number" placeholder="e.g., 1000" />
            </Form.Item>

            <Alert
              message="Parameter Injection"
              description={
                <div>
                  <p>You can reference upstream node outputs using <Text code>{'${node_id.output_key}'}</Text> syntax</p>
                  {upstreamNodes.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Available upstream nodes:</Text>
                      <div style={{ marginTop: 4 }}>
                        {upstreamNodes.map((n) => (
                          <Tag key={n.id} color="blue">
                            {n.data.label} ({n.id})
                          </Tag>
                        ))}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        Example: {'${' + upstreamNodes[0]?.id + '.batch_size}'}
                      </Text>
                    </div>
                  )}
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              label="Custom Parameters"
              name="customParams"
              tooltip="Use ${node_id.output_key} to reference upstream outputs"
            >
              <Input.TextArea
                rows={4}
                placeholder={`Example parameters:\nbatch_size: ${upstreamNodes[0]?.id ? `\${${upstreamNodes[0].id}.batch_size}` : '32'}\ntemperature: 0.7`}
              />
            </Form.Item>
          </>
        );

      case 'reporter':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Export label" />
            </Form.Item>

            <Form.Item
              label="Export Format"
              name="format"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: 'pdf', label: 'PDF Report' },
                  { value: 'html', label: 'HTML Report' },
                  { value: 'json', label: 'JSON Data' },
                  { value: 'csv', label: 'CSV Data' },
                  { value: 'excel', label: 'Excel Spreadsheet' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Output Path"
              name="outputPath"
            >
              <Input placeholder="e.g., /results/benchmark_report.pdf" />
            </Form.Item>

            <Form.Item
              label="Email Notification"
              name="emailNotify"
            >
              <Input type="email" placeholder="e.g., user@example.com" />
            </Form.Item>

            <Form.Item
              label="Include Charts"
              name="includeCharts"
              valuePropName="checked"
            >
              <Select
                options={[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Include Logs"
              name="includeLogs"
              valuePropName="checked"
            >
              <Select
                options={[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ]}
              />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  if (!node) return null;

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {NODE_TYPE_LABELS[node.type]}
          </span>
          <Tag color="blue">{node.type}</Tag>
        </Space>
      }
      placement="right"
      size="large"
      open={visible}
      onClose={onClose}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
              disabled={!isValid}
            >
              Save Configuration
            </Button>
          </Space>
        </div>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{NODE_TYPE_DESCRIPTIONS[node.type]}</Text>
      </div>

      <Divider>Node Information</Divider>
      
      <div style={{ marginBottom: 16 }}>
        <Space orientation="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Node ID: </Text>
            <Text code>{node.id}</Text>
          </div>
          <div>
            <Text strong>Status: </Text>
            <Tag color={node.data.status === 'success' ? 'green' : node.data.status === 'failed' ? 'red' : 'default'}>
              {node.data.status || 'pending'}
            </Tag>
          </div>
        </Space>
      </div>

      {resourceEstimate && (
        <>
          <Divider>
            <Space>
              <ThunderboltOutlined />
              Resource Estimate
            </Space>
          </Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="GPUs"
                value={resourceEstimate.gpus}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Memory"
                value={resourceEstimate.memory}
                suffix="GB"
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
          </Row>
          
          {resourceEstimate.estimated && (
            <Alert
              message="Estimated based on model precision"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}

      <Divider>Configuration</Divider>

      {!isValid && (
        <Alert
          message="Configuration Error"
          description={errorMessage}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'form' | 'json' | 'yaml')}
        tabBarExtraContent={
          activeTab !== 'form' && (
            <Tooltip title="Format document">
              <Button 
                size="small" 
                icon={<InfoCircleOutlined />}
                onClick={handleFormatDocument}
              >
                Format
              </Button>
            </Tooltip>
          )
        }
      >
        <Tabs.TabPane tab="Form" key="form">
          <Form form={form} layout="vertical">
            {renderFormConfig()}
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane tab="JSON" key="json">
          <Editor
            height="400px"
            defaultLanguage="json"
            value={configJson}
            onChange={handleJsonChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="YAML" key="yaml">
          <Editor
            height="400px"
            defaultLanguage="yaml"
            value={configYaml}
            onChange={handleYamlChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </Tabs.TabPane>
      </Tabs>

      <div style={{ marginTop: 16 }}>
        <Alert
          message="Configuration Tips"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Use Form mode for guided configuration</li>
              <li>Use JSON/YAML mode for advanced editing</li>
              <li>Parameter injection: Use <Text code>{'${node_id.output_key}'}</Text> syntax</li>
              <li>Press Ctrl/Cmd + S to format the document</li>
              <li>Configuration will be validated before saving</li>
            </ul>
          }
          type="info"
          showIcon
        />
      </div>
    </Drawer>
  );
};
