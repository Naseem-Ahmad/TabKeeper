document.addEventListener("DOMContentLoaded", () => {



  
// ------------------ ACCORDION BEHAVIOR ------------------
const sections = document.querySelectorAll(".accordion-section");

sections.forEach(sec => {
  sec.querySelector(".accordion-header").addEventListener("click", () => {

    // Close all other sections
    sections.forEach(s => s.classList.remove("active"));

    // Open clicked section
    sec.classList.add("active");
  });
});

function prettyTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}





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
  const checks = [...tabsList.querySelectorAll("input:checked")];
  if (!checks.length) return setStatus("No tabs selected.", true);

  const selected = checks.map(c => scannedTabs[c.dataset.i]);
  const selectedDomNodes = checks.map(c => c.closest(".item")); // ⭐ needed for animation

  // Ask user for name
  let name = prompt("Name this archive (optional):", "");
  if (!name || !name.trim()) {
    name = "Archive - " + prettyTimestamp();
  }

  const archive = {
    name,
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

    // ⭐ Fade-out + remove only selected rows (no re-scan)
    selectedDomNodes.forEach(node => {
      if (!node) return;

      node.classList.add("fade-out"); // add animation

      setTimeout(() => {
        if (node && node.parentNode) {
          node.parentNode.removeChild(node); // remove after animation
        }
      }, 250);
    });

    // ⭐ Update scannedTabs to remove closed tabs
    scannedTabs = scannedTabs.filter(t => !ids.includes(t.id));
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
        <b>${a.name}</b><br>
        ${a.count} tabs — ${a.ts}<br>
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


