import apiClient from '../Api/Apiclient';

export const loginApi = async (email, password) => {

    console.log("CHECK",email, password)
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};