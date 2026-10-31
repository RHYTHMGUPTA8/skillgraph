import type { Application, Evidence, Opportunity, Skill } from './types';
export const initialSkills: Skill[] = [
  { id:'s1', name:'React', category:'Development', level:4, evidenceCount:2, verified:true },
  { id:'s2', name:'TypeScript', category:'Development', level:3, evidenceCount:1, verified:true },
  { id:'s3', name:'SQL & Databases', category:'Data', level:4, evidenceCount:2, verified:true },
  { id:'s4', name:'Product Thinking', category:'Product', level:3, evidenceCount:1, verified:false },
  { id:'s5', name:'UI Design', category:'Design', level:2, evidenceCount:0, verified:false },
  { id:'s6', name:'Communication', category:'Professional', level:4, evidenceCount:1, verified:false },
];
export const initialEvidence: Evidence[] = [
  { id:'e1', title:'Community Issue Tracker', type:'Project', skill:'React', date:'Oct 18, 2026', status:'Evidence linked', url:'https://github.com/' },
  { id:'e2', title:'Database Design Assessment', type:'Assessment', skill:'SQL & Databases', date:'Oct 15, 2026', status:'Evidence linked' },
  { id:'e3', title:'TypeScript Fundamentals', type:'Certificate', skill:'TypeScript', date:'Oct 12, 2026', status:'Evidence linked' },
  { id:'e4', title:'Student Club Event Coordination', type:'Project', skill:'Communication', date:'Oct 10, 2026', status:'Self-reported' },
];
export const opportunities: Opportunity[] = [
  { id:'o1', title:'Frontend Engineering Intern', organization:'Northstar Labs', type:'Internship', location:'Remote · India', deadline:'Nov 12, 2026', description:'Help build accessible product experiences, ship UI improvements, and work closely with design and engineering.', logo:'N', color:'lilac', applyUrl:'https://example.com', skills:[{name:'React',weight:5,required:true},{name:'TypeScript',weight:4,required:true},{name:'UI Design',weight:2,required:false}] },
  { id:'o2', title:'Data Platform Intern', organization:'Orbit Analytics', type:'Internship', location:'Hybrid · Bengaluru', deadline:'Nov 18, 2026', description:'Build data workflows, write reliable queries, and help teams make better decisions with clean data.', logo:'O', color:'mint', applyUrl:'https://example.com', skills:[{name:'SQL & Databases',weight:5,required:true},{name:'TypeScript',weight:2,required:false},{name:'Communication',weight:2,required:false}] },
  { id:'o3', title:'Build for Communities Hackathon', organization:'Open Civic Collective', type:'Hackathon', location:'Online · Global', deadline:'Nov 22, 2026', description:'Create a practical tool that helps communities coordinate, solve problems, or access public information.', logo:'C', color:'peach', applyUrl:'https://example.com', skills:[{name:'React',weight:3,required:false},{name:'SQL & Databases',weight:3,required:false},{name:'Product Thinking',weight:4,required:true}] },
  { id:'o4', title:'Associate Product Fellow', organization:'Launchpad Fellowship', type:'Fellowship', location:'Remote · India', deadline:'Dec 02, 2026', description:'Work with a small team to turn user problems into experiments, product decisions, and measurable outcomes.', logo:'L', color:'blue', applyUrl:'https://example.com', skills:[{name:'Product Thinking',weight:5,required:true},{name:'Communication',weight:4,required:true},{name:'UI Design',weight:2,required:false}] },
  { id:'o5', title:'Full-Stack Builder Sprint', organization:'Buildspace Community', type:'Project sprint', location:'Online · Global', deadline:'Nov 30, 2026', description:'Ship a useful full-stack product, get feedback from builders, and show the decisions behind your work.', logo:'B', color:'rose', applyUrl:'https://example.com', skills:[{name:'React',weight:3,required:true},{name:'SQL & Databases',weight:4,required:true},{name:'Communication',weight:2,required:false}] },
];
export const initialApplications: Application[] = [
  { id:'a1', opportunityId:'o1', status:'Saved', updatedAt:'Today' },
  { id:'a2', opportunityId:'o3', status:'Applied', updatedAt:'Oct 21, 2026' },
];
