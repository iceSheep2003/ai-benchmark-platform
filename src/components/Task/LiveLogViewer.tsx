import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Input, Button, Space, Tag, Select, Empty } from 'antd';
import { DownloadOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { useTaskStreamStore } from '../../store/taskStreamStore';

interface LiveLogViewerProps {
  taskId?: string;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ taskId }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const { logs } = useTaskStreamStore();

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterLevel !== 'all' && log.level !== filterLevel) {
        return false;
      }
      if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [logs, filterLevel, searchText]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLogColor = (level: string): string => {
    const colors: Record<string, string> = {
      INFO: '#52c41a',
      WARNING: '#faad14',
      ERROR: '#ff4d4f',
      DEBUG: '#999',
    };
    return colors[level] || '#999';
  };

  const handleDownload = () => {
    const logContent = logs
      .map((log) => `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${taskId}-logs.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    const { clearData } = useTaskStreamStore.getState();
    clearData();
  };

  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const warningCount = logs.filter((l) => l.level === 'WARNING').length;

  return (
    <Card
      title={
        <Space>
          <span>Live Logs</span>
          <Tag color={errorCount > 0 ? 'error' : 'success'}>
            {errorCount} Errors
          </Tag>
          <Tag color={warningCount > 0 ? 'warning' : 'default'}>
            {warningCount} Warnings
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'ERROR', label: 'Error' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'INFO', label: 'Info' },
              { value: 'DEBUG', label: 'Debug' },
            ]}
          />
          <Input
            placeholder="Search logs..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button
            size="small"
            type={autoScroll ? 'primary' : 'default'}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            Auto-scroll
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClear}
          >
            Clear
          </Button>
        </Space>
      }
    >
      {filteredLogs.length === 0 ? (
        <Empty description="No logs available" />
      ) : (
        <div
          ref={logContainerRef}
          style={{
            height: '500px',
            overflowY: 'auto',
            backgroundColor: '#000',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            borderRadius: '4px',
          }}
        >
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              style={{
                color: getLogColor(log.level),
                marginBottom: '4px',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ color: '#666', marginRight: '8px' }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span
                style={{
                  fontWeight: 'bold',
                  marginRight: '8px',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  backgroundColor: `${getLogColor(log.level)}33`,
                }}
              >
                [{log.level}]
              </span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
