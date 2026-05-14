/** Top-level content category. Each post must have exactly one. */
export type PostCategory = 'tech' | 'thought' | 'life' | 'learning';

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

  /** Required from SPEC §13.4 onwards. Defaults to 'tech' for legacy posts. */
  category: PostCategory;

  /** Optional series name (e.g. 'Addressable', 'LearnOpenGL') for grouping
   *  multi-part posts. Posts in the same series collapse to one card on
   *  the home page; the series page lists them by seriesOrder. */
  series?: string;

  /** 1-based order within the series. Used to sort the series page. */
  seriesOrder?: number;
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
