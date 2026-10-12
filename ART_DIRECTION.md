# 拉瓦锡时代实验室：视觉与素材方向

目标：参考 18 世纪末法国化学实验室，制作可探索、可近距离观看和操作的精细 3D 场景。不是现代实验室，也不是哥特魔法书房；不声称精确复原拉瓦锡原实验室。

## 视觉约定

- 空间：暖灰或米白灰泥墙、高窗、木框、旧木地板、木制操作台；依据历史参考逐步校正。
- 材质：深色木材、黄铜、铜、透明玻璃、陶瓷、纸张。保留轻微使用痕迹，避免夸张废墟化。
- 光线：窗侧柔和日光，局部温暖光源；让玻璃轮廓、金属反射和桌面物件清楚可辨。
- 器材：玻璃曲颈瓶、烧瓶、钟罩与气体收集装置、精密天平、实验炉、手写记录和试剂瓶。形制需核对历史图版。
- 画面：整间房的斜俯视展示、进入后的实验台特写、操作部件近景。
- 展示：仅保留三维场景和镜头操作，不添加文字 UI 或助手面板。

## 已核实公开来源（2026-10-09）

### 历史参考

1. Jacques-Louis David，《拉瓦锡夫妇肖像》（1788）。Commons API 标注 Public domain。可用于服饰、玻璃器材和桌面构图参考；肖像不是房间复原图。
   https://commons.wikimedia.org/wiki/File:David_-_Portrait_of_Monsieur_Lavoisier_and_His_Wife.jpg
2. Lavoisier humanexp。Commons API 标注 Public domain。用于研究实验活动与器材布局；年代和物件形制应结合文件页继续核对。
   https://commons.wikimedia.org/wiki/File:Lavoisier_humanexp.jpg
3. Lavoisier and Madame Lavoisier in his laboratory, Wellcome M0004488。Commons API 标注 CC BY 4.0；若使用该图需要记录文件页列出的作者和署名信息。
   https://commons.wikimedia.org/wiki/File:Lavoisier_and_Madame_Lavoisier_in_his_laboratory._Wellcome_M0004488.jpg

### 环境材质

Poly Haven 的资产使用 CC0。首批选择下列 1K 材质（颜色、OpenGL 法线、粗糙度），文件与校验记录存放在 public/textures/。

- 深色木材：https://polyhaven.com/a/dark_wood
- 旧木地板：https://polyhaven.com/a/old_wood_floor
- 灰泥墙面：https://polyhaven.com/a/plastered_wall
- 官方许可说明：https://polyhaven.com/license

这些材质用于环境表面，不代表器材模型已完成，也不是历史真实性的证据。

## 3D 模型策略

- 建筑和规则家具：自行建模，使用公开 PBR 材质。
- 玻璃器皿：根据参考轮廓建模，保证容器、液体与操作部件独立；不能只依赖贴图表现内部液面。
- 精密天平、气体装置与实验炉：优先筛选有明确许可的公开模型；暂未找到并验收可直接使用的具体资产。缺少合适模型时再单独建模或评估 Rodin。
- Sketchfab 等平台可作为搜索渠道，但“可看”“免费下载”不能视为可任意再发布；每个资产分别记录作者、许可、来源和修改。
- 作者 3Dworkshop 仓库没有公开完整房间模型，不作为可直接复制的资产库。

## 第一轮视觉验收

精细实验台与完整房间现已实现，src/App.tsx 为全屏纯场景。扩建版包含窗帘、炉具、书柜、书写区、地毯及生活陈设，用户已认可当前版本。用户最新范围仅要求场景，化学交互与 AI 界面不属于当前交付。
