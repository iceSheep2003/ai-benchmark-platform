import React, { useState } from 'react';
import { Radio, Select, Tag, Card, Row, Col, Table, Pagination } from 'antd';
import './LLMEvaluationConfig.css';

interface AcceleratorSelectorProps {
  selectedAccelerator: string;
  onAcceleratorChange: (accelerator: string) => void;
}

interface Accelerator {
  id: string;
  name: string;
  icon: string;
  description: string;
  recommended?: boolean;
}

const accelerators: Accelerator[] = [
  {
    id: 'nvidia-a100',
    name: 'NVIDIA A100',
    icon: '🟢',
    description: '80GB HBM2e 显存',
    recommended: true,
  },
  {
    id: 'nvidia-v100',
    name: 'NVIDIA V100',
    icon: '🟢',
    description: '32GB HBM2 显存',
  },
  {
    id: 'huawei-910b',
    name: '华为昇腾 910B',
    icon: '🔴',
    description: '64GB HBM 显存',
    recommended: true,
  },
  {
    id: 'hygon-k100',
    name: '海光 K100',
    icon: '🔵',
    description: '32GB GDDR6 显存',
  },
  {
    id: 'maxx-c500',
    name: '沐曦 C500',
    icon: '🟡',
    description: '32GB HBM 显存',
  },
  {
    id: 'maxx-c650',
    name: '沐曦 C650',
    icon: '🟡',
    description: '64GB HBM 显存',
  },
  {
    id: 'kunlun-480',
    name: '昆仑芯 480',
    icon: '🟣',
    description: '32GB HBM 显存',
  },
  {
    id: 'nvidia-h100',
    name: 'NVIDIA H100',
    icon: '🟢',
    description: '80GB HBM3 显存',
    recommended: true,
  },
];

export const AcceleratorSelector: React.FC<AcceleratorSelectorProps> = ({
  selectedAccelerator,
  onAcceleratorChange,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleAcceleratorSelect = (acceleratorId: string) => {
    onAcceleratorChange(acceleratorId);
  };

  const paginatedAccelerators = accelerators.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      title: '加速卡',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Accelerator) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Radio
            checked={selectedAccelerator === record.id}
            onChange={() => handleAcceleratorSelect(record.id)}
            style={{ marginRight: 12 }}
          />
          <span style={{ fontSize: 20, marginRight: 12 }}>{record.icon}</span>
          <span style={{ color: '#fff', fontSize: 16 }}>{text}</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
            {record.recommended && <Tag color="green">推荐</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: '规格描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span style={{ color: '#999', fontSize: 14 }}>{text}</span>
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
          选择加速卡
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
            {paginatedAccelerators.map((accelerator) => (
              <Col key={accelerator.id} xs={24} sm={12}>
                <Card
                  className={`accelerator-card ${selectedAccelerator === accelerator.id ? 'active' : ''}`}
                  style={{
                    border: selectedAccelerator === accelerator.id ? '2px solid #1890ff' : '1px solid #434343',
                    backgroundColor: selectedAccelerator === accelerator.id ? '#2a2a3a' : '#1f1f1f',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  styles={{ body: { padding: '16px' } }}
                  onClick={() => handleAcceleratorSelect(accelerator.id)}
                  hoverable
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <Radio
                      checked={selectedAccelerator === accelerator.id}
                      onChange={() => handleAcceleratorSelect(accelerator.id)}
                      style={{ marginRight: 12 }}
                    />
                    <span style={{ fontSize: 24, marginRight: 12 }}>{accelerator.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', marginBottom: 4 }}>
                        {accelerator.name}
                      </div>
                      <div style={{ fontSize: 14, color: '#999' }}>
                        {accelerator.description}
                      </div>
                    </div>
                    {accelerator.recommended && (
                      <Tag color="green">推荐</Tag>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {accelerators.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={accelerators.length}
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
            dataSource={paginatedAccelerators}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ backgroundColor: '#1f1f1f' }}
            rowClassName={(record) => selectedAccelerator === record.id ? 'selected-row' : ''}
          />
          {accelerators.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={accelerators.length}
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
