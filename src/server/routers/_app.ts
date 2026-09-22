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
import { farmMemberRouter } from './farm-member';
import { cooperativeRouter } from './cooperative';
import { marketplaceRouter } from './marketplace';
import { cropRouter } from './crop';
import { searchRouter } from './search';
import { mapRouter } from './map';
import { ndviRouter } from './ndvi';
import { plannedTaskRouter } from './planned-task';
import { notificationRouter } from './notification';

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: 'ok' })),
  asset: assetRouter,
  search: searchRouter,
  log: logRouter,
  quantity: quantityRouter,
  input: inputRouter,
  inventory: inventoryRouter,
  observation: observationRouter,
  calendar: calendarRouter,
  plan: planRouter,
  report: reportRouter,
  finance: financeRouter,
  farmMember: farmMemberRouter,
  cooperative: cooperativeRouter,
  marketplace: marketplaceRouter,
  crop: cropRouter,
  map: mapRouter,
  ndvi: ndviRouter,
  plannedTask: plannedTaskRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
