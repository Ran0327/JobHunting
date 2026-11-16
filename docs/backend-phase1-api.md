# 求职网站后端第一阶段接口清单

- 文档状态：设计确认稿
- 适用范围：后端第一阶段
- 架构约束：API / Service / Repository 三层，严格模式 B
- 数据库：PostgreSQL
- 会话：HttpOnly Cookie + Redis
- 文件：统一 `fileId`，第一版存 Docker 卷，可切换 MinIO

---

## 1. 第一阶段范围

本阶段实现：

1. 注册、登录、退出、当前用户。
2. 个人资料、求职方向、当前简历偏好。
3. 职位列表与详情、职位收藏。
4. 简历、草稿、章节、材料任务。
5. Word 文件保存与导出下载。
6. 投递记录、面试轮次、看板排序、投递汇总。
7. 一键分享简历、社区帖子、评论、点赞、收藏。
8. AI 会话、消息、SSE 流式输出、文件附件。
9. localStorage / IndexedDB 旧数据迁移。

本阶段暂不实现：

- 邮箱验证、找回密码、第三方登录。
- 管理后台、职位采集爬虫。
- 服务端职位筛选（第一阶段由前端本地过滤）。
- 服务端高保真生成 Word。
- 文件病毒扫描。
- 多副本 API 下的本地文件共享。

---

## 2. 已确认的设计决策

| 决策 | 结论 |
|---|---|
| 职位筛选 | 第一阶段 `GET /jobs` 返回完整列表，前端继续本地筛选 |
| 社区信息流 | 需要登录后访问 |
| 头像文件 | 设为 public，可被社区和导航栏直接读取 |
| 旧数据迁移 | 放在第一阶段最后 |
| 草稿保存 | 上传 Word 得到 `fileId`，再用一个 PATCH 同时保存文件引用和纯文本 |
| 一键分享 | 后端读取草稿生成快照，前端不能提交完整快照 |
| AI 流式输出 | 使用 POST + SSE，不使用浏览器原生 EventSource |
| 文件删除 | 被引用时返回 409；未被引用才允许删除 |

---

## 3. 通用接口约定

### 3.1 基础规则

- 接口前缀：`/api/v1`
- JSON 字段：`camelCase`
- 职位主键：字符串 slug，例如 `meituan`
- 用户业务数据主键：UUID
- 时间：ISO 8601，例如 `2026-11-16T10:00:00Z`
- 分页参数：`page` 从 1 开始，`pageSize` 默认 20，最大 50
- 除注册、登录、健康检查、职位只读外，默认需要登录
- 所有用户数据查询必须从会话中取 `userId`，禁止前端传 `userId`

### 3.2 分页响应

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### 3.3 错误响应

```json
{
  "code": "FILE_TYPE_NOT_ALLOWED",
  "message": "只支持 .docx 文件",
  "details": {},
  "requestId": "..."
}
```

### 3.4 HTTP 状态码

| 状态码 | 使用场景 |
|---|---|
| 200 | 查询、更新成功 |
| 201 | 创建成功 |
| 204 | 删除、点赞、取消点赞成功 |
| 400 | 业务参数不合法 |
| 401 | 未登录、会话过期 |
| 403 | 已登录但无权访问 |
| 404 | 资源不存在 |
| 409 | 重复投递、重复分享、文件被引用、版本冲突 |
| 413 | 文件超过大小限制 |
| 415 | 文件类型不支持 |
| 422 | FastAPI 请求 DTO 校验失败 |
| 429 | 登录或 AI 请求过于频繁 |
| 503 | PostgreSQL / Redis / 存储不可用 |

### 3.5 认证与会话

- 登录成功后写入 Cookie：

```http
Set-Cookie: jh_session=<随机Token>; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=604800
```

