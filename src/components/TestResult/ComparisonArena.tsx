import React, { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Table, Tag, Space, Button, Statistic, Empty, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  CloseOutlined, 
  SwapOutlined, 
  TrophyOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { TestModel } from '../../mockData/testResultMock';

interface ComparisonArenaProps {
  models: TestModel[];
  onClose: () => void;
}

const modelColors = ['#1890ff', '#52c41a', '#faad14', '#eb2f96'];

export const ComparisonArena: React.FC<ComparisonArenaProps> = ({ models, onClose }) => {
  const radarChartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!radarChartRef.current || models.length < 2) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }
    
    const chart = echarts.init(radarChartRef.current);
    chartInstance.current = chart;
    
    const dimensions = ['综合得分', '语言理解', '逻辑推理', '文本生成', '知识问答', '代码能力', '多语言能力'];
    const dimensionKeys = ['overall', 'languageUnderstanding', 'logicReasoning', 'textGeneration', 'knowledgeQA', 'codeAbility', 'multilingualAbility'];
    
    const series = models.map((model, index) => ({
      name: model.name,
      type: 'radar',
      data: [{
        value: dimensionKeys.map(key => model.scores[key as keyof typeof model.scores]),
        name: model.name,
        itemStyle: {
          color: modelColors[index % modelColors.length],
        },
        areaStyle: {
          color: modelColors[index % modelColors.length],
          opacity: 0.2,
        },
        lineStyle: {
          color: modelColors[index % modelColors.length],
          width: 2,
        },
      }],
    }));

    chart.setOption({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        data: models.map(m => m.name),
        bottom: 0,
        textStyle: {
          color: '#fff',
        },
      },
      radar: {
        indicator: dimensions.map(d => ({ name: d, max: 100 })),
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: '#999',
        },
        splitLine: {
          lineStyle: {
            color: '#303030',
          },
        },
        splitArea: {
          areaStyle: {
            color: ['#1f1f1f', '#141414'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#303030',
          },
        },
      },
      series,
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [models]);

  const getDimensionWinner = (dimension: string): { winner: string; advantage: string } | null => {
    if (models.length < 2) return null;
    
    const key = dimension as keyof typeof models[0]['scores'];
    const scores = models.map(m => ({ name: m.name, score: m.scores[key] || 0 }));
    scores.sort((a, b) => b.score - a.score);
    
    if (scores[0].score === scores[1].score) return null;
    
    const advantage = ((scores[0].score - scores[1].score) / scores[1].score * 100).toFixed(1);
    
    return {
      winner: scores[0].name,
      advantage: `${advantage}%`,
    };
  };

  const getCellStyle = (value: number, dimension: string) => {
    if (models.length < 2) return {};
    
    const key = dimension as keyof typeof models[0]['scores'];
    const allValues = models.map(m => m.scores[key] || 0);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    if (value === max) {
      return { backgroundColor: 'rgba(82, 196, 26, 0.2)', color: '#52c41a' };
    }
    if (value === min) {
      return { backgroundColor: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f' };
    }
    return {};
  };

  const dimensionColumns: ColumnsType<{ dimension: string; [key: string]: string | number }> = [
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      width: 120,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    ...models.map((model, index) => ({
      title: (
        <Space>
          <span style={{ color: modelColors[index % modelColors.length] }}>●</span>
          <span>{model.name}</span>
        </Space>
      ),
      dataIndex: model.id,
      key: model.id,
      width: 120,
      render: (value: number, record: { dimension: string }) => {
        const winner = getDimensionWinner(record.dimension);
        const isWinner = winner?.winner === model.name;
        const cellStyle = getCellStyle(value, record.dimension);
        
        return (
          <Space direction="vertical" size={0}>
            <span style={cellStyle}>
              {value.toFixed(1)}
              {isWinner && (
                <TrophyOutlined style={{ marginLeft: 4, color: '#ffd700' }} />
              )}
            </span>
            {isWinner && winner && (
              <Tag color="green" style={{ fontSize: 10 }}>
                +{winner.advantage}
              </Tag>
            )}
          </Space>
        );
      },
    })),
  ];

  const dimensionData = [
    { dimension: '综合得分', ...Object.fromEntries(models.map(m => [m.id, m.scores.overall])) },
    { dimension: '语言理解', ...Object.fromEntries(models.map(m => [m.id, m.scores.languageUnderstanding])) },
    { dimension: '逻辑推理', ...Object.fromEntries(models.map(m => [m.id, m.scores.logicReasoning])) },
    { dimension: '文本生成', ...Object.fromEntries(models.map(m => [m.id, m.scores.textGeneration])) },
    { dimension: '知识问答', ...Object.fromEntries(models.map(m => [m.id, m.scores.knowledgeQA])) },
    { dimension: '代码能力', ...Object.fromEntries(models.map(m => [m.id, m.scores.codeAbility])) },
    { dimension: '多语言能力', ...Object.fromEntries(models.map(m => [m.id, m.scores.multilingualAbility])) },
  ];

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      message.info('模型顺序已调整');
    }
    setDraggedIndex(null);
  };

  if (models.length < 2) {
    return (
      <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
        <Empty
          description="请选择至少 2 个模型进行对比"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div>
      <Card 
        style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        title={
          <Space>
            <SwapOutlined style={{ color: '#1890ff' }} />
            <span>沉浸式对比工作台</span>
            <Tag color="blue">{models.length} 个模型</Tag>
          </Space>
        }
        extra={
          <Button icon={<CloseOutlined />} onClick={onClose}>
            关闭对比
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {models.map((model, index) => (
            <Col xs={24} sm={12} md={6} key={model.id}>
              <Card 
                size="small"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                style={{ 
                  background: '#141414', 
                  border: `2px solid ${modelColors[index % modelColors.length]}`,
                  cursor: 'move',
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <span style={{ color: modelColors[index % modelColors.length], fontSize: 20 }}>●</span>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>{model.name}</span>
                  </Space>
                  <Tag>{model.organization}</Tag>
                  <Tag color="blue">{model.params}</Tag>
                  <Statistic 
                    title="综合得分" 
                    value={model.scores.overall} 
                    suffix="/ 100"
                    styles={{ content: { color: modelColors[index % modelColors.length] } }}
                  />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card 
        style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        title="能力雷达图对比"
      >
        <div ref={radarChartRef} style={{ width: '100%', height: 400 }} />
      </Card>

      <Card 
        style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#ffd700' }} />
            <span>详细指标对比</span>
            <Tag color="green">绿色 = 最佳值</Tag>
            <Tag color="red">红色 = 最差值</Tag>
          </Space>
        }
      >
        <Table
          dataSource={dimensionData}
          columns={dimensionColumns}
          pagination={false}
          scroll={{ x: 800 }}
          size="small"
          rowKey="dimension"
        />
      </Card>
    </div>
  );
};

export default ComparisonArena;
