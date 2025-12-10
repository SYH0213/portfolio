const container = document.getElementById('snap-container');
const panels = Array.from(container?.querySelectorAll('.panel') || []);
const sideNavItems = Array.from(document.querySelectorAll('.side-nav-item'));
const MIN_SWIPE_DISTANCE = 40;

let currentIndex = 0;
let isLocked = false;
let touchStartY = null;
let lastWheelTime = 0;
const WHEEL_COOLDOWN = 800;

const clampIndex = index => Math.min(Math.max(index, 0), panels.length - 1);

const updateSideNav = index => {
  if (!sideNavItems.length) return;
  sideNavItems.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
};

const fadeToPanel = targetIndex => {
  if (!container || !panels.length) return;
  if (targetIndex === currentIndex) return;
  if (targetIndex < 0 || targetIndex >= panels.length) return;
  if (isLocked) return;

  isLocked = true;
  const currentPanel = panels[currentIndex];
  const nextPanel = panels[targetIndex];

  const handleFadeOutEnd = event => {
    if (event.target !== currentPanel || event.propertyName !== 'opacity') return;
    currentPanel.removeEventListener('transitionend', handleFadeOutEnd);
    currentPanel.classList.remove('transitioning');
    currentPanel.classList.remove('active');

    currentIndex = targetIndex;
    updateSideNav(currentIndex);

    const handleFadeInEnd = fadeEvent => {
      if (fadeEvent.target !== nextPanel || fadeEvent.propertyName !== 'opacity') return;
      nextPanel.removeEventListener('transitionend', handleFadeInEnd);
      isLocked = false;
    };

    nextPanel.addEventListener('transitionend', handleFadeInEnd);
    nextPanel.classList.add('active');
  };

  currentPanel.addEventListener('transitionend', handleFadeOutEnd);
  currentPanel.classList.add('transitioning');
};

const attemptDirectionMove = direction => {
  if (direction > 0) {
    fadeToPanel(clampIndex(currentIndex + 1));
  } else if (direction < 0) {
    fadeToPanel(clampIndex(currentIndex - 1));
  }
};

const wheelHandler = event => {
  if (!panels.length) return;
  event.preventDefault();

  const now = Date.now();
  if (now - lastWheelTime < WHEEL_COOLDOWN) {
    return;
  }
  lastWheelTime = now;

  if (isLocked) return;
  const direction = Math.sign(event.deltaY);
  if (direction === 0) return;
  attemptDirectionMove(direction);
};

const touchStartHandler = event => {
  if (isLocked) {
    touchStartY = null;
    return;
  }
  touchStartY = event.touches[0].clientY;
};

const touchEndHandler = event => {
  if (touchStartY === null) return;
  const touchEndY = event.changedTouches[0].clientY;
  const delta = touchStartY - touchEndY;
  touchStartY = null;
  if (Math.abs(delta) < MIN_SWIPE_DISTANCE) return;
  event.preventDefault();
  if (isLocked) return;
  attemptDirectionMove(Math.sign(delta));
};

const keyHandler = event => {
  if (!panels.length) return;
  const keysDown = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
  const keysUp = ['ArrowUp', 'PageUp'];
  let direction = 0;
  if (keysDown.includes(event.key)) {
    direction = 1;
  } else if (keysUp.includes(event.key)) {
    direction = -1;
  }
  if (direction === 0) return;
  event.preventDefault();
  if (isLocked) return;
  attemptDirectionMove(direction);
};

const bindSideNav = () => {
  if (!sideNavItems.length) return;
  sideNavItems.forEach(item => {
    const index = Number(item.dataset.index);
    item.addEventListener('click', event => {
      event.preventDefault();
      if (Number.isNaN(index)) return;
      if (isLocked) return;
      fadeToPanel(index);
    });
  });
};

const init = () => {
  if (!container || !panels.length) return;
  panels.forEach((panel, index) => {
    panel.classList.toggle('active', index === 0);
  });
  updateSideNav(0);
  window.addEventListener('wheel', wheelHandler, { passive: false });
  window.addEventListener('touchstart', touchStartHandler, { passive: true });
  window.addEventListener('touchend', touchEndHandler, { passive: false });
  window.addEventListener('keydown', keyHandler, { passive: false });
  bindSideNav();
};

init();

const yearElement = document.getElementById('year');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
