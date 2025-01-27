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
  name: string;
  category: string;
  description?: string;
}

interface SupplementSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SupplementSearch({ value, onChange }: SupplementSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data: suggestions = [], isLoading } = useQuery<Supplement[]>({
    queryKey: ['/api/supplements/search', search],
    enabled: search.length > 0,
    queryFn: async () => {
      console.log('Fetching suggestions for:', search);
      const res = await fetch(`/api/supplements/search?q=${encodeURIComponent(search)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await res.json();
      console.log('Received suggestions:', data);
      return data;
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-[#1b4332] border-none hover:bg-white/90"
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
            <div>Loading...</div>
          ) : suggestions.length === 0 ? (
            <CommandEmpty>No supplement found.</CommandEmpty>
          ) : (
            <CommandGroup>
              {suggestions.map((supplement) => (
                <CommandItem
                  key={supplement.name}
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