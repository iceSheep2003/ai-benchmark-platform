import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Card, Row, Col, Tag, Button, Space, Select, Empty } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { BenchmarkTask, RealTimeMetrics } from '../types';
import { generateMockMetrics } from '../mockData';

interface RealTimeMonitorProps {
  task?: BenchmarkTask;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ task }) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('throughput');
  const [metrics, setMetrics] = useState<RealTimeMetrics[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (task && isMonitoring) {
      const mockData = generateMockMetrics(100);
      setMetrics(mockData);

      const interval = setInterval(() => {
        setMetrics((prev) => {
          const newPoint: RealTimeMetrics = {
            timestamp: Date.now(),
            throughput: 2000 + Math.random() * 1000,
            latency_p99: 8 + Math.random() * 8,
            gpu_util: 60 + Math.random() * 35,
            memory_bandwidth: 400 + Math.random() * 600,
          };
          const updated = [...prev.slice(-99), newPoint];
          return updated;
        });

        const newLog = `[${new Date().toISOString()}] Processing batch ${Math.floor(Math.random() * 1000)} - ${Math.random() > 0.9 ? 'Warning: High memory usage' : 'OK'}`;
        setLogs((prev) => [...prev.slice(-49), newLog]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [task, isMonitoring]);

  useEffect(() => {
    if (chartInstance.current && metrics.length > 0) {
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: metrics.map((m) =>
            new Date(m.timestamp).toLocaleTimeString()
          ),
          axisLine: {
            lineStyle: {
              color: '#666',
            },
          },
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#666',
            },
          },
          splitLine: {
            lineStyle: {
              color: '#333',
            },
          },
        },
        series: [
          {
            name: getMetricLabel(selectedMetric),
            type: 'line',
            smooth: true,
            data: metrics.map((m) => m[selectedMetric as keyof RealTimeMetrics] as number),
            lineStyle: {
              color: '#1890ff',
              width: 2,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ]),
            },
          },
        ],
      };

      chartInstance.current.setOption(option);
    }
  }, [metrics, selectedMetric]);

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      throughput: 'Throughput (tokens/s)',
      latency_p99: 'Latency P99 (ms)',
      gpu_util: 'GPU Utilization (%)',
      memory_bandwidth: 'Memory Bandwidth (GB/s)',
    };
    return labels[metric] || metric;
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!task) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="Please select a task to monitor" />
      </div>
    );
  }

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <span>{task.name}</span>
                <Tag color={task.status === 'RUNNING' ? 'processing' : 'default'}>
                  {task.status}
                </Tag>
              </Space>
            }
            extra={
              <Space>
                <Select
                  value={selectedMetric}
                  onChange={setSelectedMetric}
                  style={{ width: 200 }}
                  options={[
                    { value: 'throughput', label: 'Throughput' },
                    { value: 'latency_p99', label: 'Latency P99' },
                    { value: 'gpu_util', label: 'GPU Utilization' },
                    { value: 'memory_bandwidth', label: 'Memory Bandwidth' },
                  ]}
                />
                <Button
                  icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={toggleMonitoring}
                >
                  {isMonitoring ? 'Pause' : 'Resume'}
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => setMetrics([])}>
                  Reset
                </Button>
              </Space>
            }
          >
            <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
          </Card>
        </Col>

        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                  Throughput
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {latestMetric?.throughput.toFixed(2)} tokens/s
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                  Latency P99
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {latestMetric?.latency_p99.toFixed(2)} ms
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                  GPU Utilization
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {latestMetric?.gpu_util.toFixed(1)}%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                  Memory Bandwidth
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {latestMetric?.memory_bandwidth.toFixed(2)} GB/s
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={24}>
          <Card
            title="Real-time Logs"
            extra={
              <Button size="small" onClick={clearLogs}>
                Clear
              </Button>
            }
          >
            <div
              style={{
                height: '300px',
                overflowY: 'auto',
                backgroundColor: '#000',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
              }}
            >
              {logs.map((log, index) => (
                <div
                  key={index}
                  style={{
                    color: log.includes('Warning') ? '#faad14' : '#52c41a',
                  }}
                >
                  {log}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeMonitor;