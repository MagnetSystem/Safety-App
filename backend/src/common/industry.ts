export type OrganizationIndustry = 'EDUCATION' | 'CORPORATE' | 'CARE_HOME' | 'CUSTOM' | string;

export type FieldType = 'text' | 'tel' | 'email' | 'number' | 'select' | 'boolean' | 'date';
export type FieldGroup = 'identity' | 'role' | 'location' | 'emergency' | 'medical' | 'organization';

export interface ProfileFieldDef {
  key: string;
  label: string;
  type: FieldType;
  group: FieldGroup;
  required?: boolean;
  options?: string[];
  help?: string;
  memberColumn?: boolean;
}

export interface DepartmentTemplate {
  name: string;
  slug: string;
  description: string;
}

export interface CategoryDef {
  key: string;
  label: string;
}

export interface OrgSettings {
  categories: string[];
  features: {
    guardianAlerts: boolean;
    bulkSignup: boolean;
    reporting: boolean;
    departmentsEnabled: boolean;
  };
  profileFields: string[];
  profileFieldDefs?: ProfileFieldDef[];
  defaultDepartments?: DepartmentTemplate[];
}

export interface IndustryCatalog {
  id: OrganizationIndustry;
  label: string;
  blurb: string;
  features: OrgSettings['features'];
  categories: CategoryDef[];
  defaultDepartments: DepartmentTemplate[];
  /** Collected from the Owner during org setup. */
  orgSetupFields: ProfileFieldDef[];
  /** Collected from each Member after they join. */
  memberFields: ProfileFieldDef[];
}

const SHARED_IDENTITY: ProfileFieldDef[] = [
  { key: 'name', label: 'Full name', type: 'text', group: 'identity', required: true, memberColumn: true },
  { key: 'mobile', label: 'Mobile number', type: 'tel', group: 'identity', required: true, memberColumn: true },
  { key: 'dateOfBirth', label: 'Date of birth', type: 'date', group: 'identity', memberColumn: true },
  { key: 'gender', label: 'Gender', type: 'select', group: 'identity', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], memberColumn: true },
];

const SHARED_EMERGENCY: ProfileFieldDef[] = [
  { key: 'emergencyContactName', label: 'Emergency contact name', type: 'text', group: 'emergency', required: true, memberColumn: true },
  { key: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel', group: 'emergency', required: true, memberColumn: true },
];

const EDUCATION: IndustryCatalog = {
  id: 'EDUCATION',
  label: 'Education (college / school)',
  blurb: 'Campus safety, ragging, hostel and academic cases. Guardian alerts stay on.',
  features: { guardianAlerts: true, bulkSignup: false, reporting: true, departmentsEnabled: true },
  categories: [
    { key: 'PHYSICAL_RAGGING', label: 'Physical ragging' },
    { key: 'VERBAL_ABUSE', label: 'Verbal abuse' },
    { key: 'MENTAL_HARASSMENT', label: 'Mental harassment' },
    { key: 'THREAT', label: 'Threat' },
    { key: 'HOSTEL_RAGGING', label: 'Hostel ragging' },
    { key: 'CLASSROOM_RAGGING', label: 'Classroom ragging' },
    { key: 'CYBER_BULLYING', label: 'Cyber bullying' },
    { key: 'SEXUAL_HARASSMENT', label: 'Sexual harassment' },
    { key: 'MONEY_EXTORTION', label: 'Extortion' },
    { key: 'OTHER', label: 'Other' },
  ],
  defaultDepartments: [
    { name: 'Anti-Ragging Committee', slug: 'anti-ragging', description: 'Primary queue for bullying and ragging reports' },
    { name: 'Hostel Affairs', slug: 'hostel', description: 'Hostel, mess and residential cases' },
    { name: 'Academic Affairs', slug: 'academic', description: 'Classroom and faculty-related cases' },
    { name: 'Campus Security', slug: 'security', description: 'Emergencies, threats and on-ground response' },
    { name: 'Counselling', slug: 'counselling', description: 'Mental health follow-up' },
    { name: 'IT / Cyber', slug: 'cyber', description: 'Online harassment and account abuse' },
  ],
  orgSetupFields: [
    { key: 'campusType', label: 'Campus type', type: 'select', group: 'organization', options: ['University', 'Engineering college', 'School', 'Residential campus'] },
    { key: 'approxMembers', label: 'Approximate student count', type: 'number', group: 'organization' },
    { key: 'hasHostel', label: 'Has hostel / residential facilities', type: 'boolean', group: 'organization' },
    { key: 'regulatorName', label: 'Affiliating body (optional)', type: 'text', group: 'organization', help: 'e.g. UGC, AICTE, state board' },
  ],
  memberFields: [
    ...SHARED_IDENTITY,
    { key: 'memberNumber', label: 'Student / roll number', type: 'text', group: 'role', required: true, memberColumn: true },
    { key: 'course', label: 'Course / programme', type: 'text', group: 'role', required: true, memberColumn: true },
    { key: 'year', label: 'Year of study', type: 'number', group: 'role', memberColumn: true },
    { key: 'semester', label: 'Semester', type: 'text', group: 'role', memberColumn: true },
    { key: 'section', label: 'Section', type: 'text', group: 'role', memberColumn: true },
    { key: 'department', label: 'Academic department', type: 'text', group: 'role', memberColumn: true, help: 'e.g. Computer Science — this is not the routing department' },
    { key: 'isHosteler', label: 'Hosteller', type: 'boolean', group: 'location', memberColumn: true },
    { key: 'hostelAddress', label: 'Hostel / block', type: 'text', group: 'location', memberColumn: true },
    { key: 'hostelRoomNumber', label: 'Room number', type: 'text', group: 'location', memberColumn: true },
    { key: 'permanentAddress', label: 'Permanent address', type: 'text', group: 'location', memberColumn: true },
    ...SHARED_EMERGENCY,
    { key: 'bloodGroup', label: 'Blood group', type: 'select', group: 'medical', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], memberColumn: true },
    { key: 'medicalConditions', label: 'Medical conditions', type: 'text', group: 'medical', memberColumn: true, help: 'Shared only during an emergency' },
    { key: 'allergies', label: 'Allergies', type: 'text', group: 'medical', memberColumn: true },
  ],
};

