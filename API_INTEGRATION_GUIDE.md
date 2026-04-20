# API 集成指南

## 📋 概述

本文档说明如何将后端 API 集成到现有的加速卡测评前端页面中。

---

## 🏗️ 架构说明

### 文件结构

```
src/
├── types/
│   └── apiTypes.ts              # API 类型定义
├── services/
│   ├── apiClient.ts             # API 客户端（处理认证、错误、拦截）
│   └── acceleratorService.ts    # 加速卡相关 API 服务
├── hooks/
│   ├── useAccelerators.ts       # 加速卡数据管理 Hook
│   └── useComparisons.ts        # 对比分析数据管理 Hook
└── pages/
    ├── AcceleratorTestResultManagementWithAPI.example.tsx  # 示例页面
    └── ...
```

---

## 🚀 快速开始

### 1. 配置环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 2. 安装依赖

确保已安装 axios：

```bash
npm install axios
```

---

## 📝 集成步骤

### 步骤 1：修改 AcceleratorTestResultManagement 页面

**原代码（使用 mock 数据）：**

```typescript
import { acceleratorCards } from '../mockData/acceleratorMock';

export const AcceleratorTestResultManagement: React.FC = () => {
  const testedCount = acceleratorCards.filter(c => c.status === 'tested').length;
  // ...
};
```

**新代码（使用 API）：**

```typescript
import { useAccelerators } from '../hooks/useAccelerators';

export const AcceleratorTestResultManagement: React.FC = () => {
  const { 
    accelerators, 
    loading, 
    error, 
    refreshAccelerators 
  } = useAccelerators({ pageSize: 100 });

  const testedCount = accelerators.filter(c => c.status === 'tested').length;
  // ...
};
```

**主要改动：**

1. 导入 `useAccelerators` Hook
2. 使用 Hook 获取数据、加载状态和错误状态
3. 添加加载状态显示
4. 添加错误处理
5. 添加刷新功能

---

### 步骤 2：修改 AcceleratorLeaderboard 组件

**需要修改的地方：**

1. **类型定义**：将 `AcceleratorCard` 类型替换为 `Accelerator` 类型
2. **数据获取**：从 props 接收数据，或使用 Hook 获取
3. **加载状态**：添加加载状态显示
4. **错误处理**：添加错误处理逻辑

**示例：**

```typescript
import { useAccelerators } from '../../hooks/useAccelerators';
import type { Accelerator } from '../../types/apiTypes';

interface AcceleratorLeaderboardProps {
  onCardSelect: (cards: Accelerator[]) => void;
  accelerators?: Accelerator[];  // 可选：从父组件传入
}

export const AcceleratorLeaderboard: React.FC<AcceleratorLeaderboardProps> = ({ 
  onCardSelect,
  accelerators: propAccelerators 
}) => {
  // 如果没有从 props 接收数据，则使用 Hook 获取
  const { accelerators: hookAccelerators, loading, error } = useAccelerators();
  
  const accelerators = propAccelerators || hookAccelerators;

  if (loading) {
    return <Spin />;
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  // ... 原有逻辑
};
```

---

### 步骤 3：修改 AcceleratorComparisonPage 页面

**原代码（使用 mock 数据）：**

```typescript
import { comparisonResults } from '../mockData/comparisonResultMock';

export const AcceleratorComparisonPage: React.FC = () => {
  const [comparisons] = useState(comparisonResults);
  // ...
};
```

**新代码（使用 API）：**

```typescript
import { useComparisons } from '../hooks/useComparisons';

export const AcceleratorComparisonPage: React.FC = () => {
  const { 
    comparisons, 
    loading, 
    error, 
    starComparison,
    unstarComparison,
    deleteComparison,
    refreshComparisons 
  } = useComparisons();

  // ...
};
```

---

## 🔧 API 服务使用示例

### 1. 获取加速卡列表

```typescript
import acceleratorService from '../services/acceleratorService';

// 在组件中使用
const fetchAccelerators = async () => {
  try {
    const response = await acceleratorService.getAccelerators({
      page: 1,
      pageSize: 10,
      status: 'tested',
      vendor: 'NVIDIA',
    });
    
    if (response.code === 200) {
      console.log('加速卡列表:', response.data.items);
    }
  } catch (error) {
    console.error('获取失败:', error);
  }
};
```

### 2. 获取单个加速卡详情

```typescript
const fetchAcceleratorDetail = async (id: string) => {
  try {
    const response = await acceleratorService.getAccelerator(id);
    
    if (response.code === 200) {
      console.log('加速卡详情:', response.data);
    }
  } catch (error) {
    console.error('获取失败:', error);
  }
};
```

### 3. 创建测试任务

```typescript
const createTest = async (acceleratorId: string) => {
  try {
    const response = await acceleratorService.createTest(acceleratorId, {
      name: '性能测试',
      type: 'performance',
      priority: 'P1',
      config: {
        test_duration_minutes: 60,
        workload: 'resnet50-training',
      },
    });
    
    if (response.code === 201) {
      console.log('测试任务创建成功:', response.data);
    }
  } catch (error) {
    console.error('创建失败:', error);
  }
};
```

