
import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLabChartData } from '@/hooks/use-lab-chart-data';

export function BiomarkerFilter() {
  const { data: dataPoints = [], isLoading } = useLabChartData();
  const [location, setLocation] = useLocation();

  const allNames = useMemo(() => {
    return Array.from(new Set(dataPoints.map(point => point.name))).sort();
  }, [dataPoints]);

  const selectedNames = useMemo(() => {
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
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="flex flex-wrap gap-2">
          {allNames.map(name => (
            <Button
              key={name}
              variant={selectedNames.has(name) ? "default" : "outline"}
              onClick={() => toggleName(name)}
              className="text-sm"
            >
              {name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
