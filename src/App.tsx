import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Award, Bell, Bookmark, BriefcaseBusiness,
  Check, CheckCircle2, ChevronDown, CircleHelp, Compass, ExternalLink, FileBadge2, FileCheck2,
  FileText, Filter, Github, GraduationCap, LayoutDashboard, Lightbulb, Link2, LockKeyhole,
  LogOut, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, Target, TrendingUp, Users,
  X, Zap,
} from 'lucide-react';
import { account, appwriteConfigured, config, rowId, tablesDB, Query } from './appwrite';
import { initialApplications, initialEvidence, initialSkills, opportunities } from './data';
import type { Application, Evidence, Skill } from './types';
import { Permission, Role } from 'appwrite';

type Page = 'Overview' | 'My skills' | 'Opportunities' | 'My applications' | 'Evidence library';
const pages: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name:'Overview', icon:LayoutDashboard }, { name:'My skills', icon:Zap }, { name:'Opportunities', icon:Compass },
  { name:'My applications', icon:BriefcaseBusiness }, { name:'Evidence library', icon:FileCheck2 },
];
const initialProfile = { name:'Alex Morgan', headline:'Product-minded builder · CS student', bio:'I like turning messy real-world problems into simple, useful products.', publicProfile:true };

function getMatch(opportunity: (typeof opportunities)[number], skills: Skill[]) {
  const total = opportunity.skills.reduce((sum, item) => sum + item.weight, 0);
  const earned = opportunity.skills.reduce((sum, item) => {
    const found = skills.find(skill => skill.name.toLowerCase() === item.name.toLowerCase());
    const coverage = found ? (found.verified ? 1 : found.evidenceCount > 0 ? 0.8 : 0.55) : 0;
    return sum + item.weight * coverage;
  }, 0);
  return Math.round((earned / Math.max(total, 1)) * 100);
}

function App() {
  const [page, setPage] = useState<Page>('Overview');
  useEffect(() => {
  async function testAppwrite() {
    try {
      const result = await tablesDB.listRows({
        databaseId: config.databaseId,
        tableId: config.skills,
      });

      console.log('Appwrite database connection successful!');
      console.log('Skills rows:', result.rows);
    } catch (error) {
      console.error('Appwrite database test failed:', error);
    }
  }

  testAppwrite();
}, []);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [dbOpportunities, setDbOpportunities] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
  if (!appwriteConfigured) return;

  async function loadSkills() {
    try {
      const result = await tablesDB.listRows({
        databaseId: config.databaseId,
        tableId: config.skills,
      });

      const loadedSkills: Skill[] = result.rows.map((row) => ({
        id: row.$id,
        name: String(row.name ?? ''),
        category: String(row.category ?? 'Other'),
        level: 0,
        evidenceCount: 0,
        verified: false,
      }));

      setSkills(loadedSkills);
      console.log('Skills loaded from Appwrite:', loadedSkills);
    } catch (error) {
      console.error('Could not load skills from Appwrite:', error);
    }
  }

  loadSkills();
}, []);

useEffect(() => {
  if (!appwriteConfigured) return;

  async function loadOpportunities() {
    try {
      const result = await tablesDB.listRows({
        databaseId: config.databaseId,
        tableId: config.opportunities,
      });

      const loaded = result.rows.map((row) => ({
        id: row.$id,
        title: String(row.title ?? ''),
        organization: String(row.organization ?? ''),
        description: String(row.description ?? ''),
        type: String(row.type ?? 'Other'),
        location: String(row.location ?? ''),
        deadline: String(row.deadline ?? ''),
        applyUrl: String(row.applyUrl ?? ''),
        status: String(row.status ?? 'Open'),
      }));

      setDbOpportunities(loaded);
      console.log('Opportunities loaded from Appwrite:', loaded);
    } catch (error) {
      console.error('Could not load opportunities from Appwrite:', error);
    }
  }
  loadOpportunities();
}, []);
async function loadEvidence() {
  try {
    const user = await account.get();

    const result = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.evidence,
      queries: [
        Query.equal('ownerId', user.$id),
      ],
    });

    const loaded: Evidence[] = result.rows.map((row) => ({
      id: row.$id,
      title: String(row.title ?? ''),
      type: String(row.type ?? 'Project') as Evidence['type'],
      skill: String(row.skillName ?? ''),
      date: new Date(row.$createdAt).toLocaleDateString(),
      status: (row.status === 'Evidence linked' ? 'Evidence linked' : 'Self-reported'),
      url: String(row.url ?? ''),
    }));

    setEvidence(loaded);
    console.log('Evidence loaded from Appwrite:', loaded);
  } catch (error) {
    console.error('Could not load evidence from Appwrite:', error);
  }
}

