export interface IMaintenance {
  service: string;
  description?: string | null;
  performed_at?: string | null;

  next_due_date?: string | null;

  next_due_usage_limit?: number | null;
  next_due_usage_current?: number | null;
  usage_unit?: 'km' | 'horas' | 'ciclos' | null;

  status: 'ativa' | 'realizada' | 'adiada' | 'cancelada';
}
