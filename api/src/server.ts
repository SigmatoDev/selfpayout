import { createApp } from './app';
import { connectDatabase } from './config/prisma';
import { env } from './config/env';

const bootstrap = async () => {
  await connectDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`API ready on port ${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
