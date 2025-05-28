
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BiomarkerHistoryChart } from './BiomarkerHistoryChart';
import type { Series } from '@/types/chart';

// Mock the chart components to avoid ResponsiveContainer issues in tests
jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, config }: any) => (
    <div data-testid="chart-container" data-config={JSON.stringify(config)}>
      {children}
    </div>
  ),
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartLegend: () => <div data-testid="chart-legend" />
}));

describe('BiomarkerHistoryChart', () => {
  const mockSeries: Series[] = [
    {
      name: 'HDL Cholesterol',
      unit: 'mg/dL',
      category: 'lipid',
      points: [
        { testDate: '2025-01-01', value: 45 },
        { testDate: '2025-02-01', value: 48 },
      ],
    },
    {
      name: 'Glucose',
      unit: 'mg/dL',
      category: 'metabolic',
      points: [
        { testDate: '2025-01-01', value: 95 },
        { testDate: '2025-03-01', value: 92 },
      ],
    },
  ];

  it('renders chart with correct configuration and data', () => {
    render(
      <div style={{ width: 800, height: 400 }}>
        <BiomarkerHistoryChart series={mockSeries} />
      </div>
    );

    // Check if chart container is rendered with correct config
    const container = screen.getByTestId('chart-container');
    const config = JSON.parse(container.getAttribute('data-config') || '{}');
    expect(config).toHaveProperty('lipid.color');
    expect(config).toHaveProperty('metabolic.color');

    // Check if tooltip and legend are rendered
    expect(screen.getByTestId('chart-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('chart-legend')).toBeInTheDocument();

    // Check if lines are rendered
    const lines = screen.getAllByTestId('biomarker-line');
    expect(lines).toHaveLength(mockSeries.length);
  });

  it('handles empty series data gracefully', () => {
    render(
      <div style={{ width: 800, height: 400 }}>
        <BiomarkerHistoryChart series={[]} />
      </div>
    );

    // Should still render container but with no lines
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    const lines = screen.queryAllByTestId('biomarker-line');
    expect(lines).toHaveLength(0);
  });
});
