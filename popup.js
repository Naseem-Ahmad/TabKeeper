document.addEventListener("DOMContentLoaded", () => {

  // refresh load list
  function refreshArchivesList() {
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
}

  // ------------------ ACCORDION ------------------
  const sections = document.querySelectorAll(".accordion-section");
  sections.forEach(sec => {
    sec.querySelector(".accordion-header").addEventListener("click", () => {
      sections.forEach(s => s.classList.remove("active"));
      sec.classList.add("active");
    });
  });


  // ------------------ HELPERS ------------------
  function prettyTimestamp() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  function setStatus(msg, error = false) {
    statusEl.textContent = msg;
    statusEl.style.color = error ? "red" : "green";
  }

  function escapeXml(s) {
    if (!s) return "";
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }


  // ------------------ DOM ELEMENTS ------------------
  const scanBtn = document.getElementById("scanBtn");
  const archiveBtn = document.getElementById("archiveBtn"); 
  const savearchiveBtn = document.getElementById("savearchiveBtn");
  const tabsList = document.getElementById("tabsList");

  const loadArchivesBtn = document.getElementById("loadArchivesBtn");
  const restoreLatestBtn = document.getElementById("restoreLatestBtn");
  const archivesList = document.getElementById("archivesList");

  const exportBtn = document.getElementById("exportBtn");
  const exportFormatDropdown = document.getElementById("exportFormat");

  const selectAllTabsBtn = document.getElementById("selectAllTabsBtn");
  const deselectAllTabsBtn = document.getElementById("deselectAllTabsBtn");

  const statusEl = document.getElementById("status");

  let scannedTabs = [];


  // ------------------ SCAN TABS ------------------
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


  // ------------------ SAVE ARCHIVE & CLOSE------------------
  // function saveArchive(archive) {
  //   chrome.storage.local.get(["archives"], r => {
  //     const arr = r.archives || [];
  //     arr.unshift(archive);
  //     chrome.storage.local.set({ archives: arr.slice(0, 50) });
  //   });
  // }

  function saveArchive(archive) {
  return new Promise(resolve => {
    chrome.storage.local.get(["archives"], r => {
      const arr = r.archives || [];
      arr.unshift(archive);

      chrome.storage.local.set({ archives: arr.slice(0, 50) }, () => {
        resolve(); // IMPORTANT!
      });
    });
  });
}



    // ------------------ SAVE ARCHIVE------------------
/*   function savetoArchive(archive) {
    chrome.storage.local.get(["archives"], r => {
      const arr = r.archives || [];
      arr.unshift(archive);
      chrome.storage.local.set({ archives: arr.slice(0, 50) });
    });
  } */

  // ------------------ Save ARCHIVE  ------------------
/*   savearchiveBtn.onclick = () => {
    const checks = [...tabsList.querySelectorAll("input:checked")];
    if (!checks.length) return setStatus("No tabs selected.", true);

    const selected = checks.map(c => scannedTabs[c.dataset.i]);
    const selectedDomNodes = checks.map(c => c.closest(".item"));

    let name = prompt("Name this archive (optional):", "");
    if (!name || !name.trim()) name = "Archive - " + prettyTimestamp();

    const archive = {
      name,
      ts: new Date().toISOString(),
      count: selected.length,
      tabs: selected.map(t => ({ title: t.title, url: t.url }))
    };

    savetoArchive(archive);

   // const ids = selected.map(t => t.id);

 //  chrome.tabs.remove(ids, () => {
  //    if (chrome.runtime.lastError)
//        return setStatus(chrome.runtime.lastError.message, true);

  //    setStatus(`Save Archived ${ids.length} tabs.`);

   //   selectedDomNodes.forEach(node => {
  //      node.classList.add("fade-out");
   //     setTimeout(() => node.remove(), 250);
  //    });

      
//    });
  //  refreshArchivesList();
    //setStatus("Save to Archive", true)
    
  setStatus(`Saved ${selected.length} tabs to archive.`);

  refreshArchivesList(); // refresh archive panel

  }; */
savearchiveBtn.onclick = async () => {
  const checks = [...tabsList.querySelectorAll("input:checked")];
  if (!checks.length) return setStatus("No tabs selected.", true);

  const selected = checks.map(c => scannedTabs[c.dataset.i]);

  let name = prompt("Name this archive (optional):", "");
  if (!name || !name.trim()) name = "Archive - " + prettyTimestamp();

  const archive = {
    name,
    ts: new Date().toISOString(),
    count: selected.length,
    tabs: selected.map(t => ({ title: t.title, url: t.url }))
  };

  await saveArchive(archive);   // ⬅ MUST WAIT before refreshing!

  setStatus(`Saved ${selected.length} tabs to archive.`);

  refreshArchivesList();          // Now it updates correctly
};


   // ------------------ Save ARCHIVE & close ------------------
  archiveBtn.onclick = () => {
    const checks = [...tabsList.querySelectorAll("input:checked")];
    if (!checks.length) return setStatus("No tabs selected.", true);

    const selected = checks.map(c => scannedTabs[c.dataset.i]);
    const selectedDomNodes = checks.map(c => c.closest(".item"));

    let name = prompt("Name this archive (optional):", "");
    if (!name || !name.trim()) name = "Archive - " + prettyTimestamp();

    const archive = {
      name,
      ts: new Date().toISOString(),
      count: selected.length,
      tabs: selected.map(t => ({ title: t.title, url: t.url }))
    };

    saveArchive(archive);

    const ids = selected.map(t => t.id);

    chrome.tabs.remove(ids, () => {
      if (chrome.runtime.lastError)
        return setStatus(chrome.runtime.lastError.message, true);

      setStatus(`Archived & closed ${ids.length} tabs.`);

      selectedDomNodes.forEach(node => {
        node.classList.add("fade-out");
        setTimeout(() => node.remove(), 250);
      });

      scannedTabs = scannedTabs.filter(t => !ids.includes(t.id));
    });
  };


  // ------------------ LOAD ARCHIVES ------------------
 loadArchivesBtn.onclick = refreshArchivesList;



  // ------------------ RESTORE ------------------
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


  // ------------------ SELECT / DESELECT ALL ------------------
  selectAllTabsBtn.onclick = () => {
    document.querySelectorAll('#tabsList input[type="checkbox"]')
      .forEach(cb => cb.checked = true);
  };

  deselectAllTabsBtn.onclick = () => {
    document.querySelectorAll('#tabsList input[type="checkbox"]')
      .forEach(cb => cb.checked = false);
  };


  // ---------------------------------------------------------------------
  // ---------------------- ⭐ NEW EXPORT ENGINE ⭐ -----------------------
  // ---------------------------------------------------------------------

  function timestampForFilename() {
    const d = new Date();
    return (
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "_" +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0") +
      String(d.getSeconds()).padStart(2, "0")
    );
  }

  function tabsToText(tabs) {
    return tabs.map((t, i) =>
      `${i + 1}. ${t.title || "(no title)"}\n${t.url}`
    ).join("\n\n");
  }

  function tabsToCsv(tabs) {
    const header = "title,url";
    const rows = tabs.map(t =>
      `"${(t.title || "").replace(/"/g, '""')}","${(t.url || "").replace(/"/g, '""')}"`
    );
    return header + "\n" + rows.join("\n");
  }

  function tabsToJson(tabs) {
    return JSON.stringify(
      tabs.map(t => ({ title: t.title, url: t.url })),
      null,
      2
    );
  }

  function downloadContent(filename, content, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      { url, filename, conflictAction: "uniquify" },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError.message);
          setStatus(chrome.runtime.lastError.message, true);
        }
        setTimeout(() => URL.revokeObjectURL(url), 8000);
      }
    );
  }

  function exportTabs(onlyCurrentWindow = false) {
    const queryOptions = onlyCurrentWindow ? { currentWindow: true } : {};

    chrome.tabs.query(queryOptions, tabs => {
      if (!tabs.length) return setStatus("No open tabs.", true);

      const fmt = exportFormatDropdown.value;
      const ts = timestampForFilename();

      let content = "";
      let filename = "";
      let mime = "";

      if (fmt === "txt") {
        content = tabsToText(tabs);
        filename = `tabs-${ts}.txt`;
        mime = "text/plain";

      } else if (fmt === "csv") {
        content = tabsToCsv(tabs);
        filename = `tabs-${ts}.csv`;
        mime = "text/csv";

      } else if (fmt === "json") {
        content = tabsToJson(tabs);
        filename = `tabs-${ts}.json`;
        mime = "application/json";
      }

      downloadContent(filename, content, mime);
      setStatus("Export complete!");
    });
  }

  // Export ALL tabs
  exportBtn.onclick = () => exportTabs(false);

}); // END DOMContentLoaded
