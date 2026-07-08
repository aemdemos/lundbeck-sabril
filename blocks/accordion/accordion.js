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
  button.className = 'accordion-item-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.dataset.expandLabel = expandLabel;

  const icon = document.createElement('span');
  icon.className = `accordion-item-toggle-icon glyphicon ${GLYPH_EXPAND}`;
  icon.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'accordion-item-toggle-text';
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
  const icon = button.querySelector('.accordion-item-toggle-icon');
  const text = button.querySelector('.accordion-item-toggle-text');
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

/**
 * @param {Element} label
 */
function decorateLeadDetailLabel(label) {
  const labelText = label.querySelector('p') || label;
  const lead = labelText.querySelector(':scope > strong, :scope > b');
  if (!lead || !lead.nextSibling) return;

  const detail = document.createElement('span');
  detail.className = 'accordion-item-label-detail';
  let node = lead.nextSibling;
  while (node) {
    const next = node.nextSibling;
    detail.append(node);
    node = next;
  }
  if (detail.textContent.trim()) labelText.append(detail);
}

export default function decorate(block) {
  const isExpandVariant = block.classList.contains('expand');
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'accordion-item';
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    const [label, body] = [...li.children];
    let expandToggle = null;

    if (label !== null && label !== undefined) {
      label.className = 'accordion-item-label';

      if (isExpandVariant && isExpandOnlyLabel(label)) {
        const expandLabel = formatExpandLabel(label.textContent.trim());
        li.classList.add('accordion-item--expand-toggle');
        expandToggle = createExpandToggle(expandLabel);
        label.remove();
        li.append(expandToggle);
      } else if (!isExpandVariant) {
        // Convention: author bolds the lead phrase; the remaining inline content
        // becomes the "detail", which is collapsed on mobile and revealed on tablet up.
        decorateLeadDetailLabel(label);
      }
    }

    if (body !== null && body !== undefined) body.className = 'accordion-item-body';

    if (expandToggle) {
      expandToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = li.classList.toggle('active');
        updateExpandToggle(expandToggle, isExpanded);
      });
    } else {
      // The whole card toggles the item; clicks inside the open body are ignored
      // so links stay clickable and body text stays selectable.
      li.addEventListener('click', (e) => {
        if (body && body.contains(e.target)) return;
        li.classList.toggle('active');
      });
    }

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
