import React, { useState, useMemo } from 'react';
import { Card, Select, Button, Table, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAppStore } from '../store/appStore';
import type { BenchmarkTask } from '../types';

interface AssetBasedComparisonProps {
  onTaskSelect?: (taskIds: string[]) => void;
}

interface ComparisonResult {
  taskId: string;
  taskName: string;
  model: string;
  dataset: string;
  accelerator: string;
  throughput: number;
  latency: number;
  gpuUtil: number;
  costPerToken: number;
}

export const AssetBasedComparison: React.FC<AssetBasedComparisonProps> = ({ onTaskSelect }) => {
  const { tasks, setCurrentPage } = useAppStore();
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [selectedDataset, setSelectedDataset] = useState<string | undefined>();
  const [selectedAccelerator, setSelectedAccelerator] = useState<string | undefined>();
  const [filteredTasks, setFilteredTasks] = useState<BenchmarkTask[]>([]);

  const uniqueModels = useMemo(() => {
    const models = new Map<string, string>();
    tasks.forEach(task => {
      const modelName = task.dataLineage?.datasetName || '-';
      if (!models.has(modelName)) {
        models.set(modelName, task.workflowId);
      }
    });
    return Array.from(models.entries()).map(([name, id]) => ({ label: name, value: id }));
  }, [tasks]);

  const uniqueDatasets = useMemo(() => {
    const datasets = new Map<string, string>();
    tasks.forEach(task => {
      const datasetName = task.dataLineage?.datasetName || '-';
      const hash = task.dataLineage?.datasetVersionHash || '-';
      if (!datasets.has(datasetName)) {
        datasets.set(datasetName, hash);
      }
    });
    return Array.from(datasets.entries()).map(([name, hash]) => ({ label: name, value: hash }));
  }, [tasks]);

  const uniqueAccelerators = useMemo(() => {
    const accelerators = new Set<string>();
    tasks.forEach(task => {
      accelerators.add(task.resources?.cardModel || 'Unknown');
    });
    return Array.from(accelerators).map(name => ({ label: name, value: name }));
  }, [tasks]);

  const handleFilter = () => {
    let filtered = tasks.filter(task => task.status === 'SUCCESS');
    
    if (selectedModel) {
      filtered = filtered.filter(task => task.workflowId === selectedModel);
    }
    
    if (selectedDataset) {
      filtered = filtered.filter(task => task.dataLineage?.datasetVersionHash === selectedDataset);
    }
    
    if (selectedAccelerator) {
      filtered = filtered.filter(task => task.resources?.cardModel === selectedAccelerator);
    }
    
    setFilteredTasks(filtered);
    
    if (filtered.length === 0) {
      message.warning('No tasks found matching the selected criteria');
    } else {
      message.success(`Found ${filtered.length} tasks matching the criteria`);
    }
  };

  const handleReset = () => {
    setSelectedModel(undefined);
    setSelectedDataset(undefined);
    setSelectedAccelerator(undefined);
    setFilteredTasks([]);
  };

  const handleCompareTasks = () => {
    if (filteredTasks.length < 2) {
      message.error('Please select at least 2 tasks for comparison');
      return;
    }
    
    const taskIds = filteredTasks.map(task => task.id);
    if (onTaskSelect) {
      onTaskSelect(taskIds);
    } else {
      setCurrentPage('comparison');
    }
  };

  const comparisonData: ComparisonResult[] = useMemo(() => {
    return filteredTasks.map(task => {
      const latestMetrics = task.metrics?.[task.metrics.length - 1];
      return {
        taskId: task.id,
        taskName: task.name,
        model: task.workflowId,
        dataset: task.dataLineage?.datasetName || '-',
        accelerator: task.resources?.cardModel || '-',
        throughput: latestMetrics?.throughput || 0,
        latency: latestMetrics?.latency_p99 || 0,
        gpuUtil: latestMetrics?.gpu_util || 0,
        costPerToken: latestMetrics?.throughput ? (task.resourceRequest?.count || 1) / latestMetrics.throughput : 0,
      };
    });
  }, [filteredTasks]);

  const columns: ColumnsType<ComparisonResult> = [
    {
      title: 'Task Name',
      dataIndex: 'taskName',
      key: 'taskName',
      fixed: 'left',
      width: 200,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Dataset',
      dataIndex: 'dataset',
      key: 'dataset',
      width: 150,
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Accelerator',
      dataIndex: 'accelerator',
      key: 'accelerator',
      width: 150,
      render: (text) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: 'Throughput',
      dataIndex: 'throughput',
      key: 'throughput',
      width: 120,
      sorter: (a, b) => a.throughput - b.throughput,
      render: (value) => `${value.toFixed(2)} tokens/s`,
    },
    {
      title: 'Latency (p99)',
      dataIndex: 'latency',
      key: 'latency',
      width: 120,
      sorter: (a, b) => a.latency - b.latency,
      render: (value) => `${value.toFixed(2)} ms`,
    },
    {
      title: 'GPU Util',
      dataIndex: 'gpuUtil',
      key: 'gpuUtil',
      width: 100,
      sorter: (a, b) => a.gpuUtil - b.gpuUtil,
      render: (value) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: 'Cost/Token',
      dataIndex: 'costPerToken',
      key: 'costPerToken',
      width: 120,
      sorter: (a, b) => a.costPerToken - b.costPerToken,
      render: (value) => `$${value.toFixed(4)}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Asset-Based Performance Comparison"
        extra={
          <Space>
            <Button onClick={handleReset}>Reset Filters</Button>
            <Button type="primary" onClick={handleCompareTasks} disabled={filteredTasks.length < 2}>
              Compare Selected Tasks
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }} size="large">
          <div>
            <Space style={{ width: '100%' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Select Model
                </label>
                <Select
                  placeholder="Choose a model"
                  style={{ width: '100%' }}
                  value={selectedModel}
                  onChange={setSelectedModel}
                  options={uniqueModels}
                  allowClear
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Select Dataset
                </label>
                <Select
                  placeholder="Choose a dataset"
                  style={{ width: '100%' }}
                  value={selectedDataset}
                  onChange={setSelectedDataset}
                  options={uniqueDatasets}
                  allowClear
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Select Accelerator
                </label>
                <Select
                  placeholder="Choose an accelerator"
                  style={{ width: '100%' }}
                  value={selectedAccelerator}
                  onChange={setSelectedAccelerator}
                  options={uniqueAccelerators}
                  allowClear
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button type="primary" size="large" onClick={handleFilter}>
                  Filter Tasks
                </Button>
              </div>
            </Space>
          </div>
          
          <div style={{ fontSize: '14px', color: '#999' }}>
            Select one or more criteria to filter tasks. Tasks will be filtered based on the selected model, dataset, and accelerator combinations.
          </div>
        </Space>

        {filteredTasks.length > 0 && (
          <Table
            columns={columns}
            dataSource={comparisonData}
            rowKey="taskId"
            scroll={{ x: 'max-content' }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tasks`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default AssetBasedComparison;