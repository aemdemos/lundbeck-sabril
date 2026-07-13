import { moveInstrumentation } from '../../scripts/scripts.js';

function getScrollOffset() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--accordion-expand-scroll-offset')
    .trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 40;
}

function getScrollDuration() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--accordion-expand-scroll-duration')
    .trim();
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 500;
}

function scrollAccordionItemIntoView(item) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offset = getScrollOffset();
  const scrollTarget = () => item.getBoundingClientRect().top + window.scrollY - offset;

  if (reduce) {
    window.scrollTo({ top: scrollTarget(), behavior: 'auto' });
    return;
  }

  const duration = getScrollDuration();
  const start = window.scrollY;
  const target = scrollTarget();
  const distance = target - start;

  if (Math.abs(distance) < 1) {
    return;
  }

  let startTime;
  const step = (timestamp) => {
    if (startTime === undefined) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    window.scrollTo({ top: start + distance * eased, behavior: 'auto' });
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

const EXPAND_LABEL_PATTERN = /^expand$/i;
const COLLAPSE_LABEL = 'Collapse';
const GLYPH_EXPAND = 'glyphicon-plus-sign';
const GLYPH_COLLAPSE = 'glyphicon-minus-sign';

/**
 * @param {string} label
 * @returns {string}
 */
function formatExpandLabel(label) {
  if (!label) return 'Expand';
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

/**
 * @param {HTMLElement} icon
 * @param {boolean} isExpanded
 */
function setToggleIcon(icon, isExpanded) {
  icon.classList.remove(GLYPH_EXPAND, GLYPH_COLLAPSE);
  icon.classList.add(isExpanded ? GLYPH_COLLAPSE : GLYPH_EXPAND);
}

/**
 * @param {string} expandLabel
 * @returns {HTMLButtonElement}
 */
function createExpandToggle(expandLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'accordion-expand-item-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.dataset.expandLabel = expandLabel;

  const icon = document.createElement('span');
  icon.className = `accordion-expand-item-toggle-icon glyphicon ${GLYPH_EXPAND}`;
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'accordion-expand-item-toggle-text';
  text.textContent = expandLabel;

  button.append(icon, text);
  return button;
}

/**
 * @param {HTMLButtonElement} button
 * @param {boolean} isExpanded
 */
function updateExpandToggle(button, isExpanded) {
  button.setAttribute('aria-expanded', String(isExpanded));
  const expandLabel = button.dataset.expandLabel || 'Expand';
  const icon = button.querySelector('.accordion-expand-item-toggle-icon');
  const text = button.querySelector('.accordion-expand-item-toggle-text');
  if (icon) setToggleIcon(icon, isExpanded);
  if (text) text.textContent = isExpanded ? COLLAPSE_LABEL : expandLabel;
}

/**
 * @param {Element} label
 * @returns {boolean}
 */
function isExpandOnlyLabel(label) {
  return EXPAND_LABEL_PATTERN.test(label.textContent.trim());
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'accordion-expand-item';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    const [label, body] = [...li.children];
    let expandToggle = null;

    if (label !== null && label !== undefined) {
      label.className = 'accordion-expand-item-label';

      if (isExpandOnlyLabel(label)) {
        const expandLabel = formatExpandLabel(label.textContent.trim());
        li.classList.add('accordion-expand-item--toggle');
        expandToggle = createExpandToggle(expandLabel);
        label.remove();
        li.append(expandToggle);
      }
    }

    if (body !== null && body !== undefined) body.className = 'accordion-expand-item-body';

    if (expandToggle) {
      expandToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = li.classList.toggle('active');
        updateExpandToggle(expandToggle, isExpanded);
        scrollAccordionItemIntoView(li);
      });
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
