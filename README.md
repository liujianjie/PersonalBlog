# 个人博客

> **分支说明(2026-05-09 起)**
>
> | 分支 | 技术栈 | 部署 | 访问入口 | 状态 |
> |---|---|---|---|---|
> | `main` | React 18 + Vite + Tailwind | GitHub Pages | https://liujianjie.github.io/PersonalBlog/ | 冻结(回退/对照用) |
> | `uniapp-rewrite` | uni-app + Vue 3 + UnoCSS | 本机 Caddy + Cloudflare Tunnel | https://blog.multilab.cc/ | 主版本(开发中) |
>
> 重写方案、目录、决策见 [`SPEC.md`](./SPEC.md);实施计划见 [`tasks/plan.md`](./tasks/plan.md) + [`tasks/todo.md`](./tasks/todo.md)。

---

一个使用 React + TypeScript + Tailwind CSS 构建的现代化个人博客网站。

## 特性

- ✨ 现代化的 UI 设计
- 📱 完全响应式，支持移动端
- 🔍 文章搜索功能
- 🏷️ 标签分类系统
- 📝 Markdown 文章支持
- 🎨 代码语法高亮
- ⚡ 快速加载和流畅体验

## 技术栈

- **前端框架**: React 18
- **类型系统**: TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **路由管理**: React Router
- **Markdown**: react-markdown
- **代码高亮**: highlight.js
- **日期处理**: date-fns

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 查看网站

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 自定义内容

### 修改博客信息

编辑 `src/data/posts.ts` 文件：

- 修改 `authorInfo` 对象来更新个人信息
- 修改 `posts` 数组来添加、编辑或删除文章

### 添加新文章

在 `src/data/posts.ts` 的 `posts` 数组中添加新对象：

```typescript
{
  id: '6',
  title: '你的文章标题',
  excerpt: '文章摘要',
  content: `# 文章内容（支持Markdown）`,
  date: '2024-03-26',
  tags: ['标签1', '标签2'],
  author: '作者名',
  readTime: 5
}
```

### 自定义样式

- 修改 `tailwind.config.js` 来自定义主题颜色
- 编辑 `src/index.css` 来调整全局样式

## 项目结构

```
PersonalBlog/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── PostCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── TagList.tsx
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx
│   │   ├── PostDetail.tsx
│   │   └── About.tsx
│   ├── data/           # 数据文件
│   │   └── posts.ts
│   ├── types/          # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx         # 主应用组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 部署

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细的部署指南。

支持部署到：
- Vercel
- Netlify
- GitHub Pages
- 传统服务器

## License

MIT

## 联系方式

如有问题或建议，欢迎联系：

- Email: your.email@example.com
- GitHub: https://github.com/yourusername
