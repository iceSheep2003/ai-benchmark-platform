# 后端实施方案：逐步替代 Mock 数据

## 一、项目现状分析

### 1.1 Mock 数据文件清单

```
src/mockData/
├── testResultMock.ts          # 大模型测试结果（核心）
├── acceleratorMock.ts          # 加速卡测试数据（核心）
├── comparisonResultMock.ts     # 对比分析结果（核心）
├── assetsMock.ts               # 资产数据（模型、加速卡、数据集）
├── datasetMock.ts              # 数据集管理
├── performanceMock.ts          # 性能监控数据
├── schedulerSimulator.ts       # 任务调度模拟
├── websocketMock.ts            # WebSocket 模拟
├── templates.ts                # 配置模板
└── workflowTemplates.ts        # 工作流模板
```

### 1.2 核心业务模块

1. **大模型测评**（优先级：高）
   - 模型列表和详情
   - 测试结果管理
   - 智能排行榜
   - 测试报告

2. **加速卡测评**（优先级：高）
   - 加速卡列表和详情
   - 测试结果管理
   - 性能排行榜
   - 测试报告

3. **对比分析**（优先级：高）
   - 创建对比
   - 对比结果管理
   - 详细分析

4. **任务管理**（优先级：中）
   - 任务创建和调度
   - 实时监控
   - 资源估算

5. **数据集管理**（优先级：中）
   - 数据集列表
   - 数据集详情

## 二、后端技术栈选择

### 2.1 推荐技术栈

#### 方案 A：Python + FastAPI（推荐）

**优势**：
- 与 AI/ML 生态完美契合
- FastAPI 性能优秀，开发效率高
- 自动生成 API 文档
- 类型提示支持好
- 异步支持完善

**技术栈**：
```
后端框架: FastAPI 0.104+
数据库: PostgreSQL 15+ / MongoDB 6+
ORM: SQLAlchemy 2.0+ / MongoEngine
缓存: Redis 7+
任务队列: Celery + Redis
实时通信: WebSocket
API 文档: Swagger/OpenAPI（自动生成）
认证: JWT
部署: Docker + Kubernetes
```

#### 方案 B：Node.js + NestJS

**优势**：
- 前后端技术栈统一
- 企业级框架，架构清晰
- TypeScript 原生支持
- 模块化设计

**技术栈**：
```
后端框架: NestJS 10+
数据库: PostgreSQL 15+ / MongoDB 6+
ORM: TypeORM / Prisma
缓存: Redis 7+
任务队列: Bull
实时通信: Socket.io
API 文档: Swagger
认证: JWT + Passport
部署: Docker + Kubernetes
```

### 2.2 数据库选择

#### PostgreSQL（推荐）

**适用场景**：
- 结构化数据
- 复杂查询
- 事务支持
- 数据一致性要求高

**优势**：
- 成熟稳定
- JSON 支持（存储非结构化数据）
- 性能优秀
- 开源免费

#### MongoDB

**适用场景**：
- 非结构化数据
- 灵活的数据模型
- 快速迭代

**优势**：
- 灵活的 Schema
- 横向扩展容易
- 适合存储 JSON 数据

### 2.3 最终推荐

**推荐方案：Python + FastAPI + PostgreSQL**

理由：
1. 与 AI 测评业务高度契合
2. 开发效率高，适合快速迭代
3. 性能优秀，支持异步
4. 社区活跃，文档完善
5. 便于后续集成 AI 模型

## 三、数据库设计

### 3.1 核心表结构

#### 大模型相关表

```sql
-- 模型表
CREATE TABLE models (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    params VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('tested', 'testing', 'pending')),
    domain JSONB,
    scores JSONB,
    sub_task_scores JSONB,
    trend JSONB,
    capabilities JSONB[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_name ON models USING gin(to_tsvector('english', name));

-- 模型版本表
CREATE TABLE model_versions (
    id VARCHAR(36) PRIMARY KEY,
    model_id VARCHAR(36) REFERENCES models(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    scores JSONB,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_versions_model_id ON model_versions(model_id);

-- 模型测试任务表
CREATE TABLE model_test_tasks (
    id VARCHAR(36) PRIMARY KEY,
    model_id VARCHAR(36) REFERENCES models(id) ON DELETE CASCADE,
    task_name VARCHAR(255),
    status VARCHAR(20),
    config JSONB,
    result JSONB,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_test_tasks_model_id ON model_test_tasks(model_id);
CREATE INDEX idx_model_test_tasks_status ON model_test_tasks(status);
```

