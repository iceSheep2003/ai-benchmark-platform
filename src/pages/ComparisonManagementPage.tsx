import React from 'react';
import { Card, Typography } from 'antd';
import { ComparisonManagement } from '../components/TestResult/ComparisonManagement';

const { Title } = Typography;

export const ComparisonManagementPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #303030',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          对比分析
        </Title>
      </Card>
      <ComparisonManagement />
    </div>
  );
};

export default ComparisonManagementPage;
