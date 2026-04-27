import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Drawer, Descriptions, Tag, Space, Card, Row, Col, Statistic, Tabs, Button, message } from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { acceleratorTaskApi, type TaskResponse, type TaskStatus } from '../../services/acceleratorTaskService';

interface Props {
  task: TaskResponse | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<TaskStatus, { color: string; icon: React.ReactNode; label: string }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined />, label: '等待中' },
  RUNNING: { color: 'processing', icon: <SyncOutlined spin />, label: '运行中' },
  SUCCESS: { color: 'success', icon: <CheckCircleOutlined />, label: '已完成' },
  FAILED: { color: 'error', icon: <CloseCircleOutlined />, label: '失败' },
  CANCELLED: { color: 'default', icon: <StopOutlined />, label: '已取消' },
};

const AcceleratorTaskDetailDrawer: React.FC<Props> = ({ task: initialTask, open, onClose }) => {
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchTask = useCallback(async (taskId: string) => {
    try {
      const res = await acceleratorTaskApi.get(taskId);
      setTask(res.data);
    } catch {
      /* ignore polling errors */
    }
  }, []);

  const fetchLogs = useCallback(async (taskId: string) => {
    try {
      const res = await acceleratorTaskApi.getLogs(taskId, 200);
      setLogs(res.data.lines);
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open && initialTask) {
      setTask(initialTask);
      setLogs(initialTask.log_tail || []);

      const id = initialTask.id;
      fetchTask(id);
      fetchLogs(id);

      pollRef.current = setInterval(() => {
        fetchTask(id);
        fetchLogs(id);
      }, 5000);
    } else {
      setTask(null);
      setLogs([]);
    }

    return stopPolling;
  }, [open, initialTask, fetchTask, fetchLogs, stopPolling]);

  useEffect(() => {
    if (task && ['SUCCESS', 'FAILED', 'CANCELLED'].includes(task.status)) {
      stopPolling();
    }
  }, [task?.status, stopPolling]);

  const handleCancel = async () => {
    if (!task) return;
    try {
      await acceleratorTaskApi.cancel(task.id);
      message.success('任务已取消');
      fetchTask(task.id);
    } catch {
      message.error('取消失败');
    }
  };

  const handleRefresh = () => {
    if (!task) return;
    fetchTask(task.id);
    fetchLogs(task.id);
  };

  const statusInfo = task ? STATUS_MAP[task.status] : null;

  const renderMetrics = () => {
    if (!task?.metrics) return <div style={{ color: '#999', padding: 16 }}>暂无实时指标</div>;
    const m = task.metrics;
    return (
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Statistic title="GPU 利用率" value={m.gpu_util_pct ?? 0} suffix="%" valueStyle={{ color: '#1890ff' }} />
        </Col>
        <Col span={6}>
          <Statistic
            title="显存使用"
            value={m.gpu_memory_used_mb ? `${(m.gpu_memory_used_mb / 1024).toFixed(1)}` : 'N/A'}
            suffix={m.gpu_memory_total_mb ? `/ ${(m.gpu_memory_total_mb / 1024).toFixed(0)} GB` : ''}
          />
        </Col>
        <Col span={6}>
          <Statistic title="温度" value={m.temperature_celsius ?? 0} suffix="°C" />
        </Col>
        <Col span={6}>
          <Statistic title="功耗" value={m.power_watts ?? 0} suffix="W" />
        </Col>
      </Row>
    );
  };

  const renderResult = () => {
    if (!task?.result) return <div style={{ color: '#999', padding: 16 }}>暂无评测结果</div>;
    const r = task.result;
    return (
      <div>
        {r.overall_score !== null && (
          <Card size="small" style={{ marginBottom: 12 }}>
            <Statistic
              title="综合得分"
              value={r.overall_score?.toFixed(2)}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        )}
        <Card size="small" title="各数据集得分">
          {r.scores.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>{s.dataset}</span>
              <span>
                <Tag color="blue">{s.metric}</Tag>
                <strong>{s.score.toFixed(2)}</strong>
              </span>
            </div>
          ))}
        </Card>
        {r.total_time_seconds && (
          <div style={{ marginTop: 8, color: '#999' }}>
            总耗时: {(r.total_time_seconds / 60).toFixed(1)} 分钟 | 后端: {r.backend_used}
          </div>
        )}
      </div>
    );
  };

  const renderLogs = () => (
    <div
      style={{
        background: '#0d1117',
        borderRadius: 6,
        padding: 12,
        maxHeight: 400,
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {logs.length === 0 ? (
        <div style={{ color: '#666' }}>暂无日志输出...</div>
      ) : (
        logs.map((line, i) => (
          <div key={i} style={{ color: '#c9d1d9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line}
          </div>
        ))
      )}
      <div ref={logEndRef} />
    </div>
  );

  return (
    <Drawer
      title={
        <Space>
          <span>任务详情</span>
          {statusInfo && (
            <Tag icon={statusInfo.icon} color={statusInfo.color}>
              {statusInfo.label}
            </Tag>
          )}
        </Space>
      }
      placement="right"
      width={680}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          {task?.status === 'RUNNING' && (
            <Button danger icon={<StopOutlined />} onClick={handleCancel}>
              取消任务
            </Button>
          )}
        </Space>
      }
    >
      {task && (
        <>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="任务ID">{task.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{task.name}</Descriptions.Item>
            <Descriptions.Item label="模型">{task.model_path}</Descriptions.Item>
            <Descriptions.Item label="推理后端">
              <Tag color="blue">{task.backend}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="数据集">
              <Space wrap>{task.datasets.map((d) => <Tag key={d}>{d}</Tag>)}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="GPU数量">{task.num_gpus}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{new Date(task.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
            <Descriptions.Item label="优先级"><Tag>{task.priority}</Tag></Descriptions.Item>
          </Descriptions>

          {task.error_message && (
            <Card size="small" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
              <div style={{ color: '#ff4d4f' }}>错误: {task.error_message}</div>
            </Card>
          )}

          <Tabs
            defaultActiveKey="metrics"
            items={[
              { key: 'metrics', label: '实时指标', children: renderMetrics() },
              { key: 'result', label: '评测结果', children: renderResult() },
              { key: 'logs', label: '运行日志', children: renderLogs() },
            ]}
          />
        </>
      )}
    </Drawer>
  );
};

export default AcceleratorTaskDetailDrawer;
