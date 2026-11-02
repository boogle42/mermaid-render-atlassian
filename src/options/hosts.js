/** Hosts the extension covers without any setup. Keep in sync with manifest.json. */
export const BUILT_IN_HOSTS = [
  { pattern: 'https://*.atlassian.net/*', label: 'Jira and Confluence Cloud (*.atlassian.net)' },
  { pattern: 'https://*.jira.com/*', label: 'Jira and Confluence Cloud, older sites (*.jira.com)' },
  { pattern: 'https://bitbucket.org/*', label: 'Bitbucket Cloud (bitbucket.org)' },
];

/**
 * Turns user input such as "jira.example.com", "https://wiki.example.com/display/X"
 * or "http://localhost:8090" into a Chrome match pattern for that host.
 * Ports are dropped because match patterns match every port.
 * @param {string} input
 * @returns {string} match pattern, e.g. "https://jira.example.com/*"
 * @throws {Error} when the input is not a usable host
 */
export function toMatchPattern(input) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Enter a host name or URL.');
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`"${trimmed}" is not a valid host name or URL.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https sites are supported.');
  }
  if (!/^[a-z0-9.-]+$/i.test(url.hostname) || !url.hostname.includes('.') && url.hostname !== 'localhost') {
    throw new Error(`"${url.hostname}" is not a valid host name.`);
  }
  return `${url.protocol}//${url.hostname.toLowerCase()}/*`;
}

/**
 * True when a built-in pattern already covers this host pattern.
 * @param {string} pattern
 */
export function isBuiltIn(pattern) {
  const host = new URL(pattern.replace('/*', '/')).hostname;
  return pattern.startsWith('https://') &&
    (host.endsWith('.atlassian.net') || host.endsWith('.jira.com') || host === 'bitbucket.org');
}