- 生产环境必须 `Secure=true`，本地 HTTP 开发可关闭。
- Redis 使用 `session:{sha256(token)}` 保存会话，不保存原始 Token。
- 会话默认 7 天滑动过期，绝对有效期 30 天。
- 状态变更请求需要校验 `Origin`，生产环境只允许配置过的前端来源。
- 前端跨域请求必须携带 Cookie；推荐通过 Nginx/Vite 代理保持同源。

---

## 4. 接口清单

### 4.1 系统

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/healthz` | 否 | 进程存活检查 | 200 |
| GET | `/readyz` | 否 | 检查 PostgreSQL、Redis 是否可用 | 200 / 503 |

### 4.2 认证

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | 否 | 注册并创建会话 | 201 |
| POST | `/api/v1/auth/login` | 否 | 登录并写 HttpOnly Cookie | 200 |
| POST | `/api/v1/auth/logout` | 是 | 删除 Redis 会话并清 Cookie | 204 |
| GET | `/api/v1/auth/me` | 是 | 获取当前用户摘要 | 200 |

`POST /auth/register` 请求：

```json
{
  "email": "lin@example.com",
  "password": "至少 8 位",
  "name": "林晚宁"
}
```

`POST /auth/login` 请求：

```json
{
  "email": "lin@example.com",
  "password": "..."
}
```

### 4.3 个人资料与偏好

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/me/profile` | 是 | 获取个人资料 | 200 |
| PATCH | `/api/v1/me/profile` | 是 | 部分更新个人资料 | 200 |
| GET | `/api/v1/me/preferences` | 是 | 获取当前简历、草稿、文件名风格 | 200 |
| PATCH | `/api/v1/me/preferences` | 是 | 更新当前选择 | 200 |

`PATCH /me/profile` 示例：

```json
{
  "name": "林晚宁",
  "school": "华东师范大学",
  "city": "上海",
  "directions": ["前端开发", "算法工程"],
  "avatarFileId": "file-uuid"
}
```

要求：

- `avatarFileId` 必须是本人上传、用途为 `avatar` 的文件。
- `directions` 保存到 `user_directions`，不能以 JSON 字段代替业务关系。

### 4.4 文件

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| POST | `/api/v1/files` | 是 | 统一上传文件，返回 `fileId` | 201 |
| GET | `/api/v1/files/{fileId}` | 是 | 获取文件元数据 | 200 |
| GET | `/api/v1/files/{fileId}/content` | 公开或本人 | 内联读取，头像、图片使用 | 200 |
| GET | `/api/v1/files/{fileId}/download` | 本人 | 附件下载，Word 导出使用 | 200 |
| DELETE | `/api/v1/files/{fileId}` | 是 | 删除未被引用的文件 | 204 / 409 |

上传请求：

```text
multipart/form-data
file: 二进制文件
purpose: avatar | resume_docx | resume_import | ai_image | ai_document
```

上传响应：

```json
{
  "fileId": "file-uuid",
  "purpose": "resume_docx",
  "visibility": "private",
  "originalName": "林晚宁-前端岗.docx",
  "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "sizeBytes": 245760,
  "createdAt": "2026-11-16T10:00:00Z"
}
```

文件限制：

| 用途 | 大小限制 | 允许类型 | 可见性 |
|---|---|---|---|
| avatar | 2 MB | jpeg / png / webp | public |
| resume_docx | 15 MB | `.docx` | private |
| resume_import | 15 MB | `.docx` | private |
| ai_image | 5 MB | jpeg / png / webp | private |
| ai_document | 15 MB | txt / md / pdf / docx | private |

安全要求：

- `visibility` 由后端根据 `purpose` 决定，前端不能传。
- 不能用客户端文件名拼接存储路径。
- 存储键使用 UUID，例如 `u/{userId}/{purpose}/{yyyy}/{mm}/{fileId}.docx`。
- 下载必须校验文件归属。
- 被草稿、消息或头像引用时不能直接删除，返回 409。

