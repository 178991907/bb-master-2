'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createDatabaseAdapter } from '@/lib/db-adapter';
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

export default function NavigationHome() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dbAdapter = createDatabaseAdapter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await dbAdapter.connect();
      const [categoriesData, linksData] = await Promise.all([
        dbAdapter.getCategories(),
        dbAdapter.getLinks()
      ]);
      setCategories(categoriesData);
      setLinks(linksData);
    } catch (error) {
      toast({
        title: '错误',
        description: '加载数据失败',
        variant: 'destructive',
      });
    } finally {
      await dbAdapter.disconnect();
    }
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = searchTerm === '' ||
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || link.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">导航</h1>
        <div className="max-w-xl mx-auto">
          <Input
            placeholder="搜索链接..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>分类</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  className={`w-full text-left px-3 py-2 rounded ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  全部
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`w-full text-left px-3 py-2 rounded ${selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.icon && (
                      <span className="mr-2">{category.icon}</span>
                    )}
                    {category.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((link) => (
              <Card key={link.id} className="hover:shadow-lg transition-shadow">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {link.faviconUrl && (
                        <img
                          src={link.faviconUrl}
                          alt=""
                          className="w-6 h-6 mt-1"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{link.title}</h3>
                        {link.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {link.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {link.categoryName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </a>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}