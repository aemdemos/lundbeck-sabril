import { moveInstrumentation } from '../../scripts/scripts.js';

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
        li.classList.add('accordion-expand-item-has-toggle');
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
      });
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
