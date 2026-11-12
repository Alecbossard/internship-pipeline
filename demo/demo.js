'use strict';

const offers = [
  { company: 'Juniper Robotics Lab', initials: 'JR', role: 'Robotics Software Intern', location: 'Toulouse, France', duration: '6 months', mission: 'Build and evaluate a perception module for a mobile robot. Connect camera streams to a ROS 2 simulation and document failure cases.', requirements: 'Sample requirements include Python, ROS 2 and an interest in robot perception.' },
  { company: 'Kestrel Systems Studio', initials: 'KS', role: 'Applied AI Engineering Intern', location: 'Lausanne, Switzerland', duration: '5 months', mission: 'Build a tool-using assistant and evaluate how it handles incomplete evidence and tool errors.', requirements: 'Sample requirements include Python, API integration and an interest in LLM evaluation.' },
  { company: 'Alder Mobility Research', initials: 'AM', role: 'Simulation Engineering Intern', location: 'Lyon, France', duration: '6 months', mission: 'Prototype a scenario generator for testing autonomous navigation in simulation.', requirements: 'Sample requirements include Python, simulation and software testing.' },
];

const byId = (id) => document.getElementById(id);
const card = byId('card');
const dialog = byId('dialog');
let position = 0;
let saved = 0;
let application = null;
let stageIndex = 0;
let approvalOffer = null;
let gesture = null;
let events = [];

const phases = ['Verify offer', 'Draft documents', 'Independent review', 'Submit application', 'Check receipt'];
const stages = [
  { phase: 0, status: 'Checking the offer', title: 'Source verification', text: 'The verification worker opens the original posting and checks the role, employer and application link before document preparation starts.', next: 'Verify sample posting', event: 'Application approved. Offer verification queued.' },
  { phase: 1, status: 'Preparing résumé and letter', title: 'Original posting verified', text: 'The source worker matched the posting and captured its visible text. The drafting worker uses this snapshot and the fictional candidate profile.', evidence: 'posting', next: 'Prepare sample documents', event: 'Original posting checked and captured.' },
  { phase: 2, status: 'Independent review', title: 'Draft documents ready', text: 'The writer produced a résumé and cover letter for this role. A separate worker checks the claims against the candidate profile and the source posting.', evidence: 'draft', next: 'Run sample review', event: 'Draft résumé and cover letter prepared.' },
  { phase: 2, status: 'Correction requested', title: 'Review found an unsupported claim', text: 'The draft says the candidate deployed the module on a robot. The fictional profile supports simulation work. The reviewer asks the writer to correct that line.', next: 'Apply correction', event: 'Reviewer requested a correction to the résumé.' },
  { phase: 2, status: 'Reviewing corrected documents', title: 'Correction ready for review', text: 'The corrected résumé now describes the work performed in simulation. The independent reviewer checks the revised version.', evidence: 'corrected', next: 'Verify corrected documents', event: 'Writer corrected the unsupported claim.' },
  { phase: 3, status: 'Ready for submission', title: 'Review passed', text: 'The service records the hashes of the reviewed résumé and cover letter and checks them before the browser worker can use the files.', evidence: 'corrected', next: 'Open sample employer form', event: 'Independent review passed. Document hashes recorded.' },
  { phase: 3, status: 'Waiting for your answer', title: 'Application paused', text: 'The browser worker reached a form question that needs the candidate’s confirmation. The dossier stays at this step until the answer is recorded.', event: 'Employer form asked for confirmation of on-site availability.' },
  { phase: 3, status: 'Answer saved · ready to resume', title: 'Candidate answer recorded', text: 'The browser worker resumes the approved application with the saved answer and the reviewed files.', next: 'Submit sample application', event: 'Candidate confirmed sample availability.' },
  { phase: 4, status: 'Application sent · checking email', title: 'Portal confirmation recorded', text: 'The portal acknowledged the submission. The receipt worker now checks for a matching confirmation email for this exact role and attempt.', next: 'Check sample email receipt', event: 'Portal acknowledged the submission.' },
  { phase: 4, status: 'Application sent · receipt confirmed', title: 'Matching email receipt', text: 'The confirmation email matched the employer, role and reference. The receipt is available in the dossier.', evidence: 'receipt', event: 'Matching email receipt saved to the dossier.' },
];

