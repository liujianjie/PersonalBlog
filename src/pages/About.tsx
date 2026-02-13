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
              核心技能
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">引擎底层（259篇笔记）</h4>
                <div className="flex flex-wrap gap-2">
                  {['游戏引擎构建', 'ECS架构', '渲染器设计', 'OpenGL', '帧缓冲', '批渲染', '物理引擎', 'ImGui'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">图形学理论（99篇笔记）</h4>
                <div className="flex flex-wrap gap-2">
                  {['Games101', 'LearnOpenGL', 'Shader编程', '光照模型', '材质系统', '帧缓冲', '实例化渲染'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Unity应用层</h4>
                <div className="flex flex-wrap gap-2">
                  {['Flux架构', 'Addressable', 'URP渲染管线', '热更新', 'UI系统', '循环列表', 'Shader', '导表工具'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">编程语言</h4>
                <div className="flex flex-wrap gap-2">
                  {['C++', 'C#', 'Python', 'GLSL'].map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              学习成果
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2 mt-1">📚</span>
                <div>
                  <strong>游戏引擎开发（259篇笔记）</strong>
                  <p className="text-sm text-gray-600">完整学习TheCherno游戏引擎系列，从窗口创建到ECS、从渲染器到物理引擎</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2 mt-1">🎨</span>
                <div>
                  <strong>计算机图形学（99篇笔记）</strong>
                  <p className="text-sm text-gray-600">系统学习Games101与LearnOpenGL，掌握图形学理论与OpenGL实践</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2 mt-1">⚙️</span>
                <div>
                  <strong>Unity技术深耕</strong>
                  <p className="text-sm text-gray-600">Flux架构、Addressable、URP、热更新、自定义UI组件、Shader开发</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2 mt-1">🎮</span>
                <div>
                  <strong>项目实战经验</strong>
                  <p className="text-sm text-gray-600">多个复杂游戏系统的架构设计与实现，从技术选型到性能优化</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* 关于博客 */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">关于这个博客</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              这是我的游戏开发技术学习与实践记录空间。从游戏引擎底层原理到Unity应用层开发，从计算机图形学理论到项目实战经验，记录了我在游戏开发道路上的技术探索。
            </p>
            <p>
              <strong>学习历程：</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
              <div className="border-l-4 border-blue-500 pl-3">
                <strong className="text-blue-700">游戏引擎开发（259篇）</strong>
                <p className="text-sm">跟随TheCherno从零构建游戏引擎，深入理解窗口系统、事件系统、渲染器、ECS、物理引擎、批渲染等核心技术</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3">
                <strong className="text-green-700">计算机图形学（99篇）</strong>
                <p className="text-sm">系统学习Games101和LearnOpenGL，掌握光照模型、材质系统、Shader编程、帧缓冲、实例化渲染等图形学核心知识</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-3">
                <strong className="text-purple-700">Unity技术栈</strong>
                <p className="text-sm">Flux架构、Addressable资源管理、URP渲染管线、热更新方案、自定义UI组件、Shader开发、导表工具流</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-3">
                <strong className="text-orange-700">项目实战</strong>
                <p className="text-sm">多个复杂游戏系统的架构设计与实现，涵盖养成、装备、商城、社交、引导等核心玩法模块</p>
              </div>
            </div>
            <p className="pt-2">
              博客采用 <strong>React + TypeScript + Vite</strong> 构建，支持 Markdown 文章管理。内容来自真实学习笔记与项目实践，欢迎技术交流！
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
