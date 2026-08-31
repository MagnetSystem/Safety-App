"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskAnonymousComplaint = maskAnonymousComplaint;
function maskAnonymousComplaint(complaint) {
    if (!complaint.isAnonymous) {
        return { ...complaint, reporterLabel: complaint.student?.name ?? null };
    }
    const { studentId, student, ...rest } = complaint;
    return { ...rest, reporterLabel: 'Anonymous Student' };
}
//# sourceMappingURL=complaints.util.js.map