console.log("[UXAUDIT] PageClassifier loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.PageClassifier = {
    classify(signals) {
      const score = {};

      // Marketing Website: high CTA density, prominent hero section (big image), low form count
      score['Marketing Website'] =
        (signals.ctaDensity > 0.5 ? 1 : 0) * 0.3 +
        (signals.imageCount > 0 ? 1 : 0) * 0.2 +
        (signals.formFieldCount < 5 ? 1 : 0) * 0.2 +
        (signals.sectionCount > 0 ? 1 : 0) * 0.15 +
        (signals.h1Count === 1 ? 1 : 0) * 0.15;

      // SaaS Landing Page: moderate CTA, feature sections, sign-up form
      score['SaaS Landing Page'] =
        (signals.ctaDensity > 0.2 && signals.ctaDensity <= 0.8 ? 1 : 0) * 0.25 +
        (signals.sectionCount >= 2 ? 1 : 0) * 0.2 +
        (signals.formFieldCount >= 1 && signals.formFieldCount <= 10 ? 1 : 0) * 0.2 +
        (signals.imageCount >= 1 ? 1 : 0) * 0.15 +
        (signals.h1Count === 1 ? 1 : 0) * 0.1 +
        (signals.headingCount >= 3 ? 1 : 0) * 0.1;

      // Portfolio: low CTA density, high image count, project/gallery sections
      score['Portfolio'] =
        (signals.ctaDensity < 0.2 ? 1 : 0) * 0.3 +
        (signals.imageCount > 5 ? 1 : 0) * 0.25 +
        (signals.sectionCount >= 2 ? 1 : 0) * 0.2 +
        (signals.formFieldCount < 3 ? 1 : 0) * 0.15 +
        (signals.textDensity < 100 ? 1 : 0) * 0.1;

      // Blog: high text density, many article/post sections, low CTA density outside comments
      score['Blog'] =
        (signals.textDensity > 150 ? 1 : 0) * 0.3 +
        (signals.contentSectionCount >= 2 ? 1 : 0) * 0.25 +
        (signals.ctaDensity < 0.4 ? 1 : 0) * 0.2 +
        (signals.headingCount >= 3 ? 1 : 0) * 0.15 +
        (signals.imageCount > 0 ? 1 : 0) * 0.1;

      // Documentation: high heading count, deep heading hierarchy, low CTA density
      score['Documentation'] =
        (signals.headingCount >= 5 ? 1 : 0) * 0.25 +
        (signals.layoutDepth >= 2 ? 1 : 0) * 0.2 +
        (signals.ctaDensity < 0.3 ? 1 : 0) * 0.15 +
        (signals.codePreCount > 0 ? 1 : 0) * 0.15 +
        (signals.sectionCount >= 2 ? 1 : 0) * 0.15 +
        (signals.h1Count >= 1 ? 1 : 0) * 0.1;

      // Dashboard: high interaction density (forms, tables, widgets), moderate heading count
      score['Dashboard'] =
        (signals.formFieldCount >= 5 ? 1 : 0) * 0.2 +
        (signals.widgetOrCardCount >= 2 ? 1 : 0) * 0.2 +
        (signals.headingCount >= 2 && signals.headingCount <= 6 ? 1 : 0) * 0.15 +
        (signals.clickHandlerCount > 5 ? 1 : 0) * 0.15 +
        (signals.sectionCount >= 2 ? 1 : 0) * 0.1 +
        (signals.textDensity < 80 ? 1 : 0) * 0.1;

      // E-commerce: high product/image count, price patterns, cart/checkout elements
      score['E-commerce'] =
        (signals.imageCount >= 5 ? 1 : 0) * 0.2 +
        (signals.priceElementsCount >= 2 ? 1 : 0) * 0.15 +
        (signals.cartOrCheckoutCount >= 1 ? 1 : 0) * 0.15 +
        (signals.sectionCount >= 3 ? 1 : 0) * 0.15 +
        (signals.ctaDensity > 0.3 ? 1 : 0) * 0.15 +
        (signals.formFieldCount >= 2 ? 1 : 0) * 0.1;

      // Authentication Flow: high form density, low navigation, specific input types
      score['Authentication Flow'] =
        (signals.formFieldCount >= 2 && signals.formFieldCount <= 4 ? 1 : 0) * 0.25 +
        (signals.emailPasswordInputs >= 2 ? 1 : 0) * 0.2 +
        (signals.ctaDensity < 0.2 ? 1 : 0) * 0.15 +
        (signals.sectionCount <= 2 ? 1 : 0) * 0.15 +
        (signals.navHeaderCount === 0 ? 1 : 0) * 0.15 +
        (signals.headingCount <= 2 ? 1 : 0) * 0.1;

      // Find best match
      let bestType = 'Unknown';
      let bestScore = 0;
      for (const [type, s] of Object.entries(score)) {
        if (s > bestScore) {
          bestScore = s;
          bestType = type;
        }
      }
      // Confidence: normalize score (max possible is 1)
      const confidence = Math.min(bestScore, 1.0);
      return { type: bestType, confidence: Number(confidence.toFixed(2)) };
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] PageClassifier loaded");
})();