import React, { useState } from 'react';
import { Radio, Select, Tag, Card, Row, Col, Table, Pagination } from 'antd';

interface ModelSelectorProps {
  selectedModel: string;
  selectedVersion: Record<string, string>;
  onModelChange: (model: string) => void;
  onVersionChange: (model: string, version: string) => void;
}

interface Model {
  id: string;
  name: string;
  icon: string;
  versions: { label: string; value: string }[];
  recommended?: boolean;
  isNew?: boolean;
}

const models: Model[] = [
  {
    id: 'qwen',
    name: '通义千问',
    icon: '🤖',
    versions: [
      { label: 'Qwen3', value: 'qwen3' },
      { label: 'Qwen3-Coder', value: 'qwen3-coder' },
      { label: 'Qwen3-235B-A2B-Thinking-2507', value: 'qwen3-235b-a2b-thinking-2507' },
      { label: 'Qwen2.5-72B-Instruct', value: 'qwen2.5-72b-instruct' },
    ],
    recommended: true,
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    icon: '🧠',
    versions: [
      { label: 'GPT-4', value: 'gpt4' },
      { label: 'GPT-4-Turbo', value: 'gpt4-turbo' },
      { label: 'GPT-4o', value: 'gpt4o' },
    ],
    recommended: true,
  },
  {
    id: 'doubao',
    name: '豆包',
    icon: '🌱',
    versions: [
      { label: 'Doubao-Pro-32k', value: 'doubao-pro-32k' },
      { label: 'Doubao-Pro-128k', value: 'doubao-pro-128k' },
    ],
    isNew: true,
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    icon: '🔍',
    versions: [
      { label: 'Deepseek-V2', value: 'deepseek-v2' },
      { label: 'Deepseek-Coder-V2', value: 'deepseek-coder-v2' },
    ],
  },
  {
    id: 'ernie',
    name: '文心一言',
    icon: '📝',
    versions: [
      { label: 'ERNIE-4.0', value: 'ernie-4.0' },
      { label: 'ERNIE-3.5', value: 'ernie-3.5' },
    ],
  },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  selectedVersion,
  onModelChange,
  onVersionChange,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
  };

  const handleVersionSelect = (modelId: string, version: string) => {
    onVersionChange(modelId, version);
  };

  const paginatedModels = models.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      title: '模型',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Model) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Radio
            checked={selectedModel === record.id}
            onChange={() => handleModelSelect(record.id)}
            style={{ marginRight: 12 }}
          />
          <span style={{ fontSize: 20, marginRight: 12 }}>{record.icon}</span>
          <span style={{ color: '#fff', fontSize: 16 }}>{text}</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
            {record.recommended && <Tag color="green">推荐</Tag>}
            {record.isNew && <Tag color="red">新</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: '版本选择',
      key: 'version',
      render: (_: unknown, record: Model) => (
        <Select
          placeholder="请选择版本"
          value={selectedVersion[record.id]}
          onChange={(value) => handleVersionSelect(record.id, value)}
          options={record.versions}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#fff' }}>
          选择模型
        </h3>
        <Select
          value={viewMode}
          onChange={setViewMode}
          style={{ width: 120 }}
          options={[
            { label: '卡片视图', value: 'card' },
            { label: '表格视图', value: 'table' },
          ]}
        />
      </div>

      {viewMode === 'card' ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedModels.map((model) => (
              <Col key={model.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  className={`model-card ${selectedModel === model.id ? 'active' : ''}`}
                  style={{
                    border: selectedModel === model.id ? '2px solid #1890ff' : '1px solid #434343',
                    backgroundColor: selectedModel === model.id ? '#2a2a3a' : '#1f1f1f',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  styles={{ body: { padding: '16px' } }}
                  onClick={() => handleModelSelect(model.id)}
                  hoverable
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Radio
                      checked={selectedModel === model.id}
                      onChange={() => handleModelSelect(model.id)}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontSize: 24, marginRight: 12 }}>{model.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 500, flex: 1, color: '#fff' }}>
                      {model.name}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {model.recommended && (
                        <Tag color="green">推荐</Tag>
                      )}
                      {model.isNew && (
                        <Tag color="red">新</Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ marginLeft: 32 }}>
                    <Select
                      placeholder="请选择版本"
                      value={selectedVersion[model.id]}
                      onChange={(value) => handleVersionSelect(model.id, value)}
                      options={model.versions}
                      style={{ width: '100%' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {models.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={models.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                style={{ color: '#fff' }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <Table
            dataSource={paginatedModels}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ backgroundColor: '#1f1f1f' }}
            rowClassName={(record) => selectedModel === record.id ? 'selected-row' : ''}
          />
          {models.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={models.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                style={{ color: '#fff' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
