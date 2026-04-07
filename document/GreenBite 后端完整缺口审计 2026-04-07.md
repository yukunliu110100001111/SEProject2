# GreenBite 后端完整缺口审计

更新日期：2026-04-07  
审计范围：

- `backend/src/main/java`
- `backend/src/test/java`
- `init.sql`
- `backend/src/main/resources/application.properties`
- `document/GreenBite 项目 MVP v1.1.md`
- `document/GreenBite API 文档v1.0.md`

本文档目标不是重复接口列表，而是按“当前代码基线”系统梳理后端仍然缺乏的内容、风险点和不完整之处。

---

## 1. 总结

当前后端已经实现了一个可运行的 MVP 主骨架，但距离“完整、稳定、可长期维护”的版本还有明显差距。

如果从完整性来分，当前缺口主要分为 7 类：

1. 功能缺口  
2. API 与文档一致性缺口  
3. 数据模型与 SQL 设计缺口  
4. 安全与认证缺口  
5. 健壮性、并发与异常处理缺口  
6. 测试覆盖缺口  
7. 部署、配置、运维缺口

其中最影响产品闭环和前端联调的是：

- 缺少订单查询接口
- 缺少食材查询接口
- 部分响应字段不完整
- 管理端统计不够细
- 订单与库存逻辑缺少更强的一致性保障
- 安全实现仍停留在教学级别

---

## 2. 当前已实现能力

为了避免把“已有能力”误报成缺口，先确认当前已经具备的内容。

### 2.1 已实现接口

- `GET /health`
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
- `GET /recommendations?userId=...`
- `POST /orders`
- `POST /orders/{id}/confirm`
- `POST /orders/{id}/cancel`
- `POST /ingredients`
- `PUT /ingredients/{id}`
- `PUT /stock/{ingredientId}`
- `GET /dashboard`
- `GET /reports/sustainability`

### 2.2 已实现核心业务

- 用户注册后自动建立默认偏好
- 用户可更新用户名、热量、蛋白、素食偏好和过敏原
- 推荐算法已结合健康匹配、偏好匹配、可持续分、库存状态
- 订单确认时会扣减库存
- dashboard 具备简化版统计能力
- 有基础集成测试覆盖主流程

---

## 3. 功能缺口

这部分是“后端还没有提供，但业务已经需要”的能力。

### 3.1 缺少订单查询能力

当前只有：

- 创建订单
- 确认订单
- 取消订单

缺少：

- `GET /orders/{id}`
- `GET /orders?userId=...`
- `GET /users/{id}/orders`
- 订单详情中的菜品明细聚合返回

影响：

- 前端无法从后端稳定拉取“我的订单”
- 刷新页面或换设备后，订单历史丢失
- 管理员/员工无法查看历史订单
- 报表与订单分析能力受限

建议：

- 至少补 `GET /orders/{id}` 和 `GET /orders?userId=...`
- 返回中加入 `createdAt`、`items`、营养汇总等字段

---

### 3.2 缺少食材查询能力

当前只有：

- `POST /ingredients`
- `PUT /ingredients/{id}`
- `PUT /stock/{ingredientId}`

缺少：

- `GET /ingredients`
- `GET /ingredients/{id}`

影响：

- 员工端无法从后端拉到完整食材与库存信息
- 前端只能靠本地缓存或从菜品详情反推食材
- 无法稳定做库存管理界面

建议：

- 补食材列表和食材详情接口
- 返回 `allergens`、`currentQty_g`、`expiryDate`、`stockStatus`

---

### 3.3 缺少推荐历史/推荐次数统计能力

需求文档中管理员需要看：

- 推荐次数最多的菜品
- 被用户选择最多的菜品

当前后端只有“订单确认后产生的选择数据”，没有“推荐曝光/推荐命中”的独立记录。

影响：

- 无法真正计算“推荐次数最多”
- dashboard 当前只能近似做“被选择最多”
- 文档与实现之间存在语义缺口

建议：

- 单独记录 recommendation exposure / click / selected 事件
- 或在教学版中明确降级：dashboard 仅统计已选菜品

---

### 3.4 缺少独立的高库存和临期列表接口或字段

当前 dashboard 只给：

- `stockUsage`

并在 service 里附带 `stockStatus`。

但需求里需要更清晰展示：

- 高库存食材
- 临期食材

影响：

- 前端要自己遍历和筛选
- 报表层表达不够直接

建议：

- dashboard 中直接返回：
  - `highStockIngredients`
  - `nearExpiryIngredients`

---

