# GreenBite API 补充文档：个性化定制与自定义订单

## 1. 概述

本文档补充说明个性化定制页面相关的后端接口变更，主要包括：

- customer 可读取食材列表和食材详情。
- customer 可提交自定义菜品订单。
- staff/admin 可查看全部订单。
- 订单项支持普通菜品和自定义菜品两种类型。

所有接口仍使用统一响应格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

认证方式仍为：

```http
Authorization: Bearer <token>
```

## 2. 食材接口

### 2.1 查询食材列表

```http
GET /ingredients
```

权限：

- customer
- staff
- admin

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | 否 | 按食材名称或过敏原关键字过滤 |
| expiryBefore | string | 否 | 过滤指定日期前过期的食材，格式 `YYYY-MM-DD` |
| page | number | 否 | 页码，默认 `1` |
| size | number | 否 | 每页数量，默认 `20`，最大 `100` |

响应示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "page": 1,
    "size": 20,
    "total": 15,
    "items": [
      {
        "ingredientId": 1,
        "name": "Chicken",
        "allergens": [],
        "currentQty_g": 8000,
        "expiryDate": "2026-05-19",
        "stockStatus": "high_stock"
      }
    ]
  }
}
```

说明：

- 本接口原先仅 staff/admin 可访问。
- 为支持个性化定制页面，现在 customer 也可以读取。
- customer 只能读取，不能创建或修改食材。

### 2.2 查询食材详情

```http
GET /ingredients/{id}
```

权限：

- customer
- staff
- admin

响应示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "ingredientId": 1,
    "name": "Chicken",
    "allergens": [],
    "currentQty_g": 8000,
    "expiryDate": "2026-05-19",
    "stockStatus": "high_stock"
  }
}
```

## 3. 订单接口

### 3.1 创建订单

```http
POST /orders
```

权限：

- customer：只能为自己创建订单
- staff/admin：可以为任意用户创建订单

请求体支持两种订单项：

- 普通菜品订单项
- 自定义菜品订单项

### 3.1.1 普通菜品订单项

请求示例：

```json
{
  "userId": 1,
  "recommendationRequestId": "req-test-orders-0001",
  "items": [
    {
      "mealId": 1,
      "quantity": 2
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 下单用户 ID |
| recommendationRequestId | string | 否 | 推荐请求 ID |
| items | array | 是 | 订单项列表 |
| items[].mealId | number | 是 | 菜品 ID |
| items[].quantity | number | 是 | 数量，必须大于 0 |

### 3.1.2 自定义菜品订单项

请求示例：

```json
{
  "userId": 1,
  "items": [
    {
      "custom": true,
      "name": "Custom bowl",
      "quantity": 1,
      "calories": 241,
      "protein": 35,
      "sustainabilityScore": 8,
      "ingredients": [
        {
          "ingredientId": 1,
          "name": "Chicken",
          "weight_g": 100
        },
        {
          "ingredientId": 4,
          "name": "Tofu",
          "weight_g": 200
        }
      ]
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 是 | 下单用户 ID |
| items | array | 是 | 订单项列表 |
| items[].custom | boolean | 是 | 自定义菜品订单项必须为 `true` |
| items[].name | string | 否 | 自定义菜品名称，默认 `Custom bowl` |
| items[].quantity | number | 是 | 数量，必须大于 0 |
| items[].calories | number | 否 | 自定义菜品热量快照 |
| items[].protein | number | 否 | 自定义菜品蛋白质快照 |
| items[].sustainabilityScore | number | 否 | 自定义菜品可持续性分数 |
| items[].imageUrl | string | 否 | 自定义菜品图片快照 |
| items[].ingredients | array | 是 | 自定义食材列表 |
| items[].ingredients[].ingredientId | number | 是 | 食材 ID |
| items[].ingredients[].name | string | 否 | 食材名称快照 |
| items[].ingredients[].weight_g | number | 是 | 食材重量，单位 g，必须大于 0 |

成功响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": 12,
    "status": "pending"
  }
}
```

错误响应：

| HTTP 状态 | code | 场景 |
| --- | --- | --- |
| 400 | 400 | 订单项为空 |
| 400 | 400 | quantity 非正数 |
| 400 | 400 | 自定义订单项缺少 ingredients |
| 400 | 400 | 自定义食材 weight_g 非正数 |
| 401 | 401 | 未登录或 token 无效 |
| 403 | 403 | customer 为其他用户创建订单 |
| 404 | 404 | mealId 或 ingredientId 不存在 |

### 3.2 查询订单列表

```http
GET /orders
```

权限和查询规则：

- customer：只能查询自己的订单。
- staff/admin：不传 `userId` 时查询全部订单。
- staff/admin：传 `userId` 时查询指定用户订单。

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| userId | number | 否 | 用户 ID |
| status | string | 否 | 订单状态：`pending`、`confirmed`、`cancelled` |
| page | number | 否 | 页码，默认 `1` |
| size | number | 否 | 每页数量，默认 `20`，最大 `100` |

customer 请求示例：

```http
GET /orders?userId=1&page=1&size=100
```

staff/admin 请求示例：

```http
GET /orders?page=1&size=100
```

响应示例：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "page": 1,
    "size": 100,
    "total": 1,
    "items": [
      {
        "orderId": 12,
        "userId": 1,
        "status": "pending",
        "createdAt": "2026-05-12T21:10:00",
        "confirmedAt": null,
        "cancelledAt": null,
        "items": [
          {
            "itemId": 20,
            "mealId": null,
            "quantity": 1,
            "custom": true,
            "name": "Custom bowl",
            "calories": 241,
            "protein": 35,
            "sustainabilityScore": 8,
            "imageUrl": null,
            "ingredients": [
              {
                "ingredientId": 1,
                "name": "Chicken",
                "weight_g": 100
              }
            ]
          }
        ],
        "totalCalories": 241,
        "totalProtein": 35
      }
    ]
  }
}
```

### 3.3 查询订单详情

```http
GET /orders/{id}
```

权限：

- customer：只能查询自己的订单。
- staff/admin：可以查询任意订单。

响应字段同订单列表中的单个订单对象。

### 3.4 确认订单

```http
POST /orders/{id}/confirm
```

权限：

- customer：只能确认自己的订单。
- staff/admin：可以确认任意订单。

行为：

- 普通菜品订单项：根据 `meal_ingredients` 扣减库存。
- 自定义菜品订单项：根据 `custom_ingredients_json` 中的 `ingredientId` 和 `weight_g` 扣减库存。
- 确认成功后订单状态变为 `confirmed`。

成功响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": 12,
    "status": "confirmed"
  }
}
```

错误响应：

| HTTP 状态 | code | 场景 |
| --- | --- | --- |
| 404 | 404 | 订单不存在 |
| 403 | 403 | 无权操作该订单 |
| 409 | 409 | 订单状态不是 pending |
| 409 | 409 | 库存不足 |

### 3.5 取消订单

```http
POST /orders/{id}/cancel
```

权限：

- customer：只能取消自己的订单。
- staff/admin：可以取消任意订单。

成功响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": 12,
    "status": "cancelled"
  }
}
```

