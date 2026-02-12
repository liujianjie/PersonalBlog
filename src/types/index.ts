export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
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
