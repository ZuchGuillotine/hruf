import { useForm } from "react-hook-form";
import { useSupplements } from "@/hooks/use-supplements";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type FormData = {
  name: string;
  dosageAmount: string;
  dosageUnit: string;
  frequencyAmount: string;
  frequencyUnit: string;
  notes?: string;
};

export default function SupplementForm({
  onSuccess
}: {
  onSuccess: () => void;
}) {
  const { addSupplement } = useSupplements();
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      dosageAmount: "1",
      dosageUnit: "mg",
      frequencyAmount: "1",
      frequencyUnit: "daily",
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addSupplement({
        name: data.name,
        dosage: `${data.dosageAmount} ${data.dosageUnit}`,
        frequency: `${data.frequencyAmount}x ${data.frequencyUnit}`,
        notes: data.notes,
      });
      toast({
        title: "Success",
        description: "Supplement added successfully",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-white">
          Supplement Name
        </label>
        <Input 
          id="name" 
          {...form.register("name")} 
          required 
          className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dosage" className="text-sm font-medium text-white">
          Dosage
        </label>
        <div className="flex gap-2">
          <Select
            defaultValue={form.getValues("dosageAmount")}
            onValueChange={(value) => form.setValue("dosageAmount", value)}
          >
            <SelectTrigger className="bg-white text-[#1b4332]">
              <SelectValue placeholder="Amount" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="bg-white text-[#1b4332]">
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
        <label htmlFor="frequency" className="text-sm font-medium text-white">
          Frequency
        </label>
        <div className="flex gap-2">
          <Select
            defaultValue={form.getValues("frequencyAmount")}
            onValueChange={(value) => form.setValue("frequencyAmount", value)}
          >
            <SelectTrigger className="bg-white text-[#1b4332]">
              <SelectValue placeholder="Amount" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="bg-white text-[#1b4332]">
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
        <label htmlFor="notes" className="text-sm font-medium text-white">
          Notes
        </label>
        <Textarea 
          id="notes" 
          {...form.register("notes")} 
          className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-white text-[#1b4332] hover:bg-white/90"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Add Supplement
      </Button>
    </form>
  );
}