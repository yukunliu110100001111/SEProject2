# GreenBite API 文档 v1.3

更新日期：2026-04-25

适用范围：

- 本文档以当前 `backend/` 代码实现为准
- 本版覆盖 Auth、用户、菜品、推荐、订单、食材库存、Dashboard、报表、AI 助手接口
- 若旧文档与当前实现不一致，以本版为准

---

# 一、通用约定

## 1.1 Base URL

开发环境通常为：

```text
http://localhost:8080
```

前端开发服务器通过 Vite 代理访问后端：

- `/api/**` -> 后端业务接口
- `/uploads/**` -> 后端静态图片资源

说明：

- 菜品图片 `imageUrl` 返回的是 `/uploads/...`
- 如果前端开发环境没有代理 `/uploads`，上传成功后图片也不会显示

## 1.2 认证方式

除 `/health`、`/auth/login`、`/auth/register` 外，其余接口都需要：

```http
Authorization: Bearer <token>
```

## 1.3 请求格式

- 默认：`Content-Type: application/json`
- 图片上传：`multipart/form-data`

## 1.4 统一响应格式

成功：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

失败：

```json
{
  "code": 400,
  "message": "error message",
  "data": null
}
```

## 1.5 常用错误码

- `400` 参数错误
- `401` 未登录 / token 无效
- `403` 无权限
- `404` 资源不存在
- `409` 业务冲突
- `500` 服务器错误
- `502` AI 工具调用次数过多
- `503` AI 服务未配置或暂不可用

## 1.6 分页结构

分页接口统一返回：

```json
{
  "page": 1,
  "size": 20,
  "total": 0,
  "items": []
}
```

分页参数约定：

- `page` 从 1 开始，默认 1
- `size` 默认 20，最大 100

## 1.7 时间与文件路径

- 时间字段统一为 ISO 8601 字符串
- 图片路径示例：

```text
/uploads/meals/meal-1-1745560000000.png
```

---

# 二、健康检查

## 2.1 GET /health

用途：

- 检查服务是否可用

Response.data:

```json
{
  "status": "ok"
}
```

---

# 三、Auth 模块

## 3.1 POST /auth/login

用途：

- 用户登录

Request:

```json
{
  "username": "customer1",
  "password": "123456"
}
```

Response.data:

```json
{
  "userId": 1,
  "username": "customer1",
  "role": "customer",
  "token": "token-1-abcd1234"
}
```

## 3.2 POST /auth/register

用途：

- 用户注册

说明：

- 当前实现注册角色固定为 `customer`
- 当前实现注册成功后直接返回 token

Request:

```json
{
  "username": "customer2",
  "password": "123456"
}
```

Response.data:

```json
{
  "userId": 4,
  "username": "customer2",
  "role": "customer",
  "token": "token-4-efgh5678"
}
```

---

# 四、用户模块

## 4.1 GET /users/{id}

用途：

- 获取用户资料和偏好

权限：

- 本人
- `staff`
- `admin`

Response.data:

```json
{
  "userId": 1,
  "username": "customer1",
  "role": "customer",
  "preferences": {
    "targetCalories": 2000,
    "targetProtein": 80,
    "isVegetarian": false,
    "allergens": ["nut"]
  }
}
```

## 4.2 PUT /users/{id}

用途：

- 更新用户名

权限：

- 本人
- `admin`

Request:

```json
{
  "username": "customer1_new"
}
```

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

## 4.3 PUT /users/{id}/preferences

用途：

- 更新用户饮食偏好

权限：

- 当前实现仅本人、`admin`

Request:

```json
{
  "targetCalories": 1800,
  "targetProtein": 90,
  "isVegetarian": true,
  "allergens": ["nut", "fish"]
}
```

`allergens` 语义：

- 不传：保留现有过敏原
- 传 `[]`：清空过敏原
- 传数组：覆盖更新

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

# 五、菜品模块

## 5.1 GET /meals

用途：

- 获取菜品列表

权限：

- `customer`
- `staff`
- `admin`

Query 参数：

- `keyword`：可选，按菜品名称过滤
- `tag`：可选，按标签过滤
- `lowCarbonOnly`：可选，`true` 时只返回低碳菜品

Response.data:

```json
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "calories": 450,
    "protein": 30,
    "sustainabilityScore": 8,
    "imageUrl": "/uploads/meals/meal-1-1745560000000.png"
  }
]
```

## 5.2 GET /meals/{id}

用途：

- 获取菜品详情

权限：

- `customer`
- `staff`
- `admin`

Query 参数：

- `recommendationRequestId`：可选，用于记录推荐点击
- `recommendationRankPosition`：可选，推荐位次

Response.data:

