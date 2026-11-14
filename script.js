const cover = document.querySelector("#sampul");
    const envelope = document.querySelector(".envelope");
    const openButton = document.querySelector("#open-invitation");
    const invitation = document.querySelector("#invitation");
    const musicButton = document.querySelector("#music-button");
    const musicLabel = document.querySelector("#music-label");
    const commentsContainer = document.querySelector("#comments");
    const formStatus = document.querySelector("#form-status");
    const commentsStorageKey = "riko-eva-wedding-comments-v1";
    let audioContext;
    let musicTimer;
    let masterGain;
    let violinWave;
    let savedComments = [];
    let commentsStorageAvailable = true;

    function playViolinNote(frequency, startTime, duration, volume) {
      const oscillator = audioContext.createOscillator();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      const vibrato = audioContext.createOscillator();
      const vibratoDepth = audioContext.createGain();

      oscillator.setPeriodicWave(violinWave);
      oscillator.frequency.setValueAtTime(frequency, startTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(3600, startTime);
      filter.Q.setValueAtTime(1.1, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.34);
      gain.gain.setValueAtTime(volume, startTime + duration * 0.78);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + 0.55);
      vibrato.type = "sine";
      vibrato.frequency.setValueAtTime(5.4, startTime + 0.25);
      vibratoDepth.gain.setValueAtTime(0, startTime);
      vibratoDepth.gain.linearRampToValueAtTime(5, startTime + 0.9);
      vibrato.connect(vibratoDepth);
      vibratoDepth.connect(oscillator.frequency);
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      oscillator.start(startTime);
      vibrato.start(startTime + 0.25);
      oscillator.stop(startTime + duration + 0.62);
      vibrato.stop(startTime + duration + 0.62);
    }

    function scheduleMusic() {
      const melody = [
        { frequency: 587.33, duration: 4.4, gap: 3.8 },
        { frequency: 659.25, duration: 3.2, gap: 2.8 },
        { frequency: 739.99, duration: 4.2, gap: 3.6 },
        { frequency: 880.00, duration: 5.0, gap: 4.1 },
        { frequency: 830.61, duration: 3.6, gap: 3.1 },
        { frequency: 739.99, duration: 4.5, gap: 3.7 },
        { frequency: 659.25, duration: 3.4, gap: 2.9 },
        { frequency: 587.33, duration: 5.2, gap: 4.2 },
        { frequency: 493.88, duration: 3.5, gap: 3.0 },
        { frequency: 587.33, duration: 4.3, gap: 3.6 },
        { frequency: 659.25, duration: 5.0, gap: 4.1 },
        { frequency: 587.33, duration: 6.0, gap: 5.4 }
      ];
      const harmonies = [
        { start: 0, notes: [293.66, 369.99, 440.00] },
        { start: 9.5, notes: [246.94, 293.66, 369.99] },
        { start: 19, notes: [196.00, 246.94, 293.66] },
        { start: 28.5, notes: [220.00, 277.18, 329.63] },
        { start: 38, notes: [293.66, 369.99, 440.00] }
      ];
      let offset = 0;
      const start = audioContext.currentTime + 0.12;

      melody.forEach((note) => {
        playViolinNote(note.frequency, start + offset, note.duration, 0.075);
        offset += note.gap;
      });

      harmonies.forEach((chord) => {
        chord.notes.forEach((frequency, index) => {
          playViolinNote(frequency, start + chord.start + index * 0.09, 8.4, 0.018);
        });
      });

      return offset + 2;
    }

    async function startMusic() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        musicLabel.textContent = "Violin tidak tersedia";
        return;
      }
      if (!audioContext) {
        audioContext = new AudioContextClass();
        const partials = new Float32Array([0, 1, 0.62, 0.42, 0.29, 0.2, 0.13, 0.08, 0.04]);
        const harmonics = new Float32Array(partials.length);
        violinWave = audioContext.createPeriodicWave(partials, harmonics);
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.72;
        masterGain.connect(audioContext.destination);
      }
      await audioContext.resume();
      if (musicTimer) return;
      const phraseDuration = scheduleMusic();
      musicTimer = window.setInterval(scheduleMusic, phraseDuration * 1000);
      musicButton.classList.add("playing");
      musicButton.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Jeda violin";
    }

    async function stopMusic() {
      if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = undefined;
      }
      if (audioContext) await audioContext.suspend();
      musicButton.classList.remove("playing");
      musicButton.setAttribute("aria-pressed", "false");
      musicLabel.textContent = "Putar violin";
    }

    openButton.addEventListener("click", () => {
      if (cover.classList.contains("opened")) return;
      envelope.classList.add("open");
      cover.classList.add("opened");
      openButton.disabled = true;
      openButton.textContent = "Undangan dibuka";
      window.setTimeout(() => {
        invitation.hidden = false;
        document.body.classList.add("cover-open");
        invitation.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1050);
      startMusic().catch((error) => {
        musicLabel.textContent = "Musik gagal diputar";
        console.error("Musik violin tidak dapat diputar.", error);
      });
    });

    musicButton.addEventListener("click", () => {
      if (musicTimer) stopMusic();
      else startMusic();
    });

    const menuButton = document.querySelector("#menu-button");
    const navLinks = document.querySelector("#nav-links");
    menuButton.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
      menuButton.textContent = isOpen ? "×" : "☰";
    });
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Buka menu");
        menuButton.textContent = "☰";
      });
    });

    function renderComments() {
      commentsContainer.replaceChildren();
      savedComments.forEach((entry) => {
        const card = document.createElement("article");
        const name = document.createElement("strong");
        const message = document.createElement("p");
        const date = document.createElement("time");

        card.className = "comment-entry";
        name.className = "comment-name";
        name.textContent = entry.name;
        message.className = "comment-text";
        message.textContent = entry.comment;
        date.className = "comment-date";
        date.dateTime = entry.createdAt;
        date.textContent = new Date(entry.createdAt).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short"
        });
        card.append(name, message, date);
        commentsContainer.append(card);
      });
    }

    function loadComments() {
      try {
        const stored = window.localStorage.getItem(commentsStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed) || parsed.some((entry) =>
            !entry || typeof entry.name !== "string" ||
            typeof entry.comment !== "string" ||
            typeof entry.createdAt !== "string"
          )) {
            throw new Error("Format ucapan tersimpan tidak valid.");
          }
          savedComments = parsed;
        }
        renderComments();
      } catch (error) {
        commentsStorageAvailable = false;
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan tersimpan tidak dapat dibaca di browser ini.";
        console.error("Gagal membaca ucapan tersimpan.", error);
      }
    }

    document.querySelector("#rsvp-form").addEventListener("submit", (event) => {
      event.preventDefault();
      if (!commentsStorageAvailable) {
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan tidak dapat disimpan. Periksa penyimpanan browser Anda.";
        return;
      }
      const guestName = document.querySelector("#guest").value.trim();
      const comment = document.querySelector("#comment").value.trim();
      if (!guestName || !comment) return;

      const nextComments = [{
        name: guestName,
        comment,
        createdAt: new Date().toISOString()
      }, ...savedComments];
      try {
        window.localStorage.setItem(commentsStorageKey, JSON.stringify(nextComments));
      } catch (error) {
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan gagal disimpan. Ruang penyimpanan browser mungkin penuh.";
        console.error("Gagal menyimpan ucapan.", error);
        return;
      }

      savedComments = nextComments;
      renderComments();
      formStatus.classList.remove("error");
      formStatus.textContent = `Terima kasih, ${guestName}. Ucapanmu sudah tersimpan.`;
      event.currentTarget.reset();
    });

    let previousScrollY = window.scrollY;
    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;
      const returnedToCover = currentScrollY < previousScrollY &&
        currentScrollY <= 8 &&
        !invitation.hidden &&
        cover.classList.contains("opened");
      previousScrollY = currentScrollY;

      if (returnedToCover) {
        invitation.hidden = true;
        document.body.classList.remove("cover-open");
        envelope.classList.remove("open");
        cover.classList.remove("opened");
        openButton.disabled = false;
        openButton.innerHTML = '<span aria-hidden="true">✦</span> Buka Undangan <span aria-hidden="true">✦</span>';
        if (musicTimer) stopMusic();
      }
    }, { passive: true });

    loadComments();

    const weddingDate = new Date("2026-12-26T08:00:00+07:00").getTime();
    function updateCountdown() {
      const remaining = weddingDate - Date.now();
      const values = remaining > 0
        ? {
            days: Math.floor(remaining / 86400000),
            hours: Math.floor((remaining % 86400000) / 3600000),
            minutes: Math.floor((remaining % 3600000) / 60000),
            seconds: Math.floor((remaining % 60000) / 1000)
          }
        : { days: 0, hours: 0, minutes: 0, seconds: 0 };
      Object.entries(values).forEach(([unit, value]) => {
        document.querySelector(`#${unit}`).textContent = String(value).padStart(2, "0");
      });
    }
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
