/* Toolynx v1.1.2 — generators without artificial output caps.
   Practical limits are only the host browser, available memory and JavaScript runtime. */

const MAX_CRYPTO_BYTES = 65536;
const YIELD_EVERY = 8;

function generatorOutput(text, isError = false) {
  const el = document.getElementById('out');
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? 'var(--danger)' : '';
}

function positiveInteger(raw, fallback) {
  const source = String(raw ?? '').trim();
  const n = source === '' ? fallback : Number(source);
  if (!Number.isSafeInteger(n) || n < 1) {
    throw new Error('Enter a positive whole number.');
  }
  return n;
}

function yieldToBrowser() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

async function secureRandomString(length, alphabet) {
  const alphabetLength = alphabet.length;
  const unbiasedCeiling = Math.floor(256 / alphabetLength) * alphabetLength;
  const parts = [];
  let remaining = length;
  let rounds = 0;

  while (remaining > 0) {
    const requested = Math.min(
      MAX_CRYPTO_BYTES,
      Math.max(1024, Math.ceil(remaining * (256 / unbiasedCeiling) * 1.04))
    );
    const bytes = new Uint8Array(requested);
    crypto.getRandomValues(bytes);

    let chunk = '';
    for (const byte of bytes) {
      if (byte >= unbiasedCeiling) continue;
      chunk += alphabet[byte % alphabetLength];
      remaining--;
      if (chunk.length >= 32768) {
        parts.push(chunk);
        chunk = '';
      }
      if (remaining === 0) break;
    }
    if (chunk) parts.push(chunk);

    if (++rounds % YIELD_EVERY === 0) await yieldToBrowser();
  }

  return parts.join('');
}

async function unlimitedPassword() {
  const input = document.getElementById('n');
  const n = positiveInteger(input?.value, 24);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?';
  generatorOutput(n > 250000 ? `Generating ${n.toLocaleString()} characters…` : 'Generating…');
  const password = await secureRandomString(n, alphabet);
  generatorOutput(password);
}

async function unlimitedToken() {
  const input = document.getElementById('n');
  const byteCount = positiveInteger(input?.value, 32);
  const parts = [];
  let remaining = byteCount;
  let rounds = 0;

  generatorOutput(byteCount > 250000 ? `Generating ${byteCount.toLocaleString()} random bytes…` : 'Generating…');

  while (remaining > 0) {
    const size = Math.min(MAX_CRYPTO_BYTES, remaining);
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    let hex = '';
    for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
    parts.push(hex);
    remaining -= size;
    if (++rounds % YIELD_EVERY === 0) await yieldToBrowser();
  }

  generatorOutput(parts.join(''));
}

async function unlimitedUuid() {
  const input = document.getElementById('n');
  const count = positiveInteger(input?.value, 5);
  const parts = [];
  const batchSize = 5000;

  generatorOutput(count > 25000 ? `Generating ${count.toLocaleString()} UUIDs…` : 'Generating…');

  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(count, start + batchSize);
    const batch = new Array(end - start);
    for (let i = 0; i < batch.length; i++) batch[i] = crypto.randomUUID();
    parts.push(batch.join('\n'));
    if (end < count) await yieldToBrowser();
  }

  generatorOutput(parts.join('\n'));
}

async function unlimitedLorem() {
  const input = document.getElementById('n');
  const count = positiveInteger(input?.value, 3);
  const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere, mauris vitae luctus facilisis, neque augue varius sem, eget tincidunt justo lorem sit amet erat. Sed non nisl id lectus consequat feugiat.';
  const parts = [];
  const batchSize = 5000;

  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(count, start + batchSize);
    parts.push(new Array(end - start).fill(paragraph).join('\n\n'));
    if (end < count) await yieldToBrowser();
  }

  generatorOutput(parts.join('\n\n'));
}

const unlimitedHandlers = {
  password: unlimitedPassword,
  token: unlimitedToken,
  uuid: unlimitedUuid,
  lorem: unlimitedLorem
};

/* Capture the Generate click before the original capped v1.1.0 handlers.
   This keeps the patch small and backward-compatible while removing the caps. */
document.addEventListener('click', async event => {
  const button = event.target.closest('button#go');
  if (!button) return;

  const toolId = location.hash.slice(1);
  const handler = unlimitedHandlers[toolId];
  if (!handler) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  button.disabled = true;

  try {
    await handler();
  } catch (error) {
    generatorOutput(error?.message || String(error), true);
  } finally {
    button.disabled = false;
  }
}, true);
