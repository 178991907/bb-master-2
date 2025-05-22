'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  createdDate: string;
  icon?: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  categoryName?: string;
  createdDate: string;
  imageUrl?: string;
  aiHint?: string;
  description?: string;
  faviconUrl?: string;
}

export default function NavigationManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon: '' });
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    categoryId: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/navigation');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setCategories(data.categories);
      setLinks(data.links);
    } catch (error) {
      toast({
        title: '错误',
        description: '加载数据失败',
        variant: 'destructive',
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/navigation/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCategory,
          createdDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add category');
      }
      const category = await response.json();
      setCategories([...categories, category]);
      setNewCategory({ name: '', slug: '', icon: '' });
      toast({
        title: '成功',
        description: '分类添加成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '添加分类失败',
        variant: 'destructive',
      });
    }
  };

  const handleAddLink = async () => {
    try {
      const response = await fetch('/api/navigation/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLink,
          createdDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to add link');
      }
      const link = await response.json();
      setLinks([...links, link]);
      setNewLink({
        title: '',
        url: '',
        categoryId: '',
        description: '',
      });
      toast({
        title: '成功',
        description: '链接添加成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '添加链接失败',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/navigation/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
      setCategories(categories.filter(c => c.id !== id));
      toast({
        title: '成功',
        description: '分类删除成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '删除分类失败',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const response = await fetch(`/api/navigation/links?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete link');
      }
      setLinks(links.filter(l => l.id !== id));
      toast({
        title: '成功',
        description: '链接删除成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '删除链接失败',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">导航管理</h1>
      
      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">分类管理</TabsTrigger>
          <TabsTrigger value="links">链接管理</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>添加新分类</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="分类名称"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <Input
                  placeholder="分类标识"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                />
                <Input
                  placeholder="图标 (可选)"
                  value={newCategory.icon || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                />
                <Button onClick={handleAddCategory}>添加分类</Button>
              </div>

              <div className="grid gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.slug}</p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        删除
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>添加新链接</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="链接标题"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                />
                <select
                  className="border rounded px-3 py-2"
                  value={newLink.categoryId}
                  onChange={(e) => setNewLink({ ...newLink, categoryId: e.target.value })}
                >
                  <option value="">选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddLink}>添加链接</Button>
              </div>

              <div className="grid gap-4">
                {links.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-semibold">{link.title}</h3>
                        <p className="text-sm text-gray-500">{link.url}</p>
                        <p className="text-sm text-gray-500">分类: {link.categoryName}</p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        删除
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}