## 4. 数据模型补充

### 4.1 order_items

本次变更后，`order_items` 支持自定义菜品。

关键字段：

| 字段 | 说明 |
| --- | --- |
| item_id | 订单项主键 |
| order_id | 所属订单 ID |
| meal_id | 普通菜品 ID；自定义菜品为 null |
| quantity | 数量 |
| meal_name_snapshot | 菜品名称快照 |
| calories_snapshot | 热量快照 |
| protein_snapshot | 蛋白质快照 |
| sustainability_score_snapshot | 可持续性分数快照 |
| image_url_snapshot | 图片快照 |
| custom_ingredients_json | 自定义食材 JSON |

自定义订单项示例：

```json
[
  {
    "ingredientId": 1,
    "name": "Chicken",
    "weight_g": 100
  },
  {
    "ingredientId": 4,
    "name": "Tofu",
    "weight_g": 200
  }
]
```

## 5. 前端调用说明

### 5.1 customer 订单页

customer 订单页应调用：

```js
getOrders({
  userId: auth.userId,
  page: 1,
  size: 100
})
```

### 5.2 staff/admin 订单页

staff/admin 订单页应调用：

```js
getOrders({
  page: 1,
  size: 100
})
```

不要传 `userId`，否则只能看到指定用户的订单。

## 6. 测试覆盖

### 6.1 后端测试

文件：

- `backend/src/test/java/site/bjut409/backend/integration/MvpFlowIntegrationTest.java`

新增覆盖：

- 自定义订单创建。
- 自定义订单详情返回。
- 自定义订单确认后扣减食材库存。
- customer 可读取食材列表和详情。

### 6.2 前端测试

文件：

- `frontend/src/test/Orders.test.jsx`

覆盖：

- customer 查询订单时带 `userId`。
- staff/admin 查询订单时不带 `userId`。

## 7. 兼容性说明

旧数据库中 `order_items` 原先使用 `(order_id, meal_id)` 作为复合主键，并且 `meal_id` 不允许为空。

为了支持自定义菜品：

- 新增 `item_id`。
- 删除旧复合主键。
- 将 `meal_id` 改为可空。
- 使用 `item_id` 作为主键。
- 新增 `custom_ingredients_json text`。

兼容迁移在后端启动时由 `DemoDataService.ensureSchemaCompatibility()` 执行。
