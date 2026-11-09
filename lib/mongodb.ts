import { MongoClient, Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/doxera";
const dbName = process.env.MONGODB_DB_NAME || "doxera";

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.warn("MongoDB connection warning (dev):", err.message);
      // Return a client instance anyway; operations can handle errors gracefully or fall back
      return client;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect().catch((err) => {
    console.warn("MongoDB connection warning:", err.message);
    return client;
  });
}

export async function getDatabase(): Promise<Db> {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;
