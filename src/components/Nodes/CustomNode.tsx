import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card, Badge, Tooltip, Typography } from 'antd';
import { 
  DatabaseOutlined, 
  CodeOutlined, 
  ClusterOutlined, 
  CheckCircleOutlined, 
  FileTextOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const NODE_TYPE_ICONS = {
  data_loader: <DatabaseOutlined />,
  model_inference: <CodeOutlined />,
  resource_alloc: <ClusterOutlined />,
  evaluator: <CheckCircleOutlined />,
  reporter: <FileTextOutlined />,
};

const STATUS_COLORS = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  warning: 'warning',
};

const STATUS_ICONS = {
  pending: null,
  running: <LoadingOutlined spin />,
  success: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  warning: <WarningOutlined />,
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeType = (data as any).nodeType || 'data_loader';
  const icon = NODE_TYPE_ICONS[nodeType as keyof typeof NODE_TYPE_ICONS] || <DatabaseOutlined />;
  const status = (data as any).status || 'pending';
  const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
  const statusIcon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];

  const getConfigSummary = () => {
    const config = (data as any).config || {};
    
    switch (nodeType) {
      case 'data_loader':
        return `BS=${config.batchSize || 'N/A'}`;
      case 'model_inference':
        return `${config.precision || 'FP16'}, T=${config.temperature || '1.0'}`;
      case 'resource_alloc':
        return `${config.cardModel || 'N/A'} x${config.gpuCount || 0}`;
      case 'evaluator':
        return `${config.metrics?.length || 0} metrics`;
      case 'reporter':
        return config.format || 'JSON';
      default:
        return '';
    }
  };

  const configSummary = getConfigSummary();
  const hasError = status === 'failed' || (data as any).errorMessage;

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={Position.Top} />
      
      <Card
        hoverable
        size="small"
        style={{
          minWidth: 200,
          maxWidth: 250,
          border: selected ? '2px solid #1890ff' : hasError ? '2px solid #ff4d4f' : '1px solid #303030',
          backgroundColor: '#1f1f1f',
          color: '#ffffff',
          boxShadow: selected ? '0 0 10px rgba(24, 144, 255, 0.5)' : 'none',
        }}
        bodyStyle={{
          padding: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ marginRight: 8, fontSize: 16, color: '#1890ff' }}>
            {icon}
          </span>
          <Text strong style={{ color: '#ffffff', flex: 1 }}>
            {(data as any).label || 'Untitled'}
          </Text>
          {statusIcon && (
            <span style={{ marginLeft: 8, color: statusColor === 'error' ? '#ff4d4f' : '#52c41a' }}>
              {statusIcon}
            </span>
          )}
        </div>

        {configSummary && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {configSummary}
          </Text>
        )}

        {(data as any).errorMessage && (
          <Tooltip title={(data as any).errorMessage}>
            <Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              {(data as any).errorMessage.length > 30 ? (data as any).errorMessage.slice(0, 30) + '...' : (data as any).errorMessage}
            </Text>
          </Tooltip>
        )}

        {status !== 'pending' && (
          <Badge 
            status={statusColor as any} 
            text={status}
            style={{ marginTop: 8, display: 'block' }}
          />
        )}
      </Card>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
