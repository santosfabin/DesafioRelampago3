const loginRepository = require('../repository/loginRepository');
const { comparePassword } = require('../utils/comparePassword');
import { generateToken } from '../utils/generateToken';

const authenticateUser = async (email: string, password: string) => {
  try {
    const userData = await loginRepository.getUserData(email);

    if (!userData) {
      return {
        errorCode: 404,
        errorMessage: 'E-mail não cadastrado',
      };
    }

    const isPasswordValid = await comparePassword(password, userData.password);

    if (!isPasswordValid) {
      return { errorCode: 404, errorMessage: 'Senha inválida' };
    }

    const user = userData.id;

    const sessionToken = generateToken(userData.id);

    return { user, sessionToken };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
};
