import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { getStudents } from "../../services/studentsService";
import type { Student } from "../../types/student";

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      getStudents({ search: query || undefined, pageSize: 50 })
        .then((res) => setStudents(res.items))
        .catch(() => setError("Could not load students."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">View student profiles in your college</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, roll, department..."
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
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" size={18} /> Loading students…
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Roll No</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Department</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Year</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Hosteler</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.studentNumber ?? "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{s.department ?? "—"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{s.year ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{s.isHosteler ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.user?.email ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
