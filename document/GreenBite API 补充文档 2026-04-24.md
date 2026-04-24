# GreenBite API 补充文档

更新日期：2026-04-24  
适用范围：

- 本文档为 `document/GreenBite API 文档v1.1.md` 的增量补充
- 旧文档已有接口、字段、权限定义保持有效
- 如本文档与旧文档冲突，以 `document/GreenBite API 文档v1.1.md` 为准
- 本文档只补充 2026-04-07 系列后端文档中明确提出、且旧 API 文档尚未写全的新增或增强内容

---

## 1. 通用补充规则

### 1.1 分页返回结构

新增列表型接口默认采用以下返回结构：

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

兼容说明：

- 若旧文档已明确某接口 `Response.data` 为数组，则该接口本轮不强制切换为分页对象
- 分页对象优先用于本次新增接口，例如 `GET /orders`、`GET /ingredients`
- 对旧接口如 `GET /meals`、`GET /recommendations`，本补充文档只补字段，不强制改响应外层结构

### 1.2 时间格式

- API 返回时间字段统一采用 ISO 8601 字符串
- 订单默认按 `createdAt desc` 返回
- 报告默认按 `generatedAt desc` 返回

### 1.3 图片上传特例

`document/GreenBite API 文档v1.1.md` 默认请求格式为 `application/json`。  
图片上传接口是特例，使用 `multipart/form-data`。

---

## 2. Auth 模块补充

### 2.1 注册响应补充

接口：

- `POST /auth/register`

兼容说明：

- v1.1 未明确写出注册响应
- 本补充文档将“注册成功直接返回 token”定为本轮默认实现方案，便于前端直接建立登录态

Request:

```json
{
  "username": "customer2",
  "password": "123456",
  "role": "customer"
}
```

Response.data:

```json
{
  "userId": 2,
  "username": "customer2",
  "role": "customer",
  "token": "xxx"
}
```

错误码补充：

- `400`：用户名为空、密码为空、参数非法
- `409`：用户名已存在

---

## 3. 菜品模块补充

### 3.1 获取所有菜品增强字段

接口：

- `GET /meals`

新增查询参数：

- `keyword`
- `tag`
- `lowCarbonOnly`

参数说明：

- `keyword`：按菜品名称模糊匹配
- `tag`：按可持续标签筛选
- `lowCarbonOnly=true`：仅返回 `sustainabilityScore >= 8` 的菜品

在保留 v1.1 原有字段基础上，建议每个菜品对象增加：

- `imageUrl`

Response.data:

```json
[
  {
    "mealId": 1,
    "name": "Chicken Salad",
    "calories": 450,
    "protein": 30,
    "sustainabilityScore": 8,
    "imageUrl": "/uploads/meals/meal-1-cover.jpg"
  }
]
```

### 3.2 菜品详情增强字段

接口：

- `GET /meals/{id}`

可选查询参数：

- `recommendationRequestId`
- `recommendationRankPosition`

参数用途：

- 当前端从推荐结果进入菜品详情页时，可携带 `recommendationRequestId`
- 后端据此记录一条推荐 `click` 事件
- `recommendationRankPosition` 用于记录该菜品在该次推荐结果中的位置
- 非推荐流进入详情页时，这两个参数均可不传

在 v1.1 原有响应基础上补充：

- `sustainabilityScore`
- `imageUrl`

Response.data:

```json
{
  "mealId": 1,
  "name": "Chicken Salad",
  "description": "...",
  "calories": 450,
  "protein": 30,
  "sustainabilityScore": 8,
  "imageUrl": "/uploads/meals/meal-1-cover.jpg",
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

### 3.3 菜品图片上传

本轮定稿接口：

- `POST /meals/{id}/image`

Headers:

- `Content-Type: multipart/form-data`
- `Authorization: Bearer <token>`

权限：

- 仅 `staff/admin`

Request:

- 表单字段名：`file`
- 单文件上传

Response.data:

```json
{
  "mealId": 1,
  "imageUrl": "/uploads/meals/meal-1-cover.jpg"
}
```

错误码补充：

- `400`：文件为空、文件类型非法、文件超大小限制
- `404`：菜品不存在
- `403`：无权限

---

## 4. 推荐模块补充

### 4.1 获取推荐列表增强字段

接口：

- `GET /recommendations?userId=1`

在 v1.1 原有字段基础上补充：

- `calories`
- `protein`
- `sustainabilityScore`
- `imageUrl`
- `allergenConflict`
- `scoreBreakdown`

其中：

- `allergenConflict`：布尔值，标识是否命中过敏原冲突
- `scoreBreakdown`：可选返回推荐分解结果，便于前端展示和调试

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
    "imageUrl": "/uploads/meals/meal-1-cover.jpg",
    "allergenConflict": false,
    "scoreBreakdown": {
      "healthScore": 0.31,
      "preferenceScore": 0.22,
      "sustainabilityScorePart": 0.18,
      "stockPriorityScore": 0.11
    }
  }
]
```

