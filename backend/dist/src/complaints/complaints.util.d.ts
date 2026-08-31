export declare function maskAnonymousComplaint<T extends {
    isAnonymous: boolean;
    studentId?: string | null;
    student?: unknown;
}>(complaint: T): any;
