import { useState, useEffect } from "react";
import { FileArrowDown, CreditCard2Front, GraphUp } from "react-bootstrap-icons";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import StatsChart from "../../stats/components/StatsChart";
import { supabase } from "../../../utils/supabase";

export default function OverviewPage() {
  const [downloads, setDownloads] = useState([]);
  const [cards, setCards] = useState([]);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [downloadsRes, cardsRes] = await Promise.all([
        supabase.from("card_downloads").select("*"),
        supabase.from("dhikr_cards").select("id, title"),
      ]);

      if (downloadsRes.error) throw downloadsRes.error;
      if (cardsRes.error) throw cardsRes.error;

      if (downloadsRes.data) {
        setDownloads(downloadsRes.data);
        setTotalDownloads(downloadsRes.data.length);
      }
      if (cardsRes.data) {
        setCards(cardsRes.data);
        setTotalCards(cardsRes.data.length);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const summaryItems = [
    {
      icon: FileArrowDown,
      label: "إجمالي التحميلات",
      value: totalDownloads,
    },
    {
      icon: CreditCard2Front,
      label: "بطاقات الأذكار",
      value: totalCards,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 px-10 page-enter">
        <PageHeader
          title="نظرة عامة"
          description="إحصائيات التحميلات والإضافة للمحفظة"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-7 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </Card>
          <Card className="p-6 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-10 page-enter">
      <PageHeader
        title="نظرة عامة"
        description="إحصائيات التحميلات والإضافة للمحفظة"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summaryItems.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-primary" dir="ltr">
                  {value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <StatsChart downloads={downloads} cards={cards} />
    </div>
  );
}
