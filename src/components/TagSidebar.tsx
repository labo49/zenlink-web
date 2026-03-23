interface Props {
  tags: [string, number][];
  activeTag: string | null;
  onSelect: (tag: string) => void;
}

export default function TagSidebar({ tags, activeTag, onSelect }: Props) {
  if (tags.length === 0) return null;

  return (
    <aside className="w-52 flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Tags
        </h3>
        <ul className="flex flex-col gap-1">
          {tags.map(([tag, count]) => (
            <li key={tag}>
              <button
                onClick={() => onSelect(tag)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                  activeTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="truncate">#{tag}</span>
                <span className={`text-xs ml-2 flex-shrink-0 ${activeTag === tag ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {activeTag && (
          <button
            onClick={() => onSelect(activeTag)}
            className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>
    </aside>
  );
}
