import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { ContentPost } from '../types/database';
import { Share2, CheckCircle2, Circle } from 'lucide-react';

export const ContentTracker: React.FC = () => {
  const [posts, setPosts] = useState<ContentPost[]>([]);

  const loadData = async () => {
    const res = await api.getContentPosts();
    setPosts(res);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePosted = async (id: string) => {
    await api.toggleContentPosted(id);
    loadData();
  };

  return (
    <AdminLayout title="Social Content & Media Tracker">
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-5 space-y-4">
        <div>
          <h2 className="font-bold font-heading text-[#F5F6F8]">Promotional Content Calendar</h2>
          <p className="text-xs text-[#9AA1AE]">Track posts across WhatsApp Status, Instagram, TikTok & Facebook</p>
        </div>

        <table className="w-full text-left text-xs">
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
            {posts.map(p => (
              <tr key={p.id}>
                <td className="p-3 font-mono text-[#9AA1AE]">{p.post_date}</td>
                <td className="p-3 font-bold text-[#DA0E19]">{p.platform}</td>
                <td className="p-3 font-semibold">{p.content_type}</td>
                <td className="p-3 text-[#9AA1AE]">{p.notes || '—'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleTogglePosted(p.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ml-auto ${
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
    </AdminLayout>
  );
};
