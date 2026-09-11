import { vi, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/auth';
import { getMe, loginUser } from '../src/services/authService';
vi.mock('../src/services/authService', () => ({ getMe: vi.fn(), loginUser: vi.fn() }));
const me = { id: 'u1', email: 'owner@example.test', role: 'OWNER', isActive: true, createdAt: '', member: null, collegeAdmin: null, orgStaff: null } as const;
function Probe() {
  const auth = useAuth();
  return <><p>{auth.isLoading ? 'Validating' : auth.isAuthenticated ? auth.role : 'Signed out'}</p>
    {auth.sessionError && <button onClick={auth.retrySession}>Retry</button>}
    <button onClick={() => void auth.login('owner@example.test', 'password')}>Login</button>
    <button onClick={auth.logout}>Logout</button></>;
}
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>); }
beforeEach(() => vi.resetAllMocks());
it('ignores a cached profile without a token', () => {
  localStorage.setItem('safety_user', JSON.stringify({ role: 'owner' }));
  mount();
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(getMe).not.toHaveBeenCalled();
});
it('validates login and clears session on logout', async () => {
  vi.mocked(loginUser).mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: { id: 'u1', email: me.email, role: 'OWNER', organizationId: null, collegeId: null } });
  vi.mocked(getMe).mockResolvedValue(me);
  mount();
  await userEvent.click(screen.getByText('Login'));
  expect(await screen.findByText('owner')).toBeInTheDocument();
  await userEvent.click(screen.getByText('Logout'));
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(localStorage.getItem('accessToken')).toBeNull();
});
it('does not restore the user when session validation finishes after logout', async () => {
  localStorage.setItem('accessToken', 'a');
  let resolve!: (value: typeof me) => void;
  vi.mocked(getMe).mockImplementation(() => new Promise(r => { resolve = r; }));
  mount();
  await userEvent.click(screen.getByText('Logout'));
  resolve(me);
  await waitFor(() => expect(screen.getByText('Signed out')).toBeInTheDocument());
});
it('offers retry after temporary session verification failure', async () => {
  localStorage.setItem('accessToken', 'a');
  vi.mocked(getMe).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(me);
  mount();
  await userEvent.click(await screen.findByText('Retry'));
  expect(await screen.findByText('owner')).toBeInTheDocument();
});
