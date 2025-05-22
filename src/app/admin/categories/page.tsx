
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
    const storedCategories = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error("Failed to parse categories from localStorage:", e);
        // Fallback to initial mock data and reset localStorage
        setCategories(initialMockCategories);
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(initialMockCategories));
      }
    } else {
      // Initialize with mock data if nothing is in localStorage
      setCategories(initialMockCategories);
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(initialMockCategories));
    }
    setIsLoading(false);
  }, []);

  const handleEdit = (categoryId: string) => {
    router.push(`/admin/categories/edit/${categoryId}`);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(updatedCategories));
      // In a real app, also delete associated links or handle them as per requirements
      alert('Category deleted successfully (mock)!');
    }
  };

  const handleReorder = () => {
    // Placeholder for reorder functionality
    alert('Reorder categories (mock - not implemented with localStorage persistence)');
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
