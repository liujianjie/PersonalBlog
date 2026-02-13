import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // 实时搜索
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        {/* 搜索图标 */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="搜索文章..."
          className="w-full pl-11 pr-20 py-3 rounded-xl bg-dark-800 border border-dark-600 text-dark-100 placeholder-dark-400 focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/30 transition-all duration-200 text-sm"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs text-dark-400 hover:text-dark-200 bg-dark-700 rounded-md hover:bg-dark-600 transition-colors"
          >
            清除
          </button>
        )}
      </div>
    </form>
  );
}
