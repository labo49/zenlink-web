import { useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { importLinks } from '../lib/links';
import type { NewLink } from '../lib/types';

interface Props {
  session: Session;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

function splitCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVRow(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCSVRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]));
  });
}

function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw.split(/[,\s]+/).map((t) => t.replace(/^#/, '').toLowerCase().trim()).filter(Boolean);
}

export default function ImportModal({ session, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      setPreview(rows.slice(0, 3));
      setStatus('idle');
      setMessage(`${rows.length} row${rows.length !== 1 ? 's' : ''} found`);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setStatus('loading');
    setMessage('Importing…');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rows = parseCSV(ev.target?.result as string);
        const links: NewLink[] = rows
          .filter((r) => r.url?.startsWith('http'))
          .map((r) => ({
            user_id: session.user.id,
            url: r.url,
            title: r.title || r.url,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=32`,
            tags: parseTags(r.tags ?? ''),
            snoozed_until: null,
            on_next_session: false,
          }));

        if (links.length === 0) {
          setStatus('error');
          setMessage('No valid URLs found.');
          return;
        }

        const imported = await importLinks(links);
        await queryClient.invalidateQueries({ queryKey: ['links'] });
        setStatus('done');
        setMessage(`${imported} link${imported !== 1 ? 's' : ''} imported successfully.`);
        if (fileRef.current) fileRef.current.value = '';
        setPreview([]);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Import failed.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Import CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            CSV must have columns:{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">title</code>,{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">url</code>,{' '}
            <code className="bg-gray-100 px-1 rounded text-xs">tags</code>.
            Extra columns are ignored. Tags can be comma- or space-separated.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">title</th>
                    <th className="px-3 py-2 text-left">url</th>
                    <th className="px-3 py-2 text-left">tags</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 max-w-[140px] truncate">{row.title}</td>
                      <td className="px-3 py-2 max-w-[140px] truncate text-indigo-600">{row.url}</td>
                      <td className="px-3 py-2 max-w-[120px] truncate">{row.tags}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 px-3 py-1.5">Showing first 3 rows</p>
            </div>
          )}

          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-500' : status === 'done' ? 'text-green-600' : 'text-gray-500'}`}>
              {message}
            </p>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={status === 'loading' || !fileRef.current?.files?.length}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {status === 'loading' ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
