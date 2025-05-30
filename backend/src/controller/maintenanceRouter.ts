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

// Em backend/src/controller/maintenanceRouter.ts -> updateMaintenance
export const updateMaintenance = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const userId = getUserIdFromToken(token); // Assumindo que retorna number para seu repositório
    if (!userId) return res.status(401).json({ error: 'Token inválido' });

    const assetId = req.params.id;
    const maintenanceId = req.params.maintenanceId;

    if (!validator.isUUID(assetId)) {
      return res.status(400).json({ error: 'ID do ativo inválido (esperado UUID)' });
    }
    if (!validator.isUUID(maintenanceId)) {
      return res.status(400).json({ error: 'ID da manutenção inválido (esperado UUID)' });
    }

    // Pega todos os campos permitidos do body.
    // A interface IMaintenance deve definir todos os campos possíveis.
    const {
      service,
      description,
      performed_at, // Adicionado performed_at
      next_due_date,
      next_due_usage_limit,
      next_due_usage_current,
      usage_unit,
      status,
    }: Partial<IMaintenance> = req.body; // Use a interface IMaintenance do seu backend

    // Cria um objeto apenas com os campos que foram realmente enviados na requisição.
    // O repositório lidará com a lógica de zerar os campos opostos.
    const fieldsToUpdate: Partial<IMaintenance> = {}; // Use IMaintenance ou IMaintenanceUpdate aqui

    if ('service' in req.body) fieldsToUpdate.service = service;
    if ('description' in req.body) fieldsToUpdate.description = description; // Permite null ou string vazia
    if ('performed_at' in req.body) fieldsToUpdate.performed_at = performed_at; // Permite null ou data
    if (
      'status' in req.body &&
      status &&
      ['ativa', 'realizada', 'adiada', 'cancelada'].includes(status)
    ) {
      fieldsToUpdate.status = status;
    }
    if ('next_due_date' in req.body) fieldsToUpdate.next_due_date = next_due_date; // Passa null se enviado como null
    if ('next_due_usage_limit' in req.body)
      fieldsToUpdate.next_due_usage_limit = next_due_usage_limit;
    if ('next_due_usage_current' in req.body)
      fieldsToUpdate.next_due_usage_current = next_due_usage_current;
    if ('usage_unit' in req.body) fieldsToUpdate.usage_unit = usage_unit;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido foi enviado para atualização' });
    }

    // Chama o serviço, que chamará o repositório
    const result = await maintenanceService.updateMaintenance(
      userId, // Certifique-se que o tipo de userId aqui corresponde ao esperado pelo serviço/repositório
      assetId,
      maintenanceId,
      fieldsToUpdate // Passa apenas os campos que vieram na requisição
    );

    // O tipo de 'result' pode ser um array de rows ou um objeto de erro
    if ((result as any).error || (Array.isArray(result) && result.length === 0)) {
      // Se o serviço/repositório retornar um objeto com a propriedade 'error', ou um array vazio (indicando falha)
      const errorMessage =
        (result as any).error || 'Falha ao atualizar manutenção ou manutenção não encontrada.';
      return res.status(400).json({ error: errorMessage });
    }

    // Se o resultado for um array e tiver pelo menos um item, pegue o primeiro
    const updatedMaintenance = Array.isArray(result) ? result[0] : result;

    return res.status(200).json(updatedMaintenance); // Retorna a manutenção atualizada
  } catch (e: any) {
    // Log do erro no servidor para depuração
    console.error('Erro no controller updateMaintenance:', e.message, e.stack);
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
