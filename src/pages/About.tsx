import { authorInfo } from '../data/posts';

export default function About() {
  return (
    <div className="container-custom py-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">关于我</h1>
          <p className="text-lg text-gray-600">了解博主和这个博客</p>
        </div>

        {/* 个人信息卡片 */}
        <div className="card p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-5xl font-bold">
                {authorInfo.name.charAt(0)}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {authorInfo.name}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {authorInfo.bio}
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {authorInfo.social?.github && (
                  <a
                    href={authorInfo.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </a>
                )}

                {authorInfo.social?.email && (
                  <a
                    href={`mailto:${authorInfo.social.email}`}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                )}

                {authorInfo.social?.website && (
                  <a
                    href={authorInfo.social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 技能和兴趣 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              技术栈
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'Python', 'Vue', 'TailwindCSS', 'Git', 'Docker'].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              兴趣爱好
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                开源项目贡献
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                技术博客写作
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                阅读和学习新技术
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                参加技术社区活动
              </li>
            </ul>
          </div>
        </div>

        {/* 关于博客 */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">关于这个博客</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              这个博客是我记录学习和成长的个人空间。在这里，我分享技术文章、学习笔记和生活感悟。
            </p>
            <p>
              博客采用现代化的技术栈构建：
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>前端框架：</strong>React 18 + TypeScript</li>
              <li><strong>构建工具：</strong>Vite</li>
              <li><strong>样式方案：</strong>Tailwind CSS</li>
              <li><strong>路由管理：</strong>React Router</li>
              <li><strong>Markdown：</strong>react-markdown + 代码高亮</li>
            </ul>
            <p>
              如果你对这个博客的实现感兴趣，可以查看源代码或与我交流。
            </p>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="card p-8 mt-8 bg-gradient-to-br from-primary-50 to-primary-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            保持联系
          </h2>
          <p className="text-center text-gray-700 mb-6">
            欢迎通过以下方式与我交流和探讨
          </p>
          <div className="flex justify-center">
            <a
              href={authorInfo.social?.email ? `mailto:${authorInfo.social.email}` : '#'}
              className="btn-primary"
            >
              发送邮件
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
