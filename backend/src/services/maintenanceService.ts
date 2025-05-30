import { IMaintenance } from '../interfaces/maintenance';
import { IMaintenanceUpdate, UsageUnit } from '../interfaces/maintenanceUpdate';

const maintenanceRepository = require('../repository/maintenanceRepository');

const showOneMaintenance = async (userId: number, assetId: string, maintenanceId: string) => {
  try {
    const result = await maintenanceRepository.showOneMaintenanceSql(
      userId,
      assetId,
      maintenanceId
    );

    if ('error' in result) {
      throw new Error(result.message);
    }

    if (result.length > 0) {
      return { maintenance: result };
    } else {
      return { maintenance: [] };
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao buscar usuários.');
    } else {
      throw new Error('Erro desconhecido ao buscar usuários.');
    }
  }
};

const showAllMaintenance = async (userId: number, assetId: string) => {
  try {
    const result = await maintenanceRepository.showAllMaintenanceSql(userId, assetId);

    if ('error' in result) {
      throw new Error(result.message);
    }

    if (result.length > 0) {
      return { maintenance: result };
    } else {
      return { maintenance: [] };
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao buscar usuários.');
    } else {
      throw new Error('Erro desconhecido ao buscar usuários.');
    }
  }
};

const createMaintenance = async (
  maintenanceData: IMaintenance & { user_id: string; asset_id: string }
) => {
  const result = await maintenanceRepository.createMaintenanceSql(maintenanceData);

  return { mainenance: result };
};

// Função para limpar dados inválidos, remover "" e null indevidos, etc
function cleanUpdateData(updateData: Partial<IMaintenanceUpdate>): Partial<IMaintenanceUpdate> {
  const usageUnits: UsageUnit[] = ['km', 'horas', 'ciclos'];
  const validStatuses = ['ativa', 'realizada', 'adiada', 'cancelada'];

  const cleaned: Partial<IMaintenanceUpdate> = {};

  // Corrige descrição
  if ('description' in updateData) {
    if (updateData.description === null) {
      delete cleaned.description;
    } else if (typeof updateData.description === 'string') {
      const desc = updateData.description.trim();
      if (desc !== '') {
        cleaned.description = desc;
      }
    }
  }

  // Corrige status
  if ('status' in updateData && validStatuses.includes(updateData.status!)) {
    cleaned.status = updateData.status!;
  }

  // Corrige service
  if ('service' in updateData && typeof updateData.service === 'string') {
    const svc = updateData.service.trim();
    if (svc !== '') {
      cleaned.service = svc;
    }
  }

  // -------------------------
  // PREVISÃO POR DATA
  // -------------------------
  const hasValidDate =
    typeof updateData.next_due_date === 'string' && updateData.next_due_date.trim() !== '';

  if (hasValidDate) {
    cleaned.next_due_date = updateData.next_due_date!.trim();
    // remove todos os de uso
    delete cleaned.next_due_usage_limit;
    delete cleaned.next_due_usage_current;
    delete cleaned.usage_unit;
    return cleaned;
  }

  // -------------------------
  // PREVISÃO POR USO
  // -------------------------
  const hasUsageLimit =
    typeof updateData.next_due_usage_limit === 'number' && updateData.next_due_usage_limit >= 0;

  const hasUsageCurrent =
    typeof updateData.next_due_usage_current === 'number' && updateData.next_due_usage_current >= 0;

  const hasUsageUnit =
    typeof updateData.usage_unit === 'string' && usageUnits.includes(updateData.usage_unit);

  // Se algum dos 3 foi enviado corretamente, limpa os outros e aceita só os válidos
  if (hasUsageLimit || hasUsageCurrent || hasUsageUnit) {
    delete cleaned.next_due_date; // limpa o grupo da data

    if (hasUsageLimit) {
      cleaned.next_due_usage_limit = updateData.next_due_usage_limit!;
    } else {
      delete cleaned.next_due_usage_limit;
    }

    if (hasUsageCurrent) {
      cleaned.next_due_usage_current = updateData.next_due_usage_current!;
    } else {
      delete cleaned.next_due_usage_current;
    }

    if (hasUsageUnit) {
      cleaned.usage_unit = updateData.usage_unit as UsageUnit;
    } else {
      delete cleaned.usage_unit;
    }

    return cleaned;
  }

  // -------------------------
  // Se chegou aqui: previsão inválida, limpa tudo
  // -------------------------
  delete cleaned.next_due_date;
  delete cleaned.next_due_usage_limit;
  delete cleaned.next_due_usage_current;
  delete cleaned.usage_unit;

  return cleaned;
}

const updateMaintenance = async (
  userId: number,
  assetId: string,
  maintenanceId: string,
  updateData: Partial<IMaintenanceUpdate>
) => {
  try {
    const cleanedUpdateData = cleanUpdateData(updateData);

    if (Object.keys(cleanedUpdateData).length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    const result = await maintenanceRepository.updateMaintenanceSql(
      userId,
      assetId,
      maintenanceId,
      cleanedUpdateData
    );

    if ('error' in result) {
      throw new Error(result.message);
    }

    if (result.length > 0) {
      return { maintenance: result };
    } else {
      throw new Error('Maintenance not updated');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao atualizar manutenção.');
    } else {
      throw new Error('Erro desconhecido ao atualizar manutenção.');
    }
  }
};

const removeMaintenance = async (userId: number, assetId: string, maintenanceId: string) => {
  try {
    const result = await maintenanceRepository.removeMaintenanceSql(userId, assetId, maintenanceId);

    if ('error' in result) {
      throw new Error(result.message);
    }

    return { message: `Maintenance removed` };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao buscar usuários.');
    } else {
      throw new Error('Erro desconhecido ao buscar usuários.');
    }
  }
};

module.exports = {
  showOneMaintenance,
  showAllMaintenance,
  createMaintenance,
  updateMaintenance,
  removeMaintenance,
};