const views = {
  offers: ['Good leads.', 'Review an offer and follow it through to the application receipt.'],
  applications: ['Taking shape.', 'Follow the documents, review and submission for your approved offer.'],
  activity: ['Behind the scenes.', 'See which worker is responsible for each step and what happened in this dossier.'],
};

function showView(focus = false) {
  const requested = location.hash.slice(1);
  const view = Object.hasOwn(views, requested) ? requested : 'offers';
  for (const name of Object.keys(views)) byId(name).hidden = name !== view;
  for (const link of document.querySelectorAll('[data-view]')) {
    if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  [byId('page-title').textContent, byId('page-description').textContent] = views[view];
  if (focus) byId('page-title').focus();
}

function renderProgress() {
  byId('dossier').hidden = !application;
  byId('application-empty').hidden = Boolean(application);
  const stage = application ? stages[stageIndex] : null;
  const done = stageIndex === stages.length - 1;
  byId('agents').replaceChildren(...phases.map((phase, index) => {
    const row = document.createElement('li');
    const status = stage?.phase === index && !done ? (stageIndex === 6 ? 'Waiting for answer' : stage.status) : 'Idle';
    row.textContent = `${phase} · ${status}`;
    return row;
  }));
  const entries = events.length ? [...events].reverse() : ['Approve an offer to start the activity log.'];
  byId('log').replaceChildren(...entries.map(text => {
    const row = document.createElement('li');
    row.textContent = text;
    return row;
  }));
  if (!stage) return;

  byId('dossier-company').textContent = application.company;
  byId('dossier-title').textContent = application.role;
  byId('dossier-location').textContent = `${application.location} · ${application.duration}`;
  byId('dossier-status').textContent = stage.status;
  byId('timeline').replaceChildren(...phases.map((phase, index) => {
    const item = document.createElement('li');
    item.textContent = phase;
    item.dataset.state = done || index < stage.phase ? 'done' : index === stage.phase ? 'current' : 'pending';
    if (item.dataset.state === 'current') item.setAttribute('aria-current', 'step');
    return item;
  }));
  byId('evidence-title').textContent = stage.title;
  byId('evidence-text').textContent = stage.text;
  byId('view-evidence').hidden = !stage.evidence;
  byId('view-evidence').textContent = stage.evidence === 'posting' ? 'Read captured source ↗' : stage.evidence === 'receipt' ? 'Read sample receipt ↗' : 'Preview sample documents ↗';
  byId('question').hidden = stageIndex !== 6;
  byId('demo-controls').hidden = !stage.next;
  byId('next').textContent = stage.next || '';
}

function step() {
  stageIndex += 1;
  const stage = stages[stageIndex];
  events.push(stage.event);
  byId('feedback').textContent = '';
  renderProgress();
  if (stageIndex === 6) byId('answer').focus();
  if (stageIndex === stages.length - 1) byId('view-evidence').focus();
}

function render() {
  const offer = offers[position];
  card.hidden = !offer;
  byId('empty').hidden = Boolean(offer);
  byId('remaining').textContent = offers.length - position;
  byId('queue-label').textContent = `${offers.length - position} offers to review`;
  byId('saved-label').textContent = `${saved} saved for later`;
  byId('application-count').textContent = application ? '1' : '0';
  byId('apply').disabled = Boolean(application);
  renderProgress();
  if (!offer) return;
  byId('monogram').textContent = offer.initials;
  for (const field of ['company', 'role', 'location', 'duration', 'mission']) {
    byId(field).textContent = offer[field];
  }
}

function advance(message) {
  position += 1;
  byId('feedback').textContent = message;
  render();
  (card.hidden ? byId('reset') : byId('details')).focus({ preventScroll: true });
}

function openDialog(title, text, offer = null) {
  if (dialog.open) return;
  approvalOffer = offer;
  dialog.returnValue = 'cancel';
  byId('dialog-title').textContent = title;
  byId('dialog-text').textContent = text;
  byId('confirm').hidden = !offer;
  byId('cancel').textContent = offer ? 'Back to offer' : 'Close';
  dialog.showModal();
  byId('cancel').focus();
}

function showDialog(approval) {
  const offer = offers[position];
  if (!offer || (approval && application)) return;
  if (approval) openDialog('Approve this offer?', `Approve the sample application for ${offer.role} at ${offer.company}. The workflow checks the original posting, drafts and reviews the documents, then proceeds to submission.`, offer);
  else openDialog(offer.role, `${offer.mission} ${offer.requirements}`);
}

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'approve' && approvalOffer && approvalOffer === offers[position] && !application) {
    application = approvalOffer;
    events.push(stages[0].event);
    advance('Approval recorded. Follow this dossier in Applications.');
    location.hash = 'applications';
  }
  approvalOffer = null;
});

