
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  createdDate: string;
}

const LOCAL_STORAGE_CATEGORIES_KEY = 'linkHubCategories';

// Initial mock data if localStorage is empty
export const initialMockCategories: Category[] = [ // Exported for use in links/new
  { id: '1', name: '常用工具', slug: 'common-tools', createdDate: 'May 16, 2024', icon: 'tool' },
  { id: '2', name: '儿童游戏', slug: 'kids-games', createdDate: 'May 16, 2024', icon: 'gamepad-2' },
];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (e) {
        console.error("Failed to fetch categories:", e);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const handleEdit = async (categoryId: string, newName: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      
      setCategories(prev => prev.map(category =>
        category.id === categoryId ? { ...category, name: newName } : category
      ));
      alert('Category updated successfully!');
    } catch (e) {
      console.error('Failed to update category:', e);
      alert('Failed to update category. Please try again.');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete category');
        
        setCategories(prev => prev.filter(category => category.id !== categoryId));
        alert('Category deleted successfully!');
      } catch (e) {
        console.error('Failed to delete category:', e);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const handleReorder = async (startIndex: number, endIndex: number) => {
    const result = Array.from(categories);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update order property for each category
    const updatedCategories = result.map((category, index) => ({
      ...category,
      order: index,
    }));

    try {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCategories),
      });
      if (!response.ok) throw new Error('Failed to reorder categories');
      
      setCategories(updatedCategories);
    } catch (e) {
      console.error('Failed to reorder categories:', e);
      alert('Failed to reorder categories. Please try again.');
      // Revert to original order
      setCategories(prev => [...prev]);
    }
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Categories</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReorder}>
            <ArrowUpDown className="mr-2 h-4 w-4" /> Reorder
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Link>
          </Button>
        </div>
      </div>
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.icon || '-'}</TableCell>
                  <TableCell>{category.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category.id)}
                      aria-label="Edit category"
                      className="mr-2 hover:text-blue-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      aria-label="Delete category"
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {categories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No categories found. Add one to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
