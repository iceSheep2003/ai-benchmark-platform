import React, { useState } from 'react';
import { Card, Row, Col, Button, Tag, Table, Input, Select, Space, Modal, message, Tabs, Image, Spin } from 'antd';
import {
  CloudUploadOutlined,
  EyeOutlined,
  RocketOutlined,
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { DatasetAsset } from '../../../types';
import { getDatasetBasePath, loadDatasetCatalog, loadDatasetPreviewRows } from '../../../services/datasetCatalogService';
import {
  createTaskFromDataset,
  getRelatedTasks,
} from '../../../services/assetTaskLinker';
import { useAppStore } from '../../../store/appStore';

const DataManager: React.FC = () => {
  const { setCurrentPage, setSelectedTask } = useAppStore();
  const [catalogDatasets, setCatalogDatasets] = useState<DatasetAsset[]>([]);
  const [sourceMode, setSourceMode] = useState<'huggingface' | 'custom'>('huggingface');
  const [searchText, setSearchText] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<DatasetAsset | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSource, setPreviewSource] = useState<'test' | 'sample' | 'catalog'>('catalog');

  React.useEffect(() => {
    const load = async () => {
      try {
        const datasets = await loadDatasetCatalog();
        const mapped: DatasetAsset[] = datasets.map((dataset) => {
          const sizeMB = Math.max(1, Math.round(dataset.sampleCount * 0.004));
          return {
            id: dataset.id,
            name: dataset.name,
            source: dataset.source === 'open-source' ? 'huggingface' : 'custom',
            version: dataset.version,
            rowCount: dataset.sampleCount,
            sizeMB,
            previewData: [],
            usageCount: 0,
            metadata: {
              description: `${dataset.name} (${dataset.taskType})`,
              tags: dataset.tags,
              language: dataset.languageDistribution,
              license: dataset.source === 'open-source' ? 'community' : 'internal',
            },
          };
        });
        setCatalogDatasets(mapped);
      } catch (error) {
        console.error('Failed to load dataset catalog:', error);
      }
    };
    void load();
  }, []);

  const handleCreateTask = (dataset: DatasetAsset) => {
    createTaskFromDataset(dataset);
    setCurrentPage('tasks');
    message.success(`Creating new task for dataset: ${dataset.name}`);
  };

  const handlePreview = async (dataset: DatasetAsset) => {
    setSelectedDataset(dataset);
    setPreviewModalVisible(true);
    setPreviewLoading(true);
    try {
      const source = dataset.source === 'huggingface' ? 'open-source' : 'self-built';
      const result = await loadDatasetPreviewRows(
        { id: dataset.id, source },
        dataset.previewData as Record<string, unknown>[],
      );
      setPreviewRows(result.rows);
      setPreviewSource(result.source);
    } catch {
      setPreviewRows((dataset.previewData as Record<string, unknown>[]) || []);
      setPreviewSource('catalog');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpload = () => {
    setUploadModalVisible(true);
  };

  const handleViewRelatedTask = (taskId: string) => {
    const dataset = catalogDatasets.find(d => {
      const relatedTasks = getRelatedTasks(d.id);
      return relatedTasks.includes(taskId);
    });
    
    if (dataset) {
      setSelectedTask({
        id: taskId,
        name: `${dataset.name} Benchmark`,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        createdBy: 'System',
        workflowId: 'workflow-001',
        resources: {
          cardModel: 'NVIDIA H100',
          driverVersion: '535.104',
          cudaVersion: '12.2',
        },
        dataLineage: {
          datasetName: dataset.name,
          datasetVersionHash: 'd4e5f6',
          modelWeightHash: 'a1b2c3',
        },
      });
      setCurrentPage('task-detail');
    }
  };

  const filteredHuggingFaceDatasets = catalogDatasets.filter(dataset =>
    dataset.source === 'huggingface' &&
    dataset.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredDatasets = catalogDatasets.filter(dataset =>
    dataset.source === 'custom' &&
    dataset.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderHuggingFaceMarket = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {filteredHuggingFaceDatasets.map((dataset) => (
          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={dataset.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button
                  key="use"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => message.success(`Adding ${dataset.name} to your datasets`)}
                >
                  Add to Library
                </Button>,
              ]}
            >
              <Card.Meta
                title={dataset.name}
                description={
                  <div>
                    <Space wrap>
                      {dataset.tags.map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                      <DownloadOutlined /> {dataset.downloads.toLocaleString()} downloads
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      👍 {dataset.likes.toLocaleString()} likes
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderCustomDatasets = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {filteredDatasets.map((dataset) => (
          <Col xs={24} sm={24} md={12} lg={8} xl={6} key={dataset.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button
                  key="preview"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(dataset)}
                >
                  Preview
                </Button>,
                <Button
                  key="create"
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => handleCreateTask(dataset)}
                >
                  New Task
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    <span>{dataset.name}</span>
                    <Tag color={dataset.source === 'huggingface' ? 'blue' : 'green'}>
                      {dataset.source === 'huggingface' ? 'HuggingFace' : 'Custom'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <Tag color="purple">{dataset.version}</Tag>
                      <Tag color="orange">{dataset.rowCount.toLocaleString()} rows</Tag>
                      <Tag color="cyan">{dataset.sizeMB} MB</Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <RocketOutlined /> Used {dataset.usageCount} times
                    </div>
                    {dataset.metadata && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                        {dataset.metadata.description}
                      </div>
                    )}
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderPreviewModal = () => {
    if (!selectedDataset) return null;

    const relatedTasks = getRelatedTasks(selectedDataset.id);
    const datasetSource = selectedDataset.source === 'huggingface' ? 'open-source' : 'self-built';
    const datasetBasePath = getDatasetBasePath({ id: selectedDataset.id, source: datasetSource });
    const dataSource = previewRows.slice(0, 100).map((row, i) => ({ id: i + 1, ...row }));
    const resolveImagePath = (value: unknown): string | null => {
      if (typeof value === 'string' && value.startsWith('image/')) {
        return `${datasetBasePath}/${value}`;
      }
      if (value && typeof value === 'object') {
        const maybePath = (value as { path?: unknown }).path;
        if (typeof maybePath === 'string' && maybePath.startsWith('image/')) {
          return `${datasetBasePath}/${maybePath}`;
        }
      }
      return null;
    };
    const columns = Object.keys(dataSource[0] || {}).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      render: (value: unknown) => {
        const src = resolveImagePath(value);
        if (src) {
          return <Image src={src} width={72} height={72} style={{ objectFit: 'cover' }} />;
        }
        if (typeof value === 'object' && value !== null) {
          return <span>{JSON.stringify(value)}</span>;
        }
        return <span>{String(value ?? '')}</span>;
      },
    }));
    const sourceLabel: Record<'test' | 'sample' | 'catalog', string> = {
      test: 'test.jsonl',
      sample: 'sample.jsonl',
      catalog: 'catalog previewData',
    };

    return (
      <Modal
        title={`Preview: ${selectedDataset.name}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              handleCreateTask(selectedDataset);
              setPreviewModalVisible(false);
            }}
          >
            Create Task
          </Button>,
        ]}
        width={1000}
      >
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Tag color={selectedDataset.source === 'huggingface' ? 'blue' : 'green'}>
              {selectedDataset.source === 'huggingface' ? 'HuggingFace' : 'Custom'}
            </Tag>
            <Tag color="purple">{selectedDataset.version}</Tag>
            <Tag color="orange">{selectedDataset.rowCount.toLocaleString()} rows</Tag>
            <Tag color="cyan">{selectedDataset.sizeMB} MB</Tag>
            <Tag color="blue">预览来源: {sourceLabel[previewSource]}</Tag>
          </Space>
        </div>

        {selectedDataset.metadata && (
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div><strong>Description:</strong> {selectedDataset.metadata.description}</div>
            <div style={{ marginTop: '8px' }}>
              <Space wrap>
                {selectedDataset.metadata.tags.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </Space>
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>Language:</strong> {selectedDataset.metadata.language}
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>License:</strong> {selectedDataset.metadata.license}
            </div>
          </div>
        )}

        <Card title="Data Preview (First 100 rows)" style={{ marginTop: '16px' }}>
          <Spin spinning={previewLoading}>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={{ pageSize: 10 }}
              scroll={{ y: 400 }}
              size="small"
            />
          </Spin>
        </Card>

        {relatedTasks.length > 0 && (
          <Card title="Related Tasks" style={{ marginTop: '16px' }}>
            <Table
              dataSource={relatedTasks.map((taskId: string) => ({
                key: taskId,
                taskId,
              }))}
              columns={[
                {
                  title: 'Task ID',
                  dataIndex: 'taskId',
                  key: 'taskId',
                  render: (text: string) => <code>{text}</code>,
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: any, record: any) => (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => handleViewRelatedTask(record.taskId)}
                    >
                      View Details
                    </Button>
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        )}
      </Modal>
    );
  };

  const renderUploadModal = () => (
    <Modal
      title="Upload New Dataset"
      open={uploadModalVisible}
      onCancel={() => setUploadModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
          Cancel
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={() => {
            message.success('Dataset uploaded successfully');
            setUploadModalVisible(false);
          }}
        >
          Upload
        </Button>,
      ]}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Dataset Name</label>
          <Input placeholder="Enter dataset name" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Description</label>
          <Input.TextArea rows={4} placeholder="Enter dataset description" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>File Format</label>
          <Select
            defaultValue="csv"
            style={{ width: '100%' }}
            options={[
              { label: 'CSV', value: 'csv' },
              { label: 'JSONL', value: 'jsonl' },
              { label: 'Parquet', value: 'parquet' },
            ]}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>Upload File</label>
          <Button icon={<CloudUploadOutlined />} block>
            Select File
          </Button>
        </div>
      </Space>
    </Modal>
  );

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>Dataset Assets Management</h2>

      <Card style={{ marginBottom: '24px' }}>
        <Tabs
          activeKey={sourceMode}
          onChange={(key) => setSourceMode(key as 'huggingface' | 'custom')}
          items={[
            {
              key: 'huggingface',
              label: (
                <span>
                  <SearchOutlined />
                  HuggingFace Market
                </span>
              ),
              children: <></>,
            },
            {
              key: 'custom',
              label: (
                <span>
                  <CloudUploadOutlined />
                  Custom Repository
                </span>
              ),
              children: <></>,
            },
          ]}
        />
      </Card>

      <Card
        title="Search & Filter"
        style={{ marginBottom: '24px' }}
      >
        <Input
          placeholder="Search datasets..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </Card>

      {sourceMode === 'huggingface' ? renderHuggingFaceMarket() : renderCustomDatasets()}

      {sourceMode === 'custom' && (
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleUpload}
          style={{ marginBottom: '24px' }}
        >
          Upload New Dataset
        </Button>
      )}

      {renderPreviewModal()}
      {renderUploadModal()}
    </div>
  );
};

export default DataManager;