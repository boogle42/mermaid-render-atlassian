/**
 * Service worker: injects Mermaid on demand, and registers the content
 * scripts for any extra Atlassian hosts the user added in settings.
 */

const CUSTOM_SCRIPT_ID = 'custom-hosts';
const CONTENT_SCRIPT = {
  js: ['content/detect.js', 'content/main.js'],
  css: ['content/style.css'],
  runAt: 'document_idle',
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'load-mermaid' || !sender.tab) return false;
  chrome.scripting
    .executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId] },
      files: ['vendor/mermaid.min.js'],
    })
    .then(
      () => sendResponse({ ok: true }),
      (err) => sendResponse({ ok: false, error: String(err?.message ?? err) }),
    );
  return true;
});

async function syncCustomHosts() {
  const { customHosts = [] } = await chrome.storage.sync.get('customHosts');
  const granted = [];
  for (const origin of customHosts) {
    if (await chrome.permissions.contains({ origins: [origin] })) granted.push(origin);
  }
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [CUSTOM_SCRIPT_ID] });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [CUSTOM_SCRIPT_ID] });
  if (granted.length) {
    await chrome.scripting.registerContentScripts([
      { id: CUSTOM_SCRIPT_ID, matches: granted, persistAcrossSessions: true, ...CONTENT_SCRIPT },
    ]);
  }
}

chrome.runtime.onInstalled.addListener(syncCustomHosts);
chrome.runtime.onStartup.addListener(syncCustomHosts);
chrome.permissions.onAdded.addListener(syncCustomHosts);
chrome.permissions.onRemoved.addListener(syncCustomHosts);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.customHosts) syncCustomHosts();
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
