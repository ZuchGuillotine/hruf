
import React from 'react';
import { 
  LineChart, 
  Line, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import type { Series } from '@/types/chart';

const CHART_COLORS = {
  lipid: '#ef4444',      // red-500
  metabolic: '#3b82f6',  // blue-500
  thyroid: '#10b981',    // emerald-500
  vitamin: '#f59e0b',    // amber-500
  blood: '#8b5cf6',      // violet-500
  liver: '#f97316',      // orange-500
  kidney: '#06b6d4',     // cyan-500
  hormone: '#ec4899',    // pink-500
  mineral: '#6366f1',    // indigo-500
  other: '#6b7280'       // gray-500
};

interface BiomarkerHistoryChartProps {
  series: Series[];
}

export function BiomarkerHistoryChart({ series }: BiomarkerHistoryChartProps) {
  const chartData = React.useMemo(() => {
    if (series.length === 0) return [];
    
    const dates = Array.from(
      new Set(series.flatMap(s => s.points.map(p => p.testDate)))
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return dates.map(date => {
      const entry: Record<string, any> = { 
        testDate: date,
        formattedDate: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      };
      
      series.forEach(s => {
        const point = s.points.find(p => p.testDate === date);
        if (point) {
          entry[s.name] = point.value;
          entry[`${s.name}_unit`] = s.unit;
          entry[`${s.name}_status`] = point.status || 'Normal';
        }
      });
      return entry;
    });
  }, [series]);

  const uniqueUnits = React.useMemo(() => {
    return Array.from(new Set(series.map(s => s.unit)));
  }, [series]);

  const yAxisDomain = React.useMemo(() => {
    if (series.length === 0) return ['auto', 'auto'];
    
    const allValues = series.flatMap(s => s.points.map(p => p.value));
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    
    return [Math.max(0, min - padding), max + padding];
  }, [series]);

  const formatTooltipValue = (value: any, name: string, props: any) => {
    const unit = props.payload[`${name}_unit`];
    const status = props.payload[`${name}_status`];
    
    return [
      `${value} ${unit || ''}`,
      name,
      status && status !== 'Normal' ? ` (${status})` : ''
    ];
  };

  const formatTooltipLabel = (label: string) => {
    return new Date(label).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (series.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white rounded-lg p-4 shadow-sm mb-4 border">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg text-gray-600 mb-1">Select biomarkers to view trends</p>
            <p className="text-sm text-gray-500">Choose one or more biomarkers from the filter above</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white rounded-lg p-4 shadow-sm mb-4 border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Biomarker Trends
        </h3>
        <p className="text-sm text-gray-600">
          {series.length} biomarker{series.length === 1 ? '' : 's'} • {chartData.length} data point{chartData.length === 1 ? '' : 's'}
          {uniqueUnits.length > 1 && (
            <span className="ml-2 text-amber-600">
              ⚠️ Multiple units: {uniqueUnits.join(', ')}
            </span>
          )}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="testDate"
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
            stroke="#666"
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#666"
            domain={yAxisDomain}
            label={{ 
              value: uniqueUnits.length === 1 ? uniqueUnits[0] : 'Value', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            labelStyle={{
              color: '#374151',
              fontWeight: 'bold'
            }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="line"
            wrapperStyle={{
              paddingBottom: '20px'
            }}
          />
          
          {series.map((s) => {
            const color = CHART_COLORS[s.category as keyof typeof CHART_COLORS] || CHART_COLORS.other;
            return (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={color}
                strokeWidth={2}
                dot={{ 
                  fill: color, 
                  strokeWidth: 2, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  strokeWidth: 2,
                  fill: color,
                  stroke: '#fff'
                }}
                name={`${s.name} (${s.unit})`}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
