import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import type { SelectSupplementReference, InsertSupplementReference } from '@db/rds-schema';
import Header from '@/components/header';

type FormData = {
  name: string;
  category: string;
  alternativeNames: string;
  description: string;
  source: string;
  sourceUrl: string;
};

export default function AdminSupplements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      category: '',
      alternativeNames: '',
      description: '',
      source: '',
      sourceUrl: '',
    },
  });

  const { data: supplements = [], isLoading } = useQuery<SelectSupplementReference[]>({
    queryKey: ['/api/admin/supplements'],
  });

  const addSupplement = useMutation({
    mutationFn: async (data: FormData) => {
      const supplement: Partial<InsertSupplementReference> = {
        name: data.name,
        category: data.category,
        alternativeNames: data.alternativeNames.split(',').map((name) => name.trim()),
        description: data.description,
        source: data.source,
        sourceUrl: data.sourceUrl,
      };

      const res = await fetch('/api/admin/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplement),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/supplements'] });
      toast({ title: 'Success', description: 'Supplement added successfully' });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    addSupplement.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Supplements</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplement</DialogTitle>
                <DialogDescription>
                  Add a new supplement to the reference database.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...form.register('name')} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...form.register('category')} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternativeNames">Alternative Names (comma-separated)</Label>
                  <Input
                    id="alternativeNames"
                    {...form.register('alternativeNames')}
                    placeholder="e.g., Vitamin C, Ascorbic Acid"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...form.register('description')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input id="source" {...form.register('source')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input id="sourceUrl" type="url" {...form.register('sourceUrl')} />
                </div>

                <Button type="submit" className="w-full" disabled={addSupplement.isPending}>
                  {addSupplement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Supplement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableCaption>A list of all available supplements in the database.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Alternative Names</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplements.map((supplement) => (
              <TableRow key={supplement.id}>
                <TableCell className="font-medium">{supplement.name}</TableCell>
                <TableCell>{supplement.category}</TableCell>
                <TableCell>{supplement.alternativeNames?.join(', ')}</TableCell>
                <TableCell className="max-w-md truncate">{supplement.description}</TableCell>
                <TableCell>{supplement.source}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
