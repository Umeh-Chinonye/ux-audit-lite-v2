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
      div.textContent textContent = `${level}: ${
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

      const h3 = document.createElement("h3");
      h3.textContent = `${level.toUpperCase()} Issues`;
      el.findings.appendChild(h3);

      const ul = document.createElement("ul");
      issues.forEach((issue) => {
        const li = document.createElement("li");
        li.textContent = `${issue.observation} (${issue.signal})`;
        ul.appendChild(li);
      });

      el.findings.appendChild(ul);
    });

    if (source !== "live") {
      el.historyBanner.classList.remove("hidden");
      el.historyBannerText.textContent = `Saved audit: ${new Date(
        report.timestamp
      ).toLocaleString()}`;
    } else {
      el.historyBanner.classList.add("hidden");
    }
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

  // Event listeners for tabs and buttons
  document.getElementById("tab-audit").addEventListener("click", () => {
    showAuditPanel("audit");
  });
  document.getElementById("tab-history").addEventListener("click", () => {
    showAuditPanel("history");
  });
  document.getElementById("btn-back-history").addEventListener("click", () => {
    showAuditPanel("audit");
  });
  document.getElementById("btn-clear-history").addEventListener("click", () => {
    // TODO: Implement history clearing
    UXAuditHistory.clearAll();
    // TODO: Update history UI
  });
  document.getElementById("btn-rescan").addEventListener("click", () => {
    // Re-run the audit
    runAudit();
  });
  document.getElementById("btn-run-audit").addEventListener("click", () => {
    runAudit();
  });

  // Show audit panel by default when popup opens
  showAuditPanel("audit");

  // expose
  window.runAudit = runAudit;
});