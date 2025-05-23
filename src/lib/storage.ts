
import dotenv from 'dotenv';
import { Client, type ClientBase } from 'pg'; // Corrected import for ClientBase if needed, or just Client

dotenv.config(); // Load environment variables at the top

// Define the Storage interface
interface Storage {
  getData(key: string): Promise<any>;
  saveData(key: string, data: any): Promise<void>;
  // Add other data operation methods as needed
}

// Local Storage implementation (in-memory map for server-side fallback)
class LocalStorage implements Storage {
  private data: Map<string, any>;

  constructor() {
    this.data = new Map();
    console.log("Storage System: Using local (in-memory map) storage mode.");
  }

  async getData(key: string): Promise<any> {
    return this.data.get(key);
  }

  async saveData(key: string, data: any): Promise<void> {
    this.data.set(key, data);
  }
}

// Cloud Database Storage implementation (currently PostgreSQL specific)
class CloudDatabaseStorage implements Storage {
  private client: Client; 

  constructor(dbUrl: string, dbType: string) {
    console.log(`Storage System: Using cloud database mode (${dbType}) with URL (connection string starts with): ${dbUrl.substring(0, dbUrl.indexOf(':') + 4)}...`);
    
    this.client = new Client({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false, // Adjust based on your database provider's SSL requirements
      },
      connectionTimeoutMillis: 5000,
    });

    this.client.connect()
      .then(async () => { // Make the callback async
        console.log(`Cloud database (${dbType}) connected successfully!`);
        try {
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS storage (
              key VARCHAR(255) PRIMARY KEY,
              value JSONB
            );
          `;
          await this.client.query(createTableQuery);
          console.log(`Storage System: Table "storage" ensured/created successfully in ${dbType}.`);
        } catch (tableError: any) {
          console.error(`Storage System: Error ensuring/creating "storage" table in ${dbType}:`, tableError.message, tableError.stack);
          // Depending on requirements, you might want to handle this error more gracefully
          // or even throw it to prevent the application from starting if the table is critical.
        }
      })
      .catch(err => console.error(`Cloud database (${dbType}) connection error during initial connect:`, err.message, err.stack));
  }

  async getData(key: string): Promise<any> {
    try {
      // console.log(`Attempting to get data from cloud database for key: ${key}`);
      const query = `
        SELECT value FROM storage
        WHERE key = $1;
      `;
      const result = await this.client.query(query, [key]);

      if (result.rows.length > 0) {
        return result.rows[0].value;
      } else {
        return null; 
      }
    } catch (error: any) {
      console.error(`Error fetching data from cloud database for key: ${key}`, error.message, error.stack);
      throw error; 
    }
  }

  async saveData(key: string, data: any): Promise<void> {
    try {
      // console.log(`Attempting to save data to cloud database for key: ${key}`);
      const query = `
        INSERT INTO storage (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value;
      `;
      await this.client.query(query, [key, data]);
      // console.log(`Data saved to cloud database for key: ${key}`);
    } catch (error: any) {
      console.error(`Error saving data to cloud database for key: ${key}`, error.message, error.stack);
      throw error;
    }
  }

  // It's good practice to have a disconnect method
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
        console.log("Cloud database client disconnected.");
      } catch(closeError: any) {
        console.error("Error closing database connection:", closeError.message);
      }
    }
  }
}

// Singleton instance of storage
let storageInstance: Storage | null = null;

// Function to get the appropriate storage instance
export function getStorage(): Storage {
  if (storageInstance) {
    return storageInstance;
  }

  console.log('Storage System: Initializing storage instance...');

  const pgUrl = process.env.DATABASE_URL;
  const mysqlUrl = process.env.NEXT_PUBLIC_MYSQL_URL;
  const mongoUrl = process.env.NEXT_PUBLIC_MONGODB_URL;

  if (pgUrl) {
    console.log("Storage System: PostgreSQL URL (DATABASE_URL) found.");
    try {
      storageInstance = new CloudDatabaseStorage(pgUrl, "PostgreSQL");
      console.log("Storage System: CloudDatabaseStorage (PostgreSQL) initialized.");
      return storageInstance;
    } catch (error: any) {
      console.error("Storage System: Failed to initialize PostgreSQL storage. Falling back.", error.message);
    }
  }
  
  if (mysqlUrl) {
    console.log("Storage System: MySQL URL (NEXT_PUBLIC_MYSQL_URL) found, but MySQL is not yet implemented. Falling back.");
    // If MySQL implementation was ready:
    // try {
    //   storageInstance = new MySqlStorage(mysqlUrl); // Assuming MySqlStorage class exists
    //   console.log("Storage System: MySqlStorage initialized.");
    //   return storageInstance;
    // } catch (error: any) {
    //   console.error("Storage System: Failed to initialize MySQL storage. Falling back.", error.message);
    // }
  }

  if (mongoUrl) {
    console.log("Storage System: MongoDB URL (NEXT_PUBLIC_MONGODB_URL) found, but MongoDB is not yet implemented. Falling back.");
    // If MongoDB implementation was ready:
    // try {
    //   storageInstance = new MongoDbStorage(mongoUrl); // Assuming MongoDbStorage class exists
    //   console.log("Storage System: MongoDbStorage initialized.");
    //   return storageInstance;
    // } catch (error: any) {
    //   console.error("Storage System: Failed to initialize MongoDB storage. Falling back.", error.message);
    // }
  }

  console.log("Storage System: No supported cloud database URL configured or implementation missing. Using local (in-memory map) storage as fallback.");
  storageInstance = new LocalStorage();
  return storageInstance;
}
