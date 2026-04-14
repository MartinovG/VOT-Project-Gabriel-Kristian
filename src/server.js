import { app } from './app.js';
import dotenv from 'dotenv';
import { initDb } from './db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, async () => {
    if(process.env.DATABASE_URL) {
      await initDb();
    } else {
      console.warn("DATABASE_URL not set, falling back to memory arrays if applicable");
    }
    console.log(` Server is listening at http://${HOST}:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