补充说明：

- 若菜品包含用户过敏原，可继续保留 v1.1 中的 `reason: "allergen conflict"`
- `scoreBreakdown` 为增强字段，可按需返回
- 本轮不新增独立的推荐 `click` 上报接口
- 推荐 `click` 事件通过 `GET /meals/{id}` 携带 `recommendationRequestId` 的方式在现有接口链路内记录

---

## 5. 订单模块补充

### 5.1 创建订单请求增强字段

接口：

- `POST /orders`

建议新增可选字段：

- `recommendationRequestId`

用途：

- 当订单来自推荐结果页时，用于回写推荐链路中的 `selected` 事件
- 非推荐流下单时可不传

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

### 5.2 查询单个订单

新增接口：

- `GET /orders/{id}`

权限：

- `customer`：只能查看自己的订单
- `staff/admin`：可按权限查看订单

Response.data:

```json
{
  "orderId": 1001,
  "userId": 1,
  "status": "confirmed",
  "createdAt": "2026-04-24T09:30:00Z",
  "confirmedAt": "2026-04-24T09:32:00Z",
  "cancelledAt": null,
  "items": [
    {
      "mealId": 2,
      "name": "Chicken Salad",
      "quantity": 2,
      "calories": 450,
      "protein": 30,
      "sustainabilityScore": 8,
      "imageUrl": "/uploads/meals/meal-1-cover.jpg"
    }
  ],
  "totalCalories": 900,
  "totalProtein": 60
}
```

错误码补充：

- `403`：无权限查看
- `404`：订单不存在

字段说明：

- `confirmedAt`：未确认时为 `null`
- `cancelledAt`：未取消时为 `null`

### 5.3 查询订单列表

新增接口：

- `GET /orders?userId=1`

查询参数：

- `userId`
- `page`
- `size`
- `status`

参数说明：

- `status` 取值：`pending`、`confirmed`、`cancelled`

权限：

- `customer`：仅允许查询自己的订单
- `staff/admin`：可按权限查询

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
      "createdAt": "2026-04-24T09:30:00Z",
      "totalCalories": 900,
      "totalProtein": 60
    }
  ]
}
```

错误码补充：

- `400`：分页参数非法、状态参数非法
- `403`：无权限查询

---

## 6. 库存与食材模块补充

### 6.1 查询食材列表

新增接口：

- `GET /ingredients`

查询参数：

- `page`
- `size`
- `keyword`
- `expiryBefore`

参数说明：

- `keyword`：按食材名称模糊匹配
- `expiryBefore`：日期格式为 `YYYY-MM-DD`

权限：

- 仅 `staff/admin`

Response.data:

```json
{
  "page": 1,
  "size": 20,
  "total": 1,
  "items": [
    {
      "ingredientId": 1,
      "name": "Broccoli",
      "allergens": ["nut"],
      "currentQty_g": 3000,
      "expiryDate": "2026-03-30",
      "stockStatus": "normal"
    }
  ]
}
```

### 6.2 查询食材详情

新增接口：

- `GET /ingredients/{id}`

权限：

- 仅 `staff/admin`

Response.data:

```json
{
  "ingredientId": 1,
  "name": "Broccoli",
  "allergens": ["nut"],
  "currentQty_g": 3000,
  "expiryDate": "2026-03-30",
  "stockStatus": "normal"
}
```

错误码补充：

- `404`：食材不存在
- `403`：无权限访问

### 6.3 库存状态口径补充

状态说明补充如下：

- `high_stock`：当前库存量 `>= 5000g`
- `near_expiry`：存在未过期且将在未来 7 天内到期的库存记录
- `normal`：不满足以上两种情况

---

## 7. Dashboard 模块补充

### 7.1 获取数据增强字段

接口：

- `GET /dashboard`

权限：

- 仅 `admin`

兼容要求：

- 必须保留 v1.1 既有字段：`topMeals`、`stockUsage`、`lowCarbonRate`
- 其中 `topMeals` 可兼容映射为“被选择最多的菜品”

建议新增字段：

- `topRecommendedMeals`
- `topSelectedMeals`
- `highStockIngredients`
- `nearExpiryIngredients`
- `mealSustainabilityStats`
- `lowCarbonSelectionCount`

字段结构约定：

- `topMeals` / `topSelectedMeals` / `topRecommendedMeals`：
  每项包含 `mealId`、`name`、`count`
- `stockUsage`：
  每项包含 `ingredientId`、`name`、`currentQty_g`、`stockStatus`
- `highStockIngredients` / `nearExpiryIngredients`：
  每项包含 `ingredientId`、`name`、`currentQty_g`、`expiryDate`、`stockStatus`
- `mealSustainabilityStats`：
  每项包含 `mealId`、`name`、`sustainabilityScore`

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
  "topSelectedMeals": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "count": 15
    }
  ],
  "highStockIngredients": [
    {
      "ingredientId": 2,
      "name": "Tofu",
      "currentQty_g": 6200,
      "expiryDate": "2026-04-30",
      "stockStatus": "high_stock"
    }
  ],
  "nearExpiryIngredients": [
    {
      "ingredientId": 3,
      "name": "Milk",
      "currentQty_g": 1200,
      "expiryDate": "2026-04-26",
      "stockStatus": "near_expiry"
    }
  ],
  "mealSustainabilityStats": [
    {
      "mealId": 1,
      "name": "Chicken Salad",
      "sustainabilityScore": 8
    }
  ],
  "lowCarbonSelectionCount": 12
}
```

