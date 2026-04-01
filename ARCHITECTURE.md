# AI Benchmark 平台项目架构文档

## 项目概述

本项目是一个基于 React + TypeScript 的 AI 模型和加速卡评测管理平台，提供大模型测评、加速卡测评、数据集管理、工作流编排等核心功能。

### 技术栈

**前端技术栈**
- **框架**: React 19.2.4 + TypeScript 5.9.3
- **构建工具**: Vite 8.0.0
- **UI 组件库**: Ant Design 6.3.2
- **状态管理**: Zustand 5.0.11
- **工作流编辑器**: React Flow 11.11.4 + @xyflow/react 12.10.1
- **数据可视化**: ECharts 6.0.0
- **代码编辑器**: Monaco Editor 4.7.0
- **HTTP 客户端**: Axios 1.13.6
- **工具库**: Lodash 4.17.23

---

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     前端应用 (React + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   页面层     │  │   组件层     │  │  状态层  │ │
│  │  (Pages)     │  │(Components)   │  │ (Store)  │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
│                    ┌──────────────────────┐          │
│                    │     服务层         │          │
│                    │   (Services)       │          │
│                    └──────────────────────┘          │
│                            │                             │
│                    ┌──────────────────────┐          │
│                    │     工具层         │          │
│                    │    (Utils)         │          │
│                    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     后端服务 (REST API)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  任务管理     │  │  数据管理     │  │ 评测引擎  │ │
│  │  Service     │  │  Service      │  │  Engine   │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
│                    ┌──────────────────────┐          │
│                    │   数据持久化层      │          │
│                    │  (Database)        │          │
│                    └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 前端架构

### 1. 目录结构

```
src/
├── components/           # 可复用组件
│   ├── Accelerator/      # 加速卡相关组件
│   │   ├── AcceleratorLeaderboard.tsx          # 加速卡排行榜
│   │   ├── AcceleratorComparisonManagement.tsx  # 加速卡对比管理
│   │   ├── AcceleratorComparisonDetailModal.tsx # 加速卡对比详情
│   │   ├── AcceleratorLifecycleManager.tsx     # 加速卡生命周期管理
│   │   ├── CreateAcceleratorComparisonModal.tsx # 创建加速卡对比
│   │   ├── GaugeCard.tsx                     # 仪表盘卡片
│   │   └── KPICard.tsx                        # 关键指标卡片
│   │
│   ├── TestResult/       # 测试结果相关组件
│   │   ├── SmartLeaderboard.tsx              # 模型智能排行榜
│   │   ├── ComparisonArena.tsx              # 对比竞技场
│   │   ├── ComparisonDetailModal.tsx        # 对比详情弹窗
│   │   ├── ComparisonManagement.tsx         # 对比管理
│   │   ├── CreateComparisonModal.tsx        # 创建对比
│   │   ├── TestReportModal.tsx             # 测试报告弹窗
│   │   ├── TestLifecycleManager.tsx         # 测试生命周期管理
│   │   └── ModelReportModal.tsx            # 模型报告弹窗
│   │
│   ├── Task/            # 任务配置相关组件
│   │   ├── LLMEvaluationConfig.tsx         # 大模型评测配置
│   │   ├── AcceleratorEvaluationConfig.tsx  # 加速卡评测配置
│   │   ├── ModelSelector.tsx               # 模型选择器
│   │   ├── AcceleratorSelector.tsx          # 加速卡选择器
│   │   ├── OfflineTestSelector.tsx          # 离线测试选择器
│   │   ├── TaskConfigurator.tsx            # 任务配置器
│   │   ├── CapabilityModule.tsx             # 能力模块
│   │   ├── ResourceEstimator.tsx            # 资源估算器
│   │   ├── RuntimeFlow.tsx                # 运行时流程
│   │   ├── MetricsPanel.tsx                # 指标面板
│   │   └── LiveLogViewer.tsx              # 实时日志查看器
│   │
│   ├── ConfigEditor/    # 配置编辑器组件
│   │   ├── ConfigPage.tsx                   # 配置页面
│   │   ├── TemplateSidebar.tsx              # 模板侧边栏
│   │   └── CodeEditor.tsx                 # 代码编辑器
│   │
│   ├── WorkflowEditor/  # 工作流编辑器
│   │   └── WorkflowEditor.tsx              # 工作流编辑器
│   │
│   ├── Drawer/          # 抽屉组件
│   │   └── NodeConfigDrawer.tsx             # 节点配置抽屉
│   │
│   ├── Nodes/           # 节点组件
│   │   └── CustomNode.tsx                   # 自定义节点
│   │
│   └── Sidebar/         # 侧边栏组件
│       └── ResourcePanel.tsx                # 资源面板
│
├── pages/               # 页面组件
│   ├── LLMTaskCenter.tsx                 # 大模型任务中心
│   ├── AcceleratorTaskCenter.tsx            # 加速卡任务中心
│   ├── TaskCockpit.tsx                   # 任务驾驶舱
│   ├── TaskDetailPage.tsx                 # 任务详情页
│   ├── TestResultManagement.tsx             # 测试结果管理
│   ├── AcceleratorTestResultManagement.tsx   # 加速卡测试结果管理
│   ├── ComparisonManagementPage.tsx         # 对比管理页面
│   ├── DatasetManagement/                 # 数据集管理
│   │   ├── index.tsx                     # 数据集管理主页
│   │   └── DatasetDetailDashboard.tsx     # 数据集详情仪表盘
│   ├── Platforms/                         # 平台页面
│   │   ├── LLMPlatform.tsx                # 大模型平台
│   │   └── AcceleratorPlatform.tsx         # 加速卡平台
│   ├── Assets/                            # 资产管理
│   │   ├── Layout.tsx                     # 资产布局
│   │   ├── Models/                        # 模型资产
│   │   │   └── ModelDashboard.tsx         # 模型仪表盘
│   │   ├── Accelerators/                   # 加速卡资产
│   │   │   └── HardwareProfile.tsx        # 硬件配置
│   │   └── Datasets/                     # 数据集资产
│   │       └── DataManager.tsx            # 数据管理器
│   ├── Dashboard.tsx                      # 仪表盘
│   ├── OrchestrationCenter.tsx             # 编排中心
│   └── TaskListPage.tsx                   # 任务列表页
│
├── store/               # 状态管理 (Zustand)
│   ├── appStore.ts                       # 应用全局状态
│   ├── configStore.ts                    # 配置状态
│   ├── orchestratorStore.ts               # 编排器状态
│   ├── taskListStore.ts                  # 任务列表状态
│   └── taskStreamStore.ts                # 任务流状态
│
├── services/            # 服务层
│   ├── workflowExecutor.ts                # 工作流执行器
│   └── assetTaskLinker.ts                # 资产任务关联器
│
├── mockData/            # 模拟数据
│   ├── testResultMock.ts                 # 测试结果模拟数据
│   ├── acceleratorMock.ts                # 加速卡模拟数据
│   ├── comparisonResultMock.ts            # 对比结果模拟数据
│   ├── datasetMock.ts                   # 数据集模拟数据
│   ├── performanceMock.ts                # 性能模拟数据
│   ├── workflowTemplates.ts              # 工作流模板
│   ├── templates.ts                    # 配置模板
│   └── websocketMock.ts                # WebSocket 模拟数据
│
├── types/               # 类型定义
│   ├── index.ts                          # 通用类型
│   ├── config.ts                         # 配置类型
│   ├── dataset.ts                        # 数据集类型
│   └── workflow.ts                       # 工作流类型
│
├── utils/               # 工具函数
│   ├── schema.ts                         # Schema 验证
│   ├── transformers.ts                   # 数据转换
│   └── validator.ts                      # 数据验证
│
├── hooks/               # 自定义 Hooks
│   └── useNavigate.ts                    # 导航 Hook
│
├── App.tsx              # 应用根组件
├── main.tsx             # 应用入口
├── theme.ts             # 主题配置
└── index.css            # 全局样式
```

### 2. 核心模块说明

#### 2.1 页面层 (Pages)

**大模型测评模块**
- **LLMTaskCenter**: 大模型任务中心，管理大模型评测任务
- **TestResultManagement**: 测试结果管理，展示模型测试结果和排行榜
- **ComparisonManagementPage**: 对比分析页面，支持多模型对比

**加速卡测评模块**
- **AcceleratorTaskCenter**: 加速卡任务中心，管理加速卡评测任务
- **AcceleratorTestResultManagement**: 加速卡测试结果管理，展示加速卡性能数据

**工作流编排模块**
- **OrchestrationCenter**: 工作流编排中心，支持可视化工作流编辑
- **WorkflowEditor**: 工作流编辑器，基于 React Flow 实现

**数据集管理模块**
- **DatasetManagement**: 数据集管理，支持大模型和硬件评测数据集管理

**资产管理模块**
- **ModelDashboard**: 模型资产管理仪表盘
- **HardwareProfile**: 加速卡硬件配置管理
- **DataManager**: 数据集资产管理

#### 2.2 组件层 (Components)

**评测配置组件**
- **LLMEvaluationConfig**: 大模型评测配置，支持能力维度选择、测试项配置
- **AcceleratorEvaluationConfig**: 加速卡评测配置，支持性能测试、功耗测试等
- **TaskConfigurator**: 通用任务配置器，支持自定义测试参数
- **CapabilityModule**: 能力模块配置，支持多维度能力测试
- **ResourceEstimator**: 资源估算器，智能推荐 GPU 数量和内存配置

**测试结果展示组件**
- **SmartLeaderboard**: 智能排行榜，展示模型/加速卡排名和趋势
- **ComparisonArena**: 对比竞技场，可视化多模型/加速卡对比
- **ComparisonDetailModal**: 对比详情弹窗，展示详细对比数据
- **TestReportModal**: 测试报告弹窗，展示完整测试报告
- **ModelReportModal**: 模型报告弹窗，展示模型详细信息
- **GaugeCard**: 仪表盘卡片，展示综合得分
- **KPICard**: 关键指标卡片，展示性能指标

**工作流编辑组件**
- **WorkflowEditor**: 基于 React Flow 的工作流编辑器
- **CustomNode**: 自定义节点组件
- **NodeConfigDrawer**: 节点配置抽屉
- **TemplateSidebar**: 模板侧边栏
- **CodeEditor**: Monaco 代码编辑器

**监控和日志组件**
- **LiveLogViewer**: 实时日志查看器
- **MetricsPanel**: 指标面板，展示实时性能指标
- **RealTimeMonitor**: 实时监控组件
- **BottleneckFlameGraph**: 瓶颈火焰图，展示性能瓶颈

#### 2.3 状态管理 (Store)

**appStore** - 应用全局状态
```typescript
interface AppState {
  // 任务管理
  tasks: BenchmarkTask[];
  selectedTask: BenchmarkTask | null;
  addTask: (task) => void;
  updateTaskStatus: (taskId, status) => void;
  updateTaskPriority: (taskId, priority) => void;
  
  // 集群资源
  clusterStats: ClusterStats;
  setClusterStats: (stats) => void;
  
  // 工作流管理
  workflows: WorkflowDefinition[];
  executeWorkflow: (workflow, config?) => string | null;
  
  // 对比分析
  comparisonResults: ComparisonResult[];
  addComparisonResult: (result) => void;
  generateComparison: (taskIds) => ComparisonResult;
  
  // 性能分析
  flameGraphData: Map<string, FlameGraphNode>;
  performanceMetrics: Map<string, PerformanceMetrics[]>;
  getOptimizationRecommendations: (taskId) => OptimizationRecommendation[];
  
  // 资源估算
  estimateResources: (params) => ResourceEstimation;
  
  // 任务恢复
  resumeFromCheckpoint: (taskId, checkpointId) => void;
  retryFromScratch: (taskId) => void;
}
```

#### 2.4 服务层 (Services)

**workflowExecutor** - 工作流执行器
- 工作流验证和执行
- 节点依赖解析
- 执行状态跟踪
- 错误处理和重试

**assetTaskLinker** - 资产任务关联器
- 模型与任务关联
- 数据集与任务关联
- 加速卡与任务关联
- 数据血缘追踪

### 3. 数据流架构

```
用户操作
    │
    ▼
┌─────────────────┐
│   页面组件     │
│  (Pages)       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   组件交互     │
│(Components)     │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  状态更新       │
│  (Zustand)     │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  服务调用       │
│ (Services)      │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  API 请求      │
│  (Axios)       │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   后端服务     │
│  (REST API)    │
└─────────────────┘
```

### 4. 核心功能模块

#### 4.1 大模型测评
- **任务创建**: 支持选择模型、数据集、测试能力维度
- **任务执行**: 实时监控任务进度和日志
- **结果展示**: 多维度能力得分、雷达图、趋势分析
- **对比分析**: 支持多模型横向对比
- **报告生成**: 自动生成详细测试报告

#### 4.2 加速卡测评
- **性能测试**: 计算性能、内存性能、推理速度
- **功耗测试**: 能效分析、成本评估
- **稳定性测试**: 长时间运行稳定性
- **兼容性测试**: 多框架兼容性验证
- **精度测试**: 数值精度验证

#### 4.3 工作流编排
- **可视化编辑**: 拖拽式工作流设计
- **节点管理**: 支持模型、数据、资源、评估节点
- **依赖管理**: 自动解析节点依赖关系
- **模板系统**: 预置常用工作流模板
- **执行监控**: 实时跟踪工作流执行状态

#### 4.4 数据集管理
- **数据集上传**: 支持多种格式数据集
- **版本管理**: 数据集版本控制和回溯
- **元数据管理**: 数据集描述、标签、许可证
- **血缘追踪**: 数据集使用记录和影响分析

---

## 后端设计

### 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Nginx)                │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  任务服务    │ │  数据服务    │ │ 评测引擎    │
│  Service     │ │  Service     │ │  Engine     │
└─────────────┘ └─────────────┘ └─────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ PostgreSQL  │ │   Redis     │ │  MinIO      │
│  (主数据库)  │ │  (缓存)     │ │ (对象存储)  │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 2. 核心服务模块

#### 2.1 任务管理服务 (Task Service)
**职责**
- 任务创建、更新、删除
- 任务状态管理 (PENDING, RUNNING, SUCCESS, FAILED)
- 任务优先级调度
- 任务队列管理
- 检查点管理

**API 端点**
```
POST   /api/tasks                    # 创建任务
GET    /api/tasks                    # 获取任务列表
GET    /api/tasks/:id                # 获取任务详情
PUT    /api/tasks/:id/status         # 更新任务状态
PUT    /api/tasks/:id/priority      # 更新任务优先级
DELETE /api/tasks/:id                # 删除任务
POST   /api/tasks/:id/resume        # 从检查点恢复
POST   /api/tasks/:id/retry         # 从头重试
GET    /api/tasks/:id/logs          # 获取任务日志
GET    /api/tasks/:id/metrics       # 获取任务指标
```

#### 2.2 数据管理服务 (Data Service)
**职责**
- 模型管理 (注册、版本、元数据)
- 数据集管理 (上传、版本、标签)
- 加速卡管理 (规格、性能数据)
- 资产关联 (模型-数据集-加速卡)
- 数据血缘追踪

**API 端点**
```
# 模型管理
POST   /api/models                   # 注册模型
GET    /api/models                   # 获取模型列表
GET    /api/models/:id               # 获取模型详情
PUT    /api/models/:id               # 更新模型
DELETE /api/models/:id               # 删除模型

# 数据集管理
POST   /api/datasets                 # 上传数据集
GET    /api/datasets                 # 获取数据集列表
GET    /api/datasets/:id             # 获取数据集详情
PUT    /api/datasets/:id             # 更新数据集
DELETE /api/datasets/:id             # 删除数据集

# 加速卡管理
POST   /api/accelerators             # 注册加速卡
GET    /api/accelerators             # 获取加速卡列表
GET    /api/accelerators/:id         # 获取加速卡详情
PUT    /api/accelerators/:id         # 更新加速卡
DELETE /api/accelerators/:id         # 删除加速卡
```

#### 2.3 评测引擎服务 (Evaluation Engine)
**职责**
- 执行评测任务
- 调度计算
- 性能指标收集
- 报告生成
- 对比分析

**API 端点**
```
POST   /api/evaluations/llm         # 执行大模型评测
POST   /api/evaluations/accelerator  # 执行加速卡评测
GET    /api/evaluations/:id          # 获取评测结果
GET    /api/evaluations/:id/report   # 获取评测报告
POST   /api/comparisons             # 创建对比
GET    /api/comparisons/:id          # 获取对比结果
```

#### 2.4 工作流服务 (Workflow Service)
**职责**
- 工作流模板管理
- 工作流执行
- 节点依赖解析
- 执行状态跟踪

**API 端点**
```
POST   /api/workflows               # 创建工作流
GET    /api/workflows               # 获取工作流列表
GET    /api/workflows/:id           # 获取工作流详情
PUT    /api/workflows/:id           # 更新工作流
DELETE /api/workflows/:id           # 删除工作流
POST   /api/workflows/:id/execute   # 执行工作流
GET    /api/workflows/:id/status     # 获取执行状态
```

### 3. 数据库设计

#### 3.1 核心表结构

**tasks 表**
```sql
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'LLM' or 'ACCELERATOR'
  status VARCHAR(20) NOT NULL,  -- 'PENDING', 'RUNNING', 'SUCCESS', 'FAILED'
  priority VARCHAR(10) NOT NULL,  -- 'P0', 'P1', 'P2', 'P3'
  config JSONB,                -- 任务配置
  result JSONB,                -- 评测结果
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by VARCHAR(100),
  workflow_id VARCHAR(36),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at)
);
```

**models 表**
```sql
CREATE TABLE models (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(100),
  version VARCHAR(50),
  params VARCHAR(50),
  domain VARCHAR(50)[],
  capabilities VARCHAR(50)[],
  file_path VARCHAR(500),
  file_size BIGINT,
  hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  INDEX idx_organization (organization),
  INDEX idx_domain (domain)
);
```

**datasets 表**
```sql
CREATE TABLE datasets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- 'LLM' or 'HARDWARE'
  version VARCHAR(50),
  description TEXT,
  tags VARCHAR(100)[],
  license VARCHAR(100),
  file_path VARCHAR(500),
  file_size BIGINT,
  hash VARCHAR(64),
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(100),
  INDEX idx_category (category),
  INDEX idx_tags (tags)
);
```

**accelerators 表**
```sql
CREATE TABLE accelerators (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(100),
  model VARCHAR(100),
  specs JSONB,                -- 硬件规格
  performance_data JSONB,        -- 性能数据
  created_at TIMESTAMP NOT NULL,
  INDEX idx_vendor (vendor)
);
```

**evaluations 表**
```sql
CREATE TABLE evaluations (
  id VARCHAR(36) PRIMARY KEY,
  task_id VARCHAR(36) NOT NULL,
  scores JSONB,                -- 各维度得分
  metrics JSONB,               -- 性能指标
  report_path VARCHAR(500),       -- 报告文件路径
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

**comparisons 表**
```sql
CREATE TABLE comparisons (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  task_ids VARCHAR(36)[] NOT NULL,
  result JSONB,                -- 对比结果
  is_starred BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(100),
  created_at TIMESTAMP NOT NULL
);
```

**workflows 表**
```sql
CREATE TABLE workflows (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,   -- 工作流定义
  template_id VARCHAR(36),
  created_by VARCHAR(100),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);
```

#### 3.2 缓存策略

**Redis 缓存**
- **任务状态缓存**: 任务实时状态，TTL 5 分钟
- **排行榜缓存**: 模型/加速卡排行榜，TTL 10 分钟
- **评测结果缓存**: 评测结果数据，TTL 30 分钟
- **用户会话缓存**: 用户登录状态，TTL 24 小时

### 4. 消息队列

**任务队列**
- 使用 Redis List 实现任务队列
- 按优先级排序 (P0 > P1 > P2 > P3)
- 支持任务优先级调整
- 支持任务取消和重试

**事件队列**
- 任务状态变更事件
- 评测完成事件
- 报告生成事件
- 通知推送事件

### 5. 文件存储

**MinIO 对象存储**
- 模型文件存储: `/models/{model_id}/`
- 数据集文件存储: `/datasets/{dataset_id}/`
- 评测报告存储: `/reports/{task_id}/`
- 检查点存储: `/checkpoints/{task_id}/`
- 日志文件存储: `/logs/{task_id}/`

### 6. 监控和日志

**日志收集**
- 应用日志: 结构化日志 (JSON 格式)
- 访问日志: Nginx 访问日志
- 错误日志: 错误堆栈和上下文
- 性能日志: API 响应时间、数据库查询时间

**监控指标**
- 系统资源: CPU、内存、磁盘、网络
- 应用指标: 请求量、错误率、响应时间
- 业务指标: 任务完成率、平均执行时间、资源利用率

---

## 部署架构

### 开发环境
```
┌─────────────────────────────────────────┐
│         本地开发环境              │
│  (Vite Dev Server: localhost:5173) │
└─────────────────────────────────────────┘
```

### 生产环境
```
┌─────────────────────────────────────────┐
│           CDN (CloudFlare)          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Nginx (负载均衡)            │
└─────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ 前端-1  │ │ 前端-2  │ │ 前端-3  │
└─────────┘ └─────────┘ └─────────┘
        │         │         │
        └─────────┼─────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        后端服务集群               │
│  (Task Service + Data Service)      │
└─────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│PostgreSQL│ │  Redis   │ │  MinIO   │
└─────────┘ └─────────┘ └─────────┘
```

---

## 安全设计

### 认证和授权
- JWT Token 认证
- RBAC 权限控制 (角色: Admin, User, Viewer)
- API 请求签名验证
- 跨域资源共享 (CORS) 配置

### 数据安全
- 敏感数据加密存储
- 文件上传病毒扫描
- SQL 注入防护
- XSS 攻击防护

### 审计日志
- 用户操作日志
- 数据访问日志
- 系统变更日志
- 异常行为告警

---

## 性能优化

### 前端优化
- 组件懒加载 (React.lazy)
- 虚拟滚动 (react-window)
- 图片懒加载和压缩
- 代码分割和 Tree Shaking
- Service Worker 缓存

### 后端优化
- 数据库索引优化
- 查询结果缓存
- 连接池管理
- 异步任务处理
- CDN 加速静态资源

---

## 扩展性设计

### 水平扩展
- 无状态服务设计
- 数据库读写分离
- 缓存集群
- 消息队列集群

### 垂直扩展
- 微服务架构
- 服务独立部署
- 资源按需分配
- 自动扩缩容

---

## 总结

本平台采用现代化的前后端分离架构，前端使用 React + TypeScript + Zustand 实现响应式用户界面，后端采用微服务架构提供 RESTful API。通过合理的状态管理、服务分层、缓存策略和数据库设计，实现了高性能、高可用的 AI 评测管理平台。

**核心优势**
- 模块化设计，易于维护和扩展
- 类型安全，减少运行时错误
- 响应式状态管理，提升用户体验
- 完善的缓存策略，提高系统性能
- 灵活的工作流编排，支持复杂评测场景

**未来规划**
- 引入 GraphQL 提升数据查询效率
- 实现实时通信 (WebSocket)
- 支持 GPU 集群自动调度
- 引入 AI 辅助评测结果分析
