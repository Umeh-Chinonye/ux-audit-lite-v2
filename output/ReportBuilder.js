console.log("[UXAUDIT] ReportBuilder loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Output = UXAudit.Output || {};

  UXAudit.Output.ReportBuilder = {
    /**
     * Build the final audit report.
     * @param {Object} signals - raw signals from SignalCollector
     * @param {Object} pageTypeResult - {type:string, confidence:number}
     * @param {Array} findings - array of finding objects from RuleEngine
     * @param {Array} signalDetails - array of signal detail objects from RuleEngine
     * @returns {Object} audit report JSON
     */
    build(signals, pageTypeResult, findings, signalDetails) {
      const pageType = pageTypeResult.type;
      const confidence = pageTypeResult.confidence;

      // Compute scores using ScoreEngine
      const scoreResult = UXAudit.ScoreEngine.compute(signals, signalDetails, pageType);

      // Group findings by severity
      const issuesBySeverity = {
        high: findings.filter(f => f.severity === 'high'),
        medium: findings.filter(f => f.severity === 'medium'),
        low: findings.filter(f => f.severity === 'low')
      };

      // Positive signals (those within baseline)
      const positiveSignals = [];
      signalDetails.forEach(detail => {
        if (detail.excess === 0) {
          // find rule to get observation
          const rule = UXAudit.Runtime.RuleRegistry.getRuleById(detail.signalId);
          if (rule) {
            positiveSignals.push({
              signal: detail.signalId,
              observation: rule.observation(detail.value),
              evidence: `${detail.signalId} = ${detail.value} (allowed ≤ ${detail.baseline})`,
              confidence: Number((confidence * 0.95).toFixed(2))
            });
          }
        }
      });

      // Build final report
      const report = {
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
        pageType: {
          type: pageType,
          confidence: Number(confidence.toFixed(2))
        },
        score: scoreResult.uxScore, // for popup compatibility
        uxScore: scoreResult.uxScore,
        categoryScores: scoreResult.categoryScores,
        issuesBySeverity,
        issues: findings, // for popup details tab
        signalSummary: {
          totalDeviationPoints: scoreResult.signalSummary.totalDeviationPoints,
          baselineWeighted: scoreResult.signalSummary.baselineWeighted,
          maxExpectedWeighted: scoreResult.signalSummary.maxExpectedWeighted,
          penaltyPoints: scoreResult.signalSummary.penaltyPoints
        },
        findings,
        positiveSignals
      };

      return report;
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] ReportBuilder loaded");
})();