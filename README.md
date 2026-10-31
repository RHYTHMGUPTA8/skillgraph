# SkillGraph

**SkillGraph** is a student skill passport and opportunity matching MVP built for the Appwrite Databases Hackathon. It helps users connect skills to evidence, understand opportunity requirements, and track applications.

## Features in this starter

- Responsive dashboard and skill passport
- Add/remove skills and add evidence in the current browser session
- Evidence status distinguishes linked supporting URLs from self-reported claims
- Opportunity explorer with search, type filters, and explainable weighted skill-coverage scores
- Opportunity details, save actions, and an application status tracker
- Appwrite client setup and optional email/password sign-in
- Optional TablesDB write for newly added evidence after sign-in (requires the table schema below)
- Demo data is clearly labelled and is not represented as real verified opportunities

> **Integration status:** The UI works in demo mode without Appwrite credentials. Authentication can be enabled by configuring `.env.local`. Evidence rows can be written to TablesDB after sign-in if the table schema matches. The remaining dashboard data is currently seeded in the frontend; the next implementation step is to wire every list/create/update/delete operation to TablesDB and verify row permissions.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Connect Appwrite Cloud

1. Create a new Appwrite project in the Appwrite Console.
2. Add a Web platform for your development hostname, usually `localhost`.
3. Create a database with ID `skillgraph_db` (or change `VITE_APPWRITE_DATABASE_ID`).
4. Create the six tables listed below and add columns with the indicated types.
5. Copy `.env.example` to `.env.local`, then fill in your endpoint, project ID, database ID and table IDs.
6. Restart `npm run dev` after changing environment variables.

Never put an Appwrite server API key in `VITE_*` variables or browser code. `VITE_*` values are public by design.

## Suggested TablesDB schema

Use Appwrite-generated row IDs and add created/updated timestamps where appropriate. Column names and IDs are case-sensitive.

### `profiles`

- `userId`: string/varchar, required, unique index
- `name`: string/varchar, required
- `headline`: string/varchar, optional
- `bio`: text, optional
- `publicProfile`: boolean, required
- `createdAt`: datetime, required

### `skills`

- `name`: string/varchar, required
- `category`: string/varchar, required
- `description`: text, optional

### `evidence`

- `ownerId`: string/varchar, required, index
- `title`: string/varchar, required
- `type`: string/varchar, required
- `url`: string/varchar, optional
- `status`: string/varchar, required
- `skillName`: string/varchar, required (MVP's evidence write uses the skill name; later replace with a relationship or normalized mapping table)
- `createdAt`: datetime, required

### `opportunities`

- `title`: string/varchar, required
- `organization`: string/varchar, required
- `description`: text, required
- `type`: string/varchar, required, index
- `location`: string/varchar, required
- `applyUrl`: string/varchar, optional
- `deadline`: datetime or string/varchar, required
- `status`: string/varchar, required, index

### `opportunity_skills`

- `opportunityId`: string/varchar, required, index
- `skillId`: string/varchar, required, index
- `importance`: integer, required
- `isRequired`: boolean, required
- Add a compound unique index on `opportunityId` + `skillId` if supported by your configured schema.

### `applications`

- `ownerId`: string/varchar, required, index
- `opportunityId`: string/varchar, required, index
- `status`: string/varchar, required
- `appliedAt`: datetime, optional
- `notes`: text, optional
- Add a compound unique index on `ownerId` + `opportunityId` if supported by your configured schema.

## Permissions and security

- Enable user authentication and configure authenticated row-level permissions for private profile data, evidence and applications.
- Do not grant public write access to evidence or applications.
- If supporting public profiles, expose only intended profile fields and enforce privacy in your data-access layer.
- Do not rely on hiding UI buttons for authorization; test the actual Appwrite permissions.
- Never claim certificates or evidence are independently verified just because a URL is attached.

## Build

```bash
npm run build
npm run preview
```

## Hackathon checklist

- [ ] Replace sample organizations and opportunities with clearly sourced/consented data or keep them explicitly labelled as demo fixtures.
- [ ] Complete TablesDB reads and writes for profiles, skills, evidence, opportunities and applications.
- [ ] Add a trusted server-side moderation flow if evidence review is implemented.
- [ ] Test user isolation and permissions using two separate accounts.
- [ ] Test empty states, loading states, expired opportunities, and network errors.
- [ ] Record a short demo and document the schema, indexes, and meaningful database queries in the submission README.
