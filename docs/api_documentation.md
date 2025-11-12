# 抑郁服药助手 - 字段和数据后端接口清单文档

## 1. 概述

本文档定义了抑郁服药助手应用的数据字段结构和后端API接口规范。虽然当前应用主要基于本地存储实现功能，但本接口清单可用于未来扩展云同步、数据备份或多设备同步等功能需求。

## 2. 数据模型与字段定义

### 2.1 药物信息 (Medicine)

| 字段名 | 数据类型 | 必选 | 描述 | 约束 |
|--------|----------|------|------|------|
| `id` | string | 是 | 药物唯一标识符 | UUID格式 |
| `name` | string | 是 | 药物名称 | 最大长度100字符 |
| `dosage` | string | 是 | 服药剂量 | 例如："半片"、"一片"、"一片半"、"两片" |
| `frequency` | string | 是 | 服药频率 | 枚举值："daily", "twice_daily", "three_times_daily", "as_needed" |
| `times` | string[] | 是 | 服药时间列表 | 格式：["08:00", "14:00", "20:00"] |
| `startDate` | string | 是 | 开始服药日期 | ISO日期格式：YYYY-MM-DD |
| `endDate` | string | 否 | 结束服药日期 | ISO日期格式：YYYY-MM-DD，可选 |
| `notes` | string | 否 | 药物备注信息 | 最大长度500字符，可选 |
| `isActive` | boolean | 是 | 是否启用 | true/false |
| `createdAt` | string | 是 | 创建时间 | ISO日期时间格式 |
| `updatedAt` | string | 是 | 更新时间 | ISO日期时间格式 |

### 2.2 服药记录 (MedicationRecord)

| 字段名 | 数据类型 | 必选 | 描述 | 约束 |
|--------|----------|------|------|------|
| `id` | string | 是 | 记录唯一标识符 | UUID格式 |
| `medicineId` | string | 是 | 关联的药物ID | 关联到Medicine表的id字段 |
| `medicineName` | string | 是 | 药物名称 | 冗余存储，便于查询显示 |
| `scheduledTime` | string | 是 | 计划服药时间 | ISO日期时间格式 |
| `takenTime` | string | 否 | 实际服药时间 | ISO日期时间格式，服药后填充 |
| `status` | string | 是 | 服药状态 | 枚举值："scheduled", "taken", "missed", "skipped" |
| `dosage` | string | 是 | 服药剂量 | 与关联药物的剂量一致 |
| `notes` | string | 否 | 服药记录备注 | 最大长度200字符，可选 |
| `createdAt` | string | 是 | 创建时间 | ISO日期时间格式 |

### 2.3 提醒设置 (ReminderSettings)

| 字段名 | 数据类型 | 必选 | 描述 | 约束 |
|--------|----------|------|------|------|
| `medicineId` | string | 是 | 关联的药物ID | 关联到Medicine表的id字段 |
| `enabled` | boolean | 是 | 是否启用提醒 | true/false |
| `advanceNotice` | number | 是 | 提前通知时间 | 单位：分钟，默认0 |
| `soundEnabled` | boolean | 是 | 是否启用声音提醒 | true/false |
| `vibrationEnabled` | boolean | 是 | 是否启用震动提醒 | true/false |
| `repeatInterval` | number | 是 | 重复提醒间隔 | 单位：分钟，默认15 |

### 2.4 情绪记录 (MoodRecord) - 扩展功能

| 字段名 | 数据类型 | 必选 | 描述 | 约束 |
|--------|----------|------|------|------|
| `id` | string | 是 | 记录唯一标识符 | UUID格式 |
| `recordDate` | string | 是 | 记录日期 | ISO日期格式：YYYY-MM-DD |
| `moodScore` | number | 是 | 情绪评分 | 1-5分 |
| `notes` | string | 否 | 情绪记录备注 | 最大长度200字符，可选 |
| `createdAt` | string | 是 | 创建时间 | ISO日期时间格式 |

## 3. 后端API接口清单

### 3.1 用户认证接口

#### 用户注册

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password",
    "name": "用户名称"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "用户名称",
      "token": "jwt-auth-token"
    }
  }
  ```

#### 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "用户名称",
      "token": "jwt-auth-token"
    }
  }
  ```

### 3.2 药物管理接口

#### 获取药物列表

- **URL**: `/api/medicines`
- **方法**: `GET`
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "med-123",
        "name": "百忧解",
        "dosage": "一片",
        "frequency": "daily",
        "times": ["08:00"],
        "startDate": "2023-06-01",
        "notes": "早餐后服用",
        "isActive": true,
        "createdAt": "2023-06-01T08:00:00Z",
        "updatedAt": "2023-06-01T08:00:00Z"
      }
    ]
  }
  ```

#### 添加新药物

- **URL**: `/api/medicines`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "name": "百忧解",
    "dosage": "一片",
    "frequency": "daily",
    "times": ["08:00"],
    "startDate": "2023-06-01",
    "notes": "早餐后服用",
    "isActive": true
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "med-123",
      "name": "百忧解",
      "dosage": "一片",
      "frequency": "daily",
      "times": ["08:00"],
      "startDate": "2023-06-01",
      "notes": "早餐后服用",
      "isActive": true,
      "createdAt": "2023-06-01T08:00:00Z",
      "updatedAt": "2023-06-01T08:00:00Z"
    }
  }
  ```

#### 更新药物信息

