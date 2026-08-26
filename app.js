const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const ui = {
  grid: $('#grid'), tabs: $('#tabs'), tool: $('#tool'), palette: $('#palette'),
  workspace: $('#workspace'), title: $('#title'), cat: $('#cat'), desc: $('#desc'),
  q: $('#q'), results: $('#results'), context: $('#contextMenu'), toast: $('#toast')
};

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utf8b64 = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64utf8 = s => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));
const value = id => document.getElementById(id).value;
const output = (x, isError = false) => {
  const el = $('#out');
  if (!el) return;
  el.textContent = typeof x === 'string' ? x : JSON.stringify(x, null, 2);
  el.style.color = isError ? 'var(--danger)' : '';
};
const safe = async fn => {
  try { await fn(); }
  catch (err) { output(err?.message || String(err), true); }
};
const copyOutput = async () => {
  const text = $('#out')?.textContent ?? '';
  await navigator.clipboard.writeText(text);
  toast('Copied');
};
const field = (id, label, placeholder = '', area = true) =>
  `<div class="f"><label for="${id}">${escapeHtml(label)}</label>${area
    ? `<textarea id="${id}" placeholder="${escapeHtml(placeholder)}"></textarea>`
    : `<input id="${id}" placeholder="${escapeHtml(placeholder)}">`}</div>`;
const buttons = arr =>
  `<div class="bar">${arr.map((x, i) => `<button id="${x[0]}" type="button" class="${i === 0 ? 'go' : ''}">${escapeHtml(x[1])}</button>`).join('')}</div>`;
const base = () => `<pre id="out"></pre>`;
const bind = (id, fn) => document.getElementById(id)?.addEventListener('click', () => safe(fn));
const toast = msg => {
  ui.toast.textContent = msg;
  ui.toast.classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove('on'), 1600);
};

