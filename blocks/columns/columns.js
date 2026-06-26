import { getBlockId } from '../../scripts/scripts.js';
import { decorateCellClass } from '../../scripts/utils.js';

export default function decorate(block) {
  decorateCellClass(block);

  const blockId = getBlockId('columns');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `columns-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Columns');

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // sabril.net callout variant only (image+text grey card). Hoist the heading
  // and the CTA out of the text cell so they render as full-width bands above
  // and below the image+bullets row, matching the source layout. Scoped to the
  // base 2-col block, excludes the stats-callout variant, and only runs when an
  // <h2> heading is present in the text cell — the callout signal. This skips
  // the footer columns block (no heading) even when the footer fragment is
  // decorated before being attached under <footer>, so other columns
  // blocks/pages are untouched.
  if (block.classList.contains('columns-2-cols') && !block.classList.contains('stats-callout')) {
    const row = block.firstElementChild;
    const textCol = row && [...row.children].find((col) => !col.classList.contains('columns-img-col'));
    const heading = textCol && textCol.querySelector(':scope > h2');
    if (heading) {
      // hoist heading to be the first full-width band of the card
      heading.classList.add('columns-callout-heading');
      row.prepend(heading);
      // hoist the CTA paragraph (last <p> in the text cell) to a bottom band
      const ctaPara = [...textCol.children].filter((el) => el.tagName === 'P').pop();
      if (ctaPara) {
        ctaPara.classList.add('columns-callout-cta');
        row.append(ctaPara);
      }
      block.classList.add('columns-callout');
    }
  }
}
