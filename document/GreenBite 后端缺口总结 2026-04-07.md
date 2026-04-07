# GreenBite 后端缺口总结

更新日期：2026-04-07  
代码基线：`/Users/zhangzekai/SEProject2/backend`

## 1. 结论

当前后端已经实现了 MVP 的核心骨架：

- 登录、注册
- 用户信息与偏好更新
- 菜品查询、菜品详情、推荐
- 菜品增改删
- 食材新增、食材更新、库存更新
- 订单创建、确认、取消
- 仪表盘与可持续报告

但从“前端完整接入”和“文档要求完全覆盖”的角度看，后端仍然有几类明显缺口：

- 缺少若干查询型接口，导致前端只能用本地缓存兜底
- 有些接口返回字段不完整，与 API 文档不完全一致
- 管理端统计口径还不够细，不能完全覆盖文档中的管理员需求
- 工程质量层面仍有安全性、校验和可维护性问题

---

## 2. 当前已具备的能力

根据现有 Controller / Service，实现情况如下：

- `POST /auth/login`
- `POST /auth/register`
- `GET /users/{id}`
- `PUT /users/{id}`
- `PUT /users/{id}/preferences`
- `GET /meals`
- `GET /meals/{id}`
- `POST /meals`
- `PUT /meals/{id}`
- `DELETE /meals/{id}`
- `GET /recommendations`
- `POST /orders`
- `POST /orders/{id}/confirm`
- `POST /orders/{id}/cancel`
- `POST /ingredients`
- `PUT /ingredients/{id}`
- `PUT /stock/{ingredientId}`
- `GET /dashboard`
- `GET /reports/sustainability`

从“是否有基本功能”来说，后端不是空的，已经能够支持一条基础 MVP 演示链。

---

## 3. 高优先级缺口

这些问题会直接影响前端完整性、演示完整性，或者让前端不得不写很多本地假逻辑。

### 3.1 缺少订单查询接口

当前只有：

- `POST /orders`
- `POST /orders/{id}/confirm`
- `POST /orders/{id}/cancel`

但没有：

- `GET /orders/{id}`
- `GET /orders?userId=...`
- `GET /users/{id}/orders`

影响：

- 前端无法从后端拉取订单历史
- “我的订单”页面只能依赖前端本地缓存
- 页面刷新、换设备、重新登录后，历史订单无法恢复
- 管理员或员工也无法方便地查看订单详情

建议优先新增：

- `GET /orders/{id}`
- `GET /orders?userId=...`

返回建议至少包含：

- `orderId`
- `userId`
- `status`
- `createdAt`
- `items`
- `totalCalories`
- `totalProtein`

---

### 3.2 缺少食材列表/详情查询接口

当前食材相关只有：

- `POST /ingredients`
- `PUT /ingredients/{id}`
- `PUT /stock/{ingredientId}`

但没有：

- `GET /ingredients`
- `GET /ingredients/{id}`

影响：

- 员工端无法从后端拿到完整食材列表
- 前端只能从菜品详情反推食材，或者靠本地缓存拼接
- 不能稳定展示库存状态、过敏原、到期日等信息

建议优先新增：

- `GET /ingredients`
- `GET /ingredients/{id}`

返回建议至少包含：

- `ingredientId`
- `name`
- `allergens`
- `currentQty_g`
- `expiryDate`
- `stockStatus`

---

### 3.3 菜品详情接口缺少 `sustainabilityScore`

API 文档中，菜品详情属于用户核心展示内容，且 MVP 文档也要求详情页展示可持续评分。  
但当前 `mealDetail()` 返回内容里没有把 `sustainabilityScore` 放进响应。

现状：

- `GET /meals` 有 `sustainabilityScore`
- `GET /meals/{id}` 没有 `sustainabilityScore`

影响：

- 菜品详情页无法只靠详情接口完整渲染
- 前端必须额外从列表接口或推荐接口补字段
- 接口语义不完整，不利于后续维护

建议修复：

- 在 `GET /meals/{id}` 的返回中加入 `sustainabilityScore`

---

### 3.4 菜品缺少展示图片与文件上传能力

当前前端已经有“员工修改菜品展示图片”的需求，但后端没有图片字段和接口支持。

影响：

- 图片只能保存在前端本地
- 无法跨浏览器、跨设备同步
- 员工修改不是真正的系统数据修改

建议修复：

- 在菜品数据模型中新增 `imageUrl`
- 在以下接口中补充该字段：
  - `GET /meals`
  - `GET /meals/{id}`
- 增加文件上传能力，建议二选一：
  - `POST /uploads/images`
  - `POST /meals/{id}/image`

建议上传方式：

- `multipart/form-data`
- 文件字段名：`file`

建议返回：

- 上传成功后返回可访问的 `imageUrl`

后端还需要同时补：

- 图片类型校验
- 图片大小限制
- 静态文件访问路径或对象存储访问 URL
- 图片替换后的旧文件清理策略

---

### 3.5 管理员仪表盘未完全覆盖需求文档

MVP 文档中的管理员需求包括：

- 推荐次数最多的菜品
- 被用户选择最多的菜品
- 食材使用情况
- 高库存食材
- 临期食材
- 菜品可持续评分
- 低碳餐食选择次数
- 简单可持续报告

