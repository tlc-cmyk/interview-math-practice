/* 升小數學面試練 — 神小風格偏規律／比較／圖畫應用／數感 · 廣東話朗讀 · 三難度 */
(function () {
  "use strict";

  const ROUND_LEN = 8;

  const DIFFICULTIES = {
    easy: {
      id: "easy",
      label: "基礎",
      short: "基礎",
      timerSec: 60,
      timerLabel: "模擬加計時（每題約 60 秒）",
      countMin: 2,
      countMax: 5,
      recognizeMax: 5,
      compareMax: 5,
      addMaxSum: 8,
      addXMax: 4,
      addYMax: 3,
      subTotalMax: 7,
      orderCount: 3,
      orderStartMax: 4,
      patternKinds: ["abab", "countUp"],
      countUpStep: 1,
      shapeHard: false,
    },
    medium: {
      id: "medium",
      label: "進階",
      short: "進階",
      timerSec: 45,
      timerLabel: "模擬加計時（每題約 45 秒）",
      countMin: 3,
      countMax: 10,
      recognizeMax: 9,
      compareMax: 8,
      addMaxSum: 12,
      addXMax: 6,
      addYMax: 5,
      subTotalMax: 10,
      orderCount: 3,
      orderStartMax: 6,
      patternKinds: ["abab", "aab", "countUp", "shapeCycle", "size"],
      countUpStep: 1,
      shapeHard: false,
    },
    hard: {
      id: "hard",
      label: "神小挑戰",
      short: "神小挑戰",
      timerSec: 30,
      timerLabel: "模擬加計時（每題約 30 秒）",
      countMin: 6,
      countMax: 15,
      recognizeMax: 12,
      compareMax: 12,
      addMaxSum: 18,
      addXMax: 9,
      addYMax: 8,
      subTotalMax: 15,
      orderCount: 4,
      orderStartMax: 9,
      patternKinds: ["abab", "aab", "countUp", "shapeCycle", "size", "abc", "countUp2"],
      countUpStep: 2,
      shapeHard: true,
    },
  };

  const OBJECTS = ["🍎", "⭐", "🐶", "🎈", "🍪", "🐱", "🚗", "🌸", "🐟", "🐥"];
  const SHAPES = [
    { id: "circle", name: "圓形", emoji: "⭕" },
    { id: "triangle", name: "三角形", emoji: "🔺" },
    { id: "square", name: "正方形", emoji: "🟦" },
    { id: "rect", name: "長方形", emoji: "▭" },
  ];

  const FORMATS = [
    {
      id: "count",
      name: "數數",
      desc: "數一數有幾多件物件",
      emoji: "🔢",
      accent: "#38bdf8",
      weightMock: 1,
    },
    {
      id: "recognize",
      name: "認數字／配對",
      desc: "認數字、啱啱數量",
      emoji: "🔤",
      accent: "#a78bfa",
      weightMock: 1,
    },
    {
      id: "compare",
      name: "比多少",
      desc: "邊堆多／少／一樣多",
      emoji: "⚖️",
      accent: "#f59e0b",
      weightMock: 2,
    },
    {
      id: "addsub",
      name: "簡單加減",
      desc: "圖畫應用 · 多數加、少減",
      emoji: "➕",
      accent: "#22c55e",
      weightMock: 1.5,
    },
    {
      id: "pattern",
      name: "規律／找下一個",
      desc: "ABAB、遞增、形狀規律",
      emoji: "🔁",
      accent: "#ec4899",
      weightMock: 2.5,
    },
    {
      id: "shape",
      name: "圖形認識",
      desc: "圓 · 三角 · 方",
      emoji: "🔷",
      accent: "#6366f1",
      weightMock: 1,
    },
    {
      id: "order",
      name: "排次序",
      desc: "由細到大排一排",
      emoji: "📶",
      accent: "#14b8a6",
      weightMock: 1.5,
    },
  ];

  const state = {
    mode: null, // "mock" | "practice"
    formatId: null,
    difficulty: "medium",
    useTimer: false,
    autoRead: false,
    muted: false,
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    timerId: null,
    timerLeft: 45,
    lastAgain: null,
    speakVoice: null,
    speechUnlocked: false,
    ttsSupported: typeof window !== "undefined" && "speechSynthesis" in window,
  };

  const $ = (id) => document.getElementById(id);

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
  }

  function rand(n) {
    return Math.floor(Math.random() * n);
  }
  function pick(arr) {
    return arr[rand(arr.length)];
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function uniqueChoices(correct, pool, count) {
    const set = new Set([correct]);
    const opts = shuffle(pool.filter((x) => x !== correct));
    for (const x of opts) {
      if (set.size >= count) break;
      set.add(x);
    }
    while (set.size < count) set.add(correct + set.size);
    return shuffle([...set]);
  }

  function diff() {
    return DIFFICULTIES[state.difficulty] || DIFFICULTIES.medium;
  }

  function rangePool(min, max) {
    const a = [];
    for (let i = min; i <= max; i++) a.push(i);
    return a;
  }

  /* —— 廣東話朗讀（Web Speech API · iOS-safe） —— */

  function pickCantoneseVoice() {
    if (!window.speechSynthesis) return null;
    const voices = speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const prefer = (v) => {
      const lang = (v.lang || "").toLowerCase().replace(/_/g, "-");
      const name = (v.name || "").toLowerCase();
      // Prefer Cantonese / Hong Kong first
      if (lang === "zh-hk" || lang.startsWith("zh-hk")) return 100;
      if (lang === "yue" || lang.startsWith("yue")) return 95;
      if (
        name.includes("hong kong") ||
        name.includes("cantonese") ||
        name.includes("yue") ||
        name.includes("sinji") ||
        name.includes("sin-ji")
      ) {
        return 90;
      }
      // Taiwan Mandarin is closer for traditional chars than zh-CN
      if (lang === "zh-tw" || lang.startsWith("zh-tw")) return 50;
      if (name.includes("meijia") || name.includes("mei-jia")) return 48;
      if (lang === "zh-cn" || lang.startsWith("zh-cn") || lang === "zh") return 30;
      if (lang.startsWith("zh")) return 20;
      return 0;
    };
    let best = null;
    let score = 0;
    voices.forEach((v) => {
      const s = prefer(v);
      if (s > score) {
        score = s;
        best = v;
      }
    });
    return best;
  }

  function refreshVoice() {
    state.speakVoice = pickCantoneseVoice();
    updateTtsHint();
  }

  function ttsAvailable() {
    return !!(
      state.ttsSupported &&
      window.speechSynthesis &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  function updateTtsHint(msg) {
    const el = $("tts-hint");
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove("hidden");
      return;
    }
    if (!ttsAvailable()) {
      el.textContent = "呢部機唔支援廣東話朗讀";
      el.classList.remove("hidden");
      return;
    }
    // Keep hint hidden during normal use; only show when speaking fails / unsupported
    if (!el.dataset.sticky) el.classList.add("hidden");
  }

  function showTtsFeedback(msg, sticky) {
    const el = $("tts-hint");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    if (sticky) el.dataset.sticky = "1";
    else delete el.dataset.sticky;
  }

  function stopSpeech() {
    try {
      if (window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) {
        speechSynthesis.cancel();
      }
    } catch (_) { /* ignore */ }
    const btn = $("btn-speak");
    if (btn) btn.classList.remove("speaking");
  }

  /** Mark speech as user-gesture-unlocked. Do NOT cancel() here — on iOS
   *  cancel-immediately-before-speak is a common cause of silence. The real
   *  unlock is the audible speak() that runs synchronously in the same tap. */
  function unlockSpeech() {
    if (!ttsAvailable()) return;
    try {
      speechSynthesis.getVoices();
      refreshVoice();
    } catch (_) { /* ignore */ }
    state.speechUnlocked = true;
  }

  function buildUtterance(text) {
    const u = new SpeechSynthesisUtterance(String(text));
    refreshVoice();
    if (state.speakVoice) {
      u.voice = state.speakVoice;
      u.lang = state.speakVoice.lang || "zh-HK";
    } else {
      // Fallback chain for engines that pick by lang only
      u.lang = "zh-HK";
    }
    u.rate = 0.92;
    u.pitch = 1;
    u.volume = 1;
    const btn = $("btn-speak");
    u.onstart = () => {
      if (btn) btn.classList.add("speaking");
    };
    u.onend = () => {
      if (btn) btn.classList.remove("speaking");
    };
    u.onerror = (ev) => {
      if (btn) btn.classList.remove("speaking");
      if (ev && ev.error && ev.error !== "canceled" && ev.error !== "interrupted") {
        showTtsFeedback("朗讀失敗 · 試再撳喇叭，或喺系統設定加廣東話語音", false);
      }
    };
    return u;
  }

  /**
   * Speak text. On iOS Safari, cancel() immediately before speak() often yields silence.
   * Only cancel when already speaking; after cancel, delay the next speak.
   * User-gesture path (force) must call speak() synchronously when idle.
   */
  function speakText(text, opts) {
    const force = !!(opts && opts.force);
    if (!text) return;
    if (state.muted && !force) return;
    if (state.muted && force) {
      showTtsFeedback("已靜音 · 請喺主頁關閉「靜音」", false);
      return;
    }
    if (!ttsAvailable()) {
      showTtsFeedback("呢部機唔支援朗讀（Web Speech）", true);
      return;
    }

    unlockSpeech();
    refreshVoice();

    const run = () => {
      const u = buildUtterance(text);
      // If no zh-HK voice, still try zh-TW then generic zh as lang-only fallbacks
      if (!state.speakVoice) {
        // Second chance: try lang variants without a Voice object
        u.lang = "zh-HK";
      }
      try {
        speechSynthesis.speak(u);
        // Some iOS builds pause immediately; nudge resume
        if (speechSynthesis.paused) {
          try { speechSynthesis.resume(); } catch (_) { /* ignore */ }
        }
      } catch (_) {
        showTtsFeedback("朗讀啟動失敗 · 再撳一次喇叭", false);
      }
    };

    const busy = speechSynthesis.speaking || speechSynthesis.pending;
    if (busy) {
      try { speechSynthesis.cancel(); } catch (_) { /* ignore */ }
      // iOS: must wait a tick after cancel, or the next utterance is dropped
      setTimeout(run, 80);
    } else {
      // Idle: speak synchronously so iOS keeps the user-gesture unlock
      run();
    }
  }

  function buildSpeakScript(q) {
    if (!q) return "";
    const parts = [];
    if (q.prompt) parts.push(q.prompt);
    if (q.visual && q.visual.type === "story" && q.visual.text) {
      parts.push(q.visual.text);
    }
    if (q.speakExtra) parts.push(q.speakExtra);
    return parts.join("。").replace(/～/g, "。");
  }

  function maybeAutoRead(q) {
    if (state._skipAutoReadOnce) {
      state._skipAutoReadOnce = false;
      return;
    }
    if (state.muted || !state.autoRead) return;
    if (!state.speechUnlocked) {
      showTtsFeedback("自動朗讀：請撳喇叭 🔊 先解鎖（iPhone 需要）", false);
      return;
    }
    const script = buildSpeakScript(q);
    if (script) {
      setTimeout(() => speakText(script), 200);
    }
  }

  /* —— Generators —— */

  function genCount() {
    const d = diff();
    const span = d.countMax - d.countMin + 1;
    const n = d.countMin + rand(span);
    const obj = pick(OBJECTS);
    const items = Array(n).fill(obj);
    const pool = rangePool(Math.max(1, d.countMin - 1), d.countMax + 1);
    const choices = uniqueChoices(n, pool, 4);
    return {
      format: "count",
      tag: "數數",
      prompt: `數一數：一共有幾多個？`,
      speakExtra: `請數一數圖入面有幾多個。`,
      visual: { type: "objects", items },
      choices: choices.map(String),
      answer: String(n),
      explain: `一共有 ${n} 個 ${obj}`,
    };
  }

  function genRecognize() {
    const d = diff();
    const kind = rand(2);
    if (kind === 0) {
      const n = 1 + rand(d.recognizeMax);
      const obj = pick(OBJECTS);
      const pool = rangePool(1, Math.max(d.recognizeMax, n + 2));
      return {
        format: "recognize",
        tag: "認數字",
        prompt: `邊個數字啱呢堆物件？`,
        speakExtra: `圖入面有幾多個？揀啱嘅數字。`,
        visual: { type: "objects", items: Array(n).fill(obj) },
        choices: uniqueChoices(n, pool, 4).map(String),
        answer: String(n),
        explain: `有 ${n} 個，所以係「${n}」`,
      };
    }
    const n = Math.min(d.recognizeMax, 2 + rand(Math.max(1, d.recognizeMax - 1)));
    const pool = rangePool(1, Math.max(d.recognizeMax, n + 2));
    const distractors = uniqueChoices(n, pool, 4);
    return {
      format: "recognize",
      tag: "配對",
      prompt: `「${n}」代表幾多？揀啱嘅數量`,
      speakExtra: `數字 ${n} 代表幾多個？`,
      visual: { type: "bigNumber", n },
      choices: distractors.map((x) => `${x} 個`),
      answer: `${n} 個`,
      explain: `數字 ${n} 就係 ${n} 個`,
    };
  }

  function genCompare() {
    const d = diff();
    const obj = pick(OBJECTS);
    let a = 2 + rand(Math.max(1, d.compareMax - 1));
    let b = 2 + rand(Math.max(1, d.compareMax - 1));
    if (a === b && rand(3) !== 0) b = Math.min(d.compareMax, a + 1 + rand(2));
    if (a > d.compareMax) a = d.compareMax;
    if (b > d.compareMax) b = d.compareMax;

    const mode = pick(["more", "less", "same"]);
    let prompt, answer, explain;
    if (mode === "same") {
      b = a;
      explain = `兩邊都係 ${a} 個，一樣多`;
      return {
        format: "compare",
        tag: "比多少",
        prompt: "兩堆係咪一樣多？",
        speakExtra: "睇下 A 同 B，係咪一樣多？",
        visual: { type: "twoPiles", a, b, obj, labels: ["A", "B"] },
        choices: ["一樣多", "A 多啲", "B 多啲"],
        answer: "一樣多",
        explain,
        singleCol: true,
      };
    }
    if (mode === "more") {
      prompt = "邊堆多啲？";
      answer = a > b ? "A" : b > a ? "B" : "一樣多";
      explain =
        a === b
          ? `兩邊一樣多（${a}）`
          : a > b
            ? `A 有 ${a} 個，B 有 ${b} 個，A 多啲`
            : `B 有 ${b} 個，A 有 ${a} 個，B 多啲`;
    } else {
      prompt = "邊堆少啲？";
      answer = a < b ? "A" : b < a ? "B" : "一樣多";
      explain =
        a === b
          ? `兩邊一樣多（${a}）`
          : a < b
            ? `A 有 ${a} 個，少過 B 嘅 ${b} 個`
            : `B 有 ${b} 個，少過 A 嘅 ${a} 個`;
    }
    return {
      format: "compare",
      tag: "比多少",
      prompt,
      speakExtra: prompt + " A 定 B？",
      visual: { type: "twoPiles", a, b, obj, labels: ["A", "B"] },
      choices: a === b ? ["一樣多", "A", "B"] : ["A", "B", "一樣多"],
      answer,
      explain,
      singleCol: true,
    };
  }

  function genAddSub() {
    const d = diff();
    const obj = pick(OBJECTS);
    const isAdd = rand(10) < 7;
    if (isAdd) {
      const x = 1 + rand(d.addXMax);
      const y = 1 + rand(d.addYMax);
      const sum = x + y;
      if (sum > d.addMaxSum) return genAddSub();
      const stories = [
        `有 ${x} 個${obj}，又嚟多 ${y} 個，一共幾多？`,
        `籃入面有 ${x} 個，再放入 ${y} 個，而家有幾多？`,
        `小明有 ${x} 個，媽媽再畀 ${y} 個，一共幾多？`,
      ];
      const story = pick(stories);
      const pool = [sum - 2, sum - 1, sum, sum + 1, sum + 2, x, y].filter((n) => n > 0);
      return {
        format: "addsub",
        tag: "加減應用",
        prompt: "聽清楚題目，諗一諗～",
        visual: {
          type: "story",
          text: story,
          items: Array(x).fill(obj).concat(["➕"]).concat(Array(y).fill(obj)),
        },
        choices: uniqueChoices(sum, pool, 4).map(String),
        answer: String(sum),
        explain: `${x} + ${y} = ${sum}`,
      };
    }
    const total = Math.min(d.subTotalMax, 4 + rand(Math.max(1, d.subTotalMax - 3)));
    const take = 1 + rand(Math.min(4, total - 1));
    const left = total - take;
    const stories = [
      `有 ${total} 個${obj}，畀咗 ${take} 個，仲剩幾多？`,
      `桌上有 ${total} 個，食咗 ${take} 個，剩返幾多？`,
    ];
    const story = pick(stories);
    return {
      format: "addsub",
      tag: "加減應用",
      prompt: "聽清楚題目，諗一諗～",
      visual: {
        type: "story",
        text: story,
        items: Array(Math.min(total, 12)).fill(obj),
      },
      choices: uniqueChoices(left, [left - 1, left, left + 1, take, total].filter((n) => n >= 0), 4).map(String),
      answer: String(left),
      explain: `${total} − ${take} = ${left}`,
    };
  }

  function genPattern() {
    const d = diff();
    const kind = pick(d.patternKinds);
    if (kind === "abab") {
      const a = pick(OBJECTS);
      let b = pick(OBJECTS);
      while (b === a) b = pick(OBJECTS);
      const seq = [a, b, a, b, a];
      const next = b;
      const wrong = shuffle([a, pick(OBJECTS.filter((o) => o !== a && o !== b)), "🔷"]).slice(0, 3);
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "下一個係咩？點解？",
        speakExtra: "睇規律，下一個係咩？",
        visual: { type: "pattern", seq, blank: true },
        choices: shuffle([next, ...wrong]),
        answer: next,
        explain: `規律係「${a}${b}${a}${b}…」，所以下一個係 ${b}`,
        emojiChoices: true,
      };
    }
    if (kind === "aab") {
      const a = pick(["🔴", "🔵", "🟡", "🟢"]);
      let b = pick(["🔴", "🔵", "🟡", "🟢"]);
      while (b === a) b = pick(["🔴", "🔵", "🟡", "🟢"]);
      const seq = [a, a, b, a, a];
      const next = b;
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "睇下規律，下一個係？",
        speakExtra: "兩個一樣跟住另一個，下一個係？",
        visual: { type: "pattern", seq, blank: true },
        choices: shuffle([next, a, pick(["🟣", "🟠"]), b === "🔴" ? "🔵" : "🔴"]),
        answer: next,
        explain: `兩個 ${a} 跟住一個 ${b}，重複咁樣`,
        emojiChoices: true,
      };
    }
    if (kind === "abc") {
      const cycle = ["🔴", "🔵", "🟡"];
      const start = rand(3);
      const seq = [0, 1, 2, 0, 1].map((i) => cycle[(start + i) % 3]);
      const next = cycle[(start + 5) % 3];
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "三色輪流，下一個係？",
        speakExtra: "紅藍黃輪流，下一個係咩色？",
        visual: { type: "pattern", seq, blank: true },
        choices: shuffle([next, ...cycle.filter((c) => c !== next), "🟢"]).slice(0, 4),
        answer: next,
        explain: `規律：${cycle.join("→")} 循環`,
        emojiChoices: true,
      };
    }
    if (kind === "countUp" || kind === "countUp2") {
      const step = kind === "countUp2" ? 2 : d.countUpStep || 1;
      const start = 1 + rand(3);
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      const next = start + 4 * step;
      return {
        format: "pattern",
        tag: "找規律",
        prompt: step === 1 ? "數字一個大過一個，下一個係？" : "每次大兩格，下一個係？",
        speakExtra: step === 1 ? "每次多一，下一個係幾多？" : "每次多兩，下一個係幾多？",
        visual: { type: "pattern", seq: seq.map(String), blank: true },
        choices: uniqueChoices(next, [next - 2 * step, next - step, next, next + step, next + 2 * step], 4).map(String),
        answer: String(next),
        explain: `每次多 ${step}：下一個係 ${next}`,
      };
    }
    if (kind === "size") {
      const obj = pick(OBJECTS);
      const visualCounts = d.id === "hard" ? [2, 4, 6] : [1, 2, 3];
      const answer = String(visualCounts[visualCounts.length - 1] + (d.id === "hard" ? 2 : 1));
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "物件愈嚟愈多，下一格應該幾多個？",
        speakExtra: "每格多啲物件，下一格幾多個？",
        visual: {
          type: "countPattern",
          obj,
          counts: visualCounts,
        },
        choices: uniqueChoices(Number(answer), [Number(answer) - 2, Number(answer) - 1, Number(answer), Number(answer) + 1, Number(answer) + 2].filter((n) => n > 0), 4).map(String),
        answer,
        explain: d.id === "hard" ? "每格多 2 個：2→4→6→8" : "每格多 1 個：1→2→3→4",
      };
    }
    // shapeCycle
    const cycle = ["⭕", "🔺", "🟦"];
    const start = rand(3);
    const seq = [0, 1, 2, 0].map((i) => cycle[(start + i) % 3]);
    const next = cycle[(start + 4) % 3];
    return {
      format: "pattern",
      tag: "找規律",
      prompt: "形狀輪流出現，下一個係？",
      speakExtra: "形狀輪流，下一個係咩？",
      visual: { type: "pattern", seq, blank: true },
      choices: shuffle([next, ...cycle.filter((c) => c !== next), "⭐"]).slice(0, 4),
      answer: next,
      explain: `規律：${cycle.join("→")} 循環`,
      emojiChoices: true,
    };
  }

  function genShape() {
    const d = diff();
    const target = pick(d.shapeHard ? SHAPES : SHAPES.filter((s) => s.id !== "rect"));
    const mode = rand(2);
    if (mode === 0) {
      return {
        format: "shape",
        tag: "圖形",
        prompt: "呢個係咩形狀？",
        speakExtra: "呢個係咩形狀？",
        visual: { type: "shape", shape: target },
        choices: shuffle(SHAPES.map((s) => s.name)).slice(0, 4),
        answer: target.name,
        explain: `呢個係${target.name}`,
        singleCol: true,
      };
    }
    const base = pick(["⭕", "🔺", "🟦"]);
    const oddPool = d.shapeHard ? ["⭕", "🔺", "🟦", "⭐", "🟩"] : ["⭕", "🔺", "🟦", "⭐"];
    const odd = pick(oddPool.filter((x) => x !== base));
    const items = shuffle([base, base, base, odd]);
    return {
      format: "shape",
      tag: "搵唔同",
      prompt: "邊個唔同類？",
      speakExtra: "邊個唔同類？",
      visual: { type: "pattern", seq: items, blank: false },
      choices: items,
      answer: odd,
      explain: `其餘都係一樣，唔同嘅係 ${odd}`,
      emojiChoices: true,
    };
  }

  function genOrder() {
    const d = diff();
    const count = d.orderCount;
    const start = 1 + rand(d.orderStartMax);
    const step = d.id === "hard" && rand(2) === 0 ? 2 : 1;
    const nums = [];
    for (let i = 0; i < count; i++) nums.push(start + i * step);
    const shuffled = shuffle(nums);
    return {
      format: "order",
      tag: "排次序",
      prompt: "由細到大，撳次序排好",
      speakExtra: "由細到大，排好數字次序。",
      visual: { type: "order", nums: shuffled, sorted: nums.slice() },
      choices: [],
      answer: nums.join(","),
      explain: `正確次序：${nums.join(" → ")}`,
      interactive: "order",
    };
  }

  const GENERATORS = {
    count: genCount,
    recognize: genRecognize,
    compare: genCompare,
    addsub: genAddSub,
    pattern: genPattern,
    shape: genShape,
    order: genOrder,
  };

  function weightedPickFormat() {
    const weights = FORMATS.map((f) => f.weightMock);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < FORMATS.length; i++) {
      r -= weights[i];
      if (r <= 0) return FORMATS[i].id;
    }
    return FORMATS[FORMATS.length - 1].id;
  }

  function buildRound(mode, formatId) {
    const qs = [];
    for (let i = 0; i < ROUND_LEN; i++) {
      const id = mode === "mock" ? weightedPickFormat() : formatId;
      const gen = GENERATORS[id] || genCount;
      qs.push(gen());
    }
    if (mode === "mock") {
      qs[0] = genPattern();
      qs[1] = genCompare();
      if (ROUND_LEN > 4) qs[3] = genAddSub();
    }
    return qs;
  }

  /* —— Render —— */

  function renderVisual(v) {
    const el = $("q-visual");
    el.innerHTML = "";
    if (!v) return;

    if (v.type === "objects") {
      const grid = document.createElement("div");
      grid.className = "obj-grid";
      v.items.forEach((item, i) => {
        const s = document.createElement("span");
        s.className = "obj";
        s.textContent = item;
        s.style.animationDelay = `${i * 0.04}s`;
        grid.appendChild(s);
      });
      el.appendChild(grid);
      return;
    }

    if (v.type === "bigNumber") {
      const n = document.createElement("div");
      n.className = "pat-cell";
      n.style.width = "96px";
      n.style.height = "96px";
      n.style.fontSize = "2.8rem";
      n.textContent = String(v.n);
      el.appendChild(n);
      return;
    }

    if (v.type === "twoPiles") {
      ["a", "b"].forEach((key, idx) => {
        const pile = document.createElement("div");
        pile.className = "pile";
        const lab = document.createElement("div");
        lab.className = "pile-label";
        lab.textContent = v.labels[idx];
        const objs = document.createElement("div");
        objs.className = "pile-objs";
        const count = key === "a" ? v.a : v.b;
        for (let i = 0; i < count; i++) {
          const s = document.createElement("span");
          s.className = "obj";
          s.textContent = v.obj;
          objs.appendChild(s);
        }
        pile.appendChild(lab);
        pile.appendChild(objs);
        el.appendChild(pile);
      });
      return;
    }

    if (v.type === "story") {
      const box = document.createElement("div");
      box.className = "story-box";
      box.textContent = v.text;
      el.appendChild(box);
      if (v.items) {
        const grid = document.createElement("div");
        grid.className = "obj-grid";
        v.items.forEach((item) => {
          const s = document.createElement("span");
          s.className = "obj";
          s.style.fontSize = item === "➕" ? "1.4rem" : "1.6rem";
          s.textContent = item;
          grid.appendChild(s);
        });
        el.appendChild(grid);
      }
      return;
    }

    if (v.type === "pattern") {
      const row = document.createElement("div");
      row.className = "pattern-row";
      v.seq.forEach((item) => {
        const cell = document.createElement("div");
        cell.className = "pat-cell";
        cell.textContent = item;
        row.appendChild(cell);
      });
      if (v.blank) {
        const arrow = document.createElement("span");
        arrow.className = "pat-arrow";
        arrow.textContent = "→";
        row.appendChild(arrow);
        const blank = document.createElement("div");
        blank.className = "pat-cell blank";
        blank.textContent = "?";
        row.appendChild(blank);
      }
      el.appendChild(row);
      return;
    }

    if (v.type === "countPattern") {
      const row = document.createElement("div");
      row.className = "pattern-row";
      v.counts.forEach((c) => {
        const cell = document.createElement("div");
        cell.className = "pat-cell";
        cell.style.width = "auto";
        cell.style.minWidth = "52px";
        cell.style.padding = "4px 8px";
        cell.style.fontSize = "1.2rem";
        cell.textContent = Array(c).fill(v.obj).join("");
        row.appendChild(cell);
      });
      const arrow = document.createElement("span");
      arrow.className = "pat-arrow";
      arrow.textContent = "→";
      row.appendChild(arrow);
      const blank = document.createElement("div");
      blank.className = "pat-cell blank";
      blank.textContent = "?";
      row.appendChild(blank);
      el.appendChild(row);
      return;
    }

    if (v.type === "shape") {
      const cell = document.createElement("div");
      cell.className = "pat-cell";
      cell.style.width = "100px";
      cell.style.height = "100px";
      cell.style.fontSize = "3.2rem";
      cell.textContent = v.shape.emoji;
      el.appendChild(cell);
      return;
    }

    if (v.type === "order") {
      renderOrderUI(el, v);
    }
  }

  function renderOrderUI(el, v) {
    const hint = document.createElement("p");
    hint.className = "order-hint";
    hint.textContent = "撳數字放入格仔 · 由細到大";
    el.appendChild(hint);

    const slots = document.createElement("div");
    slots.className = "order-slots";
    const slotEls = [];
    v.sorted.forEach(() => {
      const s = document.createElement("div");
      s.className = "slot";
      s.dataset.val = "";
      slots.appendChild(s);
      slotEls.push(s);
    });
    el.appendChild(slots);

    const bank = document.createElement("div");
    bank.className = "order-bank";
    const placed = [];

    v.nums.forEach((n) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = String(n);
      chip.dataset.n = String(n);
      chip.addEventListener("click", () => {
        if (state.answered || chip.classList.contains("used")) return;
        const empty = slotEls.find((s) => !s.dataset.val);
        if (!empty) return;
        empty.textContent = String(n);
        empty.dataset.val = String(n);
        empty.classList.add("filled");
        chip.classList.add("used");
        placed.push({ n: String(n), chip, slot: empty });
        confirm.disabled = slotEls.some((s) => !s.dataset.val);
      });
      bank.appendChild(chip);
    });
    el.appendChild(bank);

    slotEls.forEach((s) => {
      s.addEventListener("click", () => {
        if (state.answered || !s.dataset.val) return;
        const val = s.dataset.val;
        const entry = placed.find((p) => p.slot === s && p.n === val);
        if (entry) {
          entry.chip.classList.remove("used");
          placed.splice(placed.indexOf(entry), 1);
        }
        s.textContent = "";
        s.dataset.val = "";
        s.classList.remove("filled");
        confirm.disabled = true;
      });
    });

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "confirm-btn";
    confirm.textContent = "確定 ✓";
    confirm.disabled = true;
    confirm.addEventListener("click", () => {
      if (state.answered) return;
      const ans = slotEls.map((s) => s.dataset.val).join(",");
      gradeAnswer(ans);
    });
    el.appendChild(confirm);

    $("q-choices").innerHTML = "";
    $("q-choices").classList.add("hidden");
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    state.answered = false;
    stopSpeech();
    $("play-progress").textContent = `${state.index + 1} / ${state.questions.length}`;
    const d = diff();
    const modeName =
      state.mode === "mock" ? "神小風格模擬" : FORMATS.find((f) => f.id === state.formatId)?.name || "練習";
    $("play-mode-label").textContent = `${modeName} · ${d.label}`;

    $("feedback").classList.add("hidden");
    $("feedback").classList.remove("ok", "bad");
    $("q-choices").classList.remove("hidden", "single-col");

    const tag = q.tag ? `<span class="q-tag">${q.tag}</span><br/>` : "";
    $("q-prompt").innerHTML = tag + escapeHtml(q.prompt);

    const speakBtn = $("btn-speak");
    const noTts = !ttsAvailable();
    // Keep clickable when muted so we can show「已靜音」feedback; only block if no TTS
    speakBtn.disabled = noTts;
    speakBtn.classList.toggle("muted-ui", !!state.muted || noTts);
    speakBtn.setAttribute(
      "aria-label",
      noTts ? "唔支援朗讀" : state.muted ? "已靜音" : "廣東話朗讀題目"
    );
    if (noTts) showTtsFeedback("呢部機唔支援廣東話朗讀", true);
    else {
      const hint = $("tts-hint");
      if (hint && !hint.dataset.sticky) hint.classList.add("hidden");
    }

    renderVisual(q.visual);

    if (q.interactive === "order") {
      // choices handled in visual
    } else {
      const box = $("q-choices");
      box.innerHTML = "";
      if (q.singleCol) box.classList.add("single-col");
      q.choices.forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn" + (q.emojiChoices ? " big-emoji" : "");
        btn.textContent = c;
        btn.addEventListener("click", () => gradeAnswer(c));
        box.appendChild(btn);
      });
    }

    if (state.useTimer) startTimer();
    else stopTimer();

    maybeAutoRead(q);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function gradeAnswer(given) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();
    stopSpeech();

    const q = state.questions[state.index];
    const timedOut = given === "__timeout__";
    const ok = !timedOut && String(given) === String(q.answer);
    if (ok) state.score++;

    $("q-choices").querySelectorAll(".choice-btn").forEach((btn) => {
      btn.classList.add("disabled");
      if (btn.textContent === q.answer) btn.classList.add("correct");
      else if (!timedOut && btn.textContent === String(given) && !ok) btn.classList.add("wrong");
    });

    const fb = $("feedback");
    fb.classList.remove("hidden", "ok", "bad");
    fb.classList.add(ok ? "ok" : "bad");
    if (ok) {
      $("feedback-text").textContent = pick(["好棒！🎉", "啱晒！⭐", "好叻！👏", "繼續加油！✨"]);
    } else if (timedOut) {
      $("feedback-text").textContent = `時間到～答案係：${q.answer}。${q.explain || ""}`;
    } else {
      $("feedback-text").textContent = `唔緊要～答案係：${q.answer}。${q.explain || ""}`;
    }
    $("btn-next").textContent =
      state.index + 1 >= state.questions.length ? "睇成績 ›" : "下一題 ›";

    softBeep(ok);
  }

  function softBeep(ok) {
    if (state.muted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = ok ? 880 : 220;
      g.gain.value = 0.04;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      o.stop(ctx.currentTime + 0.2);
    } catch (_) { /* ignore */ }
  }

  function startTimer() {
    stopTimer();
    const d = diff();
    state.timerLeft = d.timerSec;
    const wrap = $("timer-wrap");
    wrap.classList.remove("hidden", "warn");
    $("timer-sec").textContent = String(state.timerLeft);
    state.timerId = setInterval(() => {
      state.timerLeft--;
      $("timer-sec").textContent = String(Math.max(0, state.timerLeft));
      if (state.timerLeft <= Math.min(10, Math.floor(d.timerSec / 3))) wrap.classList.add("warn");
      if (state.timerLeft <= 0) {
        stopTimer();
        if (!state.answered) {
          gradeAnswer("__timeout__");
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
    $("timer-wrap").classList.add("hidden");
  }

  function showResult() {
    stopSpeech();
    show("screen-result");
    const total = state.questions.length;
    const s = state.score;
    const d = diff();
    $("result-score").textContent = `${s} / ${total}`;
    $("result-diff").textContent = `難度：${d.label}`;
    let stars = "⭐";
    let title = "加油呀！";
    let msg = "多啲練規律同比多少，神小面試好睇呢啲。";
    if (s === total) {
      stars = "⭐⭐⭐";
      title = "满分！好叻！";
      msg =
        d.id === "hard"
          ? "神小挑戰都滿分！數感同推理好穩，繼續輕鬆講「我點諗」。"
          : "數感同推理都好穩，繼續保持輕鬆表達「我點諗」。";
    } else if (s >= Math.ceil(total * 0.75)) {
      stars = "⭐⭐";
      title = "好叻！";
      msg = "差唔多晒！錯嘅題睇返解釋，下次會更好。";
    } else if (s >= Math.ceil(total * 0.5)) {
      stars = "⭐⭐";
      title = "做得好！";
      msg = "半數以上啱！慢慢練，唔使趕。";
    }
    $("result-stars").textContent = stars;
    $("result-title").textContent = title;
    $("result-msg").textContent = msg;
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem("imp-prefs");
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.difficulty && DIFFICULTIES[p.difficulty]) state.difficulty = p.difficulty;
      if (typeof p.autoRead === "boolean") state.autoRead = p.autoRead;
      if (typeof p.muted === "boolean") state.muted = p.muted;
      if (typeof p.timer === "boolean") $("opt-timer").checked = p.timer;
    } catch (_) { /* ignore */ }
  }

  function savePrefs() {
    try {
      localStorage.setItem(
        "imp-prefs",
        JSON.stringify({
          difficulty: state.difficulty,
          autoRead: state.autoRead,
          muted: state.muted,
          timer: $("opt-timer").checked,
        })
      );
    } catch (_) { /* ignore */ }
  }

  function syncHomeOpts() {
    $("opt-auto-read").checked = state.autoRead;
    $("opt-mute").checked = state.muted;
    const d = diff();
    $("opt-timer-label").textContent = d.timerLabel;
    document.querySelectorAll(".diff-btn").forEach((btn) => {
      const on = btn.getAttribute("data-diff") === state.difficulty;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const sel = $("diff-selected");
    if (sel) sel.textContent = "已選：" + d.label;
    const block = $("diff-block") || document.querySelector(".diff-block");
    if (block) block.classList.toggle("diff-chosen", !!state.difficulty);
  }

  function startRound(mode, formatId) {
    // Must run inside the tap that starts the round (iOS speech unlock)
    unlockSpeech();
    if (!state.difficulty || !DIFFICULTIES[state.difficulty]) {
      state.difficulty = "medium";
      syncHomeOpts();
    }
    state.mode = mode;
    state.formatId = formatId;
    state.useTimer = mode === "mock" && $("opt-timer").checked;
    state.autoRead = $("opt-auto-read").checked;
    state.muted = $("opt-mute").checked;
    savePrefs();
    state.questions = buildRound(mode, formatId);
    state.index = 0;
    state.score = 0;
    state.lastAgain = { mode, formatId, difficulty: state.difficulty };
    show("screen-play");
    const speakNow = state.autoRead && !state.muted && state.speechUnlocked;
    if (speakNow) state._skipAutoReadOnce = true;
    renderQuestion();
    if (speakNow) {
      const first = state.questions[0];
      if (first) speakText(buildSpeakScript(first));
    }
  }

  function buildFormatList() {
    const list = $("format-list");
    list.innerHTML = "";
    FORMATS.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "format-btn";
      btn.style.setProperty("--fmt-accent", f.accent);
      btn.innerHTML =
        `<span class="fe" aria-hidden="true">${f.emoji}</span>` +
        `<span><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.desc)}</small></span>`;
      btn.addEventListener("click", () => startRound("practice", f.id));
      list.appendChild(btn);
    });
  }

  /* —— Wire UI —— */
  function selectDifficulty(id, btnEl) {
    if (!id || !DIFFICULTIES[id]) return;
    state.difficulty = id;
    syncHomeOpts();
    savePrefs();
    if (btnEl) {
      btnEl.classList.add("diff-pulse");
      setTimeout(() => btnEl.classList.remove("diff-pulse"), 220);
    }
  }

  (function wireDifficulty() {
    const row = $("diff-row");
    if (!row) return;
    // Event delegation: taps on nested <strong>/<small> still hit the button.
    // Debounce click+pointerup so iPhone does not fire twice.
    let lastTs = 0;
    const onPick = (e) => {
      const btn = e.target.closest(".diff-btn");
      if (!btn || !row.contains(btn)) return;
      const now = Date.now();
      if (now - lastTs < 350) return;
      lastTs = now;
      selectDifficulty(btn.getAttribute("data-diff"), btn);
    };
    row.addEventListener("click", onPick);
    row.addEventListener("pointerup", onPick);
  })();

  $("opt-auto-read").addEventListener("change", () => {
    state.autoRead = $("opt-auto-read").checked;
    if (state.autoRead && state.muted) {
      state.muted = false;
      $("opt-mute").checked = false;
    }
    savePrefs();
  });
  $("opt-mute").addEventListener("change", () => {
    state.muted = $("opt-mute").checked;
    if (state.muted) {
      stopSpeech();
      state.autoRead = false;
      $("opt-auto-read").checked = false;
    }
    savePrefs();
  });
  $("opt-timer").addEventListener("change", savePrefs);

  $("btn-speak").addEventListener("click", (e) => {
    e.preventDefault();
    unlockSpeech();
    const q = state.questions[state.index];
    if (!q) return;
    // Synchronous speak inside tap handler — required on iOS Safari
    speakText(buildSpeakScript(q), { force: true });
  });

  $("btn-mock").addEventListener("click", () => startRound("mock", null));
  $("btn-practice-menu").addEventListener("click", () => {
    buildFormatList();
    show("screen-formats");
  });
  $("btn-formats-back").addEventListener("click", () => {
    show("screen-home");
  });
  $("btn-play-quit").addEventListener("click", () => {
    stopTimer();
    stopSpeech();
    show("screen-home");
  });
  $("btn-next").addEventListener("click", () => {
    stopSpeech();
    if (state.index + 1 >= state.questions.length) {
      showResult();
      return;
    }
    state.index++;
    renderQuestion();
  });
  $("btn-again").addEventListener("click", () => {
    if (state.lastAgain) {
      if (state.lastAgain.difficulty) state.difficulty = state.lastAgain.difficulty;
      syncHomeOpts();
      startRound(state.lastAgain.mode, state.lastAgain.formatId);
    } else show("screen-home");
  });
  $("btn-home").addEventListener("click", () => {
    stopSpeech();
    show("screen-home");
  });

  document.addEventListener(
    "dblclick",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  if (window.speechSynthesis) {
    refreshVoice();
    speechSynthesis.addEventListener("voiceschanged", refreshVoice);
    // iOS often populates voices asynchronously after first getVoices()
    setTimeout(refreshVoice, 250);
    setTimeout(refreshVoice, 1000);
  } else {
    updateTtsHint();
  }

  // Unlock speech on any early home interaction (iOS)
  ["pointerdown", "touchstart", "click"].forEach((evt) => {
    document.getElementById("screen-home")?.addEventListener(
      evt,
      () => unlockSpeech(),
      { passive: true, once: false }
    );
  });

  loadPrefs();
  syncHomeOpts();
  updateTtsHint();
})();
