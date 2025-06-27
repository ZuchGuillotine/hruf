/**
 * Chart and data visualization types for biomarker and health data
 */

/**
 * Single data point for a biomarker measurement
 */
export interface BiomarkerDataPoint {
  /** Canonical name of the biomarker (e.g. "HDL Cholesterol") */
  name: string;
  /** Measured value */
  value: number;
  /** Unit of measurement (e.g. "mg/dL") */
  unit: string;
  /** Date of the test in ISO format */
  testDate: string;
  /** Optional biomarker category */
  category?: 'lipid' | 'metabolic' | 'thyroid' | 'vitamin' | 'mineral' | 'blood' | 'liver' | 'kidney' | 'hormone' | 'other';
  /** Optional reference range */
  referenceRange?: string;
}

/**
 * API response shape from GET /api/labs/chart-data
 */
export interface ChartApiResponse {
  /** Whether the request succeeded */
  success: boolean;
  /** Array of biomarker data points */
  data: BiomarkerDataPoint[];
  /** Pagination information */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * Trend data point from GET /api/labs/chart-data/trends
 */
export interface TrendPoint {
  date: string;
  value: number;
}

/**
 * Series data for biomarker trends
 */
export interface TrendSeries {
  /** Name of the biomarker */
  name: string;
  /** Time-series points */
  series: TrendPoint[];
}

/**
 * API response shape from GET /api/labs/chart-data/trends
 */
export interface TrendApiResponse {
  success: boolean;
  data: TrendSeries[];
}

/**
 * Generic series data structure for charts
 */
export interface Series {
  name: string;
  points: Array<{ testDate: string; value: number }>;
  unit: string;
  category: string;
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  theme?: 'light' | 'dark';
  colors?: string[];
}

/**
 * Filter options for chart data
 */
export interface ChartFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  biomarkers?: string[];
  categories?: string[];
  labResultIds?: number[];
}

/**
 * Chart data aggregation options
 */
export interface ChartAggregation {
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  aggregateFunction?: 'avg' | 'min' | 'max' | 'sum' | 'count';
}

/**
 * Complete chart data request parameters
 */
export interface ChartDataRequest {
  filters?: ChartFilters;
  aggregation?: ChartAggregation;
  pagination?: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}