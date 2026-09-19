# QUALITHM

《随星录》音游企划的选曲与档案展示网页。原生 HTML / CSS / JavaScript，无需构建。

## 本地预览

使用任意静态服务器，例如 `python -m http.server 4173`，然后打开 `http://127.0.0.1:4173/`。直接双击 HTML 时也可使用生成的离线数据；在线资源仍需网络。

## 数据编辑

点击 DEBUG 后，在歌曲详情或曲包卡片上打开编辑器。浏览器编辑保存在本机；要发布到仓库，请导出 JSON，更新 `qualia_info.json`，再运行：

```sh
node tools/sync-seed.mjs
node tools/sync-seed.mjs --check
node tests/release-check.cjs
```

只手工维护 `qualia_info.json`，不要手改生成文件 `seed-fallback.js`。现有缓存会按 ID 非破坏性合并新增曲目。定数没有曲库当前最高值的业务限制；任意可精确表示的非负整数及常规定数小数均可录入。

旧缓存需要补入本次核对的试听入口时，在 DEBUG 歌曲编辑器点击「补全曲库空白试听」。Apple 结果只跳转官方发行页；自有／已获授权的音频才使用站内循环。详见 [试听来源清单](docs/preview-sources.md)。

## 发布

将根目录的 HTML、CSS、JS、JSON 与 assets 一起部署。GitHub Pages 可使用仓库 main 分支根目录。路径均兼容 `/QUALITHM/` 子目录。

浏览器回归测试需要 Playwright 与 Chromium，或设置 `QUALITHM_BROWSER_CHANNEL=msedge` 使用已安装的 Edge。测试运行在隔离临时资料中，不使用个人浏览器数据。

```sh
node tests/browser-smoke.cjs
```

详细新增曲目、暂定定数、版本来源和限制见 [8.4.0 发布记录](docs/release-8.4.0.md)。本项目是企划展示，不包含完整歌曲或实际判定玩法；游戏商标、曲绘、音乐归各自权利人所有。第三方素材许可说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
