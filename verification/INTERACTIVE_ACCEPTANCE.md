# 互动实验室交付与验收

日期：2026-10-10（Asia/Shanghai）。本文保留早期互动版范围 INTERACTIVE_LAB_PLAN.md P0–P6 的验收记录。用户曾回复「认可当前风格与操作，可验收」；随后否决浮动文本框并要求实体氛围与家具交互。因此下文的人工通过仅适用于当时版本，不能替代当前实体版验收。最新证据见 USABILITY_ACCEPTANCE.md。

## 阶段成果

| 阶段 | 实际交付与证据 |
| --- | --- |
| P0 | 验收基线存档；物质与器材注册表；六个实验及有限科学规则，见 SCIENCE_MODEL.md |
| P1 | 同风格羊皮纸、点击与拖动阈值、柜中取瓶、瓶塞、倾角/时间连续倒液、真实吸附与无效位置退回；用户认可 |
| P2 | 铁与硫酸铜取液、夹铁、反应、取回金属、残液收集、洗杯闭环；20 次取放与液体事务测试，无复制或丢失 |
| P3 | 宏观与微观读取同一计算状态；公式、电荷、分子、离子、电子转移、旋转、缩放与收起；用户认可 |
| P4 | 中和、碳酸盐、沉淀；10 mL 量取器皿、0.5 mL 滴管、0.100 g 药匙与称量；正常、过量及零反应边界有数值测试 |
| P5 | 导管集气、互斥密闭塞、隔室内部混合、装配随杯移动、气体出入与密闭称量；真实鼠标复做通过 |
| P6 | 可读近景、窄视口介绍、长按取物、版本化本地恢复、炉具教学温度、操作文档、测试/构建/浏览器证据；人工认可。性能与真机限制见下 |

纯场景基线：baseline/accepted-scene-2026-10-09.zip，SHA256 `BDEBF9813DF991F68485E2B8697C90EBC8C177D3DD616D2AD0D72AB436F5C0B8`。原记录 ACCEPTANCE.md 保留，不覆盖为互动验收。

## 六个实验：真实鼠标操作结果

浏览器脚本只读取开发态投影与状态，操作通过鼠标、键盘和可见羊皮纸完成，不直接注入材料或计算结果。边界自动测试与真实操作证据分别记录。

| 实验 | 输入与结果 | 截图/脚本 |
| --- | --- | --- |
| 铁与硫酸铜 | 最终复做连续倒液 29.232 mL；源瓶余 70.768 mL；夹铁 0.140 g = 0.002506938849 mol；生成 Cu 0.002506938849 mol，余 Cu²⁺ 0.000416261151 mol，铁耗尽；取回、废液与洗杯成功，药剂瓶返回柜中原位 | continuous-pour.png、iron-reaction.png、iron-micro.png；browser-first.cjs、final-first.log、final-cleanup.log |
| 酸碱中和 | 酸 10 mL + 碱 10 mL + 酚酞 0.5 mL；中和 0.001 mol。再加碱 10 mL，余 OH⁻ 0.001 mol，溶液变粉红 | neutralization-base-excess.png；browser-liquid-experiments.cjs |
| 氢氧化铜沉淀 | 硫酸铜 10 mL + 碱 10 mL；Cu(OH)₂ 0.0005 mol = 0.048780 g，余 Cu²⁺ 0.0005 mol | precipitation.png；browser-liquid-experiments.cjs |
| 碳酸盐与酸 | 称量碳酸钠 0.100 g，加水 10 mL 后加酸 10 mL；集得 CO₂ 0.0005 mol = 0.0220045 g | carbonate-collection.png；browser-liquid-experiments.cjs |
| 锌与稀酸 | 锌 0.140 g + 酸 20 mL；导管收集 H₂ 0.001 mol = 0.002016 g，未记作敞口逸散 | zinc-collection.png；browser-gas-experiments.cjs、final-gas.log |
| 密闭质量守恒 | 杯内隔室先隔离锌；称量并密闭后点击玻璃棒内部混合。反应前/后均 105.140 g；塞子归架开口后 105.137984 g，差 0.002016 g | closed-before.png、closed-after.png；final-gas.log |

连续倒液量随鼠标持续时间变化，表中记录该次实际结果，不作为所有运行的固定剂量。气体实验最终复查采用真实原位吸附目标，确认无效放置不会提前拆开密闭系统。

## 工程验证

