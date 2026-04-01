import React, { useMemo, useState } from 'react';
import { Table, Card, Tag, Button, Space, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ComparisonResult, BenchmarkTask } from '../types';
import { useAppStore } from '../store/appStore';

interface ComparisonMatrixProps {
  comparisonResult?: ComparisonResult;
  tasks?: BenchmarkTask[];
}

interface ComparisonRow {
  key: string;
  dimension: string;
  scores: Record<string, { value: number; change?: number }>;
  bottleneck?: Record<string, string>;
}

const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  comparisonResult: propComparisonResult,
  tasks: propTasks,
}) => {
  const { tasks: storeTasks, generateComparison, getComparisonForTasks } = useAppStore();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [currentComparison, setCurrentComparison] = useState<ComparisonResult | null>(propComparisonResult || null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const tasks = propTasks || storeTasks;
  
  const handleGenerateComparison = () => {
    if (selectedTaskIds.length < 2) {
      message.error('Please select at least 2 tasks for comparison');
      return;
    }
    
    setIsGenerating(true);
    try {
      const existingComparison = getComparisonForTasks(selectedTaskIds);
      if (existingComparison) {
        setCurrentComparison(existingComparison);
        message.success('Loaded existing comparison');
      } else {
        const newComparison = generateComparison(selectedTaskIds);
        setCurrentComparison(newComparison);
        message.success('Comparison generated successfully');
      }
    } catch (error) {
      message.error('Failed to generate comparison: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };
  const taskMap = useMemo(() => {
    const map = new Map<string, BenchmarkTask>();
    tasks.forEach((task) => map.set(task.id, task));
    return map;
  }, [tasks]);

  const columns: ColumnsType<ComparisonRow> = useMemo(() => {
    const baseColumns: ColumnsType<ComparisonRow> = [
      {
        title: 'Dimension',
        dataIndex: 'dimension',
        key: 'dimension',
        fixed: 'left',
        width: 150,
        render: (text) => <strong>{text}</strong>,
      },
    ];

    if (!currentComparison) return baseColumns;

    const taskColumns: ColumnsType<ComparisonRow> = currentComparison.taskIdList.map(
      (taskId: string) => {
        const task = taskMap.get(taskId);
        return {
          title: task ? `${task.name} (${task.resources?.cardModel || 'Unknown'})` : taskId,
          dataIndex: ['scores', taskId],
          key: taskId,
          width: 180,
          render: (score: { value: number; change?: number }) => {
            if (!score) return '-';
            
            const { value, change } = score;
            const isMax = currentComparison.dimensions.some(
              (dim) => dim.scores[taskId] === value && dim.scores[taskId] === Math.max(...Object.values(dim.scores))
            );
            const isMin = currentComparison.dimensions.some(
              (dim) => dim.scores[taskId] === value && dim.scores[taskId] === Math.min(...Object.values(dim.scores))
            );

            let cellStyle = {};
            if (isMax && currentComparison.taskIdList.length > 1) {
              cellStyle = { backgroundColor: 'rgba(82, 196, 26, 0.15)' };
            } else if (isMin && currentComparison.taskIdList.length > 1) {
              cellStyle = { backgroundColor: 'rgba(255, 77, 79, 0.15)' };
            }

            return (
              <div style={cellStyle}>
                <Space orientation="vertical" size={0}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {value.toFixed(1)}
                  </span>
                  {change !== undefined && (
                    <Tag
                      color={change >= 0 ? 'green' : 'red'}
                      icon={change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      style={{ margin: 0 }}
                    >
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </Tag>
                  )}
                </Space>
              </div>
            );
          },
        };
      }
    );

    return [...baseColumns, ...taskColumns];
  }, [currentComparison, taskMap]);

  const dataSource: ComparisonRow[] = useMemo(() => {
    if (!currentComparison) return [];
    
    return currentComparison.dimensions.map((dim: any) => {
      const scores: Record<string, { value: number; change?: number }> = {};
      const bottleneck: Record<string, string> = {};

      currentComparison.taskIdList.forEach((taskId: string) => {
        const value = dim.scores[taskId];
        const baseline = currentComparison.taskIdList[0];
        const baselineValue = dim.scores[baseline];
        const change = baselineValue ? ((value - baselineValue) / baselineValue) * 100 : 0;
        
        scores[taskId] = {
          value,
          change: taskId !== baseline ? change : undefined,
        };

        if (dim.bottleneckAnalysis?.[taskId]) {
          bottleneck[taskId] = dim.bottleneckAnalysis[taskId];
        }
      });

      return {
        key: dim.name,
        dimension: dim.name,
        scores,
        bottleneck: Object.keys(bottleneck).length > 0 ? bottleneck : undefined,
      };
    });
  }, [currentComparison]);

  const expandedRowRender = (record: ComparisonRow) => {
    if (!record.bottleneck) return null;

    return (
      <div style={{ padding: '16px', backgroundColor: '#1f1f1f' }}>
        <h4 style={{ marginBottom: '12px' }}>Bottleneck Analysis</h4>
        <Space orientation="vertical" style={{ width: '100%' }}>
          {Object.entries(record.bottleneck).map(([taskId, analysis]) => {
            const task = taskMap.get(taskId);
            return (
              <div key={taskId} style={{ marginBottom: '8px' }}>
                <Tag color="orange">{task?.name || taskId}</Tag>
                <span style={{ marginLeft: '8px' }}>{analysis}</span>
              </div>
            );
          })}
        </Space>
      </div>
    );
  };

  const summaryRow = () => {
    if (!currentComparison) return null;
    
    const winnerTask = taskMap.get(currentComparison.summary.winner);
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={1}>
            <strong>Summary</strong>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1} colSpan={currentComparison.taskIdList.length}>
            <Space orientation="vertical" size={0}>
              <div>
                <Tag color="green">Winner</Tag>
                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                  {winnerTask?.name || currentComparison.summary.winner}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                Cost-Performance Ratio:
                {Object.entries(currentComparison.summary.costPerformanceRatio).map(
                  ([taskId, ratio]: [string, number]) => {
                    const task = taskMap.get(taskId);
                    return (
                      <span key={taskId} style={{ marginLeft: '16px' }}>
                        {task?.name || taskId}: {ratio.toFixed(2)}x
                      </span>
                    );
                  }
                )}
              </div>
            </Space>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Performance Comparison Matrix"
        extra={
          <Space>
            <Select
              mode="multiple"
              placeholder="Select tasks to compare"
              style={{ width: 300 }}
              value={selectedTaskIds}
              onChange={setSelectedTaskIds}
              options={tasks
                .filter(task => task.status === 'SUCCESS')
                .map(task => ({
                  label: `${task.name} (${task.resources?.cardModel || 'Unknown'})`,
                  value: task.id,
                }))}
            />
            <Button 
              type="primary" 
              onClick={handleGenerateComparison}
              loading={isGenerating}
              disabled={selectedTaskIds.length < 2}
            >
              Generate Comparison
            </Button>
            <Button type="primary">Export Report</Button>
            <Button onClick={() => {
              setCurrentComparison(null);
              setSelectedTaskIds([]);
            }}>Reset Comparison</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content' }}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => !!record.bottleneck,
          }}
          summary={summaryRow}
          rowClassName={(record) => {
            if (record.bottleneck) return 'expandable-row';
            return '';
          }}
        />
      </Card>

      {currentComparison && (
        <Card title="Cost-Performance Analysis" style={{ marginTop: '16px' }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {Object.entries(currentComparison.summary.costPerformanceRatio).map(
              ([taskId, ratio]: [string, number]) => {
                const task = taskMap.get(taskId);
                return (
                  <div key={taskId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      <strong>{task?.name || taskId}</strong>
                      <span style={{ marginLeft: '8px', color: '#999' }}>
                        ({task?.resources?.cardModel || 'Unknown'})
                      </span>
                    </span>
                    <Tag color={ratio >= 1 ? 'green' : 'red'} style={{ fontSize: '14px' }}>
                      {ratio.toFixed(2)}x
                    </Tag>
                  </div>
                );
              }
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ComparisonMatrix;