
import React from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLabChartData } from '@/hooks/use-lab-chart-data';

const CATEGORY_COLORS = {
  lipid: 'bg-red-100 hover:bg-red-200',
  metabolic: 'bg-blue-100 hover:bg-blue-200',
  thyroid: 'bg-green-100 hover:bg-green-200',
  vitamin: 'bg-yellow-100 hover:bg-yellow-200',
  blood: 'bg-purple-100 hover:bg-purple-200',
  other: 'bg-gray-100 hover:bg-gray-200'
};

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
          {data?.allBiomarkers.map((name) => (
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
