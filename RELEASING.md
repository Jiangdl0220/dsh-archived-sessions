# 发布流程（RELEASING）

> **铁律：未经用户本地验收并明确 OK，不得推送 GitHub、不得发布 npm。**
>
> 顺序永远是：**实现 → 本地验收 → 发布**。发布（推送代码 + npm + Release）只能发生在用户说「OK」之后。

## 阶段一：实现与本地验收（发布前必经）

1. 实现改动；`pnpm typecheck` 与 `pnpm build` 必须通过。
2. **不发布 npm**，直接把本地构建产物同步进 profile 的 `node_modules`（desktop / web），或临时用 `file:` 依赖指向本地仓库——让应用能加载新代码即可。
3. 提醒用户**重启 DSH** 并在界面上验收：
   - 新功能符合预期；
   - 无回归（归档列表、查看器、恢复、删除等原有功能正常）。
4. **停在验收门**：等待用户明确说 OK。用户确认之前，禁止：bump 版本号、commit 发布提交、打 tag、push、publish。

## 阶段二：发布（验收通过后）

1. **更新 `CHANGELOG.md`**（Keep a Changelog 格式）：在顶部新增 `## [x.y.z] - 日期` 小节，按 `### 新增` / `### 修复` 等写清本次变更。
2. **更新 README**（中英文）：功能列表如有变化，同步修改；必要时更新安装说明。
3. `package.json` bump 版本号 → 提交（commit 消息带版本，如 `chore: bump to x.y.z`）。
4. 打 tag `vX.Y.Z` 并推送 `main` + tag。
5. 等待 CI（OIDC 信任发布）自动发布 npm，`npm view` 确认新版本在线。
6. **生成 GitHub Release 说明**（内容取自 CHANGELOG，中英对照）：
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z — <一句话主题>" --notes-file <notes.md>
   # 若 Latest 标记不对，用 API 修正：
   gh api -X PATCH repos/<owner>/<repo>/releases/<id> -f make_latest=true
   ```
7. 更新本地 profile 依赖版本并重新安装（或手动同步），再次告知用户重启确认线上版本与本地一致。

## 检查清单

- [ ] 用户本地验收通过（明确 OK）
- [ ] CHANGELOG.md 已更新（新版本小节）
- [ ] README（中/英）已同步
- [ ] 版本号已 bump 并提交
- [ ] tag 已推送，CI 发布成功（npm view 确认）
- [ ] GitHub Release 已创建、Latest 标记正确
