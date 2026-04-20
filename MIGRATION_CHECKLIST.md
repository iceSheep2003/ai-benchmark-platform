# Mock 数据迁移检查清单

## 一、后端开发检查清单

### 阶段 0：准备工作（1-2 天）

#### 环境搭建
- [ ] 安装 Python 3.10+
- [ ] 安装 PostgreSQL 15+
- [ ] 安装 Redis
- [ ] 创建数据库
- [ ] 创建数据库用户
- [ ] 配置环境变量

#### 项目初始化
- [ ] 创建后端项目目录
- [ ] 创建虚拟环境
- [ ] 安装依赖（FastAPI, SQLAlchemy 等）
- [ ] 创建项目结构
- [ ] 配置 CORS

### 阶段 1：核心功能实现（5-7 天）

#### 数据库设计
- [ ] 创建数据库模型（Model, Accelerator, Comparison）
- [ ] 配置 Alembic 迁移
- [ ] 创建数据库表
- [ ] 添加索引
- [ ] 测试数据库连接

#### 大模型 API
- [ ] 创建 Pydantic schemas
- [ ] 实现模型服务层
  - [ ] get_models（列表查询）
  - [ ] get_model_by_id（详情查询）
  - [ ] create_model（创建）
  - [ ] update_model（更新）
  - [ ] delete_model（删除）
- [ ] 实现 API 端点
- [ ] 添加分页支持
- [ ] 添加搜索和筛选
- [ ] 编写单元测试

#### 加速卡 API
- [ ] 创建加速卡模型
- [ ] 创建加速卡 schemas
- [ ] 实现加速卡服务层
- [ ] 实现 API 端点
- [ ] 编写单元测试

#### 对比分析 API
- [ ] 创建对比模型
- [ ] 创建对比 schemas
- [ ] 实现对比服务层
- [ ] 实现 API 端点
- [ ] 实现收藏功能
- [ ] 编写单元测试

### 阶段 2：前端集成（3-5 天）

#### API 客户端配置
- [ ] 创建 apiClient.ts
- [ ] 配置请求拦截器
- [ ] 配置响应拦截器
- [ ] 添加错误处理
- [ ] 配置环境变量

#### 大模型组件迁移
- [ ] 创建 modelService.ts
- [ ] 创建 dataStore（Zustand）
- [ ] 迁移 SmartLeaderboard
  - [ ] 移除 mock 数据导入
  - [ ] 添加 API 调用
  - [ ] 添加加载状态
  - [ ] 添加错误处理
  - [ ] 测试功能
- [ ] 迁移 TestLifecycleManager
- [ ] 迁移 TestReportModal
- [ ] 迁移 ModelReportModal
- [ ] 测试所有大模型功能

#### 加速卡组件迁移
- [ ] 创建 acceleratorService.ts
- [ ] 迁移 AcceleratorLeaderboard
- [ ] 迁移 AcceleratorLifecycleManager
- [ ] 迁移 AcceleratorReportModal
- [ ] 测试所有加速卡功能

#### 对比分析组件迁移
- [ ] 创建 comparisonService.ts
- [ ] 迁移 ComparisonManagement
- [ ] 迁移 ComparisonDetailModal
- [ ] 迁移 CreateComparisonModal
- [ ] 迁移 AcceleratorComparisonManagement
- [ ] 测试所有对比功能

### 阶段 3：高级功能实现（3-5 天）

#### 认证系统
- [ ] 实现用户注册
- [ ] 实现用户登录
- [ ] 实现 JWT 认证
- [ ] 实现权限控制
- [ ] 前端集成认证
- [ ] 测试认证流程

#### WebSocket 实时通信
- [ ] 实现 WebSocket 服务端
- [ ] 实现 WebSocket 客户端
- [ ] 实现任务进度推送
- [ ] 实现系统监控
- [ ] 测试实时通信

#### 任务调度系统
- [ ] 配置 Celery
- [ ] 实现任务队列
- [ ] 实现任务调度
- [ ] 实现任务监控
- [ ] 测试任务调度

