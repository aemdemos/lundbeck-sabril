/**
 * Splits "IMPORTANT SAFETY INFORMATION" after the first word to match sabril.net.
 * @param {Element} titleEl
 */
function splitImportantSafetyTitle(titleEl) {
  if (!titleEl) return;
  const text = titleEl.textContent.replace(/\s+/g, ' ').trim();
  if (!text.startsWith('IMPORTANT') || !text.includes('SAFETY INFORMATION')) return;

  titleEl.textContent = '';
  titleEl.append(
    document.createTextNode('IMPORTANT '),
    document.createElement('br'),
    document.createTextNode('SAFETY INFORMATION'),
  );
}

/**
 * ISI (Important Safety Information) block.
 *
 * Authored with two rows:
 *   Row 1 – abbreviated content shown in the persistent fixed bottom bar.
 *   Row 2 – full inline content rendered in-page when the section scrolls into view.
 *
 * Behaviour:
 *   • When the ISI **section** is outside the viewport the fixed bar is visible.
 *   • Clicking the bar (or its "EXPAND" control) smooth-scrolls to the in-page ISI content.
 *   • Once the section scrolls into view the bar hides and the inline content displays.
 *
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  /* ── 1. Split authored rows ─────────────────────────────────── */
  const abbreviatedRow = rows[0];
  const inlineRow = rows[1];

  /* Mark the inline row so CSS can control its visibility */
  inlineRow.classList.add('isi-inline');

  /* ── 2. Build the fixed bottom bar ──────────────────────────── */
  const bar = document.createElement('div');
  bar.className = 'isi-bar';
  bar.setAttribute('aria-label', 'Important Safety Information');

  /* Move the abbreviated content into the bar */
  const barContent = document.createElement('div');
  barContent.className = 'isi-bar-content';

  /* Re-parent abbreviated children into the bar content wrapper */
  const abbrCells = [...abbreviatedRow.children];
  abbrCells.forEach((cell) => {
    cell.classList.add('isi-bar-col');
    barContent.append(cell);
  });

  barContent.querySelectorAll('.isi-bar-col > h3:first-of-type').forEach((heading) => {
    if (heading.querySelector('.isi-bar-title')) return;

    const title = document.createElement('span');
    title.className = 'isi-bar-title';
    title.append(...heading.childNodes);
    splitImportantSafetyTitle(title);
    heading.append(title);
  });

  /* Expand control: "EXPAND" label + arrow that scrolls to the in-page ISI */
  const toggle = document.createElement('button');
  toggle.className = 'isi-bar-toggle';
  toggle.setAttribute('aria-label', 'View full safety information');
  toggle.type = 'button';
  const label = document.createElement('span');
  label.className = 'isi-bar-toggle-label';
  label.textContent = 'EXPAND';
  const icon = document.createElement('span');
  icon.className = 'isi-bar-toggle-icon';
  toggle.append(label, icon);

  bar.append(barContent);
  bar.append(toggle);

  /* Remove the now-empty abbreviated row from the block */
  abbreviatedRow.remove();

  /* Append bar to <body> so it sits outside the page flow */
  document.body.append(bar);

  /* ── 3. Scroll to in-page ISI content ───────────────────────── */
  const section = block.closest('.section');
  if (!section) return;

  /* Animate the page scroll over a fixed duration (matches the source
     site's 2s jQuery animate; native smooth scroll is too fast). Ease-out
     (rather than ease-in-out) keeps the motion at full speed from the
     start and decelerates into the landing, reading as one smooth motion
     instead of a slow ramp-up followed by a fast finish. */
  const SCROLL_DURATION = 2000;
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const animateScrollTo = (targetY) => {
    const startY = window.scrollY;
    const distance = targetY - startY;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION, 1);
      window.scrollTo({
        top: startY + distance * easeOut(progress),
        left: 0,
        behavior: 'instant',
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const scrollToInline = (e) => {
    e.stopPropagation();
    const targetY = section.getBoundingClientRect().top + window.scrollY;
    animateScrollTo(targetY);
  };

  toggle.addEventListener('click', scrollToInline);
  bar.addEventListener('click', scrollToInline);

  /* ── 3b. In-page COLLAPSE control – scrolls back to top of page ── */
  const inlineInner = inlineRow.querySelector(':scope > div') || inlineRow;
  const inlineHeading = inlineInner.querySelector('h3');
  if (inlineHeading) {
    const titleSpan = inlineHeading.querySelector(
      'span.br, span:not(.isi-inline-toggle):not(.isi-inline-toggle-label):not(.isi-inline-toggle-icon)',
    );
    splitImportantSafetyTitle(titleSpan);

    const inlineToggle = document.createElement('button');
    inlineToggle.className = 'isi-inline-toggle';
    inlineToggle.type = 'button';
    inlineToggle.setAttribute('aria-label', 'Back to top');
    const inlineLabel = document.createElement('span');
    inlineLabel.className = 'isi-inline-toggle-label';
    inlineLabel.textContent = 'COLLAPSE';
    const inlineIcon = document.createElement('span');
    inlineIcon.className = 'isi-inline-toggle-icon';
    inlineToggle.append(inlineLabel, inlineIcon);
    inlineHeading.append(inlineToggle);

    inlineToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      animateScrollTo(0);
    });
  }

  /* ── 4. IntersectionObserver – show/hide the bar ────────────── */
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        bar.classList.add('isi-bar-hidden');
      } else {
        bar.classList.remove('isi-bar-hidden');
      }
    },
    { threshold: 0 },
  );

  observer.observe(section);
}
