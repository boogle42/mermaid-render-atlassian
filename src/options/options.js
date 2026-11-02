import { BUILT_IN_HOSTS, isBuiltIn, toMatchPattern } from './hosts.js';

const builtInList = document.getElementById('built-in');
const customList = document.getElementById('custom');
const form = document.getElementById('add-form');
const hostInput = document.getElementById('host');
const errorText = document.getElementById('error');

const displayHost = (pattern) => pattern.replace(/^https:\/\//, '').replace(/\/\*$/, '');

for (const { label } of BUILT_IN_HOSTS) {
  const li = document.createElement('li');
  li.textContent = label;
  builtInList.append(li);
}

async function getCustomHosts() {
  const { customHosts = [] } = await chrome.storage.sync.get('customHosts');
  return customHosts;
}

async function renderCustomHosts() {
  const hosts = await getCustomHosts();
  customList.replaceChildren();
  if (!hosts.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'None added.';
    customList.append(li);
    return;
  }
  for (const pattern of hosts) {
    const granted = await chrome.permissions.contains({ origins: [pattern] });
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = displayHost(pattern) + (granted ? '' : ' (access not granted)');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      await chrome.storage.sync.set({ customHosts: (await getCustomHosts()).filter((h) => h !== pattern) });
      await chrome.permissions.remove({ origins: [pattern] }).catch(() => {});
      renderCustomHosts();
    });
    li.append(name, remove);
    customList.append(li);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorText.textContent = '';
  let pattern;
  try {
    pattern = toMatchPattern(hostInput.value);
  } catch (err) {
    errorText.textContent = err.message;
    return;
  }
  if (isBuiltIn(pattern)) {
    errorText.textContent = `${displayHost(pattern)} is already covered.`;
    return;
  }
  // permissions.request must run synchronously inside the click/submit gesture.
  chrome.permissions.request({ origins: [pattern] }).then(async (granted) => {
    if (!granted) {
      errorText.textContent = 'Access was not granted, so the site was not added.';
      return;
    }
    const hosts = await getCustomHosts();
    if (!hosts.includes(pattern)) await chrome.storage.sync.set({ customHosts: [...hosts, pattern] });
    hostInput.value = '';
    renderCustomHosts();
  });
});

const { theme } = await chrome.storage.sync.get({ theme: 'auto' });
for (const radio of document.querySelectorAll('input[name="theme"]')) {
  radio.checked = radio.value === theme;
  radio.addEventListener('change', () => chrome.storage.sync.set({ theme: radio.value }));
}

renderCustomHosts();
