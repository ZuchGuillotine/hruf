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

// Common supplements list
const commonSupplements = [
  "Vitamin D",
  "Vitamin B12",
  "Magnesium",
  "Zinc",
  "Iron",
  "Calcium",
  "Omega-3",
  "Vitamin C",
  "Probiotics",
  "Multivitamin",
  "Protein Powder",
  "Creatine",
  "Fish Oil",
  "Vitamin E",
  "Biotin",
  "Collagen",
  "Vitamin K2",
  "Glucosamine",
  "CoQ10",
  "Melatonin",
].sort();

interface SupplementSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SupplementSearch({ value, onChange }: SupplementSearchProps) {
  const [open, setOpen] = React.useState(false);

  // Filter and limit suggestions to top 4 matches
  const suggestions = React.useMemo(() => {
    const searchTerm = value.toLowerCase();
    return commonSupplements
      .filter(supplement => 
        supplement.toLowerCase().includes(searchTerm)
      )
      .slice(0, 4);
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-[#1b4332] border-none hover:bg-white/90"
        >
          {value || ""}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="bg-white text-[#1b4332]">
          <CommandInput 
            placeholder="" 
            className="h-9"
            value={value}
            onValueChange={onChange}
          />
          <CommandEmpty>No supplement found.</CommandEmpty>
          <CommandGroup>
            {suggestions.map((supplement) => (
              <CommandItem
                key={supplement}
                value={supplement}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                {supplement}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === supplement ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}