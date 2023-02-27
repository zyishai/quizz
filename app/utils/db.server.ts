import Surreal from "surrealdb.js";
import invariant from "tiny-invariant";

declare global {
  var __db: Surreal | undefined;
}

let db: Surreal;

const wait = (delay: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

const connectToDatabase = async (db: Surreal, timeout: number = 2000) => {
  invariant(process.env.DATABASE_URL, 'DATABASE_URL environment must be set');
  await Promise.race([
    db.connect(process.env.DATABASE_URL),
    wait(timeout).then(() => { throw new Error(`Connect to database operation timeout (timeout=${timeout}ms)`) })
  ]).catch((error) => {
    console.error(`[${process.env.NODE_ENV}] Cannot connect to database:`);
    console.error(error);
    throw error;
  })
}

const initializeDatabase = async (db: Surreal) => {
  await connectToDatabase(db);
  await db.signin({
    user: process.env.DATABASE_USER as string,
    pass: process.env.DATABASE_PASSWORD as string,
  });
  await db.use("test", "test");
}

const getDatabaseInstance = async (timeout?: number) => {
  if (process.env.NODE_ENV === 'production') {
    db = new Surreal();
    await initializeDatabase(db);
  } else {
    if (!global.__db) {
      global.__db = new Surreal();
      await initializeDatabase(global.__db);
    }
    
    db = global.__db;
  }

  await db.use('test', 'test');
  return db;
}

export { getDatabaseInstance, connectToDatabase };
