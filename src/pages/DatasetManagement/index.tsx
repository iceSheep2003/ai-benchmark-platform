import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Table, 
  Input, 
  Select, 
  Space, 
  Modal, 
  message, 
  Statistic,
  Progress,
  Alert,
  Typography,
  Divider,
  Tooltip,
  Avatar,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  EyeOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { Dataset, DatasetFilter, DatasetStats } from '../../types/dataset';
import { TASK_TYPE_LABELS, TASK_TYPE_ICONS, EVALUATION_DIMENSION_LABELS, DATASET_SOURCE_LABELS } from '../../types/dataset';
import { loadDatasetCatalog } from '../../services/datasetCatalogService';
import DatasetDetailDashboard from './DatasetDetailDashboard';

const { Title, Text } = Typography;

interface DatasetManagementProps {
  category: 'llm' | 'hardware';
  source?: 'open-source' | 'self-built';
}

export const DatasetManagement: React.FC<DatasetManagementProps> = ({ category, source }) => {
  const [allDatasets, setAllDatasets] = useState<Dataset[]>([]);
  const [datasetLoadingError, setDatasetLoadingError] = useState<string>('');
  const [filter, setFilter] = useState<DatasetFilter>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [qualityReportModalVisible, setQualityReportModalVisible] = useState(false);
  const [versionCompareModalVisible, setVersionCompareModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  React.useEffect(() => {
    const load = async () => {
      try {
        const datasets = await loadDatasetCatalog();
        setAllDatasets(datasets);
        setDatasetLoadingError('');
      } catch (error) {
        setDatasetLoadingError(error instanceof Error ? error.message : '加载数据集目录失败');
      }
    };
    void load();
  }, []);

  const taskTypes = useMemo(() => {
    if (category === 'llm') {
      return ['multi-turn-dialogue', 'instruction-following', 'reasoning', 'multilingual-understanding', 'knowledge-application', 'code-understanding'];
    } else {
      return ['training', 'inference', 'matrix-computation'];
    }
  }, [category]);
  const evaluationDimensions = ['functionality', 'performance', 'compatibility', 'reliability'];
  const frameworks = ['PyTorch', 'TensorFlow', 'ONNX'];
  const hardwareOptions = ['CUDA', '昇腾', '昆仑芯'];

  const datasets = useMemo(() => {
    return allDatasets.filter(dataset => {
      const categoryMatch = category === 'llm' 
        ? ['multi-turn-dialogue', 'instruction-following', 'reasoning', 'multilingual-understanding', 'knowledge-application', 'code-understanding'].includes(dataset.taskType)
        : ['training', 'inference', 'matrix-computation'].includes(dataset.taskType);
      const sourceMatch = source ? dataset.source === source : true;
      return categoryMatch && sourceMatch;
    });
  }, [allDatasets, category, source]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => {
      if (filter.taskTypes && filter.taskTypes.length > 0) {
        if (!filter.taskTypes.includes(dataset.taskType)) return false;
      }
      if (filter.evaluationDimensions && filter.evaluationDimensions.length > 0) {
        if (!filter.evaluationDimensions.includes(dataset.evaluationDimension)) return false;
      }
      if (filter.frameworks && filter.frameworks.length > 0) {
        if (!filter.frameworks.some(f => dataset.frameworks.includes(f))) return false;
      }
      if (filter.hardware && filter.hardware.length > 0) {
        if (!filter.hardware.some(h => dataset.hardwareDependencies.includes(h))) return false;
      }
      if (filter.sources && filter.sources.length > 0) {
        if (!filter.sources.includes(dataset.source)) return false;
      }
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (!dataset.name.toLowerCase().includes(keyword) &&
            !dataset.hardwareDependencies.some(h => h.toLowerCase().includes(keyword)) &&
            !dataset.frameworks.some(f => f.toLowerCase().includes(keyword))) {
          return false;
        }
      }
      return true;
    });
  }, [datasets, filter, searchKeyword]);

  const stats = useMemo<DatasetStats>(() => {
    const totalCount = filteredDatasets.length;
    const openSourceCount = filteredDatasets.filter(d => d.source === 'open-source').length;
    const selfBuiltCount = filteredDatasets.filter(d => d.source === 'self-built').length;
    const openSourcePercentage = totalCount > 0 ? (openSourceCount / totalCount) * 100 : 0;
    const selfBuiltPercentage = totalCount > 0 ? (selfBuiltCount / totalCount) * 100 : 0;
    const isCompliant = openSourcePercentage <= 70 && selfBuiltPercentage >= 30;

    return {
      openSourceCount,
      selfBuiltCount,
      totalCount,
      openSourcePercentage,
      selfBuiltPercentage,
      isCompliant,
    };
  }, [filteredDatasets]);

  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setDetailModalVisible(true);
  };

  const handleUpload = () => {
    setUploadModalVisible(true);
  };

  const handleDownload = (dataset: Dataset) => {
    const sampleFile = (dataset as Dataset & { files?: { sample?: string } }).files?.sample;
    Modal.confirm({
      title: '下载/调用数据集',
      content: (
        <div>
          <p>数据集名称: {dataset.name}</p>
          <p>版本: v{dataset.version}</p>
          {sampleFile && <p>样本文件: <code>{sampleFile}</code></p>}
          <p>请选择操作方式:</p>
        </div>
      ),
      okText: '下载',
      cancelText: 'API调用',
      onOk: () => {
        message.success(sampleFile ? `样本文件路径: ${sampleFile}` : `下载 ${dataset.name} 成功`);
      },
      onCancel: () => {
        message.success(`已生成 ${dataset.name} 的API调用请求`);
      },
    });
  };

  const getCategoryTitle = () => {
    const categoryText = category === 'llm' ? '大模型评测' : '硬件性能评测';
    const sourceText = source ? DATASET_SOURCE_LABELS[source] : '';
    return sourceText ? `${categoryText}数据集 - ${sourceText}` : `${categoryText}数据集`;
  };

  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {filteredDatasets.map((dataset) => (
        <Col xs={24} sm={24} md={12} lg={8} xl={6} key={dataset.id}>
          <Card
            hoverable
            style={{ height: '100%' }}
            actions={[
              <Button
                key="view"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(dataset)}
              >
                查看
              </Button>,
              <Button
                key="download"
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={() => handleDownload(dataset)}
              >
                下载
              </Button>,
            ]}
          >
            <Card.Meta
              title={
                <Space>
                  <span>{dataset.name}</span>
                  <Tag color={dataset.source === 'open-source' ? 'blue' : 'green'}>
                    {DATASET_SOURCE_LABELS[dataset.source]}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color="purple">v{dataset.version}</Tag>
                    <Tag color="orange">{dataset.sampleCount.toLocaleString()} 样本</Tag>
                    <Tag color={dataset.qualityScore >= 80 ? 'green' : dataset.qualityScore >= 60 ? 'orange' : 'red'}>
                      评分: {dataset.qualityScore}
                    </Tag>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    <Space size={[4, 4]} wrap>
                      {TASK_TYPE_ICONS[dataset.taskType]}
                      <span>{TASK_TYPE_LABELS[dataset.taskType]}</span>
                    </Space>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    <Space size={[4, 4]} wrap>
                      {dataset.hardwareDependencies.map(dep => (
                        <Tag key={dep} color="blue" style={{ fontSize: '11px' }}>{dep}</Tag>
                      ))}
                    </Space>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    <Space size={[4, 4]} wrap>
                      {dataset.frameworks.map(fw => (
                        <Tag key={fw} color="green" style={{ fontSize: '11px' }}>{fw}</Tag>
                      ))}
                    </Space>
                  </div>
                  {dataset.source === 'self-built' && dataset.uploadedBy && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <Space size={4}>
                        <Avatar 
                          size="small" 
                          src={dataset.uploadedByAvatar}
                          style={{ backgroundColor: '#1890ff' }}
                        >
                          {dataset.uploadedBy?.charAt(0) || 'U'}
                        </Avatar>
                        <span>上传人: {dataset.uploadedBy}</span>
                      </Space>
                    </div>
                  )}
                </div>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  const renderTableView = () => {
    const columns = [
      {
        title: '数据集名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        render: (text: string, record: Dataset) => (
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              v{record.version}
            </Text>
          </div>
        ),
      },
      {
        title: '任务类型',
        dataIndex: 'taskType',
        key: 'taskType',
        width: 120,
        render: (taskType: keyof typeof TASK_TYPE_LABELS) => (
          <Space>
            <span>{TASK_TYPE_ICONS[taskType]}</span>
            <span>{TASK_TYPE_LABELS[taskType]}</span>
          </Space>
        ),
      },
      {
        title: '样本数量',
        dataIndex: 'sampleCount',
        key: 'sampleCount',
        width: 100,
        render: (count: number) => count.toLocaleString(),
      },
      {
        title: '质量综合评分',
        dataIndex: 'qualityScore',
        key: 'qualityScore',
        width: 120,
        render: (score: number) => {
          let color = '#52c41a';
          if (score < 60) color = '#ff4d4f';
          else if (score < 80) color = '#faad14';
          return <Tag color={color}>{score}</Tag>;
        },
      },
      {
        title: '语言分布',
        dataIndex: 'languageDistribution',
        key: 'languageDistribution',
        width: 120,
      },
      {
        title: '硬件依赖',
        dataIndex: 'hardwareDependencies',
        key: 'hardwareDependencies',
        width: 150,
        render: (dependencies: string[]) => (
          <Space size={[4, 4]} wrap>
            {dependencies.map(dep => (
              <Tag key={dep} color="blue">{dep}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
      },
      {
        title: '上传人',
        key: 'uploadedBy',
        width: 150,
        render: (_: unknown, record: Dataset) => {
          if (record.source === 'self-built' && record.uploadedBy) {
            return (
              <Space size={4}>
                <Avatar 
                  size="small" 
                  src={record.uploadedByAvatar}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {record.uploadedBy?.charAt(0) || 'U'}
                </Avatar>
                <span>{record.uploadedBy}</span>
              </Space>
            );
          }
          return <span style={{ color: '#999' }}>-</span>;
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        fixed: 'right' as const,
        render: (_: unknown, record: Dataset) => (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button 
                type="text" 
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
              />
            </Tooltip>
            <Tooltip title="下载/调用">
              <Button 
                type="text" 
                icon={<ApiOutlined />}
                onClick={() => handleDownload(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={filteredDatasets}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`,
        }}
      />
    );
  };

  const renderUploadModal = () => (
    <Modal
      title="上传新数据集"
      open={uploadModalVisible}
      onCancel={() => setUploadModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
          取消
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={() => {
            message.success('数据集上传成功');
            setUploadModalVisible(false);
          }}
        >
          上传
        </Button>,
      ]}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>数据集名称</label>
          <Input placeholder="输入数据集名称" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>描述</label>
          <Input.TextArea rows={4} placeholder="输入数据集描述" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>任务类型</label>
          <Select
            placeholder="选择任务类型"
            style={{ width: '100%' }}
            options={taskTypes.map(type => ({
              label: TASK_TYPE_LABELS[type as keyof typeof TASK_TYPE_LABELS],
              value: type,
            }))}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>测评维度</label>
          <Select
            placeholder="选择测评维度"
            style={{ width: '100%' }}
            options={evaluationDimensions.map(dim => ({
              label: EVALUATION_DIMENSION_LABELS[dim as keyof typeof EVALUATION_DIMENSION_LABELS],
              value: dim,
            }))}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>文件格式</label>
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
          <label style={{ display: 'block', marginBottom: '8px' }}>上传文件</label>
          <Button icon={<CloudUploadOutlined />} block>
            选择文件
          </Button>
        </div>
      </Space>
    </Modal>
  );

  const renderQualityReportModal = () => (
    <Modal
      title="质量报告"
      open={qualityReportModalVisible}
      onCancel={() => setQualityReportModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setQualityReportModalVisible(false)}>
          关闭
        </Button>,
      ]}
      width={800}
    >
      {selectedDataset && (
        <div>
          <Title level={5}>{selectedDataset.name} - 质量报告</Title>
          <Alert
            message="质量综合评分"
            description={selectedDataset.qualityScore}
            type={selectedDataset.qualityScore >= 80 ? 'success' : selectedDataset.qualityScore >= 60 ? 'warning' : 'error'}
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Space orientation="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>功能维度: </Text>
              <Progress percent={85} />
            </div>
            <div>
              <Text strong>性能维度: </Text>
              <Progress percent={90} />
            </div>
            <div>
              <Text strong>兼容性维度: </Text>
              <Progress percent={75} />
            </div>
            <div>
              <Text strong>可靠性维度: </Text>
              <Progress percent={88} />
            </div>
          </Space>
        </div>
      )}
    </Modal>
  );

  const renderVersionCompareModal = () => (
    <Modal
      title="版本对比"
      open={versionCompareModalVisible}
      onCancel={() => setVersionCompareModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setVersionCompareModalVisible(false)}>
          关闭
        </Button>,
      ]}
      width={1000}
    >
      {selectedDataset && (
        <div>
          <Title level={5}>{selectedDataset.name} - 版本对比</Title>
          <Table
            columns={[
              { title: '版本', dataIndex: 'version', key: 'version' },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: Date) => new Date(date).toLocaleString('zh-CN') },
              { title: '变更内容', dataIndex: 'changes', key: 'changes', render: (changes: string[]) => changes.join(', ') },
            ]}
            dataSource={selectedDataset.versions}
            rowKey="version"
            pagination={false}
          />
        </div>
      )}
    </Modal>
  );

  return (
    <div style={{ padding: '24px', background: '#141414', minHeight: '100vh' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Title level={4} style={{ margin: 0 }}>
                {getCategoryTitle()}
              </Title>
              <Space>
                <Input
                  placeholder="搜索数据集、框架、硬件..."
                  prefix={<SearchOutlined />}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                <Select
                  value={viewMode}
                  onChange={setViewMode}
                  style={{ width: 120 }}
                  options={[
                    { label: '卡片视图', value: 'card' },
                    { label: '表格视图', value: 'table' },
                  ]}
                />
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {datasetLoadingError && (
        <Alert
          type="error"
          showIcon
          message="数据集目录加载失败"
          description={datasetLoadingError}
          style={{ marginBottom: '24px' }}
        />
      )}

      {!source && (
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Statistic
                title="数据集总数"
                value={stats.totalCount}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Statistic
                title="开源数据集"
                value={stats.openSourceCount}
                prefix={<CheckCircleOutlined />}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <Statistic
                title="自建数据集"
                value={stats.selfBuiltCount}
                prefix={<CloseCircleOutlined />}
                styles={{ content: { color: '#52c41a' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
              <div>
                <Text type="secondary">合规性状态</Text>
                <div style={{ marginTop: '8px' }}>
                  {stats.isCompliant ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      合规 (开源≤70%, 自建≥30%)
                    </Tag>
                  ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                      不合规 (开源≤70%, 自建≥30%)
                    </Tag>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <div>
                <Text type="secondary">开源数据集占比</Text>
                <Progress 
                  percent={stats.openSourcePercentage} 
                  status={stats.openSourcePercentage > 70 ? 'exception' : 'active'}
                  strokeColor={stats.openSourcePercentage > 70 ? '#ff4d4f' : '#1890ff'}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <div>
                <Text type="secondary">自建数据集占比</Text>
                <Progress 
                  percent={stats.selfBuiltPercentage} 
                  status={stats.selfBuiltPercentage < 30 ? 'exception' : 'active'}
                  strokeColor={stats.selfBuiltPercentage < 30 ? '#ff4d4f' : '#52c41a'}
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card 
        title={
          <Space>
            <FilterOutlined />
            <span>高级筛选</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <div>
              <Text strong>任务类别</Text>
              <Select
                mode="multiple"
                placeholder="选择任务类别"
                style={{ width: '100%', marginTop: '8px' }}
                value={filter.taskTypes}
                onChange={(value) => setFilter({ ...filter, taskTypes: value })}
                options={taskTypes.map(type => ({
                  label: TASK_TYPE_LABELS[type as keyof typeof TASK_TYPE_LABELS],
                  value: type,
                }))}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <div>
              <Text strong>测评维度</Text>
              <Select
                mode="multiple"
                placeholder="选择测评维度"
                style={{ width: '100%', marginTop: '8px' }}
                value={filter.evaluationDimensions}
                onChange={(value) => setFilter({ ...filter, evaluationDimensions: value })}
                options={evaluationDimensions.map(dim => ({
                  label: EVALUATION_DIMENSION_LABELS[dim as keyof typeof EVALUATION_DIMENSION_LABELS],
                  value: dim,
                }))}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <div>
              <Text strong>技术栈适配</Text>
              <Select
                mode="multiple"
                placeholder="选择框架和硬件"
                style={{ width: '100%', marginTop: '8px' }}
                value={[...(filter.frameworks || []), ...(filter.hardware || [])]}
                onChange={(value: string[]) => {
                  const selectedFrameworks = value.filter(v => frameworks.includes(v));
                  const selectedHardware = value.filter(v => hardwareOptions.includes(v));
                  setFilter({ ...filter, frameworks: selectedFrameworks, hardware: selectedHardware });
                }}
                options={[
                  ...frameworks.map(f => ({ label: f, value: f })),
                  ...hardwareOptions.map(h => ({ label: h, value: h })),
                ]}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <div>
              <Text strong>数据来源</Text>
              <Select
                mode="multiple"
                placeholder="选择数据来源"
                style={{ width: '100%', marginTop: '8px' }}
                value={filter.sources}
                onChange={(value) => setFilter({ ...filter, sources: value })}
                options={[
                  { label: '开源', value: 'open-source' },
                  { label: '自建', value: 'self-built' },
                ]}
              />
            </div>
          </Col>
        </Row>
        <Divider />
        <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button onClick={() => setFilter({})}>重置筛选</Button>
            <Button type="primary" icon={<SearchOutlined />}>应用筛选</Button>
          </Space>
          {(!source || source === 'self-built') && (
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleUpload}
            >
              上传新数据集
            </Button>
          )}
        </Space>
      </Card>

      {viewMode === 'card' ? renderCardView() : renderTableView()}

      {selectedDataset && (
        <DatasetDetailDashboard
          dataset={selectedDataset}
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          category={category}
        />
      )}
      {renderUploadModal()}
      {renderQualityReportModal()}
      {renderVersionCompareModal()}
    </div>
  );
};

export default DatasetManagement;