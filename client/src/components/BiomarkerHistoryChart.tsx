
import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Series } from '@/types/chart';

const CHART_COLORS = {
  lipid: '#FF6B6B',
  metabolic: '#4ECDC4',
  thyroid: '#45B7D1',
  vitamin: '#96CEB4',
  blood: '#D4A5A5',
  other: '#666666'
};

interface BiomarkerHistoryChartProps {
  series: Series[];
}

export function BiomarkerHistoryChart({ series }: BiomarkerHistoryChartProps) {
  const chartData = React.useMemo(() => {
    // Get all unique dates across all series
    const dates = Array.from(
      new Set(series.flatMap(s => s.points.map(p => p.testDate)))
    ).sort();
    
    // Create data points for each date
    return dates.map(date => {
      const entry: Record<string, any> = { testDate: date };
      series.forEach(s => {
        const point = s.points.find(p => p.testDate === date);
        if (point) {
          entry[s.name] = point.value;
          entry[`${s.name}_unit`] = s.unit;
        }
      });
      return entry;
    });
  }, [series]);

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg">
        <p className="text-gray-500">Select biomarkers to view their trends</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-white rounded-lg p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="testDate" 
            tickFormatter={date => new Date(date).toLocaleDateString()}
            stroke="#666"
          />
          <YAxis 
            stroke="#666"
            label={{ 
              value: series[0]?.unit || '', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10
            }}
          />
          <Tooltip
            labelFormatter={label => new Date(label).toLocaleDateString()}
            formatter={(value, name, props) => [
              `${value} ${props.payload[`${name}_unit`]}`,
              name
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #f0f0f0',
              borderRadius: '4px'
            }}
          />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={CHART_COLORS[s.category as keyof typeof CHART_COLORS] || CHART_COLORS.other}
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6, strokeWidth: 1 }}
              name={`${s.name} (${s.unit})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
