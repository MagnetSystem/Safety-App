export const INCIDENT_CATEGORIES = [
  'Physical Ragging',
  'Verbal Abuse',
  'Mental Harassment',
  'Threat',
  'Hostel Ragging',
  'Classroom Ragging',
  'Cyber Bullying',
  'Money Extortion',
  'Sexual Harassment',
  'Other',
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];
