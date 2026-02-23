import { useState, useEffect } from "react";
import {
  Instagram,
  TwitterX,
  PencilSquare,
  CheckLg,
  XLg,
} from "react-bootstrap-icons";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import { supabase } from "../../../utils/supabase";

const PLATFORM_META = {
  instagram: {
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/username",
    handlePlaceholder: "@username",
  },
  x: {
    label: "X (Twitter)",
    icon: TwitterX,
    placeholder: "https://x.com/username",
    handlePlaceholder: "@username",
  },
};

export default function SocialLinksPage() {
  const [links, setLinks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setLinks(data);
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (link) => {
    setEditingId(link.id);
    setEditUrl(link.url);
    setEditHandle(link.handle);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl("");
    setEditHandle("");
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update({ url: editUrl, handle: editHandle })
        .eq('id', id);

      if (error) throw error;

      setLinks((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, url: editUrl, handle: editHandle } : l
        )
      );
    } catch (error) {
      console.error('Error updating social link:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setEditingId(null);
      setEditUrl("");
      setEditHandle("");
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") saveEdit(id);
    if (e.key === "Escape") cancelEdit();
  };

  if (loading) {
    return (
      <div className="space-y-8 px-0 sm:px-6 page-enter">
        <PageHeader
          title="روابط التواصل"
          description="تعديل روابط وحسابات التواصل الاجتماعي"
        />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="relative animate-pulse">
              <div className="flex items-center justify-center gap-6 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="space-y-2 min-w-[220px] mx-auto">
                  <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded mx-auto"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-0 sm:px-6 page-enter">
      <PageHeader
        title="روابط التواصل"
        description="تعديل روابط وحسابات التواصل الاجتماعي"
      />

      <div className="space-y-4">
        {links.map((link) => {
          const meta = PLATFORM_META[link.platform];
          if (!meta) return null;
          const Icon = meta.icon;
          const isEditing = editingId === link.id;

          return (
            <Card key={link.id} className="relative">
              <div className="flex items-center justify-center gap-6 text-center">
                {/* Actions */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(link.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-white transition-colors"
                        title="حفظ"
                      >
                        <CheckLg size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-white transition-colors"
                        title="إلغاء"
                      >
                        <XLg size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(link)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-white transition-colors"
                      title="تعديل"
                    >
                      <PencilSquare size={16} />
                    </button>
                  )}
                </div>

                {/* Platform icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft">
                  <Icon size={20} className="text-primary" />
                </div>

                {/* Content */}
                <div className="space-y-1 min-w-[220px] mx-auto">
                  <p className="text-sm font-semibold text-primary">{meta.label}</p>

                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">المعرّف</label>
                        <input
                          autoFocus
                          value={editHandle}
                          onChange={(e) => setEditHandle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, link.id)}
                          placeholder={meta.handlePlaceholder}
                          dir="ltr"
                          className="w-full rounded-pill bg-white px-4 py-2 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">الرابط</label>
                        <input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, link.id)}
                          placeholder={meta.placeholder}
                          dir="ltr"
                          className="w-full rounded-pill bg-white px-4 py-2 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-600" dir="ltr">
                        {link.handle}
                      </p>
                      <p className="text-xs text-gray-500 truncate" dir="ltr">
                        {link.url}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
