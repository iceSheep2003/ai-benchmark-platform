import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Tag,
  Statistic,
  Select,
  message,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  FireOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import type { BenchmarkTask } from '../../types';

interface TaskMonitorPanelProps {
  task: BenchmarkTask;
}

interface TaskMonitorMetrics {
  timestamp: number;
  computeUtilization: number;
  memoryBandwidth: number;
  hbmTemperature: number;
  tokenSpeed: number;
  powerConsumption: number;
}

interface LogEntry {
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
}

interface ClusterNodeMetrics {
  nodeId: string;
  gpuUtil: number;
  memoryUtil: number;
  temperature: number;
  power: number;
}

export const TaskMonitorPanel: React.FC<TaskMonitorPanelProps> = ({ task }) => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'computeUtilization',
    'memoryBandwidth',
    'hbmTemperature',
    'tokenSpeed',
    'powerConsumption',
  ]);
  const [metrics, setMetrics] = useState<TaskMonitorMetrics[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [clusterMetrics, setClusterMetrics] = useState<ClusterNodeMetrics[]>([]);
  const [anomalyMarkers, setAnomalyMarkers] = useState<number[]>([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const heatmapChartRef = useRef<HTMLDivElement>(null);
  const heatmapChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    if (heatmapChartRef.current) {
      heatmapChartInstance.current = echarts.init(heatmapChartRef.current, 'dark');
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      if (heatmapChartInstance.current) {
        heatmapChartInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (task && isMonitoring) {
      const initialMetrics = generateMockMetrics(100);
      setMetrics(initialMetrics);

      const initialLogs = generateMockLogs(20);
      setLogs(initialLogs);

      const initialClusterMetrics = generateClusterMetrics();
      setClusterMetrics(initialClusterMetrics);

      const interval = setInterval(() => {
        setMetrics((prev) => {
          const newPoint: TaskMonitorMetrics = {
            timestamp: Date.now(),
            computeUtilization: 60 + Math.random() * 35,
            memoryBandwidth: 400 + Math.random() * 600,
            hbmTemperature: 65 + Math.random() * 20,
            tokenSpeed: 2000 + Math.random() * 1000,
            powerConsumption: 300 + Math.random() * 200,
          };
          const updated = [...prev.slice(-99), newPoint];
          return updated;
        });

        setLogs((prev) => {
          const newLog: LogEntry = generateRandomLog();
          return [...prev.slice(-99), newLog];
        });

        setClusterMetrics((prev) =>
          prev.map((node) => ({
            ...node,
            gpuUtil: Math.max(0, Math.min(100, node.gpuUtil + (Math.random() - 0.5) * 10)),
            memoryUtil: Math.max(0, Math.min(100, node.memoryUtil + (Math.random() - 0.5) * 5)),
            temperature: Math.max(50, Math.min(90, node.temperature + (Math.random() - 0.5) * 2)),
            power: Math.max(200, Math.min(500, node.power + (Math.random() - 0.5) * 20)),
          }))
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [task, isMonitoring]);

  useEffect(() => {
    if (chartInstance.current && metrics.length > 0) {
      const series = selectedMetrics.map((metric) => {
        const config = getMetricConfig(metric);
        return {
          name: config.label,
          type: 'line',
          smooth: true,
          data: metrics.map((m) => m[metric as keyof TaskMonitorMetrics] as number),
          yAxisIndex: config.yAxisIndex,
          lineStyle: {
            color: config.color,
            width: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${config.color}66` },
              { offset: 1, color: `${config.color}11` },
            ]),
          },
          markPoint: {
            data: anomalyMarkers.map((timestamp) => ({
              coord: [new Date(timestamp).toLocaleTimeString(), null],
              value: '⚠️',
              symbolSize: 20,
              itemStyle: { color: '#ff4d4f' },
            })),
          },
        };
      });

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
          formatter: (params: any) => {
            const timestamp = params[0].axisValue;
            let html = `<div style="margin-bottom: 4px; font-weight: bold;">${timestamp}</div>`;
            params.forEach((param: any) => {
              html += `<div style="display: flex; justify-content: space-between; min-width: 200px;">
                <span style="color: ${param.color};">${param.seriesName}:</span>
                <span style="font-weight: bold;">${param.value.toFixed(2)}</span>
              </div>`;
            });
            return html;
          },
        },
        legend: {
          data: selectedMetrics.map((m) => getMetricConfig(m).label),
          textStyle: { color: '#999' },
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
          data: metrics.map((m) => new Date(m.timestamp).toLocaleTimeString()),
          axisLine: { lineStyle: { color: '#666' } },
          axisLabel: { color: '#999' },
        },
        yAxis: [
          {
            type: 'value',
            name: 'Percentage (%)',
            min: 0,
            max: 100,
            axisLine: { lineStyle: { color: '#666' } },
            axisLabel: { color: '#999' },
            splitLine: { lineStyle: { color: '#333' } },
          },
          {
            type: 'value',
            name: 'Speed / Bandwidth',
            axisLine: { lineStyle: { color: '#666' } },
            axisLabel: { color: '#999' },
            splitLine: { show: false },
          },
        ],
        series,
      };

      chartInstance.current.setOption(option, true);
    }
  }, [metrics, selectedMetrics, anomalyMarkers]);

  useEffect(() => {
    if (heatmapChartInstance.current && clusterMetrics.length > 0) {
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          formatter: (params: any) => {
            const data = params.data;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${data[1]}</div>
                <div>GPU Util: ${data[2].toFixed(1)}%</div>
                <div>Memory: ${data[3].toFixed(1)}%</div>
                <div>Temp: ${data[4].toFixed(1)}°C</div>
                <div>Power: ${data[5].toFixed(0)}W</div>
              </div>
            `;
          },
        },
        grid: {
          height: '70%',
          top: '10%',
        },
        xAxis: {
          type: 'category',
          data: clusterMetrics.map((_, i) => `GPU ${i + 1}`),
          splitArea: { show: true },
          axisLabel: { color: '#999' },
          axisLine: { lineStyle: { color: '#666' } },
        },
        yAxis: {
          type: 'category',
          data: ['GPU Util', 'Memory', 'Temp', 'Power'],
          splitArea: { show: true },
          axisLabel: { color: '#999' },
          axisLine: { lineStyle: { color: '#666' } },
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          inRange: {
            color: ['#50a3ba', '#eac736', '#d94e5d'],
          },
          textStyle: { color: '#999' },
        },
        series: [
          {
            name: 'Cluster Metrics',
            type: 'heatmap',
            data: clusterMetrics.map((node, i) => [
              i,
              'GPU Util',
              node.gpuUtil,
              node.memoryUtil,
              node.temperature,
              node.power,
            ]),
            label: {
              show: true,
              formatter: (params: any) => params.data[2].toFixed(1),
              color: '#fff',
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      };

      heatmapChartInstance.current.setOption(option);
    }
  }, [clusterMetrics]);

  const getMetricConfig = (metric: string) => {
    const configs: Record<string, any> = {
      computeUtilization: { label: 'Compute Util (%)', color: '#1890ff', yAxisIndex: 0 },
      memoryBandwidth: { label: 'Memory Bandwidth (GB/s)', color: '#52c41a', yAxisIndex: 1 },
      hbmTemperature: { label: 'HBM Temp (°C)', color: '#faad14', yAxisIndex: 0 },
      tokenSpeed: { label: 'Token Speed (tokens/s)', color: '#722ed1', yAxisIndex: 1 },
      powerConsumption: { label: 'Power (W)', color: '#f5222d', yAxisIndex: 1 },
    };
    return configs[metric] || { label: metric, color: '#1890ff', yAxisIndex: 0 };
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    message.success(isMonitoring ? 'Monitoring paused' : 'Monitoring resumed');
  };

  const handleChartClick = (params: any) => {
    const timestamp = metrics.find((m) => new Date(m.timestamp).toLocaleTimeString() === params.name)?.timestamp;
    if (timestamp) {
      setSelectedTimestamp(timestamp);
      message.info(`Selected timestamp: ${params.name}`);
    }
  };

  const addAnomalyMarker = () => {
    if (selectedTimestamp) {
      setAnomalyMarkers([...anomalyMarkers, selectedTimestamp]);
      message.success('Anomaly marker added');
    }
  };

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <span>{task.name}</span>
                <Tag color={task.status === 'RUNNING' ? 'processing' : 'default'}>
                  {task.status}
                </Tag>
                <Tag color="blue">{task.resources?.cardModel || '-'}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Select
                  mode="multiple"
                  placeholder="Select metrics"
                  value={selectedMetrics}
                  onChange={setSelectedMetrics}
                  style={{ width: 300 }}
                  options={[
                    { value: 'computeUtilization', label: 'Compute Utilization' },
                    { value: 'memoryBandwidth', label: 'Memory Bandwidth' },
                    { value: 'hbmTemperature', label: 'HBM Temperature' },
                    { value: 'tokenSpeed', label: 'Token Speed' },
                    { value: 'powerConsumption', label: 'Power Consumption' },
                  ]}
                />
                {selectedTimestamp && (
                  <Button size="small" onClick={addAnomalyMarker}>
                    <WarningOutlined /> Mark Anomaly
                  </Button>
                )}
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
            <div
              ref={chartRef}
              style={{ width: '100%', height: '400px' }}
              onClick={() => {
                if (chartInstance.current) {
                  chartInstance.current.off('click');
                  chartInstance.current.on('click', handleChartClick);
                }
              }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Compute Util"
                  value={latestMetric?.computeUtilization || 0}
                  suffix="%"
                  prefix={<ThunderboltOutlined />}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Memory BW"
                  value={latestMetric?.memoryBandwidth || 0}
                  suffix="GB/s"
                  prefix={<ApiOutlined />}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="HBM Temp"
                  value={latestMetric?.hbmTemperature || 0}
                  suffix="°C"
                  prefix={<FireOutlined />}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Token Speed"
                  value={latestMetric?.tokenSpeed || 0}
                  suffix="tokens/s"
                  prefix={<ClockCircleOutlined />}
                  styles={{ content: { color: '#722ed1' } }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Power"
                  value={latestMetric?.powerConsumption || 0}
                  suffix="W"
                  prefix={<ApiOutlined />}
                  styles={{ content: { color: '#f5222d' } }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Uptime"
                  value={Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 1000)}
                  suffix="s"
                  prefix={<ClockCircleOutlined />}
                  styles={{ content: { color: '#999' } }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col span={12}>
          <Card title="Resource Heatmap" extra={<Tag color="blue">Cluster Load</Tag>}>
            <div ref={heatmapChartRef} style={{ width: '100%', height: '300px' }} />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="Real-time Logs"
            extra={
              <Space>
                <Tag color={logs.filter((l) => l.level === 'ERROR').length > 0 ? 'error' : 'success'}>
                  {logs.filter((l) => l.level === 'ERROR').length} Errors
                </Tag>
                <Button size="small" onClick={() => setLogs([])}>
                  Clear
                </Button>
              </Space>
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
                    color: getLogColor(log.level),
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ color: '#666' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>[{log.level}]</span>
                  <span style={{ marginLeft: '8px' }}>{log.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

function generateMockMetrics(count: number): TaskMonitorMetrics[] {
  const metrics: TaskMonitorMetrics[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    metrics.push({
      timestamp: now - (count - i) * 1000,
      computeUtilization: 60 + Math.random() * 35,
      memoryBandwidth: 400 + Math.random() * 600,
      hbmTemperature: 65 + Math.random() * 20,
      tokenSpeed: 2000 + Math.random() * 1000,
      powerConsumption: 300 + Math.random() * 200,
    });
  }
  return metrics;
}

function generateMockLogs(count: number): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();
  const messages = [
    'Processing batch 1234',
    'Loading model weights',
    'Initializing CUDA context',
    'Starting inference',
    'Batch completed successfully',
    'Memory allocation: 45.2 GB',
    'GPU utilization: 78.5%',
    'Token generation speed: 2345 tokens/s',
    'Checkpoint saved',
    'Validation passed',
  ];
  const errorMessages = [
    'CUDA out of memory',
    'Kernel launch failed',
    'NCCL communication error',
    'Timeout waiting for GPU',
  ];

  for (let i = 0; i < count; i++) {
    const isError = Math.random() > 0.95;
    logs.push({
      timestamp: now - (count - i) * 5000,
      level: isError ? 'ERROR' : Math.random() > 0.8 ? 'WARNING' : 'INFO',
      message: isError
        ? errorMessages[Math.floor(Math.random() * errorMessages.length)]
        : messages[Math.floor(Math.random() * messages.length)],
    });
  }
  return logs;
}

function generateRandomLog(): LogEntry {
  const messages = [
    'Processing batch ' + Math.floor(Math.random() * 10000),
    'Memory usage: ' + (40 + Math.random() * 20).toFixed(1) + ' GB',
    'GPU utilization: ' + (60 + Math.random() * 35).toFixed(1) + '%',
    'Token speed: ' + (2000 + Math.random() * 1000).toFixed(0) + ' tokens/s',
    'Temperature: ' + (65 + Math.random() * 20).toFixed(1) + '°C',
    'Power consumption: ' + (300 + Math.random() * 200).toFixed(0) + 'W',
  ];
  const errorMessages = [
    'CUDA error: out of memory',
    'Kernel launch timeout',
    'NCCL communication failed',
  ];

  const isError = Math.random() > 0.98;
  return {
    timestamp: Date.now(),
    level: isError ? 'ERROR' : Math.random() > 0.85 ? 'WARNING' : 'INFO',
    message: isError
      ? errorMessages[Math.floor(Math.random() * errorMessages.length)]
      : messages[Math.floor(Math.random() * messages.length)],
  };
}

function generateClusterMetrics(): ClusterNodeMetrics[] {
  const nodes: ClusterNodeMetrics[] = [];
  for (let i = 0; i < 8; i++) {
    nodes.push({
      nodeId: `gpu-${i}`,
      gpuUtil: 60 + Math.random() * 35,
      memoryUtil: 40 + Math.random() * 40,
      temperature: 65 + Math.random() * 20,
      power: 300 + Math.random() * 200,
    });
  }
  return nodes;
}

function getLogColor(level: string): string {
  const colors: Record<string, string> = {
    INFO: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#ff4d4f',
    DEBUG: '#999',
  };
  return colors[level] || '#999';
}