function ipToInt(ip) {
  const p = ip.trim().split('.').map(Number);
  if (p.length !== 4 || p.some(x => !Number.isInteger(x) || x < 0 || x > 255)) throw new Error('Invalid IPv4 address');
  return (((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]) >>> 0;
}
function intToIp(n) { return [24,16,8,0].map(s => (n >>> s) & 255).join('.'); }

function csvParse(s) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i <= s.length; i++) {
    const c = s[i] ?? '\n';
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  return rows.filter(r => r.some(x => x !== ''));
}
function csvToJson(s) {
  const rows = csvParse(s), headers = rows.shift() || [];
  return rows.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ''])));
}
function jsonToCsv(s) {
  const arr = JSON.parse(s);
  if (!Array.isArray(arr)) throw new Error('Expected a JSON array');
  const headers = [...new Set(arr.flatMap(Object.keys))];
  const quote = x => {
    x = String(x ?? '');
    return /[",\n]/.test(x) ? `"${x.replaceAll('"', '""')}"` : x;
  };
  return [headers.map(quote).join(','), ...arr.map(o => headers.map(k => quote(o[k])).join(','))].join('\n');
}
function flattenObject(obj, prefix = '', out = {}) {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) flattenObject(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => flattenObject(v, `${prefix}[${i}]`, out));
  } else out[prefix || 'value'] = obj;
  return out;
}
function slugify(s) {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
}
function words(s) { return (s.trim().match(/\S+/g) || []).length; }
function cronExplain(x) {
  const p = x.trim().split(/\s+/);
  if (p.length !== 5) throw new Error('Use 5-field cron: minute hour day month weekday');
  const [m,h,d,mo,w] = p;
  const extra = [];
  if (/^\*\/\d+$/.test(m)) extra.push(`Runs every ${m.slice(2)} minutes.`);
  if (/^\d+-\d+$/.test(h)) extra.push(`Hours range: ${h}.`);
  if (/^\d+-\d+$/.test(w)) extra.push(`Weekdays range: ${w}.`);
  return `Minute: ${m}\nHour: ${h}\nDay of month: ${d}\nMonth: ${mo}\nWeekday: ${w}${extra.length ? `\n\n${extra.join('\n')}` : ''}`;
}
function parseQueryString(s) {
  const q = s.trim().replace(/^[^?]*\?/, '').replace(/^#/, '');
  const params = new URLSearchParams(q);
  const obj = {};
  for (const [k,v] of params) obj[k] = Object.hasOwn(obj, k) ? [].concat(obj[k], v) : v;
  return obj;
}
function queryFromJson(s) {
  const obj = JSON.parse(s); const p = new URLSearchParams();
  for (const [k,v] of Object.entries(obj)) (Array.isArray(v) ? v : [v]).forEach(x => p.append(k, String(x)));
  return p.toString();
}
function parseRgbOrHex(x) {
  x = x.trim();
  if (x.includes(',')) {
    const p = x.split(',').map(v => Number(v.trim()));
    if (p.length !== 3 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error('Use RGB as r,g,b');
    return {hex:'#'+p.map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase(), rgb:p};
  }
  let h = x.replace('#','');
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map(c => c+c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error('Use 3- or 6-digit HEX');
  const rgb = [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
  return {hex:'#'+h.toUpperCase(), rgb};
}
const statusMap = {
  100:'Continue',101:'Switching Protocols',200:'OK',201:'Created',202:'Accepted',204:'No Content',
  301:'Moved Permanently',302:'Found',304:'Not Modified',307:'Temporary Redirect',308:'Permanent Redirect',
  400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',408:'Request Timeout',
  409:'Conflict',410:'Gone',418:"I'm a teapot",422:'Unprocessable Content',429:'Too Many Requests',
  500:'Internal Server Error',501:'Not Implemented',502:'Bad Gateway',503:'Service Unavailable',504:'Gateway Timeout'
};
const mimeMap = {
  html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',xml:'application/xml',
  txt:'text/plain',csv:'text/csv',md:'text/markdown',pdf:'application/pdf',svg:'image/svg+xml',png:'image/png',
  jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',avif:'image/avif',ico:'image/x-icon',
  wasm:'application/wasm',zip:'application/zip',gz:'application/gzip',mp3:'audio/mpeg',mp4:'video/mp4',webm:'video/webm'
};
const portMap = {
  20:'FTP data',21:'FTP control',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',67:'DHCP server',68:'DHCP client',
  80:'HTTP',110:'POP3',123:'NTP',143:'IMAP',389:'LDAP',443:'HTTPS',445:'SMB',465:'SMTPS',587:'SMTP submission',
  636:'LDAPS',993:'IMAPS',995:'POP3S',1433:'Microsoft SQL Server',1521:'Oracle DB',2049:'NFS',2375:'Docker',
  3306:'MySQL',3389:'RDP',5432:'PostgreSQL',6379:'Redis',8080:'HTTP alternate',8443:'HTTPS alternate',27017:'MongoDB'
};

const tools = [
  {
    id:'json', name:'JSON Studio', cat:'Data', icon:'{}', desc:'Format, validate and minify JSON.',
    render(){
      ui.workspace.innerHTML = field('i','JSON input','{"hello":"world"}') + buttons([['fmt','Format'],['min','Minify'],['cpy','Copy']]) + base();
      bind('fmt',()=>output(JSON.stringify(JSON.parse(value('i')),null,2)));
      bind('min',()=>output(JSON.stringify(JSON.parse(value('i')))));
      bind('cpy',copyOutput);
    }
  },
  {
    id:'flatten', name:'JSON Flatten', cat:'Data', icon:'{}', desc:'Flatten nested JSON into dot and bracket paths.',
    render(){
      ui.workspace.innerHTML = field('i','JSON input','{"user":{"name":"Ada","tags":["dev","math"]}}') + buttons([['go','Flatten'],['cpy','Copy']]) + base();
      bind('go',()=>output(flattenObject(JSON.parse(value('i')))));
      bind('cpy',copyOutput);
    }
  },
  {
    id:'csv', name:'CSV ↔ JSON', cat:'Data', icon:'{}', desc:'Convert CSV and JSON arrays locally.',
    render(){
      ui.workspace.innerHTML = field('i','Input','name,role\nAda,Engineer') + buttons([['j','CSV → JSON'],['c','JSON → CSV'],['cpy','Copy']]) + base();
      bind('j',()=>output(csvToJson(value('i')))); bind('c',()=>output(jsonToCsv(value('i')))); bind('cpy',copyOutput);
    }
  },
  {
    id:'query', name:'Query String', cat:'Data', icon:'{}', desc:'Parse query strings or build them from JSON.',
    render(){
      ui.workspace.innerHTML = field('i','Input','?page=2&tag=js&tag=web') + buttons([['p','Parse → JSON'],['b','JSON → Query'],['cpy','Copy']]) + base();
      bind('p',()=>output(parseQueryString(value('i')))); bind('b',()=>output(queryFromJson(value('i')))); bind('cpy',copyOutput);
    }
  },
  {
    id:'color', name:'Color Converter', cat:'Data', icon:'{}', desc:'Convert HEX and RGB values.',
    render(){
      ui.workspace.innerHTML = field('i','HEX or RGB','#79F2C0',false) + buttons([['go','Convert'],['cpy','Copy']]) + base();
      bind('go',()=>{const r=parseRgbOrHex(value('i'));output(`HEX: ${r.hex}\nRGB: ${r.rgb.join(', ')}`)}); bind('cpy',copyOutput);
    }
  },
  {
    id:'size', name:'Data Size Converter', cat:'Data', icon:'{}', desc:'Convert bytes, KB, MB, GB and TB.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('n','Value','1024',false)}
      <div class="f"><label for="from">From</label><select id="from"><option>B</option><option>KB</option><option>MB</option><option>GB</option><option>TB</option></select></div>
      <div class="f"><label for="to">To</label><select id="to"><option>B</option><option selected>KB</option><option>MB</option><option>GB</option><option>TB</option></select></div></div>` +
      buttons([['go','Convert'],['cpy','Copy']]) + base();
      bind('go',()=>{const u={B:1,KB:1024,MB:1024**2,GB:1024**3,TB:1024**4};const n=Number(value('n'));if(!Number.isFinite(n))throw new Error('Invalid number');output(`${n} ${value('from')} = ${n*u[value('from')]/u[value('to')]} ${value('to')}`)});bind('cpy',copyOutput);
    }
  },

  {
    id:'base64', name:'Base64', cat:'Encoding', icon:'↔', desc:'UTF-8 Base64 encoder and decoder.',
    render(){
      ui.workspace.innerHTML = field('i','Input','Hello Toolynx') + buttons([['e','Encode'],['d','Decode'],['cpy','Copy']]) + base();
      bind('e',()=>output(utf8b64(value('i')))); bind('d',()=>output(b64utf8(value('i')))); bind('cpy',copyOutput);
    }
  },
  {
    id:'urlenc', name:'URL Encoder', cat:'Encoding', icon:'↔', desc:'Encode or decode URL components.',
    render(){
      ui.workspace.innerHTML = field('i','Input','hello world?x=1') + buttons([['e','Encode'],['d','Decode'],['cpy','Copy']]) + base();
      bind('e',()=>output(encodeURIComponent(value('i')))); bind('d',()=>output(decodeURIComponent(value('i')))); bind('cpy',copyOutput);
    }
  },
  {
    id:'html', name:'HTML Entities', cat:'Encoding', icon:'↔', desc:'Escape or unescape HTML-sensitive text.',
    render(){
      ui.workspace.innerHTML = field('i','Input','<div>Toolynx & you</div>') + buttons([['e','Escape'],['d','Unescape'],['cpy','Copy']]) + base();
      bind('e',()=>output(escapeHtml(value('i')))); bind('d',()=>{const x=document.createElement('textarea');x.innerHTML=value('i');output(x.value)}); bind('cpy',copyOutput);
    }
  },

  {
    id:'jwt', name:'JWT Decoder', cat:'Security', icon:'◇', desc:'Inspect JWT header and payload locally.',
    render(){
      ui.workspace.innerHTML = field('i','JWT','eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0b29seW54In0.') + buttons([['d','Decode'],['cpy','Copy']]) + base();
      bind('d',()=>{const p=value('i').trim().split('.');if(p.length<2)throw new Error('Invalid JWT');const dec=x=>JSON.parse(b64utf8(x.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(x.length/4)*4,'=')));output(`HEADER\n${JSON.stringify(dec(p[0]),null,2)}\n\nPAYLOAD\n${JSON.stringify(dec(p[1]),null,2)}`)});bind('cpy',copyOutput);
    }
  },
  {
    id:'hash', name:'Hash Generator', cat:'Security', icon:'◇', desc:'SHA-256 / SHA-384 / SHA-512 via WebCrypto.',
    render(){
      ui.workspace.innerHTML = field('i','Text','Toolynx') + `<div class="f"><label for="alg">Algorithm</label><select id="alg"><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></div>` + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',async()=>{const b=await crypto.subtle.digest(value('alg'),new TextEncoder().encode(value('i')));output([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''))});bind('cpy',copyOutput);
    }
  },
  {
    id:'hmac', name:'HMAC SHA-256', cat:'Security', icon:'◇', desc:'Generate an HMAC-SHA-256 signature locally.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('msg','Message','hello')}${field('key','Secret key','secret')}</div>` + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',async()=>{const enc=new TextEncoder();const key=await crypto.subtle.importKey('raw',enc.encode(value('key')),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(value('msg')));output([...new Uint8Array(sig)].map(x=>x.toString(16).padStart(2,'0')).join(''))});bind('cpy',copyOutput);
    }
  },
  {
    id:'uuid', name:'UUID Generator', cat:'Security', icon:'◇', desc:'Generate cryptographically secure UUID v4 values.',
    render(){
      ui.workspace.innerHTML = field('n','Count','5',false) + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',()=>output(Array.from({length:Math.min(100,Math.max(1,Number(value('n'))||5))},()=>crypto.randomUUID()).join('\n')));bind('cpy',copyOutput);
    }
  },
  {
    id:'password', name:'Password Generator', cat:'Security', icon:'◇', desc:'Secure random passwords generated on-device.',
    render(){
      ui.workspace.innerHTML = field('n','Length','24',false) + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',()=>{const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=?';const n=Math.min(128,Math.max(8,Number(value('n'))||24));const b=new Uint32Array(n);crypto.getRandomValues(b);output([...b].map(x=>chars[x%chars.length]).join(''))});bind('cpy',copyOutput);
    }
  },
  {
    id:'token', name:'Random Token', cat:'Security', icon:'◇', desc:'Generate random hexadecimal security tokens.',
    render(){
      ui.workspace.innerHTML = field('n','Bytes','32',false) + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',()=>{const b=new Uint8Array(Math.min(256,Math.max(4,Number(value('n'))||32)));crypto.getRandomValues(b);output([...b].map(x=>x.toString(16).padStart(2,'0')).join(''))});bind('cpy',copyOutput);
    }
  },

  {
    id:'case', name:'Case Converter', cat:'Text', icon:'Aa', desc:'camelCase, snake_case, kebab-case and more.',
    render(){
      ui.workspace.innerHTML = field('i','Text','hello developer world') + `<div class="f"><label for="mode">Case</label><select id="mode"><option value="camel">camelCase</option><option value="snake">snake_case</option><option value="kebab">kebab-case</option><option value="upper">UPPER CASE</option><option value="lower">lower case</option><option value="title">Title Case</option></select></div>` + buttons([['go','Convert'],['cpy','Copy']]) + base();
      bind('go',()=>{const a=value('i').trim().split(/[^A-Za-z0-9]+|(?=[A-Z])/).filter(Boolean),m=value('mode');const r=m==='camel'?(a[0]?.toLowerCase()||'')+a.slice(1).map(x=>x[0].toUpperCase()+x.slice(1).toLowerCase()).join(''):m==='snake'?a.join('_').toLowerCase():m==='kebab'?a.join('-').toLowerCase():m==='upper'?value('i').toUpperCase():m==='lower'?value('i').toLowerCase():a.map(x=>x[0].toUpperCase()+x.slice(1).toLowerCase()).join(' ');output(r)});bind('cpy',copyOutput);
    }
  },
  {
    id:'stats', name:'Text Inspector', cat:'Text', icon:'Aa', desc:'Count characters, words, lines and bytes.',
    render(){
      ui.workspace.innerHTML = field('i','Text','Paste text here…') + buttons([['go','Inspect']]) + base();
      bind('go',()=>output(`Characters: ${value('i').length}\nWords: ${words(value('i'))}\nLines: ${value('i').split(/\r?\n/).length}\nUTF-8 bytes: ${new TextEncoder().encode(value('i')).length}`));
    }
  },
  {
    id:'unicode', name:'Unicode Inspector', cat:'Text', icon:'Aa', desc:'Inspect Unicode code points character by character.',
    render(){
      ui.workspace.innerHTML = field('i','Text','Toolynx ✓') + buttons([['go','Inspect'],['cpy','Copy']]) + base();
      bind('go',()=>output([...value('i')].map(c=>`${c}  U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}`).join('\n')));bind('cpy',copyOutput);
    }
  },
  {
    id:'diff', name:'Text Diff', cat:'Text', icon:'Aa', desc:'Simple line-by-line text comparison.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('a','Original','one\ntwo')}${field('b','Changed','one\nthree')}</div>` + buttons([['go','Compare'],['cpy','Copy']]) + base();
      bind('go',()=>{const a=value('a').split('\n'),b=value('b').split('\n'),n=Math.max(a.length,b.length),r=[];for(let i=0;i<n;i++){if(a[i]===b[i])r.push(`  ${a[i]??''}`);else{if(a[i]!=null)r.push(`- ${a[i]}`);if(b[i]!=null)r.push(`+ ${b[i]}`)}}output(r.join('\n'))});bind('cpy',copyOutput);
    }
  },
  {
    id:'regex', name:'Regex Tester', cat:'Text', icon:'Aa', desc:'Test JavaScript regular expressions and inspect matches.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('pattern','Pattern','\\b\\w+@\\w+\\.\\w+\\b',false)}${field('flags','Flags','gi',false)}</div>${field('text','Test text','Email ada@example.com and linus@example.org')}` + buttons([['go','Test'],['cpy','Copy']]) + base();
      bind('go',()=>{const re=new RegExp(value('pattern'),value('flags'));const text=value('text');const matches=[...text.matchAll(re.global?re:new RegExp(re.source,re.flags+'g'))];output(matches.length?matches.map((m,i)=>`#${i+1} "${m[0]}" at index ${m.index}${m.length>1?`\nGroups: ${JSON.stringify(m.slice(1))}`:''}`).join('\n\n'):'No matches')});bind('cpy',copyOutput);
    }
  },
  {
    id:'slug', name:'Slug Generator', cat:'Text', icon:'Aa', desc:'Turn titles into clean URL-friendly slugs.',
    render(){
      ui.workspace.innerHTML = field('i','Text','Hello, Developer World!') + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',()=>output(slugify(value('i'))));bind('cpy',copyOutput);
    }
  },
  {
    id:'lines', name:'Line Toolkit', cat:'Text', icon:'Aa', desc:'Sort, deduplicate, reverse or trim lines.',
    render(){
      ui.workspace.innerHTML = field('i','Lines','pear\napple\npear\nbanana') + buttons([['sort','Sort'],['uniq','Deduplicate'],['rev','Reverse'],['trim','Trim'],['cpy','Copy']]) + base();
      const get=()=>value('i').split(/\r?\n/);bind('sort',()=>output(get().sort((a,b)=>a.localeCompare(b)).join('\n')));bind('uniq',()=>output([...new Set(get())].join('\n')));bind('rev',()=>output(get().reverse().join('\n')));bind('trim',()=>output(get().map(x=>x.trim()).filter(Boolean).join('\n')));bind('cpy',copyOutput);
    }
  },
  {
    id:'lorem', name:'Lorem Ipsum', cat:'Text', icon:'Aa', desc:'Generate placeholder text without a network request.',
    render(){
      ui.workspace.innerHTML = field('n','Paragraphs','3',false) + buttons([['go','Generate'],['cpy','Copy']]) + base();
      bind('go',()=>{const p='Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere, mauris vitae luctus facilisis, neque augue varius sem, eget tincidunt justo lorem sit amet erat. Sed non nisl id lectus consequat feugiat.';output(Array.from({length:Math.min(12,Math.max(1,Number(value('n'))||3))},()=>p).join('\n\n'))});bind('cpy',copyOutput);
    }
  },

  {
    id:'timestamp', name:'Timestamp Converter', cat:'System', icon:'⌘', desc:'Convert Unix timestamps and ISO dates.',
    render(){
      ui.workspace.innerHTML = field('i','Timestamp or date','0',false) + buttons([['go','Convert'],['now','Use now'],['cpy','Copy']]) + base();
      bind('go',()=>{const x=value('i').trim();const d=/^-?\d+(\.\d+)?$/.test(x)?new Date(Number(x)*(x.length<=10?1000:1)):new Date(x);if(Number.isNaN(+d))throw new Error('Invalid date');output(`ISO: ${d.toISOString()}\nUnix seconds: ${Math.floor(+d/1000)}\nUnix milliseconds: ${+d}\nLocal: ${d.toString()}`)});bind('now',()=>{document.getElementById('i').value=Date.now();document.getElementById('go').click()});bind('cpy',copyOutput);
    }
  },
  {
    id:'base', name:'Number Base', cat:'System', icon:'⌘', desc:'Convert integers between bases 2–36.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('i','Value','255',false)}${field('from','From base','10',false)}${field('to','To base','16',false)}</div>` + buttons([['go','Convert'],['cpy','Copy']]) + base();
      bind('go',()=>{const f=Number(value('from')),t=Number(value('to'));if(f<2||f>36||t<2||t>36)throw new Error('Bases must be 2–36');let n=0n;for(const c of value('i').trim().toLowerCase()){const d=parseInt(c,36);if(!(d>=0&&d<f))throw new Error('Invalid digit');n=n*BigInt(f)+BigInt(d)}output(n.toString(t))});bind('cpy',copyOutput);
    }
  },
  {
    id:'chmod', name:'chmod Calculator', cat:'System', icon:'⌘', desc:'Convert rwx permissions to octal mode.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('owner','Owner 0–7','7',false)}${field('group','Group 0–7','5',false)}${field('other','Other 0–7','5',false)}</div>` + buttons([['go','Calculate'],['cpy','Copy']]) + base();
      bind('go',()=>{const p=[Number(value('owner')),Number(value('group')),Number(value('other'))];if(p.some(x=>!Number.isInteger(x)||x<0||x>7))throw new Error('Values must be 0–7');const s=n=>(n&4?'r':'-')+(n&2?'w':'-')+(n&1?'x':'-');output(`${p.join('')}\n${p.map(s).join('')}`)});bind('cpy',copyOutput);
    }
  },
  {
    id:'cron', name:'Cron Explainer', cat:'System', icon:'⌘', desc:'Readable breakdown of five-field cron expressions.',
    render(){
      ui.workspace.innerHTML = field('i','Cron expression','*/15 9-17 * * 1-5',false) + buttons([['go','Explain'],['cpy','Copy']]) + base();
      bind('go',()=>output(cronExplain(value('i'))));bind('cpy',copyOutput);
    }
  },

  {
    id:'subnet', name:'IPv4 Subnet', cat:'Network', icon:'⌁', desc:'Network, broadcast, netmask and host range from CIDR.',
    render(){
      ui.workspace.innerHTML = `<div class="ws two">${field('ip','IPv4','192.168.1.42',false)}${field('pre','Prefix','24',false)}</div>` + buttons([['go','Calculate'],['cpy','Copy']]) + base();
      bind('go',()=>{const ip=ipToInt(value('ip')),p=Number(value('pre'));if(!Number.isInteger(p)||p<0||p>32)throw new Error('Prefix must be 0–32');const mask=p===0?0:(0xffffffff<<(32-p))>>>0,net=(ip&mask)>>>0,bc=(net|(~mask>>>0))>>>0;output(`Network: ${intToIp(net)}/${p}\nNetmask: ${intToIp(mask)}\nBroadcast: ${intToIp(bc)}\nFirst host: ${intToIp(p>=31?net:net+1)}\nLast host: ${intToIp(p>=31?bc:bc-1)}\nAddresses: ${2**(32-p)}`)});bind('cpy',copyOutput);
    }
  },
  {
    id:'url', name:'URL Inspector', cat:'Network', icon:'⌁', desc:'Break a URL into its components.',
    render(){
      ui.workspace.innerHTML = field('i','URL','https://example.com:8080/path?q=toolynx#demo',false) + buttons([['go','Inspect'],['cpy','Copy']]) + base();
      bind('go',()=>{const u=new URL(value('i'));output(`Protocol: ${u.protocol}\nHost: ${u.host}\nHostname: ${u.hostname}\nPort: ${u.port||'(default)'}\nPath: ${u.pathname}\nQuery: ${u.search||'(none)'}\nFragment: ${u.hash||'(none)'}\nOrigin: ${u.origin}`)});bind('cpy',copyOutput);
    }
  },
  {
    id:'status', name:'HTTP Status', cat:'Network', icon:'⌁', desc:'Quick reference for common HTTP status codes.',
    render(){
      ui.workspace.innerHTML = field('i','Code','404',false) + buttons([['go','Look up'],['cpy','Copy']]) + base();
      bind('go',()=>{const n=Number(value('i'));if(!statusMap[n])throw new Error('Code not in compact reference');const cls=n<200?'Informational':n<300?'Success':n<400?'Redirection':n<500?'Client error':'Server error';output(`${n} ${statusMap[n]}\nClass: ${cls}`)});bind('cpy',copyOutput);
    }
  },
  {
    id:'mime', name:'MIME Lookup', cat:'Network', icon:'⌁', desc:'Find MIME types from common file extensions.',
    render(){
      ui.workspace.innerHTML = field('i','Extension','json',false) + buttons([['go','Look up'],['cpy','Copy']]) + base();
      bind('go',()=>{const x=value('i').toLowerCase().replace(/^\./,'');if(!mimeMap[x])throw new Error('Extension not in compact reference');output(mimeMap[x])});bind('cpy',copyOutput);
    }
  },
  {
    id:'port', name:'Port Reference', cat:'Network', icon:'⌁', desc:'Look up common TCP/UDP service ports.',
    render(){
      ui.workspace.innerHTML = field('i','Port','443',false) + buttons([['go','Look up'],['cpy','Copy']]) + base();
      bind('go',()=>{const n=Number(value('i'));if(!Number.isInteger(n)||n<0||n>65535)throw new Error('Port must be 0–65535');output(portMap[n]?`${n}: ${portMap[n]}`:`${n}: no entry in the compact built-in reference`) });bind('cpy',copyOutput);
    }
  }
];

