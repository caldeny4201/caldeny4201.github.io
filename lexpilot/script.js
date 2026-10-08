(() => {
  'use strict';
  // ====================== CONFIG ======================
  const CONFIG = {
    WHATSAPP_NUMBER: '27764312871'
  };
  // ====================== TIERS ======================
  // PRICING NOW MATCHES LANDING PAGE EXACTLY
  const TIERS = {
    Growth: {
      name: "Growth",
      monthly: 999,
      setup: 0,
      normal: 2999,
      color: "from-green-500 to-emerald-600",
      waiveLimit: 999  // No setup fee ever
    },
    Dominance: {
      name: "Dominance",
      monthly: 2999,
      setup: 4999,       // ← Fixed to R4,999 (matches landing page)
      normal: 7999,
      color: "from-yellow-400 to-amber-500",
      waiveLimit: 100    // Waived for first 100
    },
    Apex: {
      name: "Apex",
      monthly: 9999,
      setup: 9999,
      normal: 19999,
      color: "from-yellow-500 to-gold",
      waiveLimit: 50     // Waived for first 50
    }
  };
  // ====================== QUIZ QUESTIONS ======================
  const QUIZ = [
    { q: "How many attorneys + staff will use the platform?", o: ["1–5", "5–15", "16+ / Unlimited"] },
    { q: "Do you want client deposit capture (card / EFT / Payfast)?", o: ["No thanks", "Yes – I need it"], requires: "Dominance" },
    { q: "Do you want automated email/WhatsApp sequences (chasers, referrals, etc)?", o: ["No", "Yes"], requires: "Dominance" },
    { q: "Do you need automated CPD tracking + 1-click LPC report?", o: ["I’ll do it manually", "Yes – never miss points again"], requires: "Apex" },
    { q: "Would you use an AI Brief & Letter Writer trained on SA law?", o: ["Not interested", "Yes – huge time saver"], requires: "Apex" },
    { q: "Do you need full white-label (your own domain, no LexPilot branding)?", o: ["Subdomain is fine", "Yes – full white-label"], requires: "Apex" }
  ];
  // ====================== STATE ======================
  let currentQuestion = 0;
  let answers = [];
  let finalTier = "Growth";
  const $ = id => document.getElementById(id);
  const format = n => `R${n.toLocaleString('en-ZA')}`;

  // ====================== FIREBASE COUNTERS (for waiver tracking) ======================
  const initCounters = () => {
    if (typeof firebase === 'undefined') return;
    const db = firebase.firestore();
    const updateCounter = (tierKey) => {
      const docRef = db.collection("spots").doc(tierKey.toLowerCase());
      docRef.onSnapshot(doc => {
        if (!doc.exists) return;
        const taken = doc.data()?.taken || 0;
        const displayId = `${tierKey.toLowerCase()}-taken`;
        if ($(displayId)) $(displayId).textContent = taken;
      });
    };
    updateCounter("Growth");
    updateCounter("Dominance");
    updateCounter("Apex");
  };

  // ====================== QUIZ ENGINE ======================
  const Quiz = {
    start: () => {
      currentQuestion = 0;
      answers = [];
      finalTier = "Growth";
      $('quiz-overlay')?.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      Quiz.next();
    },
    next: () => {
      if (currentQuestion >= QUIZ.length) return Quiz.results();
      const q = QUIZ[currentQuestion];
      $('quiz-question-text').textContent = q.q;
      $('quiz-progress').style.width = `${((currentQuestion + 1) / QUIZ.length) * 100}%`;
      $('quiz-options').innerHTML = q.o.map((opt, i) => `
        <button class="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 py-10 px-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105 hover:border-green-500" data-index="${i}">
          ${opt}
        </button>
      `).join('');
      document.querySelectorAll('#quiz-options button').forEach(btn => {
        btn.onclick = () => {
          answers.push({ answer: q.o[btn.dataset.index], requires: q.requires || null });
          currentQuestion++;
          btn.classList.add('border-green-500', 'bg-zinc-700');
          setTimeout(Quiz.next, 400);
        };
      });
    },
    results: () => {
      const needsApex = answers.some(a => a.requires === "Apex" && /Yes|never miss|full white-label/.test(a.answer));
      const needsDominance = answers.some(a => a.requires === "Dominance" && a.answer.includes("Yes"));
      const userCount = answers[0]?.answer || "1–5";
      finalTier = (needsApex || userCount === "16+ / Unlimited") ? "Apex" :
                  (needsDominance || userCount === "5–15") ? "Dominance" : "Growth";

      const t = TIERS[finalTier];

      // Get taken spots from DOM (Firebase updates these)
      const takenDominance = parseInt($('dominance-taken')?.textContent || '0');
      const takenApex = parseInt($('apex-taken')?.textContent || '0');

      const isWaived = (finalTier === "Dominance" && takenDominance < t.waiveLimit) ||
                       (finalTier === "Apex" && takenApex < t.waiveLimit) ||
                       finalTier === "Growth";

      // Update static UI
      $('tier-name').textContent = t.name.toUpperCase();
      $('tier-name').className = `inline-block px-6 sm:px-10 md:px-16 py-5 sm:py-7 md:py-8 rounded-full text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black bg-gradient-to-r ${t.color} shadow-2xl text-center leading-none`;
      $('popular-badge').style.display = finalTier === "Dominance" ? "block" : "none";

      $('tier-price').innerHTML = `
        <div class="text-6xl md:text-8xl font-black text-green-400">${format(t.monthly)}<span class="text-4xl">/mo</span></div>
        <div class="text-3xl opacity-70 mt-4"><s>${format(t.normal)}</s></div>
      `;

      $('final-total').innerHTML = `
        <div class="text-3xl mt-8">
          ${t.setup > 0 
            ? `Setup: ${format(t.setup)}${isWaived ? '<span class="text-green-400 text-2xl block font-bold">(WAIVED!)</span>' : `<span class="text-green-400 text-lg block">(waived for first ${t.waiveLimit})</span>`}`
            : 'No Setup Fee'}
        </div>
        <div class="text-2xl mt-6 text-green-300 font-bold">Your founding price locked FOREVER</div>
      `;

      const highlights = {
        Growth: ["Professional website", "AI site generator", "Smart invoicing", "Rule 54 & 86 protection", "Founding referral rewards"],
        Dominance: ["Everything in Growth", "Capture Client Details & Deposits (Card / EFT / PayFast)", "Lead dashboard + proven automated workflows", "Priority support"],
        Apex: ["Everything in Dominance", "Advanced AI brief & letter writer (SA-trained)", "Automatic CPD tracking + instant LPC reports", "Full white-label + custom domain", "Strategy day"]
      };
      $('recommended-list').innerHTML = highlights[finalTier]
        .map(f => `<li class="text-xl py-3 flex items-center gap-4"><i class="fas fa-check-circle text-green-400 text-2xl"></i>${f}</li>`)
        .join('');

      // === DYNAMIC CTA WITH CORRECT WAIVED INFO ===
      const oldCta = document.querySelector('#quiz-results .dynamic-cta');
      if (oldCta) oldCta.remove();

      const buttonText = finalTier === "Apex" ? "JOIN APEX WAITLIST" : `CLAIM MY ${t.name.toUpperCase()} SPOT NOW`;
      const setupText = t.setup > 0 ? ` + ${format(t.setup)} setup${isWaived ? " (WAIVED!)" : ""}` : "";
      const action = finalTier === "Apex" ? "Join Apex waitlist" : "Secure my spot";
      const waMsg = encodeURIComponent(`LexPilot FOUNDING LEAD! Tier: ${t.name} Price: ${format(t.monthly)}/mo${setupText} Normal: ${format(t.normal)}/mo ${action}!`);

      $('recommended-list').insertAdjacentHTML('afterend', `
        <div class="mt-16 dynamic-cta">
          <button class="claim-btn" data-tier="${finalTier}">
            <div class="inline-block bg-gradient-to-r ${t.color} hover:scale-105 transition-all text-black font-black text-3xl md:text-4xl px-12 py-8 rounded-full shadow-2xl w-full max-w-md">
              <i class="fab fa-whatsapp mr-4 text-4xl"></i> ${buttonText}
            </div>
          </button>
          <p class="mt-6 text-xl opacity-80">Reply in under 60 seconds • 24/7</p>
        </div>
      `);

      // Show results
      $('quiz-overlay').classList.add('hidden');
      document.body.style.overflow = '';
      $('quiz-results').classList.remove('hidden');
      $('quiz-results').scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ====================== GLOBAL WHATSAPP HANDLER ======================
  document.addEventListener('click', e => {
    const btn = e.target.closest('.claim-btn');
    if (!btn) return;
    e.preventDefault();

    let tier = btn.dataset.tier || btn.closest('[data-tier]')?.dataset.tier;
    if (!tier) {
      const tierEl = $('tier-name');
      if (tierEl) tier = tierEl.textContent.trim();
    }
    if (!tier || !TIERS[tier]) return;

    const t = TIERS[tier];

    // Get current taken spots for waiver logic
    const takenDominance = parseInt($('dominance-taken')?.textContent || '0');
    const takenApex = parseInt($('apex-taken')?.textContent || '0');
    const isWaived = (tier === "Dominance" && takenDominance < t.waiveLimit) ||
                     (tier === "Apex" && takenApex < t.waiveLimit) ||
                     tier === "Growth";

    const setupText = t.setup > 0 ? ` + ${format(t.setup)} setup${isWaived ? " (WAIVED!)" : ""}` : "";
    const action = tier === "Apex" ? "Join Apex waitlist" : "Secure my spot";

    const waMsg = encodeURIComponent(`LexPilot FOUNDING LEAD! Tier: ${t.name} Price: ${format(t.monthly)}/mo${setupText} Normal: ${format(t.normal)}/mo ${action}!`);
    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${waMsg}`, '_blank');
  });

  // ====================== HEADER & FOOTER LOADER ======================
  const loadPart = async (file, placeholderId) => {
    const el = $(placeholderId);
    if (!el) return;
    try {
      const res = await fetch(`/${file}.html?v=${Date.now()}`, { cache: "no-store" });
      if (res.ok) el.innerHTML = await res.text();
      else el.innerHTML = `<div class="text-red-500 p-10 text-center text-2xl">Error: ${file}.html missing</div>`;
    } catch (e) {
      el.innerHTML = `<div class="text-red-500 p-10 text-center text-2xl">Failed to load ${file}.html</div>`;
    }
  };

  // ====================== INIT ======================
  document.addEventListener('DOMContentLoaded', () => {
    loadPart('header', 'header-placeholder');
    loadPart('footer', 'footer-placeholder');
    initCounters();

    $('quiz-overlay')?.addEventListener('click', e => {
      if (e.target === $('quiz-overlay')) {
        $('quiz-overlay').classList.add('hidden');
        document.body.style.overflow = '';
      }
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.className = 'absolute top-6 right-6 text-7xl opacity-40 hover:opacity-100 z-50 text-white';
    closeBtn.onclick = () => {
      $('quiz-overlay')?.classList.add('hidden');
      document.body.style.overflow = '';
    };
    $('quiz-overlay')?.prepend(closeBtn);
  });

  window.startQuiz = Quiz.start;
})();