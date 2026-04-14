# 一、通用规范

## 1. 请求格式
- Content-Type: application/json

## 2. 响应格式（统一）

成功：
{
  "code": 200,
  "message": "success",
  "data": {}
}

失败：
{
  "code": 400,
  "message": "error message"
}

---

## 3. 认证方式

所有需要登录的接口需在 Header 中携带：

Authorization: Bearer \<token>

---

## 4. 健康检查

GET /health

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "ok"
  }
}

---

# 二、Auth 模块

## 2.1 登录

POST /auth/login

Request:
{
  "username": "customer1",
  "password": "123456"
}

Response:
{
  "code": 200,
  "data": {
    "userId": 1,
    "username": "customer1",
    "role": "customer",
    "token": "xxx"
  }
}

---

## 2.2 注册

POST /auth/register

---

# 三、用户模块

## 3.1 获取用户信息

GET /users/{id}

说明：
- 仅本人、staff、admin 可调用

Response.data:
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

---

## 3.2 更新偏好

PUT /users/{id}/preferences

Request:
{
  "targetCalories": 2000,
  "targetProtein": 80,
  "isVegetarian": true,
  "allergens": ["nut", "fish"]
}

`allergens` 字段语义：
- 不传：不修改已有过敏原
- 传 `[]`：清空过敏原
- 传数组：覆盖更新过敏原

---

## 3.3 更新用户基本信息

PUT /users/{id}

Request:
{
  "username": "customer1_new"
}

---

# 四、菜品模块

## 4.1 获取所有菜品

GET /meals

Response.data:
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "calories": 450,
    "protein": 30,
    "sustainabilityScore": 8
  }
]

---

## 4.2 菜品详情

GET /meals/{id}

Response.data:
{
  "mealId": 1,
  "name": "Chicken Salad",
  "description": "...",
  "calories": 450,
  "protein": 30,
  "ingredients": [
    {
      "ingredientId": 1,
      "name": "Chicken",
      "weight_g": 150
    }
  ],
  "tags": ["low-carbon", "high-protein"]
}

---

## 4.3 员工维护菜品

POST /meals  
PUT /meals/{id}  
DELETE /meals/{id}

说明：
- 仅 staff/admin 可调用
- 创建/修改时可提交 `tags` 与 `ingredients`
- `tags` 与 `ingredients` 可省略
  - `POST /meals` 省略时按空数组处理
  - `PUT /meals/{id}` 省略时不修改该部分；传空数组则清空该部分

---

# 五、推荐模块

## 5.1 获取推荐列表

GET /recommendations?userId=1

说明：
推荐分计算公式：
score = w1*health + w2*preference + w3*sustainability + w4*stock

其中偏好匹配包含：
- 素食偏好匹配
- 过敏原冲突惩罚（若菜品包含用户过敏原，`reason` 返回 `allergen conflict`）

Response.data:
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "score": 0.82,
    "reason": "high stock + healthy match"
  }
]

---

# 六、订单模块（关键）

## 6.1 创建订单

POST /orders

Request:
{
  "userId": 1,
  "items": [
    {
      "mealId": 2,
      "quantity": 2
    }
  ]
}

Response.data:
{
  "orderId": 1001,
  "status": "pending"
}

---

## 6.2 确认订单

POST /orders/{id}/confirm

说明：
- 状态从 pending → confirmed
- 系统自动扣减库存

---

## 6.3 订单状态说明

pending：已创建  
confirmed：已确认（已扣库存）  
cancelled：已取消  

---

## 6.4 取消订单

POST /orders/{id}/cancel

说明：
- 状态从 pending → cancelled
- confirmed 订单不可取消，返回 409

---

# 七、库存模块

## 7.1 更新库存

PUT /stock/{ingredientId}

Request:
{
  "currentQty_g": 5000,
  "expiryDate": "2026-03-20"
}

说明：
系统自动判断：
- high stock
- near expiry

---

## 7.2 员工维护食材

POST /ingredients  
PUT /ingredients/{id}

说明：
- 仅 staff/admin 可调用
- 可在请求体提交 `allergens`（字符串数组），用于维护食材过敏原

POST /ingredients Request:
{
  "name": "Broccoli",
  "currentQty_g": 3000,
  "expiryDate": "2026-03-30",
  "allergens": ["nut"]
}

PUT /ingredients/{id} Request:
{
  "name": "Broccoli Fresh",
  "allergens": ["nut", "soy"]
}

---

# 八、Dashboard

## 8.1 获取数据

GET /dashboard

Response.data:
{
  "topMeals": [],
  "stockUsage": [],
  "lowCarbonRate": 0.45
}

---

## 8.2 可持续报告

GET /reports/sustainability

Response.data:
{
  "generatedAt": "2026-03-24T16:00:00",
  "summary": "sustainability report",
  "topMeals": [],
  "stockUsage": [],
  "lowCarbonRate": 0.45
}

