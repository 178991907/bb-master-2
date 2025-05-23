import { Pool, ClientConfig } from 'pg';
import { MongoClient, Db } from 'mongodb';

interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getCategories(): Promise<Category[]>;
  getLinks(): Promise<LinkItem[]>;
  addCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  addLink(link: Omit<LinkItem, 'id'>): Promise<LinkItem>;
  updateLink(id: string, link: Partial<LinkItem>): Promise<LinkItem>;
  deleteLink(id: string): Promise<void>;
}

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

class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('PostgreSQL Database URL is not configured.');
    }

    const config: ClientConfig = {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    };

    this.pool = new Pool(config);
    console.log('PostgreSQL connection pool created.');
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = null;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query<Category>(
      'SELECT id, name, slug, "createdDate", icon FROM categories;'
    );
    return result.rows;
  }

  async getLinks(): Promise<LinkItem[]> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query<LinkItem>(
      'SELECT l.id, l.title, l.url, l.categoryId, c.name AS "categoryName", ' +
      'l."createdDate", l."imageUrl", l."aiHint", l.description, l."faviconUrl" ' +
      'FROM links l JOIN categories c ON l.categoryId = c.id'
    );
    return result.rows;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query<Category>(
      'INSERT INTO categories (name, slug, "createdDate", icon) VALUES ($1, $2, $3, $4) RETURNING *',
      [category.name, category.slug, category.createdDate, category.icon]
    );
    return result.rows[0];
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    if (!this.pool) throw new Error('Database not connected');
    const setClauses = [];
    const values = [id];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(category)) {
      if (value !== undefined) {
        setClauses.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const query = `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query<Category>(query, values);
    return result.rows[0];
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');
    await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
  }

  async addLink(link: Omit<LinkItem, 'id'>): Promise<LinkItem> {
    if (!this.pool) throw new Error('Database not connected');
    const result = await this.pool.query<LinkItem>(
      'INSERT INTO links (title, url, "categoryId", "createdDate", "imageUrl", "aiHint", description, "faviconUrl") ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [link.title, link.url, link.categoryId, link.createdDate, link.imageUrl, link.aiHint, link.description, link.faviconUrl]
    );
    return result.rows[0];
  }

  async updateLink(id: string, link: Partial<LinkItem>): Promise<LinkItem> {
    if (!this.pool) throw new Error('Database not connected');
    const setClauses = [];
    const values = [id];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(link)) {
      if (value !== undefined) {
        setClauses.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    const query = `UPDATE links SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await this.pool.query<LinkItem>(query, values);
    return result.rows[0];
  }

  async deleteLink(id: string): Promise<void> {
    if (!this.pool) throw new Error('Database not connected');
    await this.pool.query('DELETE FROM links WHERE id = $1', [id]);
  }
}

class MongoAdapter implements DatabaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    const mongoUrl = process.env.NEXT_PUBLIC_MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MongoDB URL is not configured.');
    }

    this.client = new MongoClient(mongoUrl);
    await this.client.connect();
    this.db = this.client.db(process.env.NEXT_PUBLIC_MONGODB_DB || 'navigation');
    console.log('MongoDB connection established.');
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
    this.db = null;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not connected');
    return await this.db.collection<Category>('categories').find().toArray();
  }

  async getLinks(): Promise<LinkItem[]> {
    if (!this.db) throw new Error('Database not connected');
    const links = await this.db.collection<LinkItem>('links').aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: 'id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $addFields: {
          categoryName: '$category.name'
        }
      }
    ]).toArray();
    return links;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    if (!this.db) throw new Error('Database not connected');
    const newCategory = { ...category, id: new Date().getTime().toString() };
    await this.db.collection<Category>('categories').insertOne(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    if (!this.db) throw new Error('Database not connected');
    const result = await this.db.collection<Category>('categories').findOneAndUpdate(
      { id },
      { $set: category },
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Category not found');
    return result;
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    await this.db.collection('categories').deleteOne({ id });
  }

  async addLink(link: Omit<LinkItem, 'id'>): Promise<LinkItem> {
    if (!this.db) throw new Error('Database not connected');
    const newLink = { ...link, id: new Date().getTime().toString() };
    await this.db.collection<LinkItem>('links').insertOne(newLink);
    return newLink;
  }

  async updateLink(id: string, link: Partial<LinkItem>): Promise<LinkItem> {
    if (!this.db) throw new Error('Database not connected');
    const result = await this.db.collection<LinkItem>('links').findOneAndUpdate(
      { id },
      { $set: link },
      { returnDocument: 'after' }
    );
    if (!result) throw new Error('Link not found');
    return result;
  }

  async deleteLink(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    await this.db.collection('links').deleteOne({ id });
  }
}

// Factory function to create the appropriate database adapter
export function createDatabaseAdapter(): DatabaseAdapter {
  const dbType = process.env.NEXT_PUBLIC_DATABASE_TYPE || 'postgresql';
  
  switch (dbType.toLowerCase()) {
    case 'postgresql':
      return new PostgresAdapter();
    case 'mongodb':
      return new MongoAdapter();
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}