当前 `GET /dashboard` 实际返回的是：

- `topMeals`
- `stockUsage`
- `lowCarbonRate`

问题在于：

- 没有区分“推荐次数最多”与“被选择次数最多”
- 没有单独给出高库存食材列表
- 没有单独给出临期食材列表
- 没有提供菜品可持续评分统计视图
- 没有提供“低碳餐食选择次数”原始计数，只给了比例

影响：

- 仪表盘只能做简化版展示
- 不能完整对应文档里的管理员验收项

建议改造：

- 将 `GET /dashboard` 拆成更明确的数据块

建议结构示例：

```json
{
  "topRecommendedMeals": [],
  "topSelectedMeals": [],
  "stockUsage": [],
  "highStockIngredients": [],
  "nearExpiryIngredients": [],
  "mealSustainabilityStats": [],
  "lowCarbonSelectionCount": 0,
  "lowCarbonRate": 0.0
}
```

---

## 4. 中优先级缺口

这些问题不一定阻塞 MVP 演示，但会让产品体验或接口一致性明显变差。

### 4.1 注册接口没有直接返回 token

当前 `POST /auth/register` 返回：

- `userId`
- `username`
- `role`

没有返回 `token`。

影响：

- 前端注册后需要再调用一次登录接口
- 增加一次网络请求和流程复杂度

这不是功能错误，但会让前端多写一层逻辑。

建议：

- 注册成功后可直接签发 token，或者保持现状但在文档中明确“注册后需再次登录”

---

### 4.2 报告接口过于简化

当前 `GET /reports/sustainability` 基本只是把 dashboard 数据重新拼了一遍：

- `generatedAt`
- `summary`
- `topMeals`
- `stockUsage`
- `lowCarbonRate`

问题：

- `summary` 是固定字符串，信息量很低
- 没有更详细的结论或建议
- 没有导出格式
- 没有报告 ID、报告历史、筛选时间范围

影响：

- 只能算“能返回数据”，离“可持续报告”还有差距

建议：

- 至少增加可读摘要
- 后续可支持时间范围参数
- 如需交付展示，可补一个文本型或 PDF/CSV 导出能力

---

### 4.3 缺少统一的列表筛选/分页能力

当前多数接口都是“全量返回”：

- 菜品列表
- 推荐列表
- 仪表盘库存列表

问题：

- 数据量一大就不适合前端直接全量拉取
- 不利于后续扩展

建议：

- 为列表型接口预留分页、搜索、过滤参数

MVP 阶段不是必须，但后续迭代很快会需要。

---

## 5. 工程质量与安全性缺口

这些问题不一定写在 MVP 文档里，但属于后端明显短板。

### 5.1 密码明文存储

当前登录逻辑是直接比较明文密码，说明密码并未做哈希。

影响：

- 安全风险很高
- 不适合任何接近真实环境的部署

建议：

- 使用 `BCrypt` 或等价方案存储密码哈希
- 登录时改为哈希校验

---

### 5.2 输入校验不充分

当前很多字段缺少边界校验，例如：

- 热量、蛋白质可否为负数
- `sustainabilityScore` 是否限制在 0 到 10
- `quantity` 是否必须大于 0
- `currentQty_g` 是否必须非负
- `expiryDate` 是否允许非法业务值

影响：

- 前端传错数据时，后端可能写入脏数据
- 统计与推荐结果可能异常

建议：

- 为关键请求体增加业务校验
- 对错误信息做统一、明确的返回

---

### 5.3 认证方案更接近教学演示，不适合长期使用

当前 token 体系可以支撑 MVP，但仍有局限：

- token 生命周期与失效策略较弱
- 未看到刷新机制
- 更适合演示，不适合长期会话管理

这不是当前最紧急的问题，但如果后续要部署或多人使用，需要继续补强。

---

## 6. 与前端直接相关的后端阻塞点

如果从“前端为什么还得写本地兜底”这个角度看，最核心的后端缺口只有 3 个：

1. 没有订单历史查询接口  
2. 没有食材列表/详情查询接口  
3. 菜品详情接口缺少 `sustainabilityScore`

这 3 个问题补上后，前端很多本地缓存和绕行逻辑都可以删掉。

---

## 7. 推荐的修复优先级

### 第一优先级

- 新增 `GET /orders/{id}`、`GET /orders?userId=...`
- 新增 `GET /ingredients`、`GET /ingredients/{id}`
- 给 `GET /meals/{id}` 补 `sustainabilityScore`

### 第二优先级

- 扩展 `GET /dashboard` 字段，补足管理员验收项
- 丰富 `GET /reports/sustainability` 的内容
- 补充输入校验

### 第三优先级

- 密码哈希化
- 列表分页/搜索
- 更完整的 token 生命周期管理

---

## 8. 简短结论

当前后端已经具备一个“能跑通基本流程”的 MVP 核心，但还不算“文档要求完全闭环”的版本。

最关键的缺口不是增删改本身，而是：

- 缺查询接口
- 缺完整字段
- 缺更细的统计口径

如果只做最小补齐，优先补：

- 订单查询
- 食材查询
- 菜品详情中的可持续评分

这三项会立刻显著降低前端复杂度，也能让系统更接近真正完整的 Web 应用。
