import { IMaintenance } from './maintenance';
export type UsageUnit = 'km' | 'horas' | 'ciclos';

export type IMaintenanceUpdate = Partial<IMaintenance> & {
  next_due_date?: string | null;
  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: UsageUnit | null;
  description?: string | null;
};
