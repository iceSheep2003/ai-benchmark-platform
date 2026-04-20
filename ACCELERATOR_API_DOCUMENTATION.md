# 加速卡测评系统 API 接口设计文档

## 📋 文档概述

**版本：** v1.0.0  
**基础路径：** `http://localhost:8000/api/v1/accelerator`  
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
    // 业务数据
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

## 🎯 一、加速卡管理接口

### 1.1 获取加速卡列表

**接口路径：** `GET /api/v1/accelerators`

**接口描述：** 获取加速卡列表，支持分页、搜索、筛选

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10，最大 100 |
| status | string | 否 | 状态筛选：pending, testing, tested |
| vendor | string | 否 | 厂商筛选：NVIDIA, AMD, Intel |
| search | string | 否 | 搜索关键词（名称、型号） |
| sortBy | string | 否 | 排序字段：created_at, name, scores.overall |
| sortOrder | string | 否 | 排序方向：asc, desc，默认 desc |

**请求示例：**

```http
GET /api/v1/accelerators?page=1&pageSize=10&status=tested&vendor=NVIDIA&search=H100&sortBy=scores.overall&sortOrder=desc
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "acc-550e8400-e29b-41d4-a716-446655440000",
        "name": "NVIDIA H100",
        "vendor": "NVIDIA",
        "model": "H100",
        "memory_gb": 80,
        "compute_capability": "9.0",
        "architecture": "Hopper",
        "status": "tested",
        "scores": {
          "overall": 95.5,
          "compute": 98.2,
          "memory": 92.1,
          "bandwidth": 96.3,
          "power_efficiency": 88.5
        },
        "metrics": {
          "fp32_tflops": 19.5,
          "fp16_tflops": 39.0,
          "int8_tops": 780,
          "memory_bandwidth_gbps": 900,
          "power_consumption_w": 700
        },
        "specifications": {
          "cuda_cores": 16896,
          "tensor_cores": 528,
          "base_clock_mhz": 1095,
          "boost_clock_mhz": 1980,
          "process_nm": 4
        },
        "tags": ["datacenter", "ai-training", "inference"],
        "description": "NVIDIA H100 是数据中心级别的 AI 加速卡...",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-02T00:00:00Z",
        "created_by": {
          "id": "user-uuid",
          "username": "admin",
          "full_name": "Admin User"
        }
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 1.2 获取加速卡详情

**接口路径：** `GET /api/v1/accelerators/{accelerator_id}`

**接口描述：** 根据加速卡 ID 获取详细信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**请求示例：**

```http
GET /api/v1/accelerators/acc-550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "name": "NVIDIA H100",
    "vendor": "NVIDIA",
    "model": "H100",
    "memory_gb": 80,
    "compute_capability": "9.0",
    "architecture": "Hopper",
    "status": "tested",
    "scores": {
      "overall": 95.5,
      "compute": 98.2,
      "memory": 92.1,
      "bandwidth": 96.3,
      "power_efficiency": 88.5,
      "stability": 94.2,
      "compatibility": 92.8
    },
    "metrics": {
      "fp32_tflops": 19.5,
      "fp16_tflops": 39.0,
      "int8_tops": 780,
      "memory_bandwidth_gbps": 900,
      "power_consumption_w": 700,
      "thermal_design_power_w": 700
    },
    "specifications": {
      "cuda_cores": 16896,
      "tensor_cores": 528,
      "base_clock_mhz": 1095,
      "boost_clock_mhz": 1980,
      "process_nm": 4,
      "transistors_billion": 80,
      "die_size_mm2": 814
    },
    "test_summary": {
      "total_tests": 15,
      "successful_tests": 14,
      "failed_tests": 1,
      "last_test_at": "2024-01-02T00:00:00Z"
    },
    "tags": ["datacenter", "ai-training", "inference"],
    "description": "NVIDIA H100 是数据中心级别的 AI 加速卡，基于 Hopper 架构...",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z",
    "created_by": {
      "id": "user-uuid",
      "username": "admin",
      "full_name": "Admin User",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 1.3 创建加速卡

**接口路径：** `POST /api/v1/accelerators`

**接口描述：** 创建新的加速卡记录

**请求头：**

```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```json
{
  "name": "NVIDIA H100",
  "vendor": "NVIDIA",
  "model": "H100",
  "memory_gb": 80,
  "compute_capability": "9.0",
  "architecture": "Hopper",
  "description": "数据中心级别 AI 加速卡",
  "specifications": {
    "cuda_cores": 16896,
    "tensor_cores": 528,
    "base_clock_mhz": 1095,
    "boost_clock_mhz": 1980,
    "process_nm": 4
  },
  "tags": ["datacenter", "ai-training"]
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| name | string | 是 | 加速卡名称，最大 255 字符 |
| vendor | string | 是 | 厂商名称，最大 100 字符 |
| model | string | 是 | 型号，最大 100 字符 |
| memory_gb | integer | 是 | 显存大小（GB） |
| compute_capability | string | 否 | 计算能力版本 |
| architecture | string | 否 | 架构名称 |
| description | string | 否 | 描述信息 |
| specifications | object | 否 | 详细规格参数 |
| tags | array | 否 | 标签列表 |

**响应示例：**

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "name": "NVIDIA H100",
    "vendor": "NVIDIA",
    "model": "H100",
    "memory_gb": 80,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z",
    "created_by": {
      "id": "user-uuid",
      "username": "admin"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 1.4 更新加速卡

**接口路径：** `PUT /api/v1/accelerators/{accelerator_id}`

**接口描述：** 更新加速卡信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**请求体：**

```json
{
  "name": "NVIDIA H100 PCIe",
  "description": "更新后的描述",
  "tags": ["datacenter", "ai-training", "pcie"]
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "name": "NVIDIA H100 PCIe",
    "updated_at": "2024-01-02T00:00:00Z"
  },
  "timestamp": "2024-01-02T00:00:00Z"
}
```

---

### 1.5 删除加速卡

**接口路径：** `DELETE /api/v1/accelerators/{accelerator_id}`

**接口描述：** 删除加速卡（软删除）

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**请求示例：**

```http
DELETE /api/v1/accelerators/acc-550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "删除成功",
  "timestamp": "2024-01-02T00:00:00Z"
}
```

---

## 🧪 二、测试任务管理接口

### 2.1 创建测试任务

**接口路径：** `POST /api/v1/accelerators/{accelerator_id}/tests`

**接口描述：** 为指定加速卡创建测试任务

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**请求体：**

```json
{
  "name": "H100 性能基准测试",
  "type": "performance",
  "priority": "P1",
  "config": {
    "test_duration_minutes": 60,
    "workload": "resnet50-training",
    "batch_size": 256,
    "precision": "FP16",
    "dataset": "ImageNet",
    "iterations": 1000
  },
  "resource_request": {
    "gpu_count": 1,
    "memory_gb": 80,
    "node_type": "high-memory"
  }
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| name | string | 是 | 测试任务名称 |
| type | string | 是 | 测试类型：performance, power, stability, compatibility |
| priority | string | 否 | 优先级：P0, P1, P2, P3，默认 P2 |
| config | object | 是 | 测试配置参数 |
| resource_request | object | 否 | 资源请求配置 |

**响应示例：**

```json
{
  "code": 201,
  "message": "测试任务创建成功",
  "data": {
    "id": "test-550e8400-e29b-41d4-a716-446655440000",
    "accelerator_id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "name": "H100 性能基准测试",
    "type": "performance",
    "status": "pending",
    "priority": "P1",
    "config": {
      "test_duration_minutes": 60,
      "workload": "resnet50-training",
      "batch_size": 256,
      "precision": "FP16",
      "dataset": "ImageNet",
      "iterations": 1000
    },
    "resource_request": {
      "gpu_count": 1,
      "memory_gb": 80,
      "node_type": "high-memory"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "estimated_start_time": "2024-01-01T00:10:00Z",
    "queue_position": 3,
    "created_by": {
      "id": "user-uuid",
      "username": "admin"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 2.2 获取测试任务列表

**接口路径：** `GET /api/v1/accelerators/{accelerator_id}/tests`

**接口描述：** 获取指定加速卡的测试任务列表

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| status | string | 否 | 状态筛选：pending, running, success, failed, cancelled |
| type | string | 否 | 类型筛选：performance, power, stability, compatibility |

**请求示例：**

```http
GET /api/v1/accelerators/acc-550e8400-e29b-41d4-a716-446655440000/tests?page=1&pageSize=10&status=success&type=performance
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "test-550e8400-e29b-41d4-a716-446655440000",
        "accelerator_id": "acc-550e8400-e29b-41d4-a716-446655440000",
        "name": "H100 性能基准测试",
        "type": "performance",
        "status": "success",
        "priority": "P1",
        "results": {
          "throughput": 1500,
          "latency_p50": 15,
          "latency_p99": 20,
          "errors": 0,
          "gpu_utilization_avg": 95.5,
          "memory_utilization_avg": 88.2,
          "power_consumption_avg": 650
        },
        "started_at": "2024-01-01T00:10:00Z",
        "completed_at": "2024-01-01T01:10:00Z",
        "duration_seconds": 3600,
        "created_at": "2024-01-01T00:00:00Z",
        "created_by": {
          "id": "user-uuid",
          "username": "admin"
        }
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 2.3 获取测试任务详情

**接口路径：** `GET /api/v1/tests/{test_id}`

**接口描述：** 获取测试任务的详细信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| test_id | string | 是 | 测试任务 ID |

**请求示例：**

```http
GET /api/v1/tests/test-550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "test-550e8400-e29b-41d4-a716-446655440000",
    "accelerator_id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "accelerator": {
      "id": "acc-550e8400-e29b-41d4-a716-446655440000",
      "name": "NVIDIA H100",
      "vendor": "NVIDIA",
      "model": "H100"
    },
    "name": "H100 性能基准测试",
    "type": "performance",
    "status": "success",
    "priority": "P1",
    "config": {
      "test_duration_minutes": 60,
      "workload": "resnet50-training",
      "batch_size": 256,
      "precision": "FP16",
      "dataset": "ImageNet",
      "iterations": 1000
    },
    "resource_request": {
      "gpu_count": 1,
      "memory_gb": 80,
      "node_type": "high-memory"
    },
    "resource_usage": {
      "actual_gpu_count": 1,
      "node_id": "node-01",
      "node_name": "gpu-node-01",
      "allocated_at": "2024-01-01T00:10:00Z"
    },
    "results": {
      "throughput": 1500,
      "throughput_unit": "images/sec",
      "latency_p50": 15,
      "latency_p99": 20,
      "latency_unit": "ms",
      "errors": 0,
      "error_rate": 0,
      "gpu_utilization_avg": 95.5,
      "gpu_utilization_max": 98.2,
      "gpu_utilization_min": 92.1,
      "memory_utilization_avg": 88.2,
      "memory_utilization_max": 92.5,
      "memory_utilization_min": 85.1,
      "power_consumption_avg": 650,
      "power_consumption_max": 680,
      "power_consumption_min": 620,
      "temperature_avg": 75,
      "temperature_max": 78,
      "temperature_min": 72
    },
    "started_at": "2024-01-01T00:10:00Z",
    "completed_at": "2024-01-01T01:10:00Z",
    "duration_seconds": 3600,
    "created_at": "2024-01-01T00:00:00Z",
    "created_by": {
      "id": "user-uuid",
      "username": "admin",
      "full_name": "Admin User"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 2.4 更新测试任务状态

**接口路径：** `PATCH /api/v1/tests/{test_id}/status`

**接口描述：** 更新测试任务状态（仅限管理员或任务执行者）

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| test_id | string | 是 | 测试任务 ID |

**请求体：**

```json
{
  "status": "running",
  "message": "开始执行测试"
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| status | string | 是 | 新状态：pending, running, success, failed, cancelled |
| message | string | 否 | 状态更新说明 |

**响应示例：**

```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": {
    "id": "test-550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "updated_at": "2024-01-01T00:10:00Z"
  },
  "timestamp": "2024-01-01T00:10:00Z"
}
```

---

### 2.5 取消测试任务

**接口路径：** `POST /api/v1/tests/{test_id}/cancel`

**接口描述：** 取消正在运行或等待中的测试任务

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| test_id | string | 是 | 测试任务 ID |

**请求体：**

```json
{
  "reason": "用户主动取消"
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "测试任务已取消",
  "data": {
    "id": "test-550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "cancelled_at": "2024-01-01T00:05:00Z"
  },
  "timestamp": "2024-01-01T00:05:00Z"
}
```

---

### 2.6 获取测试指标数据

**接口路径：** `GET /api/v1/tests/{test_id}/metrics`

**接口描述：** 获取测试任务的实时指标数据

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| test_id | string | 是 | 测试任务 ID |

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| start_time | string | 否 | 开始时间（ISO 8601 格式） |
| end_time | string | 否 | 结束时间（ISO 8601 格式） |
| interval | string | 否 | 采样间隔：1s, 5s, 10s, 1m，默认 10s |

**请求示例：**

```http
GET /api/v1/tests/test-550e8400-e29b-41d4-a716-446655440000/metrics?start_time=2024-01-01T00:10:00Z&end_time=2024-01-01T01:10:00Z&interval=1m
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "timestamp": "2024-01-01T00:10:00Z",
      "throughput": 1450,
      "latency_p50": 14,
      "latency_p99": 18,
      "gpu_utilization": 94.5,
      "memory_utilization": 87.2,
      "power_consumption": 640,
      "temperature": 75
    },
    {
      "timestamp": "2024-01-01T00:11:00Z",
      "throughput": 1480,
      "latency_p50": 15,
      "latency_p99": 19,
      "gpu_utilization": 95.2,
      "memory_utilization": 88.1,
      "power_consumption": 650,
      "temperature": 76
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📊 三、对比分析接口

### 3.1 创建对比分析

**接口路径：** `POST /api/v1/comparisons`

**接口描述：** 创建加速卡对比分析

**请求体：**

```json
{
  "name": "H100 vs A100 性能对比",
  "description": "对比两款数据中心级别加速卡的性能",
  "accelerator_ids": [
    "acc-550e8400-e29b-41d4-a716-446655440000",
    "acc-660e8400-e29b-41d4-a716-446655440001"
  ],
  "comparison_config": {
    "dimensions": ["compute", "memory", "bandwidth", "power_efficiency"],
    "metrics": ["throughput", "latency", "gpu_utilization"],
    "workloads": ["resnet50-training", "bert-inference"]
  },
  "tags": ["performance", "datacenter"]
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| name | string | 是 | 对比分析名称 |
| description | string | 否 | 描述信息 |
| accelerator_ids | array | 是 | 加速卡 ID 列表，至少 2 个 |
| comparison_config | object | 否 | 对比配置 |
| tags | array | 否 | 标签列表 |

**响应示例：**

```json
{
  "code": 201,
  "message": "对比分析创建成功",
  "data": {
    "id": "comp-550e8400-e29b-41d4-a716-446655440000",
    "name": "H100 vs A100 性能对比",
    "description": "对比两款数据中心级别加速卡的性能",
    "accelerator_ids": [
      "acc-550e8400-e29b-41d4-a716-446655440000",
      "acc-660e8400-e29b-41d4-a716-446655440001"
    ],
    "dimensions": {
      "compute": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 98.2,
        "acc-660e8400-e29b-41d4-a716-446655440001": 85.5
      },
      "memory": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 92.1,
        "acc-660e8400-e29b-41d4-a716-446655440001": 88.3
      },
      "bandwidth": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 96.3,
        "acc-660e8400-e29b-41d4-a716-446655440001": 90.1
      },
      "power_efficiency": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 88.5,
        "acc-660e8400-e29b-41d4-a716-446655440001": 92.1
      }
    },
    "summary": {
      "winner": "acc-550e8400-e29b-41d4-a716-446655440000",
      "winner_name": "NVIDIA H100",
      "cost_performance_ratio": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 1.2,
        "acc-660e8400-e29b-41d4-a716-446655440001": 1.0
      },
      "improvement_percentage": {
        "compute": 14.9,
        "memory": 4.3,
        "bandwidth": 6.9,
        "power_efficiency": -3.9
      }
    },
    "is_starred": false,
    "tags": ["performance", "datacenter"],
    "created_at": "2024-01-01T00:00:00Z",
    "created_by": {
      "id": "user-uuid",
      "username": "admin"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 3.2 获取对比列表

**接口路径：** `GET /api/v1/comparisons`

**接口描述：** 获取对比分析列表

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| page | integer | 否 | 页码，默认 1 |
| pageSize | integer | 否 | 每页数量，默认 10 |
| is_starred | boolean | 否 | 是否收藏 |
| created_by_me | boolean | 否 | 仅显示我创建的 |
| search | string | 否 | 搜索关键词 |

**请求示例：**

```http
GET /api/v1/comparisons?page=1&pageSize=10&is_starred=true
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "comp-550e8400-e29b-41d4-a716-446655440000",
        "name": "H100 vs A100 性能对比",
        "description": "对比两款数据中心级别加速卡的性能",
        "accelerator_ids": [
          "acc-550e8400-e29b-41d4-a716-446655440000",
          "acc-660e8400-e29b-41d4-a716-446655440001"
        ],
        "is_starred": true,
        "tags": ["performance", "datacenter"],
        "created_at": "2024-01-01T00:00:00Z",
        "created_by": {
          "id": "user-uuid",
          "username": "admin",
          "full_name": "Admin User"
        }
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 获取对比详情

**接口路径：** `GET /api/v1/comparisons/{comparison_id}`

**接口描述：** 获取对比分析详细信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| comparison_id | string | 是 | 对比分析 ID |

**请求示例：**

```http
GET /api/v1/comparisons/comp-550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": "comp-550e8400-e29b-41d4-a716-446655440000",
    "name": "H100 vs A100 性能对比",
    "description": "对比两款数据中心级别加速卡的性能",
    "accelerator_ids": [
      "acc-550e8400-e29b-41d4-a716-446655440000",
      "acc-660e8400-e29b-41d4-a716-446655440001"
    ],
    "accelerators": [
      {
        "id": "acc-550e8400-e29b-41d4-a716-446655440000",
        "name": "NVIDIA H100",
        "vendor": "NVIDIA",
        "model": "H100",
        "memory_gb": 80,
        "scores": {
          "overall": 95.5
        }
      },
      {
        "id": "acc-660e8400-e29b-41d4-a716-446655440001",
        "name": "NVIDIA A100",
        "vendor": "NVIDIA",
        "model": "A100",
        "memory_gb": 80,
        "scores": {
          "overall": 88.2
        }
      }
    ],
    "dimensions": {
      "compute": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 98.2,
        "acc-660e8400-e29b-41d4-a716-446655440001": 85.5,
        "unit": "TFLOPS",
        "description": "计算性能"
      },
      "memory": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 92.1,
        "acc-660e8400-e29b-41d4-a716-446655440001": 88.3,
        "unit": "GB/s",
        "description": "内存带宽"
      },
      "bandwidth": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 96.3,
        "acc-660e8400-e29b-41d4-a716-446655440001": 90.1,
        "unit": "GB/s",
        "description": "数据传输带宽"
      },
      "power_efficiency": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 88.5,
        "acc-660e8400-e29b-41d4-a716-446655440001": 92.1,
        "unit": "TFLOPS/W",
        "description": "能效比"
      }
    },
    "summary": {
      "winner": "acc-550e8400-e29b-41d4-a716-446655440000",
      "winner_name": "NVIDIA H100",
      "cost_performance_ratio": {
        "acc-550e8400-e29b-41d4-a716-446655440000": 1.2,
        "acc-660e8400-e29b-41d4-a716-446655440001": 1.0
      },
      "improvement_percentage": {
        "compute": 14.9,
        "memory": 4.3,
        "bandwidth": 6.9,
        "power_efficiency": -3.9
      },
      "recommendation": "H100 在计算性能方面显著领先，适合计算密集型任务；A100 在能效比方面更优，适合对功耗敏感的场景"
    },
    "is_starred": true,
    "tags": ["performance", "datacenter"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T00:00:00Z",
    "created_by": {
      "id": "user-uuid",
      "username": "admin",
      "full_name": "Admin User",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 3.4 收藏/取消收藏对比

**接口路径：** `POST /api/v1/comparisons/{comparison_id}/star`

**接口描述：** 收藏对比分析

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| comparison_id | string | 是 | 对比分析 ID |

**请求示例：**

```http
POST /api/v1/comparisons/comp-550e8400-e29b-41d4-a716-446655440000/star
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "id": "comp-550e8400-e29b-41d4-a716-446655440000",
    "is_starred": true
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**取消收藏：**

```http
DELETE /api/v1/comparisons/{comparison_id}/star
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "取消收藏成功",
  "data": {
    "id": "comp-550e8400-e29b-41d4-a716-446655440000",
    "is_starred": false
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 3.5 删除对比分析

**接口路径：** `DELETE /api/v1/comparisons/{comparison_id}`

**接口描述：** 删除对比分析（仅创建者可删除）

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| comparison_id | string | 是 | 对比分析 ID |

**请求示例：**

```http
DELETE /api/v1/comparisons/comp-550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "删除成功",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📈 四、性能指标接口

### 4.1 获取加速卡性能趋势

**接口路径：** `GET /api/v1/accelerators/{accelerator_id}/metrics/trend`

**接口描述：** 获取加速卡的历史性能趋势数据

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| accelerator_id | string | 是 | 加速卡 ID |

**查询参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| metric_type | string | 是 | 指标类型：throughput, latency, gpu_utilization, memory_utilization, power_consumption |
| start_date | string | 否 | 开始日期（YYYY-MM-DD） |
| end_date | string | 否 | 结束日期（YYYY-MM-DD） |
| interval | string | 否 | 时间间隔：day, week, month，默认 day |

**请求示例：**

```http
GET /api/v1/accelerators/acc-550e8400-e29b-41d4-a716-446655440000/metrics/trend?metric_type=throughput&start_date=2024-01-01&end_date=2024-01-31&interval=day
Authorization: Bearer {access_token}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "accelerator_id": "acc-550e8400-e29b-41d4-a716-446655440000",
    "metric_type": "throughput",
    "unit": "images/sec",
    "data_points": [
      {
        "date": "2024-01-01",
        "value": 1480,
        "test_count": 3
      },
      {
        "date": "2024-01-02",
        "value": 1500,
        "test_count": 2
      }
    ],
    "statistics": {
      "avg": 1490,
      "max": 1520,
      "min": 1450,
      "std_dev": 20.5
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🔌 五、WebSocket 实时通信

### 5.1 测试任务实时监控

**WebSocket 路径：** `ws://localhost:8000/ws/tests/{test_id}`

**连接示例：**

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/tests/test-550e8400-e29b-41d4-a716-446655440000');

ws.onopen = function() {
  console.log('WebSocket 连接成功');
};

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

ws.onerror = function(error) {
  console.error('WebSocket 错误:', error);
};
```

**消息格式：**

```json
{
  "type": "metrics_update",
  "test_id": "test-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T00:10:00Z",
  "data": {
    "throughput": 1480,
    "latency_p50": 15,
    "latency_p99": 19,
    "gpu_utilization": 95.2,
    "memory_utilization": 88.1,
    "power_consumption": 650,
    "temperature": 76
  }
}
```

**消息类型：**

| 类型 | 说明 |
|------|------|
| metrics_update | 性能指标更新 |
| status_update | 任务状态更新 |
| progress_update | 任务进度更新 |
| error_occurred | 错误发生 |
| test_completed | 测试完成 |

---

## ⚠️ 六、错误码定义

### HTTP 状态码

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无返回内容） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 请求格式错误 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

### 业务错误码

| 错误码 | 说明 |
|-------|------|
| 1001 | 用户名已存在 |
| 1002 | 邮箱已被注册 |
| 1003 | 用户名或密码错误 |
| 1004 | Token 无效 |
| 1005 | Token 已过期 |
| 2001 | 加速卡不存在 |
| 2002 | 加速卡名称已存在 |
| 2003 | 加速卡状态不允许操作 |
| 3001 | 测试任务不存在 |
| 3002 | 测试任务状态不允许操作 |
| 3003 | 资源不足 |
| 4001 | 对比分析不存在 |
| 4002 | 对比加速卡数量不足 |

**错误响应示例：**

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "ValidationError",
    "code": 1001,
    "details": {
      "field": "name",
      "message": "加速卡名称已存在"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📝 七、数据模型定义

### 7.1 加速卡模型

```typescript
interface Accelerator {
  id: string;
  name: string;
  vendor: string;
  model: string;
  memory_gb: number;
  compute_capability?: string;
  architecture?: string;
  status: 'pending' | 'testing' | 'tested';
  scores: {
    overall: number;
    compute: number;
    memory: number;
    bandwidth: number;
    power_efficiency: number;
    stability?: number;
    compatibility?: number;
  };
  metrics: {
    fp32_tflops?: number;
    fp16_tflops?: number;
    int8_tops?: number;
    memory_bandwidth_gbps?: number;
    power_consumption_w?: number;
  };
  specifications?: {
    cuda_cores?: number;
    tensor_cores?: number;
    base_clock_mhz?: number;
    boost_clock_mhz?: number;
    process_nm?: number;
  };
  tags?: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
  };
}
```

### 7.2 测试任务模型

```typescript
interface AcceleratorTest {
  id: string;
  accelerator_id: string;
  name: string;
  type: 'performance' | 'power' | 'stability' | 'compatibility';
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  config: Record<string, any>;
  resource_request?: {
    gpu_count: number;
    memory_gb: number;
    node_type?: string;
  };
  resource_usage?: {
    actual_gpu_count: number;
    node_id: string;
    node_name?: string;
    allocated_at?: string;
  };
  results?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  created_at: string;
  created_by?: {
    id: string;
    username: string;
  };
}
```

### 7.3 对比分析模型

```typescript
interface Comparison {
  id: string;
  name: string;
  description?: string;
  accelerator_ids: string[];
  accelerators?: Accelerator[];
  dimensions: Record<string, Record<string, number>>;
  summary: {
    winner: string;
    winner_name: string;
    cost_performance_ratio: Record<string, number>;
    improvement_percentage: Record<string, number>;
    recommendation?: string;
  };
  is_starred: boolean;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
  };
}
```

---

## 🚀 八、接口调用示例

### Python 示例

```python
import requests

# 登录获取 Token
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    data={
        'username': 'admin',
        'password': 'password123'
    }
)
token = login_response.json()['data']['access_token']

# 设置请求头
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# 获取加速卡列表
accelerators = requests.get(
    'http://localhost:8000/api/v1/accelerators',
    headers=headers,
    params={'page': 1, 'pageSize': 10}
)
print(accelerators.json())

# 创建测试任务
test = requests.post(
    'http://localhost:8000/api/v1/accelerators/acc-id/tests',
    headers=headers,
    json={
        'name': '性能测试',
        'type': 'performance',
        'priority': 'P1',
        'config': {
            'test_duration_minutes': 60,
            'workload': 'resnet50-training'
        }
    }
)
print(test.json())
```

### JavaScript 示例

```javascript
// 使用 axios
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
});

