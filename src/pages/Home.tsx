import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import SearchBar from '../components/SearchBar';
import TagList from '../components/TagList';
import { posts } from '../data/posts';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 获取所有标签
  const allTags = useMemo(() => {
    return posts.flatMap((post) => post.tags);
  }, []);

  // 过滤文章
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedTag && !post.tags.includes(selectedTag)) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [searchQuery, selectedTag]);

  // 生成星星
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
      size: Math.random() > 0.7 ? '3px' : '2px',
    }));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ==================== Hero 区域 ==================== */}
      <section className="hero-bg relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* 星星背景 */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              '--duration': star.duration,
              '--delay': star.delay,
            } as React.CSSProperties}
          />
        ))}

        {/* 光晕效果 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        </div>

        {/* Hero 内容 */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-dark-50 mb-6 animate-fade-in">
            <span className="gradient-text">登峰造极者，</span>
            <br />
            <span className="text-dark-50">殊途亦同归。</span>
          </h1>
          <p className="text-lg md:text-xl text-dark-300 mb-12 animate-fade-in-up max-w-2xl mx-auto">
            游戏开发 · 计算机图形学 · 技术探索
          </p>
        </div>

        {/* 向下滚动箭头 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
          <svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ==================== 个人信息卡片 ==================== */}
      <section className="relative -mt-20 z-10 container-custom mb-12">
        <div className="card p-8 text-center max-w-2xl mx-auto">
          {/* 头像 */}
          <div className="w-24 h-24 mx-auto -mt-20 mb-4 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white text-3xl font-bold border-4 border-dark-800 shadow-glow">
            LJ
          </div>

          {/* 昵称和签名 */}
          <h2 className="text-xl font-bold text-dark-50 mb-2">Unity游戏开发者</h2>
          <p className="text-sm text-dark-300 mb-6">愿天下心诚剑士人人可剑开天门！</p>

          {/* 统计数据 */}
          <div className="flex justify-center divide-x divide-dark-600 mb-6">
            <div className="px-8">
              <div className="text-2xl font-bold text-dark-50">{posts.length}</div>
              <div className="text-xs text-dark-400">文章</div>
            </div>
            <div className="px-8">
              <div className="text-2xl font-bold text-dark-50">{new Set(allTags).size}</div>
              <div className="text-xs text-dark-400">标签</div>
            </div>
            <div className="px-8">
              <div className="text-2xl font-bold text-dark-50">
                {new Set(posts.flatMap(p => {
                  // 简单分类：取第一个标签作为分类
                  return p.tags[0] || '未分类';
                })).size}
              </div>
              <div className="text-xs text-dark-400">分类</div>
            </div>
          </div>

          {/* 社交链接 */}
          <div className="flex justify-center space-x-4">
            <a
              href="https://github.com/liujianjie"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-accent-blue hover:border-accent-blue/50 transition-all duration-200"
              title="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="mailto:contact@example.com"
              className="w-9 h-9 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-300 hover:text-accent-purple hover:border-accent-purple/50 transition-all duration-200"
              title="Email"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ==================== 公告栏 ==================== */}
      <section className="container-custom mb-8">
        <div className="card p-4 flex items-center space-x-3">
          <span className="text-accent-orange text-lg">📢</span>
          <p className="text-sm text-dark-200">
            欢迎来到我的技术博客！这里记录游戏开发与计算机图形学的学习历程。
          </p>
        </div>
      </section>

      {/* ==================== 内容区域 ==================== */}
      <section className="container-custom pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 - 文章列表 */}
          <div className="lg:col-span-2">
            <SearchBar onSearch={setSearchQuery} />

            {filteredPosts.length === 0 ? (
              <div className="card p-16 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-dark-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-dark-200 mb-2">
                  暂无相关文章
                </h3>
                <p className="text-dark-400 text-sm">
                  试试其他关键词或清除筛选条件
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-dark-400">
                    <span>共</span>
                    <span className="text-accent-blue font-medium">{filteredPosts.length}</span>
                    <span>篇文章</span>
                  </div>
                </div>
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* 最新文章 */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  最新文章
                </h3>
                <div className="space-y-3">
                  {posts.slice(0, 5).map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="flex items-start space-x-3 group p-2 -mx-2 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      {/* 小缩略图 */}
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-dark-700 to-dark-600 flex items-center justify-center overflow-hidden">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-dark-200 group-hover:text-accent-blue transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                        <span className="text-xs text-dark-400 mt-1 block">{post.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 标签云 */}
              <TagList
                tags={allTags}
                selectedTag={selectedTag}
                onTagSelect={setSelectedTag}
              />

              {/* 网站信息 */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  网站信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">文章数目：</span>
                    <span className="text-dark-100 font-medium">{posts.length}</span>
                  </div>
                  <div className="h-px bg-dark-600/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">标签数量：</span>
                    <span className="text-dark-100 font-medium">{new Set(allTags).size}</span>
                  </div>
                  <div className="h-px bg-dark-600/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">总阅读时长：</span>
                    <span className="text-dark-100 font-medium">
                      {posts.reduce((sum, post) => sum + post.readTime, 0)} 分钟
                    </span>
                  </div>
                </div>
              </div>

              {/* 关于博主 */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-100 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-accent-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  关于博主
                </h3>
                <p className="text-xs text-dark-300 leading-relaxed mb-4">
                  游戏开发工程师，从引擎底层到应用层全栈开发。完整学习游戏引擎构建与计算机图形学，Unity项目实战经验丰富。
                </p>
                <Link
                  to="/about"
                  className="block w-full text-center py-2 rounded-lg bg-dark-700 border border-dark-600 text-sm text-dark-200 hover:text-accent-blue hover:border-accent-blue/30 transition-all duration-200"
                >
                  了解更多 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
