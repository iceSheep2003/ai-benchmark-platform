import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Drawer, Descriptions, Tag, Button, Space, message, Card, Tabs, Statistic, Row, Col, Collapse } from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { testCaseApi, type TestTaskResponse, type TaskStatus } from '../../services/acceleratorTaskService';

interface Props {
  task: TestTaskResponse | null;
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  chip_basic: 'AI芯片基础测试',
  model_training: '模型训练性能测试',
  model_inference: '模型推理性能测试',
  model_accuracy: '模型精度测试',
  ecosystem_compat: '生态兼容性测试',
  video_codec: '视频编解码测试',
};

const STATUS_MAP: Record<TaskStatus, { color: string; icon: React.ReactNode; label: string }> = {
  PENDING: { color: 'default', icon: <ClockCircleOutlined />, label: '等待中' },
  RUNNING: { color: 'processing', icon: <SyncOutlined spin />, label: '运行中' },
  SUCCESS: { color: 'success', icon: <CheckCircleOutlined />, label: '已完成' },
  FAILED: { color: 'error', icon: <CloseCircleOutlined />, label: '失败' },
  CANCELLED: { color: 'default', icon: <StopOutlined />, label: '已取消' },
};

const TestTaskDetailDrawer: React.FC<Props> = ({ task: initialTask, open, onClose }) => {
  const [task, setTask] = useState<TestTaskResponse | null>(null);
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
      const res = await testCaseApi.get(taskId);
      setTask(res.data);
    } catch {
      /* ignore polling errors */
    }
  }, []);

  const fetchLogs = useCallback(async (taskId: string) => {
    try {
      const res = await testCaseApi.getLogs(taskId, 200);
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
      await testCaseApi.cancel(task.id);
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

  const renderResult = () => {
    if (!task?.result) return <div style={{ color: '#999', padding: 16 }}>暂无评测结果</div>;

    const { data, summary } = task.result;

    const numericEntries = Object.entries(data).filter(
      ([, v]) => typeof v === 'number',
    );
    const passedEntry = Object.entries(data).find(([k]) => k === 'passed');

    return (
      <div>
        {summary && (
          <Card size="small" style={{ marginBottom: 12 }}>
            <Statistic
              title="结果摘要"
              value={summary}
              valueStyle={{ fontSize: 14, color: task.status === 'FAILED' ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        )}

        {passedEntry !== undefined && (
          <Card size="small" style={{ marginBottom: 12 }}>
            <Statistic
              title="测试结论"
              value={passedEntry[1] ? '通过' : '未通过'}
              valueStyle={{ fontSize: 20, color: passedEntry[1] ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        )}

        {numericEntries.length > 0 && (
          <Card size="small" title="关键指标" style={{ marginBottom: 12 }}>
            <Row gutter={[16, 12]}>
              {numericEntries.slice(0, 8).map(([key, val]) => (
                <Col span={8} key={key}>
                  <Statistic title={key} value={Number(val)} precision={2} valueStyle={{ fontSize: 16 }} />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        <Collapse
          items={[
            {
              key: 'raw',
              label: '完整数据 (JSON)',
              children: (
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
                    color: '#c9d1d9',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {JSON.stringify(data, null, 2)}
                </div>
              ),
            },
          ]}
        />
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
          <span>测试任务详情</span>
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
            <Descriptions.Item label="测试类别">
              <Tag color="blue">{CATEGORY_LABELS[task.category] || task.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="测试类型">
              <Tag color="cyan">{task.test_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="GPU数量">{task.num_gpus}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(task.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
            {task.description && (
              <Descriptions.Item label="描述" span={2}>{task.description}</Descriptions.Item>
            )}
          </Descriptions>

          {task.error_message && (
            <Card size="small" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
              <div style={{ color: '#ff4d4f' }}>错误: {task.error_message}</div>
            </Card>
          )}

          <Tabs
            defaultActiveKey="result"
            items={[
              { key: 'result', label: '测试结果', children: renderResult() },
              { key: 'logs', label: '运行日志', children: renderLogs() },
            ]}
          />
        </>
      )}
    </Drawer>
  );
};

export default TestTaskDetailDrawer;