### 阶段 4：测试和优化（2-3 天）

#### 单元测试
- [ ] 编写模型 API 测试
- [ ] 编写加速卡 API 测试
- [ ] 编写对比 API 测试
- [ ] 编写服务层测试
- [ ] 编写数据库测试
- [ ] 测试覆盖率 > 80%

#### 集成测试
- [ ] 编写端到端测试
- [ ] 测试前后端集成
- [ ] 测试 WebSocket
- [ ] 测试认证流程
- [ ] 测试错误处理

#### 性能优化
- [ ] 数据库查询优化
- [ ] 添加索引
- [ ] API 响应优化
- [ ] 添加缓存
- [ ] 性能测试

### 阶段 5：部署和文档（2-3 天）

#### Docker 容器化
- [ ] 创建 Dockerfile
- [ ] 创建 docker-compose.yml
- [ ] 配置环境变量
- [ ] 测试容器化部署

#### API 文档
- [ ] 完善 Swagger 文档
- [ ] 添加 API 示例
- [ ] 编写错误码说明
- [ ] 编写使用指南

#### 部署上线
- [ ] 配置生产环境
- [ ] 部署到服务器
- [ ] 配置域名和 SSL
- [ ] 配置监控和日志
- [ ] 生产环境测试

## 二、Mock 数据迁移对照表

### 大模型相关

| Mock 数据文件 | 后端 API | 前端组件 | 状态 |
|--------------|---------|---------|------|
| testResultMock.ts | /api/v1/models | SmartLeaderboard | ⬜ 待迁移 |
| testResultMock.ts | /api/v1/models/:id | TestReportModal | ⬜ 待迁移 |
| testResultMock.ts | /api/v1/models/:id | ModelReportModal | ⬜ 待迁移 |
| testResultMock.ts | /api/v1/models | TestLifecycleManager | ⬜ 待迁移 |

### 加速卡相关

| Mock 数据文件 | 后端 API | 前端组件 | 状态 |
|--------------|---------|---------|------|
| acceleratorMock.ts | /api/v1/accelerators | AcceleratorLeaderboard | ⬜ 待迁移 |
| acceleratorMock.ts | /api/v1/accelerators/:id | AcceleratorReportModal | ⬜ 待迁移 |
| acceleratorMock.ts | /api/v1/accelerators | AcceleratorLifecycleManager | ⬜ 待迁移 |

### 对比分析相关

| Mock 数据文件 | 后端 API | 前端组件 | 状态 |
|--------------|---------|---------|------|
| comparisonResultMock.ts | /api/v1/comparisons | ComparisonManagement | ⬜ 待迁移 |
| comparisonResultMock.ts | /api/v1/comparisons/:id | ComparisonDetailModal | ⬜ 待迁移 |
| acceleratorMock.ts | /api/v1/comparisons | AcceleratorComparisonManagement | ⬜ 待迁移 |

### 任务管理相关

| Mock 数据文件 | 后端 API | 前端组件 | 状态 |
|--------------|---------|---------|------|
| schedulerSimulator.ts | /api/v1/tasks | TaskCenter | ⬜ 待迁移 |
| websocketMock.ts | /ws/tasks/:id | TaskCockpit | ⬜ 待迁移 |
| performanceMock.ts | /api/v1/monitor | RealTimeMonitor | ⬜ 待迁移 |

### 数据集相关

| Mock 数据文件 | 后端 API | 前端组件 | 状态 |
|--------------|---------|---------|------|
| datasetMock.ts | /api/v1/datasets | DatasetManagement | ⬜ 待迁移 |
| assetsMock.ts | /api/v1/datasets | DataManager | ⬜ 待迁移 |

## 三、数据迁移脚本

### 3.1 从 Mock 数据导入到数据库

创建 `scripts/import_mock_data.py`：