### 4.5 职位

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/jobs` | 否 | 获取完整职位列表 | 200 |
| GET | `/api/v1/jobs/{jobId}` | 否 | 获取职位详情 | 200 |

第一阶段说明：

- 后端返回完整职位列表。
- 前端继续用现有的 `browseJobs()`、`matchesJob()` 本地筛选。
- 后续数据量变大，再增加服务端筛选参数：

```text
q, group, sub, leaf, degree, salaryBand,
experience, headcount, employment, risk
```

### 4.6 职位收藏

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/favorites/jobs` | 是 | 获取收藏职位列表 | 200 |
| PUT | `/api/v1/favorites/jobs/{jobId}` | 是 | 收藏职位，幂等 | 204 |
| DELETE | `/api/v1/favorites/jobs/{jobId}` | 是 | 取消收藏，幂等 | 204 |

### 4.7 投递与面试

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/applications` | 是 | 投递列表，支持阶段、关键词、分页 | 200 |
| GET | `/api/v1/applications/summary` | 是 | 投递汇总 | 200 |
| GET | `/api/v1/applications/{id}` | 是 | 投递详情 | 200 |
| POST | `/api/v1/applications` | 是 | 新增投递 | 201 / 409 |
| PATCH | `/api/v1/applications/{id}` | 是 | 更新备注、下一步、查看状态 | 200 |
| PATCH | `/api/v1/applications/{id}/stage` | 是 | 修改阶段 | 200 |
| PATCH | `/api/v1/applications/{id}/position` | 是 | 同阶段拖拽排序 | 200 |
| GET | `/api/v1/applications/{id}/rounds` | 是 | 面试轮次列表 | 200 |
| POST | `/api/v1/applications/{id}/rounds` | 是 | 新增面试轮次 | 201 |
| PATCH | `/api/v1/applications/{id}/rounds/{roundId}` | 是 | 修改面试轮次 | 200 |
| DELETE | `/api/v1/applications/{id}/rounds/{roundId}` | 是 | 删除面试轮次 | 204 |

`POST /applications` 请求：

```json
{
  "jobId": "meituan",
  "resumeId": "resume-uuid",
  "draftId": "draft-uuid",
  "nameStyleId": "name-role"
}
```

后端必须：

1. 校验职位存在。
2. 校验简历和草稿属于当前用户。
3. 保存简历名称、草稿名称、文件名快照。
4. 同一用户同一职位只允许一条投递记录，重复返回 409。
5. 第一阶段默认阶段为 `applied`。

`PATCH /applications/{id}/position` 请求：

```json
{
  "stage": "interview",
  "position": 2
}
```

Service 必须在同一个 UoW 中锁定当前用户的投递记录，重排源阶段和目标阶段的 `position`。

### 4.8 简历

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/resumes` | 是 | 简历列表，含版本摘要 | 200 |
| POST | `/api/v1/resumes` | 是 | 新建简历 | 201 |
| GET | `/api/v1/resumes/{id}` | 是 | 简历详情、草稿、章节、任务 | 200 |
| PATCH | `/api/v1/resumes/{id}` | 是 | 修改简历名称、目标、摘要 | 200 |
| DELETE | `/api/v1/resumes/{id}` | 是 | 删除或归档简历 | 204 |
| GET | `/api/v1/resumes/{id}/drafts` | 是 | 草稿列表 | 200 |
| POST | `/api/v1/resumes/{id}/drafts` | 是 | 新建草稿或复制草稿 | 201 |
| GET | `/api/v1/resumes/{id}/drafts/{draftId}` | 是 | 草稿详情 | 200 |
| PATCH | `/api/v1/resumes/{id}/drafts/{draftId}` | 是 | 保存 Word 引用和纯文本 | 200 |
| DELETE | `/api/v1/resumes/{id}/drafts/{draftId}` | 是 | 删除草稿，至少保留一个 | 204 / 409 |
| PATCH | `/api/v1/resumes/{id}/tasks/{taskKey}` | 是 | 更新材料任务完成状态 | 200 |

新建草稿请求：

