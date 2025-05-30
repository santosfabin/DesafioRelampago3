import pool from '../database/connection';
import { IMaintenance } from '../interfaces/maintenance';
import { IMaintenanceUpdate } from '../interfaces/maintenanceUpdate';

const showOneMaintenanceSql = async (userId: number, assetId: string, maintenanceId: string) => {
  try {
    const query = `
      SELECT m.*
      FROM maintenance m
      JOIN asset a ON m.asset_id = a.id
      WHERE m.asset_id = $1 AND a.user_id = $2
      AND m.id = $3
    `;
    const result = await pool.query(query, [assetId, userId, maintenanceId]);

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

const showAllMaintenanceSql = async (userId: number, assetId: string) => {
  try {
    const query = `
      SELECT m.*
      FROM maintenance m
      JOIN asset a ON m.asset_id = a.id
      WHERE m.asset_id = $1 AND a.user_id = $2
    `;
    const result = await pool.query(query, [assetId, userId]);

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

const createMaintenanceSql = async (
  maintenanceData: IMaintenance & { user_id: string; asset_id: string }
) => {
  try {
    const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [
      maintenanceData.asset_id,
      maintenanceData.user_id,
    ]);

    if (verifyResult.rowCount === 0) {
      throw new Error('Ativo não encontrado');
    }

    const insertQuery = `
      INSERT INTO maintenance (
        asset_id, service, description, performed_at, status,
        next_due_date, next_due_usage_limit, next_due_usage_current, usage_unit
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9
      ) RETURNING *;
    `;

    const values = [
      maintenanceData.asset_id,
      maintenanceData.service,
      maintenanceData.description,
      maintenanceData.performed_at,
      maintenanceData.status,
      maintenanceData.next_due_date || null,
      maintenanceData.next_due_usage_limit || null,
      maintenanceData.next_due_usage_current || null,
      maintenanceData.usage_unit || null,
    ];

    const insertResult = await pool.query(insertQuery, values);
    return insertResult.rows;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const UPDATABLE_MAINTENANCE_KEYS: (keyof IMaintenanceUpdate)[] = [
  'service',
  'description',
  'performed_at',
  'status',
  'next_due_date',
  'next_due_usage_limit',
  'next_due_usage_current',
  'usage_unit',
];

const updateMaintenanceSql = async (
  userId: string,
  assetId: string,
  maintenanceId: string,
  updateDataFromService: Partial<IMaintenanceUpdate>
) => {
  try {
    const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [assetId, userId]);
    if (verifyResult.rowCount === 0) {
      throw new Error('Ativo não encontrado ou não pertence ao usuário');
    }

    const existingQuery = `
      SELECT service, description, performed_at, status, 
      next_due_date, next_due_usage_limit, next_due_usage_current, usage_unit
      FROM maintenance 
      WHERE id = $1 AND asset_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [maintenanceId, assetId]);
    if (existingResult.rowCount === 0) {
      throw new Error('Manutenção não encontrada para atualização');
    }
    const existingMaintenanceData = existingResult.rows[0] as IMaintenance;

    const finalSqlPayload: Partial<IMaintenance> = { ...updateDataFromService };

    if ('next_due_date' in updateDataFromService) {
      finalSqlPayload.next_due_date = updateDataFromService.next_due_date;
      finalSqlPayload.next_due_usage_limit = null;
      finalSqlPayload.next_due_usage_current = null;
      finalSqlPayload.usage_unit = null;
    } else if (
      'next_due_usage_limit' in updateDataFromService ||
      'next_due_usage_current' in updateDataFromService ||
      'usage_unit' in updateDataFromService
    ) {
      finalSqlPayload.next_due_date = null;

      finalSqlPayload.next_due_usage_limit =
        updateDataFromService.next_due_usage_limit !== undefined
          ? updateDataFromService.next_due_usage_limit
          : existingMaintenanceData.next_due_usage_limit;
      finalSqlPayload.next_due_usage_current =
        updateDataFromService.next_due_usage_current !== undefined
          ? updateDataFromService.next_due_usage_current
          : existingMaintenanceData.next_due_usage_current;
      finalSqlPayload.usage_unit =
        updateDataFromService.usage_unit !== undefined
          ? updateDataFromService.usage_unit
          : existingMaintenanceData.usage_unit;

      const { next_due_usage_limit, next_due_usage_current, usage_unit } = finalSqlPayload;
      const usageValuesProvided = [next_due_usage_limit, next_due_usage_current, usage_unit];
      const numUsageValuesEffectivelySet = usageValuesProvided.filter(
        v => v !== null && v !== undefined
      ).length;

      if (numUsageValuesEffectivelySet > 0 && numUsageValuesEffectivelySet < 3) {
        throw new Error(
          'Para previsão por uso, todos os campos (limit, current, unit) devem ser fornecidos juntos, ou todos devem ser nulos para limpar a previsão por uso.'
        );
      } else if (
        numUsageValuesEffectivelySet === 0 &&
        ('next_due_usage_limit' in updateDataFromService ||
          'next_due_usage_current' in updateDataFromService ||
          'usage_unit' in updateDataFromService)
      ) {
        finalSqlPayload.next_due_usage_limit = null;
        finalSqlPayload.next_due_usage_current = null;
        finalSqlPayload.usage_unit = null;
      }
    }

    const fieldsForUpdateQuery: any = {};
    let hasActualChanges = false;

    for (const key of UPDATABLE_MAINTENANCE_KEYS) {
      const isPredictionField = [
        'next_due_date',
        'next_due_usage_limit',
        'next_due_usage_current',
        'usage_unit',
      ].includes(key);

      if (key in finalSqlPayload) {
        if (finalSqlPayload[key] !== undefined) {
          if (isPredictionField || finalSqlPayload[key] !== existingMaintenanceData[key]) {
            fieldsForUpdateQuery[key] = finalSqlPayload[key];
            if (finalSqlPayload[key] !== existingMaintenanceData[key]) {
              hasActualChanges = true;
            } else if (
              isPredictionField &&
              finalSqlPayload[key] === null &&
              existingMaintenanceData[key] !== null
            ) {
              hasActualChanges = true;
            } else if (
              isPredictionField &&
              finalSqlPayload[key] !== null &&
              existingMaintenanceData[key] === null
            ) {
              hasActualChanges = true;
            }
          }
        }
      }
    }

    if (!hasActualChanges && Object.keys(fieldsForUpdateQuery).length > 0) {
      const changedPredictionType =
        ('next_due_date' in fieldsForUpdateQuery &&
          existingMaintenanceData.next_due_usage_limit !== null) ||
        (('next_due_usage_limit' in fieldsForUpdateQuery ||
          'next_due_usage_current' in fieldsForUpdateQuery ||
          'usage_unit' in fieldsForUpdateQuery) &&
          existingMaintenanceData.next_due_date !== null);
      if (!changedPredictionType) {
        hasActualChanges = false;
      } else {
        hasActualChanges = true;
      }
    }

    const keysToQuery = Object.keys(fieldsForUpdateQuery);

    if (keysToQuery.length === 0 || !hasActualChanges) {
      console.warn(
        'Nenhum campo efetivamente alterado para a manutenção ID:',
        maintenanceId,
        ' Retornando dados existentes.'
      );
      return [existingMaintenanceData];
    }

    const setClauses = keysToQuery.map((k, i) => `"${k}" = $${i + 1}`);
    const values = keysToQuery.map(k_string => fieldsForUpdateQuery[k_string]);

    const updateQuery = `
      UPDATE maintenance
      SET ${setClauses.join(', ')}
      WHERE id = $${keysToQuery.length + 1} AND asset_id = $${keysToQuery.length + 2}
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [...values, maintenanceId, assetId]);

    if (result.rowCount === 0) {
      throw new Error(
        'Manutenção não encontrada durante o UPDATE ou nenhuma linha foi efetivamente atualizada (rowCount 0).'
      );
    }
    return result.rows;
  } catch (error: any) {
    console.error('Erro no updateMaintenanceSql:', error.message, error.stack);
    throw error;
  }
};

const removeMaintenanceSql = async (userId: number, assetId: string, maintenanceId: string) => {
  try {
    const query = `
      DELETE FROM maintenance m
      USING asset a
      WHERE m.asset_id = a.id
      AND m.asset_id = $1
      AND a.user_id = $2
      AND m.id = $3
      RETURNING m.*;
    `;
    const result = await pool.query(query, [assetId, userId, maintenanceId]);

    if (result.rowCount === 0) {
      throw new Error('Ativo não encontrado.');
    }

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

module.exports = {
  showOneMaintenanceSql,
  showAllMaintenanceSql,
  createMaintenanceSql,
  updateMaintenanceSql,
  removeMaintenanceSql,
};
