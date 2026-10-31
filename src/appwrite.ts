import { Account, Client, ID, TablesDB, Query } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;
export const appwriteConfigured = Boolean(endpoint && projectId && projectId !== 'your_project_id');
export const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);
export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const rowId = ID.unique;
export { Query };
export const config = {
  databaseId: (import.meta.env.VITE_APPWRITE_DATABASE_ID as string) || 'skillgraph_db',
  profiles: (import.meta.env.VITE_APPWRITE_PROFILES_TABLE_ID as string) || 'profiles',
  skills: (import.meta.env.VITE_APPWRITE_SKILLS_TABLE_ID as string) || 'skills',
  evidence: (import.meta.env.VITE_APPWRITE_EVIDENCE_TABLE_ID as string) || 'evidence',
  opportunities: (import.meta.env.VITE_APPWRITE_OPPORTUNITIES_TABLE_ID as string) || 'opportunities',
  opportunitySkills: (import.meta.env.VITE_APPWRITE_OPPORTUNITY_SKILLS_TABLE_ID as string) || 'opportunity_skills',
  applications: (import.meta.env.VITE_APPWRITE_APPLICATIONS_TABLE_ID as string) || 'applications',
};
