import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const appTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
    },
    Card: {
      colorBgContainer: '#141414',
    },
    Table: {
      headerBg: '#1f1f1f',
      rowHoverBg: '#262626',
    },
  },
};

export const lightTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};