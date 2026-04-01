import React, { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Select, Statistic } from 'antd';
import {
  ThunderboltOutlined,
  ApiOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useTaskStreamStore } from '../../store/taskStreamStore';

interface MetricsPanelProps {
  taskId?: string;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = () => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'computeUtilization',
    'memoryBandwidth',
    'hbmTemperature',
    'tokenSpeed',
    'powerConsumption',
  ]);

  const { metrics, clusterMetrics } = useTaskStreamStore();

  const mainChartRef = useRef<HTMLDivElement>(null);
  const mainChartInstance = useRef<echarts.ECharts | null>(null);
  const clusterChartRef = useRef<HTMLDivElement>(null);
  const clusterChartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (mainChartRef.current) {
      mainChartInstance.current = echarts.init(mainChartRef.current, 'dark');
    }

    if (clusterChartRef.current) {
      clusterChartInstance.current = echarts.init(clusterChartRef.current, 'dark');
    }

    return () => {
      if (mainChartInstance.current) {
        mainChartInstance.current.dispose();
      }
      if (clusterChartInstance.current) {
        clusterChartInstance.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (mainChartInstance.current && metrics.length > 0) {
      const series = selectedMetrics.map((metric: string) => {
        const config = getMetricConfig(metric);
        return {
          name: config.label,
          type: 'line',
          smooth: true,
          data: metrics.map((m: any) => m[metric] as number),
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
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100,
          },
          {
            start: 0,
            end: 100,
          },
        ],
      };

      mainChartInstance.current.setOption(option, true);
    }
  }, [metrics, selectedMetrics]);

  useEffect(() => {
    if (clusterChartInstance.current && clusterMetrics.length > 0) {
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

      clusterChartInstance.current.setOption(option);
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

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
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
              title="Data Points"
              value={metrics.length}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#999' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Real-time Metrics"
        extra={
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
        }
      >
        <div ref={mainChartRef} style={{ width: '100%', height: '400px' }} />
      </Card>

      <Card title="Cluster Load Heatmap" style={{ marginTop: 16 }}>
        <div ref={clusterChartRef} style={{ width: '100%', height: '300px' }} />
      </Card>
    </div>
  );
};
