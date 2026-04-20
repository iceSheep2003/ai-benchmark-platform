# 大模型测评系统 API 接口设计文档

## 📋 文档概述

**版本：** v1.0.0  
**基础路径：** `http://localhost:8000/api/v1/llm`  
**认证方式：** JWT Bearer Token  
**数据格式：** JSON  
**编码：** UTF-8

---

## 🔐 认证说明

### JWT Token 认证

所有 API 请求（除登录注册外）都需要在请求头中携带 JWT Token：

```
Authorization: Bearer {access_token}
```

### Token 获取

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=testuser&password=password123

Response 200:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "user-uuid",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

---

## 📊 统一响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "Success",
  "data": {
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 分页响应

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

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "ValidationError",
    "details": "字段 'name' 不能为空"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🎯 大模型管理 API

### 1. 获取大模型列表

```http
GET /api/v1/llm/models

Query Parameters:
- page: 页码（默认：1）
- pageSize: 每页数量（默认：10）
- vendor: 厂商筛选（可选）
- status: 状态筛选（pending, testing, tested）
- search: 搜索关键词（可选）

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "model-uuid",
        "name": "GPT-4",
        "vendor": "OpenAI",
        "version": "gpt-4-0613",
        "status": "tested",
        "capabilities": ["文本生成", "代码生成", "推理"],
        "scores": {
          "overall": 95.5,
          "languageUnderstanding": 96.2,
          "reasoning": 94.8,
          "coding": 95.3,
          "math": 93.7,
          "creativity": 96.1
        },
        "testedAt": "2024-01-01T00:00:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

### 2. 获取大模型详情

```http
GET /api/v1/llm/models/{id}

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "model-uuid",
    "name": "GPT-4",
    "vendor": "OpenAI",
    "version": "gpt-4-0613",
    "status": "tested",
    "capabilities": ["文本生成", "代码生成", "推理"],
    "scores": {
      "overall": 95.5,
      "languageUnderstanding": 96.2,
      "reasoning": 94.8,
      "coding": 95.3,
      "math": 93.7,
      "creativity": 96.1
    },
    "subTaskScores": {
      "languageUnderstanding": {
        "readingComprehension": { "score": 96.5, "metric": "accuracy" },
        "sentimentAnalysis": { "score": 95.8, "metric": "accuracy" },
        "namedEntityRecognition": { "score": 94.2, "metric": "F1" }
      },
      "reasoning": {
        "logicalReasoning": { "score": 95.1, "metric": "accuracy" },
        "commonSenseReasoning": { "score": 94.5, "metric": "accuracy" }
      }
    },
    "testedAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 创建大模型

```http
POST /api/v1/llm/models

Request Body:
{
  "name": "GPT-4",
  "vendor": "OpenAI",
  "version": "gpt-4-0613",
  "capabilities": ["文本生成", "代码生成", "推理"],
  "description": "GPT-4 是 OpenAI 开发的大型语言模型"
}

Response 201:
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "model-uuid",
    "name": "GPT-4",
    "vendor": "OpenAI",
    "version": "gpt-4-0613",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. 更新大模型

```http
PUT /api/v1/llm/models/{id}

Request Body:
{
  "name": "GPT-4",
  "vendor": "OpenAI",
  "version": "gpt-4-0613",
  "capabilities": ["文本生成", "代码生成", "推理"],
  "description": "GPT-4 是 OpenAI 开发的大型语言模型"
}

Response 200:
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "model-uuid",
    "name": "GPT-4",
    "vendor": "OpenAI",
    "version": "gpt-4-0613",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 5. 删除大模型

```http
DELETE /api/v1/llm/models/{id}

Response 200:
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 🧪 测试任务管理 API

### 1. 获取测试任务列表

```http
GET /api/v1/llm/tasks

Query Parameters:
- page: 页码（默认：1）
- pageSize: 每页数量（默认：10）
- status: 状态筛选（pending, running, completed, failed）
- modelId: 模型ID筛选（可选）

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "task-uuid",
        "name": "GPT-4 性能基准测试",
        "modelId": "model-uuid",
        "modelName": "GPT-4",
        "type": "性能测试",
        "status": "completed",
        "priority": "P1",
        "progress": 100,
        "startedAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-01T01:00:00Z",
        "duration": 3600,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 2. 创建测试任务

```http
POST /api/v1/llm/tasks

Request Body:
{
  "name": "GPT-4 性能基准测试",
  "modelId": "model-uuid",
  "type": "性能测试",
  "priority": "P1",
  "config": {
    "datasets": ["MMLU", "HellaSwag", "HumanEval"],
    "maxTokens": 2048,
    "temperature": 0.7
  }
}

Response 201:
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "task-uuid",
    "name": "GPT-4 性能基准测试",
    "modelId": "model-uuid",
    "modelName": "GPT-4",
    "type": "性能测试",
    "status": "pending",
    "priority": "P1",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 获取测试任务详情

```http
GET /api/v1/llm/tasks/{id}

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "task-uuid",
    "name": "GPT-4 性能基准测试",
    "modelId": "model-uuid",
    "modelName": "GPT-4",
    "type": "性能测试",
    "status": "completed",
    "priority": "P1",
    "progress": 100,
    "config": {
      "datasets": ["MMLU", "HellaSwag", "HumanEval"],
      "maxTokens": 2048,
      "temperature": 0.7
    },
    "results": {
      "overall": 95.5,
      "languageUnderstanding": 96.2,
      "reasoning": 94.8,
      "coding": 95.3
    },
    "startedAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T01:00:00Z",
    "duration": 3600,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. 取消测试任务

```http
POST /api/v1/llm/tasks/{id}/cancel

Response 200:
{
  "code": 200,
  "message": "任务已取消",
  "data": {
    "id": "task-uuid",
    "status": "cancelled",
    "cancelledAt": "2024-01-01T00:30:00Z"
  }
}
```

---

## 📈 测试结果管理 API

### 1. 获取测试结果列表

```http
GET /api/v1/llm/results

Query Parameters:
- page: 页码（默认：1）
- pageSize: 每页数量（默认：10）
- modelId: 模型ID筛选（可选）
- taskId: 任务ID筛选（可选）

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "result-uuid",
        "taskId": "task-uuid",
        "modelId": "model-uuid",
        "modelName": "GPT-4",
        "scores": {
          "overall": 95.5,
          "languageUnderstanding": 96.2,
          "reasoning": 94.8,
          "coding": 95.3
        },
        "testedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

### 2. 获取测试结果详情

```http
GET /api/v1/llm/results/{id}

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "result-uuid",
    "taskId": "task-uuid",
    "modelId": "model-uuid",
    "modelName": "GPT-4",
    "scores": {
      "overall": 95.5,
      "languageUnderstanding": 96.2,
      "reasoning": 94.8,
      "coding": 95.3,
      "math": 93.7,
      "creativity": 96.1
    },
    "subTaskScores": {
      "languageUnderstanding": {
        "readingComprehension": { "score": 96.5, "metric": "accuracy" },
        "sentimentAnalysis": { "score": 95.8, "metric": "accuracy" }
      }
    },
    "testedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🔄 对比分析 API

### 1. 获取对比列表

```http
GET /api/v1/llm/comparisons

Query Parameters:
- page: 页码（默认：1）
- pageSize: 每页数量（默认：10）
- category: 类别筛选（可选）

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "comparison-uuid",
        "name": "GPT-4 vs Claude-3 对比",
        "category": "性能对比",
        "modelIds": ["model-uuid-1", "model-uuid-2"],
        "modelNames": ["GPT-4", "Claude-3"],
        "winner": "GPT-4",
        "isStarred": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

### 2. 创建对比分析

```http
POST /api/v1/llm/comparisons

Request Body:
{
  "name": "GPT-4 vs Claude-3 对比",
  "category": "性能对比",
  "modelIds": ["model-uuid-1", "model-uuid-2"],
  "dimensionWeights": {
    "languageUnderstanding": 0.2,
    "reasoning": 0.2,
    "coding": 0.2,
    "math": 0.2,
    "creativity": 0.2
  }
}

Response 201:
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "comparison-uuid",
    "name": "GPT-4 vs Claude-3 对比",
    "category": "性能对比",
    "modelIds": ["model-uuid-1", "model-uuid-2"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 获取对比详情

```http
GET /api/v1/llm/comparisons/{id}

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "comparison-uuid",
    "name": "GPT-4 vs Claude-3 对比",
    "category": "性能对比",
    "models": [
      {
        "id": "model-uuid-1",
        "name": "GPT-4",
        "vendor": "OpenAI",
        "scores": {
          "overall": 95.5,
          "languageUnderstanding": 96.2,
          "reasoning": 94.8,
          "coding": 95.3
        }
      },
      {
        "id": "model-uuid-2",
        "name": "Claude-3",
        "vendor": "Anthropic",
        "scores": {
          "overall": 94.2,
          "languageUnderstanding": 95.1,
          "reasoning": 93.5,
          "coding": 94.0
        }
      }
    ],
    "overallAnalysis": {
      "bestModel": "GPT-4",
      "worstModel": "Claude-3",
      "summary": "GPT-4 在各项指标上均优于 Claude-3"
    },
    "dimensionAnalysis": [
      {
        "dimension": "languageUnderstanding",
        "bestModel": "GPT-4",
        "worstModel": "Claude-3",
        "avgScore": 95.65,
        "analysis": "GPT-4 在语言理解方面表现更好"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. 收藏对比

```http
POST /api/v1/llm/comparisons/{id}/star

Response 200:
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "id": "comparison-uuid",
    "isStarred": true
  }
}
```

### 5. 删除对比

```http
DELETE /api/v1/llm/comparisons/{id}

