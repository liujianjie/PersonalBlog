import { authorInfo } from '../data/posts';

export default function About() {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-dark-50 mb-3">关于我</h1>
          <p className="text-dark-400">了解博主和这个博客</p>
        </div>

        {/* 个人信息卡片 */}
        <div className="card p-8 md:p-10 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-glow">
                {authorInfo.name.charAt(0)}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-dark-50 mb-3">
                {authorInfo.name}
              </h2>
              <p className="text-dark-300 leading-relaxed mb-6 text-sm">
                {authorInfo.bio}
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {authorInfo.social?.github && (
                  <a
                    href={authorInfo.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-dark-700 border border-dark-600 text-dark-200 rounded-lg hover:text-dark-50 hover:border-dark-500 transition-all text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub
                  </a>
                )}

                {authorInfo.social?.email && (
                  <a
                    href={`mailto:${authorInfo.social.email}`}
                    className="flex items-center px-4 py-2 bg-dark-700 border border-dark-600 text-dark-200 rounded-lg hover:text-dark-50 hover:border-dark-500 transition-all text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex items-center px-4 py-2 bg-dark-700 border border-dark-600 text-dark-200 rounded-lg hover:text-dark-50 hover:border-dark-500 transition-all text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-dark-50 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </span>
              核心技能
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-dark-300 mb-2">引擎底层（259篇笔记）</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['游戏引擎构建', 'ECS架构', '渲染器设计', 'OpenGL', '批渲染', '物理引擎'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-accent-blue/10 text-accent-blue rounded text-xs border border-accent-blue/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-dark-300 mb-2">图形学理论（99篇笔记）</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Games101', 'LearnOpenGL', 'Shader编程', '光照模型', '材质系统'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-accent-green/10 text-accent-green rounded text-xs border border-accent-green/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-dark-300 mb-2">Unity应用层</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['Flux架构', 'Addressable', 'URP渲染管线', '热更新', 'Shader'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-accent-purple/10 text-accent-purple rounded text-xs border border-accent-purple/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-dark-300 mb-2">编程语言</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['C++', 'C#', 'Python', 'GLSL'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-accent-orange/10 text-accent-orange rounded text-xs border border-accent-orange/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-dark-50 mb-4 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              学习成果
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-accent-blue mr-3 mt-0.5 text-lg">📚</span>
                <div>
                  <strong className="text-dark-100 text-sm">游戏引擎开发（259篇笔记）</strong>
                  <p className="text-xs text-dark-400 mt-1">完整学习TheCherno游戏引擎系列，从窗口创建到ECS、从渲染器到物理引擎</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-accent-purple mr-3 mt-0.5 text-lg">🎨</span>
                <div>
                  <strong className="text-dark-100 text-sm">计算机图形学（99篇笔记）</strong>
                  <p className="text-xs text-dark-400 mt-1">系统学习Games101与LearnOpenGL，掌握图形学理论与OpenGL实践</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-accent-green mr-3 mt-0.5 text-lg">⚙️</span>
                <div>
                  <strong className="text-dark-100 text-sm">Unity技术深耕</strong>
                  <p className="text-xs text-dark-400 mt-1">Flux架构、Addressable、URP、热更新、自定义UI组件、Shader开发</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-accent-orange mr-3 mt-0.5 text-lg">🎮</span>
                <div>
                  <strong className="text-dark-100 text-sm">项目实战经验</strong>
                  <p className="text-xs text-dark-400 mt-1">多个复杂游戏系统的架构设计与实现，从技术选型到性能优化</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 关于博客 */}
        <div className="card p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-dark-50 mb-4">关于这个博客</h2>
          <div className="space-y-4 text-sm text-dark-300 leading-relaxed">
            <p>
              这是我的游戏开发技术学习与实践记录空间。从游戏引擎底层原理到Unity应用层开发，从计算机图形学理论到项目实战经验，记录了我在游戏开发道路上的技术探索。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-dark-800 border-l-3 border-accent-blue">
                <strong className="text-accent-blue text-xs">游戏引擎开发（259篇）</strong>
                <p className="text-xs text-dark-400 mt-1">跟随TheCherno从零构建游戏引擎，深入理解窗口系统、事件系统、渲染器、ECS、物理引擎等核心技术</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-800 border-l-3 border-accent-green">
                <strong className="text-accent-green text-xs">计算机图形学（99篇）</strong>
                <p className="text-xs text-dark-400 mt-1">系统学习Games101和LearnOpenGL，掌握光照模型、材质系统、Shader编程等图形学核心知识</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-800 border-l-3 border-accent-purple">
                <strong className="text-accent-purple text-xs">Unity技术栈</strong>
                <p className="text-xs text-dark-400 mt-1">Flux架构、Addressable资源管理、URP渲染管线、热更新方案、Shader开发</p>
              </div>
              <div className="p-4 rounded-lg bg-dark-800 border-l-3 border-accent-orange">
                <strong className="text-accent-orange text-xs">项目实战</strong>
                <p className="text-xs text-dark-400 mt-1">多个复杂游戏系统的架构设计与实现，涵盖养成、装备、商城、社交等核心玩法模块</p>
              </div>
            </div>

            <p className="text-dark-400 text-xs">
              博客采用 <span className="text-accent-blue">React</span> + <span className="text-accent-blue">TypeScript</span> + <span className="text-accent-blue">Vite</span> 构建，支持 Markdown 文章管理。
            </p>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-dark-50 mb-3">保持联系</h2>
          <p className="text-dark-400 text-sm mb-6">
            欢迎通过以下方式与我交流和探讨
          </p>
          <a
            href={authorInfo.social?.email ? `mailto:${authorInfo.social.email}` : '#'}
            className="inline-block btn-primary px-8 py-2.5 rounded-lg text-sm"
          >
            发送邮件
          </a>
        </div>
      </div>
    </div>
  );
}
