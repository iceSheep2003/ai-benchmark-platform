# AI Benchmark 平台

> 一个综合性的人工智能模型和硬件性能评测平台，支持大语言模型（LLM）和加速卡（GPU/TPU）的性能测试、结果管理和对比分析。

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [功能模块详解](#功能模块详解)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目简介

AI Benchmark 是一个专业的人工智能评测平台，旨在为研究人员、开发者和企业提供全面、准确的模型和硬件性能评估工具。平台支持大语言模型和加速卡两大类评测对象，提供从任务创建、执行监控到结果分析的全流程管理。

### 核心价值

- **多维度评测**：支持语言理解、逻辑推理、文本生成、代码能力等多维度能力评估
- **可视化分析**：提供雷达图、火焰图、仪表盘等丰富的数据可视化
- **对比分析**：支持多模型/多硬件的横向对比和趋势分析
- **工作流编排**：提供可视化的评测任务配置和执行流程
- **实时监控**：实时跟踪任务执行状态和性能指标

---

## 功能特性

### 🤖 大模型测评

#### 任务中心
- ✅ 任务列表展示与筛选
- ✅ 任务状态实时监控（待执行、执行中、已完成、失败）
- ✅ 任务详情查看与配置
- ✅ 实时日志查看
- ✅ 任务优先级调整

#### 测试结果管理
- ✅ 智能排行榜（多维度排序）
- ✅ 测试生命周期管理（已测试、测试中、待测试）
- ✅ 模型报告查看
- ✅ 重新测试功能
- ✅ 批量测试启动

#### 对比分析
- ✅ 多模型对比创建
- ✅ 详细指标对比（层级表格）
- ✅ 雷达图可视化
- ✅ 优势分析
- ✅ 对比收藏管理（全部、我的、收藏、共享）

### ⚡ 加速卡测评

#### 任务中心
- ✅ 加速卡选择与配置
- ✅ 评测任务创建
- ✅ 任务执行监控
- ✅ 实时性能指标展示

#### 测试结果管理
- ✅ 网格化卡片布局
- ✅ KPI 指标卡片（吞吐量、温度、功耗、延迟、帧率、带宽）
- ✅ 综合评估维度仪表盘（功能性、兼容性、可靠性）
- ✅ 加速卡排行榜
- ✅ 性能趋势分析

#### 对比分析
- ✅ 多加速卡对比创建
- ✅ 性能指标对比
- ✅ 热力图可视化
- ✅ 优势分析

### 📊 数据集管理

#### 大模型评测数据集
- ✅ 数据集列表管理
- ✅ 数据集详情查看
- ✅ 数据集分类与标签

#### 硬件性能评测数据集
- ✅ 数据集列表管理
- ✅ 数据集详情查看
- ✅ 数据集分类与标签

---

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.4 | 组件化开发 |
| TypeScript | 5.9.3 | 类型安全 |
| Vite | 8.0.0 | 开发构建工具 |

### UI 组件库

| 技术 | 版本 | 用途 |
|------|------|------|
| Ant Design | 6.3.2 | 基础 UI 组件 |
| @ant-design/icons | 6.1.0 | 图标库 |

### 状态管理

| 技术 | 版本 | 用途 |
|------|------|------|
| Zustand | 5.0.11 | 全局状态管理 |

### 数据可视化

| 技术 | 版本 | 用途 |
|------|------|------|
| ECharts | 6.0.0 | 图表可视化 |
| React Flow | 11.11.4 | 流程图编辑器 |

### 代码编辑器

| 技术 | 版本 | 用途 |
|------|------|------|
| Monaco Editor | 4.7.0 | 代码编辑器 |

### 工具库

| 技术 | 版本 | 用途 |
|------|------|------|
| Axios | 1.13.6 | HTTP 请求 |
| Lodash | 4.17.23 | 工具函数 |
| UUID | 13.0.0 | 唯一标识生成 |
| AJV | 8.18.0 | JSON Schema 验证 |

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd demo

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 代码检查

```bash
# 运行 ESLint 检查
npm run lint
```

---

## 功能模块详解

### 大模型测评模块

#### 任务中心

**功能描述**：
提供大模型评测任务的创建、执行、监控和管理功能。

**主要特性**：
- 任务列表展示：表格形式展示所有评测任务
- 状态筛选：支持按状态（待执行、执行中、已完成、失败）筛选
- 优先级排序：支持按优先级排序任务
- 实时监控：实时更新任务状态和进度
- 任务详情：点击任务查看详细信息和配置
- 实时日志：使用 LiveLogViewer 组件查看实时日志输出
- 重新执行：支持重新执行失败或需要重新测试的任务

**使用场景**：
1. 创建新的评测任务
2. 监控正在执行的任务
3. 查看历史任务记录
4. 重新测试模型

#### 测试结果管理

**功能描述**：
提供大模型评测结果的查看、分析和对比功能。

**主要特性**：
- 智能排行榜：表格形式展示模型排名
- 多维度排序：支持按综合得分、语言理解、逻辑推理等维度排序
- 领域筛选：支持按领域（通用、代码、对话等）筛选
- 能力标签筛选：支持按能力标签筛选
- 搜索功能：支持按模型名称、组织搜索
- 趋势迷你图：显示模型性能趋势
- 测试生命周期管理：三个标签页（已测试、测试中、待测试）
- 模型报告查看：弹窗形式展示模型详细报告
- 批量测试：支持批量启动待测试模型

**使用场景**：
1. 查看模型排名
2. 分析模型性能
3. 查看详细报告
4. 批量启动测试

#### 对比分析

**功能描述**：
提供多模型对比分析和结果管理功能。

**主要特性**：
- 对比列表管理：四个标签页（全部对比、我的对比、收藏对比、共享对比）
- 创建对比：弹窗形式选择模型创建对比
- 对比详情查看：三个标签页（概览、详细对比、优势分析）
- 雷达图可视化：多维度能力对比
- 详细指标表格：层级表格展示详细指标
- 优势分析：显示每个模型的优势、劣势、推荐场景
- 收藏管理：支持收藏和取消收藏对比

**使用场景**：
1. 创建模型对比
2. 查看对比详情
3. 收藏重要对比
4. 分享对比结果

### 加速卡测评模块

#### 任务中心

**功能描述**：
提供加速卡评测任务的创建、执行、监控和管理功能。

**主要特性**：
- 加速卡选择：支持选择不同型号的加速卡
- 评测配置：配置评测参数和优先级
- 任务执行监控：实时监控任务执行状态
- 实时性能指标：展示实时性能指标

**使用场景**：
1. 创建加速卡评测任务
2. 监控评测执行
3. 查看性能指标

#### 测试结果管理

**功能描述**：
提供加速卡评测结果的查看、分析和对比功能。

**主要特性**：
- 网格化卡片布局：6个KPI指标卡片 + 3个综合评估维度仪表盘
- KPI指标卡片：
  - 吞吐量（MB/s）
  - 温度（°C）
  - 功耗（kW）
  - 延迟（ms）
  - 帧率（fps）
  - 带宽（GB/s）
- 状态标识：正常（绿色）、接近阈值（橙色）、超标警告（红色）、中性提示（蓝色）、特殊模式（紫色）
- 综合评估维度仪表盘：
  - 功能性（蓝色）：基础功能支持度、高级功能支持度
  - 兼容性（橙色）：平台兼容性、驱动兼容性、软件兼容性
  - 可靠性（绿色）：稳定性评分、故障率、MTBF
- 加速卡排行榜：表格形式展示加速卡排名
- 性能趋势分析：显示性能趋势迷你图

**使用场景**：
1. 查看加速卡性能指标
2. 分析综合评估结果
3. 查看加速卡排名
4. 监控性能趋势

#### 对比分析

**功能描述**：
提供多加速卡对比分析和结果管理功能。

**主要特性**：
- 加速卡对比创建：弹窗形式选择加速卡创建对比
- 对比详情查看：三个标签页（概览、详细对比、优势分析）
- 性能指标对比：表格形式展示性能指标对比
- 热力图可视化：展示性能热力图
- 优势分析：显示每个加速卡的优势、劣势、推荐场景

**使用场景**：
1. 创建加速卡对比
2. 查看对比详情
3. 分析性能差异
4. 选择最佳硬件

### 数据集管理模块

#### 大模型评测数据集

**功能描述**：
提供大模型评测数据集的查看、管理和详情展示功能。

**主要特性**：
- 数据集列表：表格形式展示所有数据集
- 分类筛选：支持按分类筛选
- 搜索功能：支持按名称搜索
- 数据集详情：弹窗形式展示数据集详细信息
- 数据集统计：显示数据集统计信息
- 数据集使用情况：显示数据集使用情况

**使用场景**：
1. 查看可用数据集
2. 选择评测数据集
3. 查看数据集详情
4. 管理数据集

#### 硬件性能评测数据集

**功能描述**：
提供硬件性能评测数据集的查看、管理和详情展示功能。

**主要特性**：
- 数据集列表：表格形式展示所有数据集
- 分类筛选：支持按分类筛选
- 搜索功能：支持按名称搜索
- 数据集详情：弹窗形式展示数据集详细信息
- 数据集统计：显示数据集统计信息
- 数据集使用情况：显示数据集使用情况

**使用场景**：
1. 查看可用数据集
2. 选择评测数据集
3. 查看数据集详情
4. 管理数据集

---

## 项目结构

```
src/
├── components/              # 可复用组件
│   ├── Accelerator/         # 加速卡相关组件
│   │   ├── AcceleratorComparisonDetailModal.tsx
│   │   ├── AcceleratorComparisonManagement.tsx
│   │   ├── AcceleratorLeaderboard.tsx
│   │   ├── AcceleratorLifecycleManager.tsx
│   │   ├── AcceleratorReportModal.tsx
│   │   ├── CreateAcceleratorComparisonModal.tsx
│   │   ├── GaugeCard.tsx
│   │   └── KPICard.tsx
│   ├── ConfigEditor/        # 配置编辑器组件
│   ├── Diagnostic/          # 诊断组件
│   ├── Drawer/              # 抽屉组件
│   ├── Editor/              # 编辑器组件
│   ├── Nodes/               # 节点组件
│   ├── Sidebar/             # 侧边栏组件
│   ├── Task/                # 任务相关组件
│   ├── TaskList/            # 任务列表组件
│   └── TestResult/          # 测试结果组件
│       ├── ComparisonArena.tsx
│       ├── ComparisonDetailModal.tsx
│       ├── ComparisonManagement.tsx
│       ├── CreateComparisonModal.tsx
│       ├── ModelReportModal.tsx
│       ├── RetestModal.tsx
│       ├── SmartLeaderboard.tsx
│       ├── TestLifecycleManager.tsx
│       └── TestReportModal.tsx
├── pages/                   # 页面组件
│   ├── Assets/              # 资产页面
│   ├── DatasetManagement/   # 数据集管理页面
│   ├── Platforms/           # 平台页面
│   ├── AcceleratorTaskCenter.tsx
│   ├── AcceleratorTestResultManagement.tsx
│   ├── ComparisonManagementPage.tsx
│   ├── Dashboard.tsx
│   ├── LLMTaskCenter.tsx
│   ├── OrchestrationCenter.tsx
│   ├── TaskCenter.tsx
│   ├── TaskCockpit.tsx
│   ├── TaskDetailPage.tsx
│   ├── TaskListPage.tsx
│   └── TestResultManagement.tsx
├── store/                   # 状态管理
│   ├── appStore.ts
│   ├── configStore.ts
│   ├── orchestratorStore.ts
│   ├── taskListStore.ts
│   └── taskStreamStore.ts
├── mockData/                # 模拟数据
│   ├── acceleratorMock.ts
│   ├── assetsMock.ts
│   ├── comparisonResultMock.ts
│   ├── datasetMock.ts
│   ├── performanceMock.ts
│   ├── schedulerSimulator.ts
│   ├── templates.ts
│   ├── testResultMock.ts
│   ├── websocketMock.ts
│   └── workflowTemplates.ts
├── types/                   # 类型定义
│   ├── config.ts
│   ├── dataset.ts
│   ├── index.ts
│   └── workflow.ts
├── services/                # 业务逻辑
│   ├── assetTaskLinker.ts
│   └── workflowExecutor.ts
├── utils/                   # 工具函数
│   ├── schema.ts
│   ├── transformers.ts
│   └── validator.ts
├── hooks/                   # 自定义 Hooks
│   └── useNavigate.ts
├── App.tsx                  # 主应用组件
├── App.css                  # 全局样式
├── main.tsx                 # 应用入口
├── theme.ts                 # 主题配置
└── mockData.ts              # 模拟数据
```

---

## 开发指南

### 代码规范

#### 命名规范

```typescript
// 组件命名：PascalCase
const SmartLeaderboard: React.FC = () => {};

// 函数命名：camelCase
const handleTaskClick = () => {};

// 常量命名：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 类型命名：PascalCase
interface TestModel {}

// 接口命名：PascalCase
interface ComparisonResult {}
```

#### 组件结构

```typescript
// 1. 导入语句
import React, { useState } from 'react';
import { Button } from 'antd';

// 2. 类型定义
interface ComponentProps {
  prop1: string;
  prop2: number;
}

// 3. 常量定义
const CONSTANT_VALUE = 100;

// 4. 组件定义
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 状态定义
  const [state, setState] = useState('');

  // 副作用
  useEffect(() => {}, []);

  // 事件处理
  const handleClick = () => {};

  // 渲染
  return <div>{/* JSX */}</div>;
};

// 5. 导出语句
export default Component;
```

### 状态管理

#### 使用 Zustand

```typescript
// 定义 Store
import { create } from 'zustand';

interface AppState {
  // 状态
  tasks: Task[];
  selectedTask: Task | null;

  // 操作
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  tasks: [],
  selectedTask: null,

  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (selectedTask) => set({ selectedTask }),
}));

// 使用 Store
const { tasks, setTasks } = useAppStore();
```

### 性能优化

#### 使用 useMemo

```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);
```

#### 使用 useCallback

```typescript
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### 样式规范

#### 使用 Ant Design 主题

```typescript
import { ConfigProvider, theme } from 'antd';

const appTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#1f1f1f',
  },
};

