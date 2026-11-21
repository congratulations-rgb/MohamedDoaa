/* ==========================================================
   Wedding invitation — Mohamed & Doaa
   ========================================================== */

/* -------- Editable configuration (change values here only) -------- */
const CONFIG = {
  groom: "محمد",
  bride: "دعاء",
  weekday: "الأربعاء",
  dateText: "25 نوفمبر 2026",
  venue: "قصر عابدين",
  mapsUrl: "https://maps.app.goo.gl/kBdKP1qRtuVH1JJg6?g_st=awb",
  musicFile: "wedding.mp3",

  // Wedding date & time in the VISITOR'S local time: "YYYY-MM-DDTHH:MM:SS"
  // Time is not specified yet, so 12:00 PM (noon) is the temporary default.
  weddingDateTime: "2026-11-25T12:00:00",
};
/* ----------------------------------------------------------------- */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Fill content from CONFIG ---------- */
  const values = { ...CONFIG, namesLine: `${CONFIG.groom} ♡ ${CONFIG.bride}` };
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const v = values[el.dataset.cfg];
    if (v) el.textContent = v;
  });
  $("map-btn").href = CONFIG.mapsUrl;
  $("audio").src = CONFIG.musicFile;

  /* ---------- Petals ---------- */
  const petalLayer = $("petals");

  function spawnPetal(delay) {
    if (reduceMotion) return;
    const p = document.createElement("i");
    p.className = "petal";
    const size = 9 + Math.random() * 12;
    p.style.setProperty("--s", size.toFixed(1) + "px");
    p.style.setProperty("--d", (7 + Math.random() * 7).toFixed(1) + "s");
    p.style.setProperty("--delay", (delay || 0).toFixed(2) + "s");
    p.style.setProperty("--x", (Math.random() * 160 - 80).toFixed(0) + "px");
    p.style.setProperty("--r", (Math.random() * 540 - 180).toFixed(0) + "deg");
    p.style.left = (Math.random() * 100).toFixed(1) + "%";
    p.addEventListener("animationend", () => p.remove());
    petalLayer.appendChild(p);
  }

  function petalBurst(count) {
    for (let i = 0; i < count; i++) spawnPetal(Math.random() * 2.2);
  }

  let ambientTimer = null;
  function startAmbientPetals() {
    if (ambientTimer || reduceMotion) return;
    ambientTimer = setInterval(() => {
      if (!document.hidden) spawnPetal(0);
    }, 2200);
  }

  /* ---------- Music ---------- */
  const audio = $("audio");
  const music = $("music");
  const musicBtn = $("music-btn");
  let audioFailed = false;

  function setPlayingUI(playing) {
    music.classList.toggle("playing", playing);
    musicBtn.setAttribute("aria-pressed", String(playing));
    musicBtn.setAttribute("aria-label", playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى");
  }

  function tryPlay() {
    if (audioFailed) return Promise.resolve(false);
    try {
      const p = audio.play();
      if (p && typeof p.then === "function") {
        return p.then(() => true).catch(() => false);
      }
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  audio.addEventListener("play", () => { setPlayingUI(true); music.classList.remove("need-tap"); });
  audio.addEventListener("pause", () => setPlayingUI(false));
  audio.addEventListener("error", () => {
    audioFailed = true;
    music.hidden = true; // no music file found: hide the player quietly
  });

  musicBtn.addEventListener("click", () => {
    if (audio.paused) {
      tryPlay().then((ok) => { if (ok) music.classList.remove("need-tap"); });
    } else {
      audio.pause();
    }
  });

  /* ---------- Envelope opening ---------- */
  const envelope = $("envelope");
  const screen = $("envelope-screen");
  const invitation = $("invitation");
  let opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;
    envelope.setAttribute('aria-disabled', 'true');

    // Start music inside the user gesture (allowed by browsers).
    const musicStart = tryPlay();

    // 1. Seal fades + flap opens
    envelope.classList.add("open");
    petalBurst(26);

    // 2. Card slides out
    setTimeout(() => envelope.classList.add("card-up"), 1000);
    // 3. Card expands/fades into the invitation
    setTimeout(() => envelope.classList.add("card-fade"), 2100);
    // 4. Envelope screen leaves, invitation appears
    setTimeout(() => {
      screen.classList.add("leave");
      document.body.classList.remove("locked");
      window.scrollTo(0, 0);
      invitation.classList.add("revealed");
      invitation.setAttribute("aria-hidden", "false");
      showMusicPlayer(musicStart);
      observeReveals();
      startAmbientPetals();
    }, 2700);
    setTimeout(() => { screen.style.display = "none"; }, 4000);
  }

  function showMusicPlayer(musicStart) {
    if (audioFailed) return;
    music.hidden = false;
    requestAnimationFrame(() => music.classList.add("show"));
    musicStart.then((ok) => {
      if (!ok && !audioFailed) {
        music.classList.add("need-tap"); // autoplay blocked: show clear play prompt
        setTimeout(() => music.classList.remove("need-tap"), 12000);
      }
    });
  }

  envelope.addEventListener("click", openInvitation);
  envelope.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInvitation(); }
  });

  /* ---------- Reveal on scroll ---------- */
  function observeReveals() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach((el, i) => {
      if (i < 5) el.style.setProperty("--delay", (0.5 + i * 0.35) + "s"); // gentle intro stagger
      io.observe(el);
    });
  }

  /* ---------- Countdown ---------- */
  const target = new Date(CONFIG.weddingDateTime).getTime();
  const cd = {
    box: $("countdown"),
    done: $("cd-done"),
    days: $("cd-days"),
    hours: $("cd-hours"),
    minutes: $("cd-minutes"),
    seconds: $("cd-seconds"),
  };
  const last = {};

  function setNum(key, value) {
    const text = String(value).padStart(2, "0");
    if (last[key] === text) return;
    last[key] = text;
    const el = cd[key];
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth; // restart animation
    el.classList.add("tick");
  }

  function updateCountdown() {
    const diff = target - Date.now();
    if (Number.isNaN(target)) return;

    if (diff <= 0) {
      cd.box.hidden = true;
      cd.done.hidden = false;
      clearInterval(cdTimer);
      return;
    }
    const s = Math.floor(diff / 1000);
    setNum("days", Math.floor(s / 86400));
    setNum("hours", Math.floor((s % 86400) / 3600));
    setNum("minutes", Math.floor((s % 3600) / 60));
    setNum("seconds", s % 60);
  }

  const cdTimer = setInterval(updateCountdown, 1000);
  updateCountdown();
})();
