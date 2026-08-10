/**
 * Renders the developer-handoff notes as browsable HTML, one page per feature.
 *
 *     node scripts/build-handoff-html.mjs      # writes "Developer Handoff/*.html"
 *
 * The markdown stays the source of truth and the HTML is generated from it, for the reason
 * build-docs-html.mjs already gives: a hand-converted copy is stale the moment the source changes,
 * and worse than no copy because it still looks authoritative. Re-run this after editing a note.
 *
 * What this build adds over the other one is a **Copy** control on every note, because these pages
 * are read to be pasted somewhere else — a ticket, a PR description, a spec. Copy hands back the
 * MARKDOWN SOURCE of that section rather than the rendered text: markdown is what every tracker this
 * would land in accepts, and the rendered version loses the tables and the emphasis on the way.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escape, inline, slug, convert, setLinkResolver } from './lib/markdown.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'Developer Handoff');

// Pages are discovered rather than listed: a new feature note is a new file, and having to remember
// to register it here is how one comes to be missing from the nav it belongs in.
const pages = readdirSync(dir)
  .filter(name => name.endsWith('.md'))
  .sort((a, b) => (a === 'README.md' ? -1 : b === 'README.md' ? 1 : a.localeCompare(b)))
  .map(file => ({
    file,
    out: file === 'README.md' ? 'index.html' : file.replace(/\.md$/, '.html'),
    // The H1 is the page's name in the nav. Falls back to the filename, which is never wrong, only
    // ugly — a note with no H1 is a note being written, not a build failure.
    title: (readFileSync(resolve(dir, file), 'utf8').match(/^#\s+(.*)$/m)?.[1] ?? basename(file, '.md')).trim()
  }));

// A cross-link between notes points at the rendered sibling, so the set browses as one thing.
setLinkResolver(href => pages.find(page => href === page.file)?.out ?? href);

/**
 * Split a document into its notes.
 *
 * A note is an H2 with its H3s nested inside it, which is the unit these documents are written in and
 * so the unit worth copying: "2.4 Bin outlines" is a whole thought, and "§2" is that thought plus its
 * siblings. Anything above the first H2 is the page's own preamble and gets no button — copying "the
 * bit before the first heading" is not a thing anyone wants.
 */
function notes(md) {
  const lines = md.split('\n');
  const preamble = [];
  const sections = [];
  let current = null;
  let sub = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)$/);
    const h3 = line.match(/^###\s+(.*)$/);

    if (h2) {
      current = { title: h2[1].trim(), body: [], children: [] };
      sub = null;
      sections.push(current);
      continue;
    }
    if (h3 && current) {
      sub = { title: h3[1].trim(), body: [], children: [] };
      current.children.push(sub);
      continue;
    }
    (sub ?? current ?? { body: preamble }).body.push(line);
  }

  return { preamble, sections };
}

