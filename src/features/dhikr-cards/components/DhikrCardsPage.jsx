import { useState, useEffect } from "react";
import {
  PlusLg,
  PencilSquare,
  Trash,
  SunFill,
  MoonStarsFill,
  HeartFill,
  StarFill,
  BookFill,
  HandIndexThumbFill,
  CloudSunFill,
  DropletFill,
  LightningFill,
  TreeFill,
  Flower1,
  ShieldFillCheck,
  PersonRaisedHand,
  CupHotFill,
  HouseHeartFill,
  CarFrontFill,
  CreditCard2Front,
  FileEarmarkArrowUp,
  CheckCircleFill,
  ArrowRepeat
} from "react-bootstrap-icons";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import EmptyState from "../../../components/ui/EmptyState";
import { supabase } from "../../../utils/supabase";
import { generatePkpass } from "../../../utils/generatePkpass";

const AVAILABLE_ICONS = [
  { name: "SunFill", component: SunFill },
  { name: "MoonStarsFill", component: MoonStarsFill },
  { name: "StarFill", component: StarFill },
  { name: "HandIndexThumbFill", component: HandIndexThumbFill },
  { name: "BookFill", component: BookFill },
  { name: "HeartFill", component: HeartFill },
  { name: "CloudSunFill", component: CloudSunFill },
  { name: "DropletFill", component: DropletFill },
  { name: "LightningFill", component: LightningFill },
  { name: "TreeFill", component: TreeFill },
  { name: "Flower1", component: Flower1 },
  { name: "ShieldFillCheck", component: ShieldFillCheck },
  { name: "PersonRaisedHand", component: PersonRaisedHand },
  { name: "CupHotFill", component: CupHotFill },
  { name: "HouseHeartFill", component: HouseHeartFill },
  { name: "CarFrontFill", component: CarFrontFill },
];

const COLOR_OPTIONS = [
  { label: "أزرق داكن", value: "#11538C" },
  { label: "أزرق فاتح", value: "#398CBF" },
  { label: "أخضر", value: "#2E8B57" },
  { label: "أحمر", value: "#B22222" },
  { label: "برتقالي", value: "#FF8C00" },
  { label: "بنفسجي", value: "#8A2BE2" },
  { label: "وردي", value: "#C71585" },
  { label: "بني", value: "#8B4513" },
  { label: "رمادي داكن", value: "#4F4F4F" },
  { label: "ذهبي", value: "#DAA520" },
];

const emptyCard = {
  category: "",
  title: "",
  dhikr: "",
  icon: "SunFill",
  color: "#11538C",
};

function getIconComponent(iconName) {
  return AVAILABLE_ICONS.find((i) => i.name === iconName)?.component || SunFill;
}

