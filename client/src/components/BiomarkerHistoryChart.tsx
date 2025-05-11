
import React, { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Series } from '@/types/chart';

interface BiomarkerHistoryChartProps {
  /** Array of biomarker series to plot */
  series: Series[];
}

const CHART_CONFIG = {
  lipid: { color: '#FF6B6B' },
  metabolic: { color: '#4ECDC4' },
  thyroid: { color: '#45B7D1' },
  vitamin: { color: '#96CEB4' },
  blood: { color: '#D4A5A5' },
  default: { color: '#666' }
};

/**
 * Renders a multi-line time-series chart of biomarker values.
 * @param series Array of Series objects (name, unit, points[])
 */
export function BiomarkerHistoryChart({ series }: BiomarkerHistoryChartProps) {
  // Pivot series into a unified data array keyed by testDate
  const chartData = useMemo(() => {
    const dates = Array.from(
      new Set(series.flatMap(s => s.points.map(p => p.testDate)))
    ).sort();
    return dates.map(date => {
      const entry: Record<string, string | number> = { testDate: date };
      series.forEach(s => {
        const point = s.points.find(p => p.testDate === date);
        entry[s.name] = point ? point.value : null;
      });
      return entry;
    });
  }, [series]);

  // Take unit from first series (assumes same unit per series)
  const yAxisUnit = series[0]?.unit ?? '';

  return (
    <div className="w-full h-96">
      <ChartContainer config={CHART_CONFIG}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="testDate"
            tick={{ fontSize: 12 }}
            tickFormatter={date => new Date(date).toLocaleDateString()}
          />
          <YAxis
            domain={['auto', 'auto']}
            label={{
              value: yAxisUnit,
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          <ChartTooltip 
            labelFormatter={label => `Date: ${new Date(label).toLocaleDateString()}`}
          />
          <ChartLegend verticalAlign="top" height={36} />
          {series.map(s => (
            <Line
              key={s.name}
              dataKey={s.name}
              name={s.name}
              type="monotone"
              strokeWidth={2}
              dot={false}
              data-testid="biomarker-line"
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
