import pool from '../database/connection';

const showAllAssetsSql = async (id: number) => {
  try {
    const query = `SELECT * FROM asset where user_id = $1 `;
    const result = await pool.query(query, [id]);

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

const showOneAssetsSql = async (id: number, item: string) => {
  try {
    const query = `SELECT * FROM asset where user_id = $1 and id = $2`;
    const result = await pool.query(query, [id, item]);

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

const createAssetSql = async (
  userId: number,
  asset: { name: string; description: string; importance: string }
) => {
  try {
    const query = `INSERT INTO asset (user_id, name, description, importance) VALUES ($1, $2, $3, $4) RETURNING *`;

    const values = [userId, asset.name, asset.description, asset.importance];
    const result = await pool.query(query, values);

    return result.rows;
  } catch (e: any) {
    console.error('Console.erro', e);

    throw new Error(e.message);
  }
};

const updateAssetSql = async (
  userId: number,
  itemId: string,
  asset: { name?: string; description?: string; importance?: string }
) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(asset)) {
      updates.push(`${key} = $${paramIndex++}`);
      values.push(key === 'importance' ? Number(value) : value);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(userId, itemId);

    const query = `
      UPDATE asset
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (e: any) {
    console.error('Erro ao atualizar asset:', e);
    throw new Error(e.message);
  }
};

const removeAssetrSql = async (id: number, itemId: string) => {
  try {
    const query = `DELETE FROM asset WHERE user_id = $1 and id = $2 RETURNING *`;

    const result = await pool.query(query, [id, itemId]);

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
  showAllAssetsSql,
  showOneAssetsSql,
  createAssetSql,
  updateAssetSql,
  removeAssetrSql,
};
