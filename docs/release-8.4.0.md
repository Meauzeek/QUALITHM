# QUALITHM 8.4.0 发布记录

这是《随星录》QUALITHM 企划的选曲与档案展示网页。曲包编排和 QUALITHM 定数属于本企划设计，不表示版权方已经授权或正式公布联动；网站不包含实际判定玩法或完整版权音频。

## 本次内容

保留全部 39 首旧曲，新增 34 首，总计 73 首 / 333 张谱面。Phigros 4 首；Paradigm: Reboot 10 首（5 + 5）；Rotaeno 4 首；Cytus II 16 首（PHASE I 主曲 10 + Hidden 1，PHASE II 已确认 5）。未加入任何候选曲。

保留原有 Rajdhani 字体、黑白基底、紫色 MET 与倾斜曲包卡片。发布包括此前本地的 Level 索引、精确选谱、独立曲包页、快速切包、收藏、随机选曲、看板娘轮换、音乐预览、移动端和 DEBUG 编辑修复。新增轻量 HIDDEN 标识、别名检索、策划顺序、独立 WMS 试听、网络回退和键盘焦点样式。横屏为底部系统工具栏预留区域，避免遮挡编辑按钮。HYP 保留 MET 的紫色谱系，改用冷紫主体、冰白定数分区、斜向细线纹路与切角边框，不再使用紫黑或偏红渐变。

## 数据维护和兼容

唯一手工维护源为 qualia_info.json。运行 node tools/sync-seed.mjs 生成 seed-fallback.js；--check 会检查生成文件是否同步。script.js 不再复制维护歌曲数据。启动优先加载 JSON（5 秒超时），网络失败使用同版本内置 seed。

继续使用 QUALITHM_DB_V9，并兼容 V8，不更换 key、不清空缓存。每次启动按稳定 song id 合并：已有 id 保留本地整个对象，不存在的 id 追加；补齐分类顺序与 catMeta，保留本地自定义顺序、曲包封面、角色和自定义歌曲。重复刷新不重复追加。已有缓存可通过 DEBUG 歌曲编辑器的「补全曲库空白试听」主动填入已核对来源，只处理 ID、曲名、作者相同且试听与区间为空的歌曲。按本次要求，删除官方 seed 曲目后刷新会再次补回；删除自定义曲目不受影响。损坏缓存不会被覆盖，临时使用内置数据供浏览。

## 定数范围

引擎没有 16.3 或 18.0 的业务硬上限。17.0、17.5、18.0、999、1000 等数值均可输入、显示并动态生成 LEVEL 分组。粗略档位采用整数与 .5 起的 +；精确显示保留一位小数。WHIMSY 按谱面类型识别，不再占用数字 999。数字存储使用 JavaScript Number，超出其精确表示能力的超大整数不属于本次支持范围。系统能力不等于正式收录范围；此次联动最高 16.0，旧曲高于 16.3 的数据原样保留。

## 暂定定数（供人工复核）

★ 为用户明确锁定；其余表中数值全部为本次拟定的 provisional ratings。HYP 仅为零號車輛、翠杜和 Quadruplicity 新增。sense of wonder MET 15.9 采用用户建议；iL MET 15.7 采用用户建议。未按本家定数机械换算。

| 曲包 / PHASE | 曲目 | NUL | PHM | DEC | MET | HYP |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Phigros / I | Luminescence | 4.0 | 8.0 | 11.7 | 14.1 | — |
| Phigros / I | Chronos Collapse - La Campanella | 5.0 | 9.0 | 12.8 | 15.2 | — |
| Phigros / I | Crave Wave | 3.0 | 7.0 | 10.5 | 13.5 | — |
| Phigros / I | DESTRUCTION 3,2,1 | 7.0 | 11.0 | 14.0 | 16.0 ★ | — |
| Paradigm: Reboot / I | Artificial Existence | 4.0 | 8.0 | 11.5 | 14.0 | — |
| Paradigm: Reboot / I | RE; Boot | 5.0 | 9.0 | 12.3 | 14.8 | — |
| Paradigm: Reboot / I | Fractal Fission | 6.0 | 10.5 | 13.4 | 15.5 | — |
| Paradigm: Reboot / I | sense of wonder | 7.0 | 11.0 | 13.8 | 15.9 | — |
| Paradigm: Reboot / I | 再也不见，那天的雪 · HIDDEN | 2.0 | 6.0 | 9.2 | 12.3 | — |
| Paradigm: Reboot / II | Awaken In Ruins | 2.0 | 5.0 | 8.5 | 11.8 | — |
| Paradigm: Reboot / II | Echoes of the Forest | 4.0 | 8.5 | 12.0 | 14.6 | — |
| Paradigm: Reboot / II | 零號車輛 | 6.0 | 10.5 | 13.4 | 15.3 ★ | 16.0 ★ |
| Paradigm: Reboot / II | Observatory | 7.0 | 11.5 | 14.0 | 15.9 ★ | — |
| Paradigm: Reboot / II | Paradigm la noche · HIDDEN | 2.0 | 6.0 | 9.8 | 12.8 | — |
| Rotaeno / I | Inverted World | 4.0 | 8.0 | 11.8 | 14.4 | — |
| Rotaeno / I | Manifold Hypothesis | 4.0 | 8.3 | 11.6 | 14.2 | — |
| Rotaeno / I | 翠杜 | 5.0 | 9.5 | 12.8 | 14.5 ★ | 15.8 ★ |
| Rotaeno / I | Quadruplicity | 6.0 | 10.5 | 13.3 | 15.4 ★ | 16.0 ★ |
| Cytus II / I | Jakarta PROGRESSION | 3.0 | 7.5 | 11.2 | 13.8 | — |
| Cytus II / I | Qualia | 3.0 | 7.8 | 11.5 | 14.0 | — |
| Cytus II / I | Alexandrite | 4.0 | 8.5 | 12.0 | 14.7 | — |
| Cytus II / I | iL | 6.0 | 10.5 | 13.7 | 15.7 | — |
| Cytus II / I | D R G | 2.0 | 6.0 | 9.5 | 12.5 | — |
| Cytus II / I | CHAOS | 5.0 | 9.5 | 13.0 | 15.0 | — |
| Cytus II / I | V. | 6.0 | 10.0 | 13.4 | 15.3 | — |
| Cytus II / I | The Whole Rest | 2.0 | 6.0 | 9.5 | 12.6 | — |
| Cytus II / I | Bullet Waiting for Me(James Landino remix) | 2.0 | 6.5 | 9.7 | 12.8 | — |
| Cytus II / I | ͟͝͞Ⅱ́̕ | 5.0 | 9.5 | 13.2 | 15.5 ★ | — |
| Cytus II / I | YUBIKIRI-GENMAN · HIDDEN | 2.0 | 5.0 | 8.5 | 11.8 | — |
| Cytus II / II | Space Colony | 3.0 | 6.5 | 10.0 | 13.0 | — |
| Cytus II / II | CydraL | 3.0 | 7.0 | 10.7 | 13.6 | — |
| Cytus II / II | Magnolia | 5.0 | 9.5 | 12.8 | 15.0 | — |
| Cytus II / II | Marigold | 5.0 | 9.8 | 13.0 | 15.2 | — |
| Cytus II / II | Used to be | 2.0 | 5.0 | 8.7 | 11.8 | — |

͟͝͞Ⅱ́̕ 另外拥有 WMS [全]，显示名为「͟͝͞Ⅱ́̕ (Full Version)」，不设置 HYP；Unicode 原文未归一化。NUL–MET 标记为短版，2:44 只是参考 Arcaea 已发行剪辑的时长，QUALITHM 自己的正式剪辑仍待制作。WMS Full Version 时长 445669 ms 来自官方 Apple Music OST 元数据；仅保存其官方试听来源并跳转发行页，不包含完整音频。普通档试听为空，避免误播放 Full Version 试听。WMS 的标题、封面和试听不会改写普通档。

## 素材、来源与待确认项

34 首新曲 artist、BPM、曲绘均有来源记录。曲绘为对应原游戏 Wiki 的 jacket，已逐一检查 HTTP 返回图片；备用封面仅采用已核对作者的 Apple Music 正式专辑图。4 个分类图来自 iTunes software 的准确游戏匹配。所有新路径为 HTTPS，无 Windows 路径。

新增曲中 16 首、旧曲中 29 首核对到 Apple 发行试听入口，总计 45 首（含 ͟͝͞Ⅱ́̕ 的 WMS）；其余 28 首保持空白。Apple 样本只跳转到官方发行页，不作为站内循环音频；公开的 previewUrl 不意味着游戏用途授权。完整核对清单见 [preview-sources.md](preview-sources.md)。试听可能为官方专辑编曲，releaseDurationMs 与游戏 durationMs 分开存储。第三方 URL 的后续有效性无法保证：图片失败回退到对应官方专辑图或占位，音频失败允许重试并保留操作。没有下载或提交完整歌曲。

需要后续人工确认的是 QUALITHM 短版音频剪辑、所有 provisional ratings，以及缺失的试听资源。原有 N:\\ 本地图片路径仍保留在旧数据中，线上无法访问时显示占位；需要作者另行提供可发布图片。

来源逐曲存放在 metadataSources 字段。关键核对页：

- [Phigros 曲目资料](https://wikiwiki.jp/phigros/Chronos%20Collapse%20-%20La%20Campanella)
- [Paradigm: Reboot — sense of wonder](https://wikiwiki.jp/paradigm_/sense%20of%20wonder)
- [Rotaeno — Quadruplicity](https://wikiwiki.jp/rotaeno/Quadruplicity)
- [Cytus II — Jakarta PROGRESSION](https://wikiwiki.jp/cytus-2/Jakaruta%20PROGRESSION)
- [CydraL 与原名](https://wikiwiki.jp/deemo/CydraL)
- [͟͝͞Ⅱ́̕ 短版资料](https://wikiwiki.jp/arcaea/%E2%85%A1)

## 验证

node tests/release-check.cjs：唯一 ID、全部曲包数量、锁定定数、递进、HYP 回退、Unicode、WMS、保留本地编辑的 V8/V9 迁移、重复迁移、JSON 离线回退、损坏缓存不覆盖、同名匹配、高定数无硬上限。

node tests/browser-smoke.cjs：隔离 Chromium/Edge，在 1366×768、1920×1080、390×844、844×390 检查曲包、PHASE、选谱、DEBUG 编辑、18.5 定数显示、WMS 与别名搜索、方形曲绘、宽度溢出、V8 实际刷新迁移和离线 JSON 回退。外部图片/音频被阻断时也必须可用。
