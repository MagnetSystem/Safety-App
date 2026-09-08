import api from './api';

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
  _count?: { members: number; staff: number; incidents: number };
}

export interface IndustryCatalog {
  id: string;
  label: string;
  blurb: string;
  features: {
    guardianAlerts: boolean;
    bulkSignup: boolean;
    reporting: boolean;
    departmentsEnabled: boolean;
  };
  categories: { key: string; label: string }[];
  defaultDepartments: { name: string; slug: string; description: string }[];
  orgSetupFields: { key: string; label: string; type: string; group: string; required?: boolean; options?: string[]; help?: string }[];
  memberFields: { key: string; label: string; type: string; group: string; required?: boolean; options?: string[]; help?: string }[];
}

export const getIndustryCatalog = async () => {
  const { data } = await api.get<IndustryCatalog[]>('/catalog/industries');
  return data;
};

export const getDepartments = async () => {
  const { data } = await api.get<Department[]>('/departments');
  return data;
};

export const createDepartment = async (input: { name: string; description?: string; isDefault?: boolean }) => {
  const { data } = await api.post<Department>('/departments', input);
  return data;
};

export const updateDepartment = async (id: string, input: Partial<{ name: string; description: string; isDefault: boolean }>) => {
  const { data } = await api.patch<Department>(`/departments/${id}`, input);
  return data;
};

export const deleteDepartment = async (id: string) => {
  const { data } = await api.delete(`/departments/${id}`);
  return data;
};

export const assignDepartmentStaff = async (departmentId: string, orgStaffId: string) => {
  const { data } = await api.post(`/departments/${departmentId}/staff`, { orgStaffId });
  return data;
};

export const removeDepartmentStaff = async (departmentId: string, orgStaffId: string) => {
  const { data } = await api.delete(`/departments/${departmentId}/staff/${orgStaffId}`);
  return data;
};
