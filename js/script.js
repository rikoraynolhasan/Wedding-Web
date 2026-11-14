const cover = document.querySelector("#sampul");
    const envelope = document.querySelector(".envelope");
    const openButton = document.querySelector("#open-invitation");
    const invitation = document.querySelector("#invitation");
    const musicButton = document.querySelector("#music-button");
    const musicLabel = document.querySelector("#music-label");
    const weddingMusic = new Audio("audio/wedding-violin.mp3");
    weddingMusic.loop = true;
    weddingMusic.preload = "none";
    const galleryLightbox = document.querySelector("#gallery-lightbox");
    const lightboxImage = document.querySelector(".lightbox-image");
    const guestNameFirst = document.querySelector("#guest-name-first");
    const guestNameConjunction = document.querySelector("#guest-name-conjunction");
    const guestNameSecond = document.querySelector("#guest-name-second");
    const commentsContainer = document.querySelector("#comments");
    const formStatus = document.querySelector("#form-status");
    const locationSegments = window.location.pathname.split("/");
    const indexPathIndex = locationSegments.findIndex((segment) => segment.toLowerCase() === "index.html");
    const pathGuestName = indexPathIndex < 0
      ? ""
      : locationSegments.slice(indexPathIndex + 1).filter(Boolean).join(" ");
    const urlParameters = new URLSearchParams(window.location.search);
    const queryGuestName = urlParameters.get("to") || urlParameters.get("guest") || "";
    let decodedPathGuestName = "";
    if (pathGuestName) {
      try {
        decodedPathGuestName = decodeURIComponent(pathGuestName.replace(/\+/g, " "));
      } catch {
        decodedPathGuestName = pathGuestName.replace(/%/g, " ");
      }
    }
    const guestNames = (queryGuestName || decodedPathGuestName)
      .split(",")
      .map((name) => name.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.slice(0, 120));
    if (guestNames.length > 0) {
      guestNameFirst.textContent = guestNames[0];
      guestNameSecond.textContent = guestNames[1] || "";
      guestNameSecond.hidden = guestNames.length < 2;
      guestNameConjunction.hidden = guestNames.length < 2;
    }
    const supabaseConfig = window.weddingSupabaseConfig;
    let supabaseClient = null;
    if (
      supabaseConfig &&
      /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseConfig.url) &&
      typeof supabaseConfig.anonKey === "string" &&
      supabaseConfig.anonKey.length > 20 &&
      window.supabase?.createClient
    ) {
      supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    }
    let savedComments = [];
    let commentsStorageAvailable = Boolean(supabaseClient);

    async function startMusic() {
      await weddingMusic.play();
      musicButton.classList.add("playing");
      musicButton.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Jeda violin";
    }

    function stopMusic() {
      weddingMusic.pause();
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
      if (!weddingMusic.paused) stopMusic();
      else startMusic().catch((error) => {
        musicLabel.textContent = "Musik gagal diputar";
        console.error("Musik violin tidak dapat diputar.", error);
      });
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

    document.querySelectorAll(".gallery-photo").forEach((photo) => {
      photo.addEventListener("click", () => {
        const image = photo.querySelector("img");
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        galleryLightbox.showModal();
      });
    });

    document.querySelector(".lightbox-close").addEventListener("click", () => {
      galleryLightbox.close();
    });

    galleryLightbox.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        galleryLightbox.close();
      }
    });

    galleryLightbox.addEventListener("click", (event) => {
      if (event.target === galleryLightbox) galleryLightbox.close();
    });

    galleryLightbox.addEventListener("close", () => {
      lightboxImage.removeAttribute("src");
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
        if (entry.attendance === "hadir" || entry.attendance === "tidak-hadir") {
          const attendance = document.createElement("span");
          attendance.className = "comment-attendance";
          attendance.textContent = entry.attendance === "hadir"
            ? "Insyaallah hadir"
            : "Mohon maaf, tidak hadir";
          card.append(attendance);
        }
        message.className = "comment-text";
        message.textContent = entry.comment;
        date.className = "comment-date";
        date.dateTime = entry.created_at;
        date.textContent = new Date(entry.created_at).toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short"
        });
        card.append(name, message, date);
        commentsContainer.append(card);
      });
    }

    async function loadComments() {
      if (!supabaseClient) {
        commentsStorageAvailable = false;
        formStatus.classList.add("error");
        formStatus.textContent = "Buku tamu belum terhubung. Admin perlu mengatur koneksi Supabase terlebih dahulu.";
        console.error("Supabase belum dikonfigurasi untuk buku tamu.");
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("wedding_comments")
          .select("id, name, comment, attendance, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        savedComments = data;
        commentsStorageAvailable = true;
        renderComments();
      } catch (error) {
        commentsStorageAvailable = false;
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan belum dapat dimuat. Silakan coba beberapa saat lagi.";
        console.error("Gagal membaca ucapan tersimpan.", error);
      }
    }

    document.querySelector("#rsvp-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!commentsStorageAvailable || !supabaseClient) {
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan tidak dapat dikirim. Pastikan koneksi buku tamu tersedia.";
        return;
      }
      const guestName = document.querySelector("#guest").value.trim();
      const comment = document.querySelector("#comment").value.trim();
      const attendance = document.querySelector('input[name="attendance"]:checked')?.value;
      if (!guestName || !comment || !attendance) return;

      const submitButton = form.querySelector(".submit-button");
      submitButton.disabled = true;
      try {
        const { data, error } = await supabaseClient
          .from("wedding_comments")
          .insert({ name: guestName, comment, attendance })
          .select("id, name, comment, attendance, created_at")
          .single();
        if (error) throw error;
        savedComments = [data, ...savedComments];
        renderComments();
        formStatus.classList.remove("error");
        formStatus.textContent = `Terima kasih, ${guestName}. Konfirmasi kehadiran dan ucapanmu sudah tersimpan.`;
        form.reset();
      } catch (error) {
        formStatus.classList.add("error");
        formStatus.textContent = "Ucapan gagal dikirim. Silakan coba kembali.";
        console.error("Gagal menyimpan ucapan.", error);
      } finally {
        submitButton.disabled = false;
      }
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
        if (!weddingMusic.paused) stopMusic();
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
