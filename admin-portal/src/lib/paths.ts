import type { Role } from "../types/user";

export function reportsBasePath(role: Role): string {
  return role === "support" ? "/super-admin" : "";
}

export function reportsListPath(role: Role): string {
  return `${reportsBasePath(role)}/reports`;
}

export function reportPath(role: Role, id: string): string {
  return `${reportsListPath(role)}/${id}`;
}
