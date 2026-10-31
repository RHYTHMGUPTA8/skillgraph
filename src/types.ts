export type Skill = { id: string; name: string; category: string; level: number; evidenceCount: number; verified: boolean };
export type Evidence = { id: string; title: string; type: 'Project' | 'Certificate' | 'Assessment'; skill: string; date: string; status: 'Evidence linked' | 'Self-reported'; url?: string };
export type OpportunitySkill = { name: string; weight: number; required: boolean };
export type Opportunity = { id: string; title: string; organization: string; type: string; location: string; deadline: string; description: string; skills: OpportunitySkill[]; applyUrl: string; logo: string; color: string };
export type Application = { id: string; opportunityId: string; status: 'Saved' | 'Applied' | 'Interview' | 'Accepted' | 'Rejected'; updatedAt: string };
