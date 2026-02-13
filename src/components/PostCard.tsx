import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="group card mb-5 animate-fade-in-up overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* 左侧封面图 */}
        <div className="md:w-64 lg:w-72 flex-shrink-0">
          <Link to={`/post/${post.id}`} className="block h-full">
            <div className="cover-placeholder h-48 md:h-full w-full relative overflow-hidden">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-700 to-dark-800">
                  <svg className="w-12 h-12 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-dark-900/20" />
            </div>
          </Link>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          {/* 标题 */}
          <div>
            <Link to={`/post/${post.id}`} className="block mb-3">
              <h2 className="text-lg md:text-xl font-semibold text-dark-50 group-hover:text-accent-blue transition-colors duration-200 line-clamp-2">
                {post.title}
              </h2>
            </Link>

            {/* 元信息 */}
            <div className="flex items-center flex-wrap gap-3 text-xs text-dark-400 mb-3">
              <span className="flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{format(new Date(post.date), 'yyyy-MM-dd', { locale: zhCN })}</span>
              </span>
              <span className="text-dark-500">·</span>
              <span className="flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{post.readTime} 分钟</span>
              </span>
              <span className="text-dark-500">·</span>
              <span className="text-dark-300">{post.author}</span>
            </div>

            {/* 摘要 */}
            <p className="text-dark-300 text-sm leading-relaxed line-clamp-2 mb-4">
              {post.excerpt}
            </p>
          </div>

          {/* 标签 */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs text-dark-400">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>

            <Link
              to={`/post/${post.id}`}
              className="flex items-center space-x-1 text-sm text-dark-400 hover:text-accent-blue transition-colors duration-200 group/btn"
            >
              <span>阅读</span>
              <svg
                className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
