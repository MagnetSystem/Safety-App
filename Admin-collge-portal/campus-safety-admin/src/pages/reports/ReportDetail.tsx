import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Download, MessageSquare,
  MapPin, Clock, Loader2, FileImage,
} from "lucide-react";
import { getReportById, updateReportStatus, getEvidence } from "../../services/complaintsService";
import { formatEnum, type ComplaintStatus, type Evidence, type Report } from "../../types/report";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS: ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INVESTIGATING",
  "MORE_INFO_REQUESTED",
  "RESOLVED",
  "CLOSED",
];

export default function ReportDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const canManage = role === "college_admin";
  const [report, setReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusValue, setStatusValue] = useState<ComplaintStatus>("SUBMITTED");
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([getReportById(id), getEvidence(id)])
      .then(([r, e]) => {
        setReport(r);
        setStatusValue(r.status);
        setEvidence(e);
      })
      .catch(() => setError("Could not load this report."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatusChange = async (next: ComplaintStatus) => {
    if (!id) return;
    setStatusValue(next);
    setUpdating(true);
    try {
      const updated = await updateReportStatus(id, next);
      setReport(updated);
    } catch {
      setError("Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !report || !note.trim()) return;
    setSavingNote(true);
    try {
      const updated = await updateReportStatus(id, report.status, note.trim());
      setReport(updated);
      setNote("");
    } catch {
      setError("Could not add note.");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading report…
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error || "Report not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/reports" className="p-2 rounded-lg hover:bg-muted transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Report {report.code}</h1>
          <p className="text-sm text-muted-foreground">
            Submitted {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary card */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
                {formatEnum(report.type)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-info/15 text-info">
                {formatEnum(report.status)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning">
                {formatEnum(report.priority)} Priority
              </span>
            </div>

            <div>
              <h3 className="font-medium mb-1">Category</h3>
              <p className="text-muted-foreground">{formatEnum(report.category)}</p>
            </div>

            <div>
              <h3 className="font-medium mb-1">Reported by</h3>
              <p className="text-muted-foreground">{report.reporterLabel ?? "Anonymous Student"}</p>
            </div>

            <div>
              <h3 className="font-medium mb-1">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {report.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} /> {report.location}
                </div>
              )}
              {report.gpsLat != null && report.gpsLng != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} /> {report.gpsLat.toFixed(4)}, {report.gpsLng.toFixed(4)}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={16} /> {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="font-medium mb-3">Evidence</h3>
            {evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {evidence.map((e) => (
                  <a
                    key={e.id}
                    href={e.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-video rounded-lg bg-muted flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground border border-border hover:border-primary/40 transition p-2 text-center"
                  >
                    <FileImage size={18} />
                    <span className="truncate w-full">{e.fileName}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="font-medium mb-4">Timeline</h3>
            <div className="space-y-4">
              {(report.timeline ?? []).map((t) => (
                <div key={t.id} className="flex gap-3">
                  <div className="mt-1 h-3 w-3 rounded-full shrink-0 bg-success" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatEnum(t.status)}
                      {t.note ? ` — ${t.note}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 space-y-4">
            <h3 className="font-medium">Actions</h3>

            {canManage ? (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">Change Status</label>
                  <select
                    value={statusValue}
                    disabled={updating}
                    onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{formatEnum(s)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Add Internal Note</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Write a note for this case…"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={savingNote || !note.trim()}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition disabled:opacity-60"
                  >
                    <MessageSquare size={16} /> {savingNote ? "Saving…" : "Add Note"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Read-only view. Status changes are managed by the college's own admin.
              </p>
            )}

            {evidence.length > 0 && (
              <a
                href={evidence[0].downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition"
              >
                <Download size={16} /> Download Latest Evidence
              </a>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="font-medium mb-3">Committee</h3>
            <p className="text-sm text-muted-foreground">
              {report.assignedCommitteeUserIds?.length
                ? `${report.assignedCommitteeUserIds.length} member(s) assigned`
                : "Committee assignment is coming in a future release."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