/** A note's markdown, its own and its children's — what the Copy button hands back. */
const rawOf = (node, level) =>
  [
    `${'#'.repeat(level)} ${node.title}`,
    ...node.body,
    ...node.children.map(child => rawOf(child, level + 1))
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

let copyId = 0;

function renderNote(node, level, toc) {
  const id = slug(node.title);
  const store = `src-${++copyId}`;
  toc.push({ level, text: node.title, id });

  return `
<section class="note level-${level}">
  <div class="note-head">
    <h${level} id="${id}"><a class="anchor" href="#${id}">${inline(node.title)}</a></h${level}>
    <button type="button" class="copy" data-copy="${store}" title="Copy this note as markdown">Copy</button>
  </div>
  <pre class="src" id="${store}" hidden>${escape(rawOf(node, level))}</pre>
  ${convert(node.body.join('\n')).html}
  ${node.children.map(child => renderNote(child, level + 1, toc)).join('\n')}
</section>`;
}

const page = ({ title, preamble, body, toc, current, wholeDoc }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(title)} — Developer Handoff</title>
<style>
  :root {
    --bg: #ffffff; --panel: #f7f8fa; --text: #1b1f24; --muted: #5c6672; --rule: #e3e7ec;
    --link: #095192; --code-bg: #f2f4f7; --accent: #095192; --ok: #15803d;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14171a; --panel: #1b1f23; --text: #e6e9ec; --muted: #9aa4af; --rule: #2b3137;
      --link: #7fb2e5; --code-bg: #22272c; --accent: #7fb2e5; --ok: #6fcf8e;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .shell { display: grid; grid-template-columns: 280px minmax(0, 1fr); }
  nav {
    position: sticky; top: 0; align-self: start; height: 100vh; overflow-y: auto;
    background: var(--panel); border-right: 1px solid var(--rule); padding: 24px 18px 48px;
  }
  nav .brand { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  nav .docs { display: flex; flex-direction: column; gap: 2px; margin-bottom: 22px; }
  nav .docs a { padding: 6px 8px; border-radius: 4px; font-size: 13px; text-decoration: none; color: var(--muted); }
  nav .docs a.current { background: var(--accent); color: #fff; font-weight: 500; }
  nav h2 { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 8px 8px; font-weight: 600; }
  nav ol { list-style: none; margin: 0; padding: 0; }
  nav ol a { display: block; padding: 4px 8px; border-radius: 4px; font-size: 13px; color: var(--muted); text-decoration: none; }
  nav ol a:hover { background: rgba(127,127,127,.12); color: var(--text); }
  nav ol a.active { color: var(--link); font-weight: 600; }
  nav li.sub a { padding-left: 20px; font-size: 12.5px; }
  main { padding: 40px 48px 120px; max-width: 980px; }
  header.page { border-bottom: 1px solid var(--rule); padding-bottom: 20px; margin-bottom: 28px; }
  header.page h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: -.01em; }
  header.page .meta { color: var(--muted); font-size: 14px; }
  header.page .actions { margin-top: 14px; }
  h2, h3, h4 { line-height: 1.3; letter-spacing: -.01em; margin: 0; }
  h2 { font-size: 22px; } h3 { font-size: 17px; } h4 { font-size: 15px; }
  .anchor { color: inherit; text-decoration: none; }
  .anchor:hover::after { content: " #"; color: var(--muted); font-weight: 400; }
  .note { scroll-margin-top: 24px; }
  .note.level-2 { margin-top: 40px; padding-top: 8px; border-top: 1px solid var(--rule); }
  .note.level-3 { margin-top: 26px; }
  .note-head { display: flex; align-items: baseline; gap: 12px; }
  .note-head h2, .note-head h3 { flex: 1; min-width: 0; }
  .copy {
    flex: none; font: inherit; font-size: 12px; line-height: 1; padding: 6px 10px; cursor: pointer;
    border-radius: 4px; border: 1px solid var(--rule); background: var(--bg); color: var(--muted);
    transition: color .12s, border-color .12s;
  }
  .copy:hover { color: var(--link); border-color: var(--link); }
  .copy.done { color: var(--ok); border-color: var(--ok); }
  .copy.wide { font-size: 13px; padding: 8px 14px; }
  p, ul, ol, table { margin: 14px 0; }
  li { margin: 4px 0; }
  code { background: var(--code-bg); padding: 1px 5px; border-radius: 3px; font-size: 13.5px; }
  pre { background: var(--code-bg); padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  pre.src { display: none; }
  a { color: var(--link); }
  img {
    display: block; max-width: 100%; height: auto; margin: 18px 0;
    border: 1px solid var(--rule); border-radius: 6px;
  }
  .table-scroll { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 14.5px; }
  th, td { border: 1px solid var(--rule); padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: var(--panel); font-weight: 600; }
  blockquote { margin: 14px 0; padding: 2px 16px; border-left: 3px solid var(--rule); color: var(--muted); }
  hr { border: 0; border-top: 1px solid var(--rule); margin: 28px 0; }
  @media (max-width: 900px) {
    .shell { grid-template-columns: 1fr; }
    nav { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--rule); }
    main { padding: 28px 20px 80px; }
  }
</style>
</head>
<body>
<div class="shell">
  <nav>
    <div class="brand">Developer Handoff</div>
    <div class="docs">
      ${pages
        .map(
          entry =>
            `<a href="${entry.out}"${entry.out === current ? ' class="current"' : ''}>${escape(entry.title)}</a>`
        )
        .join('\n      ')}
    </div>
    <h2>On this page</h2>
    <ol>
      ${toc
        .map(
          entry => `<li${entry.level === 3 ? ' class="sub"' : ''}><a href="#${entry.id}">${inline(entry.text)}</a></li>`
        )
        .join('\n      ')}
    </ol>
  </nav>
  <main>
    <header class="page">
      <h1>${escape(title)}</h1>
      <div class="meta">Generated from ${escape(current.replace(/\.html$/, '.md'))} — edit the markdown, then re-run <code>node scripts/build-handoff-html.mjs</code>.</div>
      <div class="actions">
        <button type="button" class="copy wide" data-copy="whole-doc">Copy whole document</button>
      </div>
    </header>
    <pre class="src" id="whole-doc" hidden>${escape(wholeDoc)}</pre>
    ${preamble}
    ${body}
  </main>
</div>
<script>
  // execCommand is the fallback, not the relic it looks like: these pages are opened straight off
  // disk as often as they are served, and navigator.clipboard is unavailable on a file:// origin.
  function put(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    return new Promise((done, fail) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      ok ? done() : fail(new Error('copy refused'));
    });
  }

  addEventListener('click', event => {
    const button = event.target.closest('.copy');
    if (!button) return;
    const source = document.getElementById(button.dataset.copy);
    if (!source) return;
    const label = button.dataset.label ?? button.textContent;
    button.dataset.label = label;
    put(source.textContent).then(
      () => {
        button.textContent = 'Copied';
        button.classList.add('done');
      },
      () => {
        // Says what happened rather than pretending it worked — a button that reports success and
        // leaves the clipboard untouched is worse than one that fails out loud.
        button.textContent = 'Press ⌘C';
        const range = document.createRange();
        source.hidden = false;
        range.selectNodeContents(source);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
    );
    setTimeout(() => {
      button.textContent = label;
      button.classList.remove('done');
      source.hidden = true;
    }, 1600);
  });

  // Scroll-spy, so the sidebar says where you are.
  let queued = false;
  function spy() {
    queued = false;
    const links = [...document.querySelectorAll('nav ol a')];
    let active = 0;
    links.forEach((link, index) => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (target && target.getBoundingClientRect().top < 120) active = index;
    });
    links.forEach((link, index) => link.classList.toggle('active', index === active));
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
</script>
</body>
</html>
`;

for (const entry of pages) {
  const md = readFileSync(resolve(dir, entry.file), 'utf8');
  // The H1 is the page header's job; leaving it in the body would print the title twice.
  const withoutTitle = md.replace(/^#\s+.*\n/, '');
  const { preamble, sections } = notes(withoutTitle);
  const toc = [];
  const body = sections.map(section => renderNote(section, 2, toc)).join('\n');

  writeFileSync(
    resolve(dir, entry.out),
    page({
      title: entry.title,
      preamble: convert(preamble.join('\n')).html,
      body,
      toc,
      current: entry.out,
      wholeDoc: md.trim()
    })
  );
  console.log(`✓ ${entry.out.padEnd(26)} ${sections.length} notes, ${toc.length} headings`);
}

console.log('\nOpen: "Developer Handoff/index.html"');
