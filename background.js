console.log("BACKGROUND.JS LOADED");

// removes multiple tabs
function removeTabs(tabIds) {
  return new Promise(resolve => {
    if (!tabIds.length) return resolve({ status: "done", removed: 0 });

    chrome.tabs.remove(tabIds, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        return resolve({ status: "error", message: err.message });
      }
      resolve({ status: "done", removed: tabIds.length });
    });
  });
}

// restores multiple tabs with delay
function openTabsSequentially(tabs, delay = 120) {
  return new Promise(resolve => {
    let i = 0;
    function next() {
      if (i >= tabs.length) {
        resolve({ status: "done", count: tabs.length });
        return;
      }
      const t = tabs[i++];
      chrome.tabs.create({ url: t.url }, () => {
        setTimeout(next, delay);
      });
    }
    next();
  });
}

// listens for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.action) return;

  if (msg.action === "closeTabs") {
    removeTabs(msg.tabIds || []).then(r => sendResponse({ result: r }));
    return true;
  }

  if (msg.action === "restoreTabs") {
    openTabsSequentially(msg.tabs || [], msg.delay || 120).then(r =>
      sendResponse({ result: r })
    );
    return true;
  }
});
