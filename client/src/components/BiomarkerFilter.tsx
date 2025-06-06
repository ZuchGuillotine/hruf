
import React from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLabChartData } from '@/hooks/use-lab-chart-data';

const CATEGORY_COLORS = {
  lipid: 'bg-red-100 hover:bg-red-200 border-red-300',
  metabolic: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  thyroid: 'bg-green-100 hover:bg-green-200 border-green-300',
  vitamin: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300',
  blood: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
  liver: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
  kidney: 'bg-teal-100 hover:bg-teal-200 border-teal-300',
  hormone: 'bg-pink-100 hover:bg-pink-200 border-pink-300',
  mineral: 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300',
  other: 'bg-gray-100 hover:bg-gray-200 border-gray-300'
} as const;

type CategoryType = keyof typeof CATEGORY_COLORS;

export function BiomarkerFilter() {
  const { data, isLoading } = useLabChartData();
  const [location, setLocation] = useLocation();

  const selectedNames = React.useMemo(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const param = params.get('biomarkers') ?? '';
    return new Set(param.split(',').filter(Boolean));
  }, [location]);

  const toggleName = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }

    const params = new URLSearchParams(location.split('?')[1]);
    if (next.size > 0) {
      params.set('biomarkers', Array.from(next).join(','));
    } else {
      params.delete('biomarkers');
    }
    
    const newSearch = params.toString();
    const basePath = location.split('?')[0];
    setLocation(`${basePath}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <ScrollArea className="h-[200px] w-full">
        <div className="flex flex-wrap gap-2 p-2">
          {data?.allBiomarkers?.map((name) => (
            <Button
              key={name}
              variant={selectedNames.has(name) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleName(name)}
              className={`rounded-full ${
                selectedNames.has(name) 
                  ? '' 
                  : CATEGORY_COLORS[data.categories[name] || 'other']
              }`}
            >
              {name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
