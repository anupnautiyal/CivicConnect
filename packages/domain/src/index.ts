export const roles = ["CITIZEN", "OFFICER", "DEPARTMENT_ADMIN", "SYSTEM_ADMIN"] as const;
export type Role = typeof roles[number];
export const statuses = ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED", "REOPENED"] as const;
export type IssueStatus = typeof statuses[number];
/** Graph only. Actor, department, ownership and evidence checks belong on the server. */
export const transitions: Readonly<Record<IssueStatus, readonly IssueStatus[]>> = {
  SUBMITTED: ["VERIFIED", "REJECTED"], VERIFIED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "VERIFIED"], IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"], REOPENED: ["IN_PROGRESS", "RESOLVED"],
  CLOSED: [], REJECTED: []
};
export function canTransition(from: IssueStatus, to: IssueStatus): boolean {
  return transitions[from].includes(to);
}
export const departments = [
  { code: "SAN", name: "Sanitation" }, { code: "PWD", name: "Public Works" },
  { code: "WAT", name: "Water Services" }, { code: "ELE", name: "Street Lighting" }
] as const;
export const categories = [
  { code: "SANITATION", name: "Sanitation", department: "SAN" },
  { code: "ROADS", name: "Roads and footpaths", department: "PWD" },
  { code: "WATER", name: "Water and drainage", department: "WAT" },
  { code: "LIGHTING", name: "Street lighting", department: "ELE" }
] as const;
export const demoIssue = {
  reference: "DEMO-001", title: "Overflowing garbage bin", category: "Sanitation",
  ward: "Ward 01 · Central", address: "Market Road, near the community centre",
  description: "The community bin is overflowing and waste is spreading onto the footpath.",
  department: "Sanitation"
} as const;

export const roleHome: Readonly<Record<Role, string>> = {
  CITIZEN: '/citizen', OFFICER: '/officer', DEPARTMENT_ADMIN: '/department', SYSTEM_ADMIN: '/admin'
};
