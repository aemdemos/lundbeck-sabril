import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function closeAllDropdowns(nav) {
  nav.querySelectorAll('.nav-drop[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
  });
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav) {
      closeAllDropdowns(nav);
      nav.classList.remove('nav-mobile-open');
      const hamburger = nav.querySelector('.nav-hamburger');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    }
  }
}

function closeOnClickOutside(e) {
  const nav = document.getElementById('nav');
  if (nav && !nav.contains(e.target)) closeAllDropdowns(nav);
}

const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;

/**
 * Builds the brand row: logo (left).
 */
function decorateBrand(brandSection) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const logoLink = brandSection.querySelector('a');
  if (logoLink) brand.append(logoLink);
  return brand;
}

/**
 * Builds the top-right utility links + REMS link.
 */
function decorateUtility(utilSection) {
  const utility = document.createElement('div');
  utility.className = 'nav-utility';

  const ul = utilSection.querySelector('ul');
  if (ul) {
    const links = document.createElement('ul');
    links.className = 'nav-utility-links';
    [...ul.children].forEach((li) => {
      const a = li.querySelector('a');
      if (a) {
        const item = document.createElement('li');
        item.append(a);
        links.append(item);
      }
    });
    utility.append(links);
  }

  const remsP = utilSection.querySelector('p');
  const remsLink = remsP && remsP.querySelector('a');
  if (remsLink) {
    remsLink.className = 'nav-rems-link';
    utility.append(remsLink);
  }

  return utility;
}

/**
 * Builds the main navigation bar (green buttons + dropdown).
 */
function decorateMainNav(navSection) {
  const navRow = document.createElement('div');
  navRow.className = 'nav-main';

  const ul = navSection.querySelector('ul');
  if (!ul) return navRow;

  ul.className = 'nav-main-list';
  [...ul.children].forEach((li) => {
    const subUl = li.querySelector('ul');
    if (subUl) {
      li.classList.add('nav-drop');
      li.setAttribute('aria-expanded', 'false');
      subUl.className = 'nav-dropdown-menu';

      li.addEventListener('mouseenter', () => {
        if (!isDesktop()) return;
        li.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', () => {
        if (!isDesktop()) return;
        li.setAttribute('aria-expanded', 'false');
      });
      // On mobile the submenu is hidden and the trigger navigates directly
      // (matching source) — no click handler needed.
    }
  });

  navRow.append(ul);
  return navRow;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  // Resolve the nav fragment path. Try the configured metadata first, then the
  // local html-folder location (/content/nav), then the production default (/nav).
  const candidates = [];
  if (navMeta) candidates.push(new URL(navMeta, window.location).pathname);
  candidates.push('/content/nav', '/nav');

  let fragment = null;
  for (let i = 0; i < candidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(candidates[i]);
  }

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const [brandSection, utilSection, navSection] = [...fragment.children];

  // Hamburger (mobile only)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Toggle navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  const hamburgerText = document.createElement('span');
  hamburgerText.className = 'nav-hamburger-text';
  hamburgerText.textContent = 'MENU';
  hamburger.append(hamburgerText);
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    hamburgerText.textContent = expanded ? 'MENU' : 'X';
    nav.classList.toggle('nav-mobile-open', !expanded);
  });

  if (brandSection) {
    const brand = decorateBrand(brandSection);
    brand.append(hamburger);
    nav.append(brand);
  }
  if (utilSection) nav.append(decorateUtility(utilSection));
  if (navSection) nav.append(decorateMainNav(navSection));

  window.addEventListener('keydown', closeOnEscape);
  document.addEventListener('click', closeOnClickOutside);

  // Reset state when crossing the desktop/mobile breakpoint
  window.matchMedia('(min-width: 900px)').addEventListener('change', () => {
    nav.classList.remove('nav-mobile-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburgerText.textContent = 'MENU';
    closeAllDropdowns(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
