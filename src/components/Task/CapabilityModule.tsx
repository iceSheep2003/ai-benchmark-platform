import React, { useState } from 'react';
import { Button, Checkbox, Card, Row, Col, Select, Divider, Space, Pagination, Table } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

interface CapabilityModuleProps {
  capabilities: any[];
  onCapabilitiesChange: (capabilities: any[]) => void;
}

interface Capability {
  id: string;
  title: string;
  description: string;
  icon: string;
  tests: { label: string; value: string }[];
  datasets: { label: string; value: string }[];
  selectedTests?: string[];
  selectedDatasets?: string[];
}

const initialCapabilities: Capability[] = [
  {
    id: 'language_understanding',
    title: '语言理解',
    description: '测试模型对自然语言的语义、语法、上下文关系的理解能力',
    icon: '📚',
    tests: [
      { label: '阅读理解', value: 'reading_comprehension' },
      { label: '语义分析', value: 'semantic_analysis' },
      { label: '上下文理解', value: 'context_understanding' },
    ],
    datasets: [
      { label: 'DomainInstructionSet (业务指令)', value: 'domain_instruction' },
      { label: 'XNLI', value: 'xnli' },
      { label: 'BoolQ', value: 'boolq' },
      { label: 'SQuAD', value: 'squad' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'logic_reasoning',
    title: '逻辑推理',
    description: '评估模型的数学计算、逻辑推理、问题解决能力',
    icon: '🧠',
    tests: [
      { label: '数学问题求解', value: 'math_problem_solving' },
      { label: '逻辑推理', value: 'logical_deduction' },
      { label: '常识推理', value: 'common_sense_reasoning' },
    ],
    datasets: [
      { label: 'MMLU', value: 'mmlu' },
      { label: 'GSM8K', value: 'gsm8k' },
      { label: 'RACE', value: 'race' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'text_generation',
    title: '文本生成',
    description: '测试模型的文本生成、创意表达、内容创作能力',
    icon: '✍️',
    tests: [
      { label: '文本生成', value: 'text_generation' },
      { label: '创意表达', value: 'creative_expression' },
      { label: '内容创作', value: 'content_creation' },
    ],
    datasets: [
      { label: 'CreativeWriting', value: 'creative_writing' },
      { label: 'StoryGeneration', value: 'story_generation' },
      { label: 'TextGeneration', value: 'text_generation' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'knowledge_qa',
    title: '知识问答',
    description: '评估模型的知识储备、事实问答、知识推理能力',
    icon: '🎯',
    tests: [
      { label: '事实问答', value: 'fact_qa' },
      { label: '知识推理', value: 'knowledge_reasoning' },
      { label: '领域知识', value: 'domain_knowledge' },
    ],
    datasets: [
      { label: 'TriviaQA', value: 'triviaqa' },
      { label: 'NaturalQuestions', value: 'naturalquestions' },
      { label: 'WebQuestions', value: 'webquestions' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'code_ability',
    title: '代码能力',
    description: '测试模型的代码生成、代码理解、代码调试能力',
    icon: '💻',
    tests: [
      { label: '代码生成', value: 'code_generation' },
      { label: '代码理解', value: 'code_understanding' },
      { label: '代码调试', value: 'code_debugging' },
    ],
    datasets: [
      { label: 'HumanEval', value: 'humaneval' },
      { label: 'MBPP', value: 'mbpp' },
      { label: 'CodeContests', value: 'codecontests' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
  {
    id: 'multilingual_ability',
    title: '多语言能力',
    description: '测试模型的多语言理解、翻译、跨语言应用能力',
    icon: '🌐',
    tests: [
      { label: '多语言理解', value: 'multilingual_understanding' },
      { label: '机器翻译', value: 'machine_translation' },
      { label: '跨语言推理', value: 'cross_lingual_reasoning' },
    ],
    datasets: [
      { label: 'FLORES', value: 'flores' },
      { label: 'WMT', value: 'wmt' },
      { label: 'XCOPA', value: 'xcopa' },
      { label: 'XQuAD', value: 'xquad' },
    ],
    selectedTests: [],
    selectedDatasets: [],
  },
];

export const CapabilityModule: React.FC<CapabilityModuleProps> = ({
  capabilities,
  onCapabilitiesChange,
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [localCapabilities, setLocalCapabilities] = React.useState<Capability[]>(
    capabilities.length > 0 ? capabilities : initialCapabilities
  );

  React.useEffect(() => {
    if (capabilities.length > 0) {
      setLocalCapabilities(capabilities);
    }
  }, [capabilities]);

  const handleToggleAll = () => {
    const allSelected = localCapabilities.every(
      cap => cap.selectedTests && cap.selectedTests.length > 0
    );

    const updatedCapabilities = localCapabilities.map(cap => {
      if (allSelected) {
        return {
          ...cap,
          selectedTests: [],
          selectedDatasets: [],
        };
      } else {
        return {
          ...cap,
          selectedTests: cap.tests.map(test => test.value),
          selectedDatasets: cap.datasets.map(dataset => dataset.value),
        };
      }
    });

    setLocalCapabilities(updatedCapabilities);
    onCapabilitiesChange(updatedCapabilities);
  };

  const handleTestChange = (capabilityId: string, checkedValues: string[]) => {
    const updatedCapabilities = localCapabilities.map(cap => {
      if (cap.id === capabilityId) {
        return {
          ...cap,
          selectedTests: checkedValues,
        };
      }
      return cap;
    });

    setLocalCapabilities(updatedCapabilities);
    onCapabilitiesChange(updatedCapabilities);
  };

  const handleDatasetChange = (capabilityId: string, selectedValues: string[]) => {
    const updatedCapabilities = localCapabilities.map(cap => {
      if (cap.id === capabilityId) {
        return {
          ...cap,
          selectedDatasets: selectedValues,
        };
      }
      return cap;
    });

    setLocalCapabilities(updatedCapabilities);
    onCapabilitiesChange(updatedCapabilities);
  };

  const isAllSelected = localCapabilities.every(
    cap => cap.selectedTests && cap.selectedTests.length > 0
  );

  const paginatedCapabilities = localCapabilities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      title: '能力维度',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Capability) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 20, marginRight: 12 }}>{record.icon}</span>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{text}</span>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span style={{ color: '#999', fontSize: 14 }}>{text}</span>
      ),
    },
    {
      title: '测试项',
      key: 'tests',
      render: (_: unknown, record: Capability) => (
        <Checkbox.Group
          value={record.selectedTests || []}
          onChange={(values) => handleTestChange(record.id, values as string[])}
        >
          <Space direction="vertical" size="small">
            {record.tests.map((test) => (
              <Checkbox key={test.value} value={test.value} style={{ color: '#fff' }}>
                {test.label}
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      ),
    },
    {
      title: '测试数据集',
      key: 'datasets',
      render: (_: unknown, record: Capability) => (
        <Select
          mode="multiple"
          placeholder="请选择测试数据集"
          value={record.selectedDatasets || []}
          onChange={(values) => handleDatasetChange(record.id, values as string[])}
          options={record.datasets}
          style={{ width: '100%' }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
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
          能力测试
        </h3>
        <Space>
          <Button 
            type="link" 
            onClick={handleToggleAll}
            style={{ padding: 0, color: '#1890ff' }}
          >
            {isAllSelected ? (
              <>
                <CloseOutlined style={{ marginRight: 4 }} />
                全不选
              </>
            ) : (
              <>
                <CheckOutlined style={{ marginRight: 4 }} />
                全选
              </>
            )}
          </Button>
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
      </div>

      {viewMode === 'card' ? (
        <>
          <Row gutter={[16, 16]}>
            {paginatedCapabilities.map((capability) => (
              <Col key={capability.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  style={{
                    border: capability.selectedTests && capability.selectedTests.length > 0 
                      ? '2px solid #1890ff' 
                      : '1px solid #434343',
                    backgroundColor: capability.selectedTests && capability.selectedTests.length > 0 
                      ? '#2a2a3a' 
                      : '#1f1f1f',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 24, marginRight: 12 }}>{capability.icon}</span>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>
                        {capability.title}
                      </h4>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: 14, 
                      color: '#999',
                      lineHeight: 1.5 
                    }}>
                      {capability.description}
                    </p>
                  </div>

                  <Divider style={{ margin: '12px 0', borderColor: '#434343' }} />

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: '#fff'
                    }}>
                      测试项：
                    </label>
                    <Checkbox.Group
                      value={capability.selectedTests || []}
                      onChange={(values) => handleTestChange(capability.id, values as string[])}
                      style={{ width: '100%' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {capability.tests.map((test) => (
                          <Checkbox key={test.value} value={test.value} style={{ color: '#fff' }}>
                            {test.label}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </div>

                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: 8, 
                      fontSize: 14, 
                      fontWeight: 500,
                      color: '#fff'
                    }}>
                      测试数据集：
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="请选择测试数据集"
                      value={capability.selectedDatasets || []}
                      onChange={(values) => handleDatasetChange(capability.id, values as string[])}
                      options={capability.datasets}
                      style={{ width: '100%' }}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          {localCapabilities.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={localCapabilities.length}
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
            dataSource={paginatedCapabilities}
            columns={columns}
            rowKey="id"
            pagination={false}
            style={{ backgroundColor: '#1f1f1f' }}
            rowClassName={(record) => 
              record.selectedTests && record.selectedTests.length > 0 ? 'selected-row' : ''
            }
          />
          {localCapabilities.length > pageSize && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={currentPage}
                total={localCapabilities.length}
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