```json
{
  "mealId": 1,
  "name": "Chicken Salad",
  "description": "classic",
  "calories": 450,
  "protein": 30,
  "sustainabilityScore": 8,
  "imageUrl": "/uploads/meals/meal-1-1745560000000.png",
  "ingredients": [
    {
      "ingredientId": 1,
      "name": "Chicken",
      "weight_g": 150
    }
  ],
  "tags": ["low-carbon", "high-protein"]
}
```

## 5.3 POST /meals

用途：

- 创建菜品

权限：

- `staff`
- `admin`

Request:

```json
{
  "name": "Tofu Bowl",
  "description": "vegan",
  "calories": 320,
  "protein": 18,
  "sustainabilityScore": 9,
  "tags": ["low-carbon"],
  "ingredients": [
    {
      "ingredientId": 2,
      "weight_g": 120
    }
  ]
}
```

Response.data:

```json
{
  "mealId": 8
}
```

## 5.4 PUT /meals/{id}

用途：

- 更新菜品

权限：

- `staff`
- `admin`

说明：

- `tags` 不传：不修改标签
- `ingredients` 不传：不修改配方
- 传空数组：清空对应部分

## 5.5 DELETE /meals/{id}

用途：

- 删除菜品

权限：

- `staff`
- `admin`

说明：

- 当前实现为逻辑删除

## 5.6 POST /meals/{id}/image

用途：

- 上传菜品图片

权限：

- `staff`
- `admin`

请求类型：

- `multipart/form-data`

表单字段：

- `file`：必填

限制：

- 支持 `image/jpeg`
- 支持 `image/png`
- 支持 `image/webp`
- 最大 5 MB

Response.data:

```json
{
  "mealId": 1,
  "imageUrl": "/uploads/meals/meal-1-1745560000000.png"
}
```

---

# 六、推荐模块

## 6.1 GET /recommendations?userId=1

用途：

- 获取用户推荐列表

权限：

- 本人
- `staff`
- `admin`

说明：

- 当前实现会返回推荐请求 ID、推荐位次、过敏原冲突标记和分项得分
- 每次调用会记录推荐曝光事件

推荐分公式：

```text
score = 0.4 * health + 0.3 * preference + 0.2 * sustainability + 0.1 * stock
```

Response.data:

```json
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "score": 0.82,
    "reason": "high stock + healthy match",
    "calories": 450,
    "protein": 30,
    "sustainabilityScore": 8,
    "imageUrl": "/uploads/meals/meal-1-1745560000000.png",
    "allergenConflict": false,
    "recommendationRequestId": "req-1-1745560000000",
    "recommendationRankPosition": 1,
    "scoreBreakdown": {
      "healthScore": 0.31,
      "preferenceScore": 0.30,
      "sustainabilityScorePart": 0.16,
      "stockPriorityScore": 0.10
    }
  }
]
```

---

# 七、订单模块

订单状态：

- `pending`
- `confirmed`
- `cancelled`

## 7.1 POST /orders

用途：

- 创建订单

权限：

- 本人
- `staff`
- `admin`

Request:

```json
{
  "userId": 1,
  "recommendationRequestId": "req-1-1745560000000",
  "items": [
    {
      "mealId": 2,
      "quantity": 2
    }
  ]
}
```

说明：

- `recommendationRequestId` 可省略
- 提供后会记录推荐被选中事件

Response.data:

```json
{
  "orderId": 1001,
  "status": "pending"
}
```

## 7.2 GET /orders/{id}

用途：

- 获取订单详情

权限：

- 订单所属用户本人
- `staff`
- `admin`

Response.data:

```json
{
  "orderId": 1001,
  "userId": 1,
  "status": "pending",
  "createdAt": "2026-04-25T10:30:12",
  "confirmedAt": null,
  "cancelledAt": null,
  "items": [
    {
      "mealId": 1,
      "quantity": 2,
      "name": "Chicken Salad",
      "calories": 450,
      "protein": 30,
      "sustainabilityScore": 8,
      "imageUrl": "/uploads/meals/meal-1-1745560000000.png"
    }
  ],
  "totalCalories": 900,
  "totalProtein": 60
}
```

## 7.3 GET /orders

用途：

- 获取订单列表

权限：

- `customer`：默认只能查自己
- `staff` / `admin`：可查全部，也可按用户过滤

Query 参数：

