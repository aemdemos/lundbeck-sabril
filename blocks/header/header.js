import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 768px)');

function closeAllDropdowns(nav) {
  nav.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav) closeAllDropdowns(nav);
  }
}

function closeOnClickOutside(e) {
  const nav = document.getElementById('nav');
  if (nav && !nav.contains(e.target)) closeAllDropdowns(nav);
}

/**
 * Decorates a secondary nav section (utility links, tools, ISI/social, etc.)
 * generically by preserving its authored content. Used for every section after
 * the brand row and the main menu, so re-authored documents render without the
 * header needing to know each section's exact purpose.
 * @param {Element} section A section from the nav fragment
 * @param {number} index The section's position (used for a stable class)
 * @returns {HTMLElement} decorated section
 */
function decorateUtilitySection(section, index) {
  const bar = document.createElement('div');
  bar.className = `nav-utility nav-utility-${index}`;

  [...section.children].forEach((child) => bar.append(child.cloneNode(true)));

  return bar;
}

/**
 * Decorates the brand row: logo + hamburger toggle.
 * @param {Element} section The brand section from the nav fragment
 * @returns {HTMLElement} decorated brand row
 */
function decorateBrandRow(section) {
  const row = document.createElement('div');
  row.className = 'nav-brand-row';

  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const logoLink = section.querySelector('a');
  if (logoLink) {
    const clone = logoLink.cloneNode(true);
    clone.className = 'nav-brand-link';
    brand.append(clone);
  }
  row.append(brand);

  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  const hamburgerLabel = document.createElement('span');
  hamburgerLabel.className = 'nav-hamburger-label';
  hamburgerLabel.textContent = 'MENU';
  hamburger.append(hamburgerLabel);
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburgerLabel.textContent = expanded ? 'MENU' : 'X';
    const nav = hamburger.closest('nav');
    if (nav) nav.classList.toggle('nav-mobile-open', !expanded);
  });
  row.append(hamburger);

  return row;
}

/**
 * Decorates the main navigation row (green button bar with one dropdown).
 * @param {Element} section The main-nav section from the nav fragment
 * @returns {HTMLElement} decorated nav links row
 */
function decorateNavLinks(section) {
  const row = document.createElement('div');
  row.className = 'nav-links-row';

  const ul = section.querySelector('ul');
  if (!ul) return row;

  const list = ul.cloneNode(true);
  list.className = 'nav-links-list';

  list.querySelectorAll(':scope > li').forEach((li) => {
    li.classList.add('nav-item');
    const subUl = li.querySelector('ul');
    if (subUl) {
      li.classList.add('nav-drop');
      li.setAttribute('aria-expanded', 'false');
      subUl.className = 'nav-dropdown-menu';

      // Open the submenu on hover at every breakpoint.
      li.addEventListener('mouseenter', () => {
        closeAllDropdowns(list);
        li.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', () => {
        li.setAttribute('aria-expanded', 'false');
      });
      // Desktop touch fallback only: on a desktop touch device (no hover),
      // tapping the parent toggles its submenu instead of navigating. On
      // mobile (< 768px) the source navigates directly on tap, so the link is
      // left alone there.
      li.addEventListener('click', (e) => {
        if (!isDesktop.matches) return;
        const parentLink = li.querySelector(':scope > p > a, :scope > a');
        if (e.target.closest('a') === parentLink) {
          e.preventDefault();
        }
        e.stopPropagation();
        const expanded = li.getAttribute('aria-expanded') === 'true';
        if (!expanded) closeAllDropdowns(list);
        li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    }
  });

  row.append(list);
  return row;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // The nav document is authored as a series of sections. The first is the
  // brand/logo and the second is the main menu (links with optional dropdowns);
  // any remaining sections (utility links, tools, ISI/social) are rendered
  // generically so the header keeps working when the document is re-authored.
  const [brandSection, navSection, ...utilitySections] = [...fragment.children];

  if (brandSection) nav.append(decorateBrandRow(brandSection));

  // The logo sits on the left; the main nav and every utility section stack in
  // a right-hand column (matching the source header). Grouping them in one
  // flex column keeps them tightly stacked instead of spreading across grid
  // rows.
  const rightColumn = document.createElement('div');
  rightColumn.className = 'nav-right';
  if (navSection) rightColumn.append(decorateNavLinks(navSection));
  utilitySections.forEach((section, i) => {
    rightColumn.append(decorateUtilitySection(section, i));
  });
  nav.append(rightColumn);

  window.addEventListener('keydown', closeOnEscape);
  document.addEventListener('click', closeOnClickOutside);

  isDesktop.addEventListener('change', () => {
    closeAllDropdowns(nav);
    nav.classList.remove('nav-mobile-open');
    const hamburger = nav.querySelector('.nav-hamburger');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      const label = hamburger.querySelector('.nav-hamburger-label');
      if (label) label.textContent = 'MENU';
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