统计口径补充：

- `topMeals` / `topSelectedMeals` 只统计 `confirmed` 订单
- `topRecommendedMeals` 基于推荐曝光事件统计
- `lowCarbonSelectionCount` 只统计 `sustainabilityScore >= 8` 且已确认的菜品选择次数

---

## 8. 报告模块补充

### 8.1 可持续报告增强字段

接口：

- `GET /reports/sustainability`

权限：

- 仅 `admin`

查询参数：

- `from`
- `to`

参数说明：

- `from`、`to` 格式均为 `YYYY-MM-DD`
- 两个参数均为可选；不传时默认统计最近 30 天

兼容要求：

- 必须保留 v1.1 既有字段：`generatedAt`、`summary`、`topMeals`、`stockUsage`、`lowCarbonRate`

建议新增字段：

- `topRecommendedMeals`
- `topSelectedMeals`
- `highStockIngredients`
- `nearExpiryIngredients`
- `mealSustainabilityStats`
- `lowCarbonSelectionCount`
- `reportId`

字段结构约定：

- `topMeals`、`topRecommendedMeals`、`topSelectedMeals`、`highStockIngredients`、`nearExpiryIngredients`、`mealSustainabilityStats` 的元素结构与 `GET /dashboard` 保持一致

Response.data:

```json
{
  "reportId": 1,
  "generatedAt": "2026-03-24T16:00:00Z",
  "summary": "过去 30 天低碳餐选择率为 45%，高库存食材主要集中在 broccoli 和 tofu。",
  "topMeals": [],
  "stockUsage": [],
  "lowCarbonRate": 0.45,
  "topRecommendedMeals": [],
  "topSelectedMeals": [],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [],
  "lowCarbonSelectionCount": 12
}
```

错误码补充：

- `400`：`from` / `to` 日期格式非法
- `403`：无权限访问

---

## 9. 错误码补充

在 v1.1 既有错误码基础上，建议在新增接口中优先使用以下场景：

- `400`：参数错误、上传文件非法、分页参数非法
- `401`：未登录
- `403`：无权限
- `404`：订单/食材/菜品不存在
- `409`：订单状态冲突、库存不足、重复确认
- `500`：服务器错误

---

## 10. 本文档覆盖的新增/增强项清单

本文档已补全以下 API 细节：

- `POST /auth/register` 响应
- `GET /meals` 筛选与增强字段
- `GET /meals/{id}` 增强字段
- `POST /meals/{id}/image` 上传协议
- `GET /recommendations` 增强字段
- `GET /orders/{id}`
- `GET /orders?userId=...`
- `GET /ingredients`
- `GET /ingredients/{id}`
- `GET /dashboard` 增强字段与统计口径
- `GET /reports/sustainability` 增强字段与筛选参数
