import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
  AppstoreOutlined,
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import { appTheme } from './theme';
import AcceleratorTaskCenter from './pages/AcceleratorTaskCenter';
import LLMTaskCenter from './pages/LLMTaskCenter';
import { TaskDetailPage } from './pages/TaskDetailPage';
import DatasetManagement from './pages/DatasetManagement';
import TestResultManagement from './pages/TestResultManagement';
import ComparisonManagementPage from './pages/ComparisonManagementPage';
import AcceleratorTestResultManagement from './pages/AcceleratorTestResultManagement';
import AcceleratorComparisonPage from './pages/AcceleratorComparisonPage';
import AcceleratorManagement from './pages/AcceleratorManagement';
import AcceleratorDetailPage from './pages/AcceleratorDetailPage';
import AcceleratorTestDetailPage from './pages/AcceleratorTestDetailPage';
import AcceleratorComparisonDetailPage from './pages/AcceleratorComparisonDetailPage';
import { useAppStore } from './store/appStore';

const { Header, Sider, Content } = Layout;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  children?: MenuItem[];
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  
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

  const menuItems: MenuItem[] = [
    {
      key: '/llm',
      icon: <RocketOutlined />,
      label: '大模型测评',
      children: [
        { key: '/llm/tasks', icon: <UnorderedListOutlined />, label: '任务中心' },
        { key: '/llm/test-result', icon: <TrophyOutlined />, label: '测试结果管理' },
        { key: '/llm/comparison', icon: <FileTextOutlined />, label: '对比分析' },
      ],
    },
    {
      key: '/accelerator',
      icon: <ThunderboltOutlined />,
      label: '加速卡测评',
      children: [
        { key: '/accelerator/management', icon: <AppstoreOutlined />, label: '加速卡管理' },
        { key: '/accelerator/tasks', icon: <UnorderedListOutlined />, label: '任务中心' },
        { key: '/accelerator/test-result', icon: <TrophyOutlined />, label: '测试结果管理' },
        { key: '/accelerator/comparison', icon: <FileTextOutlined />, label: '对比分析' },
      ],
    },
    {
      key: '/dataset',
      icon: <DatabaseOutlined />,
      label: '数据集管理',
      children: [
        { key: '/dataset/llm', icon: <DatabaseOutlined />, label: '大模型评测数据集' },
        { key: '/dataset/hardware', icon: <DatabaseOutlined />, label: '硬件性能评测数据集' },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    window.scrollTo(0, 0);
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/llm/tasks') || path.includes('/accelerator/tasks')) return '任务中心';
    if (path.includes('/llm/test-result')) return '测试结果管理';
    if (path.includes('/accelerator/test-result')) return '加速卡测试结果管理';
    if (path.includes('/llm/comparison') || path.includes('/accelerator/comparison')) return '对比分析';
    if (path.includes('/accelerator/management')) return '加速卡管理';
    if (path.includes('/accelerator/detail')) return '加速卡详情';
    if (path.includes('/accelerator/test-detail')) return '测试任务详情';
    if (path.includes('/accelerator/comparison-detail')) return '对比分析详情';
    if (path.includes('/dataset/llm')) return '大模型评测数据集';
    if (path.includes('/dataset/hardware')) return '硬件性能评测数据集';
    if (path.includes('/task-detail')) return '任务详情';
    return '任务中心';
  };

  const getSelectedKey = () => {
    return location.pathname;
  };

  const getOpenKey = () => {
    const path = location.pathname;
    if (path.startsWith('/llm')) return '/llm';
    if (path.startsWith('/accelerator')) return '/accelerator';
    if (path.startsWith('/dataset')) return '/dataset';
    return '/llm';
  };

  return (
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
          selectedKeys={[getSelectedKey()]}
          openKeys={openKeys.length > 0 ? openKeys : [getOpenKey()]}
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
            {getPageTitle()}
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
          <Routes>
            <Route path="/" element={<LLMTaskCenter />} />
            <Route path="/llm" element={<Navigate to="/llm/tasks" replace />} />
            <Route path="/llm/tasks" element={<LLMTaskCenter />} />
            <Route path="/llm/test-result" element={<TestResultManagement />} />
            <Route path="/llm/comparison" element={<ComparisonManagementPage />} />
            <Route path="/llm/task-detail" element={<TaskDetailPage />} />
            <Route path="/accelerator" element={<Navigate to="/accelerator/management" replace />} />
            <Route path="/accelerator/management" element={<AcceleratorManagement />} />
            <Route path="/accelerator/tasks" element={<AcceleratorTaskCenter />} />
            <Route path="/accelerator/test-result" element={<AcceleratorTestResultManagement />} />
            <Route path="/accelerator/comparison" element={<AcceleratorComparisonPage />} />
            <Route path="/accelerator/detail" element={<AcceleratorDetailPage />} />
            <Route path="/accelerator/test-detail" element={<AcceleratorTestDetailPage />} />
            <Route path="/accelerator/comparison-detail" element={<AcceleratorComparisonDetailPage />} />
            <Route path="/dataset" element={<Navigate to="/dataset/llm" replace />} />
            <Route path="/dataset/llm" element={<DatasetManagement category="llm" />} />
            <Route path="/dataset/hardware" element={<DatasetManagement category="hardware" />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider theme={appTheme}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
