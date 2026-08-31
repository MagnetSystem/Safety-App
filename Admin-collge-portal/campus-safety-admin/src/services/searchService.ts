import api from './api';

export interface SearchResult {
  students: { id: string; name: string; studentNumber: string | null; college: { id: string; name: string }; user: { email: string } }[];
  complaints: { id: string; code: string; status: string; type: string; category: string; collegeId: string }[];
  colleges: { id: string; name: string; code: string }[];
}

export const search = async (q: string) => {
  const { data } = await api.get<SearchResult>('/search', { params: { q } });
  return data;
};
