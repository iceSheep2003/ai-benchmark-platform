import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  message,
  Table,
  Tag,
  Divider,
  Alert,
  Card,
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const nodeTypes: NodeTypes = {};

interface WorkflowEditorProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onRun?: (workflowId: string) => void;
}

interface AvailableResource {
  id: string;
  name: string;
  model: string;
  available: boolean;
  memory: string;
}

interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  commitHash: string;
  createdAt: string;
  sampleData: Array<Record<string, any>>;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ onSave, onRun }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  const availableResources: AvailableResource[] = [
    { id: 'res-1', name: 'GPU-Server-01', model: 'NVIDIA H100', available: true, memory: '80GB' },
    { id: 'res-2', name: 'GPU-Server-02', model: 'NVIDIA A100', available: true, memory: '80GB' },
    { id: 'res-3', name: 'GPU-Server-03', model: 'Huawei 910B', available: true, memory: '64GB' },
    { id: 'res-4', name: 'GPU-Server-04', model: 'NVIDIA H100', available: false, memory: '80GB' },
  ];

  const datasetVersions: DatasetVersion[] = [
    {
      id: 'ds-1',
      name: 'MMLU',
      version: 'v2.1',
      commitHash: 'a1b2c3d4e5f6',
      createdAt: '2024-03-10',
      sampleData: [
        { id: 1, question: 'What is the capital of France?', answer: 'Paris' },
        { id: 2, question: 'What is 2+2?', answer: '4' },
        { id: 3, question: 'Who wrote Romeo and Juliet?', answer: 'Shakespeare' },
        { id: 4, question: 'What is H2O?', answer: 'Water' },
        { id: 5, question: 'What year did WW2 end?', answer: '1945' },
        { id: 6, question: 'What is the largest planet?', answer: 'Jupiter' },
        { id: 7, question: 'What color is the sky?', answer: 'Blue' },
        { id: 8, question: 'How many continents?', answer: '7' },
        { id: 9, question: 'What is photosynthesis?', answer: 'Plant process' },
        { id: 10, question: 'What is gravity?', answer: 'Force of attraction' },
      ],
    },
    {
      id: 'ds-2',
      name: 'GSM8K',
      version: 'v1.0',
      commitHash: 'f6e5d4c3b2a1',
      createdAt: '2024-03-08',
      sampleData: [
        { id: 1, question: 'A baker has 5 loaves...', answer: '15' },
        { id: 2, question: 'If 3 apples cost $6...', answer: '$2' },
        { id: 3, question: 'A train travels 120km...', answer: '2 hours' },
        { id: 4, question: 'John has 10 marbles...', answer: '5' },
        { id: 5, question: 'A rectangle has length 8...', answer: '40' },
        { id: 6, question: 'Mary bought 3 books...', answer: '$45' },
        { id: 7, question: 'A car uses 8L...', answer: '400km' },
        { id: 8, question: 'Tom has 20 stickers...', answer: '4' },
        { id: 9, question: 'A box contains 15...', answer: '6' },
        { id: 10, question: 'Sarah runs 5km...', answer: '25km' },
      ],
    },
  ];

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setDrawerVisible(true);
    form.setFieldsValue(node.data);
  }, [form]);

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: `${type} Node`,
        nodeType: type,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const handleSaveNode = () => {
    form.validateFields().then((values) => {
      if (selectedNode) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNode.id
              ? { ...node, data: { ...node.data, ...values } }
              : node
          )
        );
        setDrawerVisible(false);
        message.success('Node configuration saved');
      }
    });
  };

  const handleSaveWorkflow = () => {
    if (onSave) {
      onSave(nodes, edges);
      message.success('Workflow saved successfully');
    }
  };

  const handleValidateWorkflow = () => {
    const validationErrors: string[] = [];

    nodes.forEach((node) => {
      if (!node.data.config || Object.keys(node.data.config).length === 0) {
        validationErrors.push(`Node "${node.data.label}" has no configuration`);
      }
    });

    if (nodes.length === 0) {
      validationErrors.push('Workflow has no nodes');
    }

    if (edges.length === 0 && nodes.length > 1) {
      validationErrors.push('Nodes are not connected');
    }

    if (validationErrors.length > 0) {
      message.error({
        content: (
          <div>
            <div style={{ marginBottom: '8px' }}>
              <WarningOutlined /> Validation Failed:
            </div>
            <ul style={{ paddingLeft: '20px' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5,
      });
    } else {
      message.success({
        content: (
          <div>
            <CheckCircleOutlined /> Workflow validation passed!
          </div>
        ),
        duration: 3,
      });
    }
  };

  const handleRunWorkflow = () => {
    handleValidateWorkflow();
    if (onRun) {
      onRun('workflow-' + Date.now());
      message.success('Workflow started');
    }
  };

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.data.nodeType || 'default';

    switch (nodeType) {
      case 'data':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Data source label" />
            </Form.Item>

            <Form.Item
              label="Dataset"
              name={['config', 'dataset']}
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select dataset"
                options={datasetVersions.map((ds) => ({
                  value: ds.id,
                  label: `${ds.name} ${ds.version}`,
                }))}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {() => {
                const datasetId = form.getFieldValue(['config', 'dataset']);
                const dataset = datasetVersions.find((ds) => ds.id === datasetId);

                if (dataset) {
                  return (
                    <>
                      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#1f1f1f' }}>
                        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                          <div>
                            <span style={{ color: '#999' }}>Version: </span>
                            <Tag color="blue">{dataset.version}</Tag>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>Git Commit: </span>
                            <Tag color="green" style={{ fontFamily: 'monospace' }}>
                              {dataset.commitHash}
                            </Tag>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>Created: </span>
                            <span>{dataset.createdAt}</span>
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
                        <Table.Column
                          title="Question"
                          dataIndex="question"
                          ellipsis
                          width={200}
                        />
                        <Table.Column
                          title="Answer"
                          dataIndex="answer"
                          ellipsis
                          width={150}
                        />
                      </Table>
                    </>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Batch Size"
              name={['config', 'batchSize']}
              rules={[{ required: true }]}
              tooltip="Number of samples processed per batch"
            >
              <Input type="number" placeholder="e.g., 32" />
            </Form.Item>

            <Form.Item
              label="Shuffle"
              name={['config', 'shuffle']}
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

      case 'model':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Model label" />
            </Form.Item>

            <Form.Item
              label="Model Name"
              name={['config', 'modelName']}
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select model"
                options={[
                  { value: 'Llama3-8B', label: 'Llama3-8B' },
                  { value: 'Llama3-70B', label: 'Llama3-70B' },
                  { value: 'Qwen-14B', label: 'Qwen-14B' },
                  { value: 'Qwen-72B', label: 'Qwen-72B' },
                  { value: 'GPT-4', label: 'GPT-4' },
                  { value: 'Claude-3', label: 'Claude-3' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Precision"
              name={['config', 'precision']}
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
              name={['config', 'maxContextLength']}
              rules={[{ required: true }]}
              tooltip="Maximum number of tokens in context window"
            >
              <Input type="number" placeholder="e.g., 4096" />
            </Form.Item>

            <Form.Item
              label="Temperature"
              name={['config', 'temperature']}
              tooltip="Sampling temperature (0.0 to 2.0)"
            >
              <Input type="number" step={0.1} min={0} max={2} placeholder="e.g., 0.7" />
            </Form.Item>

            <Form.Item
              label="Top P"
              name={['config', 'topP']}
              tooltip="Nucleus sampling threshold"
            >
              <Input type="number" step={0.1} min={0} max={1} placeholder="e.g., 0.9" />
            </Form.Item>
          </>
        );

      case 'resource':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Resource label" />
            </Form.Item>

            <Form.Item
              label="Accelerator Model"
              name={['config', 'cardModel']}
              rules={[{ required: true }]}
              tooltip="Select the GPU/NPU model to use"
            >
              <Select
                placeholder="Select accelerator"
                showSearch
                optionFilterProp="children"
                options={[
                  { value: 'NVIDIA H100', label: 'NVIDIA H100 (80GB)' },
                  { value: 'NVIDIA A100', label: 'NVIDIA A100 (80GB)' },
                  { value: 'NVIDIA A800', label: 'NVIDIA A800 (80GB)' },
                  { value: 'Huawei 910B', label: 'Huawei Ascend 910B (64GB)' },
                  { value: 'AMD MI300X', label: 'AMD MI300X (192GB)' },
                ]}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {() => {
                const cardModel = form.getFieldValue(['config', 'cardModel']);
                const filteredResources = availableResources.filter(
                  (res) => res.model === cardModel && res.available
                );

                return (
                  <Form.Item
                    label="Available Resources"
                    name={['config', 'resourceId']}
                    rules={[{ required: true }]}
                    tooltip="Select specific resource instance"
                  >
                    <Select
                      placeholder="Select resource instance"
                      disabled={!cardModel}
                      options={filteredResources.map((res) => ({
                        value: res.id,
                        label: `${res.name} (${res.memory})`,
                        disabled: !res.available,
                      }))}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item
              label="GPU Count"
              name={['config', 'gpuCount']}
              rules={[{ required: true }]}
              tooltip="Number of GPU devices to use"
            >
              <Input type="number" min={1} max={8} placeholder="e.g., 1" />
            </Form.Item>

            <Form.Item
              label="Memory Limit (GB)"
              name={['config', 'memoryLimit']}
              rules={[{ required: true }]}
              tooltip="Maximum memory allocation per GPU"
            >
              <Input type="number" placeholder="e.g., 70" />
            </Form.Item>

            <Form.Item
              label="Tensor Parallelism"
              name={['config', 'tensorParallel']}
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

      case 'eval':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Evaluation label" />
            </Form.Item>

            <Form.Item
              label="Evaluation Metrics"
              name={['config', 'metrics']}
              rules={[{ required: true }]}
              tooltip="Select metrics to evaluate"
            >
              <Select
                mode="multiple"
                placeholder="Select metrics"
                options={[
                  { value: 'accuracy', label: 'Accuracy' },
                  { value: 'throughput', label: 'Throughput (tokens/s)' },
                  { value: 'latency', label: 'Latency (ms)' },
                  { value: 'latency_p99', label: 'Latency P99 (ms)' },
                  { value: 'memory_usage', label: 'Memory Usage (GB)' },
                  { value: 'energy_efficiency', label: 'Energy Efficiency' },
                  { value: 'cost_per_token', label: 'Cost per Token' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Evaluation Mode"
              name={['config', 'evalMode']}
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
              name={['config', 'numSamples']}
              tooltip="Number of samples to evaluate (0 for all)"
            >
              <Input type="number" placeholder="e.g., 1000" />
            </Form.Item>

            <Alert
              message="Parameter Injection"
              description="You can reference upstream node outputs using ${node_id.output_key} syntax"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              label="Custom Parameters"
              name={['config', 'customParams']}
              tooltip="Example: ${data.batch_size} or ${model.temperature}"
            >
              <Input.TextArea
                rows={4}
                placeholder="Example parameters:\nbatch_size: 32\ntemperature: 0.7"
              />
            </Form.Item>
          </>
        );

      case 'export':
        return (
          <>
            <Form.Item label="Label" name="label" rules={[{ required: true }]}>
              <Input placeholder="Export label" />
            </Form.Item>

            <Form.Item
              label="Export Format"
              name={['config', 'format']}
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
              label="Include Charts"
              name={['config', 'includeCharts']}
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
              name={['config', 'includeLogs']}
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
              label="Output Path"
              name={['config', 'outputPath']}
            >
              <Input placeholder="e.g., /results/benchmark_report.pdf" />
            </Form.Item>

            <Form.Item
              label="Email Notification"
              name={['config', 'emailNotify']}
            >
              <Input type="email" placeholder="e.g., user@example.com" />
            </Form.Item>
          </>
        );

      default:
        return (
          <Form.Item label="Label" name="label" rules={[{ required: true }]}>
            <Input placeholder="Node label" />
          </Form.Item>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #303030' }}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => addNode('data')}>
            Data Node
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => addNode('model')}>
            Model Node
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => addNode('resource')}>
            Resource Node
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => addNode('eval')}>
            Eval Node
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => addNode('export')}>
            Export Node
          </Button>
          <Divider type="vertical" />
          <Button
            icon={<CheckCircleOutlined />}
            onClick={handleValidateWorkflow}
          >
            Validate
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveWorkflow}
          >
            Save Template
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunWorkflow}
          >
            Run Workflow
          </Button>
        </Space>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#1a1a1a" gap={16} />
        <Controls />
        <MiniMap
          nodeColor="#1890ff"
          maskColor="rgba(0, 0, 0, 0.8)"
          style={{ backgroundColor: '#1f1f1f' }}
        />
      </ReactFlow>

      <Drawer
        title={
          <Space>
            <span>Node Configuration</span>
            {selectedNode && (
              <Tag color="blue">{selectedNode.data.nodeType || 'default'}</Tag>
            )}
          </Space>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        size="large"
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSaveNode}>
              Save
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {renderNodeConfig()}
        </Form>
      </Drawer>
    </div>
  );
};

export default WorkflowEditor;