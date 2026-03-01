import pino from 'pino';
import { environment } from './env.js';

export const logger = pino({
  level: environment.LOG_LEVEL ?? 'info',
  ...(environment.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty' },
  }),
});
