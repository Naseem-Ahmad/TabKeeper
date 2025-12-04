document.addEventListener("DOMContentLoaded", () => {

const scanBtn = document.getElementById("scanBtn");
const archiveBtn = document.getElementById("archiveBtn");
const tabsList = document.getElementById("tabsList");

const loadArchivesBtn = document.getElementById("loadArchivesBtn");
const restoreLatestBtn = document.getElementById("restoreLatestBtn");
const archivesList = document.getElementById("archivesList");

const statusEl = document.getElementById("status");

let scannedTabs = [];

function setStatus(msg, error = false) {
  statusEl.textContent = msg;
  statusEl.style.color = error ? "red" : "green";
}

// -------------- SCAN TABS --------------
scanBtn.onclick = () => {
  chrome.tabs.query({}, tabs => {
    scannedTabs = tabs;
    tabsList.innerHTML = "";

    tabs.forEach((t, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <input type="checkbox" data-i="${i}"> 
        <b>${t.title}</b><br>
        ${t.url}
      `;
      tabsList.appendChild(div);
    });

    setStatus(`Scanned ${tabs.length} tabs.`);
  });
};

function saveArchive(archive) {
  chrome.storage.local.get(["archives"], r => {
    const arr = r.archives || [];
    arr.unshift(archive);
    chrome.storage.local.set({ archives: arr.slice(0, 50) });
  });
}

// -------------- ARCHIVE & CLOSE --------------
archiveBtn.onclick = () => {
  const checks = tabsList.querySelectorAll("input:checked");
  if (!checks.length) return setStatus("No tabs selected.", true);

  const selected = [...checks].map(c => scannedTabs[c.dataset.i]);

  const archive = {
    ts: new Date().toISOString(),
    count: selected.length,
    tabs: selected.map(t => ({ url: t.url, title: t.title }))
  };

  saveArchive(archive);

  const ids = selected.map(t => t.id);

  chrome.tabs.remove(ids, () => {
    if (chrome.runtime.lastError)
      return setStatus(chrome.runtime.lastError.message, true);
    setStatus(`Archived & closed ${ids.length} tabs.`);
  });
};

// -------------- LOAD ARCHIVES --------------
loadArchivesBtn.onclick = () => {
  chrome.storage.local.get(["archives"], r => {
    const arr = r.archives || [];
    archivesList.innerHTML = "";
    arr.forEach((a, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <b>Archive ${i+1} — ${a.count} tabs</b><br>
        ${a.ts}<br>
        <button data-i="${i}">Open</button>
      `;
      archivesList.appendChild(div);
    });
  });
};

// -------------- RESTORE LATEST --------------
restoreLatestBtn.onclick = () => {
  chrome.storage.local.get(["archives"], r => {
    const arr = r.archives || [];
    if (!arr.length) return setStatus("No archives.", true);

    const latest = arr[0];

    latest.tabs.forEach(t => chrome.tabs.create({ url: t.url }));
    setStatus(`Restored ${latest.count} tabs.`);
  });
};

archivesList.onclick = e => {
  if (!e.target.matches("button")) return;
  const idx = e.target.dataset.i;
  chrome.storage.local.get(["archives"], r => {
    const arc = r.archives[idx];
    arc.tabs.forEach(t => chrome.tabs.create({ url: t.url }));
    setStatus(`Restored ${arc.count} tabs.`);
  });
};

});
