# LearnOpenGL & ProtoBuf 文章导入总结

## 📊 导入统计

### 总体数据
- **导入时间**: 2026-02-13
- **总文章数**: 33 篇
- **ID 范围**: 21 - 53

### 分类统计

#### 1. LearnOpenGL 系列（32 篇）
- **ID 范围**: 21 - 52
- **源目录**: `F:\0.学习\Note\typorafiles\计算机图形学\LearnOpenGL`
- **重命名**: 所有文件添加 "LearnOpenGL-" 前缀
- **排除文件**:
  - 所有 `(copy)` 备份文件
  - 所有 `(存档)` 文件
  - `test.md`
  - `声明.md`

**章节分布**:
- 第 0 章：GLSL 命名格式（1 篇）
- 第 1 章：入门（9 篇）- 窗口、三角形、着色器、纹理、变换、坐标系统、摄像机、复习
- 第 2 章：光照（7 篇）- 颜色、基础光照、材质、光照贴图、投光物、多光源、复习
- 第 3 章：模型加载（3 篇）- Assimp、Mesh、模型加载
- 第 4 章：高级技术（11 篇）- 深度测试、模板测试、混合、面剔除、帧缓冲、天空盒、高级数据、高级GLSL、几何着色器、实例化、抗锯齿
- 第 5 章：高级光照（2 篇）- Blinn-Phong、Gamma校正

#### 2. Unity-ProtoBuf（1 篇）
- **ID**: 53
- **源文件**: `F:\0.学习\Note\typorafiles\0.编写文档\Unity\ProtoBuf自定义生成规则，及编译生成dll与Exe.md`
- **重命名**: → `Unity-ProtoBuf自定义生成规则及编译dll与Exe.md`
- **图片数**: 28 张（全部为 GitHub 图片）

## 📂 文件位置

### MD 文件
```
public/posts/temp_import/
├── 计算机图形学/
│   └── LearnOpenGL/
│       ├── LearnOpenGL-0.GLSL命名格式.md
│       ├── LearnOpenGL-1.1-3窗口.md
│       ├── LearnOpenGL-1.10复习.md
│       ├── LearnOpenGL-1.4.三角形.md
│       ├── LearnOpenGL-1.5着色器.md
│       ├── ... (共 32 个文件)
│       └── LearnOpenGL-5.2Gamma校正.md
└── 0.编写文档/
    └── Unity/
        └── Unity-ProtoBuf自定义生成规则及编译dll与Exe.md
```

### 配置文件
- `src/data/posts.ts` - 已添加 33 篇文章配置

## 🖼️ 图片处理

### LearnOpenGL 系列
- **总图片数**: 1 张
- **GitHub 图片**: 1 张
- **本地图片**: 0 张

### Unity-ProtoBuf
- **总图片数**: 28 张
- **GitHub 图片**: 28 张
- **本地图片**: 0 张

### 图片来源
所有图片均来自 GitHub 公开仓库：
```
https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/
```

## 📝 配置详情

### 标签分类

#### OpenGL 相关
- `['OpenGL', 'GLSL', '计算机图形学']`
- `['OpenGL', 'GLFW', '计算机图形学']`
- `['OpenGL', '纹理', '计算机图形学']`
- `['OpenGL', '光照', 'Phong']`
- `['OpenGL', '模型加载', 'Assimp']`
- `['OpenGL', '实例化', '性能优化']`
- `['OpenGL', '抗锯齿', 'MSAA']`
- 等...

#### Unity 相关
- `['Unity', 'ProtoBuf', '序列化', '工具链']`

### 阅读时间分布
- 3-5 分钟：4 篇
- 6-8 分钟：26 篇
- 12 分钟：1 篇（ProtoBuf）

## ✅ 完成的工作

1. ✅ 筛选并排除备份文件（`copy`、`存档`、`test.md`、`声明.md`）
2. ✅ 重命名文件为规范格式（添加模块前缀）
3. ✅ 复制文件到临时目录
4. ✅ 批量处理图片链接（保持 GitHub 图片原样）
5. ✅ 生成文章配置并添加到 `posts.ts`
6. ✅ 为每篇文章添加合适的 excerpt 和 tags
7. ✅ 调整 ID 避免冲突（ProtoBuf ID 从 21 改为 53）

## 🎯 后续步骤

### 1. 本地预览
```bash
cd G:\workspace\2.workProject\PersonalBlog
npm run dev
```

访问: http://localhost:3000

### 2. 检查内容
- [ ] 查看文章列表，确认 33 篇新文章显示正常
- [ ] 随机打开几篇文章，检查 Markdown 渲染
- [ ] 检查图片加载（应该都能正常显示）
- [ ] 检查标签过滤功能

### 3. 优化配置（可选）
根据实际情况修改 `src/data/posts.ts` 中的：
- `excerpt` - 文章摘要
- `tags` - 标签分类
- `readTime` - 阅读时间

### 4. 提交部署
```bash
# 提交到 Git
git add .
git commit -m "新增 33 篇文章：LearnOpenGL 系列（32篇）+ ProtoBuf 教程（1篇）

- 添加 LearnOpenGL 教程全系列（入门、光照、模型、高级技术）
- 添加 Unity ProtoBuf 自定义生成规则教程
- 图片全部使用 GitHub 链接，无本地依赖

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 推送并部署
git push
npm run deploy
```

