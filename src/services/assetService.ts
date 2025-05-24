const assetRepository = require('../repository/assetRepository');

const showAllAssets = async (id: number) => {
  try {
    const result = await assetRepository.showAllAssetsSql(id);

    if ('error' in result) {
      throw new Error(result.message);
    }

    return { assets: result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao buscar usuários.');
    } else {
      throw new Error('Erro desconhecido ao buscar usuários.');
    }
  }
};

const showOneAssets = async (id: number, item: string) => {
  try {
    const result = await assetRepository.showOneAssetsSql(id, item);

    if ('error' in result) {
      throw new Error(result.message);
    }

    return { asset: result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao buscar usuários.');
    } else {
      throw new Error('Erro desconhecido ao buscar usuários.');
    }
  }
};

const createAsset = async (
  id: number,
  asset: { name: string; description: string; importance: string }
) => {
  const result = await assetRepository.createAssetSql(id, asset);

  if (!result) {
    throw new Error(`Erro ao criar o ativo no banco de dados.`);
  }

  return { asset: result };
};

const updateAsset = async (
  id: number,
  itemId: string,
  asset: { name?: string; description?: string; importance?: string }
) => {
  try {
    const result = await assetRepository.updateAssetSql(id, itemId, asset);

    if (!result) {
      throw new Error(`Erro ao criar o ativo no banco de dados.`);
    }

    return { asset: result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao remover ativo.');
    } else {
      throw new Error('Erro desconhecido ao remover ativo.');
    }
  }
};

const removeAsset = async (id: number, itemId: string) => {
  try {
    const result = await assetRepository.removeAssetrSql(id, itemId);
    if ('error' in result) {
      throw new Error(result.message);
    }

    return { message: `Asset removed` };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao remover ativo.');
    } else {
      throw new Error('Erro desconhecido ao remover ativo.');
    }
  }
};

module.exports = { showAllAssets, showOneAssets, createAsset, updateAsset, removeAsset };