const categories = ['All','Data','Encoding','Security','Text','Network','System'];
let activeCategory = 'All';
let contextToolId = null;

function renderCards() {
  ui.grid.innerHTML = tools.filter(t => activeCategory === 'All' || t.cat === activeCategory).map(t => `
    <button class="card" type="button" data-id="${t.id}" aria-label="Open ${escapeHtml(t.name)}">
      <span class="ico">${t.icon}</span><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.desc)}</p>
    </button>`).join('');
  $$('.card', ui.grid).forEach(card => {
    card.addEventListener('click', () => openTool(card.dataset.id));
    card.addEventListener('contextmenu', e => {
      if (!matchMedia('(pointer:fine)').matches) return;
      e.preventDefault(); contextToolId = card.dataset.id; showContext(e.clientX, e.clientY);
    });
  });
}
function renderTabs() {
  ui.tabs.innerHTML = categories.map(c => `<button type="button" class="${c === activeCategory ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
  $$('button', ui.tabs).forEach(b => b.addEventListener('click', () => { activeCategory = b.dataset.cat; renderTabs(); renderCards(); }));
}
function openTool(id, push = true) {
  const t = tools.find(x => x.id === id); if (!t) return;
  ui.cat.textContent = t.cat; ui.title.textContent = t.name; ui.desc.textContent = t.desc;
  t.render(); ui.tool.showModal();
  if (push) history.pushState({tool:id}, '', `#${id}`);
}
function closeTool(push = true) {
  if (ui.tool.open) ui.tool.close();
  if (push && location.hash) history.pushState({}, '', location.pathname + location.search);
}
function openPalette() {
  ui.q.value = ''; renderSearchResults(); ui.palette.showModal(); ui.q.focus();
}
function renderSearchResults() {
  const z = ui.q.value.trim().toLowerCase();
  const found = tools.filter(t => `${t.name} ${t.cat} ${t.desc}`.toLowerCase().includes(z));
  ui.results.innerHTML = found.map(t => `<button class="res" type="button" data-id="${t.id}"><b>${escapeHtml(t.name)}</b><small>${escapeHtml(t.cat)} · ${escapeHtml(t.desc)}</small></button>`).join('');
  $$('.res', ui.results).forEach(b => b.addEventListener('click', () => { ui.palette.close(); openTool(b.dataset.id); }));
}
function showContext(x, y) {
  ui.context.hidden = false;
  const w = 180, h = 96;
  ui.context.style.left = `${Math.min(x, innerWidth - w - 8)}px`;
  ui.context.style.top = `${Math.min(y, innerHeight - h - 8)}px`;
}
function hideContext() { ui.context.hidden = true; contextToolId = null; }

const isMac = /Mac|iPhone|iPad/.test(navigator.platform) || /Mac OS/.test(navigator.userAgent);
const shortcutText = isMac ? '⌘ K' : 'Ctrl K';
$('#shortcutBadge').textContent = shortcutText;
$('#heroShortcut').textContent = shortcutText;

const themeOrder = ['system','light','dark'];
const themeIcons = {system:'◐',light:'☀',dark:'☾'};
function effectiveDark(mode) { return mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); }
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = mode;
  localStorage.setItem('toolynx-theme', mode);
  $('#themeLabel').textContent = mode[0].toUpperCase()+mode.slice(1);
  $('#themeIcon').textContent = themeIcons[mode];
  $('#themeButton').title = `Theme: ${mode[0].toUpperCase()+mode.slice(1)}`;
  $('#themeColor').content = effectiveDark(mode) ? '#090b10' : '#f6f8fb';
}
let themeMode = localStorage.getItem('toolynx-theme') || 'system';
if (!themeOrder.includes(themeMode)) themeMode = 'system';
applyTheme(themeMode);
$('#themeButton').addEventListener('click', () => { themeMode = themeOrder[(themeOrder.indexOf(themeMode)+1)%themeOrder.length]; applyTheme(themeMode); });
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themeMode === 'system') applyTheme('system'); });

