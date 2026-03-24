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

---

## 3.2 更新偏好

PUT /users/{id}/preferences

Request:
{
  "targetCalories": 2000,
  "targetProtein": 80,
  "isVegetarian": true
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

# 五、推荐模块

## 5.1 获取推荐列表

GET /recommendations?userId=1

说明：
推荐分计算公式：
score = w1*health + w2*preference + w3*sustainability + w4*stock

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

# 九、状态说明（重要）

库存状态：

- normal
- high_stock
- near_expiry

订单状态：

- pending
- confirmed
- cancelled

---

# 十、错误码（建议）

200 成功  
400 参数错误  
401 未登录  
403 无权限  
500 服务器错误  