#### 加速卡相关表

```sql
-- 加速卡表
CREATE TABLE accelerators (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    model VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('tested', 'testing', 'pending')),
    specs JSONB,
    scores JSONB,
    sub_task_scores JSONB,
    trend JSONB,
    capabilities JSONB[],
    firmware VARCHAR(50),
    driver VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_accelerators_status ON accelerators(status);
CREATE INDEX idx_accelerators_vendor ON accelerators(vendor);

-- 加速卡版本表
CREATE TABLE accelerator_versions (
    id VARCHAR(36) PRIMARY KEY,
    accelerator_id VARCHAR(36) REFERENCES accelerators(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    scores JSONB,
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accelerator_versions_accelerator_id ON accelerator_versions(accelerator_id);

-- 加速卡测试任务表
CREATE TABLE accelerator_test_tasks (
    id VARCHAR(36) PRIMARY KEY,
    accelerator_id VARCHAR(36) REFERENCES accelerators(id) ON DELETE CASCADE,
    task_name VARCHAR(255),
    status VARCHAR(20),
    config JSONB,
    result JSONB,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accelerator_test_tasks_accelerator_id ON accelerator_test_tasks(accelerator_id);
```

#### 对比分析表

```sql
-- 对比表
CREATE TABLE comparisons (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('model', 'accelerator')),
    category VARCHAR(50),
    items JSONB NOT NULL,
    weights JSONB,
    analysis JSONB,
    tags JSONB,
    is_public BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparisons_type ON comparisons(type);
CREATE INDEX idx_comparisons_created_by ON comparisons(created_by);
CREATE INDEX idx_comparisons_is_public ON comparisons(is_public);

-- 对比收藏表
CREATE TABLE comparison_stars (
    id VARCHAR(36) PRIMARY KEY,
    comparison_id VARCHAR(36) REFERENCES comparisons(id) ON DELETE CASCADE,
    user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comparison_id, user_id)
);

CREATE INDEX idx_comparison_stars_user_id ON comparison_stars(user_id);
```

#### 任务管理表

```sql
-- 任务表
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    status VARCHAR(20),
    priority INTEGER DEFAULT 5,
    config JSONB,
    progress JSONB,
    result JSONB,
    resource_requirements JSONB,
    estimated_duration INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- 任务日志表
CREATE TABLE task_logs (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) REFERENCES tasks(id) ON DELETE CASCADE,
    level VARCHAR(20),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
```

#### 数据集表

```sql
-- 数据集表
CREATE TABLE datasets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    size VARCHAR(50),
    format VARCHAR(50),
    download_count INTEGER DEFAULT 0,
    tags JSONB,
    metadata JSONB,
    file_path VARCHAR(500),
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_datasets_type ON datasets(type);
```

#### 用户和认证表

```sql
-- 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- API 密钥表
CREATE TABLE api_keys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    permissions JSONB,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
```

### 3.2 数据迁移策略

1. **保留 JSONB 字段**：用于存储灵活的结构（scores, sub_task_scores 等）
2. **添加索引**：优化查询性能
3. **外键约束**：保证数据一致性
4. **软删除**：使用 is_active 字段
5. **审计字段**：created_at, updated_at, created_by

## 四、API 设计

### 4.1 RESTful API 规范

#### 基础路径

```
开发环境: http://localhost:8000/api/v1
生产环境: https://api.aibenchmark.com/api/v1
```

#### 统一响应格式

```json
{
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 分页响应格式

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 4.2 核心 API 端点

#### 大模型 API

```
GET    /api/v1/models                    # 获取模型列表（分页、搜索、筛选）
GET    /api/v1/models/:id                # 获取模型详情
POST   /api/v1/models                    # 创建模型
PUT    /api/v1/models/:id                # 更新模型
DELETE /api/v1/models/:id                # 删除模型

GET    /api/v1/models/:id/report         # 获取模型测试报告
GET    /api/v1/models/:id/versions       # 获取版本历史
GET    /api/v1/models/:id/tasks          # 获取相关任务