<ConfigProvider theme={appTheme}>
  <App />
</ConfigProvider>
```

#### 内联样式

```typescript
const style = {
  background: '#1f1f1f',
  padding: '16px',
  borderRadius: 8,
};

<div style={style}>{/* 内容 */}</div>
```

### 图表使用

#### ECharts

```typescript
import * as echarts from 'echarts';

const chartRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (chartRef.current) {
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      // 配置项
    });
    return () => chart.dispose();
  }
}, []);
```

---

## 贡献指南

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
test: 测试相关
chore: 构建/工具相关
```

### 代码审查

- 确保代码通过 ESLint 检查
- 确保代码通过 TypeScript 类型检查
- 确保代码符合项目规范
- 确保代码有适当的注释

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- 项目主页：[GitHub Repository](https://github.com/yourusername/ai-benchmark)
- 问题反馈：[Issues](https://github.com/yourusername/ai-benchmark/issues)
- 邮箱：your.email@example.com

---

## 致谢

感谢所有为本项目做出贡献的开发者！

---

## 更新日志

### v1.0.0 (2024-03-23)

#### 新增功能
- ✨ 大模型测评模块
  - 任务中心
  - 测试结果管理
  - 对比分析
- ✨ 加速卡测评模块
  - 任务中心
  - 测试结果管理
  - 对比分析
- ✨ 数据集管理模块
  - 大模型评测数据集
  - 硬件性能评测数据集

#### 技术栈
- React 19.2.4
- TypeScript 5.9.3
- Ant Design 6.3.2
- Zustand 5.0.11
- ECharts 6.0.0

#### 优化
- 🎨 深色主题设计
- 🚀 性能优化
- 📱 响应式布局
- ♿ 可访问性支持

---

**Made with ❤️ by AI Benchmark Team**
