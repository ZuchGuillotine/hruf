import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectSupplementReference } from "@db/schema";

export default function AdminSupplements() {
  const { toast } = useToast();
  
  const { data: supplements = [], isLoading } = useQuery<SelectSupplementReference[]>({
    queryKey: ['/api/admin/supplements'],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Supplements</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplement
        </Button>
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
    </div>
  );
}
