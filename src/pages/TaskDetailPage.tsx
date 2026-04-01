import React from 'react';
import { Button } from 'antd';
import { useAppStore } from '../store/appStore';
import { TaskCockpit } from './TaskCockpit';

export const TaskDetailPage: React.FC = () => {
  const { selectedTask, setCurrentPage } = useAppStore();

  if (!selectedTask) {
    return (
      <div style={{ padding: '24px' }}>
        <Button onClick={() => setCurrentPage('tasks')}>
          Back to Task List
        </Button>
        <div style={{ marginTop: '24px', color: '#666' }}>No task selected</div>
      </div>
    );
  }

  return <TaskCockpit taskId={selectedTask.id} />;
};
