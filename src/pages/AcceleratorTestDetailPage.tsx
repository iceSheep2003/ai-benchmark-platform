import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout, Card, Button, Space, Descriptions, Row, Col, Statistic, Progress, Timeline, Spin, message, Modal } from 'antd';
import { ArrowLeftOutlined, StopOutlined, ReloadOutlined, DownloadOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import type { AcceleratorTest } from '../mockData/acceleratorMock';
import { acceleratorTests, testStatusMap, testTypeOptions, acceleratorTestMetrics } from '../mockData/acceleratorMock';

const { Content } = Layout;

const AcceleratorTestDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('id') || '';
  const [test, setTest] = useState<AcceleratorTest | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const found = testId
        ? acceleratorTests.find(t => t.id === testId)
        : acceleratorTests[0];
      setTest(found || null);
      setLoading(false);
    }, 500);
  }, [testId]);

  const isRunning = test?.status === 'running';
  const isSuccess = test?.status === 'success';
  const isFailed = test?.status === 'failed';

  useEffect(() => {
    if (!chartRef.current || !isRunning) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const option = {
      title: {
        text: '实时性能监控',
        textStyle: { color: '#fff', fontSize: 14 },
        left: 'center',
      },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['GPU利用率', '内存利用率', '功耗'],
        textStyle: { color: '#fff' },
        top: 30,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 80, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: acceleratorTestMetrics.map((m, i) => `${i}m`),
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#303030' } },
        axisLabel: { color: '#fff' },
        splitLine: { lineStyle: { color: '#303030' } },
      },
      series: [
        {
          name: 'GPU利用率',
          type: 'line',
          data: acceleratorTestMetrics.map(m => m.gpu_utilization),
          smooth: true,
          lineStyle: { color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
        },
        {
          name: '内存利用率',
          type: 'line',
          data: acceleratorTestMetrics.map(m => m.memory_utilization),
          smooth: true,
          lineStyle: { color: '#52c41a' },
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '功耗',
          type: 'line',
          data: acceleratorTestMetrics.map(m => m.power_consumption),
          smooth: true,
          lineStyle: { color: '#faad14' },
          itemStyle: { color: '#faad14' },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [isRunning]);

  const handleCancelTest = () => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消这个测试任务吗？',
      onOk: () => {
        message.success('测试任务已取消');
      },
    });
  };

  if (loading) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24, textAlign: 'center', paddingTop: 100 }}>
          <Spin size="large" tip="加载测试任务详情..." />
        </Content>
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout style={{ background: '#141414', minHeight: '100vh' }}>
        <Content style={{ padding: 24 }}>
          <Card style={{ background: '#1f1f1f', border: '1px solid #303030' }}>
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>测试任务不存在</div>
          </Card>
        </Content>
      </Layout>
    );
  }

  const statusText = testStatusMap[test.status]?.text || test.status;
  const statusColor = testStatusMap[test.status]?.color || 'default';
  const typeLabel = testTypeOptions.find(t => t.value === test.type)?.label || test.type;

  return (
    <Layout style={{ background: '#141414', minHeight: '100vh' }}>
      <Content style={{ padding: 24 }}>
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/accelerator/tasks')}
              >
                返回
              </Button>
              <span>{test.name}</span>
            </Space>
          }
          extra={
            <Space>
              <Button icon={<ReloadOutlined />}>刷新</Button>
              <Button icon={<DownloadOutlined />}>下载日志</Button>
              {isRunning && (
                <Button danger icon={<StopOutlined />} onClick={handleCancelTest}>
                  取消任务
                </Button>
              )}
            </Space>
          }
          style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>任务状态</span>}
                value={statusText}
                prefix={
                  isRunning ? <SyncOutlined spin style={{ color: '#1890ff' }} /> :
                  isSuccess ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                  <StopOutlined style={{ color: '#ff4d4f' }} />
                }
                styles={{ content: { color: isRunning ? '#1890ff' : isSuccess ? '#52c41a' : '#ff4d4f' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>测试类型</span>}
                value={typeLabel}
                styles={{ content: { color: '#1890ff' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>优先级</span>}
                value={test.priority}
                styles={{ content: { color: test.priority === 'P0' ? '#ff4d4f' : test.priority === 'P1' ? '#faad14' : '#1890ff' } }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title={<span style={{ color: '#999' }}>持续时间</span>}
                value={test.duration_seconds ? `${Math.floor(test.duration_seconds / 60)} 分钟` : '-'}
                prefix={<ClockCircleOutlined />}
                styles={{ content: { color: '#faad14' } }}
              />
            </Col>
          </Row>

          {isRunning && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={65} status="active" strokeColor={{ from: '#1890ff', to: '#52c41a' }} />
            </div>
          )}
        </Card>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title="任务信息"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="任务ID">{test.id}</Descriptions.Item>
                <Descriptions.Item label="任务名称">{test.name}</Descriptions.Item>
                <Descriptions.Item label="测试类型">{typeLabel}</Descriptions.Item>
                <Descriptions.Item label="优先级">{test.priority}</Descriptions.Item>
                <Descriptions.Item label="加速卡">{test.accelerator?.name || test.accelerator_id}</Descriptions.Item>
                <Descriptions.Item label="节点">{test.resource_usage?.node_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="开始时间">{test.started_at ? new Date(test.started_at).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
                <Descriptions.Item label="完成时间">{test.completed_at ? new Date(test.completed_at).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="测试配置"
              style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="测试时长">{test.config.test_duration_minutes ? `${test.config.test_duration_minutes} 分钟` : '-'}</Descriptions.Item>
                <Descriptions.Item label="工作负载">{test.config.workload || '-'}</Descriptions.Item>
                <Descriptions.Item label="批次大小">{test.config.batch_size || '-'}</Descriptions.Item>
                <Descriptions.Item label="精度">{test.config.precision || '-'}</Descriptions.Item>
                <Descriptions.Item label="数据集">{test.config.dataset || '-'}</Descriptions.Item>
                <Descriptions.Item label="迭代次数">{test.config.iterations || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {isRunning && (
          <Card
            title="实时性能监控"
            style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
          >
            <div ref={chartRef} style={{ width: '100%', height: 400 }} />
          </Card>
        )}

        {test.results && (
          <Card
            title="测试结果"
            style={{ background: '#1f1f1f', border: '1px solid #303030', marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="吞吐量"
                  value={test.results.throughput}
                  suffix={test.results.throughput_unit || 'images/s'}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="平均延迟"
                  value={test.results.latency_p50}
                  suffix={test.results.latency_unit || 'ms'}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="P99延迟"
                  value={test.results.latency_p99}
                  suffix={test.results.latency_unit || 'ms'}
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="错误率"
                  value={test.results.error_rate ?? (test.results.errors === 0 ? 0 : '-')}
                  suffix="%"
                  styles={{ content: { color: test.results.errors === 0 ? '#52c41a' : '#ff4d4f' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="GPU利用率"
                  value={test.results.gpu_utilization_avg}
                  suffix="%"
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="内存利用率"
                  value={test.results.memory_utilization_avg}
                  suffix="%"
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Statistic
                  title="平均功耗"
                  value={test.results.power_consumption_avg}
                  suffix="W"
                  styles={{ content: { color: '#faad14' } }}
                />
              </Col>
              {test.results.temperature_avg && (
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="平均温度"
                    value={test.results.temperature_avg}
                    suffix="°C"
                    styles={{ content: { color: '#ff4d4f' } }}
                  />
                </Col>
              )}
            </Row>
          </Card>
        )}

        <Card
          title="执行时间线"
          style={{ background: '#1f1f1f', border: '1px solid #303030' }}
        >
          <Timeline
            items={[
              { color: 'green', children: `任务创建 - ${new Date(test.created_at).toLocaleString('zh-CN')}` },
              ...(test.resource_usage ? [{ color: 'blue', children: `资源分配 - ${new Date(test.resource_usage.allocated_at).toLocaleString('zh-CN')}` }] : []),
              ...(test.started_at ? [{ color: 'blue', children: `开始执行 - ${new Date(test.started_at).toLocaleString('zh-CN')}` }] : []),
              ...(isRunning ? [{ color: 'gray', children: '执行中...' }] : []),
              ...(isSuccess && test.completed_at ? [{ color: 'green', children: `测试完成 - ${new Date(test.completed_at).toLocaleString('zh-CN')}` }] : []),
              ...(isFailed && test.completed_at ? [{ color: 'red', children: `测试失败 - ${new Date(test.completed_at).toLocaleString('zh-CN')}` }] : []),
            ]}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default AcceleratorTestDetailPage;