```json
{
  "label": "版本二",
  "fromDraftId": "draft-uuid",
  "documentFileId": "可选",
  "bodyText": "可选",
  "summary": "可选"
}
```

说明：

- 传 `fromDraftId` 时复制原草稿的章节和文本。
- Word 文件是不可变对象，新草稿可以复用同一个 `documentFileId`。
- 删除草稿前要检查是否至少保留一个版本。

保存草稿请求：

```json
{
  "documentFileId": "file-uuid",
  "bodyText": "从 Word 提取的纯文本",
  "summary": "可选",
  "label": "可选"
}
```

保存草稿响应：

```json
{
  "id": "draft-uuid",
  "label": "版本二",
  "documentFileId": "file-uuid",
  "bodyText": "从 Word 提取的纯文本",
  "wordCount": 1280,
  "updatedAt": "2026-11-16T10:00:00Z"
}
```

说明：

- `updatedAt` 是唯一时间来源，前端负责转换成“11 月 16 日编辑”等展示文本。
- 后端不保存展示字符串。
- 保存流程：

```text
1. POST /files 上传 docx，得到 fileId
2. PATCH /resumes/{id}/drafts/{draftId} 同时写 documentFileId 和 bodyText
3. 如果第 2 步失败，前端调用 DELETE /files/{fileId} 做补偿
```

### 4.9 社区

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/community/items` | 是 | 社区信息流，支持 `kind/category/mine` | 200 |
| GET | `/api/v1/community/items/{id}` | 是 | 内容详情 | 200 |
| POST | `/api/v1/community/shares` | 是 | 一键分享简历 | 201 |
| POST | `/api/v1/community/posts` | 是 | 发布帖子 | 201 |
| PATCH | `/api/v1/community/items/{id}` | 是 | 编辑自己的帖子 | 200 |
| DELETE | `/api/v1/community/items/{id}` | 是 | 删除自己的内容 | 204 |
| GET | `/api/v1/community/items/{id}/comments` | 是 | 评论列表 | 200 |
| POST | `/api/v1/community/items/{id}/comments` | 是 | 发表评论 | 201 |
| DELETE | `/api/v1/community/items/{id}/comments/{commentId}` | 是 | 删除自己的评论 | 204 |
| PUT | `/api/v1/community/items/{id}/like` | 是 | 点赞，幂等 | 204 |
| DELETE | `/api/v1/community/items/{id}/like` | 是 | 取消点赞 | 204 |
| PUT | `/api/v1/community/items/{id}/save` | 是 | 收藏，幂等 | 204 |
| DELETE | `/api/v1/community/items/{id}/save` | 是 | 取消收藏 | 204 |
| GET | `/api/v1/community/saves` | 是 | 我的社区收藏 | 200 |

一键分享请求：

```json
{
  "resumeId": "resume-uuid",
  "draftId": "draft-uuid",
  "excerpt": "前端提交的摘要",
  "clientRequestId": "前端生成的 uuid"
}
```

后端必须：

1. 校验简历和草稿属于当前用户。
2. 读取草稿 `bodyText`、`summary`、`sections`。
3. 生成 `snapshot_body`、`snapshot_target`。
4. 插入 `community_items`，`kind = resume_share`。
5. 用 `(user_id, client_request_id)` 保证重复点击不产生重复分享。
6. 社区只公开文字快照，不公开原始 Word 文件。

信息流每一项响应：

```json
{
  "id": "item-uuid",
  "kind": "resume_share",
  "title": "前端岗",
  "excerpt": "...",
  "authorName": "林晚宁",
  "authorAvatarFileId": "avatar-file-uuid",
  "likeCount": 3,
  "commentCount": 2,
  "likedByMe": true,
  "savedByMe": false,
  "createdAt": "2026-11-16T10:00:00Z"
}
```

查询参数：

```text
kind=resume_share|post
category=experience|interview|qa|other
mine=true
page=1
pageSize=20
```

`mine=true` 对应“我的分享 / 我的帖子”。

### 4.10 AI

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| GET | `/api/v1/ai/threads` | 是 | 会话列表 | 200 |
| POST | `/api/v1/ai/threads` | 是 | 新建会话 | 201 |
| GET | `/api/v1/ai/threads/{id}/messages` | 是 | 消息列表 | 200 |
| POST | `/api/v1/ai/threads/{id}/messages/stream` | 是 | SSE 流式对话 | 200 |
| DELETE | `/api/v1/ai/threads/{id}` | 是 | 删除会话 | 204 |

SSE 请求：

```json
{
  "content": "帮我看这份简历适合投前端吗",
  "fileIds": ["file-uuid"],
  "clientMessageId": "uuid"
}
```

SSE 事件：

```text
event: meta
data: {"threadId":"...","userMessageId":"...","assistantMessageId":"..."}

