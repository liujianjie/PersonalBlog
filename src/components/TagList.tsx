interface TagListProps {
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export default function TagList({ tags, selectedTag, onTagSelect }: TagListProps) {
  // 统计每个标签的文章数量
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-dark-100 mb-4 flex items-center">
        <svg className="w-4 h-4 mr-2 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        标签
      </h3>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagSelect(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            selectedTag === null
              ? 'bg-accent-blue text-white shadow-glow'
              : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-dark-100 border border-dark-600'
          }`}
        >
          全部
        </button>

        {uniqueTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedTag === tag
                ? 'bg-accent-purple text-white shadow-glow-purple'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-dark-100 border border-dark-600'
            }`}
          >
            {tag}
            <span className="ml-1 opacity-60">({tagCounts[tag]})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
