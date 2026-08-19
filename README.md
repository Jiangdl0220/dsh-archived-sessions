# dsh-archived-sessions

> 查看和管理 DSH（DeepSeek Harness）中已归档的会话：浏览归档列表、在聊天式弹窗里阅读完整对话（轮次 / 推理 / 工具执行 / Markdown 表格），以及删除不再需要的归档记录。桌面端与 Web 端通用。

DSH 中「归档会话」后，会话会从所有界面消失且无法找回。这个插件在设置页新增「**已归档会话**」页面，把归档列表找回来。

## 功能

- **归档列表**：标题、所属工作区、消息数、最后活跃时间一目了然；支持刷新。
- **对话查看器**：点击会话弹出只读对话流（弹窗覆盖在设置面板之上，关闭后回到列表）。
  - 按**轮次**分组，每轮把「工作过程」（推理、工具调用、命令执行）折叠起来，最终回答清晰呈现；
  - Markdown 渲染：标题、无序/有序列表、引用、链接、代码块（自动美化 JSON）、**表格**（可横向滚动）；
  - 工具执行以终端卡片展示：工具名、状态点（成功/失败）、`$` 命令行、可展开的输出；
  - 系统注入的消息（运行上下文快照、技能清单等）单独折叠，不会和用户消息混淆。
- **删除归档记录**：两步确认，从归档列表移除。DSH 产品本身没有会话删除 API，因此实现为「墓碑」——会话保持归档状态（产品 UI 永远隐藏它），数据文件保留在磁盘（与产品行为一致）。

## 安装

```bash
# 桌面端
dsh plugin add @jiangdaoli/dsh-archived-sessions

# 或手动：把包加入 profile 的依赖与 bundles 后重启
```

安装并重启后：**设置 → 已归档会话**。

## 开发

```bash
pnpm install
pnpm build   # esbuild 单文件 host + client 产物到 lib/
pnpm typecheck
```

本地测试：

```bash
cd ~/.dsh/profiles/desktop
pnpm add file:/path/to/dsh-archived-sessions
# 在 package.json 的 dsh.profile.bundles 加入 "dsh-archived-sessions"，重启 App
```

## 架构

- **Host 半部**（`src/index.ts` → `runtime.ts`）：通过官方 DSH 服务读取数据 —— `workspaceRegistry`（归档集合）、`sessionQuery`（标题 / 对话投影）、`sessionPersistence.readRaw`（损坏日志的宽松兜底）。经 Typert Remote 暴露 `archived/list`、`archived/surface`、`archived/delete`。删除只写入插件自己的 settings 命名空间（墓碑），从不改动会话数据。
- **Client 半部**（`src/client/index.ts`）：挂载 Remote 命名空间，注册 `settings.section`（id `archived-sessions`）。查看器在设置面板内部渲染，天然处于最顶层。
- **兼容性**：只使用官方 DSH contract，不注入任何 desktop 专属 service，桌面端 / Web / CLI 均可用。

## 说明与限制

- 删除仅移除归档记录；会话数据保留在磁盘（DSH 从不删除会话数据）。
- 日志损坏（seq 缺口）的会话会显示「日志损坏」标记，打开时展示可解析的部分内容。
- 「继续对话 / 还原归档」不在本插件范围（产品无对应 API）；可先用 DSH 自带的会话 Fork 功能。

## License

MIT