---

# 九、AI 助手模块

## 9.1 同步聊天

POST /ai/chat

说明：
- 需要登录
- AI 会通过后端受限工具读取数据库，不直接暴露数据库连接
- 当前支持查询用户资料、推荐列表、菜品详情、库存摘要、订单状态
- 当用户请求写操作时，AI 不会直接执行，而是先返回待确认操作

Request:
{
  "messages": [
    {
      "role": "user",
      "content": "根据我的偏好推荐三道菜"
    }
  ]
}

Response.data:
{
  "reply": "基于你的偏好，当前更推荐 2 号餐食。",
  "model": "doubao-seed-2-0-pro-260215",
  "toolCalls": ["get_recommendations"],
  "pendingAction": null
}

如需确认写操作，`pendingAction` 示例：
{
  "reply": "我准备把你的目标热量改为 1700、蛋白质改为 95，并开启素食偏好。确认后我再执行。",
  "model": "doubao-seed-2-0-pro-260215",
  "toolCalls": [],
  "pendingAction": {
    "actionId": "8d9d6d22-7c8d-4f9e-a1c1-1234567890ab",
    "actionType": "update_preferences",
    "summary": "我准备把你的目标热量改为 1700、蛋白质改为 95，并开启素食偏好。确认后我再执行。",
    "arguments": {
      "targetCalories": 1700,
      "targetProtein": 95,
      "isVegetarian": true,
      "allergens": ["nut"]
    }
  }
}

---

## 9.2 流式聊天

POST /ai/chat/stream

Headers:
- Content-Type: application/json
- Authorization: Bearer \<token>

说明：
- 返回 `text/event-stream`
- 前端逐步接收 AI 状态、工具调用、文本增量和待确认操作

Request:
{
  "messages": [
    {
      "role": "user",
      "content": "查询我的订单状态，订单号是 1"
    }
  ]
}

SSE 事件类型：

1. `status`
data:
{
  "stage": "thinking",
  "message": "正在分析你的请求"
}

2. `tool_call`
data:
{
  "tool": "get_order_status"
}

3. `delta`
data:
{
  "content": "订单"
}

4. `action_required`
data:
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

5. `done`
data:
{
  "reply": "订单 1 当前状态为 pending。",
  "model": "doubao-seed-2-0-pro-260215",
  "toolCalls": ["get_order_status"],
  "pendingAction": null
}

6. `error`
data:
{
  "message": "AI 助手暂时不可用"
}

---

## 9.3 确认执行待确认操作

POST /ai/actions/{actionId}/confirm

说明：
- 需要登录
- 只能确认当前登录用户自己发起的待确认操作
- 当前支持的待确认操作：
  - `update_preferences`
  - `create_order`

Response.data:
{
  "reply": "已按确认内容更新你的饮食偏好。",
  "model": "local-action",
  "toolCalls": ["update_preferences"],
  "pendingAction": null
}

---

## 9.4 AI 可用数据库工具

当前 AI 侧可通过后端调用的受限工具如下：

- `get_user_profile`
- `get_recommendations`
- `search_meals`
- `get_meal_detail`
- `get_inventory_summary`
- `get_order_status`

权限说明：
- 普通用户默认只能查询自己的资料、推荐和订单
- `get_inventory_summary` 仅 staff/admin 可用
- 写操作必须走待确认流程，不允许模型直接写库

---

# 十、状态说明（重要）

库存状态：

- normal
- high_stock
- near_expiry

订单状态：

- pending
- confirmed
- cancelled

---

# 十一、错误码（建议）

200 成功  
400 参数错误  
401 未登录  
403 无权限  
404 资源不存在  
409 状态冲突  
500 服务器错误  

---

# 十二、鉴权与角色速查

- 不需要登录：`/health`、`/auth/login`、`/auth/register`
- 需要登录：其余所有接口
- 仅本人或 staff/admin：`GET /users/{id}`、`PUT /users/{id}/preferences`
- 仅本人或 admin：`PUT /users/{id}`
- customer/staff/admin：`GET /meals`、`GET /meals/{id}`
- 仅本人或 staff/admin：`GET /recommendations?userId=...`
- 仅本人或 staff/admin：`POST /orders`、`POST /orders/{id}/confirm`、`POST /orders/{id}/cancel`（基于订单所属用户）
- 仅 staff/admin：`/meals` 的增改删、`POST /ingredients`、`PUT /ingredients/{id}`、`PUT /stock/{ingredientId}`
- 仅 admin：`GET /dashboard`、`GET /reports/sustainability`
- 需要登录：`POST /ai/chat`、`POST /ai/chat/stream`、`POST /ai/actions/{actionId}/confirm`
- AI 查询库存摘要仅 staff/admin 可用
- AI 写操作不会直接执行，必须先确认
