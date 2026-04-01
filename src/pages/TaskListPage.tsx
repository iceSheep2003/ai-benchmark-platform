import React from 'react';
import { Layout } from 'antd';
import { TaskListPanel } from '../components/TaskList/TaskListPanel';
import { TaskMonitorPanel } from '../components/TaskList/TaskMonitorPanel';
import { useTaskListStore } from '../store/taskListStore';

const { Sider, Content } = Layout;

export const TaskListPage: React.FC = () => {
  const { selectedTask } = useTaskListStore();

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#141414' }}>
      <Sider
        width={400}
        style={{
          backgroundColor: '#1f1f1f',
          borderRight: '1px solid #303030',
          overflow: 'auto',
        }}
      >
        <TaskListPanel />
      </Sider>

      <Content
        style={{
          backgroundColor: '#141414',
          overflow: 'auto',
        }}
      >
        {selectedTask ? (
          <TaskMonitorPanel task={selectedTask} />
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#666',
              fontSize: '16px',
            }}
          >
            Select a task to view details
          </div>
        )}
      </Content>
    </Layout>
  );
};
