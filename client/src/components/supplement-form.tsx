import { useForm } from "react-hook-form";
import { useSupplements } from "@/hooks/use-supplements";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SupplementSearch } from "./supplement-search";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import cn from 'classnames';

type FormData = {
  name: string;
  dosageAmount: string;
  dosageUnit: string;
  frequencyAmount: string;
  frequencyUnit: string;
  notes?: string;
};

interface SupplementFormProps {
  supplementId?: number;
  onSuccess: () => void;
}

export default function SupplementForm({
  supplementId,
  onSuccess
}: SupplementFormProps) {
  const { addSupplement, updateSupplement, supplements } = useSupplements();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Find existing supplement if editing
  const existingSupplement = supplementId 
    ? supplements.find(s => s.id === supplementId)
    : null;

  // Parse existing dosage and frequency if available
  const parseDosage = (dosage?: string) => {
    if (!dosage) return { amount: "1", unit: "mg" };
    const match = dosage.match(/(\d+)\s*(\w+)/);
    return {
      amount: match?.[1] || "1",
      unit: match?.[2] || "mg"
    };
  };

  const parseFrequency = (frequency?: string) => {
    if (!frequency) return { amount: "1", unit: "daily" };
    const match = frequency.match(/(\d+)x\s*(\w+)/);
    return {
      amount: match?.[1] || "1",
      unit: match?.[2] || "daily"
    };
  };

  const existingDosage = parseDosage(existingSupplement?.dosage);
  const existingFrequency = parseFrequency(existingSupplement?.frequency);

  const form = useForm<FormData>({
    defaultValues: {
      name: existingSupplement?.name || "",
      dosageAmount: existingDosage.amount,
      dosageUnit: existingDosage.unit,
      frequencyAmount: existingFrequency.amount,
      frequencyUnit: existingFrequency.unit,
      notes: existingSupplement?.notes || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const supplementData = {
        name: data.name,
        dosage: `${data.dosageAmount} ${data.dosageUnit}`,
        frequency: `${data.frequencyAmount}x ${data.frequencyUnit}`,
        notes: data.notes,
      };

      if (supplementId) {
        await updateSupplement({ id: supplementId, data: supplementData });
        toast({
          title: "Success",
          description: "Supplement updated successfully",
        });
      } else {
        await addSupplement(supplementData);
        toast({
          title: "Success",
          description: "Supplement added successfully",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const inputClassName = isMobile ? "h-12 text-base" : "h-10 text-sm";
  const selectClassName = isMobile ? "h-12" : "h-10";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-white">
          Supplement Name
        </Label>
        <SupplementSearch
          value={form.watch("name")}
          onChange={(value) => form.setValue("name", value)}
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dosage" className="text-sm font-medium text-white">
          Dosage
        </Label>
        <div className="flex gap-3">
          <Select
            defaultValue={form.getValues("dosageAmount")}
            onValueChange={(value) => form.setValue("dosageAmount", value)}
          >
            <SelectTrigger className={cn("bg-white text-[#1b4332] flex-1", selectClassName)}>
              <SelectValue placeholder="Amount" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {[...Array(10)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={form.getValues("dosageUnit")}
            onValueChange={(value) => form.setValue("dosageUnit", value)}
          >
            <SelectTrigger className={cn("bg-white text-[#1b4332] flex-1", selectClassName)}>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mg">mg</SelectItem>
              <SelectItem value="g">g</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency" className="text-sm font-medium text-white">
          Frequency
        </Label>
        <div className="flex gap-3">
          <Select
            defaultValue={form.getValues("frequencyAmount")}
            onValueChange={(value) => form.setValue("frequencyAmount", value)}
          >
            <SelectTrigger className={cn("bg-white text-[#1b4332] flex-1", selectClassName)}>
              <SelectValue placeholder="Amount" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {[...Array(14)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            defaultValue={form.getValues("frequencyUnit")}
            onValueChange={(value) => form.setValue("frequencyUnit", value)}
          >
            <SelectTrigger className={cn("bg-white text-[#1b4332] flex-1", selectClassName)}>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">hourly</SelectItem>
              <SelectItem value="daily">daily</SelectItem>
              <SelectItem value="weekly">weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium text-white">
          Notes
        </Label>
        <Textarea 
          id="notes" 
          {...form.register("notes")} 
          className={cn(
            "bg-white text-[#1b4332] placeholder:text-[#1b4332]/60",
            isMobile ? "min-h-[100px] text-base" : "min-h-[80px] text-sm"
          )}
        />
      </div>

      <Button
        type="submit"
        className={cn(
          "w-full bg-white text-[#1b4332] hover:bg-white/90",
          isMobile ? "h-14 text-lg" : "h-10 text-sm"
        )}
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {supplementId ? 'Update Supplement' : 'Add Supplement'}
      </Button>
    </form>
  );
}