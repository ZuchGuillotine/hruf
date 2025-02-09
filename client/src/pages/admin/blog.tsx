import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost } from "@/lib/types";

export default function AdminBlogPosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<BlogPost | null>(null);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/admin/blog'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog');
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    }
  });

  const addPost = useMutation({
    mutationFn: async (data: Omit<BlogPost, 'id' | 'publishedAt' | 'slug'>) => {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add post');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post added successfully" });
      setOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add post",
        variant: "destructive"
      });
    }
  });

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost> & { id: number }) => {
      const res = await fetch(`/api/admin/blog/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update post');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      setOpen(false);
      setEditingPost(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update post",
        variant: "destructive"
      });
    }
  });

  const deletePost = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post deleted successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to delete post",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      content: formData.get('content') as string,
      thumbnailUrl: formData.get('thumbnailUrl') as string,
    };

    try {
      if (editingPost) {
        await updatePost.mutateAsync({ ...data, id: editingPost.id });
      } else {
        await addPost.mutateAsync(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost.mutateAsync(id);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Blog Posts</h1>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setEditingPost(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPost(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? 'Edit Blog Post' : 'Add New Blog Post'}
                </DialogTitle>
                <DialogDescription>
                  {editingPost 
                    ? 'Update the blog post details below.' 
                    : 'Fill in the blog post details below.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Title</label>
                  <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={editingPost?.title}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="excerpt" className="text-sm font-medium">Excerpt</label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    required
                    defaultValue={editingPost?.excerpt}
                    className="w-full min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">Content (HTML)</label>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    className="w-full min-h-[300px] font-mono"
                    defaultValue={editingPost?.content}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="thumbnailUrl" className="text-sm font-medium">Thumbnail URL</label>
                  <Input
                    id="thumbnailUrl"
                    name="thumbnailUrl"
                    type="url"
                    required
                    defaultValue={editingPost?.thumbnailUrl}
                    className="w-full"
                  />
                  {editingPost?.thumbnailUrl && (
                    <img 
                      src={editingPost.thumbnailUrl} 
                      alt="Thumbnail preview" 
                      className="mt-2 max-h-40 object-cover rounded"
                    />
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addPost.isPending || updatePost.isPending}
                >
                  {(addPost.isPending || updatePost.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPost ? 'Update Post' : 'Add Post'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 border rounded-lg bg-card flex justify-between items-start shadow-sm"
            >
              <div className="flex-1">
                <h2 className="font-semibold text-xl mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Published: {new Date(post.publishedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-foreground/80 line-clamp-2">{post.excerpt}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPost(post);
                    setOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blog posts found. Click the "Add Post" button to create your first post.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}