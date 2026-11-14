# 求职网站开发规范

适用于本项目的所有开发者和 AI 助手。修改代码前必须阅读并遵守本文件。

## 1. 项目定位

本项目是一个求职辅助网站。当前前端已使用 React + TypeScript + Vite 开发；后续新增后端时，按本规范执行。

## 2. 技术栈

- 前端：React + TypeScript + Vite。
- 后端：Python + FastAPI + SQLAlchemy。
- 数据库：PostgreSQL。
- 缓存：Redis。
- 部署：前端、后端、PostgreSQL、Redis 统一通过 Docker Compose 容器化部署。

## 3. 数据库要求

- 数据库统一使用 PostgreSQL，不使用 SQLite。
- 开发、测试和生产环境均以 PostgreSQL 为准，不得用 SQLite 替代。
- 数据库中的业务枚举使用普通字符串列；Python 代码中使用 Enum，避免使用 PostgreSQL 原生 ENUM。

## 4. 后端架构：严格采用模式 B

后端严格采用老师规定的模式 B：API / Service / Repository 三层架构。

### 4.1 API 层

API 层负责：

- 路由定义。
- 请求校验。
- 响应 DTO。
- HTTP 状态码。

API 层不得直接操作 ORM Model 或数据库 Session。

### 4.2 Service 层

Service 层负责：

- 业务规则。
- 业务编排。
- Unit of Work（UoW）事务边界。

Service 不得直接依赖 SQLAlchemy Session。

### 4.3 Repository 层

Repository 层负责：

- SQLAlchemy 数据持久化。
- 查询实现。
- ORM 与 Entity 的相互转换。

Repository 不得调用 `session.commit()`。所有事务提交、回滚和边界控制统一由 Unit of Work 负责。

## 5. Unit of Work 事务规范

- 所有数据库写入统一通过 Unit of Work 管理事务。
- 出现异常时必须 rollback。
- 不允许在 Repository 中自行 commit。
- 不允许在 API 层直接开启或提交事务。

## 6. 模型严格分离

必须严格区分以下三类模型，不能混用：

1. ORM Model：SQLAlchemy 持久化模型。
2. Python Dataclass Entity：业务实体。
3. Pydantic DTO：API 请求和响应模型。

约束：

- ORM Model 只能在 Repository 和 Unit of Work 内部使用。
- ORM Model 不得直接返回给 API。
- 除框架强制要求的序列化场景外，业务函数不得使用裸 `dict` / 裸 JSON 作为输入输出模型。
- API 的输入输出使用 Pydantic DTO；业务层使用 Entity；持久化层使用 ORM Model。

## 7. Service 命名与职责划分

复杂跨事务、跨聚合根编排时，采用 `XXXServiceA` 和 `XXXServiceD` 的命名及职责划分，按老师模式 B 的约定执行，不自行扩展成其他架构模式。

## 8. 禁止事项

- 不采用模式 C 的 DDD 架构。
- 不复制老师 Corvia Agent 项目的专用目录结构。
- 不在 Service 中直接依赖 SQLAlchemy Session。
- 不在 Repository 中调用 `session.commit()`。
- 不把 ORM Model 直接作为 API 响应返回。
- 不使用 PostgreSQL 原生 ENUM 存储业务枚举。
- 不使用裸 `dict` / 裸 JSON 替代业务输入输出模型，框架强制要求的序列化场景除外。

## 9. 前端要求

- 保留现有前端全部页面、组件、视觉风格和功能。
- 未经明确确认，不得删除、替换或大幅重构现有前端页面和交互。
- 新增功能应与现有视觉风格和代码组织保持一致。

## 10. 开发流程

- 修改代码前先检查现有实现，避免重复开发。
- 先确认影响范围，再修改相关文件。
- 修改完成后执行必要测试。
- 修改完成后检查 Git 变更，确认没有误提交敏感信息或无关文件。
- 未经用户确认，不自动执行 `git commit` 或 `git push`。
