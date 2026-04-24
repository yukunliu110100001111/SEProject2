# GreenBite API 文档v1.2

更新日期：2026-04-24

说明：

- 本文档基于 `document/GreenBite API 文档v1.1.md` 与 `document/GreenBite API 补充文档 2026-04-24.md` 整理
- 本版以当前 `backend/` 已实现并已通过集成测试的接口为准
- 若补充文档中的某些增强项尚未在代码中落地，则不会写入本版正式接口定义

---

# 一、通用规范

## 1.1 请求格式

- 默认 `Content-Type: application/json`
- 需要登录的接口必须携带：

```http
Authorization: Bearer <token>
```

## 1.2 统一响应格式

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

## 1.3 通用错误码

- `400`：参数错误
- `401`：未登录 / token 无效
- `403`：无权限
- `404`：资源不存在
- `409`：状态冲突 / 用户名已存在 / 库存不足等业务冲突
- `500`：服务器错误

## 1.4 分页返回结构

本版新增列表接口采用：

```json
{
  "page": 1,
  "size": 20,
  "total": 0,
  "items": []
}
```

分页参数约定：

- `page`：从 1 开始，默认 1
- `size`：默认 20，最大 100

## 1.5 时间格式

- 时间字段统一返回 ISO 8601 字符串
- 订单列表按 `createdAt desc` 返回

---

# 二、健康检查

## 2.1 健康检查

`GET /health`

Response.data:

```json
{
  "status": "ok"
}
```

---

# 三、Auth 模块

## 3.1 登录

`POST /auth/login`

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
  "token": "token-xxx"
}
```

## 3.2 注册

`POST /auth/register`

说明：

- 当前实现注册后直接返回 token
- 当前实现注册角色固定为 `customer`

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
  "userId": 2,
  "username": "customer2",
  "role": "customer",
  "token": "token-xxx"
}
```

---

# 四、用户模块

## 4.1 获取用户信息

`GET /users/{id}`

权限：

- 仅本人、`staff`、`admin`

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

## 4.2 更新用户偏好

`PUT /users/{id}/preferences`

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

`allergens` 字段语义：

- 不传：不修改已有过敏原
- 传 `[]`：清空过敏原
- 传数组：覆盖更新过敏原

Response:

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

## 4.3 更新用户基本信息

`PUT /users/{id}`

权限：

- 仅本人、`admin`

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

---

# 五、菜品模块

## 5.1 获取所有菜品

`GET /meals`

权限：

- `customer` / `staff` / `admin`

Response.data:

```json
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "calories": 450,
    "protein": 30,
    "sustainabilityScore": 8,
    "imageUrl": null
  }
]
```

说明：

- 本版已补 `imageUrl`
- 本版已支持 `keyword`、`tag`、`lowCarbonOnly` 查询参数

## 5.2 获取菜品详情

`GET /meals/{id}`

权限：

- `customer` / `staff` / `admin`

Response.data:

```json
{
  "mealId": 1,
  "name": "Chicken Salad",
  "description": "classic",
  "calories": 450,
  "protein": 30,
  "sustainabilityScore": 8,
  "imageUrl": null,
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

说明：

- 本版已补 `sustainabilityScore` 与 `imageUrl`
- 本版已支持 `recommendationRequestId`、`recommendationRankPosition`，可用于推荐点击归因

## 5.3 创建菜品

`POST /meals`

权限：

- `staff` / `admin`

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

说明：

- `tags`、`ingredients` 可省略
- 省略时按空数组处理

Response.data:

```json
{
  "mealId": 11
}
```

## 5.4 更新菜品

`PUT /meals/{id}`

权限：

- `staff` / `admin`

Request:

```json
{
  "name": "Tofu Bowl 2",
  "description": "vegan2",
  "calories": 300,
  "protein": 20,
  "sustainabilityScore": 10,
  "tags": ["plant-based"],
  "ingredients": [
    {
      "ingredientId": 2,
      "weight_g": 150
    }
  ]
}
```

说明：

- `tags` / `ingredients` 不传：不修改该部分
- `tags` / `ingredients` 传空数组：清空该部分

## 5.5 删除菜品

`DELETE /meals/{id}`

权限：

- `staff` / `admin`

说明：

- 当前实现为逻辑删除

---

# 六、推荐模块

## 6.1 获取推荐列表

`GET /recommendations?userId=1`

权限：

- 本人、`staff`、`admin`

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
    "imageUrl": null,
    "allergenConflict": false,
    "recommendationRequestId": "req-1-1713952800000",
    "recommendationRankPosition": 1,
    "scoreBreakdown": {
      "healthScore": 0.29,
      "preferenceScore": 0.30,
      "sustainabilityScorePart": 0.16,
      "stockPriorityScore": 0.10
    }
  }
]
```

