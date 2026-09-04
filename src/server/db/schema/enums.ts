import { pgEnum } from 'drizzle-orm/pg-core';

export const assetTypeEnum = pgEnum('asset_type', [
  'land',
  'plant',
  'animal',
  'equipment',
  'structure',
  'material',
  'sensor',
  'water',
  'seed',
  'product',
  'compost',
  'group',
]);

export const logTypeEnum = pgEnum('log_type', [
  'activity',
  'observation',
  'input',
  'harvest',
  'seeding',
  'transplanting',
  'birth',
  'maintenance',
  'medical',
  'lab_test',
  'movement',
  'irrigation',
]);

export const inventoryAdjustmentEnum = pgEnum('inventory_adjustment', [
  'increment',
  'decrement',
  'reset',
]);

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'manager',
  'worker',
  'viewer',
]);
