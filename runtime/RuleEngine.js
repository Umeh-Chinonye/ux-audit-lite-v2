console.log("[UXAUDIT] RuleEngine loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Runtime = UXAudit.Runtime || {};

  UXAudit.Runtime.RuleEngine = {
    /**
     * Evaluate all rules against the given signals and page type.
     * @param {Object} signals - raw signals from SignalCollector
     * @param {string} pageType - classified page type (e.g., 'SaaS Landing Page')
     * @returns {{
     *   findings: Array,
     *   signalDetails: Array   // each {signalId, value, weight, category, excess, baseline}
     * }}
     */
    evaluate(signals, pageType) {
      const registry = UXAudit.Runtime.RuleRegistry;
      const allRules = registry.getAllRules();
      const findings = [];
      const signalDetails = [];

      allRules.forEach(rule => {
        const value = rule.value(signals);
        const baseline = rule.baseline[pageType] !== undefined
          ? rule.baseline[pageType]
          : rule.baseline['Unknown'] !== undefined
            ? rule.baseline['Unknown']
            : 0;
        const excess = Math.max(0, value - baseline);
        if (excess > 0) {
          // Build finding
          const observation = rule.observation(value);
          const impact = rule.impact(pageType, value);
          const recommendation = rule.recommendation;
          const elements = rule.getElements
            ? rule.getElements(signals)
            : [];

          const finding = {
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
            type: rule.type,
            severity: rule.severity || 'medium', // default if not provided
            signal: rule.id,
            observation,
            evidence: `${rule.id} = ${value}, baseline ≤ ${baseline}`,
            impact,
            recommendation,
            confidence: 0.95, // placeholder; could be derived from signal strength
            elements: elements.map(el => {
              // generate a simple selector; we could reuse getSelector but we don't have it here.
              // We'll fallback to using outerHTML snippet? For simplicity, we'll return empty.
              // Since we have SignalCollector.getSelector available, we can use it via UXAudit.
              return UXAudit.SignalCollector.getSelector(el);
            }),
            selectorType: 'css'
          };
          findings.push(finding);

          // Signal detail for scoring
          signalDetails.push({
            signalId: rule.id,
            value,
            weight: rule.weight,
            category: rule.type,
            excess,
            baseline
          });
        }
      });

      return { findings, signalDetails };
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] RuleEngine loaded");
})();