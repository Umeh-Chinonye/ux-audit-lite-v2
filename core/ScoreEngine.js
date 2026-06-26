console.log("[UXAUDIT] ScoreEngine loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.ScoreEngine = {
    /**
     * Compute UX score and category scores.
     * @param {Object} signals - raw signals from SignalCollector
     * @param {Array} signalDetails - array of objects {signalId, value, weight, category, excess, baseline}
     * @param {string} pageType - classified page type
     * @returns {{uxScore:number, categoryScores:Object, signalSummary:Object}}
     */
    compute(signals, signalDetails, pageType) {
      // Baseline allowance per signal (baseline violations allowed before penalty)
      const BASELINE_ALLOWANCE = {
        'Marketing Website': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'SaaS Landing Page': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Portfolio': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Blog': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Documentation': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Dashboard': { imageMissingAlt:2, inputMissingLabel:1, h1Count:0, headingOrderSkips:1, languageDeclared:0 },
        'E-commerce': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Authentication Flow': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 },
        'Unknown': { imageMissingAlt:0, inputMissingLabel:0, h1Count:0, headingOrderSkips:0, languageDeclared:0 }
      };
      const MARGIN_PER_SIGNAL = 5; // extra violations allowed before score hits 0

      // Prepare maps
      const baselineMap = BASELINE_ALLOWANCE[pageType] || BASELINE_ALLOWANCE['Unknown'];

      // Compute totals
      let totalDeviationPoints = 0;
      let baselineWeighted = 0;
      let maxExpectedWeighted = 0;
      // Category accumulators
      const catDeviation = {};
      const catBaseline = {};
      const catMaxExpected = {};

      signalDetails.forEach(detail => {
        const { signalId, value, weight, category } = detail;
        const baseline = baselineMap[signalId] ?? 0;
        const excess = Math.max(0, value - baseline);
        const points = weight * excess;
        totalDeviationPoints += points;
        baselineWeighted += weight * baseline;
        maxExpectedWeighted += weight * (baseline + MARGIN_PER_SIGNAL);

        // category sums
        if (!catDeviation[category]) {
          catDeviation[category] = 0;
          catBaseline[category] = 0;
          catMaxExpected[category] = 0;
        }
        catDeviation[category] += points;
        catBaseline[category] += weight * baseline;
        catMaxExpected[category] += weight * (baseline + MARGIN_PER_SIGNAL);
      });

      // Overall UX score
      let uxScore = 100;
      if (maxExpectedWeighted > 0) {
        const penaltyPoints = Math.max(0, totalDeviationPoints - baselineWeighted);
        uxScore = Math.max(0, Math.round(100 - (penaltyPoints / maxExpectedWeighted) * 100));
      }

      // Category scores
      const categoryScores = {};
      const categories = ['accessibility', 'clarity', 'visualHierarchy', 'interaction', 'formUsability'];
      categories.forEach(cat => {
        if (catMaxExpected[cat] === 0) {
          categoryScores[cat] = 100;
        } else {
          const penalty = Math.max(0, catDeviation[cat] - catBaseline[cat]);
          const score = Math.max(0, Math.round(100 - (penalty / catMaxExpected[cat]) * 100));
          categoryScores[cat] = score;
        }
      });

      return {
        uxScore,
        categoryScores,
        signalSummary: {
          totalDeviationPoints,
          baselineWeighted,
          maxExpectedWeighted,
          penaltyPoints: Math.max(0, totalDeviationPoints - baselineWeighted)
        }
      };
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] ScoreEngine loaded");
})();