- `userId`：可选
- `status`：可选
- `page`：可选，默认 1
- `size`：可选，默认 20

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 1,
  "items": [
    {
      "orderId": 1001,
      "userId": 1,
      "status": "confirmed",
      "createdAt": "2026-04-25T10:30:12",
      "confirmedAt": "2026-04-25T10:31:05",
      "cancelledAt": null,
      "items": [],
      "totalCalories": 900,
      "totalProtein": 60
    }
  ]
}
```

## 7.4 POST /orders/{id}/confirm

用途：

- 确认订单并扣减库存

权限：

- 订单所属用户本人
- `staff`
- `admin`

说明：

- 只允许 `pending -> confirmed`
- 库存不足返回 `409`

Response.data:

```json
{
  "orderId": 1001,
  "status": "confirmed"
}
```

## 7.5 POST /orders/{id}/cancel

用途：

- 取消订单

权限：

- 订单所属用户本人
- `staff`
- `admin`

说明：

- 只允许 `pending -> cancelled`
- 已确认订单取消会返回 `409`

Response.data:

```json
{
  "orderId": 1001,
  "status": "cancelled"
}
```

---

# 八、食材与库存模块

库存状态：

- `normal`
- `high_stock`
- `near_expiry`

## 8.1 GET /ingredients

用途：

- 获取食材分页列表

权限：

- `staff`
- `admin`

Query 参数：

- `keyword`：可选，按名称过滤
- `expiryBefore`：可选，格式 `YYYY-MM-DD`
- `page`：可选，默认 1
- `size`：可选，默认 20

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 1,
  "items": [
    {
      "ingredientId": 1,
      "name": "Chicken",
      "allergens": ["fish", "nut"],
      "currentQty_g": 8000,
      "expiryDate": "2026-05-01",
      "stockStatus": "high_stock"
    }
  ]
}
```

## 8.2 GET /ingredients/{id}

用途：

- 获取食材详情

权限：

- `staff`
- `admin`

Response.data:

```json
{
  "ingredientId": 1,
  "name": "Chicken",
  "allergens": ["fish", "nut"],
  "currentQty_g": 8000,
  "expiryDate": "2026-05-01",
  "stockStatus": "high_stock"
}
```

## 8.3 POST /ingredients

用途：

- 创建食材

权限：

- `staff`
- `admin`

Request:

```json
{
  "name": "Broccoli",
  "currentQty_g": 3000,
  "expiryDate": "2026-03-30",
  "allergens": ["nut"]
}
```

Response.data:

```json
{
  "ingredientId": 20
}
```

## 8.4 PUT /ingredients/{id}

用途：

- 更新食材基础信息与过敏原

权限：

- `staff`
- `admin`

Request:

```json
{
  "name": "Broccoli Fresh",
  "allergens": ["nut", "soy"]
}
```

## 8.5 PUT /stock/{ingredientId}

用途：

- 更新库存数量与到期日

权限：

- `staff`
- `admin`

Request:

```json
{
  "currentQty_g": 5000,
  "expiryDate": "2026-03-20"
}
```

Response.data:

```json
{
  "ingredientId": 1,
  "stockStatus": "near_expiry"
}
```

---

# 九、Dashboard 与报表模块

## 9.1 GET /dashboard

用途：

- 获取管理员仪表盘数据

权限：

- `admin`

说明：

- 当前实现默认统计近 30 天

Response.data 主要字段：

```json
{
  "topMeals": [],
  "topRecommendedMeals": [],
  "topSelectedMeals": [],
  "topClickedMeals": [],
  "stockUsage": [],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [],
  "lowCarbonSelectionCount": 0,
  "lowCarbonRate": 0.45,
  "recommendationAnalytics": {}
}
```

## 9.2 GET /reports/sustainability

用途：

- 生成并保存一份可持续报告

权限：

- `admin`

Query 参数：

- `from`：可选，格式 `YYYY-MM-DD`
- `to`：可选，格式 `YYYY-MM-DD`

Response.data 主要字段：

```json
{
  "reportId": 1,
  "generatedAt": "2026-04-25T11:00:00",
  "summary": "本周期内低碳菜品选择占比为 45.00%。",
  "rangeStart": "2026-04-01",
  "rangeEnd": "2026-04-25",
  "topMeals": [],
  "topRecommendedMeals": [],
  "topSelectedMeals": [],
  "topClickedMeals": [],
  "stockUsage": [],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [],
  "lowCarbonSelectionCount": 3,
  "lowCarbonRate": 0.45,
  "recommendationAnalytics": {}
}
```

## 9.3 GET /reports/sustainability/history

用途：

- 获取已生成报告列表

权限：

- `admin`

Query 参数：

