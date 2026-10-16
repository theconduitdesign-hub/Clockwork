// A small markdown renderer for "Done when" notes: headings, bullets, numbered lists,
// tickable checklists, bold, italics and inline code. Ticking a box rewrites the source line.
import React from 'react';

const CHECK = /^(\s*)[-*]\s+\[( |x|X)\]\s+(.*)$/;
const BULLET = /^(\s*)[-*]\s+(.*)$/;
const NUMBER = /^(\s*)\d+[.)]\s+(.*)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;

// Inline: **bold**, *italic* or _italic_, `code`.
function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Groups lines into blocks: { type, items | text, line }.
function parse(src) {
  const lines = (src || '').split('\n');
  const blocks = [];
  lines.forEach((raw, line) => {
    const prev = blocks[blocks.length - 1];
    let m;
    if (!raw.trim()) {
      blocks.push({ type: 'gap' });
    } else if ((m = raw.match(HEADING))) {
      blocks.push({ type: 'h', level: m[1].length, text: m[2], line });
    } else if ((m = raw.match(CHECK))) {
      const item = { checked: m[2].toLowerCase() === 'x', text: m[3], line };
      if (prev?.type === 'check') prev.items.push(item);
      else blocks.push({ type: 'check', items: [item] });
    } else if ((m = raw.match(BULLET))) {
      if (prev?.type === 'ul') prev.items.push({ text: m[2], line });
      else blocks.push({ type: 'ul', items: [{ text: m[2], line }] });
    } else if ((m = raw.match(NUMBER))) {
      if (prev?.type === 'ol') prev.items.push({ text: m[2], line });
      else blocks.push({ type: 'ol', items: [{ text: m[2], line }] });
    } else if (prev?.type === 'p') {
      prev.text += ` ${raw.trim()}`;
    } else {
      blocks.push({ type: 'p', text: raw.trim(), line });
    }
  });
  return blocks.filter((b, i, a) => b.type !== 'gap' || (i > 0 && a[i - 1].type !== 'gap'));
}

export function checklistProgress(src) {
  const items = (src || '').split('\n').filter((l) => CHECK.test(l));
  return { total: items.length, done: items.filter((l) => /\[(x|X)\]/.test(l)).length };
}

export function toggleLine(src, line) {
  const lines = src.split('\n');
  lines[line] = lines[line].replace(/\[( |x|X)\]/, (m) => (m === '[ ]' ? '[x]' : '[ ]'));
  return lines.join('\n');
}

export default function Markdown({ source, onChange, className = '' }) {
  const blocks = parse(source);
  return (
    <div className={`md ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === 'gap') return null;
        if (b.type === 'h') {
          const H = b.level === 1 ? 'h3' : 'h4';
          return <H key={i} className="d">{inline(b.text, i)}</H>;
        }
        if (b.type === 'p') return <p key={i}>{inline(b.text, i)}</p>;
        if (b.type === 'ul') return <ul key={i}>{b.items.map((it) => <li key={it.line}>{inline(it.text, it.line)}</li>)}</ul>;
        if (b.type === 'ol') return <ol key={i}>{b.items.map((it) => <li key={it.line}>{inline(it.text, it.line)}</li>)}</ol>;
        return (
          <ul key={i} className="md-check">
            {b.items.map((it) => (
              <li key={it.line} className={it.checked ? 'on' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={it.checked}
                    disabled={!onChange}
                    onChange={() => onChange?.(toggleLine(source, it.line))}
                  />
                  <span>{inline(it.text, it.line)}</span>
                </label>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
