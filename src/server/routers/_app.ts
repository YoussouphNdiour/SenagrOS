import { router, publicProcedure } from '../trpc';
import { assetRouter } from './asset';
import { logRouter } from './log';
import { quantityRouter } from './quantity';
import { inputRouter } from './input';
import { inventoryRouter } from './inventory';
import { observationRouter } from './observation';
import { calendarRouter } from './calendar';
import { planRouter } from './plan';
import { reportRouter } from './report';
import { financeRouter } from './finance';
import { cooperativeRouter } from './cooperative';
import { marketplaceRouter } from './marketplace';
import { searchRouter } from './search';
import { notificationRouter } from './notification';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  asset: assetRouter,
  log: logRouter,
  quantity: quantityRouter,
  input: inputRouter,
  inventory: inventoryRouter,
  observation: observationRouter,
  calendar: calendarRouter,
  plan: planRouter,
  report: reportRouter,
  finance: financeRouter,
  cooperative: cooperativeRouter,
  marketplace: marketplaceRouter,
  search: searchRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