export default function DhikrCardsPage() {
  const [cards, setCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState(emptyCard);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('dhikr_cards')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      if (data) setCards(data);
    } catch (error) {
      console.error('Error fetching dhikr cards:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Modal handlers ---- */
  const openCreate = () => {
    setEditingCard(null);
    setFormData(emptyCard);
    setIsModalOpen(true);
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setFormData({
      category: card.category,
      title: card.title,
      dhikr: card.dhikr,
      icon: card.icon,
      color: card.color,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
    setFormData(emptyCard);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    setSaving(true);

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('dhikr_cards')
          .update({ ...formData })
          .eq('id', editingCard.id);

        if (error) throw error;

        setCards((prev) =>
          prev.map((c) => (c.id === editingCard.id ? { ...c, ...formData } : c))
        );
      } else {
        const sort_order = cards.length > 0 ? Math.max(...cards.map(c => c.sort_order || 0)) + 1 : 1;
        const { data, error } = await supabase
          .from('dhikr_cards')
          .insert([{ ...formData, sort_order }])
          .select()
          .single();

        if (error) throw error;
        setCards((prev) => [...prev, data]);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving card:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePass = async (card) => {
    setGeneratingId(card.id);
    try {
      // Generate the .pkpass blob
      const blob = await generatePkpass(card);

      // Build file path: <card-id>.pkpass
      const filePath = `${card.id}.pkpass`;

      // Delete old file if exists (upsert)
      await supabase.storage.from('wallet-passes').remove([filePath]);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('wallet-passes')
        .upload(filePath, blob, {
          contentType: 'application/vnd.apple.pkpass',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update the card's pkpass_url in the database
      const { error: updateError } = await supabase
        .from('dhikr_cards')
        .update({ pkpass_url: filePath })
        .eq('id', card.id);

      if (updateError) throw updateError;

      // Update local state
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, pkpass_url: filePath } : c))
      );
    } catch (error) {
      console.error('Error generating pass:', error);
      alert('حدث خطأ أثناء توليد البطاقة');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      const { error } = await supabase
        .from('dhikr_cards')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setCards((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setDeleteTarget(null);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* ---- Render helpers ---- */
  const inputClass =
    "w-full rounded-pill bg-surface px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary transition-shadow";

  if (loading) {
    return (
      <div className="space-y-8 page-enter">
        <PageHeader
          title="بطاقات الأذكار"
          description="إدارة بطاقات Apple Wallet"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="h-5 w-12 bg-gray-200 rounded-pill"></div>
              </div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="flex items-center gap-2 pt-1">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      <PageHeader
        title="بطاقات الأذكار"
        description="إدارة بطاقات Apple Wallet"
        action={
          <Button size="sm" onClick={openCreate} icon={<PlusLg size={16} />}>
            إضافة بطاقة
          </Button>
        }
      />

      {/* Cards list */}
      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard2Front}
          title="لا توجد بطاقات"
          description="أضف أول بطاقة أذكار"
          action={
            <Button size="sm" onClick={openCreate} icon={<PlusLg size={14} />}>
              إضافة بطاقة
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = getIconComponent(card.icon);
            return (
              <Card key={card.id} className="space-y-4">
                {/* Card top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${card.color}15` }}
                    >
                      <Icon size={16} style={{ color: card.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: card.color }}>
                        {card.title}
                      </p>
                    </div>
                  </div>

                  <span
                    className="shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${card.color}15`,
                      color: card.color,
                    }}
                  >
                    {card.category}
                  </span>
                </div>

                {/* Dhikr */}
                <p className="text-xs font-medium leading-relaxed line-clamp-3 min-h-[3.75rem] max-h-[3.75rem]" style={{ color: card.color }}>
                  {card.dhikr}
                </p>

                {/* Pass status */}
                <div className="flex items-center gap-2">
                  {card.pkpass_url ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <CheckCircleFill size={12} />
                      تم التوليد
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">لم يتم توليد الملف</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleGeneratePass(card)}
                    disabled={generatingId === card.id}
                    className={`flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors ${
                      generatingId === card.id
                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                        : card.pkpass_url
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                    title={card.pkpass_url ? 'إعادة توليد الملف' : 'توليد ملف البطاقة'}
                  >
                    {generatingId === card.id ? (
                      <ArrowRepeat size={12} className="animate-spin" />
                    ) : (
                      <FileEarmarkArrowUp size={12} />
                    )}
                    {generatingId === card.id ? 'جاري التوليد...' : (card.pkpass_url ? 'إعادة التوليد' : 'توليد الملف')}
                  </button>
                  <button
                    onClick={() => openEdit(card)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-white transition-colors"
                    title="تعديل"
                  >
                    <PencilSquare size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(card)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-danger hover:bg-white transition-colors"
                    title="حذف"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCard ? "تعديل البطاقة" : "إضافة بطاقة جديدة"}
        size="md"
        actions={[
          { label: "إلغاء", variant: "secondary", onClick: closeModal, disabled: saving },
          { label: saving ? "جاري الحفظ..." : (editingCard ? "حفظ التعديلات" : "إضافة"), onClick: handleSave, disabled: saving },
        ]}
      >
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">العنوان</label>
            <input
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="أذكار الصباح"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">التصنيف</label>
            <input
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="صباح"
              className={inputClass}
            />
          </div>

          {/* Dhikr */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">الذكر</label>
            <textarea
              value={formData.dhikr}
              onChange={(e) => updateField("dhikr", e.target.value)}
              placeholder="سبحان الله وبحمده..."
              rows={3}
              className={`${inputClass} resize-none rounded-2xl`}
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map(({ name, component: Ic }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => updateField("icon", name)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    formData.icon === name
                      ? "bg-primary text-white"
                      : "bg-surface text-gray-400 hover:text-primary"
                  }`}
                >
                  <Ic size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">اللون</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateField("color", opt.value)}
                  className={`flex items-center gap-2 rounded-pill px-4 py-2 text-xs font-medium transition-colors ${
                    formData.color === opt.value
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  style={{
                    backgroundColor: `${opt.value}15`,
                    color: opt.value,
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: opt.value }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف البطاقة"
        size="sm"
        actions={[
          {
            label: "إلغاء",
            variant: "secondary",
            onClick: () => setDeleteTarget(null),
          },
          {
            label: "حذف",
            variant: "danger",
            onClick: handleDelete,
          },
        ]}
      >
        <p>
          هل أنت متأكد من حذف بطاقة{" "}
          <span className="font-bold text-primary">{deleteTarget?.title}</span>؟
        </p>
      </Modal>
    </div>
  );
}
