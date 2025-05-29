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
    // 1. Verifica se o asset pertence ao user
    const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [
      maintenanceData.asset_id,
      maintenanceData.user_id,
    ]);

    if (verifyResult.rowCount === 0) {
      throw new Error('Ativo não encontrado');
    }

    // 2. Se for dono, insere normalmente
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

const updateMaintenanceSql = async (
  userId: number,
  assetId: string,
  maintenanceId: string,
  updateData: Partial<IMaintenanceUpdate>
) => {
  try {
    // 1. Verifica se o ativo pertence ao usuário
    const verifyQuery = `SELECT 1 FROM asset WHERE id = $1 AND user_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [assetId, userId]);
    if (verifyResult.rowCount === 0) {
      throw new Error('Ativo não encontrado ou não pertence ao usuário');
    }

    // 2. Campos de uso para controle
    const usageFields: (keyof IMaintenanceUpdate)[] = [
      'next_due_usage_limit',
      'next_due_usage_current',
      'usage_unit',
    ];

    // 3. Busca os dados atuais para mesclar
    const existingQuery = `
      SELECT next_due_date, next_due_usage_limit, next_due_usage_current, usage_unit 
      FROM maintenance 
      WHERE id = $1 AND asset_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [maintenanceId, assetId]);
    if (existingResult.rowCount === 0) {
      throw new Error('Manutenção não encontrada para leitura dos dados existentes');
    }
    const existing = existingResult.rows[0] as IMaintenanceUpdate;

    // 4. Começa mesclando dados atuais com os novos
    const dataToUpdate: Partial<Record<keyof IMaintenanceUpdate, string | number | null>> = {
      ...existing,
      ...updateData,
    };

    const sentDate = updateData.next_due_date;
    const sentUsageFields = usageFields.some(f => f in updateData);

    // 5. Regras para exclusividade entre data e uso
    if (sentDate !== undefined && sentDate !== null) {
      // Se enviou previsão por data (não nulo)
      // Mantém next_due_date, zera todos os campos de uso
      for (const f of usageFields) {
        dataToUpdate[f] = null;
      }
    } else if (sentUsageFields) {
      // Se enviou algum campo de uso
      // Zera a data
      dataToUpdate.next_due_date = null;

      // Para cada campo de uso:
      for (const f of usageFields) {
        if (updateData[f] === undefined) {
          // Se campo não veio no update, mantém o valor antigo (existente)
          dataToUpdate[f] = existing[f] ?? null;
        } else {
          // Se veio, mantém o valor enviado (já mesclado)
          // dataToUpdate[f] já está certo
        }
      }
    }
    // Se não enviou nem data nem uso, mantém o que veio (já mesclado)

    // 6. Remove chaves undefined (não atualiza campos não passados)
    for (const k in dataToUpdate) {
      if (dataToUpdate[k as keyof IMaintenanceUpdate] === undefined) {
        delete dataToUpdate[k as keyof IMaintenanceUpdate];
      }
    }

    // 7. Garante que existe algo para atualizar
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    // 8. Monta query UPDATE dinâmico
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map(key => (dataToUpdate as any)[key]);

    const updateQuery = `
      UPDATE maintenance
      SET ${setClauses.join(', ')}
      WHERE id = $${keys.length + 1} AND asset_id = $${keys.length + 2}
      RETURNING *;
    `;

    // 9. Executa update
    const result = await pool.query(updateQuery, [...values, maintenanceId, assetId]);

    if (result.rowCount === 0) {
      throw new Error('Manutenção não encontrada ou não atualizada');
    }

    return result.rows;
  } catch (error: any) {
    throw new Error(error.message);
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
