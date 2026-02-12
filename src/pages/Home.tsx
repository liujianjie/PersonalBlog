import { useState, useMemo } from 'react';
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
      // 标签过滤
      if (selectedTag && !post.tags.includes(selectedTag)) {
        return false;
      }

      // 搜索过滤
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

  return (
    <div className="container-custom py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          欢迎来到我的博客
        </h1>
        <p className="text-lg text-gray-600">
          分享技术、记录生活、探索世界
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主内容区 */}
        <div className="lg:col-span-2">
          <SearchBar onSearch={setSearchQuery} />

          {filteredPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                没有找到相关文章
              </h3>
              <p className="text-gray-500">
                试试其他关键词或清除筛选条件
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                找到 <span className="font-semibold text-primary-600">{filteredPosts.length}</span> 篇文章
              </div>
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <TagList
              tags={allTags}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
            />

            {/* 统计信息 */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                博客统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">文章总数</span>
                  <span className="text-2xl font-bold text-primary-600">{posts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">标签数量</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {new Set(allTags).size}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总阅读时长</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {posts.reduce((sum, post) => sum + post.readTime, 0)}
                    <span className="text-sm text-gray-600 ml-1">分钟</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 关于卡片 */}
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100">
              <h3 className="text-lg font-bold text-gray-900 mb-3">关于博主</h3>
              <p className="text-gray-700 text-sm mb-4">
                热爱编程和技术分享的开发者，喜欢探索新技术，记录学习和成长。
              </p>
              <a
                href="/about"
                className="inline-block px-4 py-2 bg-white text-primary-600 rounded-lg hover:shadow-md transition-shadow text-sm font-medium"
              >
                了解更多 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
