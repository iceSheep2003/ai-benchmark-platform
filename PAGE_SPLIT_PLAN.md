# 加速卡测评页面拆分方案

## 📋 现状分析

### 当前页面结构

```
加速卡测评
├── AcceleratorTestResultManagement（测试结果管理）
│   ├── 统计卡片（已测、测试中、待测、平均得分）
│   ├── AcceleratorLeaderboard（加速卡排行榜）
│   ├── AcceleratorLifecycleManager（生命周期管理）
│   └── 对比功能（Drawer）
│
├── AcceleratorTaskCenter（任务中心）
│   └── 任务管理相关功能
│
└── AcceleratorComparisonPage（对比分析）
    └── AcceleratorComparisonManagement（对比管理）
```

### 存在的问题

1. **功能耦合度高**：测试结果管理页面包含了加速卡列表、测试任务、对比功能
2. **页面职责不清**：一个页面承担了多个不同的业务功能
3. **不利于扩展**：新增功能时需要修改现有页面
4. **不利于维护**：代码量大，逻辑复杂

---

## 🎯 拆分方案

### 拆分后的页面结构

```
加速卡测评
├── 1. 加速卡管理（AcceleratorManagement）
│   ├── 加速卡列表（使用 AcceleratorLeaderboard）
│   ├── 创建加速卡
│   ├── 更新加速卡
│   ├── 删除加速卡
│   └── 查看详情 → 跳转到加速卡详情页
│
├── 2. 加速卡详情（AcceleratorDetailPage）
│   ├── 基本信息
│   ├── 性能指标
│   ├── 测试历史
│   ├── 性能趋势
│   └── 创建测试任务
│
├── 3. 任务中心（AcceleratorTaskCenter）
│   ├── 任务列表
│   ├── 创建任务
│   └── 查看详情 → 跳转到任务详情页
│
├── 4. 测试任务详情（AcceleratorTestDetailPage）
│   ├── 任务信息
│   ├── 实时监控
│   ├── 性能指标
│   ├── 执行日志
│   └── WebSocket 实时更新
│
├── 5. 测试结果管理（AcceleratorTestResultManagement）
│   ├── 统计卡片
│   ├── 测试结果列表
│   ├── 性能排名
│   └── 创建对比 → 跳转到对比详情页
│
├── 6. 对比分析（AcceleratorComparisonPage）
│   ├── 对比列表（使用 AcceleratorComparisonManagement）
│   ├── 创建对比
│   └── 查看详情 → 跳转到对比详情页
│
└── 7. 对比分析详情（AcceleratorComparisonDetailPage）
    ├── 对比信息
    ├── 性能图表
    ├── 详细对比
    └── 推荐建议
```

---

## 📊 详细拆分说明

### 1. 加速卡管理页面（AcceleratorManagement）

**来源：** 从 AcceleratorTestResultManagement 中拆分

**包含功能：**
- ✅ 加速卡列表（使用 AcceleratorLeaderboard 组件）
- ✅ 创建加速卡（新增功能）
- ✅ 更新加速卡（新增功能）
- ✅ 删除加速卡（新增功能）
- ✅ 搜索、筛选、排序

**API 接口：**
- `GET /api/v1/accelerators` - 获取加速卡列表
- `POST /api/v1/accelerators` - 创建加速卡
- `PUT /api/v1/accelerators/{id}` - 更新加速卡
- `DELETE /api/v1/accelerators/{id}` - 删除加速卡

**路由：** `accelerator-management`

---

### 2. 加速卡详情页面（AcceleratorDetailPage）

**来源：** 新增页面

**包含功能：**
- ✅ 加速卡基本信息
- ✅ 性能指标展示
- ✅ 详细规格参数
- ✅ 测试历史记录
- ✅ 性能趋势图表
- ✅ 创建测试任务

**API 接口：**
- `GET /api/v1/accelerators/{id}` - 获取加速卡详情
- `GET /api/v1/accelerators/{id}/tests` - 获取测试历史
- `GET /api/v1/accelerators/{id}/metrics/trend` - 获取性能趋势
- `POST /api/v1/accelerators/{id}/tests` - 创建测试任务

**路由：** `accelerator-detail`

---

### 3. 任务中心（AcceleratorTaskCenter）

**来源：** 保持现有页面

**包含功能：**
- ✅ 任务列表
- ✅ 创建任务
- ✅ 任务状态管理
- ✅ 查看任务详情

**API 接口：**
- `GET /api/v1/accelerators/{id}/tests` - 获取任务列表
- `POST /api/v1/accelerators/{id}/tests` - 创建任务
- `PATCH /api/v1/tests/{id}/status` - 更新任务状态
- `POST /api/v1/tests/{id}/cancel` - 取消任务

**路由：** `accelerator-tasks`

---

### 4. 测试任务详情页面（AcceleratorTestDetailPage）

**来源：** 新增页面

**包含功能：**
- ✅ 任务基本信息
- ✅ 测试配置参数
- ✅ 资源使用情况
- ✅ 实时性能监控
- ✅ 测试结果展示
- ✅ 执行日志
- ✅ WebSocket 实时更新

**API 接口：**
- `GET /api/v1/tests/{id}` - 获取任务详情
- `GET /api/v1/tests/{id}/metrics` - 获取性能指标
- `WS /ws/tests/{id}` - WebSocket 实时监控

**路由：** `accelerator-test-detail`

---

### 5. 测试结果管理页面（AcceleratorTestResultManagement）

