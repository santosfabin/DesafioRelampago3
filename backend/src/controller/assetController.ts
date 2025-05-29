import { Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/getUserIdFromToken';
const validator = require('validator');

const assetService = require('../services/assetService');

const showAllAssets = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const id = getUserIdFromToken(token);
    if (!id) return res.status(401).json({ error: 'Token inválido' });

    const result = await assetService.showAllAssets(id);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

const showOneAsset = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const id = getUserIdFromToken(token);
    if (!id) return res.status(401).json({ error: 'Token inválido' });

    const item = req.params.id;

    if (!validator.isUUID(item)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const result = await assetService.showOneAssets(id, item);
    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

const createAsset = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const id = getUserIdFromToken(token);
    if (!id) return res.status(401).json({ error: 'Token inválido' });

    let { name, description = '', importance = '1' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome inválido' });
    }

    if (isNaN(Number(importance))) {
      importance = '1';
    } else {
      let imp = Number(importance);
      if (imp < 1) imp = 1;
      if (imp > 5) imp = 5;
      importance = imp.toString();
    }

    const result = await assetService.createAsset(id, { name, description, importance });

    if (result.error) {
      return res.status(400).json({ error: result });
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

const updateAsset = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const id = getUserIdFromToken(token);
    if (!id) return res.status(401).json({ error: 'Token inválido' });

    const itemId = req.params.id;
    if (!validator.isUUID(itemId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const updateContent: { name?: string; description?: string; importance?: string } = req.body;

    // Remove campos que estão como string vazia ou importance inválido
    for (const key in updateContent) {
      if (
        updateContent[key as keyof typeof updateContent] === '' ||
        (key === 'importance' && isNaN(Number(updateContent.importance)))
      ) {
        delete updateContent[key as keyof typeof updateContent];
      } else if (key === 'importance') {
        let importanceValue = Number(updateContent.importance);
        if (importanceValue < 1) importanceValue = 1;
        if (importanceValue > 5) importanceValue = 5;
        updateContent.importance = importanceValue.toString();
      }
    }

    if (Object.keys(updateContent).length === 0) {
      return res.status(400).json({ error: 'Não houve alteração' });
    }

    const result = await assetService.updateAsset(id, itemId, updateContent);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

const removeAsset = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_id;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    const id = getUserIdFromToken(token);
    if (!id) return res.status(401).json({ error: 'Token inválido' });

    const itemId = req.params.id;

    if (!validator.isUUID(itemId)) {
      return res.status(400).json({ error: 'ID inválido (esperado UUID)' });
    }

    const result = await assetService.removeAsset(id, itemId);

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

module.exports = { showAllAssets, showOneAsset, createAsset, updateAsset, removeAsset };