- `page`
- `size`

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 1,
  "items": [
    {
      "reportId": 1,
      "generatedAt": "2026-04-25T11:00:00",
      "summary": "本周期内低碳菜品选择占比为 45.00%。",
      "rangeStart": "2026-04-01",
      "rangeEnd": "2026-04-25",
      "generatedBy": 3
    }
  ]
}
```

## 9.4 GET /reports/sustainability/{id}

用途：

- 获取单个报告详情

权限：

- `admin`

说明：

- 返回结构与生成报告接口基本一致
- 一定包含 `reportId`
- 一定包含 `recommendationAnalytics`

## 9.5 GET /reports/recommendations/analytics

用途：

- 获取推荐行为分析

权限：

- `admin`

Query 参数：

- `from`
- `to`

Response.data 主要字段：

```json
{
  "rangeStart": "2026-04-01",
  "rangeEnd": "2026-04-25",
  "totalExposureCount": 20,
  "totalClickCount": 5,
  "totalSelectedCount": 3,
  "topRecommendedMeals": [],
  "topClickedMeals": [],
  "topSelectedMeals": [],
  "positionPerformance": []
}
```

---

# 十、AI 助手模块

## 10.1 POST /ai/chat

用途：

- 同步聊天

权限：

- 需要登录

Request:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "根据我的偏好推荐三道菜"
    }
  ]
}
```

Response.data:

```json
{
  "reply": "基于你的偏好，当前更推荐 2 号餐食。",
  "model": "doubao-seed-2-0-pro-260215",
  "toolCalls": ["get_recommendations"],
  "pendingAction": null
}
```

## 10.2 POST /ai/chat/stream

用途：

- 流式聊天

权限：

- 需要登录

返回类型：

- `text/event-stream`

SSE 事件类型：

1. `status`

```json
{
  "stage": "thinking",
  "message": "正在分析你的请求"
}
```

2. `tool_call`

```json
{
  "tool": "get_order_status"
}
```

3. `delta`

```json
{
  "content": "订单"
}
```

4. `action_required`

```json
{
  "actionId": "8d9d6d22-7c8d-4f9e-a1c1-1234567890ab",
  "actionType": "create_order",
  "summary": "我将为你创建订单，请确认。",
  "arguments": {
    "items": [
      {
        "mealId": 1,
        "quantity": 1
      }
    ]
  }
}
```

5. `done`

```json
{
  "reply": "订单 1 当前状态为 pending。",
  "model": "doubao-seed-2-0-pro-260215",
  "toolCalls": ["get_order_status"],
  "pendingAction": null
}
```

6. `error`

```json
{
  "message": "AI 助手暂时不可用"
}
```

## 10.3 POST /ai/actions/{actionId}/confirm

用途：

- 确认待执行写操作

权限：

- 需要登录
- 只能确认当前登录用户自己的待确认操作

当前支持：

- `update_preferences`
- `create_order`

Response.data 示例：

```json
{
  "reply": "已按确认内容更新你的饮食偏好。",
  "model": "local-action",
  "toolCalls": ["update_preferences"],
  "pendingAction": null
}
```

或：

```json
{
  "reply": "订单已创建，订单号是 1001，当前状态为 pending。",
  "model": "local-action",
  "toolCalls": ["create_order"],
  "pendingAction": null
}
```

## 10.4 AI 可用工具

当前工具集：

- `get_user_profile`
- `get_recommendations`
- `search_meals`
- `get_meal_detail`
- `get_inventory_summary`
- `get_order_status`

权限约束：

- 普通用户默认只能查自己的资料、推荐和订单
- `get_inventory_summary` 仅 `staff` / `admin`
- 写操作必须先生成待确认动作，不能直接写库

---

# 十一、权限速查

- 无需登录：
  - `GET /health`
  - `POST /auth/login`
  - `POST /auth/register`

- 本人、`staff`、`admin`：
  - `GET /users/{id}`
  - `GET /recommendations`
  - `POST /orders`
  - `GET /orders/{id}`
  - `POST /orders/{id}/confirm`
  - `POST /orders/{id}/cancel`

- 本人、`admin`：
  - `PUT /users/{id}`
  - `PUT /users/{id}/preferences`

- `customer` / `staff` / `admin`：
  - `GET /meals`
  - `GET /meals/{id}`

- `staff` / `admin`：
  - `POST /meals`
  - `PUT /meals/{id}`
  - `DELETE /meals/{id}`
  - `POST /meals/{id}/image`
  - `GET /ingredients`
  - `GET /ingredients/{id}`
  - `POST /ingredients`
  - `PUT /ingredients/{id}`
  - `PUT /stock/{ingredientId}`

- `admin`：
  - `GET /dashboard`
  - `GET /reports/sustainability`
  - `GET /reports/sustainability/history`
  - `GET /reports/sustainability/{id}`
  - `GET /reports/recommendations/analytics`

---

# 十二、演示账号

- Customer：`customer1 / 123456`
- Staff：`staff1 / 123456`
- Admin：`admin1 / 123456`
