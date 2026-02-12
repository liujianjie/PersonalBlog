import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { posts } from '../data/posts';
import 'highlight.js/styles/atom-one-dark.css';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="card p-12">
          <svg
            className="w-20 h-20 mx-auto text-gray-400 mb-4"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            文章未找到
          </h2>
          <p className="text-gray-600 mb-6">
            抱歉，您访问的文章不存在或已被删除。
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  // 查找上一篇和下一篇文章
  const currentIndex = posts.findIndex((p) => p.id === id);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-primary-600 mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        {/* 文章头部 */}
        <article className="card p-8 md:p-12">
          <header className="mb-8 pb-8 border-b border-gray-200">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mb-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(post.date), 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readTime} 分钟阅读
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {post.author}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          {/* 文章内容 */}
          <div className="markdown-body prose prose-lg max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* 上一篇/下一篇导航 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              to={`/post/${prevPost.id}`}
              className="card p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-sm text-gray-500 mb-2">上一篇</div>
              <div className="font-semibold text-gray-900 hover:text-primary-600">
                {prevPost.title}
              </div>
            </Link>
          ) : (
            <div></div>
          )}

          {nextPost ? (
            <Link
              to={`/post/${nextPost.id}`}
              className="card p-6 hover:shadow-xl transition-shadow md:text-right"
            >
              <div className="text-sm text-gray-500 mb-2">下一篇</div>
              <div className="font-semibold text-gray-900 hover:text-primary-600">
                {nextPost.title}
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>

        {/* 评论提示 */}
        <div className="card p-8 mt-8 text-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            想要添加评论功能？
          </h3>
          <p className="text-gray-600 mb-4">
            您可以集成 Gitalk、Disqus 或其他评论系统
          </p>
          <a
            href="https://github.com/gitalk/gitalk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            了解 Gitalk
          </a>
        </div>
      </div>
    </div>
  );
}
