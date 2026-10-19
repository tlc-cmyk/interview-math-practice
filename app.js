/* 升小數學面試練 — 神小風格偏規律／比較／圖畫應用／數感 */
(function () {
  "use strict";

  const ROUND_LEN = 8;
  const TIMER_SEC = 45;

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
    useTimer: false,
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    timerId: null,
    timerLeft: TIMER_SEC,
    lastAgain: null,
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

  /* —— Generators —— */

  function genCount() {
    const n = 3 + rand(8); // 3–10
    const obj = pick(OBJECTS);
    const items = Array(n).fill(obj);
    const choices = uniqueChoices(n, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4);
    return {
      format: "count",
      tag: "數數",
      prompt: `數一數：一共有幾多個？`,
      visual: { type: "objects", items },
      choices: choices.map(String),
      answer: String(n),
      explain: `一共有 ${n} 個 ${obj}`,
    };
  }

  function genRecognize() {
    const kind = rand(2);
    if (kind === 0) {
      // Match digit to quantity
      const n = 1 + rand(9);
      const obj = pick(OBJECTS);
      return {
        format: "recognize",
        tag: "認數字",
        prompt: `邊個數字啱呢堆物件？`,
        visual: { type: "objects", items: Array(n).fill(obj) },
        choices: uniqueChoices(n, [1, 2, 3, 4, 5, 6, 7, 8, 9], 4).map(String),
        answer: String(n),
        explain: `有 ${n} 個，所以係「${n}」`,
      };
    }
    // Show digit, pick matching quantity picture (via choice of counts)
    const n = 2 + rand(7);
    const distractors = uniqueChoices(n, [1, 2, 3, 4, 5, 6, 7, 8, 9], 4);
    return {
      format: "recognize",
      tag: "配對",
      prompt: `「${n}」代表幾多？揀啱嘅數量`,
      visual: { type: "bigNumber", n },
      choices: distractors.map((d) => `${d} 個`),
      answer: `${n} 個`,
      explain: `數字 ${n} 就係 ${n} 個`,
    };
  }

  function genCompare() {
    const obj = pick(OBJECTS);
    let a = 2 + rand(6);
    let b = 2 + rand(6);
    if (a === b && rand(3) !== 0) b = a + 1 + rand(2);
    if (a > 8) a = 8;
    if (b > 8) b = 8;

    const mode = pick(["more", "less", "same"]);
    let prompt, answer, explain;
    if (mode === "same") {
      b = a;
      prompt = "邊堆同左邊一樣多？";
      // choices will be piles shown as buttons — use A/B/一樣
      answer = "一樣多";
      explain = `兩邊都係 ${a} 個，一樣多`;
      return {
        format: "compare",
        tag: "比多少",
        prompt: "兩堆係咪一樣多？",
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
      visual: { type: "twoPiles", a, b, obj, labels: ["A", "B"] },
      choices: a === b ? ["一樣多", "A", "B"] : ["A", "B", "一樣多"],
      answer,
      explain,
      singleCol: true,
    };
  }

  function genAddSub() {
    const obj = pick(OBJECTS);
    // 神小：偏情境圖畫應用，多數加
    const isAdd = rand(10) < 7;
    if (isAdd) {
      const x = 1 + rand(6);
      const y = 1 + rand(5);
      const sum = x + y;
      if (sum > 12) return genAddSub();
      const stories = [
        `有 ${x} 個${obj}，又嚟多 ${y} 個，一共幾多？`,
        `籃入面有 ${x} 個，再放入 ${y} 個，而家有幾多？`,
        `小明有 ${x} 個，媽媽再畀 ${y} 個，一共幾多？`,
      ];
      return {
        format: "addsub",
        tag: "加減應用",
        prompt: "聽清楚題目，諗一諗～",
        visual: {
          type: "story",
          text: pick(stories),
          items: Array(x).fill(obj).concat(["➕"]).concat(Array(y).fill(obj)),
        },
        choices: uniqueChoices(sum, [sum - 2, sum - 1, sum, sum + 1, sum + 2, x, y].filter((n) => n > 0), 4).map(String),
        answer: String(sum),
        explain: `${x} + ${y} = ${sum}`,
      };
    }
    const total = 4 + rand(7); // 4–10
    const take = 1 + rand(Math.min(4, total - 1));
    const left = total - take;
    const stories = [
      `有 ${total} 個${obj}，畀咗 ${take} 個，仲剩幾多？`,
      `桌上有 ${total} 個，食咗 ${take} 個，剩返幾多？`,
    ];
    return {
      format: "addsub",
      tag: "加減應用",
      prompt: "聽清楚題目，諗一諗～",
      visual: {
        type: "story",
        text: pick(stories),
        items: Array(total).fill(obj),
      },
      choices: uniqueChoices(left, [left - 1, left, left + 1, take, total].filter((n) => n >= 0), 4).map(String),
      answer: String(left),
      explain: `${total} − ${take} = ${left}`,
    };
  }

  function genPattern() {
    const kind = pick(["abab", "aab", "countUp", "shapeCycle", "size"]);
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
        visual: { type: "pattern", seq, blank: true },
        choices: shuffle([next, a, pick(["🟣", "🟠"]), b === "🔴" ? "🔵" : "🔴"]),
        answer: next,
        explain: `兩個 ${a} 跟住一個 ${b}，重複咁樣`,
        emojiChoices: true,
      };
    }
    if (kind === "countUp") {
      const start = 1 + rand(3);
      const seq = [start, start + 1, start + 2, start + 3];
      const next = start + 4;
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "數字一個大過一個，下一個係？",
        visual: { type: "pattern", seq: seq.map(String), blank: true },
        choices: uniqueChoices(next, [next - 2, next - 1, next, next + 1, next + 2], 4).map(String),
        answer: String(next),
        explain: `每次多 1：下一個係 ${next}`,
      };
    }
    if (kind === "size") {
      // 神小常見：數量遞增 pattern with objects
      const obj = pick(OBJECTS);
      const seq = ["①", "②", "③"];
      const visualCounts = [1, 2, 3];
      return {
        format: "pattern",
        tag: "找規律",
        prompt: "物件愈嚟愈多，下一格應該幾多個？",
        visual: {
          type: "countPattern",
          obj,
          counts: visualCounts,
        },
        choices: ["2", "3", "4", "5"],
        answer: "4",
        explain: "每格多 1 個：1→2→3→4",
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
      visual: { type: "pattern", seq, blank: true },
      choices: shuffle([next, ...cycle.filter((c) => c !== next), "⭐"]).slice(0, 4),
      answer: next,
      explain: `規律：${cycle.join("→")} 循環`,
      emojiChoices: true,
    };
  }

  function genShape() {
    const target = pick(SHAPES.filter((s) => s.id !== "rect"));
    const mode = rand(2);
    if (mode === 0) {
      return {
        format: "shape",
        tag: "圖形",
        prompt: "呢個係咩形狀？",
        visual: { type: "shape", shape: target },
        choices: shuffle(SHAPES.map((s) => s.name)).slice(0, 4),
        answer: target.name,
        explain: `呢個係${target.name}`,
        singleCol: true,
      };
    }
    // odd one out — 神小常見
    const base = pick(["⭕", "🔺", "🟦"]);
    const odd = pick(["⭕", "🔺", "🟦", "⭐"].filter((x) => x !== base));
    const items = shuffle([base, base, base, odd]);
    return {
      format: "shape",
      tag: "搵唔同",
      prompt: "邊個唔同類？",
      visual: { type: "pattern", seq: items, blank: false },
      choices: items,
      answer: odd,
      explain: `其餘都係一樣，唔同嘅係 ${odd}`,
      emojiChoices: true,
    };
  }

  function genOrder() {
    const count = 3 + rand(2); // 3 or 4
    const start = 1 + rand(6);
    const nums = [];
    for (let i = 0; i < count; i++) nums.push(start + i);
    const shuffled = shuffle(nums);
    return {
      format: "order",
      tag: "排次序",
      prompt: "由細到大，撳次序排好",
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
    // 神小模擬：確保至少有 2 題規律、1 題比較
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

    // tap slot to undo
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

    // clear choices area for order
    $("q-choices").innerHTML = "";
    $("q-choices").classList.add("hidden");
  }

  function renderQuestion() {
    const q = state.questions[state.index];
    state.answered = false;
    $("play-progress").textContent = `${state.index + 1} / ${state.questions.length}`;
    $("play-mode-label").textContent =
      state.mode === "mock" ? "神小風格模擬" : FORMATS.find((f) => f.id === state.formatId)?.name || "練習";

    $("feedback").classList.add("hidden");
    $("feedback").classList.remove("ok", "bad");
    $("q-choices").classList.remove("hidden", "single-col");

    const tag = q.tag ? `<span class="q-tag">${q.tag}</span><br/>` : "";
    $("q-prompt").innerHTML = tag + escapeHtml(q.prompt);

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

    const q = state.questions[state.index];
    const timedOut = given === "__timeout__";
    const ok = !timedOut && String(given) === String(q.answer);
    if (ok) state.score++;

    // mark choice buttons
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
    state.timerLeft = TIMER_SEC;
    const wrap = $("timer-wrap");
    wrap.classList.remove("hidden", "warn");
    $("timer-sec").textContent = String(state.timerLeft);
    state.timerId = setInterval(() => {
      state.timerLeft--;
      $("timer-sec").textContent = String(Math.max(0, state.timerLeft));
      if (state.timerLeft <= 10) wrap.classList.add("warn");
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
    show("screen-result");
    const total = state.questions.length;
    const s = state.score;
    $("result-score").textContent = `${s} / ${total}`;
    let stars = "⭐";
    let title = "加油呀！";
    let msg = "多啲練規律同比多少，神小面試好睇呢啲。";
    if (s === total) {
      stars = "⭐⭐⭐";
      title = "满分！好叻！";
      msg = "數感同推理都好穩，繼續保持輕鬆表達「我點諗」。";
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

  function startRound(mode, formatId) {
    state.mode = mode;
    state.formatId = formatId;
    state.useTimer = mode === "mock" && $("opt-timer").checked;
    state.questions = buildRound(mode, formatId);
    state.index = 0;
    state.score = 0;
    state.lastAgain = { mode, formatId };
    show("screen-play");
    renderQuestion();
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
    show("screen-home");
  });
  $("btn-next").addEventListener("click", () => {
    if (state.index + 1 >= state.questions.length) {
      showResult();
      return;
    }
    state.index++;
    renderQuestion();
  });
  $("btn-again").addEventListener("click", () => {
    if (state.lastAgain) startRound(state.lastAgain.mode, state.lastAgain.formatId);
    else show("screen-home");
  });
  $("btn-home").addEventListener("click", () => show("screen-home"));

  // Prevent accidental zoom double-tap on buttons
  document.addEventListener(
    "dblclick",
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
})();