### 4. 创建对比分析

```typescript
const createComparison = async () => {
  try {
    const response = await acceleratorService.createComparison({
      name: 'H100 vs A100 对比',
      description: '对比两款加速卡的性能',
      accelerator_ids: ['acc-id-1', 'acc-id-2'],
      comparison_config: {
        dimensions: ['compute', 'memory', 'bandwidth'],
      },
    });
    
    if (response.code === 201) {
      console.log('对比分析创建成功:', response.data);
    }
  } catch (error) {
    console.error('创建失败:', error);
  }
};
```

---

## 🎣 自定义 Hook 使用示例

### 1. useAccelerators Hook

```typescript
import { useAccelerators } from '../hooks/useAccelerators';

const MyComponent = () => {
  const { 
    accelerators,    // 加速卡列表
    loading,         // 加载状态
    error,           // 错误信息
    total,           // 总数
    page,            // 当前页
    pageSize,        // 每页数量
    fetchAccelerators,  // 获取数据函数
    refreshAccelerators, // 刷新数据函数
  } = useAccelerators({ 
    pageSize: 20,
    status: 'tested',
  });

  if (loading) return <Spin />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <Button onClick={refreshAccelerators}>刷新</Button>
      <ul>
        {accelerators.map(acc => (
          <li key={acc.id}>{acc.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### 2. useComparisons Hook

```typescript
import { useComparisons } from '../hooks/useComparisons';

const MyComponent = () => {
  const { 
    comparisons, 
    loading, 
    error,
    starComparison,
    unstarComparison,
    deleteComparison,
  } = useComparisons({ is_starred: true });

  const handleStar = async (id: string) => {
    await starComparison(id);
  };

  const handleDelete = async (id: string) => {
    await deleteComparison(id);
  };

  return (
    <div>
      {comparisons.map(comp => (
        <div key={comp.id}>
          <h3>{comp.name}</h3>
          <Button onClick={() => handleStar(comp.id)}>
            {comp.is_starred ? '取消收藏' : '收藏'}
          </Button>
          <Button onClick={() => handleDelete(comp.id)}>删除</Button>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔐 认证集成

### 1. 登录流程

```typescript
import apiClient from '../services/apiClient';

const login = async (username: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });

    if (response.code === 200 && response.data) {
      const { access_token, refresh_token, user } = response.data;
      
      // 保存 token
      apiClient.setTokens(access_token, refresh_token);
      
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('登录成功:', user);
    }
  } catch (error) {
    console.error('登录失败:', error);
  }
};
```

### 2. 登出流程

```typescript
const logout = () => {
  apiClient.clearTokens();
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

### 3. Token 自动刷新

API 客户端已经内置了 Token 自动刷新机制：

- 当收到 401 错误时，自动尝试使用 refresh_token 刷新
- 刷新成功后，重新发送原请求
- 刷新失败时，清除 token 并跳转到登录页

---

## ⚠️ 注意事项

### 1. 类型兼容性

API 类型定义（`apiTypes.ts`）与 mock 数据类型可能不完全一致，需要注意：

- `Accelerator` (API) vs `AcceleratorCard` (mock)
- `Comparison` (API) vs `ComparisonResult` (mock)

**解决方案：**

1. 逐步迁移：先创建新组件使用 API 类型，旧组件保持不变
2. 类型适配：创建适配器函数转换类型
3. 统一类型：修改所有组件使用 API 类型

### 2. 错误处理

所有 API 调用都应该包含错误处理：

```typescript
try {
  const response = await acceleratorService.getAccelerators();
  if (response.code === 200) {
    // 处理成功响应
  } else {
    // 处理业务错误
    message.error(response.message);
  }
} catch (error) {
  // 处理网络错误
  message.error('网络请求失败');
}
```

### 3. 加载状态

所有数据获取都应该显示加载状态：

```typescript
const { accelerators, loading } = useAccelerators();

if (loading) {
  return <Spin tip="加载中..." />;
}
```

### 4. 数据缓存

考虑使用 React Query 或 SWR 进行数据缓存和自动刷新：

```typescript
// 使用 React Query 示例
import { useQuery } from 'react-query';

const { data, isLoading, error } = useQuery(
  'accelerators',
  () => acceleratorService.getAccelerators(),
  {
    staleTime: 5 * 60 * 1000, // 5 分钟
    cacheTime: 10 * 60 * 1000, // 10 分钟
  }
);
```

---

## 📊 完整示例

参考以下文件查看完整示例：

- `src/pages/AcceleratorTestResultManagementWithAPI.example.tsx` - 完整的页面集成示例

---

## 🚀 下一步

1. **测试 API 连接**：确保后端 API 正常运行
2. **逐步迁移**：从最简单的页面开始迁移
3. **添加认证**：实现登录、登出功能
4. **优化体验**：添加加载动画、错误提示
5. **性能优化**：使用缓存、分页加载

---

## 📚 相关文档

- [API 接口文档](./ACCELERATOR_API_DOCUMENTATION.md)
- [微服务架构演进方案](./MICROSERVICE_EVOLUTION_PLAN.md)
- [后端集成计划](./BACKEND_INTEGRATION_PLAN.md)
