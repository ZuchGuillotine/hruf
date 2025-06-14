/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 14/06/2025 - 00:54:04
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 14/06/2025
    * - Author          : 
    * - Modification    : 
**/


import React from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Series } from '@/types/chart';

const CHART_COLORS = {
  lipid: '#FF6B6B',
  metabolic: '#4ECDC4',
  thyroid: '#45B7D1',
  vitamin: '#96CEB4',
  blood: '#D4A5A5',
  liver: '#FFA07A',
  kidney: '#20B2AA',
  hormone: '#FFB6C1',
  mineral: '#9370DB',
  other: '#666666'
};

interface BiomarkerHistoryChartProps {
  series: Series[];
}

export function BiomarkerHistoryChart({ series }: BiomarkerHistoryChartProps) {
  // Early return with message if no series
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No biomarker data to display</p>
      </div>
    );
  }

  // Process chart data
  const chartData = React.useMemo(() => {
    try {
      // Get all unique dates across all series
      const dates = Array.from(
        new Set(series.flatMap(s => s.points.map((p: { testDate: string }) => p.testDate)))
      ).sort();
      
      // Create data points for each date
      const data = dates.map(date => {
        const entry: Record<string, any> = { testDate: date };
        series.forEach(s => {
          const point = s.points.find((p: { testDate: string }) => p.testDate === date);
          if (point) {
            entry[s.name] = point.value;
            entry[`${s.name}_unit`] = s.unit;
          }
        });
        return entry;
      });
      
      return data;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [series]);

  // If no data after processing, show message
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No data points available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-white rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Biomarker History</h3>
        <p className="text-sm text-gray-600">
          Showing {series.length} biomarker{series.length > 1 ? 's' : ''} with {chartData.length} data point{chartData.length > 1 ? 's' : ''}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="testDate" 
            tickFormatter={date => {
              try {
                return new Date(date).toLocaleDateString();
              } catch {
                return date;
              }
            }}
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
            labelFormatter={label => {
              try {
                return new Date(label).toLocaleDateString();
              } catch {
                return label;
              }
            }}
            formatter={(value: any, name: any, props: any) => {
              try {
                const unit = props?.payload?.[`${name}_unit`] || '';
                return [`${value} ${unit}`, name];
              } catch {
                return [value, name];
              }
            }}
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