## 📚 文章清单

### LearnOpenGL 系列（ID 21-52）

#### 第 0 章
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 21 | LearnOpenGL-0.GLSL命名格式 | 2023-02-20 | OpenGL, GLSL, 计算机图形学 |

#### 第 1 章：入门
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 22 | LearnOpenGL-1.1-3窗口 | 2023-02-26 | OpenGL, GLFW, 计算机图形学 |
| 24 | LearnOpenGL-1.4.三角形 | 2023-03-20 | OpenGL, 计算机图形学, 渲染 |
| 25 | LearnOpenGL-1.5着色器 | 2023-02-26 | OpenGL, GLSL, 着色器 |
| 26 | LearnOpenGL-1.6纹理 | 2023-02-26 | OpenGL, 纹理, 计算机图形学 |
| 27 | LearnOpenGL-1.7变换 | 2023-02-28 | OpenGL, 计算机图形学, 数学 |
| 28 | LearnOpenGL-1.8坐标系统 | 2023-02-28 | OpenGL, 计算机图形学, 坐标系统 |
| 29 | LearnOpenGL-1.9摄像机 | 2023-03-08 | OpenGL, 计算机图形学, 摄像机 |
| 23 | LearnOpenGL-1.10复习 | 2023-02-15 | OpenGL, 计算机图形学 |

#### 第 2 章：光照
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 30 | LearnOpenGL-2.1颜色 | 2023-03-08 | OpenGL, 计算机图形学, 光照 |
| 31 | LearnOpenGL-2.2基础光照 | 2023-03-08 | OpenGL, 光照, Phong |
| 32 | LearnOpenGL-2.3.材质 | 2023-03-08 | OpenGL, 材质, 光照 |
| 33 | LearnOpenGL-2.4.光照贴图 | 2023-03-09 | OpenGL, 光照, 纹理 |
| 34 | LearnOpenGL-2.5.投光物 | 2023-03-10 | OpenGL, 光照, 光源 |
| 35 | LearnOpenGL-2.6.多光源 | 2023-03-11 | OpenGL, 光照, 多光源 |
| 36 | LearnOpenGL-2.7.复习 | 2023-02-17 | OpenGL, 光照, 计算机图形学 |

#### 第 3 章：模型加载
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 37 | LearnOpenGL-3.1Assimp | 2023-03-11 | OpenGL, Assimp, 模型加载 |
| 38 | LearnOpenGL-3.2Mesh | 2023-03-11 | OpenGL, Mesh, 模型 |
| 39 | LearnOpenGL-3.3模型加载 | 2023-03-11 | OpenGL, 模型加载, Assimp |

#### 第 4 章：高级技术
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 42 | LearnOpenGL-4.1深度测试 | 2023-03-12 | OpenGL, 深度测试, 计算机图形学 |
| 43 | LearnOpenGL-4.2模板测试 | 2023-03-12 | OpenGL, 模板测试, 特效 |
| 44 | LearnOpenGL-4.3混合 | 2023-03-13 | OpenGL, 混合, 透明 |
| 45 | LearnOpenGL-4.4面剔除 | 2023-03-13 | OpenGL, 面剔除, 性能优化 |
| 46 | LearnOpenGL-4.5帧缓冲 | 2023-03-13 | OpenGL, 帧缓冲, 后处理 |
| 47 | LearnOpenGL-4.6.天空盒 | 2023-03-16 | OpenGL, 天空盒, 立方体贴图 |
| 48 | LearnOpenGL-4.7高级数据 | 2023-06-03 | OpenGL, 缓冲对象, 高级技术 |
| 49 | LearnOpenGL-4.8高级GLSL | 2023-06-03 | OpenGL, GLSL, 着色器 |
| 50 | LearnOpenGL-4.9几何着色器 | 2023-06-03 | OpenGL, 几何着色器, GLSL |
| 40 | LearnOpenGL-4.10实例化 | 2023-06-03 | OpenGL, 实例化, 性能优化 |
| 41 | LearnOpenGL-4.11抗锯齿 | 2023-06-17 | OpenGL, 抗锯齿, MSAA |

#### 第 5 章：高级光照
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 51 | LearnOpenGL-5.1高级光照-blinn | 2023-06-17 | OpenGL, 光照, Blinn-Phong |
| 52 | LearnOpenGL-5.2Gamma校正 | 2024-11-19 | OpenGL, Gamma校正, 颜色空间 |

### Unity 系列（ID 53）
| ID | 标题 | 日期 | 标签 |
|----|------|------|------|
| 53 | Unity-ProtoBuf自定义生成规则及编译dll与Exe | 2023-11-08 | Unity, ProtoBuf, 序列化, 工具链 |

## 🔗 相关链接

- **博客地址**: https://liujianjie.github.io/PersonalBlog/
- **GitHub 仓库**: https://github.com/liujianjie/PersonalBlog
- **图片仓库**: https://github.com/liujianjie/Image

## 📅 时间线

- **2023-02-15 ~ 2023-06-17**: LearnOpenGL 主要学习期间
- **2023-11-08**: ProtoBuf 教程创建
- **2024-11-19**: Gamma 校正更新
- **2026-02-13**: 所有文章导入博客

---

*导入完成时间：2026-02-13*
*使用工具：批量导入脚本 + Claude Code*
