import { Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/getUserIdFromToken';
import type { IMaintenance } from '../interfaces/maintenance';

const maintenanceService = require('../services/maintenanceService');
const validator = require('validator');

const VALID_STATUSES = ['ativa', 'realizada', 'adiada', 'cancelada'];
const VALID_USAGE_UNITS = ['km', 'horas', 'ciclos'];

const showOneMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    const userId = getUserIdFromToken(token);
    if (!userId) return res.status(401).json({ error: 'Token inválido' });
    const assetId = req.params.id;
    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }
    const maintenanceId = req.params.maintenanceId;
    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID da manutenção inválido (esperado UUID)' });
    }
    const result = await maintenanceService.showOneMaintenance(userId, assetId, maintenanceId);
    if (result.error || !result.maintenance || result.maintenance.length === 0) {
      return res.status(404).json({ error: result.error || 'Manutenção não encontrada' });
    }

    return res.status(200).json({ maintenance: result.maintenance[0] });
  } catch (e: any) {
    console.error('Error in showOneMaintenance controller:', e.message, e.stack);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar detalhes da manutenção.', details: e.message });
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
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }
    const result = await maintenanceService.showAllMaintenance(userId, assetId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (e: any) {
    console.error('Error in showAllMaintenance controller:', e.message, e.stack);
    return res.status(500).json({ error: 'Erro ao listar manutenções.', details: e.message });
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
      status,
      next_due_date,
      next_due_usage_limit,
      next_due_usage_current,
      usage_unit,
    }: IMaintenance = req.body;

    if (!service || service.trim() === '') {
      return res.status(400).json({ error: `Campo 'service' é obrigatório` });
    }

    const finalStatus = status && VALID_STATUSES.includes(status) ? status : 'ativa';

    let hasDue = false;
    const maintenanceData: Partial<IMaintenance> & {
      user_id: string;
      asset_id: string;
      service: string;
      status: string;
    } = {
      user_id: userId,
      asset_id: assetId,
      service: service.trim(),
      description: description,
      performed_at: performed_at,
      status: finalStatus,

      next_due_date: undefined,
      next_due_usage_limit: undefined,
      next_due_usage_current: undefined,
      usage_unit: undefined,
    };

    if (next_due_date) {
      hasDue = true;
      maintenanceData.next_due_date = next_due_date;
      maintenanceData.next_due_usage_limit = null;
      maintenanceData.next_due_usage_current = null;
      maintenanceData.usage_unit = null;
    } else if (
      next_due_usage_limit !== undefined &&
      next_due_usage_limit !== null &&
      next_due_usage_current !== undefined &&
      next_due_usage_current !== null &&
      usage_unit &&
      VALID_USAGE_UNITS.includes(usage_unit)
    ) {
      hasDue = true;
      maintenanceData.next_due_usage_limit = Number(next_due_usage_limit);
      maintenanceData.next_due_usage_current = Number(next_due_usage_current);
      maintenanceData.usage_unit = usage_unit;
      maintenanceData.next_due_date = null;
    }

    if (finalStatus === 'ativa' && !hasDue) {
      return res.status(400).json({
        error:
          'Para status "ativa", é necessário informar previsão por data ou por uso completo (limite, atual, unidade)',
      });
    }

    const created = await maintenanceService.createMaintenance(
      maintenanceData as IMaintenance & { user_id: string; asset_id: string }
    );

    if (created.error || !created.mainenance || created.mainenance.length === 0) {
      return res.status(500).json({ error: created.error || 'Falha ao criar manutenção' });
    }

    return res.status(201).json({ maintenance: created.mainenance[0] });
  } catch (e: any) {
    console.error('Error in createMaintenance controller:', e.message, e.stack);
    return res.status(500).json({ error: 'Erro interno ao criar manutenção.', details: e.message });
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

    if (!validator.isUUID(assetId))
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    if (!validator.isUUID(maintenanceId))
      return res.status(400).json({ error: 'ID da manutenção inválido (esperado UUID)' });

    const {
      service,
      description,
      performed_at,
      next_due_date,
      next_due_usage_limit,
      next_due_usage_current,
      usage_unit,
      status,
    }: Partial<IMaintenance> = req.body;

    const fieldsToUpdate: Partial<IMaintenance> = {};

    if ('service' in req.body) {
      if (typeof service === 'string' && service.trim() !== '') {
        fieldsToUpdate.service = service.trim();
      } else if (service === null || service === '') {
        return res.status(400).json({ error: 'Campo "service" não pode ser vazio.' });
      }
    }
    if ('description' in req.body) fieldsToUpdate.description = description;
    if ('performed_at' in req.body) fieldsToUpdate.performed_at = performed_at;

    if ('status' in req.body) {
      if (status && VALID_STATUSES.includes(status)) {
        fieldsToUpdate.status = status;
      } else if (status) {
        return res.status(400).json({
          error: `Status inválido: ${status}. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
        });
      }
    }

    if ('next_due_date' in req.body) fieldsToUpdate.next_due_date = next_due_date;

    if ('next_due_usage_limit' in req.body) {
      fieldsToUpdate.next_due_usage_limit =
        next_due_usage_limit === null || next_due_usage_limit === undefined
          ? null
          : Number(next_due_usage_limit);
    }
    if ('next_due_usage_current' in req.body) {
      fieldsToUpdate.next_due_usage_current =
        next_due_usage_current === null || next_due_usage_current === undefined
          ? null
          : Number(next_due_usage_current);
    }
    if ('usage_unit' in req.body) {
      if (usage_unit && !VALID_USAGE_UNITS.includes(usage_unit)) {
        return res.status(400).json({
          error: `Unidade de uso inválida: ${usage_unit}. Valores permitidos: ${VALID_USAGE_UNITS.join(
            ', '
          )}`,
        });
      }
      fieldsToUpdate.usage_unit = usage_unit;
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido foi enviado para atualização' });
    }

    const result = await maintenanceService.updateMaintenance(
      userId,
      assetId,
      maintenanceId,
      fieldsToUpdate
    );

    if (result.error || !result.maintenance || result.maintenance.length === 0) {
      return res.status(400).json({
        error: result.error || 'Falha ao atualizar manutenção ou manutenção não encontrada.',
      });
    }

    return res.status(200).json({ maintenance: result.maintenance[0] });
  } catch (e: any) {
    console.error('Error in updateMaintenance controller:', e.message, e.stack);
    return res
      .status(500)
      .json({ error: 'Erro interno do servidor ao atualizar manutenção.', details: e.message });
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
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }
    const maintenanceId = req.params.maintenanceId;
    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID da manutenção inválido (esperado UUID)' });
    }

    const result = await maintenanceService.removeMaintenance(userId, assetId, maintenanceId);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('Error in removeMaintenance controller:', e.message, e.stack);
    return res.status(500).json({ error: 'Erro ao remover manutenção.', details: e.message });
  }
};

module.exports = {
  showOneMaintenance,
  showAllMaintenance,
  createMaintenance,
  updateMaintenance,
  removeMaintenance,
};