### 3.5 缺少菜品可持续评分统计视图

需求中提到管理员要看：

- 菜品可持续评分

当前后端只有单个菜品上的 `sustainabilityScore` 字段，没有统计聚合接口。

缺口表现：

- 没有评分分布
- 没有平均值、中位数等统计
- 没有按标签维度聚合

---

### 3.6 报告能力仍是“占位版”

`GET /reports/sustainability` 只是把 dashboard 数据重新拼装，没有真正的报告模型。

缺少：

- 时间范围筛选
- 报告持久化
- 报告编号/历史
- 更可读的摘要文本
- 导出格式

这意味着“报告”目前只是一个轻量 API 视图，不是完整的报告功能。

---

## 4. API 与文档一致性缺口

这部分是“后端实现了，但和文档或接口语义不完全一致”。

### 4.1 `GET /meals/{id}` 缺少 `sustainabilityScore`

列表接口 `GET /meals` 有这个字段，但详情接口没有返回。

问题：

- 详情页无法仅靠详情接口完整渲染
- 与“详情页展示可持续评分”的需求不完全一致

建议：

- 在详情响应中补回 `sustainabilityScore`

---

### 4.2 `GET /dashboard` 返回结构过于简化

API 文档当前只写了：

```json
{
  "topMeals": [],
  "stockUsage": [],
  "lowCarbonRate": 0
}
```

而需求文档要求更细的管理员指标。

问题不在“接口报错”，而在“接口语义覆盖不足”。

---

### 4.3 注册接口返回与登录接口语义不连贯

`POST /auth/register` 只返回：

- `userId`
- `username`
- `role`

没有 token。

这不一定是错误，但会造成前端注册后还要多调一次登录。

如果这是设计选择，建议在 API 文档中明确写清楚。

---

### 4.4 `GET /recommendations` 的返回信息不够丰富

当前返回：

- `mealId`
- `name`
- `score`
- `reason`

缺少：

- `calories`
- `protein`
- `sustainabilityScore`
- 是否命中过敏原
- 命中库存优先级的具体来源

影响：

- 前端仍需额外请求菜品详情或列表
- 推荐解释性不足

建议：

- 至少补上基础展示字段

---

### 4.5 Dashboard 的 `topMeals` SQL 语义可能不准确

`DashboardMapper.topMeals()`：

```sql
left join order_items oi on oi.meal_id = m.meal_id
left join orders o on o.order_id = oi.order_id and o.status = 'confirmed'
```

但 `sum(oi.quantity)` 并没有明确只统计已确认订单里的 `oi`。

如果 `oi` 已经 join 上了未确认或已取消订单，而 `o` 只是条件式 left join，那么结果可能会把未确认订单也累计进去。

这意味着：

- “top meals” 统计口径可能错误
- dashboard 数据存在潜在偏差

建议：

- 把 confirmed 条件放到显式 inner join 逻辑里，或按 `o.order_id is not null` 过滤

---

## 5. 数据模型与 SQL 设计缺口

这部分是更底层的设计问题。

### 5.1 `sustainability_score` 缺少上限约束

当前 SQL 只有：

- `sustainability_score >= 0`

但没有上限，比如 10。

问题：

- 与前端和文档默认的 10 分制不一致
- 容易写入异常值

建议：

- 加 `CHECK (sustainability_score IS NULL OR sustainability_score BETWEEN 0 AND 10)`

---

### 5.2 库存模型只有“最新记录”，没有批次级扣减

表设计允许一个食材有多条 `stock_records`，注释也说是 batch-based。

但当前实现里：

- 查询只拿最新一条 `findLatestByIngredientId`
- 扣库存时也只扣最新一条

这和“多批次库存”的表设计不一致。

风险：

- 多批次到期管理形同虚设
- 近效期优先消耗无法实现
- 库存总量可能被错误理解为“最后一条记录的库存”

建议：

- 要么简化模型，只保留单条库存记录
- 要么真正实现批次级库存消耗逻辑

---

### 5.3 缺少订单快照字段

订单项表只有：

- `meal_id`
- `quantity`

缺少下单时的快照，比如：

- 菜品名称快照
- 热量快照
- 蛋白质快照
- 可持续分快照

影响：

- 菜品后续被修改或删除后，历史订单展示会失真
- 报表无法严格还原下单时状态

这是典型的审计和报表缺口。

---

### 5.4 缺少更明确的业务索引

目前已有部分索引，但仍可能缺少：

