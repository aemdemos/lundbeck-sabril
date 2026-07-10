// add delayed functionality here
import { loadScript } from './aem.js';

function isMartechEnabled() {
  const params = new URLSearchParams(window.location.search);
  return params.get('martech') !== 'off';
}

async function loadAdobeLaunch() {
  if (!isMartechEnabled()) return;

  await loadScript('//assets.adobedtm.com/launch-ENad9fcb0d6f2e4256949072f08ab39bbf.min.js', {
    async: '',
  });
}

async function loadMouseflow() {
  if (!isMartechEnabled()) return;

  await loadScript('//cdn.mouseflow.com/projects/d4208736-f876-46f6-bfb9-ea86e390f52e.js');
}

async function loadDelayedScripts() {
  await loadAdobeLaunch();
  await loadMouseflow();
}

loadDelayedScripts();
