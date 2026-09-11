import QueryError from '../../components/QueryError';
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { search as runSearch } from "../../services/searchService";
import { useAuth } from "../../context/auth";
import { formatEnum } from "../../types/report";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { queryKeys } from "../../lib/queryKeys";

export default function SearchPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const liveQuery = query.trim();
  const debouncedQuery = useDebouncedValue(liveQuery, 300);
  const canSearch = debouncedQuery.length >= 2;
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: queryKeys.search(debouncedQuery),
    queryFn: () => runSearch(debouncedQuery),
    enabled: canSearch,
  });
  const loading = liveQuery.length >= 2 && liveQuery === debouncedQuery && isFetching;
  const results = liveQuery.length < 2 || liveQuery !== debouncedQuery || loading ? undefined : data;

  const reportsBase = role === "support" ? "/super-admin" : "";

  return (
    <div className="page-shell max-w-[900px]">
      <div className="section-intro">
        <p className="page-overline">Find</p>
        <h1>Search people and cases.</h1>
        <p>
          {role === "support"
            ? "Look across the entire platform by name, report code, or email."
            : "Look within your organization by name, report code, or email."}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, roll number, report code, email..."
          className="w-full rounded-xl border border-border bg-white py-3.5 pl-12 pr-4 text-base"
          autoFocus
        />
      </div>

      {isError && <QueryError message="Unable to search. Please try again." retry={refetch} />}
      {liveQuery.length < 2 && <p className="text-sm text-slate-500">Enter at least two characters to search.</p>}
      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" size={18} /> Searching…
        </div>
      )}

      {!loading && results && (
        <div className="space-y-4">
          <div className="surface-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Members {results.students.length > 0 && `(${results.students.length})`}
            </h3>
            {results.students.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              <div className="space-y-2">
                {results.students.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.studentNumber ?? s.user.email} • {s.college.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Cases {results.complaints.length > 0 && `(${results.complaints.length})`}
            </h3>
            {results.complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matches.</p>
            ) : (
              <div className="space-y-2">
                {results.complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`${reportsBase}/reports/${c.id}`)}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{c.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatEnum(c.type)} • {formatEnum(c.category)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {role === "support" && (
            <div className="surface-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Organizations {results.colleges.length > 0 && `(${results.colleges.length})`}
              </h3>
              {results.colleges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches.</p>
              ) : (
                <div className="space-y-2">
                  {results.colleges.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate("/super-admin/organizations")}
                      className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{c.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