const CORPORATE: IndustryCatalog = {
  id: 'CORPORATE',
  label: 'IT / Corporate',
  blurb: 'HR, safety and workplace conduct. Guardian alerts are off by default.',
  features: { guardianAlerts: false, bulkSignup: false, reporting: true, departmentsEnabled: true },
  categories: [
    { key: 'HARASSMENT', label: 'Harassment' },
    { key: 'DISCRIMINATION', label: 'Discrimination' },
    { key: 'BULLYING', label: 'Bullying' },
    { key: 'SAFETY_HAZARD', label: 'Safety hazard' },
    { key: 'THEFT', label: 'Theft' },
    { key: 'WORKPLACE_VIOLENCE', label: 'Workplace violence' },
    { key: 'ETHICS', label: 'Ethics / policy violation' },
    { key: 'OTHER', label: 'Other' },
  ],
  defaultDepartments: [
    { name: 'Human Resources', slug: 'hr', description: 'Conduct, harassment and employee relations' },
    { name: 'Health & Safety', slug: 'hse', description: 'Workplace accidents and hazards' },
    { name: 'IT Security', slug: 'it-security', description: 'Account, device and cyber incidents' },
    { name: 'Facilities', slug: 'facilities', description: 'Building, access and site issues' },
    { name: 'Legal / Compliance', slug: 'legal', description: 'Regulatory and legal follow-up' },
  ],
  orgSetupFields: [
    { key: 'headcount', label: 'Approximate employee count', type: 'number', group: 'organization' },
    { key: 'hqLocation', label: 'Headquarters / primary office', type: 'text', group: 'organization' },
    { key: 'hrContact', label: 'HR lead name', type: 'text', group: 'organization' },
    { key: 'sitesCount', label: 'Number of sites', type: 'number', group: 'organization' },
  ],
  memberFields: [
    ...SHARED_IDENTITY,
    { key: 'memberNumber', label: 'Employee ID', type: 'text', group: 'role', required: true, memberColumn: true },
    { key: 'jobTitle', label: 'Job title', type: 'text', group: 'role', required: true },
    { key: 'employmentType', label: 'Employment type', type: 'select', group: 'role', options: ['Full-time', 'Part-time', 'Contractor', 'Intern'] },
    { key: 'officeLocation', label: 'Office / site', type: 'text', group: 'location' },
    { key: 'managerName', label: 'Line manager', type: 'text', group: 'role' },
    { key: 'startDate', label: 'Start date', type: 'date', group: 'role' },
    { key: 'workFloor', label: 'Floor / desk area', type: 'text', group: 'location' },
    ...SHARED_EMERGENCY.map((f) => ({ ...f, required: false })),
  ],
};