说明：

- 偏好匹配包含素食偏好与过敏原冲突
- 若存在过敏原冲突，`reason` 为 `allergen conflict`
- 本版已实现增强字段：`calories`、`protein`、`sustainabilityScore`、`imageUrl`、`allergenConflict`、`scoreBreakdown`
- 推荐结果当前会返回 `recommendationRequestId` 与 `recommendationRankPosition`，供后续详情点击和推荐链路下单使用

---

# 七、订单模块

## 7.1 创建订单

`POST /orders`

权限：

- 本人、`staff`、`admin`

Request:

```json
{
  "userId": 1,
  "recommendationRequestId": "req-20260424-0001",
  "items": [
    {
      "mealId": 2,
      "quantity": 2
    }
  ]
}
```

Response.data:

```json
{
  "orderId": 1001,
  "status": "pending"
}
```

## 7.2 获取订单详情

`GET /orders/{id}`

权限：

- 订单本人、`staff`、`admin`

Response.data:

```json
{
  "orderId": 1001,
  "userId": 1,
  "status": "pending",
  "createdAt": "2026-04-24T18:00:00",
  "items": [
    {
      "mealId": 1,
      "quantity": 2,
      "name": "Chicken Salad"
    }
  ],
  "totalCalories": 900,
  "totalProtein": 60
}
```

## 7.3 获取订单列表

`GET /orders`

查询参数：

- `userId`：可选
- `page`：默认 1
- `size`：默认 20
- `status`：可选，取值 `pending` / `confirmed` / `cancelled`

权限：

- `customer`：只能查自己；不传 `userId` 时默认查自己
- `staff` / `admin`：可查全部；也可通过 `userId` 查指定用户

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
      "status": "pending",
      "createdAt": "2026-04-24T18:00:00",
      "items": [
        {
          "mealId": 1,
          "quantity": 2,
          "name": "Chicken Salad"
        }
      ],
      "totalCalories": 900,
      "totalProtein": 60
    }
  ]
}
```

## 7.4 确认订单

`POST /orders/{id}/confirm`

说明：

- 状态从 `pending` 变为 `confirmed`
- 系统自动检查库存并扣减库存
- 若库存不足，返回 `409`
- 若订单状态不是 `pending`，返回 `409`

Response.data:

```json
{
  "orderId": 1001,
  "status": "confirmed"
}
```

## 7.5 取消订单

`POST /orders/{id}/cancel`

说明：

- 状态从 `pending` 变为 `cancelled`
- `confirmed` 订单不可取消，返回 `409`

Response.data:

```json
{
  "orderId": 1001,
  "status": "cancelled"
}
```

## 7.6 订单状态

- `pending`
- `confirmed`
- `cancelled`

---

# 八、库存与食材模块

## 8.1 更新库存

`PUT /stock/{ingredientId}`

权限：

- `staff` / `admin`

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
  "stockStatus": "normal"
}
```

库存状态：

- `normal`
- `high_stock`
- `near_expiry`

## 8.2 创建食材

`POST /ingredients`

权限：

- `staff` / `admin`

Request:

```json
{
  "name": "Broccoli New",
  "currentQty_g": 3000,
  "expiryDate": "2026-03-30",
  "allergens": ["nut"]
}
```

Response.data:

```json
{
  "ingredientId": 16
}
```

## 8.3 更新食材

`PUT /ingredients/{id}`

权限：

- `staff` / `admin`

Request:

```json
{
  "name": "Broccoli Fresh",
  "allergens": ["nut", "soy"]
}
```

## 8.4 获取食材列表

`GET /ingredients`

查询参数：

- `page`：默认 1
- `size`：默认 20

权限：

- `staff` / `admin`

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 15,
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

## 8.5 获取食材详情

`GET /ingredients/{id}`

权限：

- `staff` / `admin`

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

---

# 九、Dashboard 与 Report

## 9.1 Dashboard

`GET /dashboard`

权限：

- `admin`

Response.data:

```json
{
  "topMeals": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "count": 15
    }
  ],
  "stockUsage": [
    {
      "ingredientId": 1,
      "name": "Broccoli",
      "currentQty_g": 3000,
      "stockStatus": "normal"
    }
  ],
  "lowCarbonRate": 0.45,
  "topRecommendedMeals": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "count": 28
    }
  ],
  "topClickedMeals": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "count": 9
    }
  ],
  "topSelectedMeals": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "count": 15
    }
  ],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "sustainabilityScore": 8
    }
  ],
  "lowCarbonSelectionCount": 12,
  "recommendationAnalytics": {
    "rangeStart": "2026-03-26",
    "rangeEnd": "2026-04-24",
    "totalExposureCount": 30,
    "totalClickCount": 9,
    "totalSelectedCount": 5,
    "clickThroughRate": 0.3,
    "selectionRate": 0.17,
    "clickToSelectionRate": 0.56,
    "topRecommendedMeals": [],
    "topClickedMeals": [],
    "topSelectedMeals": [],
    "positionPerformance": [
      {
        "rankPosition": 1,
        "exposureCount": 10,
        "clickCount": 4,
        "selectedCount": 2,
        "clickThroughRate": 0.4,
        "selectionRate": 0.2,
        "clickToSelectionRate": 0.5
      }
    ]
  }
}
```

