import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">关于博客</h3>
            <p className="text-sm text-gray-400">
              记录技术学习和生活感悟的个人空间，
              欢迎交流和分享。
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-primary-400 transition-colors">首页</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary-400 transition-colors">关于</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">联系方式</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:your.email@example.com"
                  className="hover:text-primary-400 transition-colors"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} 我的博客. All rights reserved.</p>
          <p className="mt-2">Built with React + TypeScript + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
