import React from 'react';
import { Collapse, Switch, Checkbox, Space, Typography, Divider } from 'antd';

const { Text } = Typography;

interface OfflineTestSelectorProps {
  offlineTests: OfflineTest[];
  onOfflineTestsChange: (tests: OfflineTest[]) => void;
}

export interface OfflineTest {
  id: string;
  title: string;
  icon: string;
  description: string;
  enabled: boolean;
  details: string[];
  subItems: {
    label: string;
    value: string;
    options: string[];
    selected?: string[];
  }[];
}

const initialOfflineTests: OfflineTest[] = [
  {
    id: 'functional',
    title: '功能测试',
    icon: '✅',
    description: '验证加速卡的基本功能是否正常',
    enabled: false,
    details: [
      '基础算子测试：矩阵乘法、卷积等',
      '精度验证：FP32、FP16、BF16 精度对比',
      '兼容性测试：与主流框架的兼容性',
    ],
    subItems: [
      { 
        label: '深度学习框架支持', 
        value: 'framework_support', 
        options: ['PyTorch', 'TensorFlow', 'MindSpore'],
        selected: [],
      },
      { 
        label: '算子库支持', 
        value: 'operator_support', 
        options: ['CUDA', 'CANN', 'ROCm'],
        selected: [],
      },
    ],
  },
  {
    id: 'compatibility',
    title: '兼容性测试',
    icon: '🔗',
    description: '测试加速卡与软硬件的兼容性',
    enabled: false,
    details: [
      '操作系统兼容性：Linux、Windows',
      '驱动版本兼容性',
      '第三方库兼容性',
    ],
    subItems: [
      { 
        label: '操作系统', 
        value: 'os', 
        options: ['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 7', 'Windows Server'],
        selected: [],
      },
      { 
        label: '驱动版本', 
        value: 'driver', 
        options: ['525.x', '535.x', '545.x'],
        selected: [],
      },
    ],
  },
  {
    id: 'reliability',
    title: '可靠性测试',
    icon: '🔒',
    description: '评估加速卡的可靠性和容错能力',
    enabled: false,
    details: [
      '故障注入测试',
      '数据一致性验证',
      '错误恢复能力测试',
    ],
    subItems: [
      { 
        label: '故障类型', 
        value: 'fault_type', 
        options: ['内存错误', '计算错误', '通信错误'],
        selected: [],
      },
      { 
        label: '恢复策略', 
        value: 'recovery', 
        options: ['自动重启', '任务迁移', '降级运行'],
        selected: [],
      },
    ],
  },
];

export const OfflineTestSelector: React.FC<OfflineTestSelectorProps> = ({
  offlineTests,
  onOfflineTestsChange,
}) => {
  const [localTests, setLocalTests] = React.useState<OfflineTest[]>(
    offlineTests.length > 0 ? offlineTests : initialOfflineTests
  );

  React.useEffect(() => {
    if (offlineTests.length > 0) {
      setLocalTests(offlineTests);
    }
  }, [offlineTests]);

  const handleToggleEnabled = (testId: string, enabled: boolean) => {
    const updatedTests = localTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          enabled,
        };
      }
      return test;
    });

    setLocalTests(updatedTests);
    onOfflineTestsChange(updatedTests);
  };

  const handleSubItemChange = (testId: string, subItemValue: string, checkedValues: string[]) => {
    const updatedTests = localTests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          subItems: test.subItems.map(subItem => {
            if (subItem.value === subItemValue) {
              return {
                ...subItem,
                selected: checkedValues,
              };
            }
            return subItem;
          }),
        };
      }
      return test;
    });

    setLocalTests(updatedTests);
    onOfflineTestsChange(updatedTests);
  };

  const collapseItems = localTests.map(test => ({
    key: test.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 20, marginRight: 12 }}>{test.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {test.title}
            </div>
            <div style={{ fontSize: 14, color: '#999' }}>
              {test.description}
            </div>
          </div>
        </div>
        <Switch
          checked={test.enabled}
          onChange={(checked) => handleToggleEnabled(test.id, checked)}
          style={{ marginLeft: 16 }}
        />
      </div>
    ),
    children: (
      <div style={{ paddingLeft: 32 }}>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: '#fff', display: 'block', marginBottom: 8 }}>
            测试方式：
          </Text>
          <ul style={{ 
            margin: 0, 
            paddingLeft: 20, 
            color: '#999',
            fontSize: 14,
            lineHeight: 1.8,
          }}>
            {test.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>

        <Divider style={{ borderColor: '#434343', margin: '16px 0' }} />

        {test.subItems.map((subItem) => (
          <div key={subItem.value} style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: 500, 
              color: '#fff',
              display: 'block',
              marginBottom: 8,
            }}>
              {subItem.label}：
            </Text>
            <Checkbox.Group
              value={subItem.selected || []}
              onChange={(values) => handleSubItemChange(test.id, subItem.value, values as string[])}
            >
              <Space direction="vertical" size="small">
                {subItem.options.map((option) => (
                  <Checkbox key={option} value={option} style={{ color: '#fff' }}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', color: '#fff' }}>
        线下测试配置
      </h3>
      <Collapse
        items={collapseItems}
        bordered={false}
        style={{
          backgroundColor: 'transparent',
        }}
        defaultActiveKey={[]}
      />
    </div>
  );
};