说明：

- 保留 v1.1 兼容字段：`topMeals`、`stockUsage`、`lowCarbonRate`
- 本版已补 `topRecommendedMeals`、`topClickedMeals`、`topSelectedMeals`、`highStockIngredients`、`nearExpiryIngredients`、`mealSustainabilityStats`、`lowCarbonSelectionCount`
- `recommendationAnalytics` 为推荐链路增强统计，默认统计最近 30 天

## 9.2 可持续报告

`GET /reports/sustainability`

查询参数：

- `from`：可选，格式 `YYYY-MM-DD`
- `to`：可选，格式 `YYYY-MM-DD`

权限：

- `admin`

Response.data:

```json
{
  "reportId": 1,
  "generatedAt": "2026-04-24T18:00:00",
  "summary": "过去 30 天低碳餐选择率为 45%，高库存食材主要集中在 broccoli 和 tofu。",
  "rangeStart": "2026-03-26",
  "rangeEnd": "2026-04-24",
  "topMeals": [],
  "stockUsage": [],
  "lowCarbonRate": 0.45,
  "topRecommendedMeals": [],
  "topClickedMeals": [],
  "topSelectedMeals": [],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [],
  "lowCarbonSelectionCount": 12,
  "recommendationAnalytics": {
    "rangeStart": "2026-03-26",
    "rangeEnd": "2026-04-24",
    "totalExposureCount": 30,
    "totalClickCount": 9,
    "totalSelectedCount": 5,
    "clickThroughRate": 0.3,
    "selectionRate": 0.17,
    "clickToSelectionRate": 0.56,
    "topRecommendedMeals": [],
    "topClickedMeals": [],
    "topSelectedMeals": [],
    "positionPerformance": []
  }
}
```

说明：

- 调用即生成并落库一份报告历史
- 不传 `from` / `to` 时默认统计最近 30 天

## 9.3 报告历史

`GET /reports/sustainability/history`

查询参数：

- `page`：默认 1
- `size`：默认 20

权限：

- `admin`

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 1,
  "items": [
    {
      "reportId": 1,
      "summary": "过去 30 天低碳餐选择率为 45%，高库存食材主要集中在 broccoli 和 tofu。",
      "generatedAt": "2026-04-24T18:00:00",
      "rangeStart": "2026-03-26",
      "rangeEnd": "2026-04-24"
    }
  ]
}
```

## 9.4 报告详情

`GET /reports/sustainability/{id}`

权限：

- `admin`

说明：

- 返回结构与 `GET /reports/sustainability` 一致，用于读取已落库报告

## 9.5 推荐分析

`GET /reports/recommendations/analytics`

查询参数：

- `from`：可选，格式 `YYYY-MM-DD`
- `to`：可选，格式 `YYYY-MM-DD`

权限：

- `admin`

Response.data:

```json
{
  "rangeStart": "2026-03-26",
  "rangeEnd": "2026-04-24",
  "totalExposureCount": 30,
  "totalClickCount": 9,
  "totalSelectedCount": 5,
  "clickThroughRate": 0.3,
  "selectionRate": 0.17,
  "clickToSelectionRate": 0.56,
  "topRecommendedMeals": [],
  "topClickedMeals": [],
  "topSelectedMeals": [],
  "positionPerformance": [
    {
      "rankPosition": 1,
      "exposureCount": 10,
      "clickCount": 4,
      "selectedCount": 2,
      "clickThroughRate": 0.4,
      "selectionRate": 0.2,
      "clickToSelectionRate": 0.5
    }
  ]
}
```

---

# 十、AI 助手模块

## 10.1 同步聊天

`POST /ai/chat`

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

## 10.2 流式聊天

`POST /ai/chat/stream`

权限：

- 需要登录

返回：

- `text/event-stream`

## 10.3 确认执行待确认操作

`POST /ai/actions/{actionId}/confirm`

权限：

- 需要登录

当前支持的待确认操作：

- `update_preferences`
- `create_order`

---

# 十一、实现说明

- 推荐事件链路当前已覆盖 `exposure` / `click` / `selected`
- `GET /reports/recommendations/analytics` 与 dashboard/report 中的 `recommendationAnalytics` 基于该事件表统计
- 报告已支持生成即落库、分页历史查询和单条详情读取
