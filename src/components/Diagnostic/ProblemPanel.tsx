import { useMemo } from 'react';
import { 
  Layout, 
  Card, 
  List, 
  Alert, 
  Space, 
  Typography, 
  Tag, 
  Button, 
  Divider,
  Statistic,
  Progress,
} from 'antd';
import { 
  WarningOutlined, 
  CloseCircleOutlined, 
  CheckCircleOutlined,
  ThunderboltOutlined,
  ClusterOutlined,
  BugOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useOrchestratorStore } from '../../store/orchestratorStore';
import { calculateResourceRequirements, detectCycles, detectIsolatedNodes } from '../../utils/transformers';
import { hasCriticalErrors } from '../../utils/validator';

const { Sider } = Layout;
const { Text, Title } = Typography;

const CLUSTER_LIMITS = {
  maxGPUs: 32,
  maxMemoryGB: 512,
  maxParallelism: 100,
};

export const ProblemPanel = () => {
  const { errors, workflow } = useOrchestratorStore();

  const resourceRequirements = useMemo(() => {
    if (!workflow) return null;
    return calculateResourceRequirements(workflow);
  }, [workflow]);

  const topologyIssues = useMemo(() => {
    if (!workflow) return [];
    const issues: any[] = [];
    
    const cycles = detectCycles(workflow.nodes, workflow.edges);
    cycles.forEach((nodeId) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      issues.push({
        type: 'cycle',
        nodeId,
        nodeName: node?.data.label || nodeId,
        severity: 'error',
        message: `Circular dependency detected involving node "${node?.data.label || nodeId}"`,
      });
    });

    const isolated = detectIsolatedNodes(workflow.nodes, workflow.edges);
    isolated.forEach((nodeId) => {
      const node = workflow.nodes.find((n) => n.id === nodeId);
      issues.push({
        type: 'isolated',
        nodeId,
        nodeName: node?.data.label || nodeId,
        severity: 'warning',
        message: `Node "${node?.data.label || nodeId}" has no connections`,
      });
    });

    return issues;
  }, [workflow]);

  const criticalErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  const totalIssues = criticalErrors.length + warnings.length + topologyIssues.length;
  const hasCriticalIssue = hasCriticalErrors(errors) || topologyIssues.some((i) => i.severity === 'error');

  const gpuUsagePercent = resourceRequirements 
    ? Math.min((resourceRequirements.totalGPUs / CLUSTER_LIMITS.maxGPUs) * 100, 100)
    : 0;
  const memoryUsagePercent = resourceRequirements
    ? Math.min((resourceRequirements.estimatedMemoryGB / CLUSTER_LIMITS.maxMemoryGB) * 100, 100)
    : 0;

  const handleNodeClick = (nodeId: string) => {
    const nodeElement = document.querySelector(`[data-nodeid="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nodeElement.classList.add('highlight-error');
      setTimeout(() => {
        nodeElement.classList.remove('highlight-error');
      }, 2000);
    }
  };

  return (
    <Sider 
      width={350} 
      style={{ 
        backgroundColor: '#1f1f1f', 
        borderLeft: '1px solid #303030',
        overflow: 'auto',
      }}
    >
      <div style={{ padding: '16px' }}>
        <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
          Diagnostics
        </Title>

        {resourceRequirements && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: 16, 
              backgroundColor: '#2a2a2a',
              borderColor: '#303030',
            }}
            bodyStyle={{ padding: '12px' }}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Statistic
                  title="GPUs"
                  value={resourceRequirements.totalGPUs}
                  suffix={`/ ${CLUSTER_LIMITS.maxGPUs}`}
                  styles={{ content: { fontSize: 18, color: '#ffffff' } }}
                  prefix={<ClusterOutlined />}
                />
                <Statistic
                  title="Memory"
                  value={resourceRequirements.estimatedMemoryGB}
                  suffix="GB"
                  styles={{ content: { fontSize: 18, color: '#ffffff' } }}
                  prefix={<ThunderboltOutlined />}
                />
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  GPU Usage
                </Text>
                <Progress 
                  percent={gpuUsagePercent} 
                  status={gpuUsagePercent > 80 ? 'exception' : 'active'}
                  strokeColor={gpuUsagePercent > 80 ? '#ff4d4f' : '#52c41a'}
                  size="small"
                />
              </div>
              
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  Memory Usage
                </Text>
                <Progress 
                  percent={memoryUsagePercent} 
                  status={memoryUsagePercent > 80 ? 'exception' : 'active'}
                  strokeColor={memoryUsagePercent > 80 ? '#ff4d4f' : '#52c41a'}
                  size="small"
                />
              </div>

              <Text type="secondary" style={{ fontSize: 11 }}>
                Estimated Duration: {resourceRequirements.estimatedDurationMinutes} min
              </Text>
            </Space>
          </Card>
        )}

        <Card 
          size="small" 
          style={{ 
            marginBottom: 16, 
            backgroundColor: '#2a2a2a',
            borderColor: '#303030',
          }}
          bodyStyle={{ padding: '12px' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ color: '#ffffff' }}>
                Issues Summary
              </Text>
              <Tag 
                color={hasCriticalIssue ? 'error' : totalIssues > 0 ? 'warning' : 'success'}
              >
                {totalIssues} {totalIssues === 1 ? 'issue' : 'issues'}
              </Tag>
            </div>
            
            <Space size="small">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                <Text style={{ color: '#ffffff' }}>{criticalErrors.length} errors</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />
                <Text style={{ color: '#ffffff' }}>{warnings.length} warnings</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BugOutlined style={{ color: '#722ed1', marginRight: 4 }} />
                <Text style={{ color: '#ffffff' }}>{topologyIssues.length} topology</Text>
              </div>
            </Space>
          </Space>
        </Card>

        {totalIssues === 0 && (
          <Alert
            message="No Issues Found"
            description="Your workflow is valid and ready to execute."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {topologyIssues.length > 0 && (
          <>
            <Divider style={{ borderColor: '#303030' }}>
              <Space>
                <BugOutlined />
                Topology Issues
              </Space>
            </Divider>
            
            <List
              size="small"
              dataSource={topologyIssues}
              renderItem={(issue) => (
                <List.Item
                  style={{ 
                    backgroundColor: issue.severity === 'error' ? '#2a1a1a' : '#2a2a1a',
                    marginBottom: 8,
                    borderRadius: 4,
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleNodeClick(issue.nodeId)}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ color: '#ffffff' }}>
                        {issue.type === 'cycle' ? 'Circular Dependency' : 'Isolated Node'}
                      </Text>
                      <Tag color={issue.severity === 'error' ? 'error' : 'warning'}>
                        {issue.severity}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {issue.message}
                    </Text>
                    {issue.nodeId && (
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                      >
                        Go to node: {issue.nodeName}
                      </Button>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {criticalErrors.length > 0 && (
          <>
            <Divider style={{ borderColor: '#303030' }}>
              <Space>
                <CloseCircleOutlined />
                Validation Errors
              </Space>
            </Divider>
            
            <List
              size="small"
              dataSource={criticalErrors}
              renderItem={(error, index) => (
                <List.Item
                  style={{ 
                    backgroundColor: '#2a1a1a',
                    marginBottom: 8,
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ color: '#ffffff' }}>
                        Error #{index + 1}
                      </Text>
                      <Tag color="error">error</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {error.path ? `${error.path}: ` : ''}{error.message}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {warnings.length > 0 && (
          <>
            <Divider style={{ borderColor: '#303030' }}>
              <Space>
                <WarningOutlined />
                Warnings
              </Space>
            </Divider>
            
            <List
              size="small"
              dataSource={warnings}
              renderItem={(warning, index) => (
                <List.Item
                  style={{ 
                    backgroundColor: '#2a2a1a',
                    marginBottom: 8,
                    borderRadius: 4,
                    padding: '8px 12px',
                  }}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong style={{ color: '#ffffff' }}>
                        Warning #{index + 1}
                      </Text>
                      <Tag color="warning">warning</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {warning.path ? `${warning.path}: ` : ''}{warning.message}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}

        {totalIssues > 0 && (
          <Alert
            message="Fix Required"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Fix all errors before executing the workflow</li>
                <li>Review warnings to ensure optimal performance</li>
                <li>Address topology issues to prevent execution failures</li>
              </ul>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </Sider>
  );
};