import api from './api';
import type { IndustryCatalog } from './departmentsService';

export interface OrganizationTypeRecord extends IndustryCatalog {
  dbId: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  orgCount: number;
}

export type UpsertOrganizationType = {
  slug?: string;
  label: string;
  blurb?: string;
  isActive?: boolean;
  features: IndustryCatalog['features'];
  categories: IndustryCatalog['categories'];
  defaultDepartments: IndustryCatalog['defaultDepartments'];
  orgSetupFields: IndustryCatalog['orgSetupFields'];
  memberFields: IndustryCatalog['memberFields'];
};

export const listOrganizationTypes = async () => {
  const { data } = await api.get<OrganizationTypeRecord[]>('/organization-types');
  return data;
};

export const createOrganizationType = async (input: UpsertOrganizationType) => {
  const { data } = await api.post<IndustryCatalog>('/organization-types', input);
  return data;
};

export const updateOrganizationType = async (id: string, input: UpsertOrganizationType) => {
  const { data } = await api.patch<IndustryCatalog>(`/organization-types/${id}`, input);
  return data;
};

export const setOrganizationTypeActive = async (id: string, isActive: boolean) => {
  const { data } = await api.patch(`/organization-types/${id}/active`, { isActive });
  return data;
};

export const duplicateOrganizationType = async (id: string, label: string) => {
  const { data } = await api.post(`/organization-types/${id}/duplicate`, { label });
  return data;
};

export const onboardClient = async (input: {
  name: string;
  code?: string;
  industry: string;
  state?: string;
  district?: string;
  principal?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
}) => {
  const { data } = await api.post<{
    organization: { id: string; name: string; code: string; joinCode: string; industry: string };
    owner: { email: string; name: string };
  }>('/organizations/onboard', input);
  return data;
};
