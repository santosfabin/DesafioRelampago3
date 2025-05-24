const userRepository = require('../repository/userRepository');
import { hashPassword } from '../utils/hashPassword';
import { IUser } from '../interfaces/user';
import { generateToken } from '../utils/generateToken';

const createUser = async (
  name: string,
  email: string,
  password: string
): Promise<{
  user?: IUser;
  sessionToken?: string;
  error?: string;
  errorCode?: number;
  errorMessage?: string;
}> => {
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new Error(`Todos os campos devem ser texto.`);
  }

  const cleanName = name.replace(/\s/g, '');
  if (!/^[\p{L}0-9\s\-_]+$/u.test(name) || cleanName.length < 4) {
    throw new Error(
      `Nome inválido. Use apenas letras, espaços e números, com pelo menos 4 letras.`
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Email inválido.`);
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
    throw new Error(`Senha inválida. Deve conter pelo menos uma letra, um número e 8 caracteres.`);
  }

  const hashedPassword = await hashPassword(password);

  if (!hashedPassword) {
    throw new Error(`Falha na geração do hash da senha.`);
  }

  const user = await userRepository.createUserSql(name, email, hashedPassword);
  if (!user) {
    throw new Error(`Erro ao criar o usuário no banco de dados.`);
  }

  const userWithoutPassword: IUser = {
    name: user[0].name,
    email: user[0].email,
  };

  const sessionToken = generateToken(user[0].id);

  return { user: userWithoutPassword, sessionToken };
};

const updateUser = async (id: number, updatedFields: any) => {
  try {
    const { name, email, password } = updatedFields;

    // Verifica se ao menos um campo foi enviado
    if (!name && !email && !password) {
      throw new Error('Nenhum campo para atualizar');
    }

    // Validações para o campo name
    if (
      name &&
      (typeof name !== 'string' || name.length < 4 || !/^[\p{L}0-9\s\-_]+$/u.test(name))
    ) {
      throw new Error(
        'Nome inválido. Use apenas letras, espaços e números, com pelo menos 4 letras.'
      );
    }

    // Validações para o campo email
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      throw new Error('Email inválido.');
    }

    // Validações para o campo password
    if (
      password &&
      (typeof password !== 'string' || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))
    ) {
      throw new Error(
        'Senha inválida. Deve conter pelo menos uma letra, um número e 8 caracteres.'
      );
    }

    // Se a senha for fornecida, realiza o hash
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await hashPassword(password);
      if (!hashedPassword) {
        throw new Error('Falha na geração do hash da senha');
      }
    }

    // Atualiza apenas os campos válidos
    const fieldsToUpdate: any = {};
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (password) fieldsToUpdate.password = hashedPassword;

    // Chama o repositório para atualizar o usuário no banco de dados
    const result = await userRepository.updateUserSql(id, fieldsToUpdate);
    
    if ('error' in result) {
      throw new Error(result.message);
    }

    const updatedUser = result[0];

    const userWithoutPassword: IUser = {
      name: updatedUser.name,
      email: updatedUser.email,
    };

    return { user: userWithoutPassword };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('Erro desconhecido ao atualizar usuário.');
    }
  }
};

const removeUser = async (id: number) => {
  try {
    const result = await userRepository.removeUserSql(id);
    if ('error' in result) {
      throw new Error(result.message);
    }

    return { message: `User removed` };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro ao remover usuário.');
    } else {
      throw new Error('Erro desconhecido ao remover usuário.');
    }
  }
};

// const showAllUsers = async () => {
//   try {
//     const result = await userRepository.showAllUsersSql();
//     if ('error' in result) {
//       return { error: result.error };
//     }

//     // Retira a senha de cada usuário, ou seja, não vai enviar
//     const usersWithoutPassword = result.map((user: any) => ({
//       id: user.id,
//       name: user.name,
//       email: user.email,
//     }));

//     return { users: usersWithoutPassword };
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       throw new Error(error.message || 'Erro ao buscar usuários.');
//     } else {
//       throw new Error('Erro desconhecido ao buscar usuários.');
//     }
//   }
// };

// module.exports = { createUser, updateUser, removeUser, showAllUsers };
module.exports = { createUser, updateUser, removeUser };
