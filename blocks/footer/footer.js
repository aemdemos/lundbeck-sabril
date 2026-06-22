import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  // Resolve the footer fragment: configured metadata, then local html-folder
  // (/content/footer), then production default (/footer).
  const candidates = [];
  if (footerMeta) candidates.push(new URL(footerMeta, window.location).pathname);
  candidates.push('/content/footer', '/footer');

  let fragment = null;
  for (let i = 0; i < candidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(candidates[i]);
  }

  block.textContent = '';
  const footer = document.createElement('div');
  if (fragment) {
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  }

  // The first section is the main footer bar (logo + links); the last section
  // (a single decorative image) is the bottom color strip.
  const sections = [...footer.children];
  if (sections[0]) sections[0].classList.add('footer-main');
  const strip = sections[sections.length - 1];
  if (strip && strip !== sections[0] && strip.querySelector('img')) {
    strip.classList.add('footer-strip');
  }

  block.append(footer);
}
