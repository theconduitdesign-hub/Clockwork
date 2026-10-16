// Colour themes, taken from the brand colour directions. Teal + Gold is the default.
// Each theme sets the CSS variables the whole app reads, including the seven target colours (--c0 … --c6).

export const THEMES = [
  {
    id: 'teal',
    name: 'Teal + Gold',
    note: 'Soft and inviting, gold for success',
    vars: {
      '--teal': '#0E6B6B', '--teal-dark': '#0B5757', '--teal-tint': '#E3EFEE', '--on-primary-soft': '#CFE6E3',
      '--sand': '#F4F1EA', '--outer': '#E9E5DC', '--ink': '#14201F', '--muted': '#4D5A59', '--soft-text': '#3A4847',
      '--neutral-tint': '#E9E6DF', '--tab-idle': '#5B6766', '--gold': '#D4A63A',
      '--c0': '#0E6B6B', '--c1': '#14201F', '--c2': '#4E9C97', '--c3': '#6E8C8A', '--c4': '#2F5D7C', '--c5': '#8A6E4B', '--c6': '#5B4B7A',
    },
  },
  {
    id: 'red',
    name: 'Signature Red',
    note: 'Bold and recognisable',
    vars: {
      '--teal': '#C4261D', '--teal-dark': '#9E1E16', '--teal-tint': '#FBE6E4', '--on-primary-soft': '#F8D3D0',
      '--sand': '#FBF7F2', '--outer': '#EFE9E1', '--ink': '#1E1A1A', '--muted': '#5A5150', '--soft-text': '#463D3C',
      '--neutral-tint': '#EDE7E2', '--tab-idle': '#6A605E', '--gold': '#E2A62B',
      '--c0': '#C4261D', '--c1': '#1E1A1A', '--c2': '#D9786F', '--c3': '#8C7B74', '--c4': '#2F5D7C', '--c5': '#8A6E4B', '--c6': '#5B4B7A',
    },
  },
  {
    id: 'green',
    name: "Banker's Green",
    note: 'Money, growth, classic banking',
    vars: {
      '--teal': '#1F5C45', '--teal-dark': '#174634', '--teal-tint': '#E2EEE7', '--on-primary-soft': '#CBE2D6',
      '--sand': '#F5F0E6', '--outer': '#E8E2D5', '--ink': '#1A211D', '--muted': '#4F5A54', '--soft-text': '#3B4640',
      '--neutral-tint': '#E8E4DA', '--tab-idle': '#5F6A64', '--gold': '#C99A2E',
      '--c0': '#1F5C45', '--c1': '#1A211D', '--c2': '#5E9A80', '--c3': '#7A8C80', '--c4': '#2F5D7C', '--c5': '#8A6E4B', '--c6': '#5B4B7A',
    },
  },
  {
    id: 'navy',
    name: 'Private Bank Navy',
    note: 'Trust and calm, coral accents',
    vars: {
      '--teal': '#1E2D57', '--teal-dark': '#162242', '--teal-tint': '#E4E8F2', '--on-primary-soft': '#CDD4E8',
      '--sand': '#F6F3EE', '--outer': '#E9E5DE', '--ink': '#151A26', '--muted': '#4E5464', '--soft-text': '#3A3F4D',
      '--neutral-tint': '#E8E6E1', '--tab-idle': '#5E6474', '--gold': '#D4A52F',
      '--c0': '#1E2D57', '--c1': '#D2553A', '--c2': '#5B6FA3', '--c3': '#8A90A6', '--c4': '#2F6B6B', '--c5': '#8A6E4B', '--c6': '#5B4B7A',
    },
  },
  {
    id: 'oxblood',
    name: 'Oxblood',
    note: 'Leather and heritage',
    vars: {
      '--teal': '#74202C', '--teal-dark': '#5A1822', '--teal-tint': '#F3E3E5', '--on-primary-soft': '#EBCDD1',
      '--sand': '#F7F1EA', '--outer': '#ECE3DA', '--ink': '#221A1A', '--muted': '#5B5050', '--soft-text': '#473C3C',
      '--neutral-tint': '#EDE5DF', '--tab-idle': '#6B5F5F', '--gold': '#C9A24A',
      '--c0': '#74202C', '--c1': '#221A1A', '--c2': '#B5646F', '--c3': '#8C7B7B', '--c4': '#2F5D7C', '--c5': '#8A6E4B', '--c6': '#5B4B7A',
    },
  },
];

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.vars['--teal']);
}
