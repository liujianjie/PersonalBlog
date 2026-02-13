import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { posts } from '../data/posts';
import 'highlight.js/styles/github-dark.css';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const post = posts.find((p) => p.id === id);

  useEffect(() => {
    if (!post) {
      setLoading(false);
      return;
    }

    if (post.mdFile) {
      fetch(post.mdFile)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load markdown file');
          }
          return response.text();
        })
        .then((text) => {
          setMarkdownContent(text);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error loading markdown:', error);
          setMarkdownContent('# 加载失败\n\n无法加载文章内容。');
          setLoading(false);
        });
    } else if (post.content) {
      setMarkdownContent(post.content);
      setLoading(false);
    } else {
      setMarkdownContent('# 错误\n\n文章内容未配置。');
      setLoading(false);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="container-custom py-32 text-center">
        <div className="card p-12 max-w-lg mx-auto">
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
          <h2 className="text-xl font-bold text-dark-100 mb-3">文章未找到</h2>
          <p className="text-dark-400 mb-6 text-sm">
            抱歉，您访问的文章不存在或已被删除。
          </p>
          <Link
            to="/"
            className="inline-block btn-primary px-6 py-2.5 rounded-lg text-sm"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-custom py-32 text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 border-3 border-dark-600 border-t-accent-blue rounded-full animate-spin"></div>
          <p className="text-dark-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  const currentIndex = posts.findIndex((p) => p.id === id);
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-dark-400 hover:text-accent-blue mb-6 transition-colors text-sm group"
        >
          <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        {/* 文章 */}
        <article className="card p-6 md:p-10">
          {/* 文章头部 */}
          <header className="mb-8 pb-6 border-b border-dark-600/50">
            <h1 className="text-2xl md:text-3xl font-bold text-dark-50 mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center text-sm text-dark-400 gap-4 mb-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(post.date), 'yyyy年MM月dd日', { locale: zhCN })}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readTime} 分钟阅读
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {post.author}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </header>

          {/* 文章内容 */}
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </article>

        {/* 上一篇/下一篇导航 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {prevPost ? (
            <Link
              to={`/post/${prevPost.id}`}
              className="card p-5 group"
            >
              <div className="text-xs text-dark-400 mb-2 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                上一篇
              </div>
              <div className="text-sm font-medium text-dark-200 group-hover:text-accent-blue transition-colors line-clamp-1">
                {prevPost.title}
              </div>
            </Link>
          ) : (
            <div></div>
          )}

          {nextPost ? (
            <Link
              to={`/post/${nextPost.id}`}
              className="card p-5 group md:text-right"
            >
              <div className="text-xs text-dark-400 mb-2 flex items-center md:justify-end">
                下一篇
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-sm font-medium text-dark-200 group-hover:text-accent-blue transition-colors line-clamp-1">
                {nextPost.title}
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  );
}
