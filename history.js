/**
 * Simple history storage for UX Audit Lite V2
 * Uses chrome.storage.local to persist audit reports.
 */

const UXAuditHistory = (function () {
  const STORAGE_KEY = 'ux-audit-history';

  function getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const history = result[STORAGE_KEY] || [];
        // Ensure it's an array
        if (!Array.isArray(history)) {
          console.warn('History storage corrupted, resetting');
          chrome.storage.local.set({ [STORAGE_KEY]: [] });
          resolve([]);
        } else {
          // Sort by timestamp descending (newest first)
          const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(sorted);
        }
      });
    });
  }

  function saveAudit(report) {
    return new Promise((resolve, reject) => {
      if (!report || !report.pageUrl) {
        reject(new Error('Invalid report'));
        return;
      }
      const entry = {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        title: report.pageUrl || 'Unknown',
        url: report.pageUrl,
        score: report.uxScore || 0,
        timestamp: report.timestamp || new Date().toISOString(),
        report: report // store the full report for later retrieval
      };
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const history = result[STORAGE_KEY] || [];
        if (!Array.isArray(history)) {
          chrome.storage.local.set({ [STORAGE_KEY]: [] });
          resolve();
          return;
        }
        history.push(entry);
        chrome.storage.local.set({ [STORAGE_KEY]: history }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  function getById(id) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const history = result[STORAGE_KEY] || [];
        if (!Array.isArray(history)) {
          resolve(null);
          return;
        }
        const entry = history.find((e) => e.id === id) || null;
        resolve(entry);
      });
    });
  }

  function deleteById(id) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const history = result[STORAGE_KEY] || [];
        if (!Array.isArray(history)) {
          resolve();
          return;
        }
        const newHistory = history.filter((e) => e.id !== id);
        chrome.storage.local.set({ [STORAGE_KEY]: newHistory }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  function clearAll() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  return {
    getAll,
    saveAudit,
    getById,
    deleteById,
    clearAll
  };
})();

// Make it globally accessible (as expected by popup.js)
window.UXAuditHistory = UXAuditHistory;