```python
import sys
sys.path.append('..')

from app.core.database import SessionLocal
from app.models.model import Model
from app.models.accelerator import Accelerator
from app.models.comparison import Comparison
import json

# 导入 mock 数据
mock_models = [...]  # 从 testResultMock.ts 转换的 JSON
mock_accelerators = [...]  # 从 acceleratorMock.ts 转换的 JSON

def import_models():
    db = SessionLocal()
    try:
        for model_data in mock_models:
            model = Model(**model_data)
            db.add(model)
        db.commit()
        print(f"Imported {len(mock_models)} models")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

def import_accelerators():
    db = SessionLocal()
    try:
        for acc_data in mock_accelerators:
            accelerator = Accelerator(**acc_data)
            db.add(accelerator)
        db.commit()
        print(f"Imported {len(mock_accelerators)} accelerators")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_models()
    import_accelerators()
```

### 3.2 数据验证脚本

创建 `scripts/verify_data.py`：

```python
from app.core.database import SessionLocal
from app.models.model import Model
from app.models.accelerator import Accelerator

def verify_data():
    db = SessionLocal()
    try:
        # 验证模型数据
        models = db.query(Model).all()
        print(f"Total models: {len(models)}")
        
        # 验证加速卡数据
        accelerators = db.query(Accelerator).all()
        print(f"Total accelerators: {len(accelerators)}")
        
        # 验证数据完整性
        for model in models:
            if not model.name or not model.status:
                print(f"Invalid model: {model.id}")
        
        print("Data verification completed")
    finally:
        db.close()

if __name__ == "__main__":
    verify_data()
```

## 四、测试用例清单

### 4.1 API 测试

#### 大模型 API 测试
- [ ] GET /api/v1/models - 获取模型列表
- [ ] GET /api/v1/models?page=2&pageSize=20 - 分页测试
- [ ] GET /api/v1/models?status=tested - 状态筛选
- [ ] GET /api/v1/models?search=GPT - 搜索测试
- [ ] GET /api/v1/models/:id - 获取模型详情
- [ ] POST /api/v1/models - 创建模型
- [ ] PUT /api/v1/models/:id - 更新模型
- [ ] DELETE /api/v1/models/:id - 删除模型

#### 加速卡 API 测试
- [ ] GET /api/v1/accelerators - 获取加速卡列表
- [ ] GET /api/v1/accelerators/:id - 获取加速卡详情
- [ ] POST /api/v1/accelerators - 创建加速卡
- [ ] PUT /api/v1/accelerators/:id - 更新加速卡
- [ ] DELETE /api/v1/accelerators/:id - 删除加速卡

#### 对比分析 API 测试
- [ ] GET /api/v1/comparisons - 获取对比列表
- [ ] GET /api/v1/comparisons/:id - 获取对比详情
- [ ] POST /api/v1/comparisons - 创建对比
- [ ] PUT /api/v1/comparisons/:id - 更新对比
- [ ] DELETE /api/v1/comparisons/:id - 删除对比
- [ ] POST /api/v1/comparisons/:id/star - 收藏对比

### 4.2 前端集成测试

#### 大模型功能测试
- [ ] 模型列表加载
- [ ] 模型详情查看
- [ ] 模型搜索
- [ ] 模型筛选
- [ ] 模型分页
- [ ] 测试报告查看

#### 加速卡功能测试
- [ ] 加速卡列表加载
- [ ] 加速卡详情查看
- [ ] 加速卡搜索
- [ ] 加速卡筛选
- [ ] 测试报告查看

#### 对比分析功能测试
- [ ] 对比列表加载
- [ ] 创建对比
- [ ] 查看对比详情
- [ ] 收藏对比
- [ ] 删除对比

## 五、性能指标

### 5.1 API 性能指标

| API 端点 | 目标响应时间 | 实际响应时间 | 状态 |
|---------|------------|------------|------|
| GET /models | < 200ms | - | ⬜ 待测试 |
| GET /models/:id | < 100ms | - | ⬜ 待测试 |
| POST /models | < 300ms | - | ⬜ 待测试 |
| GET /accelerators | < 200ms | - | ⬜ 待测试 |
| GET /comparisons | < 200ms | - | ⬜ 待测试 |

### 5.2 数据库性能指标