$('#openSearch').addEventListener('click', openPalette);
$('#heroSearch').addEventListener('click', openPalette);
$('#close').addEventListener('click', () => closeTool());
ui.q.addEventListener('input', renderSearchResults);
ui.palette.addEventListener('click', e => { if (e.target === ui.palette) ui.palette.close(); });
ui.tool.addEventListener('click', e => { if (e.target === ui.tool) closeTool(); });
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!ui.palette.open) openPalette(); }
  if (e.key === 'Escape') hideContext();
});
document.addEventListener('pointerdown', e => { if (!ui.context.hidden && !ui.context.contains(e.target)) hideContext(); });
addEventListener('resize', hideContext);
addEventListener('scroll', hideContext, {passive:true});
$('#ctxOpen').addEventListener('click', () => { const id=contextToolId; hideContext(); if(id) openTool(id); });
$('#ctxCopy').addEventListener('click', async () => { const id=contextToolId; hideContext(); if(!id)return; await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${id}`); toast('Tool link copied'); });

addEventListener('popstate', () => {
  const id = location.hash.slice(1);
  if (id && tools.some(t => t.id === id)) {
    if (ui.tool.open) ui.tool.close();
    openTool(id, false);
  } else if (ui.tool.open) ui.tool.close();
});

renderTabs();
renderCards();
const initial = location.hash.slice(1);
if (tools.some(t => t.id === initial)) openTool(initial, false);

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
