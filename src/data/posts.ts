import { Post } from '../types';

export const posts: Post[] = [
  {
    id: '6',
    title: 'Addressable（1）导入 Addressable',
    excerpt: '详细介绍如何在 Unity 项目中导入和配置 Addressable 系统，包括安装步骤和配置文件创建。',
    date: '2023-11-20',
    tags: ['Unity', 'Addressable', '游戏开发'],
    author: '博主',
    readTime: 5,
    mdFile: '/PersonalBlog/posts/游戏开发/Unity/Addressable/Addressable（1）导入Addressable.md'
  },
  {
    id: '1',
    title: '欢迎来到我的博客',
    excerpt: '这是我的第一篇博客文章，在这里我将分享关于编程、技术和生活的点点滴滴。',
    date: '2024-03-15',
    tags: ['博客', '随笔'],
    author: '博主',
    readTime: 3,
    content: `# 欢迎来到我的博客

大家好！欢迎来到我的个人博客。

## 关于这个博客

这是一个使用 React + TypeScript + Tailwind CSS 构建的现代化博客网站。在这里，我将分享：

- 💻 **技术文章**：编程经验、技术总结
- 📚 **学习笔记**：学习过程中的心得体会
- 🌟 **生活感悟**：工作和生活的思考

## 技术栈

本博客使用的技术栈：

\`\`\`javascript
const techStack = {
  frontend: ['React', 'TypeScript', 'Tailwind CSS'],
  build: 'Vite',
  markdown: 'react-markdown'
};
\`\`\`

## 开始探索

你可以通过以下方式浏览内容：

1. 在首页查看最新文章
2. 使用搜索功能查找感兴趣的内容
3. 通过标签分类浏览相关文章
4. 访问关于页面了解更多信息

> 感谢你的访问，希望你能在这里找到有价值的内容！

---

*Stay curious, keep learning!*
`
  },
  {
    id: '2',
    title: 'React Hooks 最佳实践',
    excerpt: '深入探讨 React Hooks 的使用技巧和最佳实践，帮助你写出更优雅的 React 代码。',
    date: '2024-03-18',
    tags: ['React', 'JavaScript', '前端开发'],
    author: '博主',
    readTime: 8,
    content: `# React Hooks 最佳实践

React Hooks 自 16.8 版本引入以来，已经成为 React 开发的标准方式。本文将分享一些使用 Hooks 的最佳实践。

## useState 使用技巧

### 1. 函数式更新

当新状态依赖于旧状态时，使用函数式更新：

\`\`\`javascript
// ❌ 不推荐
setCount(count + 1);

// ✅ 推荐
setCount(prevCount => prevCount + 1);
\`\`\`

### 2. 合理拆分状态

不要把所有状态都放在一个对象里：

\`\`\`javascript
// ❌ 不推荐
const [state, setState] = useState({ name: '', age: 0, email: '' });

// ✅ 推荐
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [email, setEmail] = useState('');
\`\`\`

## useEffect 最佳实践

### 1. 明确依赖项

\`\`\`javascript
useEffect(() => {
  fetchData(userId);
}, [userId]); // 明确声明依赖
\`\`\`

### 2. 清理副作用

\`\`\`javascript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(timer); // 清理
}, []);
\`\`\`

## 自定义 Hook

封装可复用的逻辑：

\`\`\`javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
\`\`\`

## 总结

- 使用函数式更新避免闭包陷阱
- 合理拆分状态提高代码可维护性
- 明确声明 useEffect 依赖项
- 及时清理副作用
- 封装自定义 Hook 提高代码复用性

Happy coding! 🚀
`
  },
  {
    id: '3',
    title: 'TypeScript 类型体操实战',
    excerpt: '通过实际案例学习 TypeScript 的高级类型技巧，提升类型编程能力。',
    date: '2024-03-20',
    tags: ['TypeScript', '前端开发', '进阶'],
    author: '博主',
    readTime: 10,
    content: `# TypeScript 类型体操实战

TypeScript 的类型系统非常强大，本文将通过实际案例展示一些高级类型技巧。

## 实用工具类型

### 1. DeepPartial

将对象的所有属性递归转为可选：

\`\`\`typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

interface User {
  name: string;
  address: {
    city: string;
    street: string;
  };
}

type PartialUser = DeepPartial<User>;
// 所有属性都是可选的，包括嵌套对象
\`\`\`

### 2. RequiredKeys

提取对象中的必需属性：

\`\`\`typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface Example {
  a: string;
  b?: number;
  c: boolean;
}

type Required = RequiredKeys<Example>; // 'a' | 'c'
\`\`\`

## 条件类型妙用

### 函数参数提取

\`\`\`typescript
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

function greet(name: string, age: number) {
  return \`Hello \${name}, \${age}\`;
}

type GreetParams = Parameters<typeof greet>; // [string, number]
\`\`\`

## 模板字面量类型

### 构建事件名称

\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`;

type Events = 'click' | 'focus' | 'blur';
type EventHandlers = EventName<Events>;
// 'onClick' | 'onFocus' | 'onBlur'
\`\`\`

## 类型守卫

### 自定义类型守卫

\`\`\`typescript
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function handleAnimal(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // TypeScript 知道这是 Cat
  } else {
    animal.bark(); // TypeScript 知道这是 Dog
  }
}
\`\`\`

## 总结

TypeScript 的类型系统功能强大，掌握这些技巧可以：

- 提高代码类型安全性
- 减少运行时错误
- 提升开发体验
- 让编译器帮你发现潜在问题

继续探索，享受类型编程的乐趣！💪
`
  },
  {
    id: '4',
    title: '前端性能优化指南',
    excerpt: '从多个维度分析前端性能优化策略，包括加载优化、渲染优化和运行时优化。',
    date: '2024-03-22',
    tags: ['性能优化', '前端开发', 'Web'],
    author: '博主',
    readTime: 12,
    content: `# 前端性能优化指南

性能是用户体验的重要组成部分。本文将介绍前端性能优化的各种策略。

## 加载性能优化

### 1. 代码分割

使用动态 import 实现按需加载：

\`\`\`javascript
// 路由级别代码分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

### 2. 资源压缩

- 使用 gzip/brotli 压缩
- 压缩图片（WebP 格式）
- 压缩和混淆 JavaScript

### 3. 使用 CDN

将静态资源部署到 CDN，加快全球访问速度。

## 渲染性能优化

### 1. 虚拟滚动

对于长列表使用虚拟滚动：

\`\`\`javascript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>{items[index]}</div>
      )}
    </FixedSizeList>
  );
}
\`\`\`

### 2. 防抖和节流

\`\`\`javascript
// 防抖
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流
function throttle(fn, delay) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= delay) {
      fn.apply(this, args);
      last = now;
    }
  };
}
\`\`\`

### 3. React 性能优化

\`\`\`javascript
// 使用 memo 避免不必要的重渲染
const MemoizedComponent = memo(function Component({ data }) {
  return <div>{data}</div>;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
\`\`\`

## 网络优化

### 1. HTTP/2

使用 HTTP/2 的多路复用特性。

### 2. 预加载和预连接

\`\`\`html
<link rel="preconnect" href="https://api.example.com">
<link rel="prefetch" href="/next-page.js">
\`\`\`

### 3. 请求合并

- 合并小文件
- 使用 CSS Sprites
- 批量 API 请求

## 监控和测量

### 使用性能 API

\`\`\`javascript
// 测量组件渲染时间
const startTime = performance.now();
// ... 渲染组件
const endTime = performance.now();
console.log(\`渲染耗时: \${endTime - startTime}ms\`);

// 监听页面加载性能
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('页面加载时间:', perfData.loadEventEnd - perfData.fetchStart);
});
\`\`\`

## 工具推荐

- **Lighthouse**：综合性能审计
- **WebPageTest**：详细的性能分析
- **Chrome DevTools**：性能分析和调试
- **Bundle Analyzer**：分析打包体积

## 总结

性能优化是一个持续的过程：

1. 先测量，找出瓶颈
2. 针对性优化
3. 验证优化效果
4. 持续监控

记住：**过早优化是万恶之源**，但性能意识应该贯穿开发全程！
`
  },
  {
    id: '5',
    title: 'Git 工作流最佳实践',
    excerpt: '掌握 Git 的高效工作流程，提升团队协作效率。',
    date: '2024-03-25',
    tags: ['Git', '工具', '团队协作'],
    author: '博主',
    readTime: 7,
    content: `# Git 工作流最佳实践

Git 是现代软件开发不可或缺的工具。本文分享一些实用的 Git 工作流程和技巧。

## 分支策略

### Git Flow

经典的分支模型：

\`\`\`bash
# 主要分支
main        # 生产环境代码
develop     # 开发分支

# 辅助分支
feature/*   # 新功能开发
release/*   # 发布准备
hotfix/*    # 紧急修复
\`\`\`

### GitHub Flow

更简单的工作流：

\`\`\`bash
main           # 主分支，始终可部署
feature-xxx    # 功能分支
\`\`\`

## 提交规范

### Conventional Commits

\`\`\`bash
# 格式
<type>(<scope>): <subject>

# 示例
feat(auth): 添加用户登录功能
fix(api): 修复数据获取错误
docs(readme): 更新安装说明
style(header): 调整导航栏样式
refactor(utils): 重构工具函数
test(user): 添加用户模块测试
chore(deps): 升级依赖包版本
\`\`\`

### 提交信息最佳实践

\`\`\`bash
# ✅ 好的提交信息
git commit -m "fix: 修复登录页面验证码不显示的问题

- 添加验证码组件错误处理
- 更新 API 请求超时时间
- 修复验证码刷新逻辑

Closes #123"

# ❌ 不好的提交信息
git commit -m "修复bug"
git commit -m "更新代码"
\`\`\`

## 常用技巧

### 1. 交互式暂存

\`\`\`bash
# 选择性暂存文件的部分内容
git add -p
\`\`\`

### 2. 储藏工作区

\`\`\`bash
# 保存当前工作区
git stash save "工作描述"

# 查看储藏列表
git stash list

# 恢复并删除储藏
git stash pop

# 恢复但不删除储藏
git stash apply
\`\`\`

### 3. 修改提交历史

\`\`\`bash
# 修改最后一次提交
git commit --amend

# 交互式变基（整理提交历史）
git rebase -i HEAD~3

# 变基选项：
# pick   - 保留提交
# reword - 修改提交信息
# edit   - 修改提交内容
# squash - 合并到前一个提交
# drop   - 删除提交
\`\`\`

### 4. 撤销操作

\`\`\`bash
# 撤销工作区修改
git checkout -- <file>

# 撤销暂存区
git reset HEAD <file>

# 撤销提交（保留修改）
git reset --soft HEAD^

# 撤销提交（丢弃修改）
git reset --hard HEAD^

# 撤销远程提交（创建新提交）
git revert <commit>
\`\`\`

## 协作技巧

### Pull Request 流程

1. Fork 项目或创建功能分支
2. 开发并提交代码
3. 推送到远程仓库
4. 创建 Pull Request
5. Code Review
6. 合并到主分支

### Code Review 要点

- 代码逻辑是否正确
- 是否符合编码规范
- 是否有安全隐患
- 测试是否充分
- 文档是否更新

## 工具推荐

- **GitHub Desktop** - 图形化界面
- **GitKraken** - 强大的 Git 客户端
- **SourceTree** - 免费的 Git 可视化工具
- **lazygit** - 终端 Git UI

## 总结

好的 Git 工作流可以：

- 提高团队协作效率
- 保持代码历史清晰
- 便于问题追踪和回滚
- 降低冲突和错误

养成良好的 Git 使用习惯，让版本控制成为开发的助力！🚀
`
  }
];

export const authorInfo = {
  name: '博主昵称',
  bio: '热爱编程和技术分享的开发者。专注于前端开发，喜欢探索新技术，记录学习和成长的点滴。',
  social: {
    github: 'https://github.com/yourusername',
    email: 'your.email@example.com',
    website: 'https://your-website.com'
  }
};
