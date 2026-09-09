import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, X, Phone, Mail, Droplets, BookOpen, MapPin, Calendar } from "lucide-react";
import { getMembers, resetMemberPassword } from "../../services/membersService";
import type { Student } from "../../types/organization";
import { useAuth } from "../../context/AuthContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { queryKeys } from "../../lib/queryKeys";
import Pagination from "../../components/Pagination";
import TableSkeleton from "../../components/TableSkeleton";
import PasswordDialog from "../../components/PasswordDialog";

const PAGE_SIZE = 20;

export default function Members() {
  const { role } = useAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, query ? 300 : 0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [resetTarget, setResetTarget] = useState<Student | null>(null);
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const { data, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.members.list({ search: debouncedQuery || undefined, page, pageSize: PAGE_SIZE }),
    queryFn: () => getMembers({ search: debouncedQuery || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const error = isError ? "Could not load members." : "";

  const handleResetPassword = async (newPassword: string) => {
    if (!resetTarget) return;
    setResetBusy(true);
    setResetError("");
    try {
      await resetMemberPassword(resetTarget.id, newPassword);
      setResetTarget(null);
    } catch {
      setResetError("Could not reset password.");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">View member profiles in your organization</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, ID, department..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Member ID</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Year</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Hosteler</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Email</th>
                  {role === 'support' && (
                    <th className="text-right font-medium px-4 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedStudent(s)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.memberNumber ?? s.studentNumber ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{s.department ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{s.year ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{s.isHosteler ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.user?.email ?? "—"}</td>
                    {role === 'support' && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetError("");
                            setResetTarget(s);
                          }}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                        >
                          Reset Password
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl border border-white/60 shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
            >
              <X size={16} />
            </button>
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border-2 border-primary/20 shrink-0">
                {selectedStudent.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'ST'}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-800 truncate">{selectedStudent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedStudent.user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {selectedStudent.user?.isActive ? 'Active Account' : 'Suspended Account'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate">{selectedStudent.memberNumber || selectedStudent.studentNumber || 'No ID'}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate" title={selectedStudent.user?.email || ''}>{selectedStudent.user?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mobile</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{selectedStudent.mobile || '—'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <BookOpen size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course & Dept</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate" title={`${selectedStudent.course || '—'} ${selectedStudent.department ? `(${selectedStudent.department})` : ''}`}>
                      {selectedStudent.course || '—'} {selectedStudent.department ? `(${selectedStudent.department})` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Year & Section</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">
                      Year {selectedStudent.year || '—'} {selectedStudent.section ? `• Sec ${selectedStudent.section}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residential Status</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{selectedStudent.isHosteler ? 'Hosteler' : 'Day Scholar'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Droplets size={16} className="text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blood Group</p>
                    <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{selectedStudent.bloodGroup || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <PasswordDialog
        open={!!resetTarget}
        title="Reset member password"
        description={resetTarget ? `Set a temporary password for ${resetTarget.user?.email || resetTarget.name}.` : undefined}
        submitting={resetBusy}
        error={resetError}
        onClose={() => setResetTarget(null)}
        onSubmit={handleResetPassword}
      />
    </div>
  );
}
