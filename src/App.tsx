import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  RocketOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import { appTheme } from './theme';
import { useAppStore } from './store/appStore';
import AcceleratorTaskCenter from './pages/AcceleratorTaskCenter';
import LLMTaskCenter from './pages/LLMTaskCenter';
import { TaskDetailPage } from './pages/TaskDetailPage';
import DatasetManagement from './pages/DatasetManagement';
import TestResultManagement from './pages/TestResultManagement';
import ComparisonManagementPage from './pages/ComparisonManagementPage';
import AcceleratorTestResultManagement from './pages/AcceleratorTestResultManagement';
import AcceleratorComparisonPage from './pages/AcceleratorComparisonPage';

const { Header, Sider, Content } = Layout;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: MenuItem[];
};

const App: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, currentPage, setCurrentPage } = useAppStore();
  const [openKeys, setOpenKeys] = useState<string[]>(['llm']);
  const currentUser = {
    name: 'Admin User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    email: 'admin@aibenchmark.com',
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      console.log('Logout clicked');
    } else if (key === 'profile') {
      console.log('Profile clicked');
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const renderContent = () => {
    switch (currentPage) {
      case 'llm-tasks':
        return <LLMTaskCenter />;
      case 'accelerator-tasks':
        return <AcceleratorTaskCenter />;
      case 'task-detail':
        return <TaskDetailPage />;
      case 'test-result':
        return <TestResultManagement />;
      case 'accelerator-test-result':
        return <AcceleratorTestResultManagement />;
      case 'llm-comparison':
        return <ComparisonManagementPage />;
      case 'accelerator-comparison':
        return <AcceleratorComparisonPage />;
      case 'dataset-llm':
        return <DatasetManagement category="llm" />;
      case 'dataset-hardware':
        return <DatasetManagement category="hardware" />;
      default:
        return <LLMTaskCenter />;
    }
  };

  const menuItems: MenuItem[] = [
    {
      key: 'llm',
      icon: <RocketOutlined />,
      label: '大模型测评',
      children: [
        { key: 'llm-tasks', icon: <UnorderedListOutlined />, label: '任务中心' },
        { key: 'test-result', icon: <TrophyOutlined />, label: '测试结果管理' },
        { key: 'llm-comparison', icon: <FileTextOutlined />, label: '对比分析' },
      ],
    },
    {
      key: 'accelerator',
      icon: <ThunderboltOutlined />,
      label: '加速卡测评',
      children: [
        { key: 'accelerator-tasks', icon: <UnorderedListOutlined />, label: '任务中心' },
        { key: 'accelerator-test-result', icon: <TrophyOutlined />, label: '测试结果管理' },
        { key: 'accelerator-comparison', icon: <FileTextOutlined />, label: '对比分析' },
      ],
    },
    {
      key: 'dataset-management',
      icon: <DatabaseOutlined />,
      label: '数据集管理',
      children: [
        { key: 'dataset-llm', icon: <DatabaseOutlined />, label: '大模型评测数据集' },
        { key: 'dataset-hardware', icon: <DatabaseOutlined />, label: '硬件性能评测数据集' },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setCurrentPage(key);
    window.scrollTo(0, 0);
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <ConfigProvider theme={appTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          width={256}
          collapsedWidth={80}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              borderBottom: '1px solid #303030',
              cursor: 'pointer',
            }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? 'AI' : 'AIBenchmark'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPage]}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            onClick={handleMenuClick}
            items={menuItems}
            inlineIndent={16}
          />
        </Sider>
        <Layout style={{ marginLeft: sidebarCollapsed ? 80 : 256 }}>
          <Header
            style={{
              background: '#1f1f1f',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #303030',
            }}
          >
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              {currentPage === 'llm-tasks' || currentPage === 'accelerator-tasks' || currentPage === 'tasks' ? '任务中心' :
               currentPage === 'test-result' ? '测试结果管理' :
               currentPage === 'accelerator-test-result' ? '加速卡测试结果管理' :
               currentPage === 'llm-comparison' || currentPage === 'accelerator-comparison' || currentPage === 'comparison' ? '对比分析' :
               currentPage === 'dataset-llm' ? '大模型评测数据集' :
               currentPage === 'dataset-hardware' ? '硬件性能评测数据集' : '任务中心'}
            </div>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  size="default" 
                  src={currentUser.avatar}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {currentUser.name.charAt(0)}
                </Avatar>
                <span style={{ color: '#fff' }}>{currentUser.name}</span>
              </Space>
            </Dropdown>
          </Header>
          <Content
            style={{
              margin: '0',
              padding: 0,
              minHeight: 'calc(100vh - 64px)',
              background: '#141414',
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;