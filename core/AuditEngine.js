console.log("[UXAUDIT] AuditEngine loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Core = UXAudit.Core || {};

  UXAudit.Core.AuditEngine = {
    /**
     * Run a full audit and return the report.
     * @returns {Object} audit report JSON
     */
    runAudit() {
      try {
        // 1. Collect signals
        const signals = UXAudit.SignalCollector.collect();

        // 2. Classify page type
        const pageTypeResult = UXAudit.PageClassifier.classify(signals);

        // 3. Evaluate rules
        const ruleResult = UXAudit.Runtime.RuleEngine.evaluate(signals, pageTypeResult.type);
        const { findings, signalDetails } = ruleResult;

        // 4. Build report
        const report = UXAudit.Output.ReportBuilder.build(
          signals,
          pageTypeResult,
          findings,
          signalDetails
        );

        return report;
      } catch (error) {
        console.error('AuditEngine.runAudit failed:', error);
        // Re-throw so the caller (contentScript) can handle it as a failure
        throw error;
      }
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] AuditEngine loaded");
})();