event: delta
data: {"text":"你"}

event: delta
data: {"text":"这份简历"}

event: done
data: {"messageId":"...","finishReason":"stop","usage":{"promptTokens":100,"completionTokens":200}}

event: error
data: {"code":"AI_UPSTREAM_ERROR","message":"模型服务暂时不可用"}
```

事务边界：

```text
事务 1：保存用户消息、附件，创建 assistant 占位消息，提交
然后：调用 LLM，持续输出 SSE，不持有数据库事务
事务 2：更新 assistant 内容、状态、token 用量，提交
异常或断开：尽力用一次短事务标记 failed 或 aborted
```

要求：

- 使用 `POST` + SSE，前端用 `fetch` 读取流，不使用 `EventSource`。
- Nginx 必须关闭 `proxy_buffering`。
- 需要心跳事件，避免代理超时。
- 按用户做 AI 请求限流。

### 4.11 旧数据迁移

| 方法 | 路径 | 鉴权 | 作用 | 成功状态 |
|---|---|---|---|---|
| POST | `/api/v1/imports/legacy-state` | 是 | 导入 localStorage / IndexedDB 旧数据 | 200 / 201 |

迁移内容：

- 职位收藏
- 投递记录和面试轮次
- 简历、草稿、章节、任务
- 社区分享、帖子、收藏、评论
- AI 会话和消息

要求：

- 前端先上传头像、Word、AI 图片和文档，拿到 `fileId`。
- 后端把旧字符串 ID 映射成 UUID，并返回映射表。
- 接口必须支持重复调用而不重复插入。
- 迁移完成前不能删除 localStorage 原始数据。

---

## 5. 关键接口契约

### 5.1 文件上传响应

```json
{
  "fileId": "file-uuid",
  "purpose": "resume_docx",
  "visibility": "private",
  "originalName": "林晚宁-前端岗.docx",
  "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "sizeBytes": 245760,
  "createdAt": "2026-11-16T10:00:00Z"
}
```

### 5.2 草稿保存

请求：

```json
{
  "documentFileId": "file-uuid",
  "bodyText": "从 Word 提取的纯文本",
  "summary": "可选",
  "label": "可选"
}
```

响应：

```json
{
  "id": "draft-uuid",
  "label": "版本二",
  "documentFileId": "file-uuid",
  "bodyText": "从 Word 提取的纯文本",
  "wordCount": 1280,
  "updatedAt": "2026-11-16T10:00:00Z"
}
```

### 5.3 投递汇总

```json
{
  "total": 7,
  "active": 6,
  "offers": 2,
  "counts": {
    "applied": 2,
    "writtenTest": 1,
    "interview": 1,
    "offer": 2,
    "rejected": 1
  },
  "upcomingInterviews": [
    {
      "applicationId": "app-uuid",
      "jobId": "xhs-product",
      "company": "小红书",
      "title": "技术产品培训生",
      "roundName": "第二轮面试",
      "date": "2026-11-20",
      "time": "14:00"
    }
  ]
}
```

### 5.4 一键分享

请求：

```json
{
  "resumeId": "resume-uuid",
  "draftId": "draft-uuid",
  "excerpt": "前端提交的摘要",
  "clientRequestId": "前端生成的 uuid"
}
```

响应：

```json
{
  "id": "item-uuid",
  "kind": "resume_share",
  "title": "前端岗",
  "snapshotTarget": "前端 / Web 开发",
  "snapshotBody": "分享时保存的简历全文快照",
  "createdAt": "2026-11-16T10:00:00Z"
}
```

### 5.5 AI SSE

```text
event: meta
data: {"threadId":"...","userMessageId":"...","assistantMessageId":"..."}

event: delta
data: {"text":"..."}

event: done
data: {"messageId":"...","finishReason":"stop","usage":{"promptTokens":100,"completionTokens":200}}

event: error
data: {"code":"AI_UPSTREAM_ERROR","message":"模型服务暂时不可用"}
```

---

## 6. 数据库需要补充的字段

### 6.1 `files.visibility`

```text
varchar(16) not null default 'private'
```

取值：`private` / `public`。

- 头像：public
- 简历 Word：private
- AI 图片和文档：private

### 6.2 `community_items.client_request_id`

```text
varchar(64) null
```

唯一索引：

```text
unique(user_id, client_request_id) where client_request_id is not null
```

用于一键分享和发布帖子的幂等。

### 6.3 后续可选的职位筛选字段

如果第二阶段改为服务端职位筛选，再给 `jobs` 增加：

```text
source, source_url, degree, salary_band,
experience, industry, headcount_band, funding,
job_group, job_sub, job_leaf
```

第一阶段不阻塞。

---

## 7. 模式 B 分层落位

### 7.1 分层职责

| 层 | 负责 | 禁止 |
|---|---|---|
| API | 路由、DTO 校验、HTTP 状态码、依赖注入 | 操作 ORM、Session、提交事务 |
| Service | 业务规则、编排、UoW 事务边界 | 直接依赖 SQLAlchemy Session |
| Repository | SQLAlchemy 查询、ORM 与 Entity 转换 | 调用 `session.commit()` |
| UoW | 事务提交、回滚、Repository 生命周期 | 承载业务规则 |
| Entity | 业务数据载体 | 依赖 ORM 或 Pydantic |
| DTO | API 输入输出 | 替代业务实体 |

### 7.2 Service 建议

| Service | 职责 |
|---|---|
| `AuthServiceA` | 登录、退出、会话 |
| `RegistrationServiceD` | 用户 + 档案 + 偏好 + 会话 |
| `FileServiceA` | 文件上传、下载、删除 |
| `JobServiceA` | 职位查询 |
| `FavoriteServiceA` | 职位收藏 |
| `ApplicationServiceA` | 投递、面试轮次、排序 |
| `ApplicationProgressServiceD` | 投递汇总、列表聚合 |
| `ResumeServiceA` | 简历 CRUD、任务 |
| `ResumeDraftServiceD` | 草稿、章节、Word 文件绑定 |
| `ResumeShareServiceD` | 简历 + 草稿 + 社区分享 |
| `CommunityServiceA` | 帖子、评论、点赞、收藏 |
| `AiChatServiceD` | 会话 + 消息 + 文件 + LLM，多事务 |

### 7.3 关键事务边界

| 场景 | 事务边界 |
|---|---|
| 注册 | 用户、档案、偏好、会话在 UoW 中提交 |
| 上传文件 | 先写对象存储，再写 `files`；失败时删除对象 |
| 保存草稿 | 文件已上传；PATCH 在一个 UoW 中更新草稿 |
| 一键分享 | 读取简历和草稿、插入社区内容在同一个 UoW |
| 投递排序 | 锁定当前用户相关投递，重排 position，再提交 |
| AI SSE | 两个短 UoW，流式期间不持有数据库事务 |

---

## 8. 前端页面与接口对应

| 页面 | 主要接口 |
|---|---|
| 登录/注册 | `/auth/register`、`/auth/login`、`/auth/me` |
| 导航栏/个人页 | `/auth/me`、`/me/profile`、`/files` |
| 首页 Dashboard | `/applications/summary`、`/jobs` |
| 职位列表 | `/jobs`、`/favorites/jobs` |
| 职位详情 | `/jobs/{id}`、`/favorites/jobs/{id}` |
| 投递进度 | `/applications`、`/applications/summary`、`/applications/{id}/rounds` |
| 简历页 | `/resumes`、`/resumes/{id}/drafts`、`/files` |
| 社区 | `/community/items`、`/community/shares`、`/community/posts` |
| 收藏页 | `/favorites/jobs`、`/community/saves` |
| 我的发布 | `/community/items?mine=true` |
| AI 助手 | `/ai/threads`、`/ai/threads/{id}/messages/stream` |

---

## 9. 第一阶段实现顺序

1. 基础设施：FastAPI、PostgreSQL、Redis、Alembic、Docker Compose、`/healthz`、`/readyz`。
2. 认证：注册、登录、退出、`/auth/me`、Redis 会话、Cookie、登录限流。
3. 文件：`/files` 上传、元数据、公开头像读取、私有 Word 下载、删除补偿。
4. 个人资料与职位：`/me/profile`、`/me/preferences`、`/jobs`、`/favorites/jobs`。
5. 简历：简历 CRUD、草稿 CRUD、Word + 文本保存、导出下载、任务状态。
6. 投递：投递 CRUD、阶段移动、看板排序、面试轮次、汇总接口。
7. 社区：分享快照、帖子、评论、点赞、收藏、信息流。
8. AI：会话、消息、SSE、附件、限流。
9. 迁移与联调：localStorage 导入、前端 API 适配、集成测试、Docker 部署验收。

每一步验收都要检查：

- API 不导入 ORM。
- Service 不导入 Session。
- Repository 不 commit。
- UoW 异常时 rollback。
- 所有用户数据查询都带 `user_id`。
- 文件下载校验归属。
- SSE 不长期占用数据库事务。

---

## 10. 测试清单

### 10.1 认证

- 注册重复邮箱返回 409。
- 登录失败返回统一 401，不泄露账号是否存在。
- Cookie 包含 `HttpOnly`、`SameSite=Lax`。
- 退出后旧 Cookie 无法继续访问。
- 会话过期返回 401。
- 登录限流生效。

### 10.2 文件

- 超过大小限制返回 413。
- 伪装扩展名返回 415。
- 不能下载他人的私有文件。
- 头像可以公开读取。
- 被草稿引用的文件不能删除。
- 路径穿越攻击被拒绝。

### 10.3 简历

- 草稿保存同时写入 `documentFileId` 和 `bodyText`。
- 至少保留一个草稿。
- 删除草稿后 Word 文件按引用清理。
- 旧数据迁移可重复执行。

### 10.4 投递

- 同一用户同一职位重复投递返回 409。
- 阶段移动和排序在同一事务中完成。
- 汇总数量与列表一致。
- 面试轮次排序正确。

### 10.5 社区

- 分享快照与保存后的草稿一致。
- 重复 `clientRequestId` 不产生重复分享。
- 不能编辑别人的帖子。
- 点赞、收藏重复调用不报错。
- 信息流返回 `likedByMe`、`savedByMe`、`commentCount`。

### 10.6 AI

- SSE 事件顺序为 `meta -> delta... -> done`。
- 客户端断开后消息状态为 `aborted`。
- LLM 异常时返回 `error` 并保存失败状态。
- 不能使用他人的 `fileId`。
- 用户级限流生效。

---

## 11. 后续可扩展项

- 服务端职位筛选。
- MinIO 存储切换工具。
- 邮箱验证和找回密码。
- 社区消息通知表。
- 服务端 Word 模板生成。
- AI 对话摘要和长期记忆。
- 多副本部署与共享存储。
