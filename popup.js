// popup.js

// Helper: format date to a friendly timestamp for filename
function timestampForFilename() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

// Read selected format from radio buttons
function getSelectedFormat() {
  const radios = document.getElementsByName('format');
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return 'txt';
}

// Convert tabs array to plain text
function tabsToText(tabs) {
  let lines = [];
  tabs.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.title || '(no title)'}\n${t.url}\n`);
  });
  return lines.join('\n');
}

// Convert tabs array to CSV (title,url). Titles/URLs will be quoted if needed.
function escapeCsvField(field) {
  if (field == null) return '';
  const s = String(field);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
function tabsToCsv(tabs) {
  const header = ['title', 'url'];
  const rows = tabs.map(t => `${escapeCsvField(t.title)} , ${escapeCsvField(t.url)}`);
  return header.join(',') + '\n' + rows.join('\n');
}

// Convert to JSON
function tabsToJson(tabs) {
  // For JSON, keep only title + url for each tab
  const simple = tabs.map(t => ({ title: t.title || null, url: t.url || null }));
  return JSON.stringify(simple, null, 2);
}

// Create blob, object URL, and trigger chrome.downloads.download
function downloadContent(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  // Use chrome.downloads API to save the file
  chrome.downloads.download({
    url: url,
    filename: filename,
    conflictAction: 'uniquify'
  }, downloadId => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError);
      showStatus('Download failed: ' + chrome.runtime.lastError.message, true);
    } else {
      showStatus('Download started: ' + filename, false);
    }
    // Revoke the object URL after a small delay to ensure download has started.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  });
}

// Show status in popup UI
function showStatus(text, isError = false) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.style.color = isError ? 'red' : '#333';
}

// Main function: query tabs and create file
async function saveTabs(onlyCurrentWindow = false) {
  showStatus('Gathering tabs...');
  try {
    // Query tabs: if onlyCurrentWindow is true, we need to find the active window id
    let queryOptions = {};
    if (onlyCurrentWindow) {
      // Query current (focused) window's tabs: chrome.tabs.query accepts windowId or 'currentWindow'
      queryOptions = { currentWindow: true };
    } else {
      queryOptions = {}; // all tabs
    }

    // chrome.tabs.query returns a promise in MV3 (Chrome) when using browser APIs with promise wrapper; to be safe use callback-style:
    chrome.tabs.query(queryOptions, (tabs) => {
      if (chrome.runtime.lastError) {
        showStatus('Failed to get tabs: ' + chrome.runtime.lastError.message, true);
        return;
      }

      if (!tabs || tabs.length === 0) {
        showStatus('No tabs found.', true);
        return;
      }

      const fmt = getSelectedFormat(); // 'txt' | 'csv' | 'json'
      const ts = timestampForFilename();
      let content, filename, mime;

      if (fmt === 'json') {
        content = tabsToJson(tabs);
        filename = `open-tabs-${ts}.json`;
        mime = 'application/json';
      } else if (fmt === 'csv') {
        content = tabsToCsv(tabs);
        filename = `open-tabs-${ts}.csv`;
        mime = 'text/csv';
      } else {
        content = tabsToText(tabs);
        filename = `open-tabs-${ts}.txt`;
        mime = 'text/plain';
      }

      downloadContent(filename, content, mime);
    });

  } catch (err) {
    console.error(err);
    showStatus('Error: ' + err.message, true);
  }
}

// Wire up UI
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('downloadAll').addEventListener('click', () => saveTabs(false));
  document.getElementById('downloadCurrent').addEventListener('click', () => saveTabs(true));
});
