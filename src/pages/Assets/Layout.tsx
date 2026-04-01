import React from 'react';
import { Tabs } from 'antd';
import {
  DatabaseOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import ModelsDashboard from './Models/ModelDashboard';
import DataManager from './Datasets/DataManager';
import HardwareProfile from './Accelerators/HardwareProfile';

const AssetsLayout: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  const getActiveTab = () => {
    if (currentPage === 'assets-models' || currentPage === 'assets') return 'models';
    if (currentPage === 'assets-datasets') return 'datasets';
    if (currentPage === 'assets-accelerators') return 'accelerators';
    return 'models';
  };

  const handleTabChange = (key: string) => {
    setCurrentPage(`assets-${key}` as any);
  };

  const tabItems = [
    {
      key: 'models',
      label: (
        <span>
          <DatabaseOutlined />
          Models
        </span>
      ),
      children: <ModelsDashboard />,
    },
    {
      key: 'datasets',
      label: (
        <span>
          <CloudUploadOutlined />
          Datasets
        </span>
      ),
      children: <DataManager />,
    },
    {
      key: 'accelerators',
      label: (
        <span>
          <ThunderboltOutlined />
          Accelerators
        </span>
      ),
      children: <HardwareProfile />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs
        activeKey={getActiveTab()}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        tabBarStyle={{
          marginBottom: '24px',
          borderBottom: '1px solid #303030',
        }}
      />
    </div>
  );
};

export default AssetsLayout;