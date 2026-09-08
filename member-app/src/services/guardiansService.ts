import api from './api';

export const inviteGuardian = async () => {
  const { data } = await api.post<{ id: string; code: string; expiresAt: string; status: string }>(
    '/guardians/invite',
  );
  return data;
};

export const listMyGuardians = async () => {
  const { data } = await api.get<
    { id: string; status: string; createdAt: string; acceptedAt: string | null; guardian: { id: string; email: string } | null }[]
  >('/guardians/mine');
  return data;
};

export const listWards = async () => {
  const { data } = await api.get<{ id: string; acceptedAt: string | null; member: { id: string; name: string } }[]>(
    '/guardians/wards',
  );
  return data;
};

export const acceptGuardianCode = async (code: string) => {
  const { data } = await api.post('/guardians/accept', { code });
  return data;
};

export const revokeGuardian = async (id: string) => {
  const { data } = await api.delete(`/guardians/${id}`);
  return data;
};
