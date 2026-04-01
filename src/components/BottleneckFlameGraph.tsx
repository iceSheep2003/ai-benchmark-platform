import React, { useMemo, useState, useEffect } from 'react';
import { Card, Tooltip, Space, Tag, Select } from 'antd';
import type { FlameGraphNode, OptimizationRecommendation } from '../types';
import { useAppStore } from '../store/appStore';

interface BottleneckFlameGraphProps {
  data?: FlameGraphNode;
  taskId?: string;
  width?: number;
  height?: number;
  onNodeClick?: (node: FlameGraphNode) => void;
}

interface FlameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  node: FlameGraphNode;
  depth: number;
}

const BottleneckFlameGraph: React.FC<BottleneckFlameGraphProps> = ({
  data: propData,
  taskId,
  width = 800,
  height = 400,
  onNodeClick,
}) => {
  const { tasks, getFlameGraphForTask, getOptimizationRecommendations } = useAppStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(taskId);
  const [data, setData] = useState<FlameGraphNode | undefined>(propData);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  
  useEffect(() => {
    if (selectedTaskId) {
      const taskData = getFlameGraphForTask(selectedTaskId);
      if (taskData) {
        setData(taskData);
        const recs = getOptimizationRecommendations(selectedTaskId);
        setRecommendations(recs);
      }
    }
  }, [selectedTaskId, getFlameGraphForTask, getOptimizationRecommendations]);
  
  useEffect(() => {
    if (propData) {
      setData(propData);
    }
  }, [propData]);
  
  const { rects, maxDepth } = useMemo(() => {
    if (!data) return { rects: [], maxDepth: 0 };
    
    const rects: FlameRect[] = [];
    let maxDepth = 0;

    const traverse = (
      node: FlameGraphNode,
      depth: number,
      x: number,
      totalValue: number
    ) => {
      maxDepth = Math.max(maxDepth, depth);
      const nodeWidth = (node.value / totalValue) * (width - 40);
      const nodeHeight = 30;
      const y = height - (depth + 1) * (nodeHeight + 2);

      rects.push({
        x: x + 20,
        y,
        width: Math.max(nodeWidth, 1),
        height: nodeHeight,
        node,
        depth,
      });

      if (node.children && node.children.length > 0) {
        let childX = x;
        node.children.forEach((child) => {
          traverse(child, depth + 1, childX, totalValue);
          childX += (child.value / totalValue) * (width - 40);
        });
      }
    };

    traverse(data, 0, 0, data.value);
    return { rects, maxDepth };
  }, [data, width, height]);

  const getColorByDepth = (depth: number): string => {
    const colors = [
      '#ff6b6b',
      '#feca57',
      '#48dbfb',
      '#1dd1a1',
      '#5f9ea0',
      '#ff9ff3',
      '#54a0ff',
    ];
    return colors[depth % colors.length];
  };

  const handleRectClick = (rect: FlameRect) => {
    if (onNodeClick) {
      onNodeClick(rect.node);
    }
  };

  const getBottleneckNodes = (): FlameGraphNode[] => {
    if (!data) return [];
    
    const bottlenecks: FlameGraphNode[] = [];
    
    const traverse = (node: FlameGraphNode) => {
      if (node.children && node.children.length > 0) {
        const childrenSum = node.children.reduce((sum, child) => sum + child.value, 0);
        if (childrenSum / node.value < 0.8) {
          bottlenecks.push(node);
        }
        node.children.forEach(traverse);
      }
    };
    
    traverse(data);
    return bottlenecks.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const bottlenecks = getBottleneckNodes();

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Performance Flame Graph"
        extra={
          <Space>
            <Select
              placeholder="Select task"
              style={{ width: 300 }}
              value={selectedTaskId}
              onChange={(value) => setSelectedTaskId(value)}
              options={tasks
                .filter(task => task.status === 'SUCCESS')
                .map(task => ({
                  label: `${task.name} (${task.resources?.cardModel || 'Unknown'})`,
                  value: task.id,
                }))}
            />
            <Tag color="orange">Top Bottlenecks</Tag>
            {bottlenecks.map((node, index) => (
              <Tooltip key={index} title={`${node.name}: ${node.value}ms`}>
                <Tag color="red">{node.name}</Tag>
              </Tooltip>
            ))}
          </Space>
        }
      >
        {!data ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Please select a task to view flame graph
          </div>
        ) : (
          <>
            <svg width={width} height={height} style={{ backgroundColor: '#1f1f1f' }}>
              {rects.map((rect, index) => (
                <g key={index}>
                  <Tooltip
                    title={
                      <div>
                        <div>
                          <strong>{rect.node.name}</strong>
                        </div>
                        <div>Duration: {rect.node.value}ms</div>
                        {data && <div>Percentage: {((rect.node.value / data.value) * 100).toFixed(1)}%</div>}
                        {rect.node.children && (
                          <div>Children: {rect.node.children.length}</div>
                        )}
                      </div>
                    }
                  >
                    <rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      fill={rect.node.color || getColorByDepth(rect.depth)}
                      stroke="#000"
                      strokeWidth={0.5}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRectClick(rect)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    />
                  </Tooltip>
                  
                  {rect.width > 40 && (
                    <text
                      x={rect.x + rect.width / 2}
                      y={rect.y + rect.height / 2 + 4}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="11"
                      style={{ pointerEvents: 'none' }}
                    >
                      {rect.node.name}
                    </text>
                  )}
                </g>
              ))}
              
              <line
                x1={20}
                y1={height - 10}
                x2={width - 20}
                y2={height - 10}
                stroke="#666"
                strokeWidth={1}
              />
              <text
                x={width / 2}
                y={height - 5}
                textAnchor="middle"
                fill="#999"
                fontSize="12"
              >
                Time (ms)
              </text>
            </svg>

            <div style={{ marginTop: '16px' }}>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <h4>Performance Analysis</h4>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  Total Duration: <strong>{data?.value || 0}ms</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  Max Depth: <strong>{maxDepth + 1}</strong> levels
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  Total Nodes: <strong>{rects.length}</strong>
                </div>
              </Space>
            </div>
          </>
        )}
      </Card>

      {recommendations.length > 0 && (
        <Card title="AI-Powered Optimization Recommendations" style={{ marginTop: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {recommendations.map((rec, index) => (
              <div key={index} style={{ padding: '16px', backgroundColor: '#1f1f1f', borderRadius: '4px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px' }}>{rec.operation}</strong>
                    <Space>
                      <Tag color="red">{rec.currentPerformance}ms</Tag>
                      <Tag color="green">+{rec.potentialImprovement.toFixed(1)}ms</Tag>
                      <Tag color={rec.implementationComplexity === 'low' ? 'green' : rec.implementationComplexity === 'medium' ? 'orange' : 'red'}>
                        {rec.implementationComplexity}
                      </Tag>
                    </Space>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#999' }}>
                    <strong>Recommendations:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {rec.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {rec.relatedAssets.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '14px' }}>Related Assets:</strong>
                      <div style={{ marginTop: '8px' }}>
                        {rec.relatedAssets.map((asset, i) => (
                          <Tag key={i} color="blue" style={{ margin: '4px' }}>
                            {asset.type}: {asset.name} - {asset.reason}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {rec.estimatedCostSaving && (
                    <div style={{ fontSize: '14px', color: '#52c41a' }}>
                      <strong>Estimated Cost Saving: ${rec.estimatedCostSaving.toFixed(2)}/hour</strong>
                    </div>
                  )}
                </Space>
              </div>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default BottleneckFlameGraph;