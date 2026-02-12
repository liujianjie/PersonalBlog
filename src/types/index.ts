export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content?: string; // 可选，用于内联内容
  mdFile?: string; // 可选，Markdown 文件路径
  date: string;
  tags: string[];
  author: string;
  readTime: number; // 阅读时间（分钟）
  coverImage?: string;
}

export interface Author {
  name: string;
  bio: string;
  avatar?: string;
  social?: {
    github?: string;
    twitter?: string;
    email?: string;
    website?: string;
  };
}
