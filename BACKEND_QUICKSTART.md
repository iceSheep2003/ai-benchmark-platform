# 后端快速开始指南

## 一、环境准备

### 1.1 安装必要软件

```bash
# 安装 Python 3.10+
brew install python@3.10  # macOS
# 或从官网下载: https://www.python.org/downloads/

# 安装 PostgreSQL
brew install postgresql@15  # macOS
# 或从官网下载: https://www.postgresql.org/download/

# 安装 Redis
brew install redis  # macOS
# 或从官网下载: https://redis.io/download

# 启动服务
brew services start postgresql@15
brew services start redis
```

### 1.2 创建数据库

```bash
# 登录 PostgreSQL
psql postgres

# 创建数据库
CREATE DATABASE ai_benchmark;

# 创建用户
CREATE USER benchmark_user WITH PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE ai_benchmark TO benchmark_user;

# 退出
\q
```

## 二、后端项目初始化

### 2.1 创建项目结构

```bash
# 创建后端项目目录
mkdir ai-benchmark-backend
cd ai-benchmark-backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows

# 创建项目结构
mkdir -p app/{api/v1/endpoints,core,models,schemas,services,utils}
mkdir -p tests
mkdir -p alembic/versions

# 创建文件
touch app/__init__.py
touch app/main.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py
touch app/core/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/utils/__init__.py
touch requirements.txt
touch .env
touch README.md
```

### 2.2 安装依赖

创建 `requirements.txt`：

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.12.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aiohttp==3.9.1
redis==5.0.1
celery==5.3.4
websockets==12.0
python-dotenv==1.0.0
```

安装依赖：

```bash
pip install -r requirements.txt
```

## 三、核心代码实现

### 3.1 配置文件

创建 `app/core/config.py`：

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "AI Benchmark API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://benchmark_user:your_password@localhost:5432/ai_benchmark"
    
    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT 配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 3.2 数据库连接

创建 `app/core/database.py`：

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3.3 模型定义

创建 `app/models/model.py`：

```python
from sqlalchemy import Column, String, Boolean, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base
import uuid

class Model(Base):
    __tablename__ = "models"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    organization = Column(String(255))
    params = Column(String(50))
    status = Column(String(20), index=True)
    domain = Column(JSONB)
    scores = Column(JSONB)
    sub_task_scores = Column(JSONB)
    trend = Column(JSONB)
    capabilities = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    is_active = Column(Boolean, default=True)
```

### 3.4 Pydantic Schemas

创建 `app/schemas/model.py`：

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
    status: Optional[str] = "pending"

class ModelUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    status: Optional[str] = None
    scores: Optional[Dict[str, Any]] = None

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

### 3.5 服务层

创建 `app/services/model_service.py`：

```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.model import Model
from app.schemas.model import ModelCreate, ModelUpdate
from typing import Optional, Dict, Any

