import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Download, MessageSquare,
  MapPin, Clock, Loader2, FileImage, FileText
} from "lucide-react";
import {
  getReportById, updateReportStatus, getEvidence, getMessages, postMessage,
  type ComplaintMessage,
} from "../../services/complaintsService";
import { formatEnum, type ComplaintStatus, type Evidence, type Report } from "../../types/report";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";

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
  
  // Status Change State
  const [statusValue, setStatusValue] = useState<ComplaintStatus>("SUBMITTED");
  const [pendingStatus, setPendingStatus] = useState<ComplaintStatus | null>(null);
  const [resolutionReport, setResolutionReport] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Note State
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Student conversation
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([getReportById(id), getEvidence(id), getMessages(id).catch(() => [])])
      .then(([r, e, m]) => {
        setReport(r);
        setStatusValue(r.status);
        setEvidence(e);
        setMessages(m);
      })
      .catch(() => setError("Could not load this report."))
      .finally(() => setLoading(false));
  };

  const handleSendMessage = async () => {
    const body = draft.trim();
    if (!id || !body || sendingMsg) return;
    setSendingMsg(true);
    try {
      const msg = await postMessage(id, body);
      setMessages((prev) => [...prev, msg]);
      setDraft("");
    } catch {
      setError("Could not send the message.");
    } finally {
      setSendingMsg(false);
    }
  };

  useEffect(load, [id]);

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
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await updateReportStatus(id, next, undefined, reportText);
      setReport(updated);
      setStatusValue(updated.status);
      setPendingStatus(null);
      setResolutionReport("");
    } catch {
      setError("Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmResolution = () => {
    if (pendingStatus && resolutionReport.trim().length > 10) {
      submitStatusChange(pendingStatus, resolutionReport.trim());
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

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.text(`Incident Report: ${report.code}`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Status: ${formatEnum(report.status)}`, 20, 30);
    doc.text(`Date Filed: ${new Date(report.createdAt).toLocaleDateString()}`, 20, 38);
    doc.text(`Category: ${formatEnum(report.category)}`, 20, 46);
    
    if (report.student) {
      doc.text(`Reported by: ${report.student.name} (${report.student.studentNumber || 'No Roll No'})`, 20, 54);
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
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error || "Report not found."}
        </div>
      </div>
    );
  }

  return (
    <>
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
          
          {/* Resolution Report */}
          {report.resolutionReport && (
             <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 space-y-4">
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

          {/* Conversation with student */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5">
            <h3 className="font-medium mb-1 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Conversation with {report.type === "ANONYMOUS" ? "reporter" : "student"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              These messages are visible to the person who filed the report. Use this to ask for
              more information. For private notes, use “Add Internal Note” in the sidebar.
            </p>

            {messages.length === 0 ? (
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
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Message the student…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !draft.trim()}
                  className="px-4 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {sendingMsg ? "…" : "Send"}
                </button>
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
                    onChange={(e) => handleStatusSelect(e.target.value as ComplaintStatus)}
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
      
      {/* Modal Overlay for Resolution Report */}
      {pendingStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
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
              <textarea
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
        </div>
      )}
    </>
  );
}
