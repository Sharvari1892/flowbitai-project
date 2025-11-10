'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { dashboardAPI, type CategorySpend } from '@/lib/api/dashboard';

const COLORS = ['#3b82f6', '#fb923c', '#60a5fa', '#2563eb', '#fbbf24', '#c084fc', '#f472b6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
        <p className="text-black font-semibold">{payload[0].payload.category}</p>
        <p className="text-black">Total Spend: ${payload[0].value?.toLocaleString()}</p>
        <p className="text-black">Percentage: {payload[0].payload.percentage}%</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ data }: { data: CategorySpend[] }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
      {data.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full shrink-0" 
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">{entry.category}</div>
            <div className="font-semibold">${entry.totalSpend.toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export function CategorySpendChart() {
  const [data, setData] = useState<CategorySpend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Always use dummy data for category spend (regardless of API)
      console.log('Using dummy category data');
      const dummyData: CategorySpend[] = [
        { category: 'Office Supplies', totalSpend: 15420.50, percentage: 22.5 },
        { category: 'IT Equipment', totalSpend: 12850.75, percentage: 18.7 },
        { category: 'Professional Services', totalSpend: 11200.00, percentage: 16.3 },
        { category: 'Marketing & Advertising', totalSpend: 9870.25, percentage: 14.4 },
        { category: 'Travel & Entertainment', totalSpend: 8540.80, percentage: 12.4 },
        { category: 'Utilities', totalSpend: 6320.00, percentage: 9.2 },
        { category: 'Maintenance & Repairs', totalSpend: 4510.45, percentage: 6.5 },
      ];
      setData(dummyData);
    } catch (error) {
      console.error('Failed to load category data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Spend by Category</CardTitle>
        <CardDescription>Distribution of spending across categories</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="totalSpend"
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend data={data} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
