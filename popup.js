// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  // Check if we are in an extension context
  if (!window.chrome || !window.chrome.runtime || !window.chrome.runtime || !window.chrome.tabs) {
    console.warn("[UXAUDIT] Not in extension context. Chrome APIs unavailable.");
    const el = {
      errorMsg: document.getElementById("error-message"),
    };
    if (el.errorMsg) {
      el.errorMsg.textContent = "This popup must be loaded as part of the Chrome extension. Please load the extension in Chrome and click its icon.";
    }
    showAuditPanel("error");
    return;
  }

  const el = {
    pageTitle: document.getElementById("page-title"),
    errorMsg: document.getElementById("error-message"),
    scoreValue: document.getElementById("score-value"),
    scoreLabel: document.getElementById("score-label"),
    severitySummary: document.getElementById("severity-summary"),
    metrics: document.getElementById("metrics"),
    findings: document.getElementById("findings"),
    historyBanner: document.getElementById("history-banner"),
    historyBannerText: document.getElementById("history-banner-text"),
  };

  function showAuditPanel(panelId) {
    document.querySelectorAll(".state").forEach((p) =>
      p.classList.add("hidden")
    );

    const panel = document.getElementById(`state-${panelId}`);
    if (panel) panel.classList.remove("hidden");
  }

  function renderReport(report, source) {
    if (!report) {
      el.errorMsg.textContent = "No audit data received";
      showAuditPanel("error");
      return;
    }

    el.scoreValue.textContent = report.uxScore;

    let grade = "F";
    if (report.uxScore >= 90) grade = "A";
    else if (report.uxScore >= 80) grade = "B";
    else if (report.uxScore >= 70) grade = "C";
    else if (report.uxScore >= 60) grade = "D";

    el.scoreLabel.textContent = grade;

    el.severitySummary.innerHTML = "";
    ["high", "medium", "low"].forEach((level) => {
      const div = document.createElement("div");
      div.className = "severity-item";
      div.textContent = `${level}: ${
        report.issuesBySeverity?.[level]?.length || 0
      }`;
      el.severitySummary.appendChild(div);
    });

    el.metrics.innerHTML = `
      <p>Page Type: ${report.pageType?.type || "unknown"}</p>
      <p>UX Score: ${report.uxScore}</p>
      <p>Audit Time: ${new Date(report.timestamp).toLocaleString()}</p>
    `;

    el.findings.innerHTML = "";
    ["high", "medium", "low"].forEach((level) => {
      const issues = report.issuesBySeverity?.[level] || [];
      if (!issues.length) return;

      const section = document.createElement("section");
      section.className = `issue-section ${level}`;

      const heading = document.createElement("h3");
      heading.textContent = `${level.toUpperCase()} Issues`;
      section.appendChild(heading);

      issues.forEach((issue) => {
        const article = document.createElement("article");
        article.className = "issue";

        const titleDiv = document.createElement("div");
        titleDiv.className = "issue-title";
        titleDiv.textContent = issue.signal
          .replace(/([A-Z])/g, " $1")
          .trim();
        article.appendChild(titleDiv);

        const noticed = document.createElement("div");
        noticed.className = "issue-noticed";
        noticed.innerHTML = `<strong>What We Noticed:</strong> ${issue.observation}`;
        article.appendChild(noticed);

        const why = document.createElement("div");
        why.className = "issue-why";
        why.innerHTML = `<strong>Why It Matters:</strong> ${issue.impact}`;
        article.appendChild(why);

        const rec = document.createElement("div");
        rec.className = "issue-recommendation";
        rec.innerHTML = `<strong>Recommendation:</strong> ${issue.recommendation}`;
        article.appendChild(rec);

        if (issue.evidence) {
          const ev = document.createElement("div");
          ev.className = "issue-evidence";
          ev.innerHTML = `<strong>Evidence:</strong> ${issue.evidence}`;
          article.appendChild(ev);
        }

        section.appendChild(article);
      });

      el.findings.appendChild(section);
    });

    if (source !== "live") {
      el.historyBanner.classList.remove("hidden");
      el.historyBannerText.textContent = `Saved audit: ${new Date(
        report.timestamp
      ).toLocaleString()}`;
    } else {
      el.historyBanner.classList.add("hidden");
    }
    
    showAuditPanel("results");
    el.pageTitle.textContent = "UX Audit Lite";
  }

  async function runAudit() {
    showAuditPanel("loading");
    el.pageTitle.textContent = "Running audit...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) throw new Error("No active tab found");

      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        throw new Error("Cannot audit this page");
      }

      console.log("[POPUP] sending request to background");

      const response = await chrome.runtime.sendMessage({
        action: "runAudit",
      });

      console.log("[POPUP] received response from background", response);

      if (!response) throw new Error("No response from background");

      if (response.success) {
        renderReport(response.report, "live");
        // Persist the audit
        UXAuditHistory.saveAudit(response.report);
      } else {
        throw new Error(response.error || "Audit failed");
      }
    } catch (err) {
      console.error(err);
      el.errorMsg.textContent =
        err.message || "Something went wrong during audit";
      showAuditPanel("error");
    }
  }

  async function loadHistory() {
    const listEl = document.getElementById("history-list");
    const emptyEl = document.getElementById("history-empty");
    const clearBtn = document.getElementById("btn-clear-history");
    
    listEl.innerHTML = "";
    
    try {
      const history = await UXAuditHistory.getAll();
      if (!history || history.length === 0) {
        emptyEl.classList.remove("hidden");
        clearBtn.classList.add("hidden");
        return;
      }
      
      emptyEl.classList.add("hidden");
      clearBtn.classList.remove("hidden");
      
      history.forEach(entry => {
        const li = document.createElement("li");
        li.className = "history-item";
        
        const content = document.createElement("div");
        content.className = "history-item__content";
        
        const title = document.createElement("p");
        title.className = "history-item__title";
        // Just show hostname for cleaner UI
        try {
          title.textContent = new URL(entry.url).hostname;
        } catch {
          title.textContent = entry.url;
        }
        
        const meta = document.createElement("p");
        meta.className = "history-item__meta";
        meta.textContent = `${new Date(entry.timestamp).toLocaleDateString()} • Score: ${entry.score}`;
        
        content.appendChild(title);
        content.appendChild(meta);
        
        li.appendChild(content);
        
        li.addEventListener("click", () => {
          // Make Audit tab active
          document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
          document.getElementById("tab-audit").classList.add("tab--active");
          
          renderReport(entry.report, "history");
        });
        
        listEl.appendChild(li);
      });
    } catch (err) {
      console.error("Failed to load history", err);
      emptyEl.classList.remove("hidden");
    }
  }

  // Event listeners for tabs and buttons
  document.getElementById("tab-audit").addEventListener("click", (e) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
    e.target.classList.add("tab--active");
    if (el.scoreValue.textContent !== "—") {
      showAuditPanel("results");
    } else {
      showAuditPanel("ready");
    }
  });

  document.getElementById("tab-history").addEventListener("click", async (e) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
    e.target.classList.add("tab--active");
    showAuditPanel("history");
    await loadHistory();
  });

  document.getElementById("btn-back-history").addEventListener("click", async () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
    document.getElementById("tab-history").classList.add("tab--active");
    showAuditPanel("history");
    await loadHistory();
  });

  document.getElementById("btn-clear-history").addEventListener("click", async () => {
    await UXAuditHistory.clearAll();
    await loadHistory();
  });

  document.getElementById("btn-rescan").addEventListener("click", () => {
    runAudit();
  });

  document.getElementById("btn-run-audit").addEventListener("click", () => {
    // Make Audit tab active
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
    document.getElementById("tab-audit").classList.add("tab--active");
    runAudit();
  });

  // Initialization: check if current URL has a recent audit
  (async function init() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const history = await UXAuditHistory.getAll();
        const existingAudit = history.find(entry => entry.url === tab.url);
        if (existingAudit) {
          renderReport(existingAudit.report, "history");
        } else {
          showAuditPanel("ready");
        }
      } else {
        showAuditPanel("ready");
      }
    } catch (err) {
      console.error(err);
      showAuditPanel("ready");
    }
  })();

  // expose
  window.runAudit = runAudit;
});