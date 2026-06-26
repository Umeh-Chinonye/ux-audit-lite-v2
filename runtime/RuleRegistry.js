console.log("[UXAUDIT] RuleRegistry loading");

(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Runtime = UXAudit.Runtime || {};

  UXAudit.Runtime.RuleRegistry = {
    // Returns all rule objects across categories
    getAllRules: () => {
      const all = [];
      const categories = UXAudit.Rules || {};
      for (const cat in categories) {
        if (Array.isArray(categories[cat])) {
          all.push(...categories[cat]);
        }
      }
      return all;
    },

    // Returns rules for a given category
    getRulesByCategory: category => {
      return Array.isArray(UXAudit.Rules ? UXAudit.Rules[category] : undefined)
        ? [...UXAudit.Rules[category]]
        : [];
    },

    // Returns rule IDs for a category
    getRuleIdsByCategory: category => {
      const rules = this.getRulesByCategory(category);
      return rules.map(r => r.id);
    },

    // Returns a rule by ID (searches all categories)
    getRuleById: id => {
      const all = this.getAllRules();
      return all.find(r => r.id === id) || null;
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] RuleRegistry loaded");
})();