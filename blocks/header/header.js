import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

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
 * Decorates the utility bar (top-right links + orange REMS link).
 * @param {Element} section The utility section from the nav fragment
 * @returns {HTMLElement} decorated utility bar
 */
function decorateUtilityBar(section) {
  const bar = document.createElement('div');
  bar.className = 'nav-utility';

  const links = document.createElement('div');
  links.className = 'nav-utility-links';

  const ul = section.querySelector('ul');
  if (ul) {
    [...ul.querySelectorAll(':scope > li > a')].forEach((a) => {
      const link = a.cloneNode(true);
      link.className = 'nav-utility-link';
      links.append(link);
    });
  }

  // Orange REMS call-out link (lives in a <p> sibling of the list)
  const remsLink = [...section.querySelectorAll('p a')]
    .find((a) => a.closest('ul') === null);
  if (remsLink) {
    const link = remsLink.cloneNode(true);
    link.className = 'nav-utility-rems';
    links.append(link);
  }

  bar.append(links);
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

      li.addEventListener('mouseenter', () => {
        if (!isDesktop.matches) return;
        closeAllDropdowns(list);
        li.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', () => {
        if (!isDesktop.matches) return;
        li.setAttribute('aria-expanded', 'false');
      });
      li.addEventListener('click', (e) => {
        // On desktop the dropdown opens on hover; ignore clicks here.
        if (isDesktop.matches) {
          if (e.target.closest('a')) return;
          e.stopPropagation();
          const expanded = li.getAttribute('aria-expanded') === 'true';
          li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          return;
        }
        // On mobile/tablet, tapping the parent toggles its submenu
        // instead of navigating (there is no hover).
        if (e.target.closest('a') === li.querySelector(':scope > p > a, :scope > a')) {
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

  const [brandSection, utilitySection, navSection] = [...fragment.children];

  const top = document.createElement('div');
  top.className = 'nav-top';
  if (brandSection) top.append(decorateBrandRow(brandSection));
  if (utilitySection) top.append(decorateUtilityBar(utilitySection));
  nav.append(top);

  if (navSection) nav.append(decorateNavLinks(navSection));

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
