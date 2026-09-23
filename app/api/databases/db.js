import { MongoClient, ServerApiVersion } from "mongodb";

let cachedClient = null;
let cachedDB = null;

export async function connectToDB() {
    if (cachedClient != null && cachedDB != null) {
        return { client: cachedClient, db: cachedDB };
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not configured.");
    }

    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect();

    cachedClient = client;
    cachedDB = client.db("User-DB"); //uses User-DB

    return { client: cachedClient, db: cachedDB };

}