import api from './api';

export interface SearchResult {
  students: { id: string; name: string; studentNumber: string | null; college: { id: string; name: string }; user: { email: string } }[];
  complaints: { id: string; code: string; status: string; type: string; category: string; collegeId: string }[];
  colleges: { id: string; name: string; code: string }[];
}

export const search = async (q: string) => {
  const { data } = await api.get<SearchResult & {
    members?: { id: string; name: string; memberNumber: string | null; organization?: { id: string; name: string }; user: { email: string } }[];
    incidents?: { id: string; code: string; status: string; type: string; category: string; organizationId: string | null }[];
    organizations?: { id: string; name: string; code: string }[];
  }>('/search', { params: { q } });

  const members = data.members ?? data.students ?? [];
  const incidents = data.incidents ?? data.complaints ?? [];
  const organizations = data.organizations ?? data.colleges ?? [];

  return {
    students: members.map((m) => ({
      id: m.id,
      name: m.name,
      studentNumber: ('memberNumber' in m ? m.memberNumber : (m as { studentNumber?: string | null }).studentNumber) ?? null,
      college: ('organization' in m && m.organization) ? m.organization : (m as { college?: { id: string; name: string } }).college ?? { id: '', name: '' },
      user: m.user,
    })),
    complaints: incidents.map((c) => ({
      id: c.id,
      code: c.code,
      status: c.status,
      type: c.type,
      category: c.category,
      collegeId: ('organizationId' in c ? c.organizationId : (c as { collegeId?: string }).collegeId) ?? '',
    })),
    colleges: organizations,
  } satisfies SearchResult;
};