- `orders(status, created_at)` 组合索引
- `order_items(order_id)` 显式索引
- `meal_sustainability_tags(meal_id)` 索引
- `ingredient_allergens(ingredient_id)` 索引

对于 MVP 数据量问题不大，但后续增长会影响查询性能。

---

### 5.5 用户与业务对象缺少软删除/审计策略

当前：

- meal 有软删除
- ingredient 没有软删除
- user 没有停用状态

问题：

- 数据治理策略不统一
- 某些实体删除或失效后的历史兼容性弱

---

## 6. 安全与认证缺口

### 6.1 密码明文存储

当前直接把用户输入密码存进 `password_hash` 字段，实际上并未哈希。

这是明确安全缺口。

风险：

- 数据库泄露即直接泄露用户密码
- 不符合基本安全实践

建议：

- 使用 BCrypt

---

### 6.2 Token 只存在内存中

`TokenStore` 是进程内 `ConcurrentHashMap`。

风险：

- 服务重启后全部 token 失效
- 多实例部署无法共享登录状态
- 无法设置持久化或分布式会话

这对于教学演示可以接受，但不适合真实部署。

---

### 6.3 Token 无过期时间

当前 token：

- 没有 TTL
- 没有 refresh 机制
- 没有主动注销机制

风险：

- 只要内存还在，token 理论上永久有效

---

### 6.4 Token 格式可预测，且无签名能力

当前 token 形如：

- `token-{userId}-{shortUUID}`

虽然有随机段，但本质是后端自建内存映射，不具备 JWT 或标准 session token 的成熟安全特性。

---

### 6.5 缺少限流、登录失败保护、审计日志

未看到：

- 登录失败次数限制
- IP 级限流
- 敏感操作审计
- 管理员操作日志

风险：

- 容易被暴力尝试
- 关键操作不可追踪

---

### 6.6 缺少更细粒度的授权策略

当前授权主要基于：

- self
- role

但没有更细粒度的权限建模，例如：

- staff 是否能修改任意用户资料
- admin 是否能代替用户确认订单是否合规
- staff 是否应能查看全部用户信息

当前设计能工作，但权限策略较粗。

---

## 7. 健壮性、并发与异常处理缺口

### 7.1 库存扣减存在并发风险

`confirmOrder()` 的逻辑是：

1. 查询当前库存
2. 判断够不够
3. 再更新库存

如果两个请求并发确认同一批库存，可能发生竞态条件。

风险：

- 超卖
- 库存扣减错误

建议：

- 悲观锁
- 乐观锁版本号
- SQL 原子更新

---

### 7.2 缺少请求体级校验对象

当前 controller 基本都是直接收 `Map<String, Object>`。

问题：

- 无法用注解做类型和边界校验
- 文档与代码容易偏移
- 参数错误只能在运行时暴露

建议：

- 引入 DTO
- 配合 `@Valid`

---

### 7.3 数值与业务边界校验不完整

虽然数据库有部分 check constraint，但应用层仍缺：

- 下单数量是否大于 0
- `userId` 是否为空
- meal 创建时是否允许空 name
- `sustainabilityScore` 是否合理
- `targetCalories` 与 `targetProtein` 是否必须非负
- 日期是否允许过去时间

当前很多错误会延迟到数据库层，或者通过通用 500/400 返回。

---

### 7.4 全局异常处理过粗

当前异常处理只有几类：

- `BizException`
- 参数错误
- 未知异常

缺少：

- 数据库唯一键冲突的明确转换
- JSON 解析错误的更清晰提示
- 权限异常的结构化上下文
- 更细的业务错误码体系

---

### 7.5 错误日志与调试信息不足

`GlobalExceptionHandler` 里未看到日志输出。

影响：

- 出现线上错误时难以排查
- 500 错误定位困难

---

### 7.6 推荐算法解释性较弱

虽然推荐计算逻辑存在，但 reason 仍是概括性的文本。

问题：

- 前端或老师若追问“为什么这道菜分高”，后端无法返回细粒度分项

建议：

- 返回：
  - `healthScore`
  - `preferenceScore`
  - `sustainabilityScorePart`
  - `stockPriorityScore`

---

### 7.7 时间语义未完全统一

库存状态依赖 `LocalDate.now()`，而报告与订单使用系统时间。

潜在问题：

- 测试环境和部署环境时区差异时，`near_expiry` 结果可能不一致

建议：

- 明确时区策略

---

## 8. 测试覆盖缺口

当前测试有基础主流程，但远远不算完整。

### 8.1 缺少单元测试

当前主要是集成测试，没有针对：

