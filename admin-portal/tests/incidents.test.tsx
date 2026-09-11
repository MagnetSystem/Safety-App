import { vi, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportDetail from '../src/pages/reports/ReportDetail';
import { getReportById, getEvidence, getMessages, updateReportStatus, assignCommittee } from '../src/services/incidentsService';
import { getStaff } from '../src/services/staffService';
vi.mock('../src/context/auth', () => ({ useAuth: () => ({ role: 'owner' }) }));
vi.mock('../src/services/incidentsService', () => ({ getReportById: vi.fn(), getEvidence: vi.fn(), getMessages: vi.fn(), updateReportStatus: vi.fn(), assignCommittee: vi.fn(), postMessage: vi.fn() }));
vi.mock('../src/services/staffService', () => ({ getStaff: vi.fn() }));
const report = { id: 'case-1', code: 'SAFE-01', status: 'SUBMITTED', type: 'NORMAL', priority: 'HIGH', category: 'OTHER', description: 'Please investigate', collegeId: 'org', createdAt: '2026-09-01', assignedCommitteeUserIds: [] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getReportById).mockResolvedValue(report as Awaited<ReturnType<typeof getReportById>>);
  vi.mocked(getEvidence).mockResolvedValue([]);
  vi.mocked(getMessages).mockResolvedValue([]);
  vi.mocked(getStaff).mockResolvedValue({ items: [{ id: 'staff', name: 'Case worker', orgRole: 'STAFF', user: { id: 'worker', isActive: true, email: 'worker@example.test' } }], total: 1, page: 1, pageSize: 100 } as Awaited<ReturnType<typeof getStaff>>);
});
async function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/reports/case-1']}><Routes><Route path="/reports/:id" element={<ReportDetail />} /></Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByRole('heading', { name: 'SAFE-01' });
}
it('shows a retry for message failures instead of an empty conversation', async () => {
  vi.mocked(getMessages).mockRejectedValue(new Error('offline'));
  await mount();
  expect(await screen.findByText('Unable to load messages.')).toBeInTheDocument();
  expect(screen.queryByText('No messages yet.')).not.toBeInTheDocument();
});
it('requires explicit confirmation and accepts exactly ten resolution characters', async () => {
  vi.mocked(updateReportStatus).mockResolvedValue({ ...report, status: 'RESOLVED' } as Awaited<ReturnType<typeof getReportById>>);
  await mount();
  await userEvent.selectOptions(screen.getByLabelText('Change Status'), 'RESOLVED');
  expect(updateReportStatus).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText('Resolution report'), '1234567890');
  await userEvent.click(screen.getByText('Confirm Closure'));
  await waitFor(() => expect(updateReportStatus).toHaveBeenCalledWith('case-1', 'RESOLVED', undefined, '1234567890'));
});
it('preserves the case and draft when resolution fails', async () => {
  vi.mocked(updateReportStatus).mockRejectedValue(new Error('offline'));
  await mount();
  await userEvent.selectOptions(screen.getByLabelText('Change Status'), 'CLOSED');
  await userEvent.type(screen.getByLabelText('Resolution report'), 'Investigation complete');
  await userEvent.click(screen.getByText('Confirm Closure'));
  await waitFor(() => expect(screen.getByLabelText('Resolution report')).toHaveValue('Investigation complete'));
  expect(screen.getByRole('heading', { name: 'SAFE-01' })).toBeInTheDocument();
});
it('assigns a case using the existing user-id contract', async () => {
  vi.mocked(assignCommittee).mockResolvedValue({ ...report, assignedTo: { id: 'worker', email: 'worker@example.test' } } as Awaited<ReturnType<typeof getReportById>>);
  await mount();
  await userEvent.selectOptions(screen.getByLabelText('Assign case'), 'worker');
  await waitFor(() => expect(assignCommittee).toHaveBeenCalledWith('case-1', 'worker'));
});