useEffect(() => {
  if (!appwriteConfigured) return;

  let active = true;

  const restoreSession = async () => {
    try {
      const user = await account.get();

      if (!active) return;

      setAuthStatus('signed-in');
      setProfile(p => ({
        ...p,
        name: user.name || p.name,
      }));

      await loadProfile();
      await loadEvidence();

      console.log('Appwrite session restored:', user.email);
    } catch (error) {
      if (active) {
        setAuthStatus('signed-out');
        console.log('No active Appwrite session.');
      }
    }
  };

  restoreSession();

  return () => {
    active = false;
  };
}, []);
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [saved, setSaved] = useState<string[]>(['o1']);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All types');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toast, setToast] = useState('');
  const [profile, setProfile] = useState(initialProfile);
  const [newEvidence, setNewEvidence] = useState({ title:'', type:'Project' as Evidence['type'], skill:initialSkills[0].name, url:'' });
  const [newSkill, setNewSkill] = useState({ name:'', category:'Development', level:3 });
  const [mobileNav, setMobileNav] = useState(false);
  const [authStatus, setAuthStatus] = useState<'demo'|'signed-in'|'signed-out'>(appwriteConfigured ? 'signed-out' : 'demo');
  const [authBusy, setAuthBusy] = useState(false);

  const opportunitySource = dbOpportunities.length > 0
  ? dbOpportunities.map((o) => ({
      id: String(o.id ?? ''),
      title: String(o.title ?? ''),
      organization: String(o.organization ?? ''),
      description: String(o.description ?? ''),
      type: String(o.type ?? 'Other'),
      location: String(o.location ?? ''),
      deadline: String(o.deadline ?? ''),
      applyUrl: String(o.applyUrl ?? ''),
      skills: [] as { name: string; weight: number; required: boolean }[],
      logo: String(o.organization ?? '?').slice(0, 1),
      color: '#7865D8',
    }))
  : opportunities;

