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

/**
 * This list can be extended in multiple ways:
 * 
 * 1. Direct Addition:
 * - Add new supplements to the relevant category below
 * - Follow the alphabetical order within categories
 * 
 * 2. Database-Driven (Future Enhancement):
 * - Create a 'supplements' table with fields: name, category, common_names
 * - Add an API endpoint in routes.ts: GET /api/supplements/common
 * - Modify this component to fetch from the API instead of using this static list
 * 
 * 3. Admin Interface (Future Enhancement):
 * - Create an admin page with CRUD operations for supplements
 * - Add role-based access control for admin users
 * - Store supplements in the database
 * - Add API endpoints for managing the supplements list
 */

// Common supplements organized by category
const commonSupplements = [
  // Vitamins
  "Vitamin A",
  "Vitamin B1",
  "Vitamin B2",
  "Vitamin B3",
  "Vitamin B6",
  "Vitamin B12",
  "Vitamin C",
  "Vitamin D",
  "Vitamin E",
  "Vitamin K",

  // Minerals
  "Calcium",
  "Iron",
  "Magnesium",
  "Potassium",
  "Selenium",
  "Zinc",

  // Amino Acids & Proteins
  "Collagen",
  "Creatine",
  "L-Arginine",
  "L-Glutamine",
  "Protein Powder",
  "Whey Protein",

  // Fatty Acids
  "Fish Oil",
  "Omega-3",
  "Omega-6",
  "Omega-9",

  // Other Supplements
  "Biotin",
  "CoQ10",
  "Glucosamine",
  "Melatonin",
  "Probiotics",
  "Turmeric",
].sort(); // Keep the final list alphabetically sorted

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