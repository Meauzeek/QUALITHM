# 第三方资源说明

QUALITHM 是音游企划展示，不代表与页面涉及的游戏、作曲者或发行商存在正式联动或授权。可部署的软件不等于已经完成商业发行的版权清理。

## 随仓库分发的字体和图标

- IBM Plex Sans JP：500/600/700 本地 TTF，用于中日文与混排括号，英文仍用 Rajdhani。SIL OFL 1.1，许可见 [OFL-IBMPlexSansJP.txt](assets/fonts/OFL-IBMPlexSansJP.txt)，来源 [Google Fonts 官方仓库](https://github.com/google/fonts/tree/main/ofl/ibmplexsansjp)。

- Rajdhani：Copyright © 2014 Indian Type Foundry；SIL Open Font License 1.1。完整许可见 [OFL-Rajdhani.txt](assets/fonts/OFL-Rajdhani.txt)，来源为 [Google Fonts / Rajdhani](https://github.com/google/fonts/tree/main/ofl/rajdhani)。保留原有字体，未重新设计字形。
- Font Awesome Free 6.4.0：Copyright © 2023 Fonticons, Inc.；字体适用 SIL OFL 1.1，CSS 适用 MIT。完整原始许可见 [LICENSE.txt](assets/fontawesome/LICENSE.txt)，来源为 [Font Awesome 6.4.0](https://github.com/FortAwesome/Font-Awesome/tree/6.4.0)。品牌图标仍属相应商标权人。
- Noto Sans SC：通过 Google Fonts 远程样式加载；网络不可用时使用系统中文字体，英文 Rajdhani 已本地化。
- Noto Sans 希腊文子集：仅在希腊字母及其附着组合符号上启用，本地 WOFF2 包含 Greek、Greek Extended 和组合重音；400–700 可变字重。来自 Google Fonts 的 Noto Sans，以 SIL OFL 1.1 分发，完整许可见 [OFL-NotoSans.txt](assets/fonts/OFL-NotoSans.txt)。字体家族名仅在本项目 CSS 中别名为 Qualithm Greek；字体文件由 Google Fonts 官方子集接口生成，未修改字形。

- Roboto：卡片难度全名与定数使用本地可变字体的 900 字重，文件来自 [Google Fonts 官方仓库](https://github.com/google/fonts/tree/main/ofl/roboto)，SIL OFL 1.1，许可见 [OFL-Roboto.txt](assets/fonts/OFL-Roboto.txt)。这是参考字形的近似实现，不是已确认的 CHUNITHM 官方用字。
- Archivo Black：旧版试用字体，当前不加载。本地 TTF 来自 [Google Fonts 官方仓库](https://github.com/google/fonts/tree/main/ofl/archivoblack)，SIL OFL 1.1，许可见 [OFL-ArchivoBlack.txt](assets/fonts/OFL-ArchivoBlack.txt)。
- Barlow Semi Condensed ExtraBold：旧版试用字体，当前不加载。SIL OFL 1.1，许可见 assets/fonts/OFL-BarlowSemiCondensed.txt。

## 配色工具

Chroma.js 3.2.0（Gregor Aisch）随站点本地分发，采用 BSD-3-Clause；内含 ColorBrewer 配色数据采用 Apache-2.0。原始声明见 [chroma-LICENSE.txt](assets/vendor/chroma-LICENSE.txt)，Apache 完整许可见 [Apache-2.0.txt](assets/vendor/Apache-2.0.txt)。固定版本的浏览器发行文件来自官方文档链接的 [npm / unpkg 发行包](https://unpkg.com/chroma-js@3.2.0/dist/chroma.min.cjs)。本项目使用其 OKLCH 与 contrast 功能调整 MET 色彩，未修改库的实现。

## 音乐与图片

仓库不包含完整版权歌曲或下载的试听音频。官方发行页链接、API 元数据和曲绘 URL 不构成对歌曲、图片、角色或商标的使用授权。

Apple iTunes Search API 的音乐片段只允许条款规定的宣传用途，并不是游戏循环音频许可。因此代码将 Apple 样本标记为外部试听，点击后打开相应 Apple Music 发行页；不会自动播放或将其作为选曲循环。自有／另获授权的音频可以配置站内循环、起止时间与淡入淡出。参见 [Apple Search API 使用条件](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/)。

曲绘和分类图是第三方远程引用，仅用于本企划资料展示，权利归原作者。逐曲资料与核对页面见 qualia_info.json 的 metadataSources；图片可访问不代表已经获准商业再利用。正式商业发布前，请替换为自有或已取得相应用途许可的素材，并保存授权证明。第三方要求移除或资源失效时应及时替换。

角色 PNG 请由企划方提供可发布版本。仓库中残留的旧本地路径不能在其他设备访问，程序会回退占位，不会尝试读取访客的本地文件。