- **URL**: `/api/medicines/{medicineId}`
- **方法**: `PUT`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "name": "百忧解(更新)",
    "dosage": "一片半",
    "frequency": "daily",
    "times": ["09:00"],
    "startDate": "2023-06-01",
    "notes": "早餐后服用",
    "isActive": true
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "med-123",
      "name": "百忧解(更新)",
      "dosage": "一片半",
      "frequency": "daily",
      "times": ["09:00"],
      "startDate": "2023-06-01",
      "notes": "早餐后服用",
      "isActive": true,
      "createdAt": "2023-06-01T08:00:00Z",
      "updatedAt": "2023-06-10T10:00:00Z"
    }
  }
  ```

#### 删除药物

- **URL**: `/api/medicines/{medicineId}`
- **方法**: `DELETE`
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "message": "药物删除成功"
  }
  ```

### 3.3 服药记录接口

#### 获取服药记录列表

- **URL**: `/api/medication-records`
- **方法**: `GET`
- **查询参数**:
  - `startDate`: 开始日期 (YYYY-MM-DD)
  - `endDate`: 结束日期 (YYYY-MM-DD)
  - `status`: 记录状态 (scheduled/taken/missed/skipped)
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "record-123",
        "medicineId": "med-123",
        "medicineName": "百忧解",
        "scheduledTime": "2023-06-10T08:00:00Z",
        "takenTime": "2023-06-10T08:15:00Z",
        "status": "taken",
        "dosage": "一片",
        "notes": "",
        "createdAt": "2023-06-10T00:00:00Z"
      }
    ]
  }
  ```

#### 更新服药记录状态

- **URL**: `/api/medication-records/{recordId}`
- **方法**: `PATCH`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "status": "taken",
    "takenTime": "2023-06-10T08:15:00Z",
    "notes": "准时服用"
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "record-123",
      "medicineId": "med-123",
      "medicineName": "百忧解",
      "scheduledTime": "2023-06-10T08:00:00Z",
      "takenTime": "2023-06-10T08:15:00Z",
      "status": "taken",
      "dosage": "一片",
      "notes": "准时服用",
      "createdAt": "2023-06-10T00:00:00Z"
    }
  }
  ```

#### 获取服药统计数据

- **URL**: `/api/medication-records/stats`
- **方法**: `GET`
- **查询参数**:
  - `startDate`: 开始日期 (YYYY-MM-DD)
  - `endDate`: 结束日期 (YYYY-MM-DD)
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "totalScheduled": 30,
      "totalTaken": 28,
      "totalMissed": 2,
      "completionRate": 93.33,
      "dailyStats": [
        {
          "date": "2023-06-01",
          "scheduled": 1,
          "taken": 1,
          "missed": 0,
          "completionRate": 100
        }
      ]
    }
  }
  ```

### 3.4 提醒设置接口

#### 获取药物提醒设置

- **URL**: `/api/reminder-settings/{medicineId}`
- **方法**: `GET`
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "medicineId": "med-123",
      "enabled": true,
      "advanceNotice": 0,
      "soundEnabled": true,
      "vibrationEnabled": true,
      "repeatInterval": 15
    }
  }
  ```

#### 更新药物提醒设置

- **URL**: `/api/reminder-settings/{medicineId}`
- **方法**: `PUT`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "enabled": true,
    "advanceNotice": 5,
    "soundEnabled": true,
    "vibrationEnabled": false,
    "repeatInterval": 10
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "medicineId": "med-123",
      "enabled": true,
      "advanceNotice": 5,
      "soundEnabled": true,
      "vibrationEnabled": false,
      "repeatInterval": 10
    }
  }
  ```

### 3.5 数据备份和同步接口

#### 导出所有数据（备份）

- **URL**: `/api/export-data`
- **方法**: `GET`
- **认证**: 需要JWT token
- **成功响应**:
  ```json
  {
    "status": "success",
    "data": {
      "medicines": [...],
      "medicationRecords": [...],
      "reminderSettings": [...],
      "exportDate": "2023-06-10T10:00:00Z"
    }
  }
  ```

#### 导入数据（恢复）

- **URL**: `/api/import-data`
- **方法**: `POST`
- **认证**: 需要JWT token
- **请求体**:
  ```json
  {
    "medicines": [...],
    "medicationRecords": [...],
    "reminderSettings": [...]
  }
  ```
- **成功响应**:
  ```json
  {
    "status": "success",
    "message": "数据导入成功",
    "data": {
      "importedMedicines": 5,
      "importedRecords": 150,
      "importedSettings": 5
    }
  }
  ```

## 4. 安全与隐私

1. **数据加密**: 所有API传输使用HTTPS加密
2. **身份认证**: 基于JWT的无状态认证机制
3. **数据隔离**: 用户数据严格隔离，确保隐私
4. **权限控制**: 每个用户只能访问自己的数据
5. **敏感操作保护**: 关键数据操作需要验证

## 5. 接口设计原则

1. **RESTful规范**: 遵循REST设计原则
2. **版本控制**: API通过URL路径包含版本号
3. **统一响应格式**: 所有接口返回统一的JSON格式
4. **错误处理**: 提供明确的错误代码和描述
5. **可扩展性**: 设计考虑未来功能扩展

## 6. 当前实现说明

当前应用主要基于本地存储实现所有功能，使用AsyncStorage进行数据持久化。本接口清单文档提供了未来扩展到云服务的完整API设计，可以在保持现有功能的基础上平滑过渡到云同步架构。