**来源：** 简化现有页面

**包含功能：**
- ✅ 统计卡片（已测、测试中、待测、平均得分）
- ✅ 测试结果列表
- ✅ 性能排名
- ✅ 创建对比分析

**移除功能：**
- ❌ 加速卡列表（移至加速卡管理页面）
- ❌ 生命周期管理（移至任务中心）
- ❌ 对比功能 Drawer（移至对比分析页面）

**API 接口：**
- `GET /api/v1/accelerators?status=tested` - 获取已测加速卡
- `GET /api/v1/tests` - 获取测试结果

**路由：** `accelerator-test-result`

---

### 6. 对比分析页面（AcceleratorComparisonPage）

**来源：** 保持现有页面

**包含功能：**
- ✅ 对比列表（使用 AcceleratorComparisonManagement 组件）
- ✅ 创建对比
- ✅ 收藏、删除、分享

**API 接口：**
- `GET /api/v1/comparisons` - 获取对比列表
- `POST /api/v1/comparisons` - 创建对比
- `POST /api/v1/comparisons/{id}/star` - 收藏对比
- `DELETE /api/v1/comparisons/{id}` - 删除对比

**路由：** `accelerator-comparison`

---

### 7. 对比分析详情页面（AcceleratorComparisonDetailPage）

**来源：** 从 AcceleratorComparisonDetailModal 拆分为独立页面

**包含功能：**
- ✅ 对比基本信息
- ✅ 参与加速卡列表
- ✅ 多维度性能对比图表
- ✅ 详细对比表格
- ✅ 对比结果总结
- ✅ 推荐建议
- ✅ 导出报告

**API 接口：**
- `GET /api/v1/comparisons/{id}` - 获取对比详情

**路由：** `accelerator-comparison-detail`

---

## 🔄 页面跳转关系

```
加速卡管理
  ↓ 点击加速卡
加速卡详情
  ↓ 创建测试任务
任务中心
  ↓ 点击任务
测试任务详情
  
测试结果管理
  ↓ 创建对比
对比分析
  ↓ 点击对比
对比分析详情
```

---

## 📝 实施步骤

### 第一阶段：创建新页面（不破坏现有功能）

1. ✅ 创建加速卡管理页面
2. ✅ 创建加速卡详情页面
3. ✅ 创建测试任务详情页面
4. ✅ 创建对比分析详情页面

### 第二阶段：修改路由配置

1. ✅ 在 App.tsx 中添加新路由
2. ✅ 在菜单中添加新菜单项
3. ✅ 更新页面标题映射

### 第三阶段：迁移功能

1. ✅ 将加速卡列表功能迁移到加速卡管理页面
2. ✅ 将对比详情 Modal 改造为独立页面
3. ✅ 简化测试结果管理页面

### 第四阶段：集成 API

1. ✅ 使用已创建的 API 服务
2. ✅ 使用已创建的 Hooks
3. ✅ 添加错误处理和加载状态

### 第五阶段：测试和优化

1. ✅ 测试页面跳转
2. ✅ 测试 API 调用
3. ✅ 优化用户体验

---

## 🎨 UI/UX 改进建议

### 1. 统一页面布局

所有页面采用统一的布局结构：

```tsx
<Layout>
  <Card title="页面标题" extra={<操作按钮 />}>
    <统计卡片 />
    <主要内容 />
  </Card>
</Layout>
```

### 2. 面包屑导航

添加面包屑导航，方便用户了解当前位置：

```
加速卡测评 > 加速卡管理 > 加速卡详情
```

### 3. 返回按钮

详情页面添加返回按钮：

```tsx
<Button icon={<ArrowLeftOutlined />} onClick={() => history.back()}>
  返回
</Button>
```

### 4. 加载状态

所有页面添加加载状态：

```tsx
if (loading) {
  return <Spin tip="加载中..." />;
}
```

### 5. 错误处理

所有页面添加错误处理：

```tsx
if (error) {
  return <Alert message={error} type="error" />;
}
```

---

## 📊 数据流设计

### 使用 Zustand Store

```typescript
interface AcceleratorStore {
  // 当前选中的加速卡
  selectedAccelerator: Accelerator | null;
  setSelectedAccelerator: (accelerator: Accelerator | null) => void;
  
  // 当前选中的测试任务
  selectedTest: AcceleratorTest | null;
  setSelectedTest: (test: AcceleratorTest | null) => void;
  
  // 当前选中的对比
  selectedComparison: Comparison | null;
  setSelectedComparison: (comparison: Comparison | null) => void;
}
```

### 页面间数据传递

1. **通过 URL 参数**：`/accelerator-detail?id=xxx`
2. **通过 Store**：使用 Zustand 管理全局状态
3. **通过 Props**：父组件传递数据给子组件

---

## ✅ 预期收益

### 1. 代码可维护性提升

- 每个页面职责单一
- 代码量减少
- 易于理解和修改

### 2. 用户体验提升

- 页面加载更快
- 功能更清晰
- 导航更直观

### 3. 开发效率提升

- 新功能开发更容易
- Bug 修复更快速
- 测试更简单

### 4. 可扩展性提升

- 易于添加新功能
- 易于集成新 API
- 易于优化性能

---

## 🚀 下一步行动

请确认是否同意此拆分方案，我将开始实施：

1. 创建新的页面文件
2. 修改路由配置
3. 迁移现有功能
4. 集成 API 服务
5. 测试和优化
