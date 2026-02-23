import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays, parseISO, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import Card from '../../../components/ui/Card';

export default function StatsChart({ downloads, cards }) {
  const [timeRange, setTimeRange] = useState(7); // 7 or 30 days

  // Process data for the timeline chart
  const timelineData = useMemo(() => {
    if (!downloads || downloads.length === 0) return [];

    const data = [];
    const today = startOfDay(new Date());

    for (let i = timeRange - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const count = downloads.filter(d => {
        const dDate = startOfDay(parseISO(d.downloaded_at));
        return dDate.getTime() === date.getTime();
      }).length;

      data.push({
        date: format(date, 'dd MMM', { locale: ar }),
        fullDate: dateStr,
        count
      });
    }

    return data;
  }, [downloads, timeRange]);

  // Process data for the cards bar chart
  const cardsData = useMemo(() => {
    if (!downloads || !cards || cards.length === 0) return [];

    return cards.map(card => {
      const count = downloads.filter(d => d.card_id === card.id).length;
      return {
        name: card.title,
        count
      };
    }).sort((a, b) => b.count - a.count);
  }, [downloads, cards]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 rounded-xl" dir="rtl">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-lg font-bold text-[#11538C]">
            {payload[0].value} <span className="text-sm font-normal text-gray-500">تحميل</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#11538C]">تحميلات البطاقات</h3>
            <p className="text-sm text-gray-500">عدد مرات الإضافة للمحفظة عبر الزمن</p>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                timeRange === 7 
                  ? 'bg-white text-[#11538C] font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              7 أيام
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                timeRange === 30 
                  ? 'bg-white text-[#11538C] font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              30 يوم
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#11538C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#11538C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#11538C" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#11538C]">التحميلات حسب البطاقة</h3>
          <p className="text-sm text-gray-500">أكثر البطاقات إضافة للمحفظة</p>
        </div>

        <div className="h-[300px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cardsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-gray-100 rounded-xl" dir="rtl">
                        <p className="text-sm text-gray-500 mb-1">{payload[0].payload.name}</p>
                        <p className="text-lg font-bold text-[#398CBF]">
                          {payload[0].value} <span className="text-sm font-normal text-gray-500">تحميل</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#398CBF" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
