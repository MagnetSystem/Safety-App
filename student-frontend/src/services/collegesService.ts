import api from './api';

export interface PublicCollege {
  id: string;
  name: string;
  code: string;
  state: string | null;
  district: string | null;
}

export const getPublicColleges = async () => {
  const { data } = await api.get<PublicCollege[]>('/colleges/public');
  return data;
};