POST   /api/v1/models/:id/test           # 创建测试任务
GET    /api/v1/models/:id/test/status    # 获取测试状态

GET    /api/v1/models/top                # 获取排行榜
GET    /api/v1/models/domain/:domain     # 按领域获取模型
```

#### 加速卡 API

```
GET    /api/v1/accelerators              # 获取加速卡列表
GET    /api/v1/accelerators/:id          # 获取加速卡详情
POST   /api/v1/accelerators              # 创建加速卡
PUT    /api/v1/accelerators/:id          # 更新加速卡
DELETE /api/v1/accelerators/:id          # 删除加速卡

GET    /api/v1/accelerators/:id/report   # 获取测试报告
GET    /api/v1/accelerators/:id/versions # 获取版本历史
GET    /api/v1/accelerators/:id/tasks    # 获取相关任务

POST   /api/v1/accelerators/:id/test     # 创建测试任务
GET    /api/v1/accelerators/:id/test/status # 获取测试状态

GET    /api/v1/accelerators/top          # 获取排行榜
GET    /api/v1/accelerators/vendor/:vendor # 按厂商获取
```

#### 对比分析 API

```
GET    /api/v1/comparisons               # 获取对比列表
GET    /api/v1/comparisons/:id           # 获取对比详情
POST   /api/v1/comparisons               # 创建对比
PUT    /api/v1/comparisons/:id           # 更新对比
DELETE /api/v1/comparisons/:id           # 删除对比

POST   /api/v1/comparisons/:id/star      # 收藏对比
DELETE /api/v1/comparisons/:id/star      # 取消收藏

GET    /api/v1/comparisons/mine          # 我的对比
GET    /api/v1/comparisons/starred       # 收藏的对比
```

#### 任务管理 API

```
GET    /api/v1/tasks                     # 获取任务列表
GET    /api/v1/tasks/:id                 # 获取任务详情
POST   /api/v1/tasks                     # 创建任务
PUT    /api/v1/tasks/:id                 # 更新任务
DELETE /api/v1/tasks/:id                 # 删除任务

POST   /api/v1/tasks/:id/start           # 启动任务
POST   /api/v1/tasks/:id/stop            # 停止任务
POST   /api/v1/tasks/:id/retry           # 重试任务

GET    /api/v1/tasks/:id/logs            # 获取任务日志
GET    /api/v1/tasks/:id/progress        # 获取任务进度
```

#### 数据集 API

```
GET    /api/v1/datasets                  # 获取数据集列表
GET    /api/v1/datasets/:id              # 获取数据集详情
POST   /api/v1/datasets                  # 创建数据集
PUT    /api/v1/datasets/:id              # 更新数据集
DELETE /api/v1/datasets/:id              # 删除数据集

POST   /api/v1/datasets/:id/download     # 下载数据集
```

#### 认证 API

```
POST   /api/v1/auth/register             # 注册
POST   /api/v1/auth/login                # 登录
POST   /api/v1/auth/logout               # 登出
POST   /api/v1/auth/refresh              # 刷新 Token
GET    /api/v1/auth/me                   # 获取当前用户信息
```

### 4.3 WebSocket API

#### 连接端点

```
WS     /ws/tasks/:id                     # 任务实时进度
WS     /ws/monitor                       # 系统监控
```

#### 消息格式

```json
{
  "type": "task_progress",
  "data": {
    "taskId": "xxx",
    "progress": 50,
    "currentStep": "Testing...",
    "estimatedTime": "10 minutes"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 五、逐步实施步骤

### 阶段 0：准备工作（1-2 天）

#### 步骤 0.1：环境搭建

```bash
# 创建后端项目目录
mkdir ai-benchmark-backend
cd ai-benchmark-backend

# 初始化 Python 项目
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install fastapi uvicorn sqlalchemy psycopg2-binary redis celery python-jose[cryptography] passlib[bcrypt] python-multipart aiohttp websockets

# 创建项目结构
mkdir -p app/{api,core,models,schemas,services,utils}
mkdir -p tests
touch app/__init__.py
touch app/main.py
touch requirements.txt
```

#### 步骤 0.2：项目结构

```
ai-benchmark-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/                    # API 路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── models.py
│   │   │   │   ├── accelerators.py
│   │   │   │   ├── comparisons.py
│   │   │   │   ├── tasks.py
│   │   │   │   └── auth.py
│   │   │   └── api.py
│   ├── core/                   # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/                 # 数据库模型
│   │   ├── __init__.py
│   │   ├── model.py
│   │   ├── accelerator.py
│   │   ├── comparison.py
│   │   └── user.py
│   ├── schemas/                # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── model.py
│   │   ├── accelerator.py
│   │   └── comparison.py
│   ├── services/               # 业务逻辑
│   │   ├── __init__.py
│   │   ├── model_service.py
│   │   ├── accelerator_service.py
│   │   └── comparison_service.py
│   └── utils/                  # 工具函数
│       ├── __init__.py
│       └── helpers.py
├── tests/                      # 测试
│   ├── __init__.py
│   ├── test_models.py
│   └── test_accelerators.py
├── alembic/                    # 数据库迁移
│   └── versions/
├── requirements.txt
├── .env
└── README.md
```

#### 步骤 0.3：配置文件

创建 `app/core/config.py`：

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "AI Benchmark API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ai_benchmark"
    
    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT 配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 配置
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 阶段 1：核心功能实现（5-7 天）

#### 步骤 1.1：数据库初始化（1 天）

**目标**：创建数据库连接和基础模型

**任务清单**：
- [ ] 配置数据库连接
- [ ] 创建基础模型类
- [ ] 初始化 Alembic 迁移
- [ ] 创建数据库表

**代码示例**：

`app/core/database.py`：
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

`app/models/model.py`：
```python
from sqlalchemy import Column, String, JSON, Boolean, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base
import uuid

class Model(Base):
    __tablename__ = "models"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    organization = Column(String(255))
    params = Column(String(50))
    status = Column(String(20))
    domain = Column(JSONB)
    scores = Column(JSONB)
    sub_task_scores = Column(JSONB)
    trend = Column(JSONB)
    capabilities = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")
    is_active = Column(Boolean, default=True)
```

**验证**：
```bash
# 初始化数据库迁移
alembic init alembic

# 创建迁移
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

#### 步骤 1.2：大模型 API 实现（2 天）

**目标**：实现大模型的 CRUD 操作

**任务清单**：
- [ ] 创建 Pydantic schemas
- [ ] 实现模型服务层
- [ ] 实现 API 端点
- [ ] 添加测试

**代码示例**：

`app/schemas/model.py`：
```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ModelBase(BaseModel):
    name: str
    organization: Optional[str] = None
    params: Optional[str] = None
    domain: Optional[List[str]] = None

class ModelCreate(ModelBase):
    pass

class ModelUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    status: Optional[str] = None

class ModelResponse(ModelBase):
    id: str
    status: str
    scores: Optional[Dict[str, Any]] = None
    sub_task_scores: Optional[Dict[str, Any]] = None
    trend: Optional[List[int]] = None
    capabilities: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ModelListResponse(BaseModel):
    items: List[ModelResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int
```

`app/services/model_service.py`：
```python
from sqlalchemy.orm import Session
from app.models.model import Model
from app.schemas.model import ModelCreate, ModelUpdate
from typing import List, Optional

class ModelService:
    @staticmethod
    def get_models(
        db: Session, 
        skip: int = 0, 
        limit: int = 10,
        status: Optional[str] = None,
        search: Optional[str] = None
    ):
        query = db.query(Model).filter(Model.is_active == True)
        
        if status:
            query = query.filter(Model.status == status)
        
        if search:
            query = query.filter(Model.name.ilike(f"%{search}%"))
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        
        return {
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "pageSize": limit,
            "totalPages": (total + limit - 1) // limit
        }
    
    @staticmethod
    def get_model_by_id(db: Session, model_id: str):
        return db.query(Model).filter(Model.id == model_id, Model.is_active == True).first()
    
    @staticmethod
    def create_model(db: Session, model: ModelCreate):
        db_model = Model(**model.dict())
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    
    @staticmethod
    def update_model(db: Session, model_id: str, model: ModelUpdate):
        db_model = ModelService.get_model_by_id(db, model_id)
        if not db_model:
            return None
        
        update_data = model.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_model, field, value)
        
        db.commit()
        db.refresh(db_model)
        return db_model
    
    @staticmethod
    def delete_model(db: Session, model_id: str):
        db_model = ModelService.get_model_by_id(db, model_id)
        if not db_model:
            return False
        
        db_model.is_active = False
        db.commit()
        return True
```

`app/api/v1/endpoints/models.py`：
```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.model import ModelCreate, ModelUpdate, ModelResponse, ModelListResponse
from app.services.model_service import ModelService

router = APIRouter()

@router.get("/", response_model=ModelListResponse)
async def get_models(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * pageSize
    return ModelService.get_models(db, skip=skip, limit=pageSize, status=status, search=search)

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, db: Session = Depends(get_db)):
    model = ModelService.get_model_by_id(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.post("/", response_model=ModelResponse, status_code=201)
async def create_model(model: ModelCreate, db: Session = Depends(get_db)):
    return ModelService.create_model(db, model)

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(model_id: str, model: ModelUpdate, db: Session = Depends(get_db)):
    updated_model = ModelService.update_model(db, model_id, model)
    if not updated_model:
        raise HTTPException(status_code=404, detail="Model not found")
    return updated_model

@router.delete("/{model_id}")
async def delete_model(model_id: str, db: Session = Depends(get_db)):
    if not ModelService.delete_model(db, model_id):
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model deleted successfully"}
```

**验证**：
```bash
# 启动服务器
uvicorn app.main:app --reload

# 访问 API 文档
http://localhost:8000/docs

# 测试 API
curl http://localhost:8000/api/v1/models
```

#### 步骤 1.3：加速卡 API 实现（2 天）

**目标**：实现加速卡的 CRUD 操作

**任务清单**：
- [ ] 创建加速卡模型
- [ ] 实现加速卡服务层
- [ ] 实现 API 端点
- [ ] 添加测试

（代码结构与大模型类似，此处省略）

#### 步骤 1.4：对比分析 API 实现（2 天）

**目标**：实现对比分析的 CRUD 操作

**任务清单**：
- [ ] 创建对比模型
- [ ] 实现对比服务层
- [ ] 实现 API 端点
- [ ] 添加收藏功能

（代码结构与大模型类似，此处省略）

### 阶段 2：前端集成（3-5 天）

#### 步骤 2.1：前端 API 客户端配置（1 天）

**目标**：配置前端 API 客户端

**任务清单**：
- [ ] 创建 API 客户端
- [ ] 配置请求拦截器
- [ ] 配置响应拦截器
- [ ] 添加错误处理

**前端代码**：

创建 `src/services/apiClient.ts`：
```typescript
import axios from 'axios';
import { message } from 'antd';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      message.error('登录已过期');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 步骤 2.2：迁移大模型组件（1-2 天）

**目标**：将大模型组件从 mock 数据迁移到 API

**任务清单**：
- [ ] 创建 modelService
- [ ] 创建 dataStore
- [ ] 迁移 SmartLeaderboard
- [ ] 迁移 TestLifecycleManager
- [ ] 迁移 TestReportModal

**迁移示例**：

`src/services/modelService.ts`：
```typescript
import apiClient from './apiClient';
import type { TestModel } from '../mockData/testResultMock';

export const modelService = {
  getModels: (params?: any) => 
    apiClient.get('/models', { params }),
  
  getModelById: (id: string) => 
    apiClient.get(`/models/${id}`),
  
  createModel: (data: any) => 
    apiClient.post('/models', data),
};

// 在组件中使用
import { modelService } from '../services/modelService';

const { data } = await modelService.getModels({ page: 1, pageSize: 10 });
```

#### 步骤 2.3：迁移加速卡组件（1 天）

**目标**：将加速卡组件从 mock 数据迁移到 API

**任务清单**：
- [ ] 创建 acceleratorService
- [ ] 迁移 AcceleratorLeaderboard
- [ ] 迁移 AcceleratorLifecycleManager
- [ ] 迁移 AcceleratorReportModal

#### 步骤 2.4：迁移对比分析组件（1 天）

**目标**：将对比分析组件从 mock 数据迁移到 API

**任务清单**：
- [ ] 创建 comparisonService
- [ ] 迁移 ComparisonManagement
- [ ] 迁移 ComparisonDetailModal
- [ ] 迁移 CreateComparisonModal

### 阶段 3：高级功能实现（3-5 天）

#### 步骤 3.1：认证系统（1 天）

**目标**：实现用户认证和授权

**任务清单**：
- [ ] 实现注册和登录
- [ ] 实现 JWT 认证
- [ ] 实现权限控制
- [ ] 前端集成认证

#### 步骤 3.2：WebSocket 实时通信（1-2 天）

**目标**：实现实时任务监控

**任务清单**：
- [ ] 实现 WebSocket 服务端
- [ ] 实现 WebSocket 客户端
- [ ] 实现任务进度推送
- [ ] 实现系统监控

#### 步骤 3.3：任务调度系统（1-2 天）

**目标**：实现异步任务处理

**任务清单**：
- [ ] 配置 Celery
- [ ] 实现任务队列
- [ ] 实现任务调度
- [ ] 实现任务监控

### 阶段 4：测试和优化（2-3 天）

#### 步骤 4.1：单元测试（1 天）

**任务清单**：
- [ ] 编写 API 测试
- [ ] 编写服务层测试
- [ ] 编写数据库测试

#### 步骤 4.2：集成测试（1 天）

**任务清单**：
- [ ] 编写端到端测试
- [ ] 测试前后端集成
- [ ] 测试 WebSocket

#### 步骤 4.3：性能优化（1 天）

**任务清单**：
- [ ] 数据库查询优化
- [ ] API 响应优化
- [ ] 缓存优化

### 阶段 5：部署和文档（2-3 天）

#### 步骤 5.1：Docker 容器化（1 天）

**任务清单**：
- [ ] 创建 Dockerfile
- [ ] 创建 docker-compose.yml
- [ ] 配置环境变量

#### 步骤 5.2：API 文档（1 天）

**任务清单**：
- [ ] 完善 Swagger 文档
- [ ] 编写 API 使用指南
- [ ] 编写部署文档

#### 步骤 5.3：部署上线（1 天）

**任务清单**：
- [ ] 配置生产环境
- [ ] 部署到服务器
- [ ] 配置域名和 SSL

## 六、时间估算总结

| 阶段 | 工作内容 | 预计时间 | 优先级 |
|------|---------|---------|--------|
| 阶段 0 | 准备工作 | 1-2 天 | 高 |
| 阶段 1 | 核心功能实现 | 5-7 天 | 高 |
| 阶段 2 | 前端集成 | 3-5 天 | 高 |
| 阶段 3 | 高级功能 | 3-5 天 | 中 |
| 阶段 4 | 测试优化 | 2-3 天 | 高 |
| 阶段 5 | 部署文档 | 2-3 天 | 中 |
| **总计** | | **16-25 天** | |

## 七、风险和应对

### 7.1 技术风险

- **数据库性能**：使用索引、查询优化、缓存
- **API 性能**：使用异步处理、分页、缓存
- **并发问题**：使用连接池、异步框架

### 7.2 业务风险

- **数据迁移**：制定详细的迁移计划，做好备份
- **功能缺失**：逐步迁移，确保每个功能都经过测试
- **用户体验**：保持与 mock 数据版本的功能一致性

## 八、成功标准

### 8.1 功能完整性

- [ ] 所有 mock 数据功能都已实现
- [ ] API 文档完整
- [ ] 测试覆盖率 > 80%

### 8.2 性能指标

- [ ] API 响应时间 < 200ms
- [ ] 数据库查询优化
- [ ] 支持并发请求

### 8.3 可维护性

- [ ] 代码结构清晰
- [ ] 文档完善
- [ ] 易于扩展

## 九、后续规划

### 9.1 功能增强

- AI 模型集成
- 自动化测试
- 数据分析
- 报告生成

### 9.2 性能优化

- 分布式部署
- 负载均衡
- 缓存策略
- 数据库分片

### 9.3 安全增强

- API 限流
- 数据加密
- 审计日志
- 权限细化

## 十、总结

本方案提供了从零开始构建后端系统的完整路径，包括：

1. **清晰的技术选型**：推荐 Python + FastAPI + PostgreSQL
2. **完整的数据库设计**：详细的表结构和索引
3. **规范的 API 设计**：RESTful API 和 WebSocket
4. **渐进式实施步骤**：分阶段、可验证
5. **详细的时间估算**：16-25 天完成核心功能

通过本方案的实施，可以平滑地从 mock 数据过渡到真实的后端系统，为生产环境部署做好准备。