| 查询类型 | 目标执行时间 | 实际执行时间 | 状态 |
|---------|------------|------------|------|
| 模型列表查询 | < 50ms | - | ⬜ 待测试 |
| 模型详情查询 | < 10ms | - | ⬜ 待测试 |
| 加速卡列表查询 | < 50ms | - | ⬜ 待测试 |
| 对比列表查询 | < 50ms | - | ⬜ 待测试 |

### 5.3 并发性能指标

| 指标 | 目标值 | 实际值 | 状态 |
|-----|-------|-------|------|
| 并发用户数 | 100 | - | ⬜ 待测试 |
| QPS | 1000 | - | ⬜ 待测试 |
| 错误率 | < 1% | - | ⬜ 待测试 |

## 六、部署检查清单

### 6.1 生产环境配置

- [ ] 配置生产数据库
- [ ] 配置生产 Redis
- [ ] 配置环境变量
- [ ] 配置 SSL 证书
- [ ] 配置域名
- [ ] 配置防火墙

### 6.2 监控和日志

- [ ] 配置应用监控
- [ ] 配置数据库监控
- [ ] 配置日志收集
- [ ] 配置告警规则

### 6.3 备份和恢复

- [ ] 配置数据库备份
- [ ] 配置文件备份
- [ ] 测试恢复流程

## 七、文档清单

### 7.1 技术文档

- [ ] API 文档（Swagger）
- [ ] 数据库设计文档
- [ ] 架构设计文档
- [ ] 部署文档

### 7.2 用户文档

- [ ] 用户手册
- [ ] 快速开始指南
- [ ] 常见问题解答

### 7.3 开发文档

- [ ] 开发环境搭建
- [ ] 代码规范
- [ ] 测试指南
- [ ] 发布流程

## 八、风险管理

### 8.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 | 状态 |
|-----|------|------|---------|------|
| 数据库性能问题 | 高 | 中 | 添加索引、查询优化 | ⬜ 待处理 |
| API 性能问题 | 高 | 中 | 缓存、异步处理 | ⬜ 待处理 |
| 并发问题 | 中 | 低 | 连接池、限流 | ⬜ 待处理 |

### 8.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 | 状态 |
|-----|------|------|---------|------|
| 数据迁移失败 | 高 | 低 | 备份、分批迁移 | ⬜ 待处理 |
| 功能缺失 | 高 | 中 | 逐步迁移、充分测试 | ⬜ 待处理 |
| 用户体验下降 | 中 | 中 | 保持功能一致性 | ⬜ 待处理 |

## 九、时间跟踪

### 9.1 实际进度

| 阶段 | 计划时间 | 实际时间 | 完成度 | 备注 |
|-----|---------|---------|-------|------|
| 阶段 0：准备 | 1-2 天 | - | 0% | - |
| 阶段 1：核心 | 5-7 天 | - | 0% | - |
| 阶段 2：集成 | 3-5 天 | - | 0% | - |
| 阶段 3：高级 | 3-5 天 | - | 0% | - |
| 阶段 4：测试 | 2-3 天 | - | 0% | - |
| 阶段 5：部署 | 2-3 天 | - | 0% | - |
| **总计** | **16-25 天** | - | **0%** | - |

### 9.2 里程碑

- [ ] 后端基础框架搭建完成
- [ ] 大模型 API 实现完成
- [ ] 加速卡 API 实现完成
- [ ] 对比分析 API 实现完成
- [ ] 前端集成完成
- [ ] 认证系统完成
- [ ] 测试完成
- [ ] 部署上线

## 十、总结

本检查清单涵盖了从后端开发到前端集成的完整流程，包括：

1. **详细的任务分解**：每个阶段的具体任务
2. **迁移对照表**：Mock 数据与 API 的对应关系
3. **测试用例**：API 和前端的测试清单
4. **性能指标**：明确的性能目标
5. **风险管理**：潜在风险和应对措施
6. **时间跟踪**：进度监控

使用本检查清单可以：
- 确保不遗漏任何重要步骤
- 跟踪项目进度
- 管理项目风险
- 保证项目质量

建议每天更新检查清单，及时记录进度和问题。
