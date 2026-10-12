# 当前版本验收记录

日期：2026-10-09。范围依据 GOAL.md：十八世纪拉瓦锡时代审美的纯 3D 场景，不含文字 UI、实验计算或 AI 导师。

用户对扩建后的空间、历史审美和生活细节明确回复：「整体符合，可以作为当前版本」。保留当前布局与风格。

## 验证

- 最终 npm run build 通过 TypeScript 与 Vite 构建，598 modules；JS 1,155.21 kB，gzip 322.62 kB。
- 本地预览 HTTP 200；桌面 1440×900 与窄视口 391×889 实际浏览器显示检查通过。
- 点击天平、钟罩、曲颈装置进入对应特写；拖动旋转、滚轮缩放与 Escape 返回全景通过。
- 页面可见文字为空，button/input/select/textarea 数量为 0。
- 修复依赖重载问题后，干净重载及最终检查无新增控制台警告或错误。
- 最终曲颈装置近景确认桌边布巾与桌面的穿插已修复；镜头复位正常。

## 截图

- room-expanded.jpg：最终桌面全景。
- retort-closeup.jpg：最终曲颈装置与布巾近景。
- bell-closeup.jpg、balance-closeup.jpg：钟罩与天平特写。
- room-narrow.jpg：窄视口全景证据。

## 素材与限制

Poly Haven 三套 CC0 材质共九张贴图，来源及校验见 public/textures/sources.json。Wikimedia Commons 拉瓦锡夫妇肖像为公有领域，记录见 public/art/sources.json。家具、仪器、织物与地毯为代码自建，没有使用 Rodin 或付费生成额度。

构建存在大于 500 kB 的 chunk 体积提示；未进行手机真机性能测量。场景为历史风格创作，不是精确历史复原。当前验收没有要求化学模拟、AI 接入或外网部署。
