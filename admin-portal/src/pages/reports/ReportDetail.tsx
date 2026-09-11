import QueryError from '../../components/QueryError';
import Modal from '../../components/Modal';
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Download, MessageSquare,
  MapPin, Clock, Loader2, FileImage, FileText, ExternalLink
} from "lucide-react";
import {
  getReportById, updateReportStatus, getEvidence, getMessages, postMessage, assignCommittee,
  type ComplaintMessage,
} from "../../services/incidentsService";
import { getStaff } from "../../services/staffService";
import { formatEnum, type ComplaintStatus } from "../../types/report";
import { useAuth } from "../../context/auth";
import { canManageOrgTeam } from "../../types/user";
import { queryKeys } from "../../lib/queryKeys";
import { reportsListPath } from "../../lib/paths";

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
  const queryClient = useQueryClient();
  const canManage = role === "admin" || role === "owner" || role === "staff" || role === "support";
  const canAssign = canManageOrgTeam(role) || role === "support";
  const [actionError, setActionError] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  
  // Status Change State
  const [statusValue, setStatusValue] = useState<ComplaintStatus>("SUBMITTED");
  const [pendingStatus, setPendingStatus] = useState<ComplaintStatus | null>(null);
  const [resolutionReport, setResolutionReport] = useState("");

  // Student conversation
  const [draft, setDraft] = useState("");

  const reportQuery = useQuery({
    queryKey: queryKeys.reports.detail(id ?? ""),
    queryFn: () => getReportById(id!),
    enabled: !!id,
  });
  const evidenceQuery = useQuery({
    queryKey: queryKeys.reports.evidence(id ?? ""),
    queryFn: () => getEvidence(id!),
    enabled: !!id,
  });
  const messagesQuery = useQuery({
    queryKey: queryKeys.reports.messages(id ?? ""),
    queryFn: () => getMessages(id!),
    enabled: !!id,
  });

  const report = reportQuery.data ?? null;
  const evidence = evidenceQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const loading = reportQuery.isLoading;

  const staffQuery = useQuery({
    queryKey: queryKeys.staff.list({ pageSize: 100, organizationId: report?.collegeId }),
    queryFn: () => getStaff({ pageSize: 100, organizationId: report?.collegeId }),
    enabled: canAssign && !!report,
  });
  const staff = staffQuery.data?.items ?? [];
  const error = reportQuery.isError ? "Could not load this report." : "";

  useEffect(() => {
    if (report) {
      setStatusValue(report.status);
      setAssigneeId(report.assignedTo?.id ?? report.assignedCommitteeUserIds?.[0] ?? "");
    }
  }, [report]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => postMessage(id!, body),
    onSuccess: (msg) => {
      queryClient.setQueryData<ComplaintMessage[]>(queryKeys.reports.messages(id!), (prev = []) => [...prev, msg]);
      setDraft("");
    },
    onError: () => setActionError("Could not send the message."),
  });
  const sendingMsg = sendMutation.isPending;

  const handleSendMessage = async () => {
    const body = draft.trim();
    if (!id || !body || sendingMsg) return;
    setActionError("");
    sendMutation.mutate(body);
  };

  const statusMutation = useMutation({
    mutationFn: ({ next, reportText }: { next: ComplaintStatus; reportText?: string }) =>
      updateReportStatus(id!, next, undefined, reportText),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.reports.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orgDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminDashboard });
      setStatusValue(updated.status);
      setPendingStatus(null);
      setResolutionReport("");
    },
    onError: () => { setActionError("Could not update status. Your draft is preserved. Try again."); setStatusValue(report?.status ?? "SUBMITTED"); },
  });
  const updating = statusMutation.isPending;

  const handleStatusSelect = (next: ComplaintStatus) => {
    if (next === report?.status) {
      setPendingStatus(null);
      setStatusValue(next);
      return;
    }

    setStatusValue(next);
    
    if (next === "RESOLVED" || next === "CLOSED") {
      setPendingStatus(next);
      setResolutionReport("");
    } else {
      // Auto-submit for other statuses
      submitStatusChange(next);
    }
  };

  const submitStatusChange = async (next: ComplaintStatus, reportText?: string) => {
    if (!id || updating) return;
    setActionError("");
    statusMutation.mutate({ next, reportText });
  };

  const handleConfirmResolution = () => {
    if (pendingStatus && resolutionReport.trim().length >= 10) {
      submitStatusChange(pendingStatus, resolutionReport.trim());
    }
  };

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignCommittee(id!, userId),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.reports.detail(id!), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      setAssigneeId(updated.assignedTo?.id ?? updated.assignedCommitteeUserIds?.[0] ?? assigneeId);
    },
    onError: () => { setActionError("Could not assign this case. Try again."); setAssigneeId(report?.assignedTo?.id ?? report?.assignedCommitteeUserIds?.[0] ?? ""); },
  });

  const downloadPDF = async () => {
    if (!report) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text(`Incident Report: ${report.code}`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Status: ${formatEnum(report.status)}`, 20, 30);
    doc.text(`Date Filed: ${new Date(report.createdAt).toLocaleDateString()}`, 20, 38);
    doc.text(`Category: ${formatEnum(report.category)}`, 20, 46);
    
    if (report.student) {
      doc.text(`Reported by: ${report.student.name} (${report.student.studentNumber || 'No ID'})`, 20, 54);
      doc.text(`Contact: ${report.student.mobile || 'N/A'}`, 20, 62);
    } else {
      doc.text(`Reported by: Anonymous`, 20, 54);
    }

    doc.setFontSize(16);
    doc.text("Description", 20, 80);
    doc.setFontSize(12);
    const splitDesc = doc.splitTextToSize(report.description, 170);
    doc.text(splitDesc, 20, 90);
    
    let yPos = 90 + (splitDesc.length * 6) + 10;
    
    if (report.resolutionReport) {
      doc.setFontSize(16);
      doc.text("Official Resolution Report", 20, yPos);
      doc.setFontSize(12);
      const splitRes = doc.splitTextToSize(report.resolutionReport, 170);
      yPos += 10;
      doc.text(splitRes, 20, yPos);
    }

    doc.save(`Resolution_${report.code}.pdf`);
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
      <div className="page-shell max-w-[1100px]">
        <QueryError message={error || "Report not found."} retry={() => reportQuery.refetch()} />
      </div>
    );
  }

  return (
    <>
      <div className="page-shell max-w-[1100px]">
      {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{actionError}</div>}
      <div className="flex items-center gap-3">
        <Link to={reportsListPath(role)} className="icon-button" aria-label="Back to cases">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="page-overline">Case</p>
          <h1>{report.code}</h1>
          <p>Submitted {new Date(report.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary card */}
          <div className="surface-card p-5 space-y-4">
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
              <p className="text-muted-foreground">{report.reporterLabel ?? "Anonymous"}</p>
            </div>

            <div>
              <h3 className="font-medium mb-1">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
              {report.location && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1 text-foreground">Specific Location Noted:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.location}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={16} /> {new Date(report.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <MapPin size={18} className={report.gpsLat ? "text-primary" : "text-muted-foreground"} /> 
                GPS Location Map
              </h3>
              {report.gpsLat != null && report.gpsLng != null ? (
                <a
                  href={`https://www.google.com/maps?q=${report.gpsLat},${report.gpsLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block relative w-full h-40 rounded-xl overflow-hidden border border-border group"
                >
                  <iframe
                    title="Location Map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.gpsLng - 0.005},${report.gpsLat - 0.005},${report.gpsLng + 0.005},${report.gpsLat + 0.005}&layer=mapnik&marker=${report.gpsLat},${report.gpsLng}`}
                    className="w-full h-full pointer-events-none"
                    frameBorder="0"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                    <div className="bg-background/90 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-xl">
                      <ExternalLink size={16} /> Open in Google Maps
                    </div>
                  </div>
                </a>
              ) : (
                <div className="w-full h-24 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/20">
                  <p className="text-sm text-muted-foreground italic">No GPS coordinates were captured for this report.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Resolution Report */}
          {report.resolutionReport && (
             <div className="surface-card p-5 space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="font-medium text-lg flex items-center gap-2">
                   <FileText size={18} className="text-primary" /> Official Resolution Report
                 </h3>
                 <button
                   onClick={downloadPDF}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition text-primary"
                 >
                   <Download size={16} /> Download PDF
                 </button>
               </div>
               <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                 <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                   {report.resolutionReport}
                 </p>
               </div>
             </div>
          )}

          {/* Evidence */}
          <div className="surface-card p-5">
            <h3 className="font-medium mb-3">Evidence</h3>
            {evidenceQuery.isLoading ? <p role="status">Loading evidence…</p> : evidenceQuery.isError ? <QueryError message="Unable to load evidence." retry={() => evidenceQuery.refetch()} /> : evidence.length === 0 ? (
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

          {/* Conversation with student */}
          <div className="surface-card p-5">
            <h3 className="font-medium mb-1 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Conversation with {report.type === "ANONYMOUS" ? "reporter" : "student"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              These messages are visible to the person who filed the report. Use this to ask for
              more information.
            </p>

            {messagesQuery.isLoading ? <p role="status">Loading messages…</p> : messagesQuery.isError ? <QueryError message="Unable to load messages." retry={() => messagesQuery.refetch()} /> : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {messages.map((m) => {
                  const fromStudent = m.authorRole === "STUDENT";
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                        fromStudent
                          ? "bg-muted/60 mr-auto"
                          : "bg-primary/10 ml-auto"
                      }`}
                    >
                      <p className="text-[11px] font-medium text-muted-foreground mb-0.5">
                        {fromStudent ? "Student" : "Committee"}
                      </p>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {canManage && (
              <div className="flex gap-2">
                <textarea
                  aria-label="Message to reporter"
                  disabled={sendingMsg}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Message the student…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMsg || messagesQuery.isError || !draft.trim()}
                  className="px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {sendingMsg ? "…" : "Send"}
                </button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="surface-card p-5">
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
          <div className="surface-card p-5 space-y-4">
            <h3 className="font-medium">Actions</h3>

            {canManage ? (
              <>
                <div>
                  <label htmlFor="case-status" className="text-sm text-muted-foreground">Change Status</label>
                  <select
                    id="case-status"
                    value={statusValue}
                    disabled={updating}
                    onChange={(e) => handleStatusSelect(e.target.value as ComplaintStatus)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{formatEnum(s)}</option>
                    ))}
                  </select>
                  
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Read-only view. Status changes are managed by the organization admin.
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

          <div className="surface-card p-5 space-y-3">
            <h3 className="font-medium">Assignee</h3>
            {canAssign ? (
              <>
                {staffQuery.isError && <QueryError message="Unable to load staff." retry={() => staffQuery.refetch()} />}
                <select
                  aria-label="Assign case"
                  value={assigneeId}
                  disabled={assignMutation.isPending || staffQuery.isLoading || staffQuery.isError}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!next || next === assigneeId || assignMutation.isPending) return;
                    setActionError("");
                    setAssigneeId(next);
                    if (next) assignMutation.mutate(next);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                >
                  <option value="" disabled>Select assignee</option>
                  {staff.filter((m) => m.user.isActive).map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.name} · {m.orgRole === "OWNER" ? "Owner" : m.orgRole === "ADMIN" ? "Admin" : "Staff"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {assignMutation.isPending
                    ? "Saving…"
                    : assigneeId
                      ? "This person will see the case in their queue."
                      : "Pick a staff member to handle this case."}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {report.assignedTo?.email
                  ? `Assigned to ${report.assignedTo.email}`
                  : report.assignedCommitteeUserIds?.length
                    ? "Assigned"
                    : "Not assigned"}
              </p>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Modal Overlay for Resolution Report */}
      {pendingStatus && (
        <Modal label="Resolve case" busy={updating} onClose={() => { setPendingStatus(null); setStatusValue(report.status); }}>
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="text-primary" /> Close Incident: {formatEnum(pendingStatus)}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                An official Resolution Report is required before closing this case. This report will be permanently attached to the case and available as a downloadable PDF.
              </p>
            </div>
            
            <div className="p-6 flex-1">
              {actionError && <p role="alert" className="mb-3 text-red-700">{actionError}</p>}
              <textarea
                aria-label="Resolution report"
                disabled={updating}
                value={resolutionReport}
                onChange={(e) => setResolutionReport(e.target.value)}
                placeholder="Detail the investigation findings, actions taken, and the final resolution..."
                rows={12}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none shadow-sm"
              />
              <p className={`text-xs mt-2 text-right ${resolutionReport.trim().length < 10 ? 'text-destructive' : 'text-success'}`}>
                {resolutionReport.trim().length < 10 ? `${10 - resolutionReport.trim().length} more characters required` : 'Ready to submit'}
              </p>
            </div>

            <div className="p-6 border-t border-border bg-muted/10 flex gap-3 justify-end">
              <button
                disabled={updating}
                onClick={() => {
                  setPendingStatus(null);
                  setStatusValue(report.status);
                }}
                className="px-6 py-2.5 text-sm font-medium border border-border rounded-xl hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                disabled={resolutionReport.trim().length < 10 || updating}
                className="px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
              >
                {updating ? "Saving..." : "Confirm Closure"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