class ModelService:
    @staticmethod
    def get_models(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        status: Optional[str] = None,
        search: Optional[str] = None,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取模型列表"""
        query = db.query(Model).filter(Model.is_active == True)
        
        # 状态筛选
        if status:
            query = query.filter(Model.status == status)
        
        # 搜索
        if search:
            query = query.filter(Model.name.ilike(f"%{search}%"))
        
        # 领域筛选
        if domain:
            query = query.filter(Model.domain.contains([domain]))
        
        # 统计总数
        total = query.count()
        
        # 分页
        items = query.order_by(Model.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "items": items,
            "total": total,
            "page": skip // limit + 1,
            "pageSize": limit,
            "totalPages": (total + limit - 1) // limit
        }
    
    @staticmethod
    def get_model_by_id(db: Session, model_id: str) -> Optional[Model]:
        """根据 ID 获取模型"""
        return db.query(Model).filter(
            Model.id == model_id,
            Model.is_active == True
        ).first()
    
    @staticmethod
    def create_model(db: Session, model: ModelCreate) -> Model:
        """创建模型"""
        db_model = Model(**model.dict())
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    
    @staticmethod
    def update_model(db: Session, model_id: str, model: ModelUpdate) -> Optional[Model]:
        """更新模型"""
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
    def delete_model(db: Session, model_id: str) -> bool:
        """删除模型（软删除）"""
        db_model = ModelService.get_model_by_id(db, model_id)
        if not db_model:
            return False
        
        db_model.is_active = False
        db.commit()
        return True
```

### 3.6 API 端点

创建 `app/api/v1/endpoints/models.py`：

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.model import (
    ModelCreate,
    ModelUpdate,
    ModelResponse,
    ModelListResponse
)
from app.services.model_service import ModelService

router = APIRouter()

@router.get("/", response_model=ModelListResponse)
async def get_models(
    page: int = Query(1, ge=1, description="页码"),
    pageSize: int = Query(10, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="状态筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    domain: Optional[str] = Query(None, description="领域筛选"),
    db: Session = Depends(get_db)
):
    """
    获取模型列表
    
    - **page**: 页码，从 1 开始
    - **pageSize**: 每页数量，最大 100
    - **status**: 状态筛选（tested, testing, pending）
    - **search**: 搜索模型名称
    - **domain**: 领域筛选
    """
    skip = (page - 1) * pageSize
    return ModelService.get_models(
        db,
        skip=skip,
        limit=pageSize,
        status=status,
        search=search,
        domain=domain
    )

@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, db: Session = Depends(get_db)):
    """获取模型详情"""
    model = ModelService.get_model_by_id(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="模型不存在")
    return model

@router.post("/", response_model=ModelResponse, status_code=201)
async def create_model(model: ModelCreate, db: Session = Depends(get_db)):
    """创建模型"""
    return ModelService.create_model(db, model)

@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: str,
    model: ModelUpdate,
    db: Session = Depends(get_db)
):
    """更新模型"""
    updated_model = ModelService.update_model(db, model_id, model)
    if not updated_model:
        raise HTTPException(status_code=404, detail="模型不存在")
    return updated_model

@router.delete("/{model_id}")
async def delete_model(model_id: str, db: Session = Depends(get_db)):
    """删除模型"""
    if not ModelService.delete_model(db, model_id):
        raise HTTPException(status_code=404, detail="模型不存在")
    return {"message": "模型删除成功"}
```

### 3.7 API 路由配置

创建 `app/api/v1/api.py`：

```python
from fastapi import APIRouter
from app.api.v1.endpoints import models

api_router = APIRouter()

api_router.include_router(
    models.router,
    prefix="/models",
    tags=["models"]
)

# 后续添加其他路由
# api_router.include_router(accelerators.router, prefix="/accelerators", tags=["accelerators"])
# api_router.include_router(comparisons.router, prefix="/comparisons", tags=["comparisons"])
```

### 3.8 主应用

创建 `app/main.py`：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Benchmark Platform API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Benchmark API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
```

## 四、数据库迁移

### 4.1 初始化 Alembic

```bash
# 初始化 Alembic
alembic init alembic

# 编辑 alembic.ini
# 修改 sqlalchemy.url = postgresql://benchmark_user:your_password@localhost:5432/ai_benchmark
```

### 4.2 配置 Alembic

编辑 `alembic/env.py`：

```python
from app.core.database import Base
from app.models import model  # 导入所有模型

target_metadata = Base.metadata
```

### 4.3 创建迁移

```bash
# 创建迁移
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head

# 查看迁移历史
alembic history

# 回滚迁移
alembic downgrade -1
```

## 五、运行和测试

### 5.1 启动服务

```bash
# 启动开发服务器
uvicorn app.main:app --reload

# 或使用 Python
python app/main.py
```

### 5.2 访问 API 文档

```
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
```

### 5.3 测试 API

```bash
# 获取模型列表
curl http://localhost:8000/api/v1/models

# 创建模型
curl -X POST http://localhost:8000/api/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4",
    "organization": "OpenAI",
    "params": "1.8T",
    "status": "tested",
    "domain": ["general", "code"]
  }'

# 获取模型详情
curl http://localhost:8000/api/v1/models/{model_id}

# 更新模型
curl -X PUT http://localhost:8000/api/v1/models/{model_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "testing"
  }'

# 删除模型
curl -X DELETE http://localhost:8000/api/v1/models/{model_id}
```

## 六、前端集成

### 6.1 配置环境变量

创建前端 `.env.development`：

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 6.2 创建 API 服务

创建 `src/services/apiClient.ts`：

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
```

创建 `src/services/modelService.ts`：

```typescript
import apiClient from './apiClient';

export const modelService = {
  getModels: (params?: any) => 
    apiClient.get('/models', { params }),
  
  getModelById: (id: string) => 
    apiClient.get(`/models/${id}`),
  
  createModel: (data: any) => 
    apiClient.post('/models', data),
  
  updateModel: (id: string, data: any) => 
    apiClient.put(`/models/${id}`, data),
  
  deleteModel: (id: string) => 
    apiClient.delete(`/models/${id}`),
};
```

### 6.3 在组件中使用

```typescript
import { useEffect, useState } from 'react';
import { modelService } from '../services/modelService';
import type { TestModel } from '../mockData/testResultMock';

export const SmartLeaderboard = () => {
  const [models, setModels] = useState<TestModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await modelService.getModels({ page: 1, pageSize: 10 });
        setModels(response.data.items);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* 渲染模型列表 */}
    </div>
  );
};
```

## 七、下一步

1. **实现其他 API**：加速卡、对比分析、任务管理等
2. **添加认证系统**：JWT 认证和权限控制
3. **实现 WebSocket**：实时任务监控
4. **添加测试**：单元测试和集成测试
5. **部署上线**：Docker 容器化和部署

## 八、常见问题

### Q1: 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
brew services list

# 重启 PostgreSQL
brew services restart postgresql@15

# 检查数据库连接
psql -U benchmark_user -d ai_benchmark
```

### Q2: 端口被占用

```bash
# 查看端口占用
lsof -i :8000

# 杀掉进程
kill -9 <PID>
```

### Q3: 依赖安装失败

```bash
# 升级 pip
pip install --upgrade pip

# 清理缓存
pip cache purge

# 重新安装
pip install -r requirements.txt --no-cache-dir
```

## 九、参考资源

- FastAPI 文档: https://fastapi.tiangolo.com/
- SQLAlchemy 文档: https://docs.sqlalchemy.org/
- Alembic 文档: https://alembic.sqlalchemy.org/
- PostgreSQL 文档: https://www.postgresql.org/docs/
