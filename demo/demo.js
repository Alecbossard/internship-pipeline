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
let approved = 0;
let approvalOffer = null;
let gesture = null;

function render() {
  const offer = offers[position];
  card.hidden = !offer;
  byId('empty').hidden = Boolean(offer);
  byId('remaining').textContent = offers.length - position;
  byId('saved').textContent = saved;
  byId('approved').textContent = approved;
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

function showDialog(approval) {
  const offer = offers[position];
  if (!offer || dialog.open) return;
  approvalOffer = approval ? offer : null;
  dialog.returnValue = 'cancel';
  byId('dialog-title').textContent = approval ? 'Approve this offer?' : offer.role;
  byId('dialog-text').textContent = approval
    ? `Simulate approval for ${offer.role} at ${offer.company}. The next stage in the real workflow checks the original posting.`
    : `${offer.mission} ${offer.requirements}`;
  byId('confirm').hidden = !approval;
  dialog.showModal();
  byId('cancel').focus();
}

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'approve' && approvalOffer === offers[position]) {
    approved += 1;
    advance('Approval recorded in the demo. Next stage in the live workflow is source verification.');
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
  position = saved = approved = 0;
  byId('feedback').textContent = 'Demo restarted. Choose what happens to the offer on the card.';
  render();
});

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