// 登录
const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await apiClient.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  const { access_token } = response.data.data;
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  
  return response.data.data;
};

// 获取加速卡列表
const getAccelerators = async (params) => {
  const response = await apiClient.get('/accelerators', { params });
  return response.data.data;
};

// 创建测试任务
const createTest = async (acceleratorId, testData) => {
  const response = await apiClient.post(`/accelerators/${acceleratorId}/tests`, testData);
  return response.data.data;
};

// 使用示例
(async () => {
  await login('admin', 'password123');
  const accelerators = await getAccelerators({ page: 1, pageSize: 10 });
  console.log(accelerators);
})();
```

---

## ✅ 九、最佳实践

### 1. 分页查询

- 使用 `page` 和 `pageSize` 参数
- 默认每页 10 条，最大 100 条
- 响应包含总数和总页数

### 2. 错误处理

- 检查 HTTP 状态码
- 解析错误响应中的 `error` 字段
- 根据错误码进行相应处理

### 3. Token 管理

- 存储 `access_token` 和 `refresh_token`
- 监听 401 错误，自动刷新 Token
- Token 过期后重新登录

### 4. 实时监控

- 使用 WebSocket 连接获取实时数据
- 处理连接断开和重连逻辑
- 合理设置心跳间隔

---

## 📊 十、性能建议

### 1. 缓存策略

- 缓存加速卡列表（5 分钟）
- 缓存加速卡详情（10 分钟）
- 不缓存测试任务列表（实时性要求高）

### 2. 批量操作

- 使用批量创建接口减少请求次数
- 批量查询时限制 ID 数量（最多 50 个）

### 3. 数据压缩

- 启用 Gzip 压缩
- 减少不必要的数据字段
- 使用字段选择参数（fields）

---

## 🎯 总结

本 API 设计文档涵盖了加速卡测评系统的核心功能：

1. **加速卡管理**：增删改查、状态管理
2. **测试任务管理**：创建、监控、取消
3. **对比分析**：创建、查看、收藏
4. **性能指标**：趋势分析、实时监控
5. **实时通信**：WebSocket 推送

所有接口都遵循 RESTful 规范，支持分页、筛选、排序，并提供详细的错误处理机制。文档中的示例代码可以直接用于开发！🚀