Response 200:
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 📊 数据集管理 API

### 1. 获取数据集列表

```http
GET /api/v1/llm/datasets

Query Parameters:
- page: 页码（默认：1）
- pageSize: 每页数量（默认：10）
- category: 类别筛选（可选）

Response 200:
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "dataset-uuid",
        "name": "MMLU",
        "category": "语言理解",
        "description": "大规模多任务语言理解数据集",
        "size": "57GB",
        "samples": 15908,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

### 2. 上传数据集

```http
POST /api/v1/llm/datasets

Request Body (multipart/form-data):
- name: 数据集名称
- category: 类别
- description: 描述
- file: 数据集文件

Response 201:
{
  "code": 201,
  "message": "上传成功",
  "data": {
    "id": "dataset-uuid",
    "name": "MMLU",
    "category": "语言理解",
    "size": "57GB",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 🔌 WebSocket 实时通信

### 1. 任务状态更新

```javascript
ws://localhost:8000/ws/llm/tasks/{taskId}

// 连接成功后接收实时更新
{
  "type": "task_update",
  "data": {
    "taskId": "task-uuid",
    "status": "running",
    "progress": 45,
    "currentStep": "正在测试语言理解能力",
    "timestamp": "2024-01-01T00:15:00Z"
  }
}
```

---

## 🚀 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 📝 数据模型

### LLMModel

```typescript
interface LLMModel {
  id: string;
  name: string;
  vendor: string;
  version: string;
  status: 'pending' | 'testing' | 'tested';
  capabilities: string[];
  scores: {
    overall: number;
    languageUnderstanding: number;
    reasoning: number;
    coding: number;
    math: number;
    creativity: number;
  };
  subTaskScores?: Record<string, Record<string, { score: number; metric: string }>>;
  testedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### LLMTask

```typescript
interface LLMTask {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  progress: number;
  config: Record<string, any>;
  results?: Record<string, number>;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt?: string;
}
```

### LLMComparison

```typescript
interface LLMComparison {
  id: string;
  name: string;
  category: string;
  modelIds: string[];
  modelNames: string[];
  winner?: string;
  dimensionWeights: Record<string, number>;
  overallAnalysis: {
    bestModel: string;
    worstModel: string;
    summary: string;
  };
  dimensionAnalysis: Array<{
    dimension: string;
    bestModel: string;
    worstModel: string;
    avgScore: number;
    analysis: string;
  }>;
  isStarred: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

---

## 🎯 最佳实践

### 1. 分页查询

```javascript
// 推荐：使用分页参数
GET /api/v1/llm/models?page=1&pageSize=20

// 不推荐：一次性获取所有数据
GET /api/v1/llm/models?pageSize=1000
```

### 2. 错误处理

```javascript
try {
  const response = await fetch('/api/v1/llm/models');
  const data = await response.json();
  
  if (data.code !== 200) {
    console.error('API Error:', data.message);
    return;
  }
  
  // 处理成功响应
  console.log('Models:', data.data.items);
} catch (error) {
  console.error('Network Error:', error);
}
```

### 3. Token 刷新

```javascript
// 在 token 过期前刷新
const refreshToken = async () => {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${refreshToken}`
    }
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.data.access_token);
};
```

---

## 📞 技术支持

如有问题，请联系：
- Email: support@aibenchmark.com
- GitHub: https://github.com/aibenchmark/api-docs