byId('details').addEventListener('click', () => showDialog(false));
byId('apply').addEventListener('click', () => showDialog(true));
byId('dismiss').addEventListener('click', () => advance('Offer dismissed.'));
byId('later').addEventListener('click', () => {
  saved += 1;
  advance('Offer saved for later.');
});
byId('reset').addEventListener('click', () => {
  position = saved = stageIndex = 0;
  application = null;
  events = [];
  location.hash = 'offers';
  byId('feedback').textContent = 'Walkthrough restarted.';
  render();
});
byId('next').addEventListener('click', () => { if (application && stages[stageIndex].next) step(); });
byId('answer').addEventListener('click', () => { if (application && stageIndex === 6) { step(); byId('next').focus(); } });
byId('view-evidence').addEventListener('click', () => {
  const kind = stages[stageIndex].evidence;
  if (kind === 'posting') openDialog('Captured sample posting', `${application.role} · ${application.company}\n${application.location} · ${application.duration}\n\n${application.mission}\n${application.requirements}`);
  if (kind === 'draft' || kind === 'corrected') {
    const bullet = kind === 'draft' ? 'Deployed a prototype on a physical robot.' : 'Implemented and evaluated a prototype in simulation.';
    openDialog('Sample document excerpts', `Résumé\n${bullet}\n\nCover letter\nI am applying for the ${application.role} position. My simulation project gave me practical experience prototyping and evaluating technical systems.`);
  }
  if (kind === 'receipt') openDialog('Sample confirmation email', `From: ${application.company} recruiting\nSubject: Application received — ${application.role}\nReference: DEMO-2027-001\n\nThank you for applying. We have received your application.`);
});
window.addEventListener('hashchange', () => showView(true));

card.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest('button')) return;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
});
card.addEventListener('pointermove', (event) => {
  if (gesture?.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.horizontal) {
    if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx)) gesture = null;
    if (!gesture || Math.abs(dx) < 12 || Math.abs(dx) < 1.35 * Math.abs(dy)) return;
    gesture.horizontal = true;
    card.setPointerCapture(event.pointerId);
    card.classList.add('dragging');
  }
  card.style.transform = `translateX(${Math.max(-110, Math.min(dx, 110))}px)`;
});
function endGesture(event) {
  if (gesture?.id !== event.pointerId) return;
  const { x, y, horizontal } = gesture;
  gesture = null;
  card.classList.remove('dragging');
  card.style.removeProperty('transform');
  const dx = event.clientX - x;
  if (event.type !== 'pointerup' || !horizontal || Math.abs(dx) < 85 || Math.abs(dx) < 1.35 * Math.abs(event.clientY - y)) return;
  if (dx > 0) showDialog(true);
  else advance('Offer dismissed.');
}
card.addEventListener('pointerup', endGesture);
card.addEventListener('pointercancel', endGesture);
card.addEventListener('lostpointercapture', (event) => {
  if (event.target === card) endGesture(event);
});

render();
showView();
