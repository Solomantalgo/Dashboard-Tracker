import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { ContentPost } from '../types/database';
import { Share2, CheckCircle2, Circle } from 'lucide-react';

export const ContentTracker: React.FC = () => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getContentPosts();
      setPosts(res);
    } catch (err) {
      console.error('Error loading content posts:', err);
      setError('Content posts could not be loaded. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePosted = async (id: string) => {
    setTogglingId(id);
    try {
      await api.toggleContentPosted(id);
      await loadData();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout title="Social Content & Media Tracker">
      <div className="space-y-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="font-bold font-heading text-[#F5F6F8]">Promotional Content Calendar</h2>
          <p className="mt-1 max-w-full break-words text-xs leading-5 text-[#9AA1AE]">Track scheduled posts across WhatsApp Status, Instagram, TikTok, and Facebook.</p>
        </div>

        <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed text-left text-xs">
          <colgroup><col className="w-[15%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[34%]" /><col className="w-[15%]" /></colgroup>
          <thead className="bg-[#1A1D26] text-[#9AA1AE] uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Target Date</th>
              <th className="p-3">Platform</th>
              <th className="p-3">Content Type</th>
              <th className="p-3">Notes / Caption</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262A36] text-[#F5F6F8]">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center text-[#9AA1AE]">Loading content posts...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="p-10 text-center text-[#9AA1AE]"><p className="font-semibold text-[#F5F6F8]">Unable to load content posts</p><p className="mt-1 text-xs">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center"><Share2 className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No content posts scheduled yet</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#9AA1AE]">Scheduled social posts will appear here with their target date, platform, caption, and posting status.</p></td></tr>
            ) : posts.map(p => (
              <tr key={p.id} className="hover:bg-[#1A1D26]/60">
                <td className="p-3 font-mono text-[#9AA1AE]">{p.post_date}</td>
                <td className="p-3 font-bold text-[#DA0E19]">{p.platform}</td>
                <td className="p-3 font-semibold">{p.content_type}</td>
                <td className="p-3 text-[#9AA1AE]">{p.notes || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleTogglePosted(p.id)}
                    disabled={togglingId === p.id}
                    className={`ml-auto inline-flex min-h-10 items-center gap-1 rounded-md px-3 py-2 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${
                      p.posted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#1A1D26] text-[#9AA1AE] border border-[#262A36] hover:text-white'
                    }`}
                  >
                    {p.posted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {p.posted ? 'Posted' : 'Mark Posted'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="space-y-3 pb-8 md:hidden">
          {loading ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-10 text-center text-sm text-[#9AA1AE]">Loading content posts...</div>
          ) : error ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-8 text-center"><p className="font-semibold text-[#F5F6F8]">Unable to load content posts</p><p className="mt-1 text-xs text-[#9AA1AE]">{error}</p><button type="button" onClick={loadData} className="mt-4 min-h-11 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white">Try Again</button></div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-[#262A36] bg-[#1A1D26] p-8 text-center"><Share2 className="mx-auto h-7 w-7 text-[#DA0E19]" /><p className="mt-2 font-semibold text-[#F5F6F8]">No content posts scheduled yet</p><p className="mt-1 text-xs leading-5 text-[#9AA1AE]">Scheduled posts will appear here with their date, platform, caption, and status.</p></div>
          ) : posts.map(p => (
            <article key={`mobile-${p.id}`} className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-[#262A36] bg-[#1A1D26] p-4">
              <div className="flex min-w-0 flex-col items-start gap-2 border-b border-[#262A36] pb-3">
                <span className="font-mono text-[10px] text-[#9AA1AE]">{p.post_date}</span>
                <h3 className="text-sm font-bold text-[#DA0E19]">{p.platform}</h3>
                <p className="text-xs font-semibold text-[#F5F6F8]">{p.content_type}</p>
              </div>
              <p className="mt-3 break-words text-sm leading-5 text-[#F5F6F8]">{p.notes || '—'}</p>
              <button type="button" onClick={() => handleTogglePosted(p.id)} disabled={togglingId === p.id} className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:cursor-wait disabled:opacity-60 ${p.posted ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400' : 'border border-[#262A36] bg-[#12141B] text-[#F5F6F8] hover:border-[#DA0E19]'}`}>
                {p.posted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {togglingId === p.id ? 'Updating...' : p.posted ? 'Posted' : 'Mark Posted'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