const activeOpportunity =
  opportunitySource.find(o => o.id === selectedOpportunity) ?? null;
  const filteredOpportunities = useMemo(() => opportunitySource.filter(o =>
    (filter === 'All types' || o.type === filter) && `${o.title} ${o.organization} ${o.skills.map(s=>s.name).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b)=>getMatch(b,skills)-getMatch(a,skills)), [filter, search, skills]);
  const coverage = Math.round(skills.reduce((sum,s)=>sum+(s.verified?1:s.evidenceCount?0.75:0.4),0)/Math.max(skills.length,1)*100);
  const activeApplications = applications.filter(a => !['Rejected','Accepted'].includes(a.status)).length;

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  const toggleSave = (id: string) => {
    setSaved(current => current.includes(id) ? current.filter(item=>item!==id) : [...current,id]);
    notify(saved.includes(id) ? 'Removed from saved opportunities' : 'Opportunity saved to your list');
  };
  
const loadApplications = async () => {
  try {
    const user = await account.get();

    const result = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.applications,
      queries: [
        Query.equal('ownerId', user.$id),
      ],
    });

    const loaded: Application[] = result.rows.map((row) => ({
      id: row.$id,
      opportunityId: String(row.opportunityId ?? ''),
      status: String(row.status ?? 'Saved') as Application['status'],
      updatedAt: String(row.appliedAt ?? row.$updatedAt ?? ''),
    }));

    setApplications(loaded);
    console.log('Applications loaded from Appwrite:', loaded);
  } catch (error) {
    console.error('Could not load applications:', error);
  }
};

const loadProfile = async () => {
  try {
    const user = await account.get();

    const result = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.profiles,
      queries: [
        Query.equal('userId', user.$id),
      ],
    });

    if (result.rows.length > 0) {
      const savedProfile = result.rows[0];

      setProfile({
        name: String(savedProfile.name ?? ''),
        headline: String(savedProfile.headline ?? ''),
        bio: String(savedProfile.bio ?? ''),
        publicProfile: Boolean(savedProfile.publicProfile),
      });

      console.log('Profile loaded from Appwrite:', savedProfile);
    }
  } catch (error) {
    console.error('Could not load profile:', error);
  }
};

const saveProfile = async () => {
  if (!appwriteConfigured || authStatus !== 'signed-in') {
    notify('Please sign in before saving your profile');
    return;
  }

  try {
    const user = await account.get();

    const existing = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.profiles,
      queries: [
        Query.equal('userId', user.$id),
      ],
    });

    const profileData = {
      userId: user.$id,
      name: profile.name.trim(),
      headline: profile.headline.trim(),
      bio: profile.bio.trim(),
      publicProfile: profile.publicProfile,
    };

    if (existing.rows.length > 0) {
      await tablesDB.updateRow({
        databaseId: config.databaseId,
        tableId: config.profiles,
        rowId: existing.rows[0].$id,
        data: profileData,
      });
    } else {
      await tablesDB.createRow({
        databaseId: config.databaseId,
        tableId: config.profiles,
        rowId: rowId(),
        data: profileData,
        permissions: [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
    }

    setShowProfileModal(false);
    notify('Profile saved to Appwrite successfully!');
  } catch (error) {
    console.error('Could not save profile:', error);
    notify('Profile could not be saved. Check the Console.');
  }
};

const applyToOpportunity = async (id: string) => {
  if (!appwriteConfigured || authStatus !== 'signed-in') {
    notify('Please sign in before applying');
    return;
  }

  try {
    const user = await account.get();

    // Check whether this user already has an application
    const existing = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.applications,
      queries: [
        Query.equal('ownerId', user.$id),
        Query.equal('opportunityId', id),
      ],
    });

    if (existing.rows.length > 0) {
      const existingRow = existing.rows[0];

      await tablesDB.updateRow({
        databaseId: config.databaseId,
        tableId: config.applications,
        rowId: existingRow.$id,
        data: {
          status: 'Applied',
          appliedAt: new Date().toISOString(),
        },
      });
    } else {
      await tablesDB.createRow({
        databaseId: config.databaseId,
        tableId: config.applications,
        rowId: rowId(),
        data: {
          ownerId: user.$id,
          opportunityId: id,
          status: 'Applied',
          appliedAt: new Date().toISOString(),
        },
        permissions: [
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ],
      });
    }

    await loadApplications();

    setSaved(current => current.filter(item => item !== id));
    notify('Application saved to your tracker!');
  } catch (error) {
    console.error('Could not save application:', error);
    notify('Application could not be saved. Check the Console.');
  }
};

  
const addEvidence = async () => {
  if (!newEvidence.title.trim()) {
    notify('Add a title for your evidence first');
    return;
  }

  if (!appwriteConfigured || authStatus !== 'signed-in') {
    notify('Please sign in before saving evidence');
    return;
  }

  try {
    const user = await account.get();

    const item: Evidence = {
      id: `e-${Date.now()}`,
      title: newEvidence.title.trim(),
      type: newEvidence.type,
      skill: newEvidence.skill,
      date: 'Today',
      status: newEvidence.url.trim() ? 'Evidence linked' : 'Self-reported',
      url: newEvidence.url.trim() || undefined,
    };



await tablesDB.createRow({
  databaseId: config.databaseId,
  tableId: config.evidence,
  rowId: rowId(),
  data: {
    ownerId: user.$id,
    title: item.title,
    type: item.type,
    skillName: item.skill,
    url: item.url ?? '',
    status: item.status,
  },
  permissions: [
    Permission.read(Role.user(user.$id)),
    Permission.update(Role.user(user.$id)),
    Permission.delete(Role.user(user.$id)),
  ],
});


    setEvidence(current => [item, ...current]);

    setSkills(current =>
      current.map(skill =>
        skill.name === item.skill
          ? {
              ...skill,
              evidenceCount: skill.evidenceCount + 1,
              verified: skill.verified || Boolean(item.url),
            }
          : skill
      )
    );

    setShowEvidenceModal(false);
    setNewEvidence({
      title: '',
      type: 'Project',
      skill: skills[0]?.name ?? '',
      url: '',
    });

    notify('Evidence saved to Appwrite successfully');
  } catch (error) {
    console.error('Could not save evidence to Appwrite:', error);
    notify('Evidence was not saved. Check the Console for the error.');
  }
};

  const addSkill = () => {
    if (!newSkill.name.trim()) { notify('Enter a skill name'); return; }
    if (skills.some(s=>s.name.toLowerCase()===newSkill.name.trim().toLowerCase())) { notify('That skill is already in your passport'); return; }
    setSkills(current=>[...current,{id:`s-${Date.now()}`,name:newSkill.name.trim(),category:newSkill.category,level:newSkill.level,evidenceCount:0,verified:false}]);
    setNewSkill({name:'',category:'Development',level:3}); setShowSkillModal(false); notify('Skill added to your passport');
  };
  const signIn = async () => {
    if (!appwriteConfigured) { notify('Add your Appwrite project ID in .env.local to enable authentication'); return; }
    const email = window.prompt('Enter your Appwrite account email');
    const password = email ? window.prompt('Enter your password') : null;
    if (!email || !password) return;
    setAuthBusy(true);
    try { await account.createEmailPasswordSession({email,password}); const user=await account.get(); setAuthStatus('signed-in'); await loadProfile();
    await loadEvidence();
    notify(`Signed in as ${user.email}`); }
    catch (e) { notify(e instanceof Error ? e.message : 'Could not sign in. Check your Appwrite settings.'); }
    finally { setAuthBusy(false); }
  };
  const signOut = async () => { try { if (appwriteConfigured) await account.deleteSession({sessionId:'current'}); } catch { /* demo may not have a session */ } setAuthStatus(appwriteConfigured?'signed-out':'demo'); notify('Signed out'); };

  const renderHeader = (eyebrow: string, title: string, subtitle: string, action?: React.ReactNode) => <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-actions">{action}</div>}</div>;
  const renderOpportunity = (op: (typeof opportunities)[number], compact=false) => {
    const match = getMatch(op,skills); const isSaved=saved.includes(op.id); const app=applications.find(a=>a.opportunityId===op.id);
    return <article className={`opportunity-card ${compact?'compact':''}`} key={op.id}>
      <div className="opportunity-top"><div className={`org-mark ${op.color}`}>{op.logo}</div><button className={`icon-button save-button ${isSaved?'saved':''}`} aria-label={isSaved?'Unsave opportunity':'Save opportunity'} onClick={()=>toggleSave(op.id)}><Bookmark size={17} fill={isSaved?'currentColor':'none'}/></button></div>
      <div className="org-name">{op.organization}</div><h3>{op.title}</h3><div className="opportunity-meta"><span>{op.type}</span><span className="meta-dot"/><span>{op.location}</span></div>
      {!compact && <p className="opportunity-description">{op.description}</p>}
      <div className="match-block"><div className="match-label"><span><Sparkles size={13}/> Skill match</span><strong>{match}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${match}%`}}/></div></div>
      <div className="skill-tags">{op.skills.slice(0,3).map(s=><span className={`skill-tag ${skills.some(x=>x.name===s.name)?'matched':''}`} key={s.name}>{s.name}</span>)}{op.skills.length>3&&<span className="skill-tag">+{op.skills.length-3}</span>}</div>
      <div className="opportunity-footer"><span className="deadline"><span className="deadline-dot"/> Closes {op.deadline}</span><button className="text-action" onClick={()=>setSelectedOpportunity(op.id)}>View details <ArrowRight size={15}/></button></div>
      {app && <div className="application-note"><CheckCircle2 size={14}/> In tracker · {app.status}</div>}
    </article>;
  };

  return <div className="app-shell">
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={()=>setMobileNav(false)}/>}
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`}>
      <div className="brand"><div className="brand-icon"><Activity size={20}/></div><span>skillgraph<span className="brand-period">.</span></span><button className="close-mobile icon-button" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace-switcher"><div className="avatar avatar-small">{profile.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="workspace-copy"><strong>My workspace</strong><span>Free plan</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav">{pages.map(item=><button key={item.name} className={`nav-item ${page===item.name?'active':''}`} onClick={()=>{setPage(item.name);setMobileNav(false);}}><item.icon size={18}/><span>{item.name}</span>{item.name==='My applications'&&<span className="nav-count">{applications.length}</span>}</button>)}</nav>
      <div className="sidebar-divider"/><div className="nav-label">YOUR PROGRESS</div>
      <button className="nav-item" onClick={()=>{setPage('My skills');setMobileNav(false)}}><Target size={18}/><span>Skill gap roadmap</span><span className="new-label">NEW</span></button>
      <div className="sidebar-spacer"/>
      <div className="sidebar-tip"><div className="tip-icon"><Lightbulb size={17}/></div><strong>Small proof. Big progress.</strong><p>Add one piece of evidence today to make your profile stronger.</p><button onClick={()=>setShowEvidenceModal(true)}>Add evidence <ArrowRight size={14}/></button></div>
      <button className="nav-item settings-link" onClick={()=>setShowProfileModal(true)}><Settings2 size={18}/><span>Profile settings</span></button>
      <div className="sidebar-user"><div className="avatar">{profile.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div className="user-copy"><strong>{profile.name}</strong><span>{authStatus==='signed-in'?'Appwrite account':'Demo profile'}</span></div><button className="icon-button" title={authStatus==='signed-in'?'Sign out':'Sign in to Appwrite'} onClick={authStatus==='signed-in'?signOut:signIn} disabled={authBusy}>{authStatus==='signed-in'?<LogOut size={17}/>:<LockKeyhole size={17}/>}</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="topbar-right"><div className={`connection-pill ${appwriteConfigured?'configured':''}`}><span/>{appwriteConfigured?(authStatus==='signed-in'?'Appwrite connected':'Appwrite configured'):'Demo mode'}</div><button className="icon-button notification-button" title="Notifications" onClick={()=>notify('You are all caught up!')}><Bell size={18}/><i/></button><button className="avatar top-avatar" onClick={()=>setShowProfileModal(true)} title="Edit profile">{profile.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</button></div></header>
      <div className="content-area">
        {page==='Overview' && <>
          {renderHeader('SATURDAY, OCTOBER 24, 2026',`Good morning, ${profile.name.split(' ')[0]} 👋`,'Your next opportunity is closer than you think.',<button className="button button-primary" onClick={()=>setShowEvidenceModal(true)}><Plus size={16}/> Add evidence</button>)}
          <div className="welcome-banner"><div className="welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core"><Activity size={25}/></div><span className="orbit-node node-a"><Check size={12}/></span><span className="orbit-node node-b"><Zap size={12}/></span><span className="orbit-node node-c"><Target size={12}/></span></div><div className="welcome-copy"><div className="banner-kicker"><Sparkles size={14}/> YOUR SKILL STORY, IN MOTION</div><h2>Make your skills <em>count.</em></h2><p>Connect what you know to what you want to do next. Every project, certificate, and small win helps tell your story.</p><button className="banner-link" onClick={()=>setPage('My skills')}>Explore your skill passport <ArrowRight size={15}/></button></div><div className="banner-decoration">SG<span>.</span></div></div>
          <div className="section-heading"><div><h2>Your progress</h2><p>A little progress adds up to a lot.</p></div><button className="subtle-action" onClick={()=>setPage('My skills')}>View skill passport <ArrowRight size={15}/></button></div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span className="stat-icon purple"><Zap size={18}/></span><span className="stat-trend"><ArrowUpRight size={14}/> +2 this month</span></div><div className="stat-value">{skills.length}</div><div className="stat-label">Skills in your passport</div><div className="stat-bottom"><div className="mini-bars">{[24,34,27,45,40,58,49,66,53,75,61,82].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div><span>Keep building</span></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon green"><FileCheck2 size={18}/></span><span className="stat-trend positive"><CheckCircle2 size={13}/> Evidence linked</span></div><div className="stat-value">{evidence.length}</div><div className="stat-label">Pieces of evidence</div><div className="stat-bottom"><div className="mini-bars green-bars">{[30,45,38,60,48,68,60,76,66,85,75,95].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div><span>{evidence.filter(e=>e.status==='Evidence linked').length} with links</span></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon orange"><Target size={18}/></span><span className="stat-trend">Profile strength</span></div><div className="stat-value">{coverage}<small>%</small></div><div className="stat-label">Evidence-backed coverage</div><div className="stat-progress"><div className="progress-track"><div className="progress-fill orange-fill" style={{width:`${coverage}%`}}/></div><span>{coverage>=80?'Looking strong':coverage>=60?'Good momentum':'Room to grow'}</span></div></div>
            <div className="stat-card"><div className="stat-top"><span className="stat-icon blue"><BriefcaseBusiness size={18}/></span><span className="stat-trend">In progress</span></div><div className="stat-value">{activeApplications}</div><div className="stat-label">Active opportunities</div><div className="stat-bottom plain-bottom"><span className="status-bubble"><span/> {applications.filter(a=>a.status==='Applied').length} applied</span><button className="micro-link" onClick={()=>setPage('My applications')}>View tracker <ArrowRight size={13}/></button></div></div>
          </div>
          <div className="dashboard-columns"><section className="panel opportunities-panel"><div className="panel-heading"><div><h2>Picked for you</h2><p>Opportunities that fit your skills.</p></div><button className="icon-button" onClick={()=>setPage('Opportunities')} aria-label="See all opportunities"><ArrowUpRight size={18}/></button></div><div className="featured-list">{filteredOpportunities.slice(0,3).map(op=>{const match=getMatch(op,skills);return <div className="featured-opportunity" key={op.id}><div className={`org-mark ${op.color}`}>{op.logo}</div><div className="featured-main"><strong>{op.title}</strong><span>{op.organization} · {op.type}</span><div className="featured-match"><div className="progress-track"><div className="progress-fill" style={{width:`${match}%`}}/></div><span>{match}% match</span></div></div><button className="icon-button featured-arrow" onClick={()=>setSelectedOpportunity(op.id)}><ArrowRight size={17}/></button></div>})}</div><button className="panel-footer-action" onClick={()=>setPage('Opportunities')}>Explore all opportunities <ArrowRight size={15}/></button></section>
            <section className="panel evidence-panel"><div className="panel-heading"><div><h2>Recent evidence</h2><p>Proof behind your skills.</p></div><button className="icon-button" onClick={()=>setPage('Evidence library')} aria-label="Open evidence library"><ArrowUpRight size={18}/></button></div><div className="evidence-list">{evidence.slice(0,4).map(item=><div className="evidence-row" key={item.id}><div className={`evidence-icon ${item.type.toLowerCase()}`}>{item.type==='Project'?<Github size={17}/>:item.type==='Certificate'?<Award size={17}/>:<FileText size={17}/>}</div><div className="evidence-main"><strong>{item.title}</strong><span>{item.skill} · {item.date}</span></div><span className={`evidence-status ${item.status==='Evidence linked'?'linked':'self'}`}>{item.status==='Evidence linked'?<CheckCircle2 size={13}/>:<span className="status-dot"/>}{item.status==='Evidence linked'?'Linked':'Self'}</span></div>)}</div><button className="panel-footer-action" onClick={()=>setShowEvidenceModal(true)}>Add a new piece of evidence <Plus size={15}/></button></section></div>
          <div className="bottom-note"><div className="note-icon"><Lightbulb size={17}/></div><div><strong>Your next small win</strong><p>Add evidence for <b>{skills.find(s=>s.evidenceCount===0)?.name??'your next skill'}</b> to unlock a more accurate opportunity match.</p></div><button onClick={()=>setShowEvidenceModal(true)}>Add proof <ArrowRight size={14}/></button></div>
        </>}
        {page==='My skills' && <>{renderHeader('YOUR FOUNDATION','My skill passport','A living snapshot of what you know—and the proof behind it.',<button className="button button-primary" onClick={()=>setShowSkillModal(true)}><Plus size={16}/> Add a skill</button>)}<div className="skill-summary-card"><div className="skill-summary-icon"><Target size={23}/></div><div className="skill-summary-copy"><strong>{skills.filter(s=>s.evidenceCount>0).length} of {skills.length} skills have evidence</strong><span>Build trust by connecting projects, certificates, or assessments.</span></div><div className="skill-summary-score"><strong>{coverage}%</strong><span>coverage</span></div></div><div className="skill-section-head"><div><h2>All skills <span className="count-chip">{skills.length}</span></h2><p>Levels are self-assessed; evidence gives each skill more context.</p></div><button className="button button-secondary" onClick={()=>setShowEvidenceModal(true)}><Link2 size={15}/> Link evidence</button></div><div className="skills-grid">{skills.map(skill=><article className="skill-card" key={skill.id}><div className="skill-card-top"><div className="skill-symbol"><Zap size={18}/></div><span className="skill-category">{skill.category}</span><button className="dots-button" title="Remove skill" onClick={()=>{setSkills(current=>current.filter(s=>s.id!==skill.id));notify('Skill removed')}}>···</button></div><h3>{skill.name}</h3><div className="level-row"><span>Proficiency</span><strong>{['','Beginner','Developing','Proficient','Advanced','Expert'][skill.level]}</strong></div><div className="level-bars">{[1,2,3,4,5].map(n=><i key={n} className={n<=skill.level?'filled':''}/>)}</div><div className="skill-card-bottom"><span className={skill.evidenceCount?'evidence-count has-evidence':'evidence-count'}>{skill.evidenceCount?<CheckCircle2 size={14}/>:<CircleHelp size={14}/>} {skill.evidenceCount} evidence item{skill.evidenceCount===1?'':'s'}</span>{skill.verified&&<span className="verified-tag"><ShieldCheck size={13}/> Supported</span>}</div></article>)}</div><div className="roadmap-panel"><div className="roadmap-heading"><div className="roadmap-icon"><Lightbulb size={19}/></div><div><h2>Your next steps</h2><p>Small actions that can improve your opportunity matches.</p></div></div>{skills.filter(s=>s.evidenceCount===0).slice(0,2).map(s=><div className="roadmap-row" key={s.id}><span className="roadmap-number">0{s.id.slice(-1)}</span><div><strong>Add evidence for {s.name}</strong><p>Link a project, assessment, or public portfolio item.</p></div><button className="text-action" onClick={()=>{setNewEvidence(p=>({...p,skill:s.name}));setShowEvidenceModal(true)}}>Add evidence <ArrowRight size={14}/></button></div>)}</div></>}
        {page==='Opportunities' && <>{renderHeader('YOUR NEXT CHAPTER','Opportunity explorer','Find roles and programs that fit your demonstrated skills.',<div className="result-count"><Sparkles size={14}/> Ranked by skill match</div>)}<div className="search-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Search roles, organizations, skills..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch('')}><X size={15}/></button>}</div><div className="filter-select"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All types</option><option>Internship</option><option>Hackathon</option><option>Fellowship</option><option>Project sprint</option></select><ChevronDown size={14}/></div></div><div className="opportunity-results-heading"><span>{filteredOpportunities.length} opportunities</span><span>Best match first <ArrowDownRight size={14}/></span></div><div className="opportunity-grid">{filteredOpportunities.map(op=>renderOpportunity(op))}{filteredOpportunities.length===0&&<div className="empty-state"><Search size={25}/><h3>No matches yet</h3><p>Try another search or change your filters.</p><button className="button button-secondary" onClick={()=>{setSearch('');setFilter('All types')}}>Clear filters</button></div>}</div></>}
        {page==='My applications' && <>{renderHeader('KEEP MOVING FORWARD','My applications','One place to keep track of every opportunity you pursue.',<button className="button button-primary" onClick={()=>setPage('Opportunities')}><Plus size={16}/> Find opportunities</button>)}<div className="application-stats"><div><span>Saved</span><strong>{applications.filter(a=>a.status==='Saved').length}</strong></div><div><span>Applied</span><strong>{applications.filter(a=>a.status==='Applied').length}</strong></div><div><span>Interviews</span><strong>{applications.filter(a=>a.status==='Interview').length}</strong></div><div><span>Accepted</span><strong>{applications.filter(a=>a.status==='Accepted').length}</strong></div></div><section className="panel application-table-panel"><div className="table-heading"><div><h2>Application tracker</h2><p>Update statuses as you make progress.</p></div><span className="count-chip">{applications.length} total</span></div>{applications.length===0?<div className="empty-state"><BriefcaseBusiness size={26}/><h3>Your next chapter starts here</h3><p>Save an opportunity to begin tracking it.</p><button className="button button-primary" onClick={()=>setPage('Opportunities')}>Explore opportunities</button></div>:<div className="table-scroll"><table><thead><tr><th>Opportunity</th><th>Type</th><th>Match</th><th>Status</th><th>Updated</th><th/></tr></thead><tbody>{applications.map(app=>{const op=opportunities.find(o=>o.id===app.opportunityId);if(!op)return null;return <tr key={app.id}><td><div className="table-op"><div className={`org-mark tiny ${op.color}`}>{op.logo}</div><div><strong>{op.title}</strong><span>{op.organization}</span></div></div></td><td>{op.type}</td><td><span className="table-match">{getMatch(op,skills)}%</span></td><td><select className={`status-select status-${app.status.toLowerCase()}`} value={app.status} onChange={e=>setApplications(current=>current.map(a=>a.id===app.id?{...a,status:e.target.value as Application['status'],updatedAt:'Today'}:a))}><option>Saved</option><option>Applied</option><option>Interview</option><option>Accepted</option><option>Rejected</option></select></td><td>{app.updatedAt}</td><td><button className="icon-button" title="View opportunity" onClick={()=>setSelectedOpportunity(op.id)}><ArrowUpRight size={16}/></button></td></tr>})}</tbody></table></div>}</section></>}
        {page==='Evidence library' && <>{renderHeader('PROOF OF YOUR PROGRESS','Evidence library','Projects, certificates, and assessments that make your skills tangible.',<button className="button button-primary" onClick={()=>setShowEvidenceModal(true)}><Plus size={16}/> Add evidence</button>)}<div className="evidence-library-summary"><div className="library-summary-icon"><FileBadge2 size={21}/></div><div><strong>{evidence.length} pieces of evidence</strong><span>Linked to {new Set(evidence.map(e=>e.skill)).size} distinct skills</span></div><div className="library-summary-right"><strong>{evidence.filter(e=>e.status==='Evidence linked').length}</strong><span>with supporting links</span></div></div><div className="library-list">{evidence.map(item=><article className="library-item" key={item.id}><div className={`evidence-icon large ${item.type.toLowerCase()}`}>{item.type==='Project'?<Github size={20}/>:item.type==='Certificate'?<Award size={20}/>:<FileText size={20}/>}</div><div className="library-item-main"><div className="library-item-title"><h3>{item.title}</h3><span className={`evidence-status ${item.status==='Evidence linked'?'linked':'self'}`}>{item.status==='Evidence linked'?<CheckCircle2 size={13}/>:<span className="status-dot"/>}{item.status}</span></div><p>{item.type} · {item.skill} · Added {item.date}</p>{item.url&&<a href={item.url} target="_blank" rel="noreferrer" className="evidence-url"><ExternalLink size={13}/> Open supporting link</a>}</div><button className="icon-button" title="Remove evidence" onClick={()=>{setEvidence(current=>current.filter(e=>e.id!==item.id));setSkills(current=>current.map(s=>s.name===item.skill?{...s,evidenceCount:Math.max(0,s.evidenceCount-1)}:s));notify('Evidence removed')}}><X size={16}/></button></article>)}</div></>}
      </div>
      <footer className="app-footer"><span>© 2026 SkillGraph</span><span><span className="footer-live"/> Your progress is yours to own.</span><button onClick={()=>notify('Help center coming soon')}>Help & feedback <ArrowUpRight size={13}/></button></footer>
    </main>

    {activeOpportunity && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOpportunity(null)}}><section className="modal opportunity-modal"><button className="modal-close icon-button" onClick={()=>setSelectedOpportunity(null)}><X size={18}/></button><div className={`org-mark modal-org ${activeOpportunity.color}`}>{activeOpportunity.logo}</div><div className="modal-eyebrow">{activeOpportunity.organization} · {activeOpportunity.type}</div><h2>{activeOpportunity.title}</h2><p className="modal-description">{activeOpportunity.description}</p><div className="detail-meta"><span><Compass size={15}/>{activeOpportunity.location}</span><span><Activity size={15}/>Closes {activeOpportunity.deadline}</span></div><div className="modal-match"><div className="modal-match-top"><div><span className="modal-eyebrow">YOUR SKILL MATCH</span><strong>{getMatch(activeOpportunity,skills)}%</strong></div><div className="match-badge"><Sparkles size={14}/> Good potential</div></div><div className="progress-track"><div className="progress-fill" style={{width:`${getMatch(activeOpportunity,skills)}%`}}/></div><p>Based on your current skill passport and available evidence. This is a requirements-coverage estimate, not a hiring probability.</p></div><h3 className="requirements-title">Skills this opportunity needs</h3><div className="requirements-list">{activeOpportunity.skills.map(s=>{const found=skills.find(x=>x.name===s.name);return <div className="requirement-row" key={s.name}><span className={`requirement-icon ${found?'requirement-met':''}`}>{found?<Check size={14}/>:<Plus size={14}/>}</span><div className="requirement-main"><strong>{s.name}</strong><span>{found?(found.evidenceCount?'Evidence in your passport':'Added to your passport · no evidence yet'):'Not in your passport yet'}</span></div><span className={`requirement-priority ${s.required?'required':'preferred'}`}>{s.required?'Required':'Preferred'}</span></div>})}</div><div className="modal-actions"><button className="button button-secondary" onClick={()=>toggleSave(activeOpportunity.id)}><Bookmark size={15} fill={saved.includes(activeOpportunity.id)?'currentColor':'none'}/>{saved.includes(activeOpportunity.id)?'Saved':'Save for later'}</button><button className="button button-primary" onClick={()=>{applyToOpportunity(activeOpportunity.id);setSelectedOpportunity(null)}}>Track application <ArrowRight size={16}/></button></div><div className="demo-data-note"><CircleHelp size={14}/> Demo opportunity data for prototyping. Replace with verified listings before launch.</div></section></div>}
    {showEvidenceModal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowEvidenceModal(false)}}><section className="modal form-modal"><button className="modal-close icon-button" onClick={()=>setShowEvidenceModal(false)}><X size={18}/></button><div className="form-modal-icon"><FileCheck2 size={21}/></div><div className="modal-eyebrow">SHOW YOUR WORK</div><h2>Add evidence</h2><p className="modal-description">Connect something you've built or learned to a skill in your passport.</p><form onSubmit={e=>{e.preventDefault();void addEvidence()}}><label>Evidence title<input autoFocus placeholder="e.g. Built a student expense tracker" value={newEvidence.title} onChange={e=>setNewEvidence(p=>({...p,title:e.target.value}))} required/></label><div className="form-two"><label>Evidence type<select value={newEvidence.type} onChange={e=>setNewEvidence(p=>({...p,type:e.target.value as Evidence['type']}))}><option>Project</option><option>Certificate</option><option>Assessment</option></select></label><label>Related skill<select value={newEvidence.skill} onChange={e=>setNewEvidence(p=>({...p,skill:e.target.value}))}>{skills.map(s=><option key={s.id}>{s.name}</option>)}</select></label></div><label>Supporting link <span className="optional-label">Optional</span><input type="url" placeholder="https://github.com/you/project" value={newEvidence.url} onChange={e=>setNewEvidence(p=>({...p,url:e.target.value}))}/><small>Add a public project, portfolio, or certificate URL. A link is not independently verified.</small></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setShowEvidenceModal(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15}/> Add to passport</button></div></form></section></div>}
    {showSkillModal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSkillModal(false)}}><section className="modal form-modal"><button className="modal-close icon-button" onClick={()=>setShowSkillModal(false)}><X size={18}/></button><div className="form-modal-icon"><Zap size={21}/></div><div className="modal-eyebrow">GROW YOUR PASSPORT</div><h2>Add a skill</h2><p className="modal-description">Start with an honest self-assessment. You can add evidence at any time.</p><form onSubmit={e=>{e.preventDefault();addSkill()}}><label>Skill name<input autoFocus placeholder="e.g. Python, Public speaking" value={newSkill.name} onChange={e=>setNewSkill(p=>({...p,name:e.target.value}))} required/></label><label>Category<select value={newSkill.category} onChange={e=>setNewSkill(p=>({...p,category:e.target.value}))}><option>Development</option><option>Data</option><option>Design</option><option>Product</option><option>Professional</option><option>Business</option></select></label><label>Self-assessed level <strong className="range-value">{['','Beginner','Developing','Proficient','Advanced','Expert'][newSkill.level]}</strong><input className="range-input" type="range" min="1" max="5" value={newSkill.level} onChange={e=>setNewSkill(p=>({...p,level:Number(e.target.value)}))}/><div className="range-labels"><span>Beginner</span><span>Expert</span></div></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setShowSkillModal(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15}/> Add skill</button></div></form></section></div>}
    {showProfileModal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfileModal(false)}}><section className="modal form-modal"><button className="modal-close icon-button" onClick={()=>setShowProfileModal(false)}><X size={18}/></button><div className="form-modal-icon"><Users size={21}/></div><div className="modal-eyebrow">MAKE IT YOURS</div><h2>Profile settings</h2><p className="modal-description">Set how your skill story appears in SkillGraph.</p><form onSubmit={e=>{e.preventDefault();void saveProfile();}}><label>Display name<input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} required/></label><label>Headline<input value={profile.headline} onChange={e=>setProfile(p=>({...p,headline:e.target.value}))}/></label><label>About you<textarea rows={3} value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/></label><label className="checkbox-label"><input type="checkbox" checked={profile.publicProfile} onChange={e=>setProfile(p=>({...p,publicProfile:e.target.checked}))}/> Allow my profile to be public when public profiles are enabled</label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setShowProfileModal(false)}>Cancel</button><button type="submit" className="button button-primary">Save changes</button></div></form><div className="signin-hint"><LockKeyhole size={14}/> {appwriteConfigured?'Sign in to enable Appwrite-backed profile persistence.':'Demo changes stay in this session until you connect Appwrite.'} <button onClick={signIn}>{authStatus==='signed-in'?'Account connected':'Connect account'}</button></div></section></div>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

export default App;