- `StockStatusHelper`
- 推荐算法评分分项
- 权限判断
- 过敏原替换逻辑

做独立单元测试。

---

### 8.2 缺少大量异常路径测试

例如未覆盖：

- 非法 token
- token 对应用户已删除
- 重复注册冲突
- 用户名更新冲突
- 下单数量为 0 或负数
- mealId 不存在
- ingredientId 不存在
- 空请求体 / 类型错误
- `confirmed` 订单取消冲突
- `cancelled` 订单确认冲突
- staff/customer 越权访问不同接口

---

### 8.3 缺少并发测试

尤其是：

- 多请求并发确认订单
- 库存边界下的重复确认

这是当前高风险但无测试保护的区域。

---

### 8.4 缺少 dashboard 统计正确性测试

当前有权限测试，但缺少：

- topMeals 统计值是否正确
- lowCarbonRate 口径是否正确
- stockUsage 的状态是否正确

---

### 8.5 缺少数据库约束相关测试

比如：

- sustainabilityScore 越界
- 重复 ingredient name
- 重复 username
- 非法 quantity

---

### 8.6 测试代码本身存在可疑点

测试文件中使用的是：

- `tools.jackson.databind.JsonNode`
- `tools.jackson.databind.ObjectMapper`

这不是常见的 Jackson 包路径。

如果这是特殊环境提供的类，需要说明；如果不是，说明测试代码本身存在可移植性问题。

---

## 9. 部署、配置、运维缺口

### 9.1 配置硬编码

`application.properties` 中直接写死：

- 数据库地址
- 用户名
- 密码

问题：

- 不利于多环境部署
- 存在敏感信息暴露风险

建议：

- 改成环境变量注入

---

### 9.2 缺少环境区分配置

未看到：

- `application-dev.properties`
- `application-test.properties`
- `application-prod.properties`

问题：

- 开发、测试、生产难以隔离

---

### 9.3 缺少数据库迁移工具

当前使用 `init.sql` 初始化。

缺少：

- Flyway / Liquibase

问题：

- 后续 schema 演进难以管理
- 团队协作下容易漂移

---

### 9.4 缺少监控与健康扩展项

当前只有 `/health` 返回简单 `ok`。

缺少：

- 数据库连通性检查
- 应用指标
- 请求耗时监控
- 错误率监控

---

### 9.5 缺少日志策略

未看到：

- access log
- business log
- error log 分级
- 管理员敏感操作日志

---

### 9.6 缺少 CORS、反向代理、生产化安全配置说明

如果系统需要浏览器跨域访问或部署到 VM，目前未看到清晰配置。

---

## 10. 代码结构与可维护性缺口

### 10.1 Service 过于集中

`AppService` 承担了过多职责：

- auth
- user
- meal
- ingredient
- stock
- recommendation
- order
- dashboard
- report

问题：

- 文件过大
- 变更影响面广
- 难以独立测试

建议：

- 拆成多个领域服务

---

### 10.2 Controller 直接使用 `Map<String, Object>`

这会导致：

- 类型不清晰
- 文档与代码容易漂移
- 前后端协作成本更高

---

### 10.3 领域对象与返回对象未分离

当前多处直接手工 `Map` 拼响应。

问题：

- 容易漏字段
- 容易命名不一致
- 不利于版本管理

---

## 11. 最影响交付的缺口优先级

### P0：必须优先补

- 订单查询接口
- 食材查询接口
- `GET /meals/{id}` 补 `sustainabilityScore`
- 修正 dashboard 统计口径
- 加强订单确认的并发安全

### P1：强烈建议补

- DTO + 参数校验
- dashboard 扩展字段
- 报告能力增强
- 密码哈希化
- 配置外置化

### P2：后续演进

- recommendation event tracking
- 分页与搜索
- 多环境配置
- 监控日志
- 迁移工具

---

## 12. 最终结论

如果严格回答“后端还缺什么”，答案不是“还缺几个接口”这么简单。

当前后端的真实状态是：

- 功能骨架基本齐了
- 查询能力明显不足
- 统计和报告能力还偏简化
- 安全、并发、校验、部署等方面仍是教学演示级实现

所以它更准确地说是：

一个已经具备 MVP 雏形、但还没有达到“完整后端实现”的版本。

如果你接下来要继续推进，我最建议的顺序是：

1. 补订单查询与食材查询  
2. 修详情字段和 dashboard 统计  
3. 补 DTO 校验和库存并发保护  
4. 再做密码哈希、配置治理和测试扩展
