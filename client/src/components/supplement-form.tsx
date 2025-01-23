import { useForm } from "react-hook-form";
import { useSupplements } from "@/hooks/use-supplements";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type FormData = {
  name: string;
  dosage: string;
  frequency: string;
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
      dosage: "",
      frequency: "",
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addSupplement(data);
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
        <Input 
          id="dosage" 
          {...form.register("dosage")} 
          required 
          className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="frequency" className="text-sm font-medium text-white">
          Frequency
        </label>
        <Input 
          id="frequency" 
          {...form.register("frequency")} 
          required 
          className="bg-white text-[#1b4332] placeholder:text-[#1b4332]/60"
        />
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