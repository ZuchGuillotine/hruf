
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLabChartData } from '@/hooks/use-lab-chart-data';
import { Card } from '@/components/ui/card';

export function BiomarkerFilter() {
  const { data: dataPoints = [], isLoading } = useLabChartData();
  const [searchParams, setSearchParams] = useSearchParams();

  const allNames = useMemo(() => {
    const names = new Set<string>();
    dataPoints.forEach((dp) => names.add(dp.name));
    return Array.from(names).sort();
  }, [dataPoints]);

  const selectedNames = useMemo(() => {
    const param = searchParams.get('biomarkers') ?? '';
    return new Set(param.split(',').filter(Boolean));
  }, [searchParams]);

  const toggleName = (name: string) => {
    const next = new Set(selectedNames);
    if (next.has(name)) next.delete(name);
    else next.add(name);

    const params = new URLSearchParams(searchParams);
    if (next.size > 0) {
      params.set('biomarkers', Array.from(next).join(','));
    } else {
      params.delete('biomarkers');
    }
    setSearchParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted rounded-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <ScrollArea className="w-full" type="always">
        <div className="flex flex-wrap gap-2">
          {allNames.map((name) => {
            const isSelected = selectedNames.has(name);
            return (
              <Button
                key={name}
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className={`rounded-full px-3 py-1 text-sm transition-all ${
                  isSelected ? 'shadow-sm' : ''
                }`}
                onClick={() => toggleName(name)}
              >
                {name}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
