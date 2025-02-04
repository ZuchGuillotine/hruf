import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Supplement {
  id: number;
  name: string;
  category: string;
  description?: string;
}

interface SupplementSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SupplementSearch({ value, onChange, className }: SupplementSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data: suggestions = [], isLoading } = useQuery<Supplement[]>({
    queryKey: ['/api/supplements/search', search],
    enabled: search.length > 0,
    queryFn: async () => {
      console.log('Fetching suggestions for:', search);
      const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(search)}&limit=10`);
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await res.json();
      // Remove duplicates based on supplement ID
      const uniqueData = data.reduce((acc: Supplement[], curr: Supplement) => {
        if (!acc.find(item => item.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      console.log('Received suggestions:', uniqueData);
      return uniqueData;
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white text-[#1b4332] border-none hover:bg-white/90",
            className
          )}
        >
          {value || "Select a supplement..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="bg-white text-[#1b4332]">
          <CommandInput
            placeholder="Search supplements..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <CommandEmpty>No supplement found.</CommandEmpty>
          ) : (
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {suggestions.map((supplement) => (
                <CommandItem
                  key={`${supplement.id}-${supplement.name}`}
                  value={supplement.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span>{supplement.name}</span>
                    {supplement.category && (
                      <span className="text-xs text-muted-foreground">{supplement.category}</span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === supplement.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}