const CARE_HOME: IndustryCatalog = {
  id: 'CARE_HOME',
  label: 'Care home / supported living',
  blurb: 'Safeguarding and resident safety. Guardian alerts and bulk signup are on.',
  features: { guardianAlerts: true, bulkSignup: true, reporting: true, departmentsEnabled: true },
  categories: [
    { key: 'SAFEGUARDING', label: 'Safeguarding concern' },
    { key: 'NEGLECT', label: 'Neglect' },
    { key: 'ABUSE', label: 'Abuse' },
    { key: 'MEDICAL', label: 'Medical / clinical' },
    { key: 'FALL', label: 'Fall / injury' },
    { key: 'SAFETY_HAZARD', label: 'Safety hazard' },
    { key: 'MISSING', label: 'Missing person' },
    { key: 'OTHER', label: 'Other' },
  ],
  defaultDepartments: [
    { name: 'Safeguarding', slug: 'safeguarding', description: 'Abuse, neglect and protection concerns' },
    { name: 'Nursing / Clinical', slug: 'nursing', description: 'Medical incidents and care quality' },
    { name: 'Facilities', slug: 'facilities', description: 'Building, equipment and environment' },
    { name: 'Management', slug: 'management', description: 'Escalations and CQC-style notifications' },
    { name: 'Activities', slug: 'activities', description: 'Day-to-day wellbeing incidents' },
  ],
  orgSetupFields: [
    { key: 'bedCount', label: 'Registered beds / places', type: 'number', group: 'organization' },
    { key: 'registeredManager', label: 'Registered manager', type: 'text', group: 'organization' },
    { key: 'regulatorId', label: 'Regulator ID (optional)', type: 'text', group: 'organization', help: 'e.g. CQC location ID' },
    { key: 'overnightStaffing', label: 'Overnight staffing on site', type: 'boolean', group: 'organization' },
  ],
  memberFields: [
    ...SHARED_IDENTITY,
    { key: 'memberNumber', label: 'Resident ID', type: 'text', group: 'role', required: true, memberColumn: true },
    { key: 'facilityUnit', label: 'Unit / wing', type: 'text', group: 'location', required: true },
    { key: 'hostelRoomNumber', label: 'Room number', type: 'text', group: 'location', memberColumn: true },
    { key: 'careLevel', label: 'Care level', type: 'select', group: 'role', options: ['Residential', 'Nursing', 'Dementia', 'Respite', 'Supported living'] },
    { key: 'keyWorker', label: 'Key worker', type: 'text', group: 'role' },
    { key: 'mobilityNeeds', label: 'Mobility needs', type: 'text', group: 'medical' },
    ...SHARED_EMERGENCY,
    { key: 'bloodGroup', label: 'Blood group', type: 'select', group: 'medical', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], memberColumn: true },
    { key: 'medicalConditions', label: 'Medical conditions', type: 'text', group: 'medical', required: true, memberColumn: true },
    { key: 'allergies', label: 'Allergies', type: 'text', group: 'medical', memberColumn: true },
    { key: 'disability', label: 'Disability / support needs', type: 'text', group: 'medical', memberColumn: true },
  ],
};

const CUSTOM: IndustryCatalog = {
  id: 'CUSTOM',
  label: 'Other / custom',
  blurb: 'Configure categories, departments and profile fields yourself.',
  features: { guardianAlerts: false, bulkSignup: false, reporting: true, departmentsEnabled: false },
  categories: [{ key: 'OTHER', label: 'Other' }],
  defaultDepartments: [],
  orgSetupFields: [
    { key: 'orgKind', label: 'What kind of organization is this?', type: 'text', group: 'organization' },
    { key: 'approxMembers', label: 'Approximate member count', type: 'number', group: 'organization' },
  ],
  memberFields: [
    ...SHARED_IDENTITY,
    { key: 'memberNumber', label: 'Member ID', type: 'text', group: 'role', memberColumn: true },
    ...SHARED_EMERGENCY.map((f) => ({ ...f, required: false })),
  ],
};

export const INDUSTRY_CATALOG: Record<string, IndustryCatalog> = {
  EDUCATION,
  CORPORATE,
  CARE_HOME,
  CUSTOM,
};

export function catalogFor(industry?: string | null): IndustryCatalog {
  if (!industry) return CUSTOM;
  const key = industry.toUpperCase().replace(/-/g, '_');
  return INDUSTRY_CATALOG[key] ?? INDUSTRY_CATALOG[industry] ?? CUSTOM;
}

export function settingsFor(industry?: string | null): OrgSettings {
  const catalog = catalogFor(industry);
  return {
    categories: catalog.categories.map((c) => c.key),
    features: { ...catalog.features },
    profileFields: catalog.memberFields.map((f) => f.key),
    profileFieldDefs: catalog.memberFields,
    defaultDepartments: catalog.defaultDepartments,
  };
}

export function parseSettings(raw: unknown, industry?: string | null): OrgSettings {
  const fallback = settingsFor(industry ?? 'CUSTOM');
  if (!raw || typeof raw !== 'object') return fallback;
  const value = raw as Partial<OrgSettings>;
  return {
    categories: Array.isArray(value.categories) ? value.categories.map(String) : fallback.categories,
    features: {
      guardianAlerts: value.features?.guardianAlerts ?? fallback.features.guardianAlerts,
      bulkSignup: value.features?.bulkSignup ?? fallback.features.bulkSignup,
      reporting: value.features?.reporting ?? fallback.features.reporting,
      departmentsEnabled: value.features?.departmentsEnabled ?? fallback.features.departmentsEnabled,
    },
    profileFields: Array.isArray(value.profileFields) ? value.profileFields.map(String) : fallback.profileFields,
    profileFieldDefs: value.profileFieldDefs ?? fallback.profileFieldDefs,
    defaultDepartments: value.defaultDepartments ?? fallback.defaultDepartments,
  };
}

export function publicCatalog() {
  return Object.values(INDUSTRY_CATALOG).map((c) => ({
    id: c.id,
    label: c.label,
    blurb: c.blurb,
    features: c.features,
    categories: c.categories,
    defaultDepartments: c.defaultDepartments,
    orgSetupFields: c.orgSetupFields,
    memberFields: c.memberFields,
  }));
}