- `npm.cmd test`：38 项通过，0 失败。包括元素/电荷计量、限量与过量、铜负对照、零剂量、容量、重复添加、气体路径、20 次取放与转移、清理、密闭装配、损坏快照及库存总量校验。见 final-tests.log。
- `npm.cmd run build`：TypeScript 与生产构建通过；602 modules，JS 1,204.99 kB，gzip 339.88 kB；CSS 1.31 kB。保留大于 500 kB 的构建体积提示。见 final-build.log。
- 炉台实际放入 10 mL 水，点击实体炉门开火；约 5 秒后温度 28.84797 °C。朝 60 °C 的教学目标渐近变化，非真实热力学预测。
- 桌面 1440×900、窄视口 391×889 均实际显示，实验本页签可点击，羊皮纸未超出屏幕；见 interactive-room.png、interactive-narrow.png、notebook-narrow.png。窄视口介绍按镜头退距补偿大小。
- 非空实验保存恢复：密闭实验开塞后，酸库存 80 mL、逸出 H₂ 0.001 mol。重载后库存、固体、容器（含气体）、废液、回收物、夹具、量取器皿、隔室、粉末、物件位置、开塞与实验编号共 13 组字段一致；见 final-polish.log。
- 最终开发浏览器控制台 Errors 0、Warnings 0；见 final-dev-console.log。生产页面 http://127.0.0.1:4173/ 正常启动，开发态投影/状态工具未进入生产包；控制台 Errors 0、Warnings 0，见 final-production.log、final-production-console.log。production-room.png、production-narrow.png 已逐图检查。

## 性能与已知限制

Windows；CPU i9-13900HX。主机同时有 RTX 4070 Laptop 和 Intel UHD，但本次 Chromium 实际 WebGL renderer 为 `ANGLE (Intel, Intel(R) UHD Graphics (0x0000A788) Direct3D11 vs_5_0 ps_5_0, D3D11)`；DPR 1。不能把核显测量写成独显性能。

性能测量由 requestAnimationFrame 连续采样约 6 秒，均值取 1000 / 平均帧间隔，p95 为排序后的第 95 百分位。使用无头浏览器，避免后台有头窗口约 1 FPS 的节流影响。短时测量不等同长期稳定性或手机性能。

优化包括：静态场景复用阴影贴图，世界状态变化或拖动时更新；数值形状未变时复用旋转体与导管几何，避免热状态更新时重新构建器皿。

| 最终测量 | 视口 | 样本 | 平均 FPS | p95 帧间隔 |
| --- | --- | --- | --- | --- |
| 开发版本：非空实验称量后的视角 | 1440×900 | 104 | 16.97 | 166.8 ms |
| 开发版本：加热中，窄视口 | 391×889 | 286 | 47.55 | 25.1 ms |
| 生产版本：初始房间全景 | 1440×900 | 165 | 27.26 | 104 ms |
| 生产版本：初始房间全景，窄视口 | 391×889 | 295 | 49.08 | 25 ms |

证据：final-polish.log、final-production.log。桌面核显测量未达到稳定 50–60 FPS，也未达到低档 30 FPS 目标；如实保留为已知性能限制。窄视口平均值不能证明桌面达标。未进行 GPU 时间分析或独显强制选用测试，不能断言所有停顿的具体瓶颈。未增加专门低画质档位；当前画布 DPR 上限 1.5，阴影 2048，保留已验收美术。

手机真机触控、真机 GPU 性能尚未验收；桌面窄视口截图不冒充真机。触屏长按 350 ms 已实现。以上限制随交付记录保留，人工验收不替代性能测量或真机验收。

有限反应库、近似密度、指示剂阈值、速率、热模型与示意微观尺度见 SCIENCE_MODEL.md；不预测任意混合物、真实平衡、气压、动力学或热力学。库存总量保存包含废液、回收金属和逸出/收集气体；实验本重置是明确重开实验。

## 来源与许可

- Poly Haven PBR 贴图 CC0，原始来源、下载与修改记录见 ../public/textures/sources.json。
- Jacques-Louis David 拉瓦锡夫妇肖像，Commons 标注 Public domain，见 ../public/art/sources.json。
- 房间、家具、器材、标签、粒子与磨损效果为工程代码制作；无新增下载模型或付费生成。
- OpenStax Chemistry 2e 为科学参考，链接和访问情况见 SCIENCE_MODEL.md；公式与计算自行实现，未复制教材正文或插图。
- 未发布外网，未启用 AI 导师或付费服务。
