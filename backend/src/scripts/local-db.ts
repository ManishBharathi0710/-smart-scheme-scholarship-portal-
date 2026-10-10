import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import net from 'net';

interface EmbeddedPostgresInstance {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  initialise: () => Promise<void>;
}

interface EmbeddedPostgresConstructor {
  new (options: {
    port: number;
    databaseDir: string;
    user?: string;
    password?: string;
    initialDatabase?: string;
    persistent?: boolean;
  }): EmbeddedPostgresInstance;
}

let pgInstance: EmbeddedPostgresInstance | null = null;

export async function ensureLocalDatabaseRunning(): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const isPortOpen = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(600);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        resolve(false);
      });
      socket.connect(5432, '127.0.0.1');
    });

    if (isPortOpen) {
      return true;
    }

    const dbPath = path.resolve(process.cwd(), '.pgdata');
    const PostgresClass = EmbeddedPostgres as unknown as EmbeddedPostgresConstructor;
    pgInstance = new PostgresClass({
      port: 5432,
      databaseDir: dbPath,
      user: 'postgres',
      password: 'postgres',
      initialDatabase: 'smart_scheme_db',
      persistent: true,
    });

    try {
      await pgInstance.start();
    } catch {
      await pgInstance.initialise();
      await pgInstance.start();
    }
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Embedded Postgres auto-start error:', err);
    return false;
  }
}

export async function stopLocalDatabase(): Promise<void> {
  if (pgInstance) {
    try {
      await pgInstance.stop();
    } catch {
      // ignore
    }
  }
}

// Standalone execution support
if (process.argv[1]?.includes('local-db')) {
  ensureLocalDatabaseRunning().then((success) => {
    if (success) {
      // eslint-disable-next-line no-console
      console.log('✅ Local PostgreSQL is active on port 5432.');
      const cleanup = async () => {
        await stopLocalDatabase();
        process.exit(0);
      };
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    }
  });
}
