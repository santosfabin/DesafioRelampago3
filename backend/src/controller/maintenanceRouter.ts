import { Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/getUserIdFromToken';
import type { IMaintenance } from '../interfaces/maintenance';

const maintenanceService = require('../services/maintenanceService');
const validator = require('validator');

const showOneMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;

    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const maintenanceId = req.params.maintenanceId;

    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const result = await maintenanceService.showOneMaintenance(userId, assetId, maintenanceId);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

const showAllMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;

    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const result = await maintenanceService.showAllMaintenance(userId, assetId);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

export const createMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;
    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }

    const {
      service,
      description,
      performed_at,
      next_due_date,
      next_due_usage_limit,
      next_due_usage_current,
      usage_unit,
    }: IMaintenance = req.body;

    if (!service) {
      return res.status(400).json({ error: `Campo 'service' é obrigatório` });
    }

    let hasDue = false;

    const maintenanceData: IMaintenance & { user_id: string; asset_id: string } = {
      user_id: userId,
      asset_id: assetId,
      service,
      description,
      performed_at,
      status: 'ativa',
    };

    // Prioriza previsão por data, ignora uso se os dois forem enviados
    if (next_due_date) {
      hasDue = true;
      maintenanceData.next_due_date = next_due_date;
    } else if (
      next_due_usage_limit !== undefined &&
      next_due_usage_current !== undefined &&
      ['km', 'horas', 'ciclos'].includes(usage_unit || '')
    ) {
      hasDue = true;
      maintenanceData.next_due_usage_limit = next_due_usage_limit;
      maintenanceData.next_due_usage_current = next_due_usage_current;
      maintenanceData.usage_unit = usage_unit;
    }

    if (!hasDue) {
      return res.status(400).json({ error: 'É necessário informar previsão por data ou por uso' });
    }

    const created = await maintenanceService.createMaintenance(maintenanceData);

    if (created.error) {
      return res.status(500).json({ error: created.error });
    }

    return res.status(200).json(created);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

export const updateMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;
    const maintenanceId = req.params.maintenanceId;

    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }

    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID da manutenção inválido (esperado UUID)' });
    }

    // Pega tudo do body como Partial<IMaintenance>
    const {
      service,
      description,
      next_due_date,
      next_due_usage_limit,
      next_due_usage_current,
      usage_unit,
      status,
    }: Partial<IMaintenance> = req.body;

    // Verifica se veio ao menos um campo para atualizar
    const hasUpdateField = Object.keys(req.body).length > 0;
    if (!hasUpdateField) {
      return res.status(400).json({ error: 'Nenhum campo válido foi enviado para atualização' });
    }

    const updateData: Partial<IMaintenance> = {};

    // Atualiza campos simples se vieram
    if ('service' in req.body) updateData.service = service!;
    if ('description' in req.body) updateData.description = description;
    if (
      'status' in req.body &&
      status &&
      ['ativa', 'realizada', 'adiada', 'cancelada'].includes(status)
    ) {
      updateData.status = status;
    }

    // Regras para previsão por data ou uso
    const hasDateFields = 'next_due_date' in req.body;
    const hasUsageFields =
      'next_due_usage_limit' in req.body ||
      'next_due_usage_current' in req.body ||
      'usage_unit' in req.body;

    // Se enviou algum campo do grupo data, atualiza ele e zera o grupo uso
    if (hasDateFields) {
      updateData.next_due_date = next_due_date!;
      // Para não apagar campos no banco indevidamente, só zera o grupo uso se enviar pelo menos um campo desse grupo explicitamente
      if (hasUsageFields) {
        updateData.next_due_usage_limit = null;
        updateData.next_due_usage_current = null;
        updateData.usage_unit = null;
      }
    }
    // Se enviou algum campo do grupo uso, atualiza só os campos enviados e zera a data
    else if (hasUsageFields) {
      // Só atualiza os que vieram no body
      if ('next_due_usage_limit' in req.body)
        updateData.next_due_usage_limit = next_due_usage_limit!;
      if ('next_due_usage_current' in req.body)
        updateData.next_due_usage_current = next_due_usage_current!;
      if ('usage_unit' in req.body) updateData.usage_unit = usage_unit!;

      // Zera a data só se foi enviado algum campo de uso, para garantir exclusividade
      updateData.next_due_date = null;
    }

    // Chama o serviço para atualizar
    const result = await maintenanceService.updateMaintenance(
      userId,
      assetId,
      maintenanceId,
      updateData
    );

    if ((result as any).error) {
      return res.status(400).json({ error: (result as any).error });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
};

const removeMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;

    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const maintenanceId = req.params.maintenanceId;

    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const result = await maintenanceService.removeMaintenance(userId, assetId, maintenanceId);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

module.exports = {
  showOneMaintenance,
  showAllMaintenance,
  createMaintenance,
  updateMaintenance,
  removeMaintenance,
};
