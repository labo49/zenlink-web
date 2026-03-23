import { useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { fetchAllLinks, deleteLink } from '../lib/links';
import type { Link } from '../lib/types';
import LinkCard from './LinkCard';
import TagSidebar from './TagSidebar';

interface Props {
  session: Session;
  onImportClick: () => void;
}

export default function Dashboard({ session, onImportClick }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['links', session.user.id],
    queryFn: () => fetchAllLinks(session.user.id),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['links'] }),
  });

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const link of links) {
      for (const tag of link.tags ?? []) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [links]);

  const filtered = useMemo(() => {
    let result = links;
    if (activeTag) {
      result = result.filter((l) => l.tags?.includes(activeTag));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [links, activeTag, search]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-indigo-600">ZenLink</span>
        <div className="flex items-center gap-4">
          <button
            onClick={onImportClick}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search links…"
          className="w-full max-w-2xl border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto px-6 py-6 gap-6">
        {/* Links list */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              {search || activeTag ? 'No links match your filter.' : 'No links saved yet.'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((link: Link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onDelete={() => deleteMutation.mutate(link.id)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Tag sidebar */}
        <TagSidebar
          tags={allTags}
          activeTag={activeTag}
          onSelect={(tag) => setActiveTag(activeTag === tag ? null : tag)}
        />
      </div>
    </div>
  );
}
