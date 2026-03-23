import type { Link } from '../lib/types';

interface Props {
  link: Link;
  onDelete: () => void;
}

function formatSnooze(snoozedUntil: string): string {
  const d = new Date(snoozedUntil);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LinkCard({ link, onDelete }: Props) {
  const hostname = (() => {
    try { return new URL(link.url).hostname.replace(/^www\./, ''); }
    catch { return link.url; }
  })();

  const isSnoozed = !!link.snoozed_until || link.on_next_session;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3 group hover:border-indigo-200 transition-colors">
      {/* Favicon */}
      {link.favicon ? (
        <img src={link.favicon} alt="" className="w-4 h-4 mt-1 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 mt-1 flex-shrink-0 bg-gray-200 rounded-sm" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
        >
          {link.title || link.url}
        </a>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 truncate">{hostname}</span>
          {isSnoozed && (
            <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
              ⏰ {link.on_next_session ? 'Next session' : formatSnooze(link.snoozed_until!)}
            </span>
          )}
        </div>

        {link.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{link.description}</p>
        )}

        {link.notes && (
          <p className="text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1 mt-1 italic">
            {link.notes}
          </p>
        )}

        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {link.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg leading-none flex-shrink-0 mt-0.5"
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}
