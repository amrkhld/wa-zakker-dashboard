import { useState, useEffect } from "react";
import { PencilSquare, CheckLg, XLg, FileArrowDown, CreditCard2Front } from "react-bootstrap-icons";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import { supabase } from "../../../utils/supabase";

const ICON_MAP = {
  CreditCard2Front,
  FileArrowDown,
};

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('stats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (stat) => {
    setEditingId(stat.id);
    setEditValue(stat.value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase
        .from('stats')
        .update({ value: editValue })
        .eq('id', id);

      if (error) throw error;

      setStats((prev) =>
        prev.map((s) => (s.id === id ? { ...s, value: editValue } : s))
      );
    } catch (error) {
      console.error('Error updating stat:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setEditingId(null);
      setEditValue("");
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
          title="الإحصائيات"
          description="تعديل القيم المعروضة في الصفحة الرئيسية"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="relative animate-pulse">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
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
        title="الإحصائيات"
        description="تعديل القيم المعروضة في الصفحة الرئيسية"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = ICON_MAP[stat.icon];
          const isEditing = editingId === stat.id;

          return (
            <Card key={stat.id} className="relative">
              <div className="flex flex-col items-center text-center gap-3">
                {/* Actions */}
                <div className="absolute left-4 top-4 flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(stat.id)}
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
                      onClick={() => startEdit(stat)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-white transition-colors"
                      title="تعديل"
                    >
                      <PencilSquare size={16} />
                    </button>
                  )}
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft">
                  {Icon && <Icon size={20} className="text-primary" />}
                </div>

                {/* Content */}
                <p className="text-xs text-gray-400">{stat.label}</p>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, stat.id)}
                    dir="ltr"
                    className="w-full rounded-pill bg-white px-3 py-1.5 text-lg font-bold text-primary outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-2xl font-bold text-primary" dir="ltr">
                    {stat.value}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
