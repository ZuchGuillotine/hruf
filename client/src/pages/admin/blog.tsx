
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
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  publishedAt: string;
}

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
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post added successfully" });
      setOpen(false);
      setEditingPost(null);
    },
  });

  const updatePost = useMutation({
    mutationFn: async (data: Partial<BlogPost>) => {
      const res = await fetch(`/api/admin/blog/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post updated successfully" });
      setOpen(false);
      setEditingPost(null);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog'] });
      toast({ title: "Success", description: "Blog post deleted successfully" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      excerpt: formData.get('excerpt') as string,
      content: formData.get('content') as string,
      thumbnailUrl: formData.get('thumbnailUrl') as string,
    };

    if (editingPost) {
      updatePost.mutate({ ...data, id: editingPost.id });
    } else {
      addPost.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Blog Posts</h1>
          <Dialog open={open} onOpenChange={setOpen}>
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
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title">Title</label>
                  <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={editingPost?.title}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="excerpt">Excerpt</label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    required
                    defaultValue={editingPost?.excerpt}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="content">Content (HTML)</label>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    className="min-h-[300px] font-mono"
                    defaultValue={editingPost?.content}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="thumbnailUrl">Thumbnail URL</label>
                  <Input
                    id="thumbnailUrl"
                    name="thumbnailUrl"
                    type="url"
                    required
                    defaultValue={editingPost?.thumbnailUrl}
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

        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 border rounded-lg flex justify-between items-start"
            >
              <div className="flex-1">
                <h2 className="font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500 mb-2">
                  Published: {new Date(post.publishedAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
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
        </div>
      </main>
    </div>
  );
}
