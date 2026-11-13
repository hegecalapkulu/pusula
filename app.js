/**
 * Pusula — Sürdürülebilir Hayat & Hedef Planlayıcı
 * Günlük / Haftalık Görev Yönetimi, Erteleme Takibi, Kısa & Uzun Vadeli Hedef Pusulası ve Tekrarlayan Rutinler
 */

(function () {
  "use strict";

  const STORAGE_KEY = "pusula_planner_data_v1";

  // =========================================================
  // TARİH VE HAFTA YARDIMCILARI
  // =========================================================
  const TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const TR_DAYS_FULL = [
    "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
  ];
  const TR_DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  function toISODate(d) {
    const dt = d instanceof Date ? d : new Date(d);
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(isoStr) {
    if (!isoStr) return new Date();
    const [y, m, d] = isoStr.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function getTodayISO() {
    return toISODate(new Date());
  }

  function addDaysISO(isoStr, days) {
    const dt = parseISODate(isoStr);
    dt.setDate(dt.getDate() + days);
    return toISODate(dt);
  }

  function diffDays(fromISO, toISO) {
    const d1 = parseISODate(fromISO);
    const d2 = parseISODate(toISO);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function formatFullTR(isoStr) {
    const dt = parseISODate(isoStr);
    return `${dt.getDate()} ${TR_MONTHS[dt.getMonth()]} ${dt.getFullYear()}, ${TR_DAYS_FULL[dt.getDay()]}`;
  }

  function formatShortTR(isoStr) {
    if (!isoStr) return "";
    const dt = parseISODate(isoStr);
    return `${dt.getDate()} ${TR_MONTHS[dt.getMonth()]}`;
  }

  function getRelativeDayLabel(isoStr) {
    const diff = diffDays(getTodayISO(), isoStr);
    if (diff === 0) return "BUGÜN";
    if (diff === 1) return "YARIN";
    if (diff === -1) return "DÜN";
    if (diff > 1) return `${diff} GÜN SONRA`;
    return `${Math.abs(diff)} GÜN ÖNCE`;
  }

  // Haftanın Pazartesi gününü ISO olarak döndürür
  function getWeekMondayISO(isoStr) {
    const dt = parseISODate(isoStr);
    const day = dt.getDay(); // 0 Pazar, 1 Pzt ...
    const diffToMon = day === 0 ? -6 : 1 - day;
    dt.setDate(dt.getDate() + diffToMon);
    return toISODate(dt);
  }

  function getWeekDaysISO(anyDateInWeekISO) {
    const mon = getWeekMondayISO(anyDateInWeekISO);
    return Array.from({ length: 7 }, (_, i) => addDaysISO(mon, i));
  }

  function getISOWeekNumber(isoStr) {
    const dt = parseISODate(isoStr);
    const target = new Date(dt.valueOf());
    const dayNr = (dt.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  function formatWeekRangeTR(anyDateInWeekISO) {
    const days = getWeekDaysISO(anyDateInWeekISO);
    const start = parseISODate(days[0]);
    const end = parseISODate(days[6]);
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${TR_MONTHS[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${TR_MONTHS[start.getMonth()]} – ${end.getDate()} ${TR_MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  // =========================================================
  // BAŞLANGIÇ VERİSİ (ÖRNEK SÜRDÜRÜLEBİLİR YAŞAM SİSTEMİ)
  // =========================================================
  function createDefaultData() {
    const today = getTodayISO();
    const tomorrow = addDaysISO(today, 1);
    const in2Days = addDaysISO(today, 2);
    const yesterday = addDaysISO(today, -1);
    const weekMon = getWeekMondayISO(today);

    const goalLongCareerId = "goal_long_career";
    const goalShortIeltsId = "goal_short_english";
    const goalLongHealthId = "goal_long_health";
    const goalShortHabitId = "goal_short_sleep";

    return {
      version: 1,
      settings: {
        theme: "dark",
        autoRollover: false,
        lastRolloverCheckDate: today
      },
      goals: [
        {
          id: goalLongCareerId,
          title: "Kariyer & Yabancı Dil Yetkinliğini Üst Seviyeye Taşımak",
          horizon: "long", // 'short' | 'long'
          category: "Kariyer & Eğitim",
          startDate: addDaysISO(today, -30),
          targetDate: addDaysISO(today, 180),
          parentId: "",
          why: "Uluslararası projelerde rahat çalışabilmek ve kendime olan özgüvenimi artırmak için 6 aylık ana vizyon hedefim.",
          milestones: [
            { id: "m1", text: "Çalışma sistemini ve haftalık rutini oturt", done: true },
            { id: "m2", text: "B2-C1 kelime ve okuma hedefini tamamla", done: false },
            { id: "m3", text: "Portfolyo / örnek proje sunumunu hazırla", done: false }
          ],
          completed: false,
          createdAt: today
        },
        {
          id: goalShortIeltsId,
          title: "30 Günde 15 Makale Okuma & Akademik Kelime Kampı",
          horizon: "short",
          category: "Kariyer & Eğitim",
          startDate: addDaysISO(today, -5),
          targetDate: addDaysISO(today, 25),
          parentId: goalLongCareerId,
          why: "Uzun vadeli dil hedefimi somutlaştırmak için bu ay her hafta 3-4 makale okuyup özet çıkaracağım.",
          milestones: [
            { id: "m4", text: "İlk 5 makaleyi okuyup kelime notlarını çıkar", done: true },
            { id: "m5", text: "10. makaleye ulaş ve tekrar yap", done: false }
          ],
          completed: false,
          createdAt: today
        },
        {
          id: goalLongHealthId,
          title: "Sürdürülebilir Enerji, Spor ve Uyku Düzeni Kurmak",
          horizon: "long",
          category: "Sağlık & Spor",
          startDate: addDaysISO(today, -14),
          targetDate: addDaysISO(today, 120),
          parentId: "",
          why: "Gün içinde zihinsel olarak dinç kalmak ve erteleme alışkanlığını azaltmak için fiziksel enerjimi korumalıyım.",
          milestones: [
            { id: "m6", text: "Haftada 3 gün antrenman/yürüyüş ritmini yakala", done: true },
            { id: "m7", text: "1 ay boyunca düzenli uyku saatini koru", done: false }
          ],
          completed: false,
          createdAt: today
        },
        {
          id: goalShortHabitId,
          title: "2 Haftalık Dijital Detoks & Planlı Gün Sonu Kapanışı",
          horizon: "short",
          category: "Yaşam & Düzen",
          startDate: addDaysISO(today, -2),
          targetDate: addDaysISO(today, 12),
          parentId: goalLongHealthId,
          why: "Gece geç saatlere kadar ekrana bakmak yerine ertesi günün planını 5 dakikada kontrol edip günü kapatmak.",
          milestones: [
            { id: "m8", text: "Çalışma masasını ve bildirimleri sadeleştir", done: true }
          ],
          completed: false,
          createdAt: today
        }
      ],
      tasks: [
        {
          id: "task_1",
          title: "Haftalık hedefleri gözden geçir ve bu haftanın 3 ana önceliğini belirle",
          scope: "day", // 'day' | 'week'
          date: today,
          weekMonday: weekMon,
          goalId: goalShortHabitId,
          priority: "high",
          category: "Yaşam & Düzen",
          completed: false,
          note: "Saat saat sıkıştırmak yerine her güne en fazla 1 büyük, 2 küçük iş koymaya dikkat et.",
          subtasks: [
            { id: "st1", text: "Geçen haftadan kalan işleri kontrol et", done: true },
            { id: "st2", text: "Bu haftanın esnek görevlerini listele", done: false }
          ],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: today
        },
        {
          id: "task_2",
          title: "1 İngilizce makale oku ve bilmediğin 10 kelimeyi not et",
          scope: "day",
          date: today,
          weekMonday: weekMon,
          goalId: goalShortIeltsId,
          priority: "normal",
          category: "Kariyer & Eğitim",
          completed: false,
          note: "Okuduğum makaledeki önemli kalıpları bu not alanına yazabilirim.",
          subtasks: [],
          postponeCount: 1,
          postponeHistory: [
            {
              from: yesterday,
              to: today,
              reason: "Enerjim düşüktü, bugüne dinç kafayla bıraktım",
              at: yesterday
            }
          ],
          createdAt: yesterday
        },
        {
          id: "task_3",
          title: "Aylık gelir-gider tablosunu ve abonelikleri kontrol et",
          scope: "week",
          date: "",
          weekMonday: weekMon,
          goalId: "",
          priority: "normal",
          category: "Finans",
          completed: false,
          note: "Acelesi yok, hafta içi müsait bir akşam 20 dakikada halledilecek.",
          subtasks: [],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: today
        },
        {
          id: "task_4",
          title: "Çalışma klasörlerini ve masaüstü dosyalarını yedekle",
          scope: "week",
          date: "",
          weekMonday: weekMon,
          goalId: goalShortHabitId,
          priority: "low",
          category: "Yaşam & Düzen",
          completed: false,
          note: "Gereksiz İndirilenler klasörü dosyalarını temizle.",
          subtasks: [],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: today
        },
        {
          id: "task_5",
          title: "Proje araştırma dokümanının taslağını oluştur",
          scope: "day",
          date: tomorrow,
          weekMonday: getWeekMondayISO(tomorrow),
          goalId: goalLongCareerId,
          priority: "high",
          category: "Kariyer & Eğitim",
          completed: false,
          note: "İlk aşamada kusursuz olmasına gerek yok, ana başlıkları çıkarmak yeterli.",
          subtasks: [],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: today
        },
        {
          id: "task_6",
          title: "Diş hekimi / sağlık kontrol randevusunu organize et",
          scope: "day",
          date: in2Days,
          weekMonday: getWeekMondayISO(in2Days),
          goalId: goalLongHealthId,
          priority: "normal",
          category: "Sağlık & Spor",
          completed: false,
          note: "",
          subtasks: [],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: today
        }
      ],
      routines: [
        {
          id: "routine_1",
          title: "Güne Başlarken 5 Dk Günlük Plan & Odak Kontrolü",
          freq: "daily", // 'daily' | 'weekdays' | 'weekends' | 'custom_days'
          customDays: [1, 2, 3, 4, 5, 6, 0],
          goalId: goalShortHabitId,
          status: "active", // 'active' | 'archived' | 'trashed'
          note: "Kahve/çay içerken Pusula'yı aç ve bugün sadece neye odaklanacağını seç.",
          completions: {
            [addDaysISO(today, -14)]: true,
            [addDaysISO(today, -13)]: true,
            [addDaysISO(today, -12)]: true,
            [addDaysISO(today, -11)]: true,
            [addDaysISO(today, -10)]: true,
            [addDaysISO(today, -7)]: true,
            [addDaysISO(today, -6)]: true,
            [addDaysISO(today, -5)]: true,
            [addDaysISO(today, -2)]: true,
            [addDaysISO(today, -1)]: true
          },
          bestStreak: 5
        },
        {
          id: "routine_2",
          title: "En Az 25 Dakika Odaklı Okuma / Çalışma (Sıfır Gün Yok)",
          freq: "daily",
          customDays: [1, 2, 3, 4, 5, 6, 0],
          goalId: goalShortIeltsId,
          status: "active",
          note: "Çok yoğun günlerde bile 10 dakika okuyarak zinciri kırma.",
          completions: {
            [addDaysISO(today, -12)]: true,
            [addDaysISO(today, -11)]: true,
            [addDaysISO(today, -10)]: true,
            [addDaysISO(today, -9)]: true,
            [addDaysISO(today, -8)]: true,
            [addDaysISO(today, -7)]: true,
            [addDaysISO(today, -3)]: true,
            [addDaysISO(today, -2)]: true,
            [addDaysISO(today, -1)]: true
          },
          bestStreak: 6
        },
        {
          id: "routine_3",
          title: "40 Dk Tempolu Yürüyüş veya Egzersiz",
          freq: "custom_days",
          customDays: [1, 3, 5, 0], // Pzt, Çar, Cum, Paz
          goalId: goalLongHealthId,
          status: "active",
          note: "Kulaklığı tak ve açık havada yürüyüşe çık.",
          completions: {
            [addDaysISO(today, -9)]: true,
            [addDaysISO(today, -7)]: true,
            [addDaysISO(today, -5)]: true,
            [addDaysISO(today, -2)]: true
          },
          bestStreak: 4
        }
      ],
      focusStats: {},
      // Ortak seri: başka biriyle aynı odada ders oturumu tamamlanan art arda günler
      roomStreak: { current: 0, best: 0, lastDay: null },
      dailyNotes: {
        [today]: "Yeni planlayıcı sistemimi kurdum. Amacım kendimi saat saat robot gibi sıkmak değil; neyi neden yaptığımı bilerek, ertelediğimde bile farkındalıkla yöneterek sürdürülebilir bir düzen yakalamak."
      },
      weeklyNotes: {
        [weekMon]: "Bu haftanın ana odağı: Günlük 2-3 temel görevi istikrarlı şekilde tamamlamak ve kısa vadeli okuma hedefimde ivme yakalamak."
      },
      reports: []
    };
  }

  // =========================================================
  // GERÇEK HAYATTAN DOĞRULANMIŞ 387 ADET GÜNÜN SÖZÜ KÜTÜPHANESİ (quotes.js)
  // =========================================================
  const AUTHENTIC_QUOTES =
    Array.isArray(window.PUSULA_AUTHENTIC_QUOTES) && window.PUSULA_AUTHENTIC_QUOTES.length > 0
      ? window.PUSULA_AUTHENTIC_QUOTES
      : [
          {
            text: "Zafer, 'Zafer benimdir' diyebilenindir. Başarı ise, 'Başaracağım' diye başlayarak sonunda 'Başardım' diyebilenindir.",
            author: "Mustafa Kemal Atatürk",
            source: "1925, Söylev ve Demeçler"
          }
        ];

  // =========================================================
  // UYGULAMA DURUMU (STATE)
  // =========================================================
  let state = createDefaultData();
  let uiState = {
    currentView: "daily", // 'daily' | 'weekly' | 'calendar' | 'timer' | 'goals' | 'routines' | 'insights'
    selectedDateISO: getTodayISO(),
    selectedWeekMondayISO: getWeekMondayISO(getTodayISO()),
    calendarMode: "month", // 'day' | 'month' | 'year'
    calendarYear: parseISODate(getTodayISO()).getFullYear(),
    calendarMonth: parseISODate(getTodayISO()).getMonth(),
    dailyFilter: "all", // 'all' | 'pending' | 'done'
    goalFilter: "all", // 'all' | 'short' | 'long' | 'completed'
    routineTab: "active", // 'active' | 'archived' | 'trashed'
    trashFilter: "all", // 'all' | 'routines' | 'tasks' | 'goals'
    noteFilter: "all", // 'all' | 'task' | 'journal' | 'postpone'
    compiledNoteFilter: "all", // 'all' | 'daily' | 'weekly' | 'task_goal' | 'reports' | 'quotes'
    noteSubFilter: "all", // 'all' | 'ai' | 'user'
    searchQuery: "",
    expandedTaskIds: new Set(),
    showOverdueList: false,
    modalSubtasksTemp: [],
    modalMilestonesTemp: [],
    quoteOffset: 0,
    focusOnlyPage: false,
    timer: {
      mode: "study", // 'study' | 'short_break' | 'long_break'
      running: false,
      totalSeconds: 25 * 60,
      remainingSeconds: 25 * 60,
      targetTimestamp: null,
      studyMins: 25,
      shortBreakMins: 5,
      longBreakMins: 15,
      soundEnabled: true,
      bellType: "zen",
      ambientMode: "off",
      volume: 0.6
    }
  };

  const TIMER_PERSIST_KEY = "pusula_timer_state_v1";
  const VIEW_PERSIST_KEY = "pusula_active_view_v1";

  function saveTimerState() {
    try {
      const t = uiState.timer;
      const data = {
        mode: t.mode,
        running: t.running,
        totalSeconds: t.totalSeconds,
        remainingSeconds: t.remainingSeconds,
        targetTimestamp: t.targetTimestamp,
        studyMins: t.studyMins,
        shortBreakMins: t.shortBreakMins,
        longBreakMins: t.longBreakMins,
        savedAt: Date.now()
      };
      localStorage.setItem(TIMER_PERSIST_KEY, JSON.stringify(data));
      localStorage.setItem(VIEW_PERSIST_KEY, uiState.currentView);
    } catch (_) {}
  }

  function restoreTimerState() {
    try {
      const savedView = localStorage.getItem(VIEW_PERSIST_KEY);
      if (savedView && typeof switchView === "function" && ["daily", "weekly", "calendar", "timer", "goals", "routines", "notes", "insights", "trash"].includes(savedView)) {
        if (uiState.currentView !== savedView) {
          switchView(savedView);
        }
      }
      const raw = localStorage.getItem(TIMER_PERSIST_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved) return;

      uiState.timer.mode = saved.mode || uiState.timer.mode;
      uiState.timer.totalSeconds = saved.totalSeconds || uiState.timer.totalSeconds;
      uiState.timer.studyMins = saved.studyMins || uiState.timer.studyMins;
      uiState.timer.shortBreakMins = saved.shortBreakMins || uiState.timer.shortBreakMins;
      uiState.timer.longBreakMins = saved.longBreakMins || uiState.timer.longBreakMins;

      if (saved.running && saved.targetTimestamp) {
        const remaining = Math.max(0, Math.round((saved.targetTimestamp - Date.now()) / 1000));
        if (remaining > 0) {
          uiState.timer.running = true;
          uiState.timer.targetTimestamp = saved.targetTimestamp;
          uiState.timer.remainingSeconds = remaining;
        } else {
          uiState.timer.running = false;
          uiState.timer.targetTimestamp = null;
          uiState.timer.remainingSeconds = 0;
        }
      } else {
        uiState.timer.running = false;
        uiState.timer.targetTimestamp = null;
        uiState.timer.remainingSeconds = typeof saved.remainingSeconds === "number" ? saved.remainingSeconds : uiState.timer.totalSeconds;
      }
      if (typeof updateTimerDOM === "function") {
        updateTimerDOM();
      }
    } catch (_) {}
  }

  // =========================================================
  // VERİ YÜKLEME VE KAYDETME (YEREL SUNUCU + LOCALSTORAGE)
  // =========================================================
  async function loadData() {
    let loaded = null;

    // 1. Önce yerel Python sunucusundan (/api/data) okumayı dene
    try {
      const resp = await fetch("/api/data", { cache: "no-store" });
      if (resp.ok) {
        const json = await resp.json();
        if (json && !json.empty && !json.error && typeof json === "object") {
          loaded = json;
          setSyncIndicator(true, "Veriler Diskte Güvende (planner_data.json)");
        }
      }
    } catch (_) {
      // Sunucu kapalıysa localStorage kullanılır
    }

    // 2. Sunucuda henüz kayıt yoksa localStorage kontrol et
    if (!loaded) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            loaded = parsed;
          }
        }
      } catch (e) {
        console.warn("LocalStorage okuma hatası:", e);
      }
    }

    if (loaded) {
      state = Object.assign(createDefaultData(), loaded);
      // Dizi ve nesnelerin bozulmadan doğru yüklenmesini sağla
      state.settings = Object.assign(createDefaultData().settings, loaded.settings || {});
      state.goals = Array.isArray(loaded.goals) ? loaded.goals : (state.goals || []);
      state.tasks = Array.isArray(loaded.tasks) ? loaded.tasks : (state.tasks || []);
      state.routines = Array.isArray(loaded.routines) ? loaded.routines : (state.routines || []);
      state.trashedTasks = Array.isArray(loaded.trashedTasks) ? loaded.trashedTasks : [];
      state.trashedGoals = Array.isArray(loaded.trashedGoals) ? loaded.trashedGoals : [];
      state.focusStats = loaded.focusStats || {};
      state.roomStreak = normalizeRoomStreak(loaded.roomStreak);
      state.dailyNotes = loaded.dailyNotes || {};
      state.weeklyNotes = loaded.weeklyNotes || {};
      state.savedQuotes = Array.isArray(loaded.savedQuotes) ? loaded.savedQuotes : [];
      state.reports = Array.isArray(loaded.reports) ? loaded.reports : [];
      // Rutinlerde status yoksa 'active' yap
      (state.routines || []).forEach((r) => {
        if (!r.status) r.status = "active";
      });
    } else {
      state = createDefaultData();
      state.trashedTasks = [];
      state.trashedGoals = [];
      state.savedQuotes = [];
      await saveData();
    }

    applyTheme(state.settings.theme || "dark");
    document.getElementById("toggleAutoRollover").checked = Boolean(state.settings.autoRollover);

    // Otomatik devretme açıksa geçmiş görevleri bugüne taşı
    if (state.settings.autoRollover) {
      performAutoRollover(true);
    }

    renderAll();
  }

  let saveTimeout = null;
  async function saveData(immediate = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("LocalStorage yazma hatası:", e);
    }

    const sendToServer = async () => {
      try {
        const payload = JSON.stringify(state);
        const resp = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload
        });
        if (resp.ok) {
          setSyncIndicator(true, "Veriler Diskte Güvende");
        } else {
          setSyncIndicator(true, "Tarayıcı Hafızasında Kayıtlı");
        }
      } catch (_) {
        setSyncIndicator(true, "Tarayıcı Hafızasında Kayıtlı");
      }
    };

    if (immediate) {
      clearTimeout(saveTimeout);
      await sendToServer();
    } else {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(sendToServer, 100);
    }
  }

  // Sayfa kapanırken veya yenilenirken verinin diske kaydedilmesini garanti et
  window.addEventListener("beforeunload", () => {
    try {
      saveTimerState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
        navigator.sendBeacon("/api/data", blob);
      }
    } catch (_) {}
  });

  function setSyncIndicator(ok, text) {
    const el = document.getElementById("syncStatusText");
    if (el) el.textContent = text;
  }

  function showToast(msg) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // =========================================================
  // OTOMATİK VE MANUEL DEVRETME (ROLLOVER)
  // =========================================================
  function getOverdueTasks() {
    const today = getTodayISO();
    return state.tasks.filter(
      (t) => !t.completed && t.scope === "day" && t.date && t.date < today
    );
  }

  function performAutoRollover(silent = false) {
    const today = getTodayISO();
    const overdue = getOverdueTasks();
    if (overdue.length === 0) return 0;

    overdue.forEach((task) => {
      const oldDate = task.date;
      task.date = today;
      task.weekMonday = getWeekMondayISO(today);
      task.priority = "postponed";
      task.postponeCount = (task.postponeCount || 0) + 1;
      task.postponeHistory = task.postponeHistory || [];
      task.postponeHistory.push({
        from: oldDate,
        to: today,
        reason: "Gün sonunda tamamlanmadığı için bugüne devredildi",
        at: today
      });
    });

    saveData();
    if (!silent) {
      showToast(`🔄 ${overdue.length} geçmiş görev bugüne devredildi.`);
    }
    return overdue.length;
  }

  // =========================================================
  // HEDEF İLERLEME VE VADE HESAPLAMALARI
  // =========================================================
  function getGoalById(goalId) {
    return state.goals.find((g) => g.id === goalId) || null;
  }

  function calculateGoalProgress(goal) {
    if (goal.completed) return 100;

    const milestones = goal.milestones || [];
    const linkedTasks = state.tasks.filter((t) => t.goalId === goal.id);
    const childGoals = state.goals.filter((g) => g.parentId === goal.id);

    const totalItems = milestones.length + linkedTasks.length + childGoals.length;
    if (totalItems === 0) return 0;

    const doneMilestones = milestones.filter((m) => m.done).length;
    const doneTasks = linkedTasks.filter((t) => t.completed).length;
    const childProgressSum = childGoals.reduce((acc, cg) => acc + calculateGoalProgress(cg) / 100, 0);

    return Math.round(((doneMilestones + doneTasks + childProgressSum) / totalItems) * 100);
  }

  function calculateGoalTimeStats(goal) {
    const today = getTodayISO();
    const start = goal.startDate || goal.createdAt || today;
    const target = goal.targetDate || addDaysISO(today, 30);

    const totalDays = Math.max(1, diffDays(start, target));
    const elapsedDays = Math.max(0, diffDays(start, today));
    const remainingDays = diffDays(today, target);
    const timeElapsedPct = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

    let remainingLabel = "";
    let statusClass = "";
    if (remainingDays > 30) {
      const months = Math.floor(remainingDays / 30);
      const remD = remainingDays % 30;
      remainingLabel = remD > 0 ? `${months} ay ${remD} gün kaldı` : `${months} ay kaldı`;
    } else if (remainingDays > 0) {
      remainingLabel = `${remainingDays} gün kaldı`;
      if (remainingDays <= 7) statusClass = "urgent";
    } else if (remainingDays === 0) {
      remainingLabel = "Bugün vade sonu!";
      statusClass = "urgent";
    } else {
      remainingLabel = `Vadesi ${Math.abs(remainingDays)} gün geçti`;
      statusClass = "overdue";
    }

    return {
      totalDays,
      elapsedDays,
      remainingDays,
      timeElapsedPct,
      remainingLabel,
      statusClass
    };
  }

  // =========================================================
  // TEKRARLAYAN RUTİNLERİN GÜN KONTROLÜ, SERİ VE SERİ GEÇMİŞİ
  // =========================================================
  function isRoutineScheduledForDate(routine, isoDate) {
    const dt = parseISODate(isoDate);
    const dayNum = dt.getDay(); // 0 Paz .. 6 Cmt
    if (routine.freq === "daily") return true;
    if (routine.freq === "weekdays") return dayNum >= 1 && dayNum <= 5;
    if (routine.freq === "weekends") return dayNum === 0 || dayNum === 6;
    if (routine.freq === "custom_days") {
      return Array.isArray(routine.customDays) && routine.customDays.includes(dayNum);
    }
    return true;
  }

  function calculateRoutineStreak(routine) {
    const completions = routine.completions || {};
    let streak = 0;
    let cursor = getTodayISO();

    // Bugün henüz yapılmadıysa dünden geriye doğru kontrol et
    if (!completions[cursor]) {
      cursor = addDaysISO(cursor, -1);
    }

    for (let i = 0; i < 365; i++) {
      if (isRoutineScheduledForDate(routine, cursor)) {
        if (completions[cursor]) {
          streak++;
        } else {
          break;
        }
      }
      cursor = addDaysISO(cursor, -1);
    }

    if (streak > (routine.bestStreak || 0)) {
      routine.bestStreak = streak;
    }
    return streak;
  }

  // Tüm geçmiş serileri (başlangıç, bitiş ve kaç gün sürdüğü) hesaplar
  function calculateRoutineStreakHistory(routine) {
    const completions = routine.completions || {};
    const doneDates = Object.keys(completions)
      .filter((d) => completions[d])
      .sort();

    if (doneDates.length === 0) return [];

    const earliest = doneDates[0];
    const today = getTodayISO();
    const lastDate = doneDates[doneDates.length - 1] > today ? doneDates[doneDates.length - 1] : today;

    const streaks = [];
    let currentRun = null;

    let cursor = earliest;
    while (cursor <= lastDate) {
      if (isRoutineScheduledForDate(routine, cursor)) {
        if (completions[cursor]) {
          if (!currentRun) {
            currentRun = { start: cursor, end: cursor, count: 1 };
          } else {
            currentRun.end = cursor;
            currentRun.count += 1;
          }
        } else {
          // Bugün henüz tamamlanmadıysa mevcut seriyi hemen kırma
          if (cursor !== today && currentRun) {
            streaks.push(currentRun);
            currentRun = null;
          }
        }
      }
      cursor = addDaysISO(cursor, 1);
    }
    if (currentRun) {
      currentRun.isActive = true;
      streaks.push(currentRun);
    }

    return streaks.reverse(); // En yeniden en eskiye
  }

  function getRoutineFreqLabel(routine) {
    if (routine.freq === "daily") return "Her Gün";
    if (routine.freq === "weekdays") return "Hafta İçi Her Gün (Pzt-Cum)";
    if (routine.freq === "weekends") return "Hafta Sonları (Cmt-Paz)";
    if (routine.freq === "custom_days") {
      const names = (routine.customDays || []).map((d) => TR_DAYS_SHORT[d]);
      return `Belirli Günler (${names.join(", ")})`;
    }
    return "Düzenli";
  }

  // =========================================================
  // ANA RENDER FONKSİYONU
  // =========================================================
  function renderAll() {
    populateGoalDropdowns();
    renderHeaderAndBadges();
    renderQuoteOfTheDay();
    renderDailyView();
    renderWeeklyView();
    renderCalendarView();
    renderTimerView();
    renderGoalsView();
    renderRoutinesView();
    renderNotesView();
    renderInsightsView();
    renderTrashView();
    renderModernExtras();
    decorateFigures();
  }

  // =========================================================
  // "MODERN" GÖRÜNÜM EKLERİ (yalnızca görünüm)
  // Modern stilde görünen ek öğeler: Günün Odağı'ndaki istatistik
  // kartları ve kenar çubuğundaki "Odaktaki Hedefler" listesi.
  // Hepsi uygulamanın zaten kaydettiği verilerden hesaplanır; .m-only
  // sınıfı sayesinde "Geleneksel" görünümde gizlidir (modern.css).
  // =========================================================
  const ICON_PATHS = {
    check: '<path d="M5 12.5l4.25 4.25L19 7"/>',
    timer: '<circle cx="12" cy="13.5" r="7.25"/><path d="M12 9.75v3.75l2.5 1.75M9.75 2.75h4.5"/>',
    hourglass: '<path d="M6.75 3.25h10.5M6.75 20.75h10.5M7.75 3.25v2.5c0 2.6 4.25 4.1 4.25 6.25s-4.25 3.65-4.25 6.25v2.5M16.25 3.25v2.5c0 2.6-4.25 4.1-4.25 6.25s4.25 3.65 4.25 6.25v2.5"/>',
    target: '<circle cx="12" cy="12" r="8.25"/><circle cx="12" cy="12" r="4.75"/><circle cx="12" cy="12" r="1.25"/>',
    flag: '<path d="M5.25 21V4.25M5.25 4.25h11.5l-2 4 2 4H5.25"/>',
    mountain: '<path d="M2.75 19.25 9.5 8l3.75 6 2.25-3.25 5.75 8.5H2.75z"/>',
    bolt: '<path d="M13 2.75 5.25 13.5H12l-1 7.75 7.75-10.75H12z"/>',
    arrowUpRight: '<path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15"/>',
    arrowUp: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
    arrowDown: '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
    minus: '<path d="M6 12h12"/>',
    note: '<path d="M14.75 4.25l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>',
    skip: '<path d="M5.5 6.25v11.5L13.5 12zM13.5 6.25v11.5L21.5 12z"/>',
    edit: '<path d="M4.75 19.25h4l10-10a2.83 2.83 0 0 0-4-4l-10 10z"/><path d="M13.25 6.75l4 4"/>',
    trash: '<path d="M4.25 6.75h15.5M9.5 6.75v-2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M6.5 6.75l.85 12.6a1.5 1.5 0 0 0 1.5 1.4h6.3a1.5 1.5 0 0 0 1.5-1.4l.85-12.6"/>',
    pin: '<path d="M9 3.75h6M10 3.75v5.5l-3.25 3.5h10.5L14 9.25v-5.5M12 12.75v7.5"/>',
    calendar: '<rect x="3.75" y="4.75" width="16.5" height="15.5" rx="2.5"/><path d="M3.75 9.5h16.5M8.25 2.75v3.5M15.75 2.75v3.5"/>',
    inbox: '<path d="M3.75 13.25h4.5l1.5 2.5h4.5l1.5-2.5h4.5"/><path d="M5.75 5.25h12.5l2 8v5.5a1 1 0 0 1-1 1H4.75a1 1 0 0 1-1-1v-5.5z"/>',
    list: '<rect x="4.25" y="4.25" width="15.5" height="15.5" rx="3"/><path d="M8.25 12l2.5 2.5 5-5"/>',
    flame: '<path d="M12 21c-3.6 0-6.25-2.55-6.25-6 0-3.25 2.5-5.25 3.75-8 .9 1.6 1.4 2.6 2.75 3.25C12.75 7.5 13.5 5 13 2.75c3.4 2.25 5.25 6.4 5.25 10.25 0 4.5-2.65 8-6.25 8z"/>',
    repeat: '<path d="M4.75 11.25V9.5a3 3 0 0 1 3-3h11.5M16 3.25l3.25 3.25L16 9.75M19.25 12.75v1.75a3 3 0 0 1-3 3H4.75M8 20.75L4.75 17.5 8 14.25"/>',
    play: '<path d="M7.25 4.75v14.5L19 12z"/>',
    pause: '<path d="M8.5 5v14M15.5 5v14"/>',
    chart: '<path d="M4.75 19.25h14.5M7.5 16v-5M12 16V7M16.5 16v-8"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.85.85-4.23 4.12 1 5.83L12 16.85 6.78 19.6l1-5.83L3.55 9.65l5.85-.85z"/>',
    trophy: '<path d="M7.75 4.25h8.5v5a4.25 4.25 0 0 1-8.5 0zM7.75 6.25H4.75v1.5a3 3 0 0 0 3 3M16.25 6.25h3v1.5a3 3 0 0 1-3 3M12 13.5v3.25M8.75 20h6.5M9.75 16.75h4.5"/>',
    undo: '<path d="M9 14.25 4.75 10 9 5.75"/><path d="M4.75 10h9.5a5 5 0 0 1 0 10H11"/>',
    link: '<path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>',
    archive: '<rect x="3.75" y="4.25" width="16.5" height="4.5" rx="1"/><path d="M5.25 8.75v10a1 1 0 0 0 1 1h11.5a1 1 0 0 0 1-1v-10M10 12.25h4"/>',
    restore: '<path d="M4.75 12a7.25 7.25 0 1 0 2.2-5.2M4.75 4.75v4h4"/>',
    quote: '<path d="M9.25 7.25H6a1.25 1.25 0 0 0-1.25 1.25v3.25A1.25 1.25 0 0 0 6 13h2.5v.5a3 3 0 0 1-3 3M19.25 7.25H16a1.25 1.25 0 0 0-1.25 1.25v3.25A1.25 1.25 0 0 0 16 13h2.5v.5a3 3 0 0 1-3 3"/>'
  };

  // Küçük çizgi ikon (currentColor). Boyut CSS ile (.ic) ayarlanabilir.
  function icon(name, size = 14) {
    const p = ICON_PATHS[name];
    if (!p) return "";
    return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
  }

  // Son günlerin değerlerinden ince, parlayan bir çizgi grafik (SVG)
  function buildSparkSvg(values, glowClass) {
    const w = 100;
    const h = 40;
    const max = Math.max(1, ...values);
    const n = values.length;
    const pts = values.map((v, i) => {
      const x = n > 1 ? (i / (n - 1)) * w : w;
      const y = h - 6 - (v / max) * (h - 14);
      return [x, y];
    });
    // Yumuşak eğri (kübik, yatay kontrol noktaları)
    let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` C${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    }
    const last = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <line class="m-spark-base" x1="0" y1="${h - 6}" x2="${w}" y2="${h - 6}" stroke="currentColor" />
      <g class="${glowClass}"><path class="m-spark-line" d="${d}" stroke="currentColor" /></g>
      <circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="0.01" stroke="currentColor" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke" class="${glowClass}" />
    </svg>`;
  }

  function modernDelta(diff, unitLabel, goodWhenUp, compareLabel) {
    if (diff === null) {
      return `<span class="m-delta flat"><i>${icon("minus", 10)}</i><small>${compareLabel}</small></span>`;
    }
    const cls = diff === 0 ? "flat" : (diff > 0) === goodWhenUp ? "up" : "down";
    const arrow = diff === 0 ? "minus" : diff > 0 ? "arrowUp" : "arrowDown";
    const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
    return `<span class="m-delta ${cls}"><i>${icon(arrow, 10)}</i>${sign}${Math.abs(diff)}${unitLabel} <small>${compareLabel}</small></span>`;
  }

  function renderModernExtras() {
    renderModernDailyStats();
    renderModernSideGoals();
  }

  function renderModernDailyStats() {
    const view = document.getElementById("view-daily");
    if (!view) return;
    let row = document.getElementById("modernDailyStats");
    if (!row) {
      row = document.createElement("div");
      row.id = "modernDailyStats";
      row.className = "m-stats-row m-only";
      row.setAttribute("aria-label", "Özet istatistikler");
      const quote = document.getElementById("quoteOfTheDayCard");
      if (quote && quote.nextSibling) view.insertBefore(row, quote.nextSibling);
      else view.prepend(row);
      row.addEventListener("click", (e) => {
        const b = e.target.closest("[data-m-open-view]");
        if (b) switchView(b.getAttribute("data-m-open-view"));
      });
    }

    const sel = uiState.selectedDateISO || getTodayISO();
    const today = getTodayISO();
    const dayTasks = (iso) => state.tasks.filter((t) => t.scope === "day" && t.date === iso);

    // 1) Seçili günün görevleri: tamamlanan / planlanan, son 7 gün tamamlanan
    const selTasks = dayTasks(sel);
    const selDone = selTasks.filter((t) => t.completed).length;
    const prevDone = dayTasks(addDaysISO(sel, -1)).filter((t) => t.completed).length;
    const doneSeries = [];
    for (let i = 6; i >= 0; i--) {
      doneSeries.push(dayTasks(addDaysISO(sel, -i)).filter((t) => t.completed).length);
    }

    // 2) Odak: son 7 gün toplam dakika (zamanlayıcı kayıtları), önceki 7 günle kıyas
    const stats = state.focusStats || {};
    const minsOn = (iso) => (stats[iso] && Number(stats[iso].minutes)) || 0;
    const focusSeries = [];
    let focus7 = 0;
    let focusPrev7 = 0;
    for (let i = 6; i >= 0; i--) {
      const m = minsOn(addDaysISO(today, -i));
      focusSeries.push(m);
      focus7 += m;
    }
    for (let i = 13; i >= 7; i--) focusPrev7 += minsOn(addDaysISO(today, -i));

    // 3) Erteleme: son 7 gündeki erteleme kayıtları (postponeHistory.at)
    const postponeCountOn = {};
    state.tasks.forEach((t) => {
      (t.postponeHistory || []).forEach((h) => {
        if (h && h.at) postponeCountOn[h.at] = (postponeCountOn[h.at] || 0) + 1;
      });
    });
    const postSeries = [];
    let post7 = 0;
    let postPrev7 = 0;
    for (let i = 6; i >= 0; i--) {
      const c = postponeCountOn[addDaysISO(today, -i)] || 0;
      postSeries.push(c);
      post7 += c;
    }
    for (let i = 13; i >= 7; i--) postPrev7 += postponeCountOn[addDaysISO(today, -i)] || 0;

    const selLabel = sel === today ? "Bugün" : formatShortTR(sel);
    const card = (o) => `
      <div class="m-stat">
        <div class="m-stat-top">
          <span class="m-tile m-tile-lg ${o.tint}">${icon(o.icon, 19)}</span>
          <div>
            <div class="m-label-cap">${o.cap}</div>
            <div class="m-label-main">${o.main}</div>
          </div>
          <button type="button" class="m-round-btn" data-m-open-view="${o.view}" title="${o.viewTitle}" aria-label="${o.viewTitle}">${icon("arrowUpRight", 14)}</button>
        </div>
        <div class="m-label-cap m-stat-k">${o.k}</div>
        <div class="m-big">${o.big}</div>
        ${o.delta}
        <div class="m-spark ${o.sparkColor}">${buildSparkSvg(o.series, o.glow)}${o.tip ? `<span class="m-spark-tip">${o.tip}</span>` : ""}</div>
      </div>`;

    row.innerHTML = [
      card({
        tint: "m-tint-accent", icon: "check", cap: "Günün Görevleri", main: "Tamamlanan",
        view: "weekly", viewTitle: "Haftalık Plana git",
        k: `${selLabel} · tamamlanan / planlanan`,
        big: `${selDone}<span class="d">/${selTasks.length}</span>`,
        delta: modernDelta(selDone - prevDone, "", true, "önceki güne göre"),
        series: doneSeries, glow: "m-glow-accent", sparkColor: "m-glow-accent",
        tip: ""
      }),
      card({
        tint: "m-tint-blue", icon: "timer", cap: "Zamanlayıcı", main: "Son 7 gün odak",
        view: "timer", viewTitle: "Zamanlayıcıya git",
        k: "Toplam odak süresi",
        big: `${focus7}<span class="u">dk</span>`,
        delta: focus7 === 0 && focusPrev7 === 0
          ? modernDelta(null, "", true, "henüz oturum kaydı yok")
          : modernDelta(focus7 - focusPrev7, " dk", true, "önceki 7 güne göre"),
        series: focusSeries, glow: "m-glow-accent", sparkColor: "m-glow-accent",
        tip: ""
      }),
      card({
        tint: "m-tint-coral", icon: "hourglass", cap: "Erteleme Analizi", main: "Ertelenen",
        view: "insights", viewTitle: "Erteleme Analizine git",
        k: "Son 7 günde yapılan erteleme",
        big: `${post7}<span class="u">kez</span>`,
        delta: post7 === 0 && postPrev7 === 0
          ? modernDelta(null, "", false, "erteleme yok")
          : modernDelta(post7 - postPrev7, "", false, "önceki 7 güne göre"),
        series: postSeries, glow: "m-glow-coral", sparkColor: "m-glow-coral",
        tip: ""
      })
    ].join("");
  }

  function renderModernSideGoals() {
    const nav = document.querySelector(".sidebar .nav-menu");
    if (!nav) return;
    let box = document.getElementById("modernSideGoals");
    if (!box) {
      box = document.createElement("div");
      box.id = "modernSideGoals";
      box.className = "m-side-goals m-only";
      nav.insertAdjacentElement("afterend", box);
      box.addEventListener("click", (e) => {
        if (e.target.closest("[data-m-goal]")) switchView("goals");
      });
    }
    const active = state.goals
      .filter((g) => !g.completed)
      .slice()
      .sort((a, b) => String(a.targetDate || "9999").localeCompare(String(b.targetDate || "9999")));
    if (active.length === 0) {
      box.innerHTML = "";
      box.style.display = "none";
      return;
    }
    box.style.display = "";
    const tints = ["m-tint-lilac", "m-tint-blue", "m-tint-green"];
    box.innerHTML = `
      <div class="m-side-goals-head">${icon("flag", 18)}<span>Odaktaki Hedefler</span><span class="m-pill-mini">${active.length}</span></div>
      ${active
        .slice(0, 3)
        .map((g, i) => `
        <button type="button" class="m-side-goal" data-m-goal="${g.id}" title="Hedef Pusulası'nda gör">
          <span class="m-tile ${tints[i % tints.length]}">${icon(g.horizon === "long" ? "mountain" : "bolt", 15)}</span>
          <span class="m-side-goal-text">
            <span class="m-side-goal-cap">${g.horizon === "long" ? "Uzun vadeli" : "Kısa vadeli"}${g.targetDate ? ` · ${formatShortTR(g.targetDate)}` : ""}</span>
            <span class="m-side-goal-title">${escapeHtml(g.title)}</span>
          </span>
        </button>`)
        .join("")}
    `;
  }

  // Yalnızca görünüm: "0/2", "%32", "45 dk" gibi değerlerde sayıyı öne çıkarır,
  // birim/payda kısmını (fig-unit) CSS ile küçük ve soluk gösterir. Metin aynı kalır.
  function decorateFigures(scope = document) {
    const FIGURE_SELECTOR =
      "#statTodayRatio, #statWeekRatio, #statGoalsAvg, #statTimerSessionsToday, #statTimerMinutesToday, #statRoomStreak, .summary-kpi-val";
    scope.querySelectorAll(FIGURE_SELECTOR).forEach((el) => {
      if (el.children.length) return; // zaten bölünmüş ya da özel içerik
      const text = el.textContent;
      if (!/\d/.test(text)) return;
      const frag = document.createDocumentFragment();
      const re = /(\/\s*\d[\d.,]*)|(\d[\d.,:]*)|([^\d/]+|\/)/g;
      let m;
      while ((m = re.exec(text))) {
        const span = document.createElement("span");
        span.className = m[2] ? "fig-num" : "fig-unit";
        span.textContent = m[0];
        frag.appendChild(span);
      }
      el.textContent = "";
      el.appendChild(frag);
    });
  }

  function populateGoalDropdowns() {
    const activeGoals = state.goals.filter((g) => !g.completed);
    const selects = [
      document.getElementById("selectInlineTaskGoal"),
      document.getElementById("taskModalGoal"),
      document.getElementById("routineModalGoal")
    ];

    selects.forEach((sel) => {
      if (!sel) return;
      const currentVal = sel.value;
      sel.innerHTML = `<option value="">🎯 Hedef Bağlantısı Yok</option>`;
      activeGoals.forEach((g) => {
        const prefix = g.horizon === "long" ? "🏔️ [Uzun Vade]" : "⚡ [Kısa Vade]";
        const opt = document.createElement("option");
        opt.value = g.id;
        opt.textContent = `${prefix} ${g.title}`;
        sel.appendChild(opt);
      });
      sel.value = currentVal;
    });

    // Üst hedef seçici (Sadece uzun vadeli hedefleri listeler)
    const parentSel = document.getElementById("goalModalParent");
    if (parentSel) {
      const cur = parentSel.value;
      parentSel.innerHTML = `<option value="">— Bağımsız Hedef —</option>`;
      state.goals
        .filter((g) => g.horizon === "long")
        .forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = `🏔️ ${g.title}`;
          parentSel.appendChild(opt);
        });
      parentSel.value = cur;
    }
  }

  function renderHeaderAndBadges() {
    const today = getTodayISO();
    const thisWeekMon = getWeekMondayISO(today);
    const weekDays = getWeekDaysISO(today);
    const monthPrefix = today.slice(0, 7);

    const todayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === today);
    const todayDone = todayTasks.filter((t) => t.completed).length;

    const weekTasks = state.tasks.filter(
      (t) =>
        (t.scope === "day" && weekDays.includes(t.date)) ||
        (t.scope === "week" && t.weekMonday === thisWeekMon)
    );
    const weekDone = weekTasks.filter((t) => t.completed).length;
    const weekPct = weekTasks.length ? Math.round((weekDone / weekTasks.length) * 100) : 0;

    const monthPendingCount = state.tasks.filter(
      (t) => !t.completed && t.date && t.date.startsWith(monthPrefix)
    ).length;

    const activeGoals = state.goals.filter((g) => !g.completed);
    const goalsAvg = activeGoals.length
      ? Math.round(
          activeGoals.reduce((acc, g) => acc + calculateGoalProgress(g), 0) / activeGoals.length
        )
      : 0;

    const postponedTasksCount = state.tasks.filter(
      (t) => !t.completed && (t.postponeCount || 0) > 0
    ).length;

    const activeRoutines = state.routines.filter((r) => !r.status || r.status === "active");
    const nonActiveRoutines = state.routines.filter(
      (r) => r.status === "trashed" || r.status === "archived"
    );
    const totalTrashAndArchiveCount =
      nonActiveRoutines.length +
      (state.trashedTasks ? state.trashedTasks.length : 0) +
      (state.trashedGoals ? state.trashedGoals.length : 0);

    const dailyNotesCount = Object.values(state.dailyNotes || {}).filter((v) => v && v.trim()).length;
    const weeklyNotesCount = Object.values(state.weeklyNotes || {}).filter((v) => v && v.trim()).length;
    const taskGoalNotesCount =
      state.tasks.filter((t) => t.note && t.note.trim()).length +
      state.goals.filter((g) => g.why && g.why.trim()).length;
    const savedQuotesCount = (state.savedQuotes || []).length;
    const reportsCount = (state.reports || []).length;
    const totalCompiledNotesCount =
      dailyNotesCount + weeklyNotesCount + taskGoalNotesCount + reportsCount + savedQuotesCount;

    document.getElementById("statTodayRatio").textContent = `${todayDone}/${todayTasks.length}`;
    document.getElementById("statWeekRatio").textContent = `%${weekPct}`;
    document.getElementById("statGoalsAvg").textContent = `%${goalsAvg}`;

    document.getElementById("badgeTodayCount").textContent = todayTasks.filter((t) => !t.completed).length;
    document.getElementById("badgeWeekCount").textContent = weekTasks.filter((t) => !t.completed).length;
    const calBadge = document.getElementById("badgeCalendarMonthCount");
    if (calBadge) calBadge.textContent = monthPendingCount;
    document.getElementById("badgeGoalsCount").textContent = activeGoals.length;
    document.getElementById("badgeRoutinesCount").textContent = activeRoutines.length;
    document.getElementById("badgePostponedCount").textContent = postponedTasksCount;

    const notesNavBadge = document.getElementById("badgeNotesNavCount");
    if (notesNavBadge) notesNavBadge.textContent = totalCompiledNotesCount;
    const trashNavBadge = document.getElementById("badgeTrashNavCount");
    if (trashNavBadge) trashNavBadge.textContent = totalTrashAndArchiveCount;
    const footerTrashBadge = document.getElementById("badgeFooterTrashCount");
    if (footerTrashBadge) footerTrashBadge.textContent = totalTrashAndArchiveCount;
  }

  // =========================================================
  // GÜNÜN SÖZÜ (YILIN HER GÜNÜNE ÖZEL TEK GERÇEK ALINTI — DEĞİŞTİRME YOK)
  // =========================================================
  function getDayOfYearNumber(isoDate) {
    const dt = parseISODate(isoDate);
    const startOfYear = new Date(dt.getFullYear(), 0, 0);
    const diff = dt - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.max(1, Math.floor(diff / oneDay));
  }

  function getCurrentQuote() {
    const today = getTodayISO();
    const dayOfYear = getDayOfYearNumber(today);
    const yearNum = parseISODate(today).getFullYear();
    // Her takvim gününe (1..366) benzersiz bir alıntı düşer, gün içinde değiştirilemez
    const idx = (dayOfYear - 1 + (yearNum % 7) * 53) % AUTHENTIC_QUOTES.length;
    return AUTHENTIC_QUOTES[idx];
  }

  function renderQuoteOfTheDay() {
    const today = getTodayISO();
    const dayOfYear = getDayOfYearNumber(today);
    const q = getCurrentQuote();
    const textEl = document.getElementById("quoteTextDisplay");
    const authorEl = document.getElementById("quoteAuthorDisplay");
    const sourceEl = document.getElementById("quoteSourceDisplay");
    const dateEl = document.getElementById("quoteDateLabel");
    const badgeEl = document.getElementById("quoteDayOfYearBadge");

    if (badgeEl) {
      badgeEl.textContent = `GÜNÜN SÖZÜ • YILIN ${dayOfYear}. GÜNÜ (${AUTHENTIC_QUOTES.length} GERÇEK ALINTI ARŞİVİ)`;
    }
    if (textEl) textEl.textContent = `"${q.text}"`;
    if (authorEl) authorEl.textContent = `— ${q.author}`;
    if (sourceEl) sourceEl.textContent = `(${q.source})`;
    if (dateEl) dateEl.textContent = `${formatFullTR(today)} • Her gün yalnızca o güne ait tek bir söz açılır`;

    // Kaydedilen Sözlerim Koleksiyonu Çekmecesi
    const savedList = state.savedQuotes || [];
    const countBadge = document.getElementById("savedQuotesCountBadge");
    if (countBadge) countBadge.textContent = savedList.length;

    const listEl = document.getElementById("savedQuotesList");
    if (listEl) {
      if (savedList.length === 0) {
        listEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:6px 0;">Henüz kaydettiğin bir söz yok. Yukarıdaki "Nota & Koleksiyona Kaydet" butonuna bastığında burada listelenir.</div>`;
      } else {
        listEl.innerHTML = savedList
          .map(
            (sq) => `
            <div class="saved-quote-item">
              <div>
                <div style="font-size:13px;font-weight:600;font-style:italic;color:var(--text-primary);margin-bottom:3px;">
                  "${escapeHtml(sq.text)}"
                </div>
                <div style="font-size:11.5px;color:var(--text-secondary);">
                  <strong>— ${escapeHtml(sq.author)}</strong> (${escapeHtml(sq.source || "")}) • <span style="color:var(--text-muted);">📅 ${formatShortTR(sq.savedAt || getTodayISO())}</span>
                </div>
              </div>
              <button class="action-btn danger" data-action="delete-saved-quote" data-id="${sq.id}" title="Koleksiyondan Kaldır">✕</button>
            </div>
          `
          )
          .join("");
      }
    }
  }

  // =========================================================
  // GÖREV KARTI HTML OLUŞTURUCU (TÜM GÖRÜNÜMLERDE ORTAK)
  // =========================================================
  function createTaskCardElement(task, options = {}) {
    const card = document.createElement("div");
    card.className = `task-card ${task.completed ? "completed" : ""} ${task.priority === "postponed" || (task.postponeCount || 0) > 0 ? "is-postponed" : ""}`;

    const goal = task.goalId ? getGoalById(task.goalId) : null;
    const isExpanded = uiState.expandedTaskIds.has(task.id);
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s) => s.done).length;

    let priorityBadge = "";
    if (task.priority === "high") {
      priorityBadge = `<span class="badge badge-priority-high"><span class="badge-dot" aria-hidden="true"></span>Öncelikli</span>`;
    } else if (task.priority === "postponed") {
      priorityBadge = `<span class="badge badge-priority-postponed"><span class="badge-dot" aria-hidden="true"></span>Ertelenmiş</span>`;
    } else if (task.priority === "low") {
      priorityBadge = `<span class="badge badge-priority-low"><span class="badge-dot" aria-hidden="true"></span>Esnek</span>`;
    }

    const goalBadge = goal
      ? `<span class="badge badge-goal" data-jump-goal="${goal.id}" title="Hedefe git">${icon("target", 13)}${escapeHtml(goal.title)}</span>`
      : "";

    const categoryBadge = task.category
      ? `<span class="badge badge-category">${escapeHtml(task.category)}</span>`
      : "";

    const scopeBadge =
      task.scope === "week"
        ? `<span class="badge badge-weekpool">${icon("inbox", 13)}Haftalık Esnek</span>`
        : options.showDate && task.date
        ? `<span class="badge badge-category">${icon("calendar", 13)}${formatShortTR(task.date)}</span>`
        : "";

    const postponeBadge =
      (task.postponeCount || 0) > 0
        ? `<span class="badge badge-postponed" title="Bu görev ${task.postponeCount} kez ertelendi">${icon("hourglass", 13)}${task.postponeCount}x ertelendi</span>`
        : "";

    const subtasksBadge =
      subtasks.length > 0
        ? `<span class="badge badge-category">${icon("list", 13)}${doneSubtasks}/${subtasks.length} adım</span>`
        : "";

    const focusBadge =
      (task.focusedMinutes || 0) > 0
        ? `<span class="badge badge-streak">${icon("timer", 13)}${task.focusedMinutes} dk odaklanıldı</span>`
        : "";

    const assignToDayBtn =
      task.scope === "week" && options.allowAssignToSelectedDay
        ? `<button class="action-btn" data-action="assign-day" data-id="${task.id}" title="Seçili güne (${formatShortTR(uiState.selectedDateISO)}) ata">${icon("pin", 13)} Güne Al</button>`
        : "";

    card.innerHTML = `
      <div class="task-main-row">
        <button class="task-checkbox ${task.completed ? "checked" : ""}" data-action="toggle-task" data-id="${task.id}" title="Tamamlandı olarak işaretle">
          ${task.completed ? "✓" : ""}
        </button>

        <div class="task-body">
          <div class="task-title-line">
            <span class="task-title-text">${escapeHtml(task.title)}</span>
          </div>

          <div class="task-badges">
            ${priorityBadge}
            ${goalBadge}
            ${scopeBadge}
            ${categoryBadge}
            ${postponeBadge}
            ${subtasksBadge}
            ${focusBadge}
          </div>

          ${
            task.note && !isExpanded
              ? `<div class="task-note-preview" data-action="toggle-expand" data-id="${task.id}" title="Notu düzenlemek için tıkla">${escapeHtml(task.note)}</div>`
              : ""
          }
        </div>

        <div class="task-actions">
          ${assignToDayBtn}
          <button class="action-btn" data-action="toggle-expand" data-id="${task.id}" title="Altına Not Yaz / Alt Adımlar">
            ${icon("note", 13)} ${isExpanded ? "Kapat" : "Not"}
          </button>
          ${
            !task.completed && task.scope !== "week"
              ? `<button class="action-btn postpone-btn" data-action="postpone-task" data-id="${task.id}" title="Görevi Ertele">${icon("skip", 13)} Ertele</button>`
              : ""
          }
          <button class="action-btn" data-action="edit-task" data-id="${task.id}" title="Düzenle" aria-label="Düzenle">${icon("edit", 14)}</button>
          <button class="action-btn" data-action="delete-task" data-id="${task.id}" title="Sil" aria-label="Sil">${icon("trash", 14)}</button>
        </div>
      </div>

      ${
        isExpanded
          ? `
        <div class="task-drawer">
          <div class="task-inline-note-box">
            <label>Görev Altı Notu (Otomatik kaydedilir)</label>
            <textarea data-inline-note-id="${task.id}" placeholder="Bu görevle ilgili ilerleme notun, düşüncelerin veya bağlantılar...">${escapeHtml(task.note || "")}</textarea>
          </div>

          <div class="subtasks-inline">
            <label style="font-size:11.5px;font-weight:600;color:var(--text-secondary);">Alt Adımlar</label>
            ${subtasks
              .map(
                (st, idx) => `
              <label class="subtask-row ${st.done ? "done" : ""}">
                <input type="checkbox" data-action="toggle-subtask" data-task-id="${task.id}" data-idx="${idx}" ${st.done ? "checked" : ""} />
                <span>${escapeHtml(st.text)}</span>
              </label>
            `
              )
              .join("")}
            <div class="subtask-add-row" style="margin-top:4px;">
              <input type="text" placeholder="Yeni alt adım ekle..." data-subtask-input="${task.id}" style="padding:5px 8px;font-size:12px;background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--text-primary);border-radius:6px;" />
              <button type="button" class="btn btn-secondary btn-xs" data-action="add-inline-subtask" data-id="${task.id}">＋ Adım Ekle</button>
            </div>
          </div>

          ${
            task.postponeHistory && task.postponeHistory.length > 0
              ? `
            <div class="postpone-history-box">
              <strong>Erteleme Geçmişi (${task.postponeHistory.length} kez)</strong>
              ${task.postponeHistory
                .map(
                  (h) => `
                <div class="postpone-log-item">
                  • ${formatShortTR(h.from) || "Haftalık"} → ${formatShortTR(h.to) || "Haftalık"}:
                  <em>"${escapeHtml(h.reason || "Sebep belirtilmedi")}"</em>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      `
          : ""
      }
    `;

    return card;
  }

  // =========================================================
  // 1. GÖRÜNÜM: GÜNÜN ODAĞI (DAILY VIEW) RENDER
  // =========================================================
  function renderDailyView() {
    const selDate = uiState.selectedDateISO;
    const today = getTodayISO();
    const selWeekMon = getWeekMondayISO(selDate);

    // Başlık & Rozet
    document.getElementById("selectedDayBadge").textContent = getRelativeDayLabel(selDate);
    document.getElementById("selectedDayTitle").textContent = formatFullTR(selDate);
    document.getElementById("dailyNoteDateLabel").textContent = `${formatShortTR(selDate)} tarihine ait serbest notların`;

    // Haftalık Şerit (7 Gün)
    const stripEl = document.getElementById("dailyWeekStrip");
    stripEl.innerHTML = "";
    const weekDays = getWeekDaysISO(selDate);
    weekDays.forEach((dISO) => {
      const dt = parseISODate(dISO);
      const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === dISO);
      const doneCount = dayTasks.filter((t) => t.completed).length;

      const btn = document.createElement("div");
      btn.className = `week-strip-day ${dISO === selDate ? "selected" : ""} ${dISO === today ? "is-today" : ""}`;
      btn.innerHTML = `
        <span class="strip-day-name">${TR_DAYS_SHORT[dt.getDay()]}</span>
        <span class="strip-day-num">${dt.getDate()}</span>
        <span class="strip-day-dots">${dayTasks.length > 0 ? `${doneCount}/${dayTasks.length} görev` : "Boş"}</span>
      `;
      btn.addEventListener("click", () => {
        uiState.selectedDateISO = dISO;
        renderAll();
      });
      stripEl.appendChild(btn);
    });

    // Geçmişten Devreden (Overdue) Görevler
    const overdueTasks = getOverdueTasks();
    const overdueBanner = document.getElementById("overdueBanner");
    const overdueListEl = document.getElementById("overdueListContainer");
    if (overdueTasks.length > 0) {
      overdueBanner.classList.remove("hidden");
      document.getElementById("overdueTitle").textContent = `Geçmiş günlerden kalan ${overdueTasks.length} tamamlanmamış görev var`;
      if (uiState.showOverdueList) {
        overdueListEl.classList.remove("hidden");
        overdueListEl.innerHTML = `<div class="task-list"></div>`;
        const listInner = overdueListEl.querySelector(".task-list");
        overdueTasks.forEach((t) => {
          listInner.appendChild(createTaskCardElement(t, { showDate: true }));
        });
      } else {
        overdueListEl.classList.add("hidden");
      }
    } else {
      overdueBanner.classList.add("hidden");
      overdueListEl.classList.add("hidden");
    }

    // Günün Tekrarlayan Rutinleri (Sadece Aktif Olanlar)
    const routinesListEl = document.getElementById("dailyRoutinesList");
    routinesListEl.innerHTML = "";
    const dueRoutines = state.routines.filter(
      (r) => (!r.status || r.status === "active") && isRoutineScheduledForDate(r, selDate)
    );
    if (dueRoutines.length === 0) {
      routinesListEl.innerHTML = `<div class="empty-state">Bu gün için tanımlı tekrarlayan rutin yok.</div>`;
    } else {
      dueRoutines.forEach((r) => {
        const isDone = Boolean(r.completions && r.completions[selDate]);
        const streak = calculateRoutineStreak(r);
        const goal = r.goalId ? getGoalById(r.goalId) : null;

        const rCard = document.createElement("div");
        rCard.className = `task-card ${isDone ? "completed" : ""}`;
        rCard.innerHTML = `
          <div class="task-main-row">
            <button class="task-checkbox ${isDone ? "checked" : ""}" data-action="toggle-routine-day" data-id="${r.id}" data-date="${selDate}">
              ${isDone ? "✓" : ""}
            </button>
            <div class="task-body">
              <div class="task-title-line">
                <span class="task-title-text">${escapeHtml(r.title)}</span>
              </div>
              <div class="task-badges">
                <span class="badge badge-streak">${icon("flame", 13)}${streak} gün seri</span>
                <span class="badge badge-category">${icon("repeat", 13)}${getRoutineFreqLabel(r)}</span>
                ${goal ? `<span class="badge badge-goal" data-jump-goal="${goal.id}">${icon("target", 13)}${escapeHtml(goal.title)}</span>` : ""}
              </div>
              ${r.note ? `<div class="task-note-preview">${escapeHtml(r.note)}</div>` : ""}
            </div>
          </div>
        `;
        routinesListEl.appendChild(rCard);
      });
    }

    // Seçili Günün Görevleri
    const dailyTasksListEl = document.getElementById("dailyTasksList");
    const postponedSectionEl = document.getElementById("dailyPostponedSection");
    const postponedTasksListEl = document.getElementById("dailyPostponedTasksList");
    const postponedCountBadge = document.getElementById("dailyPostponedCount");

    dailyTasksListEl.innerHTML = "";
    if (postponedTasksListEl) postponedTasksListEl.innerHTML = "";

    let dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === selDate);
    if (uiState.searchQuery) {
      const q = uiState.searchQuery.toLowerCase();
      dayTasks = dayTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Öncelik hiyerarşisi: Yüksek / Önemli > Normal > Esnek / Düşük
    const prioWeight = { high: 3, normal: 2, low: 1 };

    // Ertelenmiş görevleri ayır (Önceliği ertelenmiş olanlar veya erteleme geçmişi olanlar)
    const isPostponedTask = (t) => t.priority === "postponed" || (t.postponeCount || 0) > 0;

    let activeDayTasks = dayTasks.filter((t) => !isPostponedTask(t));
    let postponedDayTasks = dayTasks.filter(isPostponedTask);

    if (uiState.dailyFilter === "pending") {
      activeDayTasks = activeDayTasks.filter((t) => !t.completed);
      postponedDayTasks = postponedDayTasks.filter((t) => !t.completed);
    } else if (uiState.dailyFilter === "postponed") {
      activeDayTasks = []; // Sadece ertelenenler gösterilecek
      postponedDayTasks = postponedDayTasks;
    } else if (uiState.dailyFilter === "done") {
      activeDayTasks = activeDayTasks.filter((t) => t.completed);
      postponedDayTasks = postponedDayTasks.filter((t) => t.completed);
    }

    // Ana görevleri öncelik sırasına göre sırala: Önce tamamlanmayanlar, sonra High > Normal > Low
    activeDayTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (prioWeight[b.priority] || 2) - (prioWeight[a.priority] || 2);
    });

    // Ertelenmiş görevleri de kendi içinde sırala
    postponedDayTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (prioWeight[b.priority] || 2) - (prioWeight[a.priority] || 2);
    });

    if (activeDayTasks.length === 0 && (postponedDayTasks.length === 0 || uiState.dailyFilter !== "postponed")) {
      if (postponedDayTasks.length === 0) {
        dailyTasksListEl.innerHTML = `
          <div class="empty-state">
            Bu gün için görev bulunmuyor. Yukarıdaki çubuktan hemen ekleyebilir veya sağdaki haftalık havuzdan bir görevi bugüne alabilirsin.
          </div>
        `;
      }
    } else {
      activeDayTasks.forEach((t) => {
        dailyTasksListEl.appendChild(createTaskCardElement(t));
      });
    }

    // Ertelenmiş Görevler Bölümü (En altta ayrı, şık bir blok olarak görünür)
    if (postponedSectionEl && postponedTasksListEl) {
      if (postponedDayTasks.length > 0) {
        postponedSectionEl.classList.remove("hidden");
        if (postponedCountBadge) postponedCountBadge.textContent = postponedDayTasks.length;
        postponedDayTasks.forEach((t) => {
          postponedTasksListEl.appendChild(createTaskCardElement(t));
        });
      } else {
        postponedSectionEl.classList.add("hidden");
      }
    }

    // Sağ Sütun: Bu Haftanın Esnek Görevleri
    const weeklyPoolEl = document.getElementById("dailyWeeklyPoolList");
    weeklyPoolEl.innerHTML = "";
    const poolTasks = state.tasks.filter(
      (t) => t.scope === "week" && t.weekMonday === selWeekMon
    );
    if (poolTasks.length === 0) {
      weeklyPoolEl.innerHTML = `<div class="empty-state">Bu haftanın esnek görev havuzu boş.</div>`;
    } else {
      poolTasks.forEach((t) => {
        weeklyPoolEl.appendChild(
          createTaskCardElement(t, { allowAssignToSelectedDay: true })
        );
      });
    }

    // Sağ Sütun: Günlük Yansıma Notu
    const noteArea = document.getElementById("textareaDailyNote");
    if (document.activeElement !== noteArea) {
      noteArea.value = (state.dailyNotes && state.dailyNotes[selDate]) || "";
    }

    // Sağ Sütun: Odaktaki Hedefler Özeti
    const goalsPreviewEl = document.getElementById("dailyGoalsPreview");
    goalsPreviewEl.innerHTML = "";
    const activeGoals = state.goals.filter((g) => !g.completed).slice(0, 4);
    if (activeGoals.length === 0) {
      goalsPreviewEl.innerHTML = `<div class="empty-state">Henüz aktif hedef yok.</div>`;
    } else {
      activeGoals.forEach((g) => {
        const prog = calculateGoalProgress(g);
        const timeStats = calculateGoalTimeStats(g);
        const item = document.createElement("div");
        item.style.cssText =
          "padding:10px 12px;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:8px;margin-bottom:8px;cursor:pointer;";
        item.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px;">
            <strong style="font-size:12.5px;">${icon(g.horizon === "long" ? "mountain" : "bolt", 13)} ${escapeHtml(g.title)}</strong>
            <span style="font-size:11.5px;font-weight:700;color:var(--accent-primary);">%${prog}</span>
          </div>
          <div class="progress-track" style="height:6px;margin-bottom:5px;">
            <div class="progress-fill" style="width:${prog}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
            <span>${g.horizon === "long" ? "Uzun Vadeli" : "Kısa Vadeli"}</span>
            <span class="${timeStats.statusClass}">${timeStats.remainingLabel}</span>
          </div>
        `;
        item.addEventListener("click", () => switchView("goals"));
        goalsPreviewEl.appendChild(item);
      });
    }
  }

  // =========================================================
  // 2. GÖRÜNÜM: HAFTALIK PLAN (WEEKLY VIEW) RENDER
  // =========================================================
  function renderWeeklyView() {
    const weekMon = uiState.selectedWeekMondayISO;
    const today = getTodayISO();
    const weekDays = getWeekDaysISO(weekMon);

    document.getElementById("weekNumberBadge").textContent = `${getISOWeekNumber(weekMon)}. HAFTA`;
    document.getElementById("weekRangeTitle").textContent = formatWeekRangeTR(weekMon);

    // Haftalık Not
    const weekNoteArea = document.getElementById("textareaWeeklyNote");
    if (document.activeElement !== weekNoteArea) {
      weekNoteArea.value = (state.weeklyNotes && state.weeklyNotes[weekMon]) || "";
    }

    // Haftalık Esnek Görev Havuzu
    const poolContainer = document.getElementById("weeklyPoolContainer");
    poolContainer.innerHTML = "";
    const poolTasks = state.tasks.filter(
      (t) => t.scope === "week" && t.weekMonday === weekMon
    );
    if (poolTasks.length === 0) {
      poolContainer.innerHTML = `<div class="empty-state">Bu hafta için gün bağımsız esnek görev eklenmemiş.</div>`;
    } else {
      poolTasks.forEach((t) => {
        poolContainer.appendChild(createTaskCardElement(t, { allowAssignToSelectedDay: true }));
      });
    }

    // Haftanın 7 Günü Kartları
    const gridEl = document.getElementById("weeklyDaysGrid");
    gridEl.innerHTML = "";

    weekDays.forEach((dISO) => {
      const dt = parseISODate(dISO);
      const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === dISO);
      const doneCount = dayTasks.filter((t) => t.completed).length;

      const col = document.createElement("div");
      col.className = `day-column-card ${dISO === today ? "is-today" : ""}`;

      col.innerHTML = `
        <div class="day-col-header">
          <div>
            <div class="day-col-title">
              ${TR_DAYS_FULL[dt.getDay()]}
              ${dISO === today ? `<span class="selected-day-badge" style="margin-left:6px;">BUGÜN</span>` : ""}
            </div>
            <div class="day-col-date">${dt.getDate()} ${TR_MONTHS[dt.getMonth()]}</div>
          </div>
          <span class="nav-badge">${doneCount}/${dayTasks.length}</span>
        </div>

        <form class="day-col-quick-add" data-day-quick-add="${dISO}">
          <input type="text" placeholder="+ Bu güne görev ekle..." required />
          <button type="submit" class="btn btn-secondary btn-xs">Ekle</button>
        </form>

        <div class="task-list day-col-tasks"></div>
      `;

      const listContainer = col.querySelector(".day-col-tasks");
      if (dayTasks.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding:14px;">Görev yok</div>`;
      } else {
        dayTasks.forEach((t) => {
          listContainer.appendChild(createTaskCardElement(t));
        });
      }

      const quickForm = col.querySelector("form");
      quickForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = quickForm.querySelector("input");
        const title = input.value.trim();
        if (!title) return;
        state.tasks.push({
          id: uid("task"),
          title,
          scope: "day",
          date: dISO,
          weekMonday: getWeekMondayISO(dISO),
          goalId: "",
          priority: "normal",
          category: "Genel",
          completed: false,
          note: "",
          subtasks: [],
          postponeCount: 0,
          postponeHistory: [],
          createdAt: getTodayISO()
        });
        input.value = "";
        saveData();
        renderAll();
        showToast(`✅ Görev ${formatShortTR(dISO)} gününe eklendi.`);
      });

      gridEl.appendChild(col);
    });

    renderWeeklySummary(weekMon);
  }

  // ---------- Haftalık Özet ----------
  // Yalnızca uygulamanın zaten kaydettiği verilerden üretilir; güvenilir
  // türetilemeyen sayılar gösterilmez.
  function computeWeeklySummary(weekMon) {
    const today = getTodayISO();
    const days = getWeekDaysISO(weekMon);
    const weekEnd = days[6];
    const inWeek = (iso) => typeof iso === "string" && iso >= weekMon && iso <= weekEnd;
    const stats = state.focusStats || {};

    // 1) Odak süresi
    let minutes = 0;
    let sessions = 0;
    let untrackedGoalMinutes = 0; // hedef dağılımı kaydı başlamadan önceki günler
    const byGoal = {};
    days.forEach((d) => {
      const st = stats[d];
      if (!st || typeof st !== "object") return;
      const m = Number(st.minutes) || 0;
      minutes += m;
      sessions += Number(st.sessions) || 0;
      if (st.byGoal && typeof st.byGoal === "object") {
        Object.keys(st.byGoal).forEach((gid) => {
          const v = Number(st.byGoal[gid]) || 0;
          if (v > 0) byGoal[gid] = (byGoal[gid] || 0) + v;
        });
      } else if (m > 0) {
        untrackedGoalMinutes += m;
      }
    });
    const goalNames = {};
    (state.goals || []).forEach((g) => { goalNames[g.id] = g.title; });
    const topGoals = Object.keys(byGoal)
      .map((gid) => ({ title: goalNames[gid] || "Silinmiş hedef", minutes: byGoal[gid] }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    // 2) Görevler: bu haftanın günlerine atanmış + haftalık havuz
    const weekTasks = (state.tasks || []).filter(
      (t) => (t.scope === "day" && inWeek(t.date)) || (t.scope === "week" && t.weekMonday === weekMon)
    );
    const tasksDone = weekTasks.filter((t) => t.completed).length;

    // 3) Rutin uyumu: aktif rutinlerin, haftanın bugüne kadarki planlı günleri.
    // Başlangıç tarihi bilinmeyen rutinde ilk tamamlama günü alt sınır kabul edilir.
    let routineDue = 0;
    let routineDone = 0;
    (state.routines || []).forEach((r) => {
      if (r.status && r.status !== "active") return;
      const comp = r.completions || {};
      let start = r.createdAt || Object.keys(comp).filter((k) => comp[k]).sort()[0];
      if (!start) return;
      days.forEach((d) => {
        if (d > today || d < start) return;
        if (!isRoutineScheduledForDate(r, d)) return;
        routineDue++;
        if (comp[d]) routineDone++;
      });
    });

    // 4) Bu hafta en çok ertelenenler (erteleme kaydının tarihine göre)
    const postponed = [];
    (state.tasks || []).forEach((t) => {
      const n = (t.postponeHistory || []).filter((h) => h && inWeek(h.at)).length;
      if (n > 0) postponed.push({ title: t.title, count: n });
    });
    postponed.sort((a, b) => b.count - a.count);

    return {
      minutes, sessions, untrackedGoalMinutes, topGoals,
      tasksPlanned: weekTasks.length, tasksDone,
      routineDue, routineDone,
      postponedTop: postponed.slice(0, 3),
      postponedTotal: postponed.reduce((a, p) => a + p.count, 0),
      isFuture: weekMon > today
    };
  }

  function formatMinutesTR(m) {
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} sa ${r} dk` : `${h} sa`;
  }

  function renderWeeklySummary(weekMon) {
    const body = document.getElementById("weeklySummaryBody");
    if (!body) return;
    const sub = document.getElementById("weeklySummarySubtitle");
    const isThisWeek = weekMon === getWeekMondayISO(getTodayISO());
    if (sub) {
      sub.textContent = isThisWeek
        ? "Bu haftanın şu ana kadarki odak, görev, rutin ve erteleme kayıtlarından"
        : `${formatWeekRangeTR(weekMon)} haftasının kayıtlarından`;
    }
    const s = computeWeeklySummary(weekMon);
    const hasAny = s.minutes > 0 || s.tasksPlanned > 0 || s.routineDue > 0 || s.postponedTotal > 0;
    if (!hasAny) {
      body.innerHTML = `<div class="empty-state">${s.isFuture
        ? "Bu hafta henüz başlamadı. Hafta ilerledikçe özet burada birikecek."
        : "Bu hafta için kayıtlı odak oturumu, görev veya rutin verisi yok."}</div>`;
      return;
    }

    const kpi = (label, val, hint = "") => `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${label}</div>
        <div class="summary-kpi-val">${val}</div>
        ${hint ? `<div class="weekly-summary-hint">${hint}</div>` : ""}
      </div>`;

    const kpis = [
      kpi(`${icon("timer", 15)}Toplam Odak`, s.minutes > 0 ? formatMinutesTR(s.minutes) : "—",
        s.minutes > 0 ? `${s.sessions} oturum` : "Kayıtlı oturum yok"),
      kpi(`${icon("list", 15)}Görevler`, s.tasksPlanned > 0 ? `${s.tasksDone} / ${s.tasksPlanned}` : "—",
        s.tasksPlanned > 0 ? `%${Math.round((s.tasksDone / s.tasksPlanned) * 100)} tamamlandı · bu haftaya atanmış` : "Bu haftaya görev atanmamış"),
      kpi(`${icon("repeat", 15)}Rutin Uyumu`, s.routineDue > 0 ? `%${Math.round((s.routineDone / s.routineDue) * 100)}` : "—",
        s.routineDue > 0 ? `${s.routineDone} / ${s.routineDue} planlı gün` : "Bu hafta planlı rutin günü yok"),
      kpi(`${icon("hourglass", 15)}Erteleme`, s.postponedTotal > 0 ? `${s.postponedTotal} kez` : "0",
        s.postponedTotal > 0 ? "bu hafta yapılan ertelemeler" : "Bu hafta erteleme yok")
    ].join("");

    let goalsHtml;
    if (s.topGoals.length > 0) {
      goalsHtml = s.topGoals.map((g) =>
        `<div class="weekly-summary-row"><span>${escapeHtml(g.title)}</span><span>${formatMinutesTR(g.minutes)}</span></div>`
      ).join("");
      if (s.untrackedGoalMinutes > 0) {
        goalsHtml += `<div class="weekly-summary-note">Hedef dağılımı kaydı başlamadan önceki ${formatMinutesTR(s.untrackedGoalMinutes)} dahil değil.</div>`;
      }
    } else if (s.minutes > 0 && s.untrackedGoalMinutes >= s.minutes) {
      goalsHtml = `<div class="weekly-summary-note">Bu haftanın oturumları için hedef bazlı süre kaydı yok (bu kayıt yeni eklendi; bundan sonraki oturumlarda görünecek).</div>`;
    } else if (s.minutes > 0) {
      goalsHtml = `<div class="weekly-summary-note">Bu hafta odak oturumları hedefe bağlı bir görevle eşleşmedi. Zamanlayıcıda görev seçersen burada görünür.</div>`;
    } else {
      goalsHtml = `<div class="weekly-summary-note">Bu hafta odak oturumu kaydı yok.</div>`;
    }

    const postponedHtml = s.postponedTop.length > 0
      ? s.postponedTop.map((p) =>
          `<div class="weekly-summary-row"><span>${escapeHtml(p.title)}</span><span>${p.count}x</span></div>`
        ).join("")
      : `<div class="weekly-summary-note">Bu hafta ertelenen görev yok. 👏</div>`;

    body.innerHTML = `
      <div class="weekly-summary-kpis">${kpis}</div>
      <div class="weekly-summary-lists">
        <div class="weekly-summary-list"><h5>En çok odaklanılan hedefler</h5>${goalsHtml}</div>
        <div class="weekly-summary-list"><h5>En çok ertelenenler</h5>${postponedHtml}</div>
      </div>`;
  }

  // =========================================================
  // 2.5 GÖRÜNÜM: TAKVİM (GÜN / AY / YIL GÖRÜNÜMLERİ) RENDER
  // =========================================================
  function getMonthGridDates(year, monthIndex) {
    // Ayın 1'i hangi gün (Pazartesi=0 .. Pazar=6 olacak şekilde)
    const firstDay = new Date(year, monthIndex, 1, 12, 0, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, monthIndex, 1 - startOffset, 12, 0, 0);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dt = new Date(gridStart);
      dt.setDate(gridStart.getDate() + i);
      cells.push({
        iso: toISODate(dt),
        dayNum: dt.getDate(),
        month: dt.getMonth(),
        year: dt.getFullYear(),
        isCurrentMonth: dt.getMonth() === monthIndex
      });
    }
    return cells;
  }

  function renderCalendarView() {
    const mode = uiState.calendarMode || "month";

    // Mod Seçici Hapları Güncelle
    document.querySelectorAll("[data-cal-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.calMode === mode);
    });

    document.getElementById("calModeDayContainer").classList.toggle("hidden", mode !== "day");
    document.getElementById("calModeMonthContainer").classList.toggle("hidden", mode !== "month");
    document.getElementById("calModeYearContainer").classList.toggle("hidden", mode !== "year");

    const badgeEl = document.getElementById("calPeriodBadge");
    const titleEl = document.getElementById("calCurrentTitle");

    if (mode === "day") {
      badgeEl.textContent = getRelativeDayLabel(uiState.selectedDateISO);
      titleEl.textContent = formatFullTR(uiState.selectedDateISO);
      renderCalendarDayMode();
    } else if (mode === "month") {
      badgeEl.textContent = "AYLIK TAKVİM";
      titleEl.textContent = `${TR_MONTHS[uiState.calendarMonth]} ${uiState.calendarYear}`;
      renderCalendarMonthMode();
    } else if (mode === "year") {
      badgeEl.textContent = "YILLIK PANORAMA";
      titleEl.textContent = `${uiState.calendarYear} Yılı Takvimi`;
      renderCalendarYearMode();
    }
  }

  // --- MOD 1: GÜNLÜK TAKVİM ---
  function renderCalendarDayMode() {
    const selDate = uiState.selectedDateISO;
    const selDt = parseISODate(selDate);
    const year = selDt.getFullYear();
    const month = selDt.getMonth();
    const today = getTodayISO();

    document.getElementById("calMiniMonthTitle").textContent = `${TR_MONTHS[month]} ${year}`;
    const miniGrid = document.getElementById("calDayMiniMonthGrid");
    miniGrid.innerHTML = "";

    ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].forEach((dName) => {
      const dow = document.createElement("div");
      dow.className = "mini-cal-dow";
      dow.textContent = dName;
      miniGrid.appendChild(dow);
    });

    const cells = getMonthGridDates(year, month);
    cells.forEach((c) => {
      const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === c.iso);
      const hasGoalDeadline = state.goals.some((g) => g.targetDate === c.iso);
      const hasNote = Boolean(state.dailyNotes && state.dailyNotes[c.iso] && state.dailyNotes[c.iso].trim());

      const cellEl = document.createElement("div");
      cellEl.className = `mini-cal-cell ${!c.isCurrentMonth ? "other-month" : ""} ${c.iso === today ? "is-today" : ""} ${c.iso === selDate ? "is-selected" : ""}`;
      cellEl.innerHTML = `
        <div>${c.dayNum}</div>
        <div class="mini-cal-dots">
          ${dayTasks.some((t) => !t.completed) ? `<span class="dot-pending"></span>` : ""}
          ${dayTasks.some((t) => t.completed) ? `<span class="dot-done"></span>` : ""}
          ${hasGoalDeadline ? `<span class="dot-goal"></span>` : ""}
          ${hasNote ? `<span class="dot-note"></span>` : ""}
        </div>
      `;
      cellEl.addEventListener("click", () => {
        uiState.selectedDateISO = c.iso;
        uiState.calendarYear = c.year;
        uiState.calendarMonth = c.month;
        renderAll();
      });
      miniGrid.appendChild(cellEl);
    });

    // Sol Alt: Bu Tarihte Aktif Hedefler & Vadeler
    const goalsBox = document.getElementById("calDayGoalsBox");
    goalsBox.innerHTML = "";
    const activeGoalsOnDate = state.goals.filter(
      (g) => !g.completed && (!g.startDate || g.startDate <= selDate) && (!g.targetDate || g.targetDate >= selDate)
    );
    if (activeGoalsOnDate.length === 0) {
      goalsBox.innerHTML = `<div class="empty-state">Bu tarihte aktif vade bulunmuyor.</div>`;
    } else {
      activeGoalsOnDate.forEach((g) => {
        const prog = calculateGoalProgress(g);
        const isDeadlineToday = g.targetDate === selDate;
        const div = document.createElement("div");
        div.style.cssText = "padding:10px 12px;background:var(--bg-input);border:1px solid var(--border-subtle);border-radius:8px;";
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:12.5px;">${icon(g.horizon === "long" ? "mountain" : "bolt", 13)} ${escapeHtml(g.title)}</strong>
            <span class="badge ${isDeadlineToday ? "badge-priority-high" : "badge-category"}">
              ${isDeadlineToday ? "VADE SONU BUGÜN" : `Vade: ${formatShortTR(g.targetDate)}`}
            </span>
          </div>
          <div class="progress-track" style="height:6px;margin-top:6px;">
            <div class="progress-fill" style="width:${prog}%"></div>
          </div>
        `;
        goalsBox.appendChild(div);
      });
    }

    // Sağ Sütun: Seçili Günün Tüm Ajandası
    document.getElementById("calDayDetailHeader").textContent = formatFullTR(selDate);
    const agendaEl = document.getElementById("calDayTasksAndRoutines");
    agendaEl.innerHTML = "";

    renderDayAgendaContents(selDate, agendaEl);
  }

  // --- MOD 2: AYLIK TAKVİM ---
  function renderCalendarMonthMode() {
    const year = uiState.calendarYear;
    const month = uiState.calendarMonth;
    const today = getTodayISO();
    const selDate = uiState.selectedDateISO;

    const cellsGrid = document.getElementById("calMonthCellsGrid");
    cellsGrid.innerHTML = "";

    const cells = getMonthGridDates(year, month);
    cells.forEach((c) => {
      const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === c.iso);
      const deadlineGoals = state.goals.filter((g) => g.targetDate === c.iso);
      const hasNote = Boolean(state.dailyNotes && state.dailyNotes[c.iso] && state.dailyNotes[c.iso].trim());
      const dueRoutines = state.routines.filter(
        (r) => (!r.status || r.status === "active") && isRoutineScheduledForDate(r, c.iso)
      );
      const doneRoutinesCount = dueRoutines.filter((r) => r.completions && r.completions[c.iso]).length;

      const cell = document.createElement("div");
      cell.className = `cal-day-cell ${!c.isCurrentMonth ? "other-month" : ""} ${c.iso === today ? "is-today" : ""} ${c.iso === selDate ? "is-selected" : ""}`;

      const pillsHtml = [];

      // Hedef Vade Sonu varsa en üstte göster
      deadlineGoals.forEach((g) => {
        pillsHtml.push(
          `<div class="cal-pill-item goal-deadline" title="Hedef Vade Bitişi: ${escapeHtml(g.title)}">${escapeHtml(g.title)}</div>`
        );
      });

      // Görevleri göster
      dayTasks.forEach((t) => {
        const cls = t.completed ? "done" : (t.postponeCount || 0) > 0 ? "postponed" : "";
        const icon = t.completed ? "✓" : (t.postponeCount || 0) > 0 ? "↻" : "•";
        pillsHtml.push(
          `<div class="cal-pill-item ${cls}" title="${escapeHtml(t.title)}">${icon} ${escapeHtml(t.title)}</div>`
        );
      });

      const maxVisible = 3;
      const visiblePills = pillsHtml.slice(0, maxVisible).join("");
      const moreCount = pillsHtml.length - maxVisible;

      cell.innerHTML = `
        <div class="cal-cell-top">
          <span class="cal-cell-num">${c.dayNum}</span>
          <div class="cal-cell-indicators">
            ${hasNote ? `<span class="cal-note-dot" title="Günlük notu var" aria-label="Günlük notu var"></span>` : ""}
            ${dueRoutines.length > 0 ? `<span style="color:var(--text-muted);font-size:10px;" title="Tamamlanan Rutinler">${icon("repeat", 11)}${doneRoutinesCount}/${dueRoutines.length}</span>` : ""}
          </div>
        </div>
        <div class="cal-cell-items">
          ${visiblePills}
          ${moreCount > 0 ? `<div class="cal-more-count">+${moreCount} daha...</div>` : ""}
        </div>
      `;

      cell.addEventListener("click", () => {
        uiState.selectedDateISO = c.iso;
        if (!c.isCurrentMonth) {
          uiState.calendarYear = c.year;
          uiState.calendarMonth = c.month;
        }
        renderAll();
      });

      cellsGrid.appendChild(cell);
    });

    // Sağdaki Seçili Gün İnceleme Panelini (Inspector) Doldur
    document.getElementById("calInspectorBadge").textContent = getRelativeDayLabel(selDate);
    document.getElementById("calInspectorDateTitle").textContent = formatFullTR(selDate);
    const inspectorContent = document.getElementById("calInspectorContent");
    inspectorContent.innerHTML = "";

    renderDayAgendaContents(selDate, inspectorContent);
  }

  // Günlük Takvim ve Aylık Takvim Sağ Paneli için Ortak Gün İçeriği Oluşturucu
  function renderDayAgendaContents(isoDate, containerEl) {
    // 1. O gün vadesi dolan hedefler
    const deadlineGoals = state.goals.filter((g) => g.targetDate === isoDate);
    deadlineGoals.forEach((g) => {
      const gBanner = document.createElement("div");
      gBanner.style.cssText =
        "padding:10px 12px;background:var(--purple-soft);border:1px solid var(--purple);border-radius:8px;font-size:12.5px;";
      gBanner.innerHTML = `
        <strong>Hedef Vade Günü:</strong> ${escapeHtml(g.title)}
        <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">İlerleme: %${calculateGoalProgress(g)}</div>
      `;
      containerEl.appendChild(gBanner);
    });

    // 2. O günün görevleri
    const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === isoDate);
    const tasksHeader = document.createElement("div");
    tasksHeader.style.cssText = "font-size:12px;font-weight:700;color:var(--text-secondary);margin-top:4px;";
    tasksHeader.textContent = `Günün Görevleri (${dayTasks.filter((t) => t.completed).length}/${dayTasks.length})`;
    containerEl.appendChild(tasksHeader);

    if (dayTasks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.style.padding = "14px";
      empty.textContent = "Bu güne atanmış görev yok.";
      containerEl.appendChild(empty);
    } else {
      dayTasks.forEach((t) => {
        containerEl.appendChild(createTaskCardElement(t));
      });
    }

    // 3. O günün tekrarlayan rutinleri (sadece aktif olanlar)
    const dueRoutines = state.routines.filter(
      (r) => (!r.status || r.status === "active") && isRoutineScheduledForDate(r, isoDate)
    );
    if (dueRoutines.length > 0) {
      const rHeader = document.createElement("div");
      rHeader.style.cssText = "font-size:12px;font-weight:700;color:var(--text-secondary);margin-top:8px;";
      rHeader.textContent = `Günün Rutinleri`;
      containerEl.appendChild(rHeader);

      dueRoutines.forEach((r) => {
        const done = Boolean(r.completions && r.completions[isoDate]);
        const rDiv = document.createElement("div");
        rDiv.className = `task-card ${done ? "completed" : ""}`;
        rDiv.style.padding = "9px 12px";
        rDiv.innerHTML = `
          <div class="task-main-row">
            <button class="task-checkbox ${done ? "checked" : ""}" data-action="toggle-routine-day" data-id="${r.id}" data-date="${isoDate}">
              ${done ? "✓" : ""}
            </button>
            <div class="task-body">
              <span class="task-title-text" style="font-size:13px;">${escapeHtml(r.title)}</span>
              <span class="badge badge-streak" style="margin-left:6px;">${icon("flame", 13)}${calculateRoutineStreak(r)}</span>
            </div>
          </div>
        `;
        containerEl.appendChild(rDiv);
      });
    }

    // 4. O günün serbest notu
    const noteWrapper = document.createElement("div");
    noteWrapper.style.marginTop = "10px";
    const existingNote = (state.dailyNotes && state.dailyNotes[isoDate]) || "";
    noteWrapper.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">
        ${formatShortTR(isoDate)} Günlük Notu
      </div>
      <textarea
        class="daily-note-textarea"
        style="min-height:90px;"
        placeholder="Bu güne özel not bırak..."
      >${escapeHtml(existingNote)}</textarea>
    `;
    const textarea = noteWrapper.querySelector("textarea");
    textarea.addEventListener("input", (e) => {
      state.dailyNotes = state.dailyNotes || {};
      state.dailyNotes[isoDate] = e.target.value;
      saveData();
    });
    containerEl.appendChild(noteWrapper);
  }

  // --- MOD 3: YILLIK TAKVİM (12 AY PANORAMA & HEDEF YOL HARİTASI) ---
  function renderCalendarYearMode() {
    const year = uiState.calendarYear;
    const yearPrefix = `${year}-`;
    const today = getTodayISO();

    // 1. Yıllık İstatistikler
    const yearTasks = state.tasks.filter((t) => t.date && t.date.startsWith(yearPrefix));
    const yearDone = yearTasks.filter((t) => t.completed).length;
    const yearGoals = state.goals.filter(
      (g) =>
        (g.startDate && g.startDate.startsWith(yearPrefix)) ||
        (g.targetDate && g.targetDate.startsWith(yearPrefix))
    );
    const yearNotesCount = Object.keys(state.dailyNotes || {}).filter(
      (d) => d.startsWith(yearPrefix) && state.dailyNotes[d].trim()
    ).length;

    document.getElementById("calYearSummaryStrip").innerHTML = `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("calendar", 15)}${year} Yılı Planlı Görevler</div>
        <div class="summary-kpi-val">${yearTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("list", 15)}Tamamlanan Görevler</div>
        <div class="summary-kpi-val" style="color:var(--success);">${yearDone}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("target", 15)}${year} Yılı Hedefleri</div>
        <div class="summary-kpi-val">${yearGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("note", 15)}Günlük Not Yazılan Gün</div>
        <div class="summary-kpi-val">${yearNotesCount}</div>
      </div>
    `;

    // 2. Yıllık Hedef & Vade Yol Haritası (12 Aylık Gantt Şeridi)
    const roadmapEl = document.getElementById("calYearGoalsRoadmap");
    roadmapEl.innerHTML = "";

    const headerRow = document.createElement("div");
    headerRow.className = "roadmap-months-header";
    headerRow.innerHTML = `
      <div style="text-align:left;">Hedef Başlığı</div>
      ${TR_MONTHS.map((m) => `<div>${m.slice(0, 3)}</div>`).join("")}
    `;
    roadmapEl.appendChild(headerRow);

    if (state.goals.length === 0) {
      roadmapEl.innerHTML += `<div class="empty-state">Henüz hedef tanımlanmamış.</div>`;
    } else {
      state.goals.forEach((g) => {
        const startDt = parseISODate(g.startDate || g.createdAt || today);
        const endDt = parseISODate(g.targetDate || today);
        const prog = calculateGoalProgress(g);

        const row = document.createElement("div");
        row.className = "roadmap-goal-row";

        let slotsHtml = "";
        for (let m = 0; m < 12; m++) {
          const monthStart = new Date(year, m, 1);
          const monthEnd = new Date(year, m + 1, 0);
          const isOverlapping = startDt <= monthEnd && endDt >= monthStart;
          const isTargetMonth = endDt.getFullYear() === year && endDt.getMonth() === m;

          const activeClass = isOverlapping
            ? g.horizon === "long"
              ? "active-long"
              : "active-short"
            : "";

          slotsHtml += `
            <div class="roadmap-month-slot ${activeClass} ${isTargetMonth ? "is-target-month" : ""}" title="${escapeHtml(g.title)} (${formatShortTR(g.startDate)} → ${formatShortTR(g.targetDate)})">
              ${isTargetMonth ? `%${prog}` : isOverlapping ? "•" : ""}
            </div>
          `;
        }

        row.innerHTML = `
          <div class="roadmap-goal-name" title="${escapeHtml(g.title)}">
            ${icon(g.horizon === "long" ? "mountain" : "bolt", 13)} ${escapeHtml(g.title)}
          </div>
          ${slotsHtml}
        `;
        roadmapEl.appendChild(row);
      });
    }

    // 3. 12 Ayın Mini Takvim Kartları
    const monthsGrid = document.getElementById("calYear12MonthsGrid");
    monthsGrid.innerHTML = "";

    for (let m = 0; m < 12; m++) {
      const mPrefix = `${year}-${String(m + 1).padStart(2, "0")}`;
      const mTasks = state.tasks.filter((t) => t.date && t.date.startsWith(mPrefix));
      const mDone = mTasks.filter((t) => t.completed).length;

      const card = document.createElement("div");
      card.className = "year-month-card";

      const firstDay = new Date(year, m, 1, 12, 0, 0);
      const startOffset = (firstDay.getDay() + 6) % 7;
      const daysInMonth = new Date(year, m + 1, 0).getDate();

      let daysCellsHtml = "";
      ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].forEach((d) => {
        daysCellsHtml += `<div class="mini-cal-dow">${d}</div>`;
      });

      for (let e = 0; e < startOffset; e++) {
        daysCellsHtml += `<div></div>`;
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dISO = `${mPrefix}-${String(d).padStart(2, "0")}`;
        const dTasks = state.tasks.filter((t) => t.scope === "day" && t.date === dISO);
        const hasGoal = state.goals.some((g) => g.targetDate === dISO);

        let statusCls = "";
        if (dISO === today) {
          statusCls = "is-today";
        } else if (dTasks.length > 0 && dTasks.every((t) => t.completed)) {
          statusCls = "all-done";
        } else if (dTasks.length > 0) {
          statusCls = "has-pending";
        }
        if (hasGoal) {
          statusCls += " has-goal-deadline";
        }

        const titleTip = [
          dTasks.length ? `${dTasks.length} görev` : "",
          hasGoal ? "Hedef Vade Sonu" : ""
        ]
          .filter(Boolean)
          .join(" • ");

        daysCellsHtml += `
          <div class="year-mini-day ${statusCls}" data-year-day="${dISO}" title="${titleTip || formatShortTR(dISO)}">
            ${d}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="year-month-card-header" data-open-month="${m}">
          <h4 style="font-size:14.5px;font-weight:700;">${TR_MONTHS[m]} ${year}</h4>
          <span class="nav-badge">${mTasks.length > 0 ? `${mDone}/${mTasks.length} görev` : "Boş"}</span>
        </div>
        <div class="mini-month-grid">
          ${daysCellsHtml}
        </div>
      `;

      // Ay başlığına tıklayınca Aylık Takvim'de o ayı aç
      card.querySelector("[data-open-month]").addEventListener("click", () => {
        uiState.calendarMonth = m;
        uiState.calendarMode = "month";
        renderAll();
      });

      // Güne tıklayınca Aylık Takvim'de o günü seçerek aç
      card.querySelectorAll("[data-year-day]").forEach((dayEl) => {
        dayEl.addEventListener("click", () => {
          const clickedISO = dayEl.dataset.yearDay;
          uiState.selectedDateISO = clickedISO;
          uiState.calendarMonth = m;
          uiState.calendarMode = "month";
          renderAll();
        });
      });

      monthsGrid.appendChild(card);
    }
  }

  // =========================================================
  // 3. GÖRÜNÜM: HEDEF PUSULASI (GOALS VIEW) RENDER
  // =========================================================
  function renderGoalsView() {
    const summaryStrip = document.getElementById("goalsSummaryStrip");
    const shortGoals = state.goals.filter((g) => g.horizon === "short" && !g.completed);
    const longGoals = state.goals.filter((g) => g.horizon === "long" && !g.completed);
    const completedGoals = state.goals.filter((g) => g.completed);

    summaryStrip.innerHTML = `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("bolt", 15)}Aktif Kısa Vadeli Hedefler</div>
        <div class="summary-kpi-val">${shortGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("mountain", 15)}Aktif Uzun Vadeli Hedefler</div>
        <div class="summary-kpi-val">${longGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("link", 15)}Hedefe Bağlı Görev Sayısı</div>
        <div class="summary-kpi-val">${state.tasks.filter((t) => Boolean(t.goalId)).length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("trophy", 15)}Tamamlanan Hedefler</div>
        <div class="summary-kpi-val">${completedGoals.length}</div>
      </div>
    `;

    const gridEl = document.getElementById("goalsGrid");
    gridEl.innerHTML = "";

    let filteredGoals = state.goals.slice();
    if (uiState.goalFilter === "short") {
      filteredGoals = filteredGoals.filter((g) => g.horizon === "short" && !g.completed);
    } else if (uiState.goalFilter === "long") {
      filteredGoals = filteredGoals.filter((g) => g.horizon === "long" && !g.completed);
    } else if (uiState.goalFilter === "completed") {
      filteredGoals = filteredGoals.filter((g) => g.completed);
    }

    if (uiState.searchQuery) {
      const q = uiState.searchQuery.toLowerCase();
      filteredGoals = filteredGoals.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.why && g.why.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q))
      );
    }

    if (filteredGoals.length === 0) {
      gridEl.innerHTML = `<div class="empty-state">Bu filtreye uygun hedef bulunamadı. "Yeni Hedef Ekle" butonuyla kısa veya uzun vadeli hedefini tanımlayabilirsin.</div>`;
      return;
    }

    filteredGoals.forEach((goal) => {
      const prog = calculateGoalProgress(goal);
      const timeStats = calculateGoalTimeStats(goal);
      const parentGoal = goal.parentId ? getGoalById(goal.parentId) : null;
      const linkedTasks = state.tasks.filter((t) => t.goalId === goal.id);
      const doneLinkedTasks = linkedTasks.filter((t) => t.completed).length;
      const milestones = goal.milestones || [];

      const card = document.createElement("div");
      card.className = `goal-card horizon-${goal.horizon}`;

      card.innerHTML = `
        <div class="goal-header">
          <div>
            <span class="goal-horizon-tag ${goal.horizon === "long" ? "tag-long" : "tag-short"}">
              ${goal.horizon === "long" ? `${icon("mountain", 13)} UZUN VADELİ HEDEF` : `${icon("bolt", 13)} KISA VADELİ HEDEF`}
            </span>
            <span class="badge badge-category" style="margin-left:6px;">${escapeHtml(goal.category || "Genel")}</span>
            <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
            ${
              parentGoal
                ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:3px;">${icon("link", 12)} Üst Vizyon: <strong>${escapeHtml(parentGoal.title)}</strong></div>`
                : ""
            }
          </div>

          <div class="task-actions">
            <button class="action-btn" data-action="add-task-for-goal" data-id="${goal.id}" title="Bu hedefe bağlı yeni görev ekle">＋ Görev</button>
            <button class="action-btn" data-action="edit-goal" data-id="${goal.id}" title="Hedefi Düzenle" aria-label="Hedefi Düzenle">${icon("edit", 14)}</button>
            <button class="action-btn" data-action="toggle-goal-complete" data-id="${goal.id}" title="${goal.completed ? "Aktif Et" : "Hedefi Tamamlandı İşaretle"}">
              ${goal.completed ? icon("undo", 14) : icon("trophy", 14)}
            </button>
            <button class="action-btn" data-action="delete-goal" data-id="${goal.id}" title="Hedefi Sil" aria-label="Hedefi Sil">${icon("trash", 14)}</button>
          </div>
        </div>

        ${goal.why ? `<div class="goal-why-box">${escapeHtml(goal.why)}</div>` : ""}

        <div class="goal-timeline-meta">
          <div>
            <span>Vade: <strong>${formatShortTR(goal.startDate)} → ${formatShortTR(goal.targetDate)}</strong></span>
            <span style="margin-left:6px;color:var(--text-muted);">(${timeStats.totalDays} gün)</span>
          </div>
          <span class="deadline-countdown ${timeStats.statusClass}">${timeStats.remainingLabel}</span>
        </div>

        <div class="progress-block">
          <div class="progress-labels">
            <span>Hedef İlerlemesi (Görev & Kilometre Taşları)</span>
            <span style="color:var(--accent-primary);">%${prog}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${prog}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-top:2px;">
            <span>Geçen Vade Süresi: %${timeStats.timeElapsedPct}</span>
            <span>${doneLinkedTasks}/${linkedTasks.length} bağlı görev tamamlandı</span>
          </div>
          <div class="time-elapsed-track">
            <div class="time-elapsed-fill" style="width:${timeStats.timeElapsedPct}%"></div>
          </div>
        </div>

        ${
          milestones.length > 0
            ? `
          <div class="goal-linked-section">
            <div class="goal-linked-header">
              <span>Kilometre Taşları (Alt Hedefler)</span>
              <span>${milestones.filter((m) => m.done).length}/${milestones.length}</span>
            </div>
            <div class="subtasks-inline">
              ${milestones
                .map(
                  (m, idx) => `
                <label class="subtask-row ${m.done ? "done" : ""}">
                  <input type="checkbox" data-action="toggle-milestone" data-goal-id="${goal.id}" data-idx="${idx}" ${m.done ? "checked" : ""} />
                  <span>${escapeHtml(m.text)}</span>
                </label>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <div class="goal-linked-section">
          <div class="goal-linked-header">
            <span>Bu Hedefe Bağlı Son Görevler</span>
            <button class="btn btn-ghost btn-xs" data-action="add-task-for-goal" data-id="${goal.id}">＋ Hedefe Görev Ekle</button>
          </div>
          ${
            linkedTasks.length === 0
              ? `<div style="font-size:12px;color:var(--text-muted);">Henüz bağlı görev yok. Bu hedefi ilerletmek için günlük veya haftalık görev bağlayabilirsin.</div>`
              : linkedTasks
                  .slice(0, 4)
                  .map(
                    (t) => `
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding:5px 8px;background:var(--bg-input);border-radius:6px;">
                  <span style="${t.completed ? "text-decoration:line-through;color:var(--text-muted);" : ""}">
                    ${t.completed ? "✓" : "○"} ${escapeHtml(t.title)}
                  </span>
                  <span style="font-size:11px;color:var(--text-muted);">
                    ${t.scope === "week" ? "Haftalık" : formatShortTR(t.date)}
                  </span>
                </div>
              `
                  )
                  .join("")
          }
        </div>
      `;

      gridEl.appendChild(card);
    });
  }

  // =========================================================
  // 3.5 GÖRÜNÜM: ODAK & DERS ZAMANLAYICISI + SES EFEKTLERİ & AMBİYANS
  // =========================================================
  let audioCtx = null;
  let ambientNodes = null;

  function ensureAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playClickSound() {
    if (!uiState.timer.soundEnabled) return;
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.15 * uiState.timer.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (_) {}
  }

  function playBellSound(type = "zen") {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const vol = Math.max(0.1, uiState.timer.volume);

      if (type === "zen") {
        // Huzurlu Tibet Çanı (Harmonik Rezonans)
        [432, 648, 864].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime((0.28 / (i + 1)) * vol, now);
          gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.6 - i * 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.7);
        });
      } else if (type === "crystal") {
        // Canlandırıcı Kristal Melodi (Arpej)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const start = now + idx * 0.13;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.24 * vol, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.95);
        });
      } else {
        // Klasik Çift Uyarı
        [880, 880, 1174.6].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          const start = now + idx * 0.18;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.25 * vol, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.15);
        });
      }
    } catch (_) {}
  }

  function setAmbientSound(mode) {
    uiState.timer.ambientMode = mode;
    if (ambientNodes) {
      try {
        ambientNodes.source.stop();
        ambientNodes.source.disconnect();
      } catch (_) {}
      ambientNodes = null;
    }

    if (mode === "off") return;

    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Yumuşak pembe/kahverengi gürültü sentezi
        data[i] = (lastOut + 0.03 * white) / 1.03;
        lastOut = data[i];
        data[i] *= 0.45;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      if (mode === "rain") {
        filter.frequency.value = 1100;
      } else if (mode === "focus") {
        filter.frequency.value = 420;
      } else if (mode === "fire") {
        filter.frequency.value = 280;
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.18 * uiState.timer.volume;

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      noise.start();

      ambientNodes = { source: noise, gain: gainNode };
    } catch (_) {}
  }

  function formatTimerMMSS(totalSec) {
    const sec = Math.max(0, Math.round(totalSec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function switchTimerMode(newMode, customMinutes = null, shouldBroadcast = true) {
    uiState.timer.running = false;
    uiState.timer.targetTimestamp = null;
    uiState.timer.mode = newMode;

    let mins = uiState.timer.studyMins;
    if (customMinutes !== null) {
      mins = customMinutes;
    } else if (newMode === "short_break") {
      mins = uiState.timer.shortBreakMins;
    } else if (newMode === "long_break") {
      mins = uiState.timer.longBreakMins;
    }

    uiState.timer.totalSeconds = mins * 60;
    uiState.timer.remainingSeconds = mins * 60;
    saveTimerState();
    updateTimerDOM();

    if (shouldBroadcast) {
      broadcastTimerAction("SWITCH_MODE", {
        mode: newMode,
        customMinutes,
        totalSeconds: uiState.timer.totalSeconds,
        remainingSeconds: uiState.timer.remainingSeconds
      });
    }
  }

  function toggleTimerStartPause(shouldBroadcast = true) {
    playClickSound();
    if (uiState.timer.running) {
      // Duraklat
      uiState.timer.running = false;
      uiState.timer.targetTimestamp = null;
      if (shouldBroadcast) {
        broadcastTimerAction("PAUSE", {
          remainingSeconds: uiState.timer.remainingSeconds
        });
      }
    } else {
      // Başlat
      if (uiState.timer.remainingSeconds <= 0) {
        uiState.timer.remainingSeconds = uiState.timer.totalSeconds;
      }
      uiState.timer.running = true;
      uiState.timer.targetTimestamp = Date.now() + uiState.timer.remainingSeconds * 1000;
      if (shouldBroadcast) {
        broadcastTimerAction("START", {
          mode: uiState.timer.mode,
          totalSeconds: uiState.timer.totalSeconds,
          remainingSeconds: uiState.timer.remainingSeconds
        });
      }
    }
    saveTimerState();
    updateTimerDOM();
  }

  // fromRoom: tamamlanma odadan gelen mesajla tetiklendiyse tekrar yayınlanmaz
  function handleTimerComplete(fromRoom = false) {
    const fromMode = uiState.timer.mode;
    const switchAfterComplete = (nextMode) => {
      switchTimerMode(nextMode, null, false);
      if (!fromRoom) {
        broadcastTimerAction("SWITCH_MODE", {
          mode: nextMode,
          fromMode,
          reason: "complete",
          customMinutes: null,
          totalSeconds: uiState.timer.totalSeconds,
          remainingSeconds: uiState.timer.remainingSeconds
        });
      }
    };
    uiState.timer.running = false;
    uiState.timer.targetTimestamp = null;
    uiState.timer.remainingSeconds = 0;
    saveTimerState();

    if (uiState.timer.soundEnabled) {
      playBellSound(uiState.timer.bellType);
    }

    const completedMinutes = Math.max(1, Math.round(uiState.timer.totalSeconds / 60));
    const today = getTodayISO();

    if (uiState.timer.mode === "study") {
      state.focusStats = state.focusStats || {};
      state.focusStats[today] = state.focusStats[today] || { sessions: 0, minutes: 0 };
      state.focusStats[today].sessions += 1;
      state.focusStats[today].minutes += completedMinutes;
      // Haftalık özet için gün bazında hedef dağılımı (bu kayıt varsa o gün izlenmiş demektir)
      const dayStats = state.focusStats[today];
      if (!dayStats.byGoal || typeof dayStats.byGoal !== "object") dayStats.byGoal = {};

      const linkedTaskId = document.getElementById("selectTimerLinkedTask")?.value;
      if (linkedTaskId) {
        const task = state.tasks.find((t) => t.id === linkedTaskId);
        if (task) {
          task.focusedMinutes = (task.focusedMinutes || 0) + completedMinutes;
          if (task.goalId) {
            dayStats.byGoal[task.goalId] = (dayStats.byGoal[task.goalId] || 0) + completedMinutes;
          }
        }
      }
      const streakGrew = isInRoomWithOthers() ? recordRoomStudyDay(today) : false;
      saveData();
      showToast(`🎉 Harika! ${completedMinutes} dakikalık odak oturumu tamamlandı. Kısa mola zamanı!`);
      if (streakGrew) {
        const rs = getRoomStreak();
        showToast(rs.current > 1 ? `👥 Ortak seri ${rs.current} güne çıktı! Birlikte devam.` : "👥 Ortak seri başladı! Yarın da birlikte çalışalım.");
      }
      switchAfterComplete("short_break");
    } else {
      showToast("☕ Mola süresi bitti! Yeni ders/odak oturumuna hazırsın.");
      switchAfterComplete("study");
    }

    renderAll();
  }

  function updateTimerDOM() {
    const t = uiState.timer;
    const formatted = formatTimerMMSS(t.remainingSeconds);
    const digitsEl = document.getElementById("timerDigitsDisplay");
    if (digitsEl) digitsEl.textContent = formatted;

    const statusLabel = document.getElementById("timerModeStatusLabel");
    if (statusLabel) {
      statusLabel.textContent =
        t.mode === "study"
          ? "DERS & ODAK OTURUMU"
          : t.mode === "short_break"
          ? "KISA MOLA ZAMANI"
          : "UZUN MOLA & DİNLENME";
    }

    const pct =
      t.totalSeconds > 0
        ? Math.min(100, Math.max(0, Math.round(((t.totalSeconds - t.remainingSeconds) / t.totalSeconds) * 100)))
        : 0;
    const fillEl = document.getElementById("timerProgressBarFill");
    if (fillEl) fillEl.style.width = `${pct}%`;

    const startPauseBtn = document.getElementById("btnTimerStartPause");
    if (startPauseBtn) {
      startPauseBtn.innerHTML = t.running ? `${icon("pause", 16)} Duraklat` : `${icon("play", 16)} Başlat`;
    }

    document.querySelectorAll("[data-timer-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.timerMode === t.mode);
    });

    // Yan menü rozeti ve Yüzen Mini Zamanlayıcı
    const navBadge = document.getElementById("badgeTimerState");
    if (navBadge) {
      navBadge.textContent = t.running ? formatted : "Hazır";
    }

    const floatingBar = document.getElementById("floatingTimerBar");
    if (floatingBar) {
      const showFloating = t.running && uiState.currentView !== "timer";
      floatingBar.classList.toggle("hidden", !showFloating);
      if (showFloating) {
        document.getElementById("floatingTimerMode").textContent =
          t.mode === "study" ? "Ders" : "Mola";
        document.getElementById("floatingTimerDigits").textContent = formatted;
        document.getElementById("btnFloatingStartPause").textContent = t.running ? "⏸️" : "▶️";
      }
    }

    updateRoomChatLock();
  }

  function renderTimerView() {
    const today = getTodayISO();
    const todayStats = (state.focusStats && state.focusStats[today]) || { sessions: 0, minutes: 0 };

    const sessEl = document.getElementById("statTimerSessionsToday");
    const minsEl = document.getElementById("statTimerMinutesToday");
    if (sessEl) sessEl.textContent = `${todayStats.sessions} Oturum`;
    if (minsEl) minsEl.textContent = `${todayStats.minutes} dk`;
    if (sessEl && sessEl.parentElement) decorateFigures(sessEl.parentElement.parentElement || document);

    const taskSel = document.getElementById("selectTimerLinkedTask");
    if (taskSel) {
      const cur = taskSel.value;
      taskSel.innerHTML = `<option value="">— Genel Odak / Serbest Çalışma —</option>`;
      state.tasks
        .filter((t) => !t.completed)
        .forEach((t) => {
          const opt = document.createElement("option");
          opt.value = t.id;
          opt.textContent = `📌 ${t.title}`;
          taskSel.appendChild(opt);
        });
      taskSel.value = cur;
    }

    renderRoomTogether();
    updateTimerDOM();
    maybeClearRoomChatUnread();
  }

  // =========================================================
  // 4. GÖRÜNÜM: TEKRARLAYAN RUTİNLER (AKTİF / ARŞİV / ÇÖP KUTUSU & ÖNCEKİ SERİLER)
  // =========================================================
  function renderRoutinesView() {
    const gridEl = document.getElementById("routinesGrid");
    gridEl.innerHTML = "";

    const activeList = state.routines.filter((r) => !r.status || r.status === "active");
    const archivedList = state.routines.filter((r) => r.status === "archived");
    const trashedList = state.routines.filter((r) => r.status === "trashed");

    const cAct = document.getElementById("countRoutinesActive");
    const cArc = document.getElementById("countRoutinesArchived");
    const cTrs = document.getElementById("countRoutinesTrashed");
    if (cAct) cAct.textContent = activeList.length;
    if (cArc) cArc.textContent = archivedList.length;
    if (cTrs) cTrs.textContent = trashedList.length;

    document.querySelectorAll("[data-routine-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.routineTab === uiState.routineTab);
    });

    const descEl = document.getElementById("routinesTabDescription");
    if (descEl) {
      if (uiState.routineTab === "active") {
        descEl.innerHTML =
          "Aktif tekrarlayan görevlerin. Her kartın altında <strong>Önceki Serilerim</strong> kaydını görebilir, rutini arşivleyebilir veya çöp kutusuna taşıyabilirsin.";
      } else if (uiState.routineTab === "archived") {
        descEl.innerHTML =
          "<strong>Arşivlenen Rutinler:</strong> Şu an günlük akışta görünmeyen ancak tüm geçmiş seri (streak) kayıtları korunan rutinlerin.";
      } else {
        descEl.innerHTML =
          "<strong>Çöp Kutusu:</strong> Silinen rutinler doğrudan yok olmaz, buraya gelir. İstediğin zaman <strong>Geri Yükle</strong> diyebilir veya kalıcı olarak silebilirsin.";
      }
    }

    const listToShow =
      uiState.routineTab === "archived"
        ? archivedList
        : uiState.routineTab === "trashed"
        ? trashedList
        : activeList;

    const today = getTodayISO();
    const last7Days = Array.from({ length: 7 }, (_, i) => addDaysISO(today, -(6 - i)));

    if (listToShow.length === 0) {
      const emptyMsg =
        uiState.routineTab === "archived"
          ? "Arşivlenmiş rutin bulunmuyor."
          : uiState.routineTab === "trashed"
          ? "Çöp kutusu boş."
          : "Henüz aktif tekrarlayan görev (rutin) eklenmemiş.";
      gridEl.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
      return;
    }

    listToShow.forEach((routine) => {
      const streak = calculateRoutineStreak(routine);
      const streakHistory = calculateRoutineStreakHistory(routine);
      const totalCompletions = Object.values(routine.completions || {}).filter(Boolean).length;
      const goal = routine.goalId ? getGoalById(routine.goalId) : null;
      const rStatus = routine.status || "active";

      let actionButtonsHtml = "";
      if (rStatus === "active") {
        actionButtonsHtml = `
          <button class="action-btn" data-action="edit-routine" data-id="${routine.id}" title="Düzenle" aria-label="Düzenle">${icon("edit", 14)}</button>
          <button class="action-btn" data-action="archive-routine" data-id="${routine.id}" title="Arşive Kaldır (Serileri Korunur)">${icon("archive", 13)} Arşivle</button>
          <button class="action-btn" data-action="trash-routine" data-id="${routine.id}" title="Çöp Kutusuna Taşı" aria-label="Çöp Kutusuna Taşı">${icon("trash", 14)}</button>
        `;
      } else if (rStatus === "archived") {
        actionButtonsHtml = `
          <button class="action-btn" data-action="restore-routine" data-id="${routine.id}" title="Tekrar Aktif Et">${icon("restore", 13)} Aktif Et</button>
          <button class="action-btn" data-action="trash-routine" data-id="${routine.id}" title="Çöp Kutusuna Taşı" aria-label="Çöp Kutusuna Taşı">${icon("trash", 14)}</button>
        `;
      } else if (rStatus === "trashed") {
        actionButtonsHtml = `
          <button class="action-btn" data-action="restore-routine" data-id="${routine.id}" title="Çöp Kutusundan Geri Yükle">${icon("restore", 13)} Geri Yükle</button>
          <button class="action-btn" data-action="archive-routine" data-id="${routine.id}" title="Arşive Taşı">${icon("archive", 13)} Arşivle</button>
          <button class="action-btn" data-action="purge-routine" data-id="${routine.id}" title="Kalıcı Olarak Sil" style="color:var(--danger);">${icon("trash", 13)} Kalıcı Sil</button>
        `;
      }

      const card = document.createElement("div");
      card.className = "routine-card";

      card.innerHTML = `
        <div class="routine-streak-row">
          <div>
            <span class="badge badge-streak">${icon("flame", 13)}${streak} Gün Seri</span>
            <span class="badge badge-category" style="margin-left:4px;">${icon("trophy", 13)}En Uzun: ${routine.bestStreak || streak} Gün</span>
            <span class="badge badge-category" style="margin-left:4px;">${icon("list", 13)}Toplam: ${totalCompletions} Kez</span>
          </div>
          <div class="task-actions">
            ${actionButtonsHtml}
          </div>
        </div>

        <div>
          <h4 style="font-size:15.5px;font-weight:700;">${escapeHtml(routine.title)}</h4>
          <div class="task-badges" style="margin-top:6px;">
            <span class="badge badge-category">${icon("repeat", 13)}${getRoutineFreqLabel(routine)}</span>
            ${goal ? `<span class="badge badge-goal" data-jump-goal="${goal.id}">${icon("target", 13)}${escapeHtml(goal.title)}</span>` : ""}
          </div>
        </div>

        ${routine.note ? `<div class="task-note-preview">${escapeHtml(routine.note)}</div>` : ""}

        ${
          rStatus === "active"
            ? `
          <div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">
              Son 7 Günlük Takip (İşaretlemek için güne tıkla)
            </div>
            <div class="last-7-days-row">
              ${last7Days
                .map((dISO) => {
                  const dt = parseISODate(dISO);
                  const done = Boolean(routine.completions && routine.completions[dISO]);
                  return `
                    <div class="day-check-cell ${done ? "done" : ""}" data-action="toggle-routine-day" data-id="${routine.id}" data-date="${dISO}">
                      <div>${TR_DAYS_SHORT[dt.getDay()]}</div>
                      <div style="font-weight:700;margin-top:2px;">${dt.getDate()}</div>
                      <div>${done ? "✓" : "·"}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- ÖNCEKİ SERİLERİM (STREAK HISTORY) KUTUSU -->
        <div class="streak-history-box">
          <div class="streak-history-title">
            <span>Önceki Serilerim & Seri Geçmişi</span>
            <span>${streakHistory.length} Seri Kaydı</span>
          </div>
          ${
            streakHistory.length === 0
              ? `<div style="color:var(--text-muted);font-size:11.5px;">Henüz tamamlanmış seri kaydı yok.</div>`
              : `
            <div class="streak-pill-list">
              ${streakHistory
                .slice(0, 5)
                .map(
                  (sh, idx) => `
                <div class="streak-history-item">
                  <span>
                    ${sh.isActive ? "<strong>Aktif Seri:</strong>" : `${streakHistory.length - idx}. Seri:`}
                    <strong>${sh.count} Gün</strong> sürdü
                  </span>
                  <span style="color:var(--text-muted);">
                    ${formatShortTR(sh.start)} → ${formatShortTR(sh.end)}
                  </span>
                </div>
              `
                )
                .join("")}
            </div>
          `
          }
        </div>
      `;

      gridEl.appendChild(card);
    });
  }

  // =========================================================
  // 5. GÖRÜNÜM: ERTELEME & NOT ARŞİVİ (INSIGHTS VIEW) RENDER
  // =========================================================
  function renderInsightsView() {
    const statsRow = document.getElementById("insightsStatsRow");
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((t) => t.completed).length;
    const postponedTasks = state.tasks.filter((t) => (t.postponeCount || 0) > 0);
    const chronicTasks = state.tasks.filter((t) => !t.completed && (t.postponeCount || 0) >= 2);
    const totalNotesCount =
      state.tasks.filter((t) => t.note && t.note.trim()).length +
      Object.keys(state.dailyNotes || {}).filter((k) => state.dailyNotes[k].trim()).length +
      Object.keys(state.weeklyNotes || {}).filter((k) => state.weeklyNotes[k].trim()).length;

    statsRow.innerHTML = `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("list", 15)}Genel Görev Tamamlama</div>
        <div class="summary-kpi-val">${completedTasks}/${totalTasks}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("hourglass", 15)}En Az 1 Kez Ertelenen</div>
        <div class="summary-kpi-val">${postponedTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("repeat", 15)}Kronik Ertelenen (2+ Kez)</div>
        <div class="summary-kpi-val" style="color:var(--warning);">${chronicTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("note", 15)}Kayıtlı Not & Yansıma</div>
        <div class="summary-kpi-val">${totalNotesCount}</div>
      </div>
    `;

    // Sol: Ertelenen Görevler Analizi
    const postponedListEl = document.getElementById("postponedTasksAnalysisList");
    postponedListEl.innerHTML = "";
    const activePostponed = state.tasks
      .filter((t) => !t.completed && (t.postponeCount || 0) > 0)
      .sort((a, b) => (b.postponeCount || 0) - (a.postponeCount || 0));

    if (activePostponed.length === 0) {
      postponedListEl.innerHTML = `
        <div class="empty-state">
          Harika! Şu anda bekleyen ertelenmiş bir görevin yok.
        </div>
      `;
    } else {
      activePostponed.forEach((t) => {
        postponedListEl.appendChild(createTaskCardElement(t, { showDate: true }));
      });
    }

    // Sağ: Tüm Notlar & Erteleme Sebepleri Arşivi
    const archiveEl = document.getElementById("allNotesArchiveList");
    archiveEl.innerHTML = "";

    const archiveItems = [];

    // 1. Görev Notları
    if (uiState.noteFilter === "all" || uiState.noteFilter === "task") {
      state.tasks.forEach((t) => {
        if (t.note && t.note.trim()) {
          archiveItems.push({
            type: "Görev Notu",
            date: t.date || t.createdAt || getTodayISO(),
            title: t.title,
            text: t.note
          });
        }
      });
    }

    // 2. Günlük ve Haftalık Yansıma Notları
    if (uiState.noteFilter === "all" || uiState.noteFilter === "journal") {
      Object.entries(state.dailyNotes || {}).forEach(([dISO, text]) => {
        if (text && text.trim()) {
          archiveItems.push({
            type: "Günlük Not",
            date: dISO,
            title: `${formatFullTR(dISO)} Günlük Notu`,
            text
          });
        }
      });
      Object.entries(state.weeklyNotes || {}).forEach(([wISO, text]) => {
        if (text && text.trim()) {
          archiveItems.push({
            type: "Haftalık Odak Notu",
            date: wISO,
            title: `${formatWeekRangeTR(wISO)} Haftalık Notu`,
            text
          });
        }
      });
    }

    // 3. Erteleme Kayıtları
    if (uiState.noteFilter === "all" || uiState.noteFilter === "postpone") {
      state.tasks.forEach((t) => {
        (t.postponeHistory || []).forEach((h) => {
          archiveItems.push({
            type: "Erteleme Kaydı",
            date: h.at || t.date || getTodayISO(),
            title: t.title,
            text: `${formatShortTR(h.from)} → ${formatShortTR(h.to)} | Sebep: ${h.reason || "Belirtilmedi"}`
          });
        });
      });
    }

    // 4. Kaydedilen Günün Sözleri (Gerçek Alıntılar Koleksiyonu)
    if (uiState.noteFilter === "all" || uiState.noteFilter === "quotes") {
      (state.savedQuotes || []).forEach((sq) => {
        archiveItems.push({
          type: "Kaydedilen Günün Sözü",
          date: sq.savedAt || getTodayISO(),
          title: `${sq.author} (${sq.source || "Alıntı"})`,
          text: `"${sq.text}"`
        });
      });
    }

    if (uiState.searchQuery) {
      const q = uiState.searchQuery.toLowerCase();
      for (let i = archiveItems.length - 1; i >= 0; i--) {
        const it = archiveItems[i];
        if (!it.title.toLowerCase().includes(q) && !it.text.toLowerCase().includes(q)) {
          archiveItems.splice(i, 1);
        }
      }
    }

    archiveItems.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    if (archiveItems.length === 0) {
      archiveEl.innerHTML = `<div class="empty-state">Henüz bu filtreye uygun not veya erteleme kaydı yok.</div>`;
    } else {
      archiveItems.forEach((item) => {
        const div = document.createElement("div");
        div.className = "archive-note-item";
        div.innerHTML = `
          <div class="archive-note-meta">
            <span>${escapeHtml(item.type)}</span>
            <span>${formatShortTR(item.date)}</span>
          </div>
          <div class="archive-note-title">${escapeHtml(item.title)}</div>
          <div class="archive-note-text">${escapeHtml(item.text)}</div>
        `;
        archiveEl.appendChild(div);
      });
    }
  }

  // =========================================================
  // 6. GÖRÜNÜM: ÇÖP KUTUSU, ARŞİV & VERİ YÖNETİM MERKEZİ
  // =========================================================
  function renderTrashView() {
    const listEl = document.getElementById("trashCenterList");
    if (!listEl) return;

    const trashedOrArchivedRoutines = (state.routines || []).filter(
      (r) => r.status === "trashed" || r.status === "archived"
    );
    const trashedTasks = state.trashedTasks || [];
    const trashedGoals = state.trashedGoals || [];

    const totalCount =
      trashedOrArchivedRoutines.length + trashedTasks.length + trashedGoals.length;

    const cAll = document.getElementById("countTrashAll");
    const cRoutines = document.getElementById("countTrashRoutines");
    const cTasks = document.getElementById("countTrashTasks");
    const cGoals = document.getElementById("countTrashGoals");
    if (cAll) cAll.textContent = totalCount;
    if (cRoutines) cRoutines.textContent = trashedOrArchivedRoutines.length;
    if (cTasks) cTasks.textContent = trashedTasks.length;
    if (cGoals) cGoals.textContent = trashedGoals.length;

    document.querySelectorAll("[data-trash-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.trashFilter === uiState.trashFilter);
    });

    listEl.innerHTML = "";
    const filter = uiState.trashFilter || "all";

    let renderedCount = 0;

    // 1. Silinen ve Arşivlenen Rutinler (Önceki serileriyle birlikte)
    if (filter === "all" || filter === "routines") {
      trashedOrArchivedRoutines.forEach((r) => {
        renderedCount++;
        const history = calculateRoutineStreakHistory(r);
        const isArchived = r.status === "archived";
        const card = document.createElement("div");
        card.className = "routine-card";
        card.innerHTML = `
          <div class="routine-info">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <h4>${escapeHtml(r.title)}</h4>
              <span class="badge ${isArchived ? "badge-category" : "badge-priority-high"}">
                ${isArchived ? "Arşivlenmiş Rutin" : "Çöp Kutusunda (Rutin)"}
              </span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">${getRoutineFreqLabel(r)}</span>
              <span class="badge badge-streak">${icon("trophy", 13)}En Uzun Seri: ${r.bestStreak || 0} gün</span>
            </div>
            ${r.note ? `<div class="task-note-preview">${escapeHtml(r.note)}</div>` : ""}
            <div class="streak-history-box" style="margin-top:8px;">
              <div class="streak-history-title">
                <span>Önceki Serilerim (Ne Kadar Sürmüş?)</span>
                <span>Toplam ${history.length} seri</span>
              </div>
              ${
                history.length === 0
                  ? `<div style="font-size:11.5px;color:var(--text-muted);">Kayıtlı seri geçmişi yok.</div>`
                  : `<div class="streak-pill-list">
                      ${history
                        .slice(0, 5)
                        .map(
                          (h) => `
                          <div class="streak-history-item">
                            <span>${formatShortTR(h.start)} — ${formatShortTR(h.end)}</span>
                            <strong style="color:var(--warning);">${h.count} gün sürdü</strong>
                          </div>
                        `
                        )
                        .join("")}
                    </div>`
              }
            </div>
          </div>
          <div class="task-actions" style="opacity:1;">
            <button class="btn btn-primary btn-xs" data-action="restore-routine" data-id="${r.id}">
              ${icon("restore", 13)} Geri Yükle (Aktif Et)
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-routine" data-id="${r.id}">
              ${icon("trash", 13)} Kalıcı Sil
            </button>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    // 2. Silinen Görevler
    if (filter === "all" || filter === "tasks") {
      trashedTasks.forEach((t) => {
        renderedCount++;
        const card = document.createElement("div");
        card.className = "routine-card";
        card.innerHTML = `
          <div class="routine-info">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <h4>${escapeHtml(t.title)}</h4>
              <span class="badge badge-priority-high">Çöp Kutusunda (Görev)</span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">${escapeHtml(t.category || "Genel")}</span>
              ${t.date ? `<span class="badge badge-category">${icon("calendar", 13)}Görev Tarihi: ${formatShortTR(t.date)}</span>` : ""}
              ${(t.postponeCount || 0) > 0 ? `<span class="badge badge-postponed">${icon("hourglass", 13)}${t.postponeCount}x ertelendi</span>` : ""}
            </div>
            ${t.note ? `<div class="task-note-preview">${escapeHtml(t.note)}</div>` : ""}
          </div>
          <div class="task-actions" style="opacity:1;">
            <button class="btn btn-primary btn-xs" data-action="restore-trashed-task" data-id="${t.id}">
              ${icon("restore", 13)} Geri Yükle
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-trashed-task" data-id="${t.id}">
              ${icon("trash", 13)} Kalıcı Sil
            </button>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    // 3. Silinen Hedefler
    if (filter === "all" || filter === "goals") {
      trashedGoals.forEach((g) => {
        renderedCount++;
        const card = document.createElement("div");
        card.className = "routine-card";
        card.innerHTML = `
          <div class="routine-info">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <h4>${escapeHtml(g.title)}</h4>
              <span class="badge badge-priority-high">Çöp Kutusunda (Hedef)</span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">${g.horizon === "long" ? `${icon("mountain", 13)}Uzun Vadeli` : `${icon("bolt", 13)}Kısa Vadeli`}</span>
              <span class="badge badge-category">${escapeHtml(g.category || "Genel")}</span>
              ${g.targetDate ? `<span class="badge badge-category">${icon("flag", 13)}Vade: ${formatShortTR(g.targetDate)}</span>` : ""}
            </div>
            ${g.why ? `<div class="task-note-preview">${escapeHtml(g.why)}</div>` : ""}
          </div>
          <div class="task-actions" style="opacity:1;">
            <button class="btn btn-primary btn-xs" data-action="restore-trashed-goal" data-id="${g.id}">
              ${icon("restore", 13)} Geri Yükle
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-trashed-goal" data-id="${g.id}">
              ${icon("trash", 13)} Kalıcı Sil
            </button>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    if (renderedCount === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          Çöp kutusu ve arşiv şu an boş. Silinen görevler, hedefler ve rutinler burada güvende tutulur.
        </div>
      `;
    }
  }

  // =========================================================
  // 7. GÖRÜNÜM: NOTLARIM (DERLENMİŞ GÜNLÜK, HAFTALIK & GÖREV NOTLARIM)
  // =========================================================
  function renderNotesView() {
    const timelineEl = document.getElementById("compiledNotesTimeline");
    const summaryEl = document.getElementById("notesSummaryStrip");
    if (!timelineEl || !summaryEl) return;

    // Üstteki Tarih Seçiciyi ve Günlük Not Alanını Senkronize Et
    const dateInp = document.getElementById("inputNotesPageDate");
    const humanLabel = document.getElementById("notesPageDateHumanLabel");
    const contentArea = document.getElementById("textareaNotesPageContent");
    const targetDate = uiState.notesPageDateISO || getTodayISO();

    if (dateInp && document.activeElement !== dateInp) {
      dateInp.value = targetDate;
    }
    if (humanLabel) {
      humanLabel.textContent = `${formatFullTR(targetDate)} (${getRelativeDayLabel(targetDate)})`;
    }
    if (contentArea && document.activeElement !== contentArea) {
      contentArea.value = (state.dailyNotes && state.dailyNotes[targetDate]) || "";
    }

    // Tüm Notları Derle
    const dailyEntries = [];
    Object.entries(state.dailyNotes || {}).forEach(([dISO, text]) => {
      if (text && text.trim()) {
        const isAi = text.includes("#ai");
        dailyEntries.push({
          id: `daily_${dISO}`,
          category: "daily",
          isAi: isAi,
          badge: isAi ? "Günün Notu · #ai" : "Günün Notu",
          dateISO: dISO,
          dateTitle: formatFullTR(dISO),
          relativeLabel: getRelativeDayLabel(dISO),
          subtitle: isAi ? "Yapay Zeka Notu" : "Günlük Yansıma & Serbest Not",
          text: text.trim()
        });
      }
    });

    const weeklyEntries = [];
    Object.entries(state.weeklyNotes || {}).forEach(([wISO, text]) => {
      if (text && text.trim()) {
        weeklyEntries.push({
          id: `weekly_${wISO}`,
          category: "weekly",
          badge: "Haftalık Odak Notu",
          dateISO: wISO,
          dateTitle: `${formatWeekRangeTR(wISO)} Haftası`,
          relativeLabel: `Hafta Başlangıcı: ${formatShortTR(wISO)}`,
          subtitle: "Haftalık Strateji & Odak Notu",
          text: text.trim()
        });
      }
    });

    const taskGoalEntries = [];
    (state.tasks || []).forEach((t) => {
      if (t.note && t.note.trim()) {
        const dISO = t.date || t.weekMonday || t.createdAt || getTodayISO();
        taskGoalEntries.push({
          id: `task_${t.id}`,
          rawId: t.id,
          itemType: "task",
          category: "task_goal",
          badge: "Görev Altı Notu",
          dateISO: dISO,
          dateTitle: formatFullTR(dISO),
          relativeLabel: getRelativeDayLabel(dISO),
          subtitle: `Görev: ${t.title}`,
          text: t.note.trim()
        });
      }
    });

    (state.goals || []).forEach((g) => {
      if (g.why && g.why.trim()) {
        const dISO = g.startDate || g.createdAt || getTodayISO();
        taskGoalEntries.push({
          id: `goal_${g.id}`,
          rawId: g.id,
          itemType: "goal",
          category: "task_goal",
          badge: "Hedef & Vizyon Notu",
          dateISO: dISO,
          dateTitle: `Hedef Başlangıcı: ${formatFullTR(dISO)}`,
          relativeLabel: g.targetDate ? `Vade: ${formatShortTR(g.targetDate)}` : "Aktif Hedef",
          subtitle: `Hedef: ${g.title}`,
          text: g.why.trim()
        });
      }
    });

    const quoteEntries = [];
    (state.savedQuotes || []).forEach((sq) => {
      const dISO = sq.savedAt || getTodayISO();
      quoteEntries.push({
        id: `quote_${sq.id}`,
        rawId: sq.id,
        category: "quotes",
        badge: "Kaydedilen Günün Sözü",
        dateISO: dISO,
        dateTitle: `${formatFullTR(dISO)} tarihinde kaydedildi`,
        relativeLabel: getRelativeDayLabel(dISO),
        subtitle: `${sq.author} — ${sq.source || "Gerçek Alıntı"}`,
        text: `❝ "${sq.text}"`
      });
    });

    const reportEntries = [];
    (state.reports || []).forEach((r) => {
      const isAi =
        r.author === "ai" ||
        (r.content && r.content.includes("#ai")) ||
        (r.tags && r.tags.includes("#ai"));
      const dISO = r.date || (r.createdAt ? r.createdAt.slice(0, 10) : getTodayISO());
      reportEntries.push({
        id: `report_${r.id}`,
        rawId: r.id,
        itemType: "report",
        category: "reports",
        isAi: isAi,
        badge: isAi ? "Rapor · #ai" : "Şahsi Rapor",
        dateISO: dISO,
        dateTitle: formatFullTR(dISO),
        relativeLabel: getRelativeDayLabel(dISO),
        subtitle: `Rapor: ${r.title || "Çalışma & Oturum Raporu"}`,
        text: r.content ? r.content.trim() : ""
      });
    });

    const allCompiled = [
      ...dailyEntries,
      ...weeklyEntries,
      ...taskGoalEntries,
      ...reportEntries,
      ...quoteEntries
    ];

    // Üst İstatistik Şeridi
    summaryEl.innerHTML = `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("note", 15)}Günlük Not Yazılan Gün</div>
        <div class="summary-kpi-val">${dailyEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("calendar", 15)}Haftalık Odak Notları</div>
        <div class="summary-kpi-val">${weeklyEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("target", 15)}Görev & Hedef Notları</div>
        <div class="summary-kpi-val">${taskGoalEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("chart", 15)}Raporlar</div>
        <div class="summary-kpi-val">${reportEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">${icon("quote", 15)}Kaydedilen Günün Sözleri</div>
        <div class="summary-kpi-val">${quoteEntries.length}</div>
      </div>
    `;

    // Sekme Sayaçlarını Güncelle
    const cAll = document.getElementById("countNotesAll");
    const cDaily = document.getElementById("countNotesDaily");
    const cWeekly = document.getElementById("countNotesWeekly");
    const cTaskGoal = document.getElementById("countNotesTaskGoal");
    const cReports = document.getElementById("countNotesReports");
    const cQuotes = document.getElementById("countNotesQuotes");
    if (cAll) cAll.textContent = allCompiled.length;
    if (cDaily) cDaily.textContent = dailyEntries.length;
    if (cWeekly) cWeekly.textContent = weeklyEntries.length;
    if (cTaskGoal) cTaskGoal.textContent = taskGoalEntries.length;
    if (cReports) cReports.textContent = reportEntries.length;
    if (cQuotes) cQuotes.textContent = quoteEntries.length;

    const activeFilter = uiState.compiledNoteFilter || "all";
    document.querySelectorAll("[data-compiled-note-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.compiledNoteFilter === activeFilter);
    });

    // Günün Notları & Raporlar İçin AI / Şahsi Alt Filtresi
    const subFilterRow = document.getElementById("notesSubFilterRow");
    const subFilterLabel = document.getElementById("notesSubFilterLabel");
    const cSubAll = document.getElementById("countSubNotesAll");
    const cSubAi = document.getElementById("countSubNotesAi");
    const cSubUser = document.getElementById("countSubNotesUser");

    const activeSubFilter = uiState.noteSubFilter || "all";

    if (activeFilter === "daily" || activeFilter === "reports") {
      if (subFilterRow) subFilterRow.style.display = "flex";
      if (activeFilter === "daily") {
        if (subFilterLabel) subFilterLabel.textContent = "Günlük Not:";
        const aiDailyCount = dailyEntries.filter((d) => d.isAi).length;
        const userDailyCount = dailyEntries.filter((d) => !d.isAi).length;
        if (cSubAll) cSubAll.textContent = dailyEntries.length;
        if (cSubAi) cSubAi.textContent = aiDailyCount;
        if (cSubUser) cSubUser.textContent = userDailyCount;
      } else {
        if (subFilterLabel) subFilterLabel.textContent = "Rapor Filtresi:";
        const aiReportsCount = reportEntries.filter((r) => r.isAi).length;
        const userReportsCount = reportEntries.filter((r) => !r.isAi).length;
        if (cSubAll) cSubAll.textContent = reportEntries.length;
        if (cSubAi) cSubAi.textContent = aiReportsCount;
        if (cSubUser) cSubUser.textContent = userReportsCount;
      }
    } else {
      if (subFilterRow) subFilterRow.style.display = "none";
    }

    document.querySelectorAll("[data-note-subfilter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.noteSubfilter === activeSubFilter);
    });

    let filtered = allCompiled;
    if (activeFilter === "daily") {
      filtered = dailyEntries;
      if (activeSubFilter === "ai") {
        filtered = filtered.filter((d) => d.isAi);
      } else if (activeSubFilter === "user") {
        filtered = filtered.filter((d) => !d.isAi);
      }
    } else if (activeFilter === "reports") {
      filtered = reportEntries;
      if (activeSubFilter === "ai") {
        filtered = filtered.filter((r) => r.isAi);
      } else if (activeSubFilter === "user") {
        filtered = filtered.filter((r) => !r.isAi);
      }
    } else if (activeFilter !== "all") {
      filtered = allCompiled.filter((item) => item.category === activeFilter);
    }

    if (uiState.searchQuery) {
      const q = uiState.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (it) =>
          it.dateTitle.toLowerCase().includes(q) ||
          it.subtitle.toLowerCase().includes(q) ||
          it.text.toLowerCase().includes(q)
      );
    }

    // Kronolojik Sıralama (En yeni tarihten en eskiye)
    filtered.sort((a, b) => (b.dateISO || "").localeCompare(a.dateISO || ""));

    timelineEl.innerHTML = "";

    if (filtered.length === 0) {
      timelineEl.innerHTML = `
        <div class="empty-state">
          Bu filtrede henüz kayıtlı bir not veya rapor bulunmuyor. Yukarıdaki kutudan istediğin tarihi seçip hemen notunu veya raporunu yazabilirsin.
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const isReport = item.category === "reports";
      const isAiDaily = item.category === "daily" && item.isAi;
      let cardClass = `compiled-note-card type-${item.category}`;
      if (isReport) {
        cardClass += item.isAi ? " type-report-ai" : " type-report-user";
      } else if (isAiDaily) {
        cardClass += " type-report-ai";
      }
      const card = document.createElement("div");
      card.className = cardClass;

      let actionsHtml = "";
      if (item.category === "daily") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-note-date" data-date="${item.dateISO}">
            ${icon("calendar", 13)} O Güne Git
          </button>
          <button class="btn btn-secondary btn-xs" data-action="edit-daily-note-in-page" data-date="${item.dateISO}">
            ${icon("edit", 13)} Düzenle
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-daily-note" data-date="${item.dateISO}">
            ${icon("trash", 13)} Sil
          </button>
        `;
      } else if (item.category === "weekly") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-week-note" data-date="${item.dateISO}">
            ${icon("calendar", 13)} O Haftaya Git
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-weekly-note" data-date="${item.dateISO}">
            ${icon("trash", 13)} Sil
          </button>
        `;
      } else if (item.category === "task_goal") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-note-date" data-date="${item.dateISO}">
            ${icon("calendar", 13)} Tarihe Git
          </button>
          <button class="btn btn-secondary btn-xs" data-action="${item.itemType === "task" ? "edit-task" : "edit-goal"}" data-id="${item.rawId}">
            ${icon("edit", 13)} Düzenle
          </button>
        `;
      } else if (item.category === "reports") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-note-date" data-date="${item.dateISO}">
            ${icon("calendar", 13)} O Güne Git
          </button>
          <button class="btn btn-secondary btn-xs" data-action="edit-report" data-id="${item.rawId}">
            ${icon("edit", 13)} Düzenle
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-report" data-id="${item.rawId}">
            ${icon("trash", 13)} Sil
          </button>
        `;
      } else if (item.category === "quotes") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-saved-quote" data-id="${item.rawId}">
            ${icon("trash", 13)} Koleksiyondan Kaldır
          </button>
        `;
      }

      let badgeHtml = `<span class="badge badge-category">${item.badge}</span>`;
      if (isReport) {
        badgeHtml = item.isAi
          ? `<span class="badge badge-ai">Yapay Zeka · #ai</span>`
          : `<span class="badge badge-user">Şahsi Rapor</span>`;
      } else if (isAiDaily) {
        badgeHtml = `<span class="badge badge-ai">Günün Notu · #ai</span>`;
      }

      let textHtml = escapeHtml(item.text);
      if (isReport || isAiDaily) {
        textHtml = textHtml.replace(/(#ai\b)/gi, `<span class="tag-ai">$1</span>`);
      }

      card.innerHTML = `
        <div class="compiled-note-header">
          <div class="compiled-note-date-box">
            ${badgeHtml}
            <span class="compiled-note-date-main">${escapeHtml(item.dateTitle)}</span>
            <span class="badge badge-streak">${escapeHtml(item.relativeLabel)}</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${actionsHtml}
          </div>
        </div>
        <div class="compiled-note-title">${escapeHtml(item.subtitle)}</div>
        <div class="compiled-note-body">${textHtml}</div>
      `;

      timelineEl.appendChild(card);
    });
  }

  // =========================================================
  // GÖRÜNÜM GEÇİŞLERİ (VIEW NAVIGATION)
  // =========================================================
  const VIEW_META = {
    daily: {
      title: "Günün Odağı",
      subtitle: "Saat baskısı olmadan, adım adım sürdürülebilir günlük ve haftalık ilerleme."
    },
    weekly: {
      title: "Haftalık Panoramik Plan",
      subtitle: "Haftanın 7 gününü ve esnek görev havuzunu tek bakışta yönet."
    },
    calendar: {
      title: "Takvim (Gün / Ay / Yıl)",
      subtitle: "Görevlerini, hedef vadelerini ve rutinlerini gün gün, ay ay ve yıl yıl takvim üzerinde incele."
    },
    timer: {
      title: "Odak & Ders Zamanlayıcısı",
      subtitle: "Ders, kısa mola ve uzun mola sürelerini ses efektleri ve odak ambiyansı eşliğinde yönet."
    },
    goals: {
      title: "Hedef Pusulası (Kısa & Uzun Vadeli)",
      subtitle: "Vadeleri, kalan süreleri ve bağlı görevlerle otomatik güncellenen hedeflerin."
    },
    routines: {
      title: "Tekrarlayan Görevler & Rutinler",
      subtitle: "Sürdürülebilir alışkanlıkların, önceki serilerin, arşiv ve çöp kutusu yönetimin."
    },
    notes: {
      title: "Notlarım (Derlenmiş Not Defterim)",
      subtitle: "Hangi gün ne yazdığını, günün notlarını, görev/hedef notlarını ve kaydettiğin sözleri kronolojik olarak tek sayfada incele."
    },
    reports: {
      title: "📊 Raporlar & Oturum Kayıtları",
      subtitle: "Ders devirleri, pointmark özetleri, yapay zeka oturum raporları ve kendi hazırladığın süreç raporları."
    },
    insights: {
      title: "Erteleme & Not Arşivi",
      subtitle: "Ertelenen görevlerin analizi ve görev/gün altına yazdığın tüm notlar."
    },
    trash: {
      title: "Çöp Kutusu, Arşiv & Veri Yönetimi",
      subtitle: "Silinen görev, rutin ve hedeflerini geri yükle, kalıcı sil veya tüm verileri sıfırla."
    }
  };

  function switchView(viewName) {
    uiState.currentView = viewName;
    try {
      localStorage.setItem("pusula_active_view_v1", viewName);
    } catch (_) {}
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
      if (btn.dataset.view === viewName) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    document.querySelectorAll(".view-section").forEach((sec) => {
      const isTarget = sec.id === `view-${viewName}`;
      sec.classList.toggle("active", isTarget);
    });
    if (VIEW_META[viewName]) {
      document.getElementById("viewTitle").textContent = VIEW_META[viewName].title;
      document.getElementById("viewSubtitle").textContent = VIEW_META[viewName].subtitle;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderAll();
  }

  // =========================================================
  // MODALLAR VE ETKİLEŞİMLER
  // =========================================================
  function openModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
  }

  function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  function openTaskModal(task = null, prefillGoalId = "", prefillScope = "day") {
    const titleEl = document.getElementById("modalTaskTitle");
    const idInput = document.getElementById("taskModalId");
    const nameInput = document.getElementById("taskModalName");
    const scopeSel = document.getElementById("taskModalScope");
    const dateInput = document.getElementById("taskModalDate");
    const weekDateInput = document.getElementById("taskModalWeekDate");
    const goalSel = document.getElementById("taskModalGoal");
    const prioSel = document.getElementById("taskModalPriority");
    const catSel = document.getElementById("taskModalCategory");
    const noteInput = document.getElementById("taskModalNote");

    populateGoalDropdowns();

    if (task) {
      titleEl.textContent = "✏️ Görevi Düzenle";
      idInput.value = task.id;
      nameInput.value = task.title;
      scopeSel.value = task.scope || "day";
      dateInput.value = task.date || uiState.selectedDateISO;
      weekDateInput.value = task.weekMonday || uiState.selectedWeekMondayISO;
      goalSel.value = task.goalId || "";
      prioSel.value = task.priority || "normal";
      catSel.value = task.category || "Genel";
      noteInput.value = task.note || "";
      uiState.modalSubtasksTemp = JSON.parse(JSON.stringify(task.subtasks || []));
    } else {
      titleEl.textContent = "＋ Yeni Görev Ekle";
      idInput.value = "";
      nameInput.value = "";
      scopeSel.value = prefillScope;
      dateInput.value = uiState.selectedDateISO;
      weekDateInput.value = uiState.selectedWeekMondayISO;
      goalSel.value = prefillGoalId || "";
      prioSel.value = "normal";
      catSel.value = "Genel";
      noteInput.value = "";
      uiState.modalSubtasksTemp = [];
    }

    syncTaskModalScopeVisibility();
    renderModalSubtasksEditor();
    openModal("modalTask");
    setTimeout(() => nameInput.focus(), 50);
  }

  function syncTaskModalScopeVisibility() {
    const scope = document.getElementById("taskModalScope").value;
    document.getElementById("taskModalDateGroup").classList.toggle("hidden", scope === "week");
    document.getElementById("taskModalWeekGroup").classList.toggle("hidden", scope !== "week");
  }

  function renderModalSubtasksEditor() {
    const container = document.getElementById("taskModalSubtasksList");
    container.innerHTML = "";
    uiState.modalSubtasksTemp.forEach((st, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:var(--bg-input);padding:6px 10px;border-radius:6px;font-size:12.5px;";
      row.innerHTML = `
        <span>☑️ ${escapeHtml(st.text)}</span>
        <button type="button" class="action-btn" data-remove-subtask="${idx}">✕</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        uiState.modalSubtasksTemp.splice(idx, 1);
        renderModalSubtasksEditor();
      });
      container.appendChild(row);
    });
  }

  // Erteleme Modalı Aç
  let currentPostponeOpt = "tomorrow";
  function openPostponeModal(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    document.getElementById("postponeTaskId").value = task.id;
    document.getElementById("postponeTaskTitleDisplay").textContent = `📌 ${task.title}`;
    document.getElementById("postponeReasonInput").value = "";

    const baseDate = task.date && task.date >= getTodayISO() ? task.date : getTodayISO();
    const tomorrow = addDaysISO(baseDate, 1);
    document.getElementById("postponeTargetDate").value = tomorrow;

    currentPostponeOpt = "tomorrow";
    document.querySelectorAll(".postpone-chip").forEach((c) => {
      c.classList.toggle("active", c.dataset.postponeOpt === "tomorrow");
    });
    document.getElementById("postponeCustomDateGroup").classList.remove("hidden");

    openModal("modalPostpone");
  }

  // Hedef Modalı Aç
  function openGoalModal(goal = null) {
    populateGoalDropdowns();
    const titleEl = document.getElementById("modalGoalTitle");
    const idInput = document.getElementById("goalModalId");
    const nameInput = document.getElementById("goalModalName");
    const horizonSel = document.getElementById("goalModalHorizon");
    const catSel = document.getElementById("goalModalCategory");
    const startInput = document.getElementById("goalModalStartDate");
    const targetInput = document.getElementById("goalModalTargetDate");
    const parentSel = document.getElementById("goalModalParent");
    const whyInput = document.getElementById("goalModalWhy");

    const today = getTodayISO();
    if (goal) {
      titleEl.textContent = "Hedefi Düzenle";
      idInput.value = goal.id;
      nameInput.value = goal.title;
      horizonSel.value = goal.horizon || "short";
      catSel.value = goal.category || "Kariyer & Eğitim";
      startInput.value = goal.startDate || today;
      targetInput.value = goal.targetDate || addDaysISO(today, 30);
      parentSel.value = goal.parentId || "";
      whyInput.value = goal.why || "";
      uiState.modalMilestonesTemp = JSON.parse(JSON.stringify(goal.milestones || []));
    } else {
      titleEl.textContent = "Yeni Hedef Tanımla";
      idInput.value = "";
      nameInput.value = "";
      horizonSel.value = "short";
      catSel.value = "Kariyer & Eğitim";
      startInput.value = today;
      targetInput.value = addDaysISO(today, 30);
      parentSel.value = "";
      whyInput.value = "";
      uiState.modalMilestonesTemp = [];
    }

    renderModalMilestonesEditor();
    openModal("modalGoal");
    setTimeout(() => nameInput.focus(), 50);
  }

  function renderModalMilestonesEditor() {
    const container = document.getElementById("goalModalMilestonesList");
    container.innerHTML = "";
    uiState.modalMilestonesTemp.forEach((m, idx) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;background:var(--bg-input);padding:6px 10px;border-radius:6px;font-size:12.5px;";
      row.innerHTML = `
        <span>🚩 ${escapeHtml(m.text)}</span>
        <button type="button" class="action-btn">✕</button>
      `;
      row.querySelector("button").addEventListener("click", () => {
        uiState.modalMilestonesTemp.splice(idx, 1);
        renderModalMilestonesEditor();
      });
      container.appendChild(row);
    });
  }

  // Rutin Modalı Aç
  function openRoutineModal(routine = null) {
    populateGoalDropdowns();
    const idInput = document.getElementById("routineModalId");
    const nameInput = document.getElementById("routineModalName");
    const freqSel = document.getElementById("routineModalFreq");
    const goalSel = document.getElementById("routineModalGoal");
    const noteInput = document.getElementById("routineModalNote");

    if (routine) {
      document.getElementById("modalRoutineTitle").textContent = "Tekrarlayan Görevi Düzenle";
      idInput.value = routine.id;
      nameInput.value = routine.title;
      freqSel.value = routine.freq || "daily";
      goalSel.value = routine.goalId || "";
      noteInput.value = routine.note || "";
      const days = routine.customDays || [1, 3, 5];
      document.querySelectorAll("#routineWeekdaySelector .day-toggle").forEach((btn) => {
        btn.classList.toggle("active", days.includes(Number(btn.dataset.day)));
      });
    } else {
      document.getElementById("modalRoutineTitle").textContent = "Tekrarlayan Görev (Rutin) Ekle";
      idInput.value = "";
      nameInput.value = "";
      freqSel.value = "daily";
      goalSel.value = "";
      noteInput.value = "";
    }

    document
      .getElementById("routineCustomDaysGroup")
      .classList.toggle("hidden", freqSel.value !== "custom_days");
    openModal("modalRoutine");
    setTimeout(() => nameInput.focus(), 50);
  }

  // =========================================================
  // TEMA YÖNETİMİ
  // =========================================================
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
  }

  // =========================================================
  // GÜVENLİ HTML ESCAPE
  // =========================================================
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =========================================================
  // EVENT LISTENERS (OLAY DİNLEYİCİLERİ)
  // =========================================================
  // =========================================================
  // ORTAK POMODORO ÇALIŞMA ODASI (P2P WEBRTC — PEERJS)
  // ---------------------------------------------------------
  // Yıldız topoloji: oda kurucusu (host) merkezdir, misafirler yalnızca
  // host'a bağlanır. Host her misafirden gelen ROOM_RELAY_TYPES türündeki
  // mesajı uygular ve diğer misafirlere olduğu gibi iletir.
  //
  // Mesaj zarfı: { v, type, from (clientId), name, ts, ...alanlar }
  //   HELLO        misafir → host   { resume }
  //   WELCOME      host → misafir   { hostName, participants, timer, maxGuests }
  //   PARTICIPANTS host → herkes    { participants: [{ id, name, isHost, status }] }
  //   TIMER        herkes (relay)   { action, data, state }  state = sayaç anlık görüntüsü
  //   PING / PONG  iki yönlü        { t, timer? }  (host PING'i sayaç görüntüsü taşır)
  //   BYE          misafir → host   bilinçli ayrılma
  //   ROOM_CLOSED  host → herkes    oda kapatıldı
  //   ROOM_FULL    host → misafir   oda dolu
  //   REPLACED     host → eski bağlantı  aynı kişi başka bağlantıdan geldi
  //   STATUS       misafir → host   { work: { text, done } | null }  "şu an ne çalışıyorum";
  //                host saklar ve PARTICIPANTS ile herkese dağıtır (ham hali iletilmez)
  //   CHAT         herkes (relay)   { text }  mola sohbeti; host ders sırasında reddeder
  //   (PARTICIPANTS/WELCOME içindeki her katılımcı { work } taşır; WELCOME { chat } geçmişi de taşır)
  // Yeni özellik eklemek için: türü ROOM_RELAY_TYPES'a ekle ve
  // ROOM_MESSAGE_HANDLERS içine bir işleyici yaz.
  // =========================================================
  const ROOM_PROTOCOL_VERSION = 1;
  const ROOM_PEER_PREFIX = "pusulapp-room-";
  const ROOM_CODE_PREFIX = "PUSULA-";
  const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 0/O, 1/I/L yok
  const ROOM_CODE_LENGTH = 5;
  const ROOM_MAX_GUESTS = 8;
  const ROOM_SESSION_KEY = "pusulapp_room_session_v1";
  const ROOM_CLIENT_ID_KEY = "pusulapp_room_client_id_v1";
  const ROOM_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
  const ROOM_HEARTBEAT_MS = 4000;
  const ROOM_SILENCE_TIMEOUT_MS = 15000;
  const ROOM_GUEST_GRACE_MS = 90000;
  const ROOM_RECONNECT_WINDOW_MS = 90000;
  const ROOM_INITIAL_JOIN_WINDOW_MS = 25000;
  const ROOM_CONNECT_TIMEOUT_MS = 10000;
  const ROOM_HOST_RECLAIM_WINDOW_MS = 60000;
  const ROOM_SYNC_GUARD_MS = 3000;
  const ROOM_RELAY_TYPES = new Set(["TIMER", "STATUS", "CHAT"]);
  const ROOM_WORK_MAX_LEN = 80;
  const ROOM_CHAT_MAX_LEN = 240;
  const ROOM_CHAT_MAX_COUNT = 60;
  const ROOM_CHAT_WELCOME_COUNT = 30;
  const ROOM_CHAT_MIN_INTERVAL_MS = 400;
  const ROOM_WORK_KEY = "pusulapp_room_work_v1";

  let roomState = {
    peer: null,
    conn: null, // misafir: host'a olan güncel bağlantı
    isHost: false,
    isWaiting: false,
    roomCode: null,
    connectedPeerName: null,
    myUserName: "Ben",
    clientId: null,
    status: "idle", // 'idle' | 'opening' | 'open' | 'connecting' | 'connected' | 'reconnecting'
    guests: new Map(), // host: clientId -> { conn, name, status, lastSeen, joinedAt, graceTimer }
    participants: [], // misafir: host'tan gelen son liste
    hostName: null,
    everConnected: false,
    lastSeen: 0,
    heartbeatTimer: null,
    reconnectTimer: null,
    reconnectStartedAt: 0,
    reconnectAttempt: 0,
    connectTimeoutTimer: null,
    signalingRetryTimer: null,
    signalingRetryAttempt: 0,
    hostOpenTimer: null,
    hostOpenFailures: 0,
    createAttempt: 0,
    reclaiming: false,
    reclaimStartedAt: 0,
    lastTimerActivityAt: 0,
    myWork: null, // { text, done } — "şu an ne çalışıyorum"
    myWorkKnown: false, // bu sekme bu oda için durumunu kendisi belirlediyse true
    chat: [], // [{ from, name, text, ts }] — yalnızca bellekte
    chatUnread: 0,
    sessionToken: 0 // her oda oturumunda artar; eski peer/bağlantı olaylarını ayıklar
  };

  // ---------- Yardımcılar ----------
  function getRoomClientId() {
    if (roomState.clientId) return roomState.clientId;
    let id = null;
    try { id = sessionStorage.getItem(ROOM_CLIENT_ID_KEY); } catch (_) {}
    if (!id) {
      id = "c" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try { sessionStorage.setItem(ROOM_CLIENT_ID_KEY, id); } catch (_) {}
    }
    roomState.clientId = id;
    return id;
  }

  function generateRoomCode() {
    const n = ROOM_CODE_ALPHABET.length;
    const buf = new Uint32Array(ROOM_CODE_LENGTH);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(buf);
    } else {
      for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 4294967296);
    }
    let s = "";
    for (let i = 0; i < buf.length; i++) s += ROOM_CODE_ALPHABET[buf[i] % n];
    return ROOM_CODE_PREFIX + s;
  }

  function normalizeRoomCode(input) {
    let s = String(input || "").trim();
    const m = s.match(/[?&]room=([^&#\s]+)/i);
    if (m) s = decodeURIComponent(m[1]);
    s = s.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!s) return "";
    if (s.startsWith("PUSULA-")) return s;
    if (s.startsWith("PUSULA")) return ROOM_CODE_PREFIX + s.slice(6);
    return ROOM_CODE_PREFIX + s;
  }

  function roomPeerIdFor(code) {
    return ROOM_PEER_PREFIX + String(code).toLowerCase();
  }

  function sanitizeRoomName(name) {
    return String(name || "").trim().slice(0, 20) || "Arkadaşın";
  }

  function readRoomNameInput() {
    const nameInput = document.getElementById("inputRoomUserName");
    const name = (nameInput && nameInput.value.trim()) || roomState.myUserName || "Ben";
    roomState.myUserName = name.slice(0, 20);
    try { localStorage.setItem("pusulapp_user_name", roomState.myUserName); } catch (_) {}
    return roomState.myUserName;
  }

  function isRoomTokenStale(token) {
    return token !== roomState.sessionToken;
  }

  function saveRoomSession(role) {
    try {
      sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({
        role,
        code: roomState.roomCode,
        name: roomState.myUserName,
        savedAt: Date.now()
      }));
    } catch (_) {}
  }

  function loadRoomSession() {
    try {
      const raw = sessionStorage.getItem(ROOM_SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.code || (s.role !== "host" && s.role !== "guest")) return null;
      if (!s.savedAt || Date.now() - s.savedAt > ROOM_SESSION_MAX_AGE_MS) return null;
      return s;
    } catch (_) {
      return null;
    }
  }

  function clearRoomSession() {
    try { sessionStorage.removeItem(ROOM_SESSION_KEY); } catch (_) {}
    try { sessionStorage.removeItem(ROOM_WORK_KEY); } catch (_) {}
  }

  // ---------- "Şu an ne çalışıyorum" & mola sohbeti yardımcıları ----------
  // Eşlerden gelen her şey güvenilmez girdidir: tür ve uzunluk burada doğrulanır.
  function sanitizeWork(w) {
    if (!w || typeof w !== "object") return null;
    const text = typeof w.text === "string" ? w.text.replace(/\s+/g, " ").trim().slice(0, ROOM_WORK_MAX_LEN) : "";
    if (!text) return null;
    return { text, done: w.done === true };
  }

  function sameWork(a, b) {
    if (!a || !b) return !a && !b;
    return a.text === b.text && a.done === b.done;
  }

  function sanitizeChatText(t) {
    if (typeof t !== "string") return "";
    return t.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, ROOM_CHAT_MAX_LEN);
  }

  function sanitizeChatEntry(m) {
    if (!m || typeof m !== "object") return null;
    const text = sanitizeChatText(m.text);
    if (!text) return null;
    const ts = typeof m.ts === "number" && isFinite(m.ts) ? m.ts : Date.now();
    return { from: String(m.from || "").slice(0, 64), name: sanitizeRoomName(m.name), text, ts };
  }

  function sanitizeParticipants(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, ROOM_MAX_GUESTS + 1).filter((p) => p && typeof p === "object").map((p) => ({
      id: String(p.id || "").slice(0, 64),
      name: sanitizeRoomName(p.name),
      isHost: p.isHost === true,
      status: p.status === "connected" || p.status === "reconnecting" ? p.status : "unknown",
      work: sanitizeWork(p.work)
    }));
  }

  function saveMyWork() {
    try {
      sessionStorage.setItem(ROOM_WORK_KEY, JSON.stringify({ code: roomState.roomCode, work: roomState.myWork }));
    } catch (_) {}
  }

  function loadMyWork(code) {
    roomState.myWork = null;
    roomState.myWorkKnown = false;
    try {
      const raw = sessionStorage.getItem(ROOM_WORK_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s || s.code !== code) return;
      roomState.myWork = sanitizeWork(s.work);
      roomState.myWorkKnown = true;
    } catch (_) {}
  }

  function setMyWork(work) {
    if (!roomState.roomCode) return;
    roomState.myWork = sanitizeWork(work);
    roomState.myWorkKnown = true;
    saveMyWork();
    if (roomState.isHost) broadcastParticipants();
    else sendRoomMessage(makeRoomMessage("STATUS", { work: roomState.myWork }));
    updateRoomUI();
  }

  function isRoomChatLocked() {
    const t = uiState.timer;
    return t.mode === "study" && !!t.running;
  }

  function pushRoomChat(entry) {
    if (!entry) return;
    roomState.chat.push(entry);
    if (roomState.chat.length > ROOM_CHAT_MAX_COUNT) roomState.chat.splice(0, roomState.chat.length - ROOM_CHAT_MAX_COUNT);
    if (entry.from !== getRoomClientId() && !isRoomChatInView()) roomState.chatUnread++;
    renderRoomChat();
  }

  function sendRoomChat(text) {
    if (!roomState.roomCode) return;
    const clean = sanitizeChatText(text);
    if (!clean) return;
    if (isRoomChatLocked()) {
      showToast("🔒 Ders sırasında sohbet kapalı, molada yazabilirsin.");
      return;
    }
    const linked = roomState.isHost || roomState.status === "connected";
    if (!linked) {
      showToast("📡 Odaya bağlı değilsin, mesaj gönderilemedi.");
      return;
    }
    const msg = makeRoomMessage("CHAT", { text: clean });
    sendRoomMessage(msg);
    pushRoomChat({ from: msg.from, name: msg.name, text: clean, ts: msg.ts });
  }

  // Ortak seri: başka biriyle aynı odada ders oturumu tamamlanan art arda günler
  function normalizeRoomStreak(r) {
    const o = r && typeof r === "object" ? r : {};
    const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);
    const lastDay = typeof o.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.lastDay) ? o.lastDay : null;
    const current = n(o.current);
    return { current, best: Math.max(n(o.best), current), lastDay };
  }

  function getRoomStreak() {
    state.roomStreak = normalizeRoomStreak(state.roomStreak);
    return state.roomStreak;
  }

  // Seri bugün ya da dün beslendiyse hâlâ canlıdır
  function getLiveRoomStreak() {
    const rs = getRoomStreak();
    const today = getTodayISO();
    const alive = rs.lastDay === today || rs.lastDay === addDaysISO(today, -1);
    return { current: alive ? rs.current : 0, best: rs.best, today: rs.lastDay === today };
  }

  // true dönerse seri bugün ilk kez arttı
  function recordRoomStudyDay(today) {
    const rs = getRoomStreak();
    if (rs.lastDay === today) return false;
    rs.current = rs.lastDay === addDaysISO(today, -1) ? rs.current + 1 : 1;
    rs.lastDay = today;
    rs.best = Math.max(rs.best, rs.current);
    return true;
  }

  function isInRoomWithOthers() {
    if (!roomState.roomCode) return false;
    if (roomState.isHost) {
      let any = false;
      roomState.guests.forEach((e) => { if (e.status === "connected") any = true; });
      return any;
    }
    return roomState.status === "connected";
  }

  function makeRoomMessage(type, payload = {}) {
    return Object.assign({
      v: ROOM_PROTOCOL_VERSION,
      type,
      from: getRoomClientId(),
      name: roomState.myUserName,
      ts: Date.now()
    }, payload);
  }

  function sendTo(conn, msg) {
    if (!conn || !conn.open) return false;
    try {
      conn.send(msg);
      return true;
    } catch (err) {
      console.warn("PeerJS send error:", err);
      return false;
    }
  }

  // Host: tüm bağlı misafirlere (exceptId hariç). Misafir: host'a.
  function sendRoomMessage(msg, exceptId = null) {
    if (roomState.isHost) {
      roomState.guests.forEach((entry, id) => {
        if (id !== exceptId && entry.conn && entry.status === "connected") sendTo(entry.conn, msg);
      });
    } else if (roomState.status === "connected") {
      sendTo(roomState.conn, msg);
    }
  }

  // ---------- Sayaç anlık görüntüsü ----------
  // Saat farkından etkilenmemek için mutlak zaman yerine kalan milisaniye gönderilir.
  function getTimerSnapshot() {
    const t = uiState.timer;
    const running = !!(t.running && t.targetTimestamp);
    const remainingMs = running ? Math.max(0, t.targetTimestamp - Date.now()) : t.remainingSeconds * 1000;
    return {
      mode: t.mode,
      totalSeconds: t.totalSeconds,
      remainingSeconds: Math.round(remainingMs / 1000),
      remainingMs,
      running
    };
  }

  function applyTimerSnapshot(s) {
    if (!s || typeof s !== "object") return;
    const t = uiState.timer;
    if (typeof s.mode === "string") t.mode = s.mode;
    if (typeof s.totalSeconds === "number" && s.totalSeconds > 0) t.totalSeconds = s.totalSeconds;
    let ms = t.remainingSeconds * 1000;
    if (typeof s.remainingMs === "number") ms = s.remainingMs;
    else if (typeof s.remainingSeconds === "number") ms = s.remainingSeconds * 1000;
    ms = Math.max(0, ms);
    if (s.running && ms > 0) {
      t.running = true;
      t.targetTimestamp = Date.now() + ms;
    } else {
      t.running = false;
      t.targetTimestamp = null;
    }
    t.remainingSeconds = Math.round(ms / 1000);
    roomState.lastTimerActivityAt = Date.now();
    saveTimerState();
    updateTimerDOM();
  }

  function timerDiffersFromSnapshot(s) {
    const local = getTimerSnapshot();
    if (local.mode !== s.mode || local.running !== !!s.running || local.totalSeconds !== s.totalSeconds) return true;
    return Math.abs(local.remainingMs - (typeof s.remainingMs === "number" ? s.remainingMs : 0)) > 1500;
  }

  // Misafir: host'un düzenli gönderdiği görüntüyle sessiz kayma düzeltmesi
  function maybeCorrectTimerDrift(s) {
    if (!s || roomState.isHost) return;
    if (Date.now() - roomState.lastTimerActivityAt < ROOM_SYNC_GUARD_MS) return;
    const t = uiState.timer;
    if (t.running && t.remainingSeconds <= 3) return;
    if (s.running && s.remainingMs <= 3000) return;
    if (timerDiffersFromSnapshot(s)) applyTimerSnapshot(s);
  }

  // Eski sürüm mesajları için (state alanı yoksa) veri alanından görüntü üret
  function legacyTimerSnapshot(action, data) {
    const t = uiState.timer;
    const num = (v, fb) => (typeof v === "number" ? v : fb);
    const total = num(data.totalSeconds, t.totalSeconds);
    return {
      mode: data.mode || t.mode,
      totalSeconds: total,
      remainingSeconds: num(data.remainingSeconds, action === "PAUSE" ? t.remainingSeconds : total),
      running: action === "START"
    };
  }

  function broadcastTimerAction(action, data = {}) {
    if (!roomState.roomCode) return;
    roomState.lastTimerActivityAt = Date.now();
    sendRoomMessage(makeRoomMessage("TIMER", { action, data, state: getTimerSnapshot() }));
  }

  // false dönerse host bu mesajı diğer misafirlere iletmez
  function handleIncomingTimerAction(msg) {
    if (!msg) return;
    const action = msg.action;
    const data = msg.data || {};
    const sender = msg.name || msg.sender || "Arkadaşın";
    const snap = msg.state || legacyTimerSnapshot(action, data);

    if (action === "SWITCH_MODE" && data.reason === "complete") {
      // Herkesin sayacı kendi başına biter; bu mesaj yalnızca geride kalanı yakalar.
      const t = uiState.timer;
      const nearEnd = t.running && t.mode === data.fromMode && t.remainingSeconds <= 5;
      if (roomState.isHost) {
        if (nearEnd) handleTimerComplete(false);
        return false;
      }
      if (nearEnd) {
        handleTimerComplete(true);
        applyTimerSnapshot(snap);
        return;
      }
      if (!t.running && t.mode === snap.mode && t.totalSeconds === snap.totalSeconds) return;
      applyTimerSnapshot(snap);
      return;
    }

    applyTimerSnapshot(snap);
    if (action === "START") {
      showToast(`▶️ ${sender} sayacı başlattı!`);
    } else if (action === "PAUSE") {
      showToast(`⏸️ ${sender} sayacı duraklattı.`);
    } else if (action === "RESET") {
      showToast(`🔄 ${sender} sayacı sıfırladı.`);
    } else if (action === "SWITCH_MODE") {
      showToast(`🔀 ${sender} oturumu değiştirdi: ${snap.mode === "study" ? "Ders" : "Mola"}`);
    }
  }

  // ---------- Mesaj işleyicileri ----------
  // Host yalnızca PING/PONG ve ROOM_RELAY_TYPES türlerini misafirden kabul eder.
  const ROOM_MESSAGE_HANDLERS = {
    TIMER(msg) {
      return handleIncomingTimerAction(msg);
    },
    PING(msg, conn) {
      sendTo(conn, makeRoomMessage("PONG", { t: msg.t }));
      if (!roomState.isHost && msg.timer) maybeCorrectTimerDrift(msg.timer);
    },
    PONG() {},
    WELCOME(msg) {
      if (roomState.isHost) return;
      clearTimeout(roomState.connectTimeoutTimer);
      clearTimeout(roomState.reconnectTimer);
      roomState.connectTimeoutTimer = null;
      roomState.reconnectTimer = null;
      const wasReconnecting = roomState.everConnected;
      roomState.status = "connected";
      roomState.isWaiting = false;
      roomState.everConnected = true;
      roomState.reconnectStartedAt = 0;
      roomState.reconnectAttempt = 0;
      roomState.hostName = sanitizeRoomName(msg.hostName || msg.name);
      roomState.connectedPeerName = roomState.hostName;
      roomState.participants = sanitizeParticipants(msg.participants);
      // Host yeniden açıldıysa geçmişi boştur; o durumda yerel sohbeti koru
      if (Array.isArray(msg.chat) && msg.chat.length > 0) {
        roomState.chat = msg.chat.slice(-ROOM_CHAT_MAX_COUNT).map(sanitizeChatEntry).filter(Boolean);
        renderRoomChat();
      }
      // Durum satırı: bu sekme kendi durumunu biliyorsa o geçerli, bilmiyorsa host'takini benimse
      const mine = roomState.participants.find((p) => p.id === getRoomClientId());
      const hostWork = mine ? mine.work : null;
      if (roomState.myWorkKnown) {
        if (!sameWork(hostWork, roomState.myWork)) {
          sendRoomMessage(makeRoomMessage("STATUS", { work: roomState.myWork }));
        }
      } else if (hostWork) {
        roomState.myWork = hostWork;
        roomState.myWorkKnown = true;
        saveMyWork();
      }
      applyTimerSnapshot(msg.timer);
      saveRoomSession("guest");
      updateRoomUI();
      showToast(wasReconnecting
        ? "✅ Yeniden bağlandın! Sayaç odayla eşitlendi."
        : `🎉 ${roomState.hostName} odasına bağlandın! Sayaç eşitlendi.`);
    },
    PARTICIPANTS(msg) {
      if (roomState.isHost) return;
      roomState.participants = sanitizeParticipants(msg.participants);
      updateRoomUI();
    },
    // Yalnızca host işler; durumu saklar ve PARTICIPANTS ile dağıtır
    STATUS(msg) {
      if (!roomState.isHost) return false;
      const entry = roomState.guests.get(msg.from);
      if (!entry) return false;
      const work = sanitizeWork(msg.work);
      if (!sameWork(entry.work || null, work)) {
        entry.work = work;
        broadcastParticipants();
        updateRoomUI();
      }
      return false;
    },
    CHAT(msg) {
      const text = sanitizeChatText(msg.text);
      if (!text) return false;
      if (roomState.isHost) {
        const entry = roomState.guests.get(msg.from);
        if (!entry) return false;
        const now = Date.now();
        if (now - (entry.lastChatAt || 0) < ROOM_CHAT_MIN_INTERVAL_MS) return false;
        if (isRoomChatLocked()) return false; // ders sırasında sohbet kapalı
        entry.lastChatAt = now;
        msg.text = text;
        msg.ts = now;
      }
      pushRoomChat(sanitizeChatEntry(msg));
    },
    ROOM_CLOSED(msg) {
      if (roomState.isHost) return;
      teardownRoom({ notifyPeers: false });
      clearRoomSession();
      showToast(`🛑 ${msg.name || "Oda kurucusu"} odayı kapattı. Bireysel moda dönüldü.`);
    },
    ROOM_FULL(msg) {
      if (roomState.isHost) return;
      teardownRoom({ notifyPeers: false });
      clearRoomSession();
      showToast(`⚠️ Oda dolu (en fazla ${msg.maxGuests || ROOM_MAX_GUESTS} arkadaş katılabilir).`);
    },
    REPLACED() {
      if (roomState.isHost) return;
      teardownRoom({ notifyPeers: false });
      clearRoomSession();
      showToast("ℹ️ Bu odaya başka bir sekmeden bağlandın, bu sekme odadan çıktı.");
    }
  };
  const ROOM_HOST_ACCEPTS = new Set(["PING", "PONG"]);

  // ---------- Kalp atışı ----------
  function startRoomHeartbeat() {
    if (roomState.heartbeatTimer) return;
    roomState.heartbeatTimer = setInterval(roomHeartbeatTick, ROOM_HEARTBEAT_MS);
  }

  function roomHeartbeatTick() {
    if (!roomState.roomCode) return;
    const now = Date.now();
    const peer = roomState.peer;
    // 'disconnected' olayı kaçarsa güvenlik ağı
    if (peer && !peer.destroyed && peer.disconnected && !roomState.signalingRetryTimer) {
      scheduleSignalingReconnect(peer, roomState.sessionToken);
    }
    if (roomState.isHost) {
      const timer = getTimerSnapshot();
      roomState.guests.forEach((entry, id) => {
        if (!entry.conn) return;
        if (now - entry.lastSeen > ROOM_SILENCE_TIMEOUT_MS) {
          hostGuestConnectionLost(id, entry.conn);
          return;
        }
        sendTo(entry.conn, makeRoomMessage("PING", { t: now, timer }));
      });
    } else if (roomState.status === "connected") {
      if (now - roomState.lastSeen > ROOM_SILENCE_TIMEOUT_MS) {
        guestConnectionLost(roomState.conn, "silence");
        return;
      }
      sendTo(roomState.conn, makeRoomMessage("PING", { t: now }));
    }
  }

  // Sinyal sunucusu bağlantısı koptuğunda (host & misafir) geri al
  function scheduleSignalingReconnect(peer, token) {
    if (isRoomTokenStale(token) || roomState.peer !== peer || peer.destroyed) return;
    clearTimeout(roomState.signalingRetryTimer);
    const attempt = roomState.signalingRetryAttempt++;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
    roomState.signalingRetryTimer = setTimeout(() => {
      roomState.signalingRetryTimer = null;
      if (isRoomTokenStale(token) || roomState.peer !== peer || peer.destroyed || !peer.disconnected) return;
      try { peer.reconnect(); } catch (err) { console.warn("PeerJS reconnect error:", err); }
    }, delay);
  }

  function attachSignalingHandlers(peer, token) {
    peer.on("disconnected", () => {
      if (isRoomTokenStale(token) || roomState.peer !== peer || peer.destroyed) return;
      scheduleSignalingReconnect(peer, token);
      updateRoomUI();
    });
  }

  function roomNudge() {
    if (!roomState.roomCode) return;
    const peer = roomState.peer;
    if (peer && !peer.destroyed && peer.disconnected) {
      clearTimeout(roomState.signalingRetryTimer);
      roomState.signalingRetryTimer = null;
      try { peer.reconnect(); } catch (_) {}
    }
    if (!roomState.isHost && roomState.status === "reconnecting" && roomState.reconnectTimer) {
      clearTimeout(roomState.reconnectTimer);
      roomState.reconnectTimer = null;
      guestAttemptConnect(roomState.sessionToken);
    }
    roomHeartbeatTick();
  }

  // ---------- Oturumu kapatma ----------
  function teardownRoom({ notifyPeers = false } = {}) {
    roomState.sessionToken++;
    clearInterval(roomState.heartbeatTimer);
    [roomState.reconnectTimer, roomState.connectTimeoutTimer, roomState.signalingRetryTimer, roomState.hostOpenTimer].forEach((t) => clearTimeout(t));
    roomState.heartbeatTimer = null;
    roomState.reconnectTimer = null;
    roomState.connectTimeoutTimer = null;
    roomState.signalingRetryTimer = null;
    roomState.hostOpenTimer = null;

    const conns = [];
    if (roomState.isHost) {
      const closedMsg = makeRoomMessage("ROOM_CLOSED");
      roomState.guests.forEach((entry) => {
        clearTimeout(entry.graceTimer);
        if (entry.conn) {
          if (notifyPeers) sendTo(entry.conn, closedMsg);
          conns.push(entry.conn);
        }
      });
    } else if (roomState.conn) {
      if (notifyPeers) sendTo(roomState.conn, makeRoomMessage("BYE"));
      conns.push(roomState.conn);
    }
    const peer = roomState.peer;
    const finish = () => {
      conns.forEach((c) => { try { c.close(); } catch (_) {} });
      if (peer) { try { peer.destroy(); } catch (_) {} }
    };
    if (notifyPeers && conns.length) setTimeout(finish, 300);
    else finish();

    roomState.peer = null;
    roomState.conn = null;
    roomState.isHost = false;
    roomState.isWaiting = false;
    roomState.roomCode = null;
    roomState.connectedPeerName = null;
    roomState.status = "idle";
    roomState.guests = new Map();
    roomState.participants = [];
    roomState.hostName = null;
    roomState.everConnected = false;
    roomState.reconnectStartedAt = 0;
    roomState.reconnectAttempt = 0;
    roomState.signalingRetryAttempt = 0;
    roomState.hostOpenFailures = 0;
    roomState.reclaiming = false;
    roomState.myWork = null;
    roomState.myWorkKnown = false;
    roomState.chat = [];
    roomState.chatUnread = 0;
    renderRoomChat();
    updateRoomUI();
  }

  // ---------- HOST ----------
  function getParticipantList() {
    const list = [{ id: getRoomClientId(), name: roomState.myUserName, isHost: true, status: "connected", work: roomState.myWork }];
    roomState.guests.forEach((entry, id) => {
      list.push({ id, name: entry.name, isHost: false, status: entry.status, work: entry.work || null });
    });
    return list;
  }

  function broadcastParticipants() {
    if (!roomState.isHost) return;
    sendRoomMessage(makeRoomMessage("PARTICIPANTS", { participants: getParticipantList() }));
  }

  function hostAcceptGuest(conn, msg) {
    const clientId = String(msg.from || conn.peer || "").slice(0, 64);
    if (!clientId) return null;
    const name = sanitizeRoomName(msg.name);
    let entry = roomState.guests.get(clientId);
    if (!entry && roomState.guests.size >= ROOM_MAX_GUESTS) {
      sendTo(conn, makeRoomMessage("ROOM_FULL", { maxGuests: ROOM_MAX_GUESTS }));
      setTimeout(() => { try { conn.close(); } catch (_) {} }, 300);
      return null;
    }
    const wasReconnecting = !!(entry && entry.status === "reconnecting");
    const isNew = !entry;
    if (entry && entry.conn && entry.conn !== conn) {
      // Aynı kişi yeni bağlantıyla geldi: eskisini (kimlik kontrolü sayesinde) etkisizce kapat
      const old = entry.conn;
      entry.conn = null;
      sendTo(old, makeRoomMessage("REPLACED"));
      setTimeout(() => { try { old.close(); } catch (_) {} }, 300);
    }
    if (!entry) {
      entry = { joinedAt: Date.now(), graceTimer: null, work: null, lastChatAt: 0 };
      roomState.guests.set(clientId, entry);
    }
    clearTimeout(entry.graceTimer);
    entry.graceTimer = null;
    entry.conn = conn;
    entry.name = name;
    entry.status = "connected";
    entry.lastSeen = Date.now();
    roomState.isWaiting = false;
    roomState.connectedPeerName = name;

    sendTo(conn, makeRoomMessage("WELCOME", {
      hostName: roomState.myUserName,
      participants: getParticipantList(),
      timer: getTimerSnapshot(),
      maxGuests: ROOM_MAX_GUESTS,
      chat: roomState.chat.slice(-ROOM_CHAT_WELCOME_COUNT)
    }));
    broadcastParticipants();
    updateRoomUI();
    if (isNew) showToast(`👋 ${name} odaya katıldı!`);
    else if (wasReconnecting) showToast(`🔄 ${name} tekrar bağlandı.`);
    return clientId;
  }

  function hostGuestConnectionLost(clientId, conn) {
    const entry = roomState.guests.get(clientId);
    if (!entry || entry.conn !== conn) return; // eski bağlantı: yok say
    entry.conn = null;
    entry.status = "reconnecting";
    try { conn.close(); } catch (_) {}
    clearTimeout(entry.graceTimer);
    entry.graceTimer = setTimeout(() => {
      const e = roomState.guests.get(clientId);
      if (e && e === entry && !e.conn) hostRemoveGuest(clientId, "timeout");
    }, ROOM_GUEST_GRACE_MS);
    broadcastParticipants();
    updateRoomUI();
  }

  function hostRemoveGuest(clientId, reason) {
    const entry = roomState.guests.get(clientId);
    if (!entry) return;
    roomState.guests.delete(clientId);
    clearTimeout(entry.graceTimer);
    if (entry.conn) {
      const c = entry.conn;
      entry.conn = null;
      setTimeout(() => { try { c.close(); } catch (_) {} }, 200);
    }
    if (roomState.guests.size === 0) {
      roomState.isWaiting = true;
      roomState.connectedPeerName = null;
    }
    broadcastParticipants();
    updateRoomUI();
    if (reason === "left") showToast(`🚪 ${entry.name} odadan ayrıldı.`);
    else showToast(`ℹ️ ${entry.name} geri bağlanamadı, katılımcı listesinden çıkarıldı.`);
  }

  function hostHandleConnection(conn, token) {
    let clientId = null;
    conn.on("data", (raw) => {
      if (isRoomTokenStale(token)) return;
      const msg = raw && typeof raw === "object" ? raw : null;
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "HELLO") {
        if (!clientId) clientId = hostAcceptGuest(conn, msg);
        return;
      }
      if (!clientId) return;
      const entry = roomState.guests.get(clientId);
      if (!entry || entry.conn !== conn) return;
      entry.lastSeen = Date.now();
      // Göndericiyi host'un bildiği kimlikle damgala
      msg.from = clientId;
      msg.name = entry.name;
      if (msg.type === "BYE") {
        hostRemoveGuest(clientId, "left");
        return;
      }
      const relay = ROOM_RELAY_TYPES.has(msg.type);
      if (!relay && !ROOM_HOST_ACCEPTS.has(msg.type)) return;
      const handler = ROOM_MESSAGE_HANDLERS[msg.type];
      const result = handler ? handler(msg, conn) : undefined;
      if (relay && result !== false) sendRoomMessage(msg, clientId);
    });
    const onGone = () => {
      if (isRoomTokenStale(token) || !clientId) return;
      hostGuestConnectionLost(clientId, conn);
    };
    conn.on("close", onGone);
    conn.on("error", (err) => {
      console.warn("Peer connection error:", err);
      onGone();
    });
    setTimeout(() => {
      if (!clientId && !isRoomTokenStale(token)) { try { conn.close(); } catch (_) {} }
    }, ROOM_CONNECT_TIMEOUT_MS);
  }

  function hostOpenFailed(token, message) {
    if (isRoomTokenStale(token)) return;
    roomState.hostOpenFailures++;
    const windowOk = roomState.reclaiming
      ? Date.now() - roomState.reclaimStartedAt < ROOM_HOST_RECLAIM_WINDOW_MS
      : roomState.hostOpenFailures <= 4;
    if (windowOk) {
      clearTimeout(roomState.hostOpenTimer);
      roomState.hostOpenTimer = setTimeout(() => openHostPeer(token), Math.min(8000, 1500 * roomState.hostOpenFailures));
      updateRoomUI();
      return;
    }
    teardownRoom({ notifyPeers: false });
    clearRoomSession();
    showToast(message);
  }

  function openHostPeer(token) {
    if (isRoomTokenStale(token)) return;
    roomState.hostOpenTimer = null;
    const code = roomState.roomCode;
    let peer;
    try {
      peer = new Peer(roomPeerIdFor(code));
    } catch (e) {
      console.warn("Peer error:", e);
      teardownRoom({ notifyPeers: false });
      clearRoomSession();
      showToast("⚠️ Oda oluşturulurken hata meydana geldi.");
      return;
    }
    roomState.peer = peer;
    attachSignalingHandlers(peer, token);

    peer.on("open", () => {
      if (isRoomTokenStale(token) || roomState.peer !== peer) return;
      roomState.signalingRetryAttempt = 0;
      clearTimeout(roomState.signalingRetryTimer);
      roomState.signalingRetryTimer = null;
      if (roomState.status === "opening") {
        roomState.status = "open";
        roomState.hostOpenFailures = 0;
        saveRoomSession("host");
        showToast(roomState.reclaiming
          ? `🏠 ${code} odası yeniden açıldı. Arkadaşların otomatik olarak geri bağlanacak.`
          : `🏠 ${code} kodlu oda kuruldu! Arkadaşlarını davet edebilirsin.`);
        roomState.reclaiming = false;
      }
      updateRoomUI();
    });

    peer.on("connection", (conn) => {
      if (isRoomTokenStale(token) || roomState.peer !== peer) {
        try { conn.close(); } catch (_) {}
        return;
      }
      hostHandleConnection(conn, token);
    });

    peer.on("error", (err) => {
      if (isRoomTokenStale(token) || roomState.peer !== peer) return;
      console.warn("PeerJS host error:", err);
      const type = err && err.type;
      const opening = roomState.status === "opening";
      if (type === "unavailable-id") {
        if (!opening) return; // açık odada: 'disconnected' akışı tekrar dener
        try { peer.destroy(); } catch (_) {}
        roomState.peer = null;
        if (roomState.reclaiming) {
          hostOpenFailed(token, "⚠️ Önceki oda geri açılamadı. Yeni bir oda kurabilirsin.");
          return;
        }
        roomState.createAttempt++;
        if (roomState.createAttempt < 5) {
          roomState.roomCode = generateRoomCode();
          updateRoomUI();
          openHostPeer(token);
        } else {
          teardownRoom({ notifyPeers: false });
          clearRoomSession();
          showToast("⚠️ Oda kurulamadı. Lütfen tekrar deneyin.");
        }
        return;
      }
      if (type === "browser-incompatible" || type === "invalid-id" || type === "invalid-key" || type === "ssl-unavailable") {
        teardownRoom({ notifyPeers: false });
        clearRoomSession();
        showToast("⚠️ Oda kurulamadı. Tarayıcın bu özelliği desteklemiyor olabilir.");
        return;
      }
      if (opening && peer.destroyed) {
        roomState.peer = null;
        hostOpenFailed(token, "⚠️ Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.");
      }
      // Diğer hatalar (network, webrtc, peer-unavailable...) odayı kapatmaz.
    });
  }

  function createPomodoroRoom(opts = {}) {
    if (typeof Peer === "undefined") {
      showToast("⚠️ Bağlantı kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      return;
    }
    if (opts.name) roomState.myUserName = sanitizeRoomName(opts.name);
    else readRoomNameInput();
    if (roomState.roomCode) teardownRoom({ notifyPeers: true });

    const token = ++roomState.sessionToken;
    roomState.isHost = true;
    roomState.isWaiting = true;
    roomState.status = "opening";
    roomState.guests = new Map();
    roomState.participants = [];
    roomState.connectedPeerName = null;
    roomState.createAttempt = 0;
    roomState.hostOpenFailures = 0;
    roomState.signalingRetryAttempt = 0;
    roomState.reclaiming = !!opts.reclaimCode;
    roomState.reclaimStartedAt = Date.now();
    roomState.roomCode = opts.reclaimCode || generateRoomCode();
    loadMyWork(roomState.roomCode);
    updateRoomUI();
    startRoomHeartbeat();
    openHostPeer(token);
  }

  // ---------- MİSAFİR ----------
  function joinPomodoroRoom(inputCode, opts = {}) {
    if (typeof Peer === "undefined") {
      showToast("⚠️ Bağlantı kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      return;
    }
    if (opts.name) roomState.myUserName = sanitizeRoomName(opts.name);
    else readRoomNameInput();

    const code = normalizeRoomCode(inputCode);
    if (!code || code.length < ROOM_CODE_PREFIX.length + 3) {
      showToast("⚠️ Lütfen arkadaşınızın verdiği oda kodunu girin.");
      return;
    }
    if (roomState.roomCode) teardownRoom({ notifyPeers: true });

    const token = ++roomState.sessionToken;
    roomState.isHost = false;
    roomState.isWaiting = true;
    roomState.roomCode = code;
    loadMyWork(code);
    roomState.connectedPeerName = null;
    roomState.participants = [];
    roomState.hostName = null;
    roomState.everConnected = !!opts.resume;
    roomState.status = opts.resume ? "reconnecting" : "connecting";
    roomState.reconnectStartedAt = Date.now();
    roomState.reconnectAttempt = 0;
    roomState.signalingRetryAttempt = 0;
    saveRoomSession("guest");
    startRoomHeartbeat();
    updateRoomUI();
    guestAttemptConnect(token);
  }

  function guestArmConnectTimeout(token) {
    clearTimeout(roomState.connectTimeoutTimer);
    roomState.connectTimeoutTimer = setTimeout(() => {
      roomState.connectTimeoutTimer = null;
      if (isRoomTokenStale(token) || roomState.status === "connected") return;
      guestConnectionLost(roomState.conn, "timeout");
    }, ROOM_CONNECT_TIMEOUT_MS);
  }

  function guestAttemptConnect(token) {
    if (isRoomTokenStale(token)) return;
    clearTimeout(roomState.reconnectTimer);
    roomState.reconnectTimer = null;
    const peer = roomState.peer;
    if (!peer || peer.destroyed) {
      guestCreatePeer(token);
      return;
    }
    if (peer.disconnected) {
      try { peer.reconnect(); } catch (_) {
        try { peer.destroy(); } catch (__) {}
        roomState.peer = null;
        guestCreatePeer(token);
        return;
      }
      guestArmConnectTimeout(token); // 'open' olayı bağlantıyı başlatır
      return;
    }
    if (peer.open) guestConnectToHost(token);
    else guestArmConnectTimeout(token);
  }

  function guestCreatePeer(token) {
    let peer;
    try {
      peer = new Peer();
    } catch (e) {
      console.warn("Peer join error:", e);
      guestConnectionLost(null, "peer");
      return;
    }
    roomState.peer = peer;
    attachSignalingHandlers(peer, token);
    peer.on("open", () => {
      if (isRoomTokenStale(token) || roomState.peer !== peer) return;
      roomState.signalingRetryAttempt = 0;
      clearTimeout(roomState.signalingRetryTimer);
      roomState.signalingRetryTimer = null;
      // Sadece sinyal yeniden bağlandıysa mevcut veri bağlantısını bozma
      if (roomState.status !== "connected") guestConnectToHost(token);
    });
    peer.on("error", (err) => {
      if (isRoomTokenStale(token) || roomState.peer !== peer) return;
      console.warn("PeerJS join error:", err);
      const type = err && err.type;
      if (type === "browser-incompatible" || type === "ssl-unavailable") {
        teardownRoom({ notifyPeers: false });
        clearRoomSession();
        showToast("⚠️ Tarayıcın ortak oda özelliğini desteklemiyor.");
        return;
      }
      // peer-unavailable (host henüz yok), network, webrtc...: bağlı değilsek yeniden dene
      if (roomState.status !== "connected") guestConnectionLost(roomState.conn, type || "error");
    });
    guestArmConnectTimeout(token);
  }

  function guestConnectToHost(token) {
    if (isRoomTokenStale(token)) return;
    const peer = roomState.peer;
    if (!peer || !peer.open) return;
    const old = roomState.conn;
    roomState.conn = null;
    if (old) { try { old.close(); } catch (_) {} }

    const conn = peer.connect(roomPeerIdFor(roomState.roomCode), { reliable: true });
    roomState.conn = conn;
    guestArmConnectTimeout(token);
    const isCurrent = () => !isRoomTokenStale(token) && roomState.conn === conn;

    conn.on("open", () => {
      if (!isCurrent()) return;
      roomState.lastSeen = Date.now();
      sendTo(conn, makeRoomMessage("HELLO", { resume: roomState.everConnected }));
    });
    conn.on("data", (raw) => {
      if (!isCurrent()) return;
      roomState.lastSeen = Date.now();
      const msg = raw && typeof raw === "object" ? raw : null;
      if (!msg || typeof msg.type !== "string" || msg.type === "HELLO" || msg.type === "BYE") return;
      const handler = ROOM_MESSAGE_HANDLERS[msg.type];
      if (handler) handler(msg, conn);
    });
    conn.on("close", () => {
      if (!isCurrent()) return;
      guestConnectionLost(conn, "close");
    });
    conn.on("error", (err) => {
      console.warn("Peer connection error:", err);
      if (!isCurrent()) return;
      guestConnectionLost(conn, "error");
    });
  }

  function guestConnectionLost(conn, reason) {
    if (roomState.isHost || !roomState.roomCode) return;
    if (conn && roomState.conn !== conn) return; // eski bağlantı
    clearTimeout(roomState.connectTimeoutTimer);
    roomState.connectTimeoutTimer = null;
    const c = roomState.conn;
    roomState.conn = null;
    if (c) { try { c.close(); } catch (_) {} }
    // Sinyal hiç açılamadıysa bir sonraki denemede yeni peer kur
    const peer = roomState.peer;
    if (peer && !peer.open && !peer.disconnected && reason === "timeout") {
      try { peer.destroy(); } catch (_) {}
      roomState.peer = null;
    }
    scheduleGuestReconnect();
  }

  function scheduleGuestReconnect() {
    const token = roomState.sessionToken;
    if (roomState.reconnectTimer) return;
    const now = Date.now();
    if (roomState.status === "connected") {
      // Bağlıyken koptu: yeniden bağlanma penceresi şimdi başlar
      roomState.status = "reconnecting";
      roomState.isWaiting = true;
      roomState.reconnectStartedAt = now;
      roomState.reconnectAttempt = 0;
      showToast("📡 Bağlantı koptu, yeniden bağlanılıyor…");
    }
    if (!roomState.reconnectStartedAt) roomState.reconnectStartedAt = now;
    const windowMs = roomState.everConnected ? ROOM_RECONNECT_WINDOW_MS : ROOM_INITIAL_JOIN_WINDOW_MS;
    if (now - roomState.reconnectStartedAt > windowMs) {
      const everConnected = roomState.everConnected;
      teardownRoom({ notifyPeers: false });
      clearRoomSession();
      showToast(everConnected
        ? "⚠️ Odaya yeniden bağlanılamadı. Bireysel moda dönüldü."
        : "⚠️ Odaya bağlanılamadı. Kodu kontrol et; oda kurucusunun sayfası açık olmalı.");
      return;
    }
    updateRoomUI();
    const delay = Math.min(10000, 1000 * Math.pow(2, roomState.reconnectAttempt)) + Math.floor(Math.random() * 500);
    roomState.reconnectAttempt++;
    roomState.reconnectTimer = setTimeout(() => {
      roomState.reconnectTimer = null;
      guestAttemptConnect(token);
    }, delay);
  }

  // ---------- Dışa açık eylemler ----------
  function closePomodoroRoom() {
    teardownRoom({ notifyPeers: true });
    clearRoomSession();
    showToast("🛑 Oda kapatıldı. Bireysel çalışma moduna dönüldü.");
  }

  function leavePomodoroRoom(notify = true) {
    teardownRoom({ notifyPeers: true });
    clearRoomSession();
    if (notify) {
      showToast("🚪 Odadan ayrıldınız. Bireysel moda dönüldü.");
    }
  }

  function resumeRoomSession() {
    const s = loadRoomSession();
    if (!s || roomState.roomCode) return;
    if (s.role === "host") {
      createPomodoroRoom({ reclaimCode: s.code, name: s.name });
    } else {
      joinPomodoroRoom(s.code, { resume: true, name: s.name });
    }
  }

  function initRoomState() {
    getRoomClientId();
    const savedName = localStorage.getItem("pusulapp_user_name");
    if (savedName) {
      roomState.myUserName = savedName;
      const inp = document.getElementById("inputRoomUserName");
      if (inp) inp.value = savedName;
    }

    window.addEventListener("online", roomNudge);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") roomNudge();
    });

    // URL parametresinde oda kodu var mı kontrol et (?room=PUSULA-XXXXX)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get("room");
      const session = loadRoomSession();
      if (roomParam && !(session && session.code === normalizeRoomCode(roomParam))) {
        const code = normalizeRoomCode(roomParam);
        setTimeout(() => {
          switchView("timer");
          openModal("modalRoomConnect");
          const inp = document.getElementById("inputRoomCode");
          if (inp) inp.value = code;
          showToast(`🔑 ${code} oda kodu hazır! İsim yazıp "Odaya Katıl"a basabilirsin.`);
        }, 500);
      }
    } catch (_) {}
  }

  function copyRoomInviteLink() {
    if (!roomState.roomCode) return;
    const link = `https://hegecalapkulu.github.io/pusula/?room=${roomState.roomCode}`;
    const text = `Pusula'da ortak pomodoro odama katıl: ${link} (Kod: ${roomState.roomCode})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("🔗 Davet linki kopyalandı! Arkadaşına gönderebilirsin.");
    }
  }

  // ---------- Arayüz ----------
  function getDisplayParticipants() {
    if (roomState.isHost) return getParticipantList();
    const me = getRoomClientId();
    let list = Array.isArray(roomState.participants) ? roomState.participants.slice() : [];
    if (roomState.status !== "connected") {
      list = list.map((p) => Object.assign({}, p, { status: p.id === me ? "reconnecting" : "unknown" }));
    }
    if (!list.some((p) => p.id === me)) {
      list.push({ id: me, name: roomState.myUserName, isHost: false, status: roomState.status === "connected" ? "connected" : "reconnecting" });
    }
    return list;
  }

  function updateRoomUI() {
    const dot = document.getElementById("roomStatusDot");
    const text = document.getElementById("roomStatusText");
    const partBar = document.getElementById("roomParticipantsBar");
    const openBtn = document.getElementById("btnOpenRoomModal");
    const closeBtn = document.getElementById("btnCloseRoom");
    const leaveBtn = document.getElementById("btnLeaveRoom");
    const copyLinkBtn = document.getElementById("btnCopyRoomLinkBanner");

    const modalActiveBox = document.getElementById("roomActiveInfoBox");
    const modalCodeBadge = document.getElementById("displayRoomCode");
    const modalPeerStatus = document.getElementById("roomPeerStatus");
    const modalRoleBadge = document.getElementById("roomRoleBadge");
    const modalPartList = document.getElementById("roomParticipantsModalList");
    const btnModalClose = document.getElementById("btnModalCloseRoom");
    const btnModalLeave = document.getElementById("btnModalLeaveRoom");

    if (!roomState.roomCode) {
      // KAPALI / BİREYSEL MOD
      if (dot) dot.className = "room-status-dot offline";
      if (text) text.textContent = "Tek Başına Çalışma Modu";
      if (partBar) partBar.classList.add("hidden");
      if (openBtn) {
        openBtn.textContent = "Ortak Odaya Bağlan";
        openBtn.classList.remove("hidden");
      }
      if (copyLinkBtn) copyLinkBtn.classList.add("hidden");
      if (closeBtn) closeBtn.classList.add("hidden");
      if (leaveBtn) leaveBtn.classList.add("hidden");
      if (modalActiveBox) modalActiveBox.classList.add("hidden");
      if (btnModalClose) btnModalClose.classList.add("hidden");
      if (btnModalLeave) btnModalLeave.classList.add("hidden");
      renderRoomTogether();
      return;
    }

    const code = escapeHtml(roomState.roomCode);
    const me = getRoomClientId();
    const list = getDisplayParticipants();
    const connectedCount = list.filter((p) => p.status === "connected").length;
    const reconnectingOthers = list.some((p) => p.id !== me && p.status === "reconnecting");
    const peer = roomState.peer;
    const signalingDown = !!(peer && !peer.destroyed && peer.disconnected);
    const guestLinked = !roomState.isHost && roomState.status === "connected";
    const hostHasGuests = roomState.isHost && roomState.guests.size > 0;
    const isLive = guestLinked || hostHasGuests;

    // Banner durumu
    let dotClass = "waiting";
    let bannerHtml;
    if (roomState.isHost) {
      if (roomState.status === "opening") bannerHtml = `<strong>Oda açılıyor…</strong> (${code})`;
      else if (hostHasGuests) { dotClass = "online"; bannerHtml = `<strong>Ortak Oda:</strong> ${connectedCount} kişi eşzamanlı (${code})`; }
      else bannerHtml = `<strong>Oda Açık:</strong> Arkadaşların bekleniyor (${code})`;
    } else if (roomState.status === "connecting") {
      bannerHtml = `<strong>Odaya bağlanılıyor…</strong> (${code})`;
    } else if (roomState.status === "reconnecting") {
      bannerHtml = `<strong>Yeniden bağlanılıyor…</strong> (${code})`;
    } else {
      dotClass = "online";
      bannerHtml = `<strong>Ortak Oda:</strong> ${connectedCount} kişi eşzamanlı (${code})`;
    }
    if (dot) dot.className = `room-status-dot ${dotClass}`;
    if (text) text.innerHTML = bannerHtml;

    const statusLabel = (p) => {
      if (p.status === "connected") return { cls: p.isHost ? "host" : "peer", label: "Bağlı" };
      if (p.status === "reconnecting") {
        return { cls: "waiting", label: roomState.status === "connecting" && p.id === me ? "Bağlanıyor…" : "Yeniden bağlanıyor…" };
      }
      return { cls: "waiting", label: "Bekleniyor…" };
    };

    if (partBar) {
      partBar.classList.remove("hidden");
      let chips = list.map((p) => {
        const you = p.id === me ? " (Sen)" : "";
        const name = escapeHtml(p.name);
        if (p.isHost) return `<span class="room-chip host" title="Oda kurucusu">${icon("star", 12)} ${name}${you}</span>`;
        if (p.status === "connected") return `<span class="room-chip peer"><span class="room-presence online" aria-hidden="true"></span>${name}${you}</span>`;
        return `<span class="room-chip waiting" title="${escapeHtml(statusLabel(p).label)}"><span class="room-presence away" aria-hidden="true"></span>${name}${you}</span>`;
      }).join("");
      if (roomState.isHost && !hostHasGuests) chips += `<span class="room-chip waiting">Katılım Bekleniyor...</span>`;
      partBar.innerHTML = chips;
    }
    if (openBtn) {
      openBtn.textContent = "Oda & Katılımcılar";
      openBtn.classList.remove("hidden");
    }
    if (copyLinkBtn) copyLinkBtn.classList.remove("hidden");

    if (closeBtn) closeBtn.classList.toggle("hidden", !roomState.isHost);
    if (btnModalClose) btnModalClose.classList.toggle("hidden", !roomState.isHost);
    if (leaveBtn) leaveBtn.classList.toggle("hidden", roomState.isHost);
    if (btnModalLeave) btnModalLeave.classList.toggle("hidden", roomState.isHost);

    if (modalActiveBox) modalActiveBox.classList.remove("hidden");
    if (modalCodeBadge) modalCodeBadge.textContent = roomState.roomCode;
    if (modalRoleBadge) modalRoleBadge.textContent = roomState.isHost ? "Oda Kurucusu (Host)" : "Katılımcı";

    if (modalPeerStatus) {
      let html;
      if (roomState.isHost && roomState.status === "opening") {
        html = roomState.reclaiming
          ? `<strong>Oda yeniden açılıyor…</strong> Arkadaşların birazdan otomatik olarak geri bağlanacak.`
          : `<strong>Oda açılıyor…</strong>`;
      } else if (roomState.isHost && !hostHasGuests) {
        html = `<strong>Arkadaşlarının odaya bağlanması bekleniyor...</strong> Kodu veya linki gönder. (En fazla ${ROOM_MAX_GUESTS} kişi katılabilir.)`;
      } else if (!roomState.isHost && roomState.status === "connecting") {
        html = `<strong>Odaya bağlanılıyor…</strong>`;
      } else if (!roomState.isHost && roomState.status === "reconnecting") {
        html = `<strong>Yeniden bağlanılıyor…</strong> Bağlantı koptu, otomatik olarak tekrar deneniyor. Odadan çıkarılmadın.`;
      } else {
        html = `<strong>Bağlantı kuruldu!</strong> Sayaç hareketleri odadaki herkesin ekranında anlık senkronize.`;
        if (reconnectingOthers) html += ` <br>Bazı arkadaşların yeniden bağlanıyor…`;
      }
      if (roomState.isHost && signalingDown && roomState.status !== "opening") {
        html += ` <br>Sunucu bağlantısı yenileniyor… Bağlı olanlar etkilenmez.`;
      }
      modalPeerStatus.innerHTML = html;
    }

    if (modalPartList) {
      let rows = list.map((p) => {
        const st = statusLabel(p);
        const you = p.id === me ? " (Sen)" : "";
        const icon = p.isHost ? `<span class="room-presence host" title="Oda kurucusu"></span>` : p.status === "connected" ? `<span class="room-presence online" title="Bağlı"></span>` : `<span class="room-presence away" title="Yeniden bağlanıyor"></span>`;
        const hostTag = p.isHost ? " · Host" : "";
        const cls = p.status === "connected" ? "" : " is-reconnecting";
        const work = p.work
          ? `<span class="room-participant-work">${p.work.done ? "✓ " : ""}${escapeHtml(p.work.text)}</span>`
          : "";
        return `<div class="room-participant-row${cls}"><span>${icon} <strong>${escapeHtml(p.name)}</strong>${you}${hostTag}${work}</span><span class="room-chip ${st.cls}">${st.label}</span></div>`;
      }).join("");
      if (roomState.isHost && !hostHasGuests) {
        rows += `<div class="room-participant-row" style="opacity:0.65;"><span>Katılımcı</span><span class="room-chip waiting">Bekleniyor...</span></div>`;
      }
      modalPartList.innerHTML = rows;
    }

    roomState.isWaiting = !isLive;
    renderRoomTogether();
  }

  // ---------- Zamanlayıcı ekranındaki oda parçaları ----------
  // "Şu an ne çalışıyoruz" listesi, ortak seri kutusu ve mola sohbeti.
  function renderRoomTogether() {
    const inRoom = !!roomState.roomCode;
    const box = document.getElementById("roomTogetherBox");
    const chatPanel = document.getElementById("roomChatPanel");
    if (box) box.classList.toggle("hidden", !inRoom);
    if (chatPanel) chatPanel.classList.toggle("hidden", !inRoom);
    renderRoomStreakStat();

    if (!inRoom) {
      renderRoomChatUnread();
      return;
    }

    const listEl = document.getElementById("roomWorkList");
    if (listEl) {
      const me = getRoomClientId();
      const list = getDisplayParticipants().map((p) => (p.id === me ? Object.assign({}, p, { work: roomState.myWork }) : p));
      listEl.innerHTML = list.map((p) => {
        const you = p.id === me ? " (Sen)" : "";
        const icon = p.isHost ? `<span class="room-presence host" title="Oda kurucusu"></span>` : p.status === "connected" ? `<span class="room-presence online" title="Bağlı"></span>` : `<span class="room-presence away" title="Yeniden bağlanıyor"></span>`;
        const away = p.status === "connected" ? "" : " is-away";
        const done = p.work && p.work.done ? " is-done" : "";
        const text = p.work
          ? `${p.work.done ? `<span class="room-work-check" title="Bitti">✓</span> ` : ""}<span class="room-work-text">${escapeHtml(p.work.text)}</span>`
          : `<span class="room-work-text is-empty">${p.id === me ? "Henüz paylaşmadın" : "Henüz paylaşmadı"}</span>`;
        return `<div class="room-work-row${away}${done}"><span class="room-work-name">${icon} ${escapeHtml(p.name)}${you}:</span>${text}</div>`;
      }).join("");
    }

    const input = document.getElementById("inputRoomWork");
    if (input && document.activeElement !== input && !input.value && roomState.myWork) {
      input.value = roomState.myWork.text;
    }
    const doneBtn = document.getElementById("btnRoomWorkDone");
    const clearBtn = document.getElementById("btnRoomWorkClear");
    if (doneBtn) {
      doneBtn.classList.toggle("hidden", !roomState.myWork);
      doneBtn.textContent = roomState.myWork && roomState.myWork.done ? "↺ Devam" : "✓ Bitti";
      doneBtn.title = roomState.myWork && roomState.myWork.done ? "Tekrar çalışıyorum olarak işaretle" : "Bitti olarak işaretle";
    }
    if (clearBtn) clearBtn.classList.toggle("hidden", !roomState.myWork);

    // Bugünün görevlerinden seçim önerileri
    const dl = document.getElementById("roomWorkTaskOptions");
    if (dl) {
      const today = getTodayISO();
      const weekMon = getWeekMondayISO(today);
      const titles = [];
      (state.tasks || []).forEach((t) => {
        if (t.completed || !t.title) return;
        if ((t.scope === "day" && t.date === today) || (t.scope === "week" && t.weekMonday === weekMon)) {
          const title = String(t.title).slice(0, ROOM_WORK_MAX_LEN);
          if (!titles.includes(title)) titles.push(title);
        }
      });
      dl.innerHTML = titles.slice(0, 20).map((t) => `<option value="${escapeHtml(t)}"></option>`).join("");
    }

    updateRoomChatLock(true);
    renderRoomChatUnread();
  }

  function renderRoomStreakStat() {
    const box = document.getElementById("roomStreakStat");
    const val = document.getElementById("statRoomStreak");
    if (!box || !val) return;
    const rs = getLiveRoomStreak();
    const show = !!roomState.roomCode || rs.best > 0;
    box.classList.toggle("hidden", !show);
    if (!show) return;
    val.textContent = rs.best > rs.current ? `${rs.current} gün · en iyi ${rs.best}` : `${rs.current} gün`;
    decorateFigures(box);
    box.title = rs.today
      ? "Bugünün ortak oturumu tamam! Başka biriyle aynı odada ders oturumu tamamladığın art arda günler."
      : "Başka biriyle aynı odada en az bir ders oturumu tamamladığın art arda günler. Bugün bir ortak oturum seriyi sürdürür.";
  }

  function formatChatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function renderRoomChat() {
    const listEl = document.getElementById("roomChatList");
    if (!listEl) return;
    const nearBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 40;
    const me = getRoomClientId();
    if (roomState.chat.length === 0) {
      listEl.innerHTML = `<div class="room-chat-empty">Henüz mesaj yok. Molada bir selam ver! 👋</div>`;
    } else {
      listEl.innerHTML = roomState.chat.map((m) => {
        const mine = m.from === me;
        return `<div class="room-chat-msg${mine ? " is-mine" : ""}"><div class="room-chat-meta"><strong>${escapeHtml(mine ? "Sen" : m.name)}</strong><span>${formatChatTime(m.ts)}</span></div>${escapeHtml(m.text)}</div>`;
      }).join("");
    }
    if (nearBottom || roomState.chat.length <= 1) listEl.scrollTop = listEl.scrollHeight;
    maybeClearRoomChatUnread();
    renderRoomChatUnread();
  }

  function isRoomChatInView() {
    if (uiState.currentView !== "timer" || document.visibilityState !== "visible") return false;
    const panel = document.getElementById("roomChatPanel");
    if (!panel || panel.classList.contains("hidden")) return false;
    const r = panel.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function maybeClearRoomChatUnread() {
    if (roomState.chatUnread > 0 && isRoomChatInView()) {
      roomState.chatUnread = 0;
      renderRoomChatUnread();
    }
  }

  function renderRoomChatUnread() {
    const n = roomState.roomCode ? roomState.chatUnread : 0;
    const badge = document.getElementById("roomChatUnreadBadge");
    if (badge) {
      badge.classList.toggle("hidden", n === 0);
      badge.textContent = String(n);
    }
    const floating = document.getElementById("floatingChatUnread");
    if (floating) {
      floating.classList.toggle("hidden", n === 0);
      floating.textContent = `💬 ${n}`;
    }
  }

  let lastRoomChatLocked = null;
  function updateRoomChatLock(force = false) {
    if (!roomState.roomCode) return;
    const locked = isRoomChatLocked();
    if (!force && locked === lastRoomChatLocked) return;
    lastRoomChatLocked = locked;
    const note = document.getElementById("roomChatLockNote");
    const form = document.getElementById("roomChatForm");
    const input = document.getElementById("inputRoomChat");
    const btn = document.getElementById("btnRoomChatSend");
    if (note) note.classList.toggle("hidden", !locked);
    if (form) form.classList.toggle("is-locked", locked);
    if (input) {
      input.disabled = locked;
      input.placeholder = locked ? "Ders bitince yazabilirsin…" : "Molada bir şey yaz…";
    }
    if (btn) btn.disabled = locked;
  }

  function bindEvents() {
    // Sayfa & Veri Yenile Butonu (Zamanlayıcıyı koruyarak)
    const btnRefreshApp = document.getElementById("btnRefreshApp");
    if (btnRefreshApp) {
      btnRefreshApp.addEventListener("click", async () => {
        saveTimerState();
        playClickSound();
        const origText = btnRefreshApp.innerHTML;
        btnRefreshApp.innerHTML = "⏳ Yenileniyor...";
        await loadData();
        restoreTimerState();
        btnRefreshApp.innerHTML = origText;
        showToast("🔄 Pusulapp verileri güncellendi! (Zamanlayıcı akışı korundu)");
      });
    }

    // Sol Menü Geçişleri
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    document.querySelectorAll("[data-open-view]").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.openView));
    });

    // Dar ekran menü düğmesi (yalnızca görünüm: hızlı eylemler + ayarlar panelini aç/kapat)
    const btnMobileMenu = document.getElementById("btnMobileMenu");
    const sidebarEl = document.querySelector(".sidebar");
    if (btnMobileMenu && sidebarEl) {
      const setMobileMenu = (open) => {
        sidebarEl.classList.toggle("is-menu-open", open);
        btnMobileMenu.setAttribute("aria-expanded", String(open));
      };
      btnMobileMenu.addEventListener("click", () => setMobileMenu(!sidebarEl.classList.contains("is-menu-open")));
      sidebarEl.addEventListener("click", (e) => {
        if (e.target.closest(".nav-item, .sidebar-quick-actions .btn")) setMobileMenu(false);
      });
    }
    // Dar ekranda yatay menü şeridinde aktif sayfa görünür kalsın
    const keepActiveNavVisible = () => {
      const nav = document.querySelector(".nav-menu");
      const act = nav && nav.querySelector(".nav-item.active");
      if (nav && act && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, act.offsetLeft - 12);
    };
    document.querySelectorAll(".nav-item").forEach((btn) => btn.addEventListener("click", keepActiveNavVisible));
    setTimeout(keepActiveNavVisible, 0);

    // Hızlı Görev & Hedef Butonları
    document.getElementById("btnQuickTask").addEventListener("click", () => openTaskModal());
    document.getElementById("btnQuickGoal").addEventListener("click", () => openGoalModal());
    document.getElementById("btnOpenGoalModal").addEventListener("click", () => openGoalModal());
    document.getElementById("btnOpenRoutineModal").addEventListener("click", () => openRoutineModal());

    document.getElementById("btnAddWeeklyFlexTask").addEventListener("click", () => {
      openTaskModal(null, "", "week");
    });
    document.getElementById("btnAddPoolTaskWeekView").addEventListener("click", () => {
      openTaskModal(null, "", "week");
    });

    // Modal Kapatma
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
    });

    // Gün Gezinme (Daily View)
    document.getElementById("btnPrevDay").addEventListener("click", () => {
      uiState.selectedDateISO = addDaysISO(uiState.selectedDateISO, -1);
      renderAll();
    });
    document.getElementById("btnNextDay").addEventListener("click", () => {
      uiState.selectedDateISO = addDaysISO(uiState.selectedDateISO, 1);
      renderAll();
    });
    document.getElementById("btnGoToday").addEventListener("click", () => {
      uiState.selectedDateISO = getTodayISO();
      renderAll();
    });

    // Hafta Gezinme (Weekly View)
    document.getElementById("btnPrevWeek").addEventListener("click", () => {
      uiState.selectedWeekMondayISO = addDaysISO(uiState.selectedWeekMondayISO, -7);
      renderAll();
    });
    document.getElementById("btnNextWeek").addEventListener("click", () => {
      uiState.selectedWeekMondayISO = addDaysISO(uiState.selectedWeekMondayISO, 7);
      renderAll();
    });
    document.getElementById("btnGoThisWeek").addEventListener("click", () => {
      uiState.selectedWeekMondayISO = getWeekMondayISO(getTodayISO());
      renderAll();
    });

    // Takvim (Gün / Ay / Yıl) Kontrolleri
    document.querySelectorAll("[data-cal-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.calendarMode = btn.dataset.calMode;
        renderAll();
      });
    });

    document.getElementById("btnCalPrev").addEventListener("click", () => {
      if (uiState.calendarMode === "day") {
        uiState.selectedDateISO = addDaysISO(uiState.selectedDateISO, -1);
        const dt = parseISODate(uiState.selectedDateISO);
        uiState.calendarYear = dt.getFullYear();
        uiState.calendarMonth = dt.getMonth();
      } else if (uiState.calendarMode === "month") {
        uiState.calendarMonth -= 1;
        if (uiState.calendarMonth < 0) {
          uiState.calendarMonth = 11;
          uiState.calendarYear -= 1;
        }
      } else if (uiState.calendarMode === "year") {
        uiState.calendarYear -= 1;
      }
      renderAll();
    });

    document.getElementById("btnCalNext").addEventListener("click", () => {
      if (uiState.calendarMode === "day") {
        uiState.selectedDateISO = addDaysISO(uiState.selectedDateISO, 1);
        const dt = parseISODate(uiState.selectedDateISO);
        uiState.calendarYear = dt.getFullYear();
        uiState.calendarMonth = dt.getMonth();
      } else if (uiState.calendarMode === "month") {
        uiState.calendarMonth += 1;
        if (uiState.calendarMonth > 11) {
          uiState.calendarMonth = 0;
          uiState.calendarYear += 1;
        }
      } else if (uiState.calendarMode === "year") {
        uiState.calendarYear += 1;
      }
      renderAll();
    });

    document.getElementById("btnCalGoToday").addEventListener("click", () => {
      const today = getTodayISO();
      const dt = parseISODate(today);
      uiState.selectedDateISO = today;
      uiState.calendarYear = dt.getFullYear();
      uiState.calendarMonth = dt.getMonth();
      renderAll();
    });

    document.getElementById("btnCalQuickAddTask").addEventListener("click", () => {
      openTaskModal(null, "", "day");
    });

    document.getElementById("btnInspectorOpenDaily").addEventListener("click", () => {
      switchView("daily");
    });

    function addQuickTaskToSelectedDate(title) {
      if (!title) return;
      state.tasks.push({
        id: uid("task"),
        title,
        scope: "day",
        date: uiState.selectedDateISO,
        weekMonday: getWeekMondayISO(uiState.selectedDateISO),
        goalId: "",
        priority: "normal",
        category: "Genel",
        completed: false,
        note: "",
        subtasks: [],
        postponeCount: 0,
        postponeHistory: [],
        createdAt: getTodayISO()
      });
      saveData();
      renderAll();
      showToast(`✅ Görev ${formatShortTR(uiState.selectedDateISO)} gününe eklendi.`);
    }

    document.getElementById("formCalInspectorAdd").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = document.getElementById("inputCalInspectorAdd");
      addQuickTaskToSelectedDate(inp.value.trim());
      inp.value = "";
    });

    document.getElementById("formCalDayQuickAdd").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = document.getElementById("inputCalDayQuickAdd");
      addQuickTaskToSelectedDate(inp.value.trim());
      inp.value = "";
    });

    // Otomatik Devretme Toggle & Manuel Devretme
    document.getElementById("toggleAutoRollover").addEventListener("change", (e) => {
      state.settings.autoRollover = e.target.checked;
      if (state.settings.autoRollover) {
        performAutoRollover(false);
      }
      saveData();
      renderAll();
    });

    document.getElementById("btnRolloverAll").addEventListener("click", () => {
      performAutoRollover(false);
      renderAll();
    });

    document.getElementById("btnToggleOverdueList").addEventListener("click", () => {
      uiState.showOverdueList = !uiState.showOverdueList;
      renderDailyView();
    });

    // Günün Odağı Hızlı Görev Ekleme Çubuğu
    document.getElementById("formInlineDailyAdd").addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("inputInlineTaskTitle");
      const title = titleInput.value.trim();
      if (!title) return;

      const goalId = document.getElementById("selectInlineTaskGoal").value;
      const scope = document.getElementById("selectInlineTaskScope").value;
      const priority = document.getElementById("selectInlineTaskPriority").value;

      const newTask = {
        id: uid("task"),
        title,
        scope,
        date: scope === "day" ? uiState.selectedDateISO : "",
        weekMonday: getWeekMondayISO(uiState.selectedDateISO),
        goalId,
        priority,
        category: "Genel",
        completed: false,
        note: "",
        subtasks: [],
        postponeCount: 0,
        postponeHistory: [],
        createdAt: getTodayISO()
      };

      state.tasks.push(newTask);
      titleInput.value = "";
      saveData();
      renderAll();
      showToast(
        scope === "day"
          ? `✅ Görev ${formatShortTR(uiState.selectedDateISO)} gününe eklendi.`
          : "🧺 Görev bu haftanın esnek havuzuna eklendi."
      );
    });

    // Günlük ve Haftalık Serbest Not Kaydı
    document.getElementById("textareaDailyNote").addEventListener("input", (e) => {
      state.dailyNotes = state.dailyNotes || {};
      state.dailyNotes[uiState.selectedDateISO] = e.target.value;
      saveData();
    });

    document.getElementById("textareaWeeklyNote").addEventListener("input", (e) => {
      state.weeklyNotes = state.weeklyNotes || {};
      state.weeklyNotes[uiState.selectedWeekMondayISO] = e.target.value;
      saveData();
    });

    // Filtre Hapları (Pills)
    document.querySelectorAll("[data-daily-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.dailyFilter = btn.dataset.dailyFilter;
        document.querySelectorAll("[data-daily-filter]").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
        renderDailyView();
      });
    });

    document.querySelectorAll("[data-goal-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.goalFilter = btn.dataset.goalFilter;
        document.querySelectorAll("[data-goal-filter]").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
        renderGoalsView();
      });
    });

    document.querySelectorAll("[data-note-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.noteFilter = btn.dataset.noteFilter;
        document.querySelectorAll("[data-note-filter]").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
        renderInsightsView();
      });
    });

    // Genel Arama
    document.getElementById("globalSearchInput").addEventListener("input", (e) => {
      uiState.searchQuery = e.target.value.trim();
      renderAll();
    });

    // Görev Modalı Scope Değişimi & Alt Adım Ekleme
    document.getElementById("taskModalScope").addEventListener("change", syncTaskModalScopeVisibility);

    document.getElementById("btnAddSubtaskModal").addEventListener("click", () => {
      const inp = document.getElementById("inputNewSubtask");
      const val = inp.value.trim();
      if (!val) return;
      uiState.modalSubtasksTemp.push({ id: uid("st"), text: val, done: false });
      inp.value = "";
      renderModalSubtasksEditor();
    });

    // Görev Modalı Kaydetme
    document.getElementById("formTaskModal").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("taskModalId").value;
      const title = document.getElementById("taskModalName").value.trim();
      if (!title) return;

      const scope = document.getElementById("taskModalScope").value;
      const dateVal = document.getElementById("taskModalDate").value || uiState.selectedDateISO;
      const weekDateVal = document.getElementById("taskModalWeekDate").value || uiState.selectedDateISO;
      const goalId = document.getElementById("taskModalGoal").value;
      const priority = document.getElementById("taskModalPriority").value;
      const category = document.getElementById("taskModalCategory").value;
      const note = document.getElementById("taskModalNote").value;

      if (id) {
        const existing = state.tasks.find((t) => t.id === id);
        if (existing) {
          existing.title = title;
          existing.scope = scope;
          existing.date = scope === "day" ? dateVal : "";
          existing.weekMonday = getWeekMondayISO(scope === "day" ? dateVal : weekDateVal);
          existing.goalId = goalId;
          existing.priority = priority;
          existing.category = category;
          existing.note = note;
          existing.subtasks = uiState.modalSubtasksTemp;
        }
        showToast("✏️ Görev güncellendi.");
      } else {
        state.tasks.push({
          id: uid("task"),
          title,
          scope,
          date: scope === "day" ? dateVal : "",
          weekMonday: getWeekMondayISO(scope === "day" ? dateVal : weekDateVal),
          goalId,
          priority,
          category,
          completed: false,
          note,
          subtasks: uiState.modalSubtasksTemp,
          postponeCount: 0,
          postponeHistory: [],
          createdAt: getTodayISO()
        });
        showToast("✅ Yeni görev eklendi.");
      }

      closeModal("modalTask");
      saveData();
      renderAll();
    });

    // Erteleme Modalı Hızlı Seçenekler
    document.querySelectorAll(".postpone-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".postpone-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        currentPostponeOpt = chip.dataset.postponeOpt;

        const taskId = document.getElementById("postponeTaskId").value;
        const task = state.tasks.find((t) => t.id === taskId);
        const base = task && task.date && task.date >= getTodayISO() ? task.date : getTodayISO();
        const dateGroup = document.getElementById("postponeCustomDateGroup");
        const targetInput = document.getElementById("postponeTargetDate");

        if (currentPostponeOpt === "weekpool") {
          dateGroup.classList.add("hidden");
          targetInput.removeAttribute("required");
        } else {
          dateGroup.classList.remove("hidden");
          targetInput.setAttribute("required", "required");
          if (currentPostponeOpt === "tomorrow") {
            targetInput.value = addDaysISO(base, 1);
          } else if (currentPostponeOpt === "in2days") {
            targetInput.value = addDaysISO(base, 2);
          } else if (currentPostponeOpt === "weekend") {
            const dt = parseISODate(base);
            const daysUntilSat = (6 - dt.getDay() + 7) % 7 || 7;
            targetInput.value = addDaysISO(base, daysUntilSat);
          } else if (currentPostponeOpt === "nextweek") {
            targetInput.value = addDaysISO(base, 7);
          }
        }
      });
    });

    // Erteleme Sebebi Etiketleri
    document.querySelectorAll(".reason-tag").forEach((tag) => {
      tag.addEventListener("click", () => {
        const area = document.getElementById("postponeReasonInput");
        area.value = tag.dataset.reason;
      });
    });

    // Erteleme Formu Onay
    document.getElementById("formPostponeModal").addEventListener("submit", (e) => {
      e.preventDefault();
      const taskId = document.getElementById("postponeTaskId").value;
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return;

      const oldDate = task.date || "Haftalık Havuz";
      const reason = document.getElementById("postponeReasonInput").value.trim() || "Plan güncellendi";

      if (currentPostponeOpt === "weekpool") {
        task.scope = "week";
        task.date = "";
        task.weekMonday = getWeekMondayISO(getTodayISO());
        task.postponeCount = (task.postponeCount || 0) + 1;
        task.postponeHistory = task.postponeHistory || [];
        task.postponeHistory.push({
          from: oldDate,
          to: "Haftalık Havuz",
          reason,
          at: getTodayISO()
        });
        showToast("🧺 Görev bu haftanın esnek havuzuna alındı.");
      } else {
        const newDate = document.getElementById("postponeTargetDate").value;
        if (!newDate) return;
        task.scope = "day";
        task.date = newDate;
        task.weekMonday = getWeekMondayISO(newDate);
        task.priority = "postponed";
        task.postponeCount = (task.postponeCount || 0) + 1;
        task.postponeHistory = task.postponeHistory || [];
        task.postponeHistory.push({
          from: oldDate,
          to: newDate,
          reason,
          at: getTodayISO()
        });
        showToast(`⏭️ Görev ${formatShortTR(newDate)} tarihine ertelendi.`);
      }

      closeModal("modalPostpone");
      saveData();
      renderAll();
    });

    // Hedef Modalı Hızlı Vade Süresi Butonları
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const days = Number(btn.dataset.days);
        const startVal = document.getElementById("goalModalStartDate").value || getTodayISO();
        document.getElementById("goalModalTargetDate").value = addDaysISO(startVal, days);
        document.getElementById("goalModalHorizon").value = days >= 120 ? "long" : "short";
      });
    });

    document.getElementById("btnAddMilestoneModal").addEventListener("click", () => {
      const inp = document.getElementById("inputNewMilestone");
      const val = inp.value.trim();
      if (!val) return;
      uiState.modalMilestonesTemp.push({ id: uid("ms"), text: val, done: false });
      inp.value = "";
      renderModalMilestonesEditor();
    });

    // Hedef Kaydetme
    document.getElementById("formGoalModal").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("goalModalId").value;
      const title = document.getElementById("goalModalName").value.trim();
      if (!title) return;

      const horizon = document.getElementById("goalModalHorizon").value;
      const category = document.getElementById("goalModalCategory").value;
      const startDate = document.getElementById("goalModalStartDate").value;
      const targetDate = document.getElementById("goalModalTargetDate").value;
      const parentId = document.getElementById("goalModalParent").value;
      const why = document.getElementById("goalModalWhy").value;

      if (id) {
        const existing = state.goals.find((g) => g.id === id);
        if (existing) {
          existing.title = title;
          existing.horizon = horizon;
          existing.category = category;
          existing.startDate = startDate;
          existing.targetDate = targetDate;
          existing.parentId = parentId;
          existing.why = why;
          existing.milestones = uiState.modalMilestonesTemp;
        }
        showToast("🎯 Hedef güncellendi.");
      } else {
        state.goals.push({
          id: uid("goal"),
          title,
          horizon,
          category,
          startDate,
          targetDate,
          parentId,
          why,
          milestones: uiState.modalMilestonesTemp,
          completed: false,
          createdAt: getTodayISO()
        });
        showToast("🎯 Yeni hedef eklendi.");
      }

      closeModal("modalGoal");
      saveData();
      renderAll();
    });

    // Rutin Modalı
    document.getElementById("routineModalFreq").addEventListener("change", (e) => {
      document
        .getElementById("routineCustomDaysGroup")
        .classList.toggle("hidden", e.target.value !== "custom_days");
    });

    document.querySelectorAll("#routineWeekdaySelector .day-toggle").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("active"));
    });

    document.getElementById("formRoutineModal").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("routineModalId").value;
      const title = document.getElementById("routineModalName").value.trim();
      if (!title) return;

      const freq = document.getElementById("routineModalFreq").value;
      const goalId = document.getElementById("routineModalGoal").value;
      const note = document.getElementById("routineModalNote").value;
      const customDays = Array.from(
        document.querySelectorAll("#routineWeekdaySelector .day-toggle.active")
      ).map((b) => Number(b.dataset.day));

      if (id) {
        const existing = state.routines.find((r) => r.id === id);
        if (existing) {
          existing.title = title;
          existing.freq = freq;
          existing.customDays = customDays;
          existing.goalId = goalId;
          existing.note = note;
        }
        showToast("🔁 Rutin güncellendi.");
      } else {
        state.routines.push({
          id: uid("routine"),
          title,
          freq,
          customDays: customDays.length ? customDays : [1, 3, 5],
          goalId,
          note,
          status: "active",
          completions: {},
          bestStreak: 0,
          createdAt: getTodayISO()
        });
        showToast("🔁 Yeni tekrarlayan görev eklendi.");
      }

      closeModal("modalRoutine");
      saveData();
      renderAll();
    });

    // Tema Değiştirme, Dışa Aktarma ve İçe Aktarma
    document.getElementById("btnThemeToggle").addEventListener("click", () => {
      state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
      applyTheme(state.settings.theme);
      saveData();
    });

    document.getElementById("btnExportData").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pusula_yedek_${getTodayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("💾 Yedek dosyası indirildi.");
    });

    document.getElementById("inputImportData").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (parsed && Array.isArray(parsed.tasks)) {
            state = parsed;
            saveData();
            renderAll();
            showToast("📂 Yedek başarıyla yüklendi!");
          }
        } catch (err) {
          alert("Geçersiz JSON yedek dosyası.");
        }
      };
      reader.readAsText(file);
    });

    // Sadece Bu Sayfa (Tek Sayfa Odak) Modu
    const btnFocusPage = document.getElementById("btnToggleFocusPage");
    if (btnFocusPage) {
      btnFocusPage.addEventListener("click", () => {
        uiState.focusOnlyPage = !uiState.focusOnlyPage;
        const shell = document.querySelector(".app-shell");
        if (shell) {
          shell.classList.toggle("focus-only-page", uiState.focusOnlyPage);
        }
        btnFocusPage.textContent = uiState.focusOnlyPage ? "Menüyü Göster" : "Sadece Bu Sayfa";
        showToast(
          uiState.focusOnlyPage
            ? "🔲 Tek sayfa odak görünümü açıldı. Sol menü gizlendi."
            : "📋 Sol menü tekrar gösterildi."
        );
      });
    }

    // Günün Sözü (Gerçek Alıntılar — Her güne özel tek söz, değiştirme yok)
    const btnSaveQuoteToNotes = document.getElementById("btnSaveQuoteToNotes");
    if (btnSaveQuoteToNotes) {
      btnSaveQuoteToNotes.addEventListener("click", () => {
        const q = getCurrentQuote();
        const line = `❝ "${q.text}" — ${q.author} (${q.source})`;

        // 1. Kaydedilen Sözlerim Koleksiyonuna ekle
        state.savedQuotes = state.savedQuotes || [];
        const alreadySaved = state.savedQuotes.some((sq) => sq.text === q.text);
        if (!alreadySaved) {
          state.savedQuotes.unshift({
            id: uid("quote"),
            text: q.text,
            author: q.author,
            source: q.source,
            savedAt: getTodayISO()
          });
        }

        // 2. Sağ sütundaki "📓 Günün Notu & Yansıma" kutusuna ekle
        state.dailyNotes = state.dailyNotes || {};
        const current = state.dailyNotes[uiState.selectedDateISO] || "";
        if (!current.includes(q.text)) {
          state.dailyNotes[uiState.selectedDateISO] = current ? `${current}\n\n${line}` : line;
        }
        const noteEl = document.getElementById("textareaDailyNote");
        if (noteEl) {
          noteEl.value = state.dailyNotes[uiState.selectedDateISO];
          noteEl.classList.add("note-saved-highlight");
          setTimeout(() => noteEl.classList.remove("note-saved-highlight"), 2200);
        }

        // 3. Kaydedilen Sözlerim çekmecesini aç ki kullanıcı nereye kaydolduğunu hemen görsün
        const drawer = document.getElementById("savedQuotesDrawer");
        if (drawer) {
          drawer.classList.remove("hidden");
        }

        playClickSound();
        saveData();
        renderAll();
        showToast(
          "⭐ Söz hem '🔖 Kaydedilen Sözlerim' listesine hem de sağdaki '📓 Günün Notu' kutusuna kaydedildi!"
        );
      });
    }

    const btnToggleSavedQuotes = document.getElementById("btnToggleSavedQuotes");
    if (btnToggleSavedQuotes) {
      btnToggleSavedQuotes.addEventListener("click", () => {
        const drawer = document.getElementById("savedQuotesDrawer");
        if (drawer) {
          drawer.classList.toggle("hidden");
        }
      });
    }

    // Rutin Sekmeleri (Aktif / Arşiv / Çöp Kutusu)
    document.querySelectorAll("[data-routine-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.routineTab = btn.dataset.routineTab;
        renderRoutinesView();
      });
    });

    // Zamanlayıcı (Timer) Kontrolleri
    document.querySelectorAll("[data-timer-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        switchTimerMode(btn.dataset.timerMode);
      });
    });

    const btnTimerStartPause = document.getElementById("btnTimerStartPause");
    if (btnTimerStartPause) {
      btnTimerStartPause.addEventListener("click", () => {
        toggleTimerStartPause();
      });
    }

    const btnFloatingStartPause = document.getElementById("btnFloatingStartPause");
    if (btnFloatingStartPause) {
      btnFloatingStartPause.addEventListener("click", () => {
        toggleTimerStartPause();
      });
    }

    const btnFloatingOpenTimer = document.getElementById("btnFloatingOpenTimer");
    if (btnFloatingOpenTimer) {
      btnFloatingOpenTimer.addEventListener("click", () => {
        switchView("timer");
      });
    }

    const btnTimerReset = document.getElementById("btnTimerReset");
    if (btnTimerReset) {
      btnTimerReset.addEventListener("click", () => {
        switchTimerMode(uiState.timer.mode);
        broadcastTimerAction("RESET", {
          mode: uiState.timer.mode,
          totalSeconds: uiState.timer.totalSeconds,
          remainingSeconds: uiState.timer.remainingSeconds
        });
        showToast("↺ Sayaç sıfırlandı.");
      });
    }
    // Ortak Pomodoro Odası Etkinlikleri
    initRoomState();

    const btnOpenRoomModal = document.getElementById("btnOpenRoomModal");
    if (btnOpenRoomModal) {
      btnOpenRoomModal.addEventListener("click", () => {
        openModal("modalRoomConnect");
      });
    }

    const btnCreateRoom = document.getElementById("btnCreateRoom");
    if (btnCreateRoom) {
      btnCreateRoom.addEventListener("click", () => {
        createPomodoroRoom();
      });
    }

    const btnJoinRoom = document.getElementById("btnJoinRoom");
    if (btnJoinRoom) {
      btnJoinRoom.addEventListener("click", () => {
        const inp = document.getElementById("inputRoomCode");
        if (inp) joinPomodoroRoom(inp.value);
      });
    }

    const btnLeaveRoom = document.getElementById("btnLeaveRoom");
    if (btnLeaveRoom) {
      btnLeaveRoom.addEventListener("click", () => {
        leavePomodoroRoom();
      });
    }

    const btnCloseRoom = document.getElementById("btnCloseRoom");
    if (btnCloseRoom) {
      btnCloseRoom.addEventListener("click", () => {
        closePomodoroRoom();
      });
    }

    const btnModalCloseRoom = document.getElementById("btnModalCloseRoom");
    if (btnModalCloseRoom) {
      btnModalCloseRoom.addEventListener("click", () => {
        closePomodoroRoom();
        closeModal("modalRoomConnect");
      });
    }

    const btnModalLeaveRoom = document.getElementById("btnModalLeaveRoom");
    if (btnModalLeaveRoom) {
      btnModalLeaveRoom.addEventListener("click", () => {
        leavePomodoroRoom();
        closeModal("modalRoomConnect");
      });
    }

    const btnCopyRoomLinkBanner = document.getElementById("btnCopyRoomLinkBanner");
    if (btnCopyRoomLinkBanner) {
      btnCopyRoomLinkBanner.addEventListener("click", () => {
        copyRoomInviteLink();
      });
    }

    const btnCopyInviteLinkModal = document.getElementById("btnCopyInviteLinkModal");
    if (btnCopyInviteLinkModal) {
      btnCopyInviteLinkModal.addEventListener("click", () => {
        copyRoomInviteLink();
      });
    }

    // "Şu an ne çalışıyorum" formu
    const roomWorkForm = document.getElementById("roomWorkForm");
    if (roomWorkForm) {
      roomWorkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = document.getElementById("inputRoomWork");
        const text = inp ? inp.value : "";
        if (!sanitizeWork({ text })) {
          showToast("✏️ Önce ne çalıştığını kısaca yaz.");
          return;
        }
        setMyWork({ text, done: false });
        if (inp) inp.blur();
        showToast("📝 Durumun odadakilerle paylaşıldı.");
      });
    }
    const btnRoomWorkDone = document.getElementById("btnRoomWorkDone");
    if (btnRoomWorkDone) {
      btnRoomWorkDone.addEventListener("click", () => {
        if (!roomState.myWork) return;
        setMyWork({ text: roomState.myWork.text, done: !roomState.myWork.done });
      });
    }
    const btnRoomWorkClear = document.getElementById("btnRoomWorkClear");
    if (btnRoomWorkClear) {
      btnRoomWorkClear.addEventListener("click", () => {
        setMyWork(null);
        const inp = document.getElementById("inputRoomWork");
        if (inp) inp.value = "";
      });
    }

    // Mola sohbeti
    const roomChatForm = document.getElementById("roomChatForm");
    if (roomChatForm) {
      roomChatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = document.getElementById("inputRoomChat");
        if (!inp || !inp.value.trim()) return;
        sendRoomChat(inp.value);
        if (!isRoomChatLocked()) inp.value = "";
      });
    }
    const inputRoomChat = document.getElementById("inputRoomChat");
    if (inputRoomChat) {
      inputRoomChat.addEventListener("focus", () => {
        roomState.chatUnread = 0;
        renderRoomChatUnread();
      });
    }
    window.addEventListener("scroll", () => maybeClearRoomChatUnread(), { passive: true });
    document.addEventListener("visibilitychange", () => maybeClearRoomChatUnread());
    renderRoomChat();

    const btnCopyRoomCode = document.getElementById("btnCopyRoomCode");
    if (btnCopyRoomCode) {
      btnCopyRoomCode.addEventListener("click", () => {
        const codeEl = document.getElementById("displayRoomCode");
        if (codeEl && codeEl.textContent) {
          navigator.clipboard.writeText(codeEl.textContent);
          showToast("📋 Oda kodu kopyalandı! Arkadaşına gönderebilirsin.");
        }
      });
    }


    const btnTimerSkip = document.getElementById("btnTimerSkip");
    if (btnTimerSkip) {
      btnTimerSkip.addEventListener("click", () => {
        const nextMode = uiState.timer.mode === "study" ? "short_break" : "study";
        switchTimerMode(nextMode);
      });
    }

    document.querySelectorAll("[data-set-mins]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mins = Number(btn.dataset.setMins);
        if (mins > 0) {
          switchTimerMode(uiState.timer.mode, mins);
          showToast(`⏱️ Süre ${mins} dakika olarak ayarlandı.`);
        }
      });
    });

    const btnApplyCustomMins = document.getElementById("btnApplyCustomMins");
    if (btnApplyCustomMins) {
      btnApplyCustomMins.addEventListener("click", () => {
        const inp = document.getElementById("inputCustomTimerMins");
        const val = Number(inp && inp.value);
        if (val > 0 && val <= 240) {
          switchTimerMode(uiState.timer.mode, val);
          inp.value = "";
          showToast(`⏱️ Özel süre (${val} dk) uygulandı.`);
        }
      });
    }

    const cfgStudy = document.getElementById("cfgStudyMins");
    const cfgShort = document.getElementById("cfgShortBreakMins");
    const cfgLong = document.getElementById("cfgLongBreakMins");
    if (cfgStudy) {
      cfgStudy.addEventListener("change", () => {
        const v = Math.max(1, Math.min(180, Number(cfgStudy.value) || 25));
        uiState.timer.studyMins = v;
        if (uiState.timer.mode === "study" && !uiState.timer.running) switchTimerMode("study", v);
      });
    }
    if (cfgShort) {
      cfgShort.addEventListener("change", () => {
        const v = Math.max(1, Math.min(60, Number(cfgShort.value) || 5));
        uiState.timer.shortBreakMins = v;
        if (uiState.timer.mode === "short_break" && !uiState.timer.running) switchTimerMode("short_break", v);
      });
    }
    if (cfgLong) {
      cfgLong.addEventListener("change", () => {
        const v = Math.max(1, Math.min(90, Number(cfgLong.value) || 15));
        uiState.timer.longBreakMins = v;
        if (uiState.timer.mode === "long_break" && !uiState.timer.running) switchTimerMode("long_break", v);
      });
    }

    // Ses Efektleri ve Arka Plan Ambiyans Kontrolleri
    const btnTestAlarmSound = document.getElementById("btnTestAlarmSound");
    if (btnTestAlarmSound) {
      btnTestAlarmSound.addEventListener("click", () => {
        playBellSound(uiState.timer.bellType);
        showToast("🔔 Zil sesi test edildi.");
      });
    }

    const toggleSoundEffects = document.getElementById("toggleSoundEffects");
    if (toggleSoundEffects) {
      toggleSoundEffects.addEventListener("change", () => {
        uiState.timer.soundEnabled = toggleSoundEffects.checked;
      });
    }

    const selectBellType = document.getElementById("selectBellType");
    if (selectBellType) {
      selectBellType.addEventListener("change", () => {
        uiState.timer.bellType = selectBellType.value;
        playBellSound(uiState.timer.bellType);
      });
    }

    document.querySelectorAll("[data-ambient]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-ambient]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const type = btn.dataset.ambient;
        setAmbientSound(type);
        if (type === "none") {
          showToast("🔇 Arka plan ambiyans sesi kapatıldı.");
        } else {
          showToast("🌧️ Odak ambiyans sesi başlatıldı.");
        }
      });
    });

    const rangeSoundVolume = document.getElementById("rangeSoundVolume");
    if (rangeSoundVolume) {
      rangeSoundVolume.addEventListener("input", () => {
        uiState.timer.volume = Number(rangeSoundVolume.value) / 100;
        if (ambientNodes && ambientNodes.gain && audioCtx) {
          const mult = uiState.timer.ambientType === "focus_drone" ? 0.12 : 0.18;
          ambientNodes.gain.gain.setTargetAtTime(uiState.timer.volume * mult, audioCtx.currentTime, 0.1);
        }
      });
    }

    // Alt Paneldeki (Sidebar Footer) Çöp Kutusu & Verileri Sıfırlama Butonları
    const btnFooterTrash = document.getElementById("btnFooterTrash");
    if (btnFooterTrash) {
      btnFooterTrash.addEventListener("click", () => {
        switchView("trash");
      });
    }

    const btnFooterReset = document.getElementById("btnFooterReset");
    if (btnFooterReset) {
      btnFooterReset.addEventListener("click", () => {
        openModal("modalResetData");
      });
    }

    const btnOpenResetFromTrashView = document.getElementById("btnOpenResetFromTrashView");
    if (btnOpenResetFromTrashView) {
      btnOpenResetFromTrashView.addEventListener("click", () => {
        openModal("modalResetData");
      });
    }

    // Notlarım Sayfası Kontrolleri (Tarih Seçici, Hızlı Kayıt ve Filtreler)
    const inputNotesPageDate = document.getElementById("inputNotesPageDate");
    if (inputNotesPageDate) {
      inputNotesPageDate.addEventListener("change", () => {
        if (inputNotesPageDate.value) {
          uiState.notesPageDateISO = inputNotesPageDate.value;
          const area = document.getElementById("textareaNotesPageContent");
          if (area) {
            area.value = (state.dailyNotes && state.dailyNotes[uiState.notesPageDateISO]) || "";
          }
          renderNotesView();
        }
      });
    }

    const formNotesPageQuickAdd = document.getElementById("formNotesPageQuickAdd");
    if (formNotesPageQuickAdd) {
      formNotesPageQuickAdd.addEventListener("submit", (e) => {
        e.preventDefault();
        const dateVal =
          (inputNotesPageDate && inputNotesPageDate.value) || uiState.notesPageDateISO || getTodayISO();
        const area = document.getElementById("textareaNotesPageContent");
        const selectNoteType = document.getElementById("selectNoteType");
        const typeVal = (selectNoteType && selectNoteType.value) || "daily";
        let text = (area && area.value.trim()) || "";
        if (!text) return;

        state.reports = Array.isArray(state.reports) ? state.reports : [];

        if (typeVal === "report_user" || typeVal === "report_ai") {
          const isAi = typeVal === "report_ai" || text.toLowerCase().includes("#ai");
          if (isAi && !text.includes("#ai")) {
            text = `${text} #ai`;
          }
          const firstLine = text.split("\n")[0].replace(/#\w+/g, "").trim().slice(0, 50);
          const reportTitle = firstLine ? firstLine : (isAi ? "🤖 AI Raporu" : "📊 Şahsi Rapor");
          state.reports.unshift({
            id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            title: reportTitle,
            date: dateVal,
            author: isAi ? "ai" : "user",
            content: text,
            tags: isAi ? ["#ai"] : [],
            createdAt: new Date().toISOString()
          });
          uiState.notesPageDateISO = dateVal;
          if (area) area.value = "";
          saveData();
          renderAll();
          showToast(`📊 ${isAi ? "🤖 Yapay Zeka" : "👤 Şahsi"} raporu kaydedildi!`);
        } else {
          state.dailyNotes = state.dailyNotes || {};
          state.dailyNotes[dateVal] = text;
          uiState.notesPageDateISO = dateVal;
          saveData();
          renderAll();
          showToast(`📓 ${formatFullTR(dateVal)} gününün şahsi notu kaydedildi!`);
        }
      });
    }

    document.querySelectorAll("[data-compiled-note-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.compiledNoteFilter = btn.dataset.compiledNoteFilter;
        // Raporlar sekmesi seçildiyse türü şahsi rapora çek, günlük not seçildiyse günlük nota çek
        const selectNoteType = document.getElementById("selectNoteType");
        if (selectNoteType) {
          if (uiState.compiledNoteFilter === "reports") {
            selectNoteType.value = "report_user";
          } else if (uiState.compiledNoteFilter === "daily") {
            selectNoteType.value = "daily";
          }
        }
        renderNotesView();
      });
    });

    document.querySelectorAll("[data-note-subfilter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.noteSubFilter = btn.dataset.noteSubfilter;
        renderNotesView();
      });
    });

    // Çöp Kutusu Sayfası Filtreleri
    document.querySelectorAll("[data-trash-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.trashFilter = btn.dataset.trashFilter;
        renderTrashView();
      });
    });

    function emptyAllTrashItems() {
      state.routines = (state.routines || []).filter((r) => r.status !== "trashed");
      state.trashedTasks = [];
      state.trashedGoals = [];
      saveData();
      renderAll();
      showToast("🔥 Çöp kutusundaki tüm öğeler kalıcı olarak temizlendi.");
    }

    const btnEmptyTrashBin = document.getElementById("btnEmptyTrashBin");
    if (btnEmptyTrashBin) {
      btnEmptyTrashBin.addEventListener("click", () => {
        emptyAllTrashItems();
      });
    }

    const btnResetOnlyTrash = document.getElementById("btnResetOnlyTrash");
    if (btnResetOnlyTrash) {
      btnResetOnlyTrash.addEventListener("click", () => {
        emptyAllTrashItems();
        closeModal("modalResetData");
      });
    }

    const btnResetToBlank = document.getElementById("btnResetToBlank");
    if (btnResetToBlank) {
      btnResetToBlank.addEventListener("click", () => {
        const currentTheme = (state.settings && state.settings.theme) || "dark";
        const currentRollover = Boolean(state.settings && state.settings.autoRollover);
        state = {
          settings: {
            theme: currentTheme,
            autoRollover: currentRollover,
            lastOpenedDate: getTodayISO()
          },
          goals: [],
          tasks: [],
          routines: [],
          trashedTasks: [],
          trashedGoals: [],
          focusStats: {},
          dailyNotes: {},
          weeklyNotes: {}
        };
        saveData();
        closeModal("modalResetData");
        switchView("daily");
        renderAll();
        showToast("🌱 Tüm veriler sıfırlandı! Kendi düzenini kurman için tertemiz bir sayfa açıldı.");
      });
    }

    const btnResetToSample = document.getElementById("btnResetToSample");
    if (btnResetToSample) {
      btnResetToSample.addEventListener("click", () => {
        const currentTheme = (state.settings && state.settings.theme) || "dark";
        state = createDefaultData();
        state.settings.theme = currentTheme;
        state.trashedTasks = [];
        state.trashedGoals = [];
        saveData();
        closeModal("modalResetData");
        switchView("daily");
        renderAll();
        showToast("🔄 Varsayılan örnek şablon verileri geri yüklendi.");
      });
    }

    // Delegated Click & Input Events (Görev Kartları, Hedef Kartları, Rutinler, Arşiv & Çöp Kutusu)
    document.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-action]");
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;

        if (action === "toggle-task") {
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            task.completed = !task.completed;
            playClickSound();
            saveData();
            renderAll();
          }
        } else if (action === "toggle-expand") {
          if (uiState.expandedTaskIds.has(id)) {
            uiState.expandedTaskIds.delete(id);
          } else {
            uiState.expandedTaskIds.add(id);
          }
          renderAll();
        } else if (action === "postpone-task") {
          openPostponeModal(id);
        } else if (action === "edit-task") {
          const task = state.tasks.find((t) => t.id === id);
          if (task) openTaskModal(task);
        } else if (action === "delete-task") {
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            state.trashedTasks = state.trashedTasks || [];
            state.trashedTasks.unshift(Object.assign({}, task, { trashedAt: getTodayISO() }));
          }
          state.tasks = state.tasks.filter((t) => t.id !== id);
          saveData();
          renderAll();
          showToast("🗑️ Görev Çöp Kutusu'na taşındı (Alt panelden geri yükleyebilirsin).");
        } else if (action === "restore-trashed-task") {
          state.trashedTasks = state.trashedTasks || [];
          const found = state.trashedTasks.find((t) => t.id === id);
          if (found) {
            delete found.trashedAt;
            state.tasks.push(found);
            state.trashedTasks = state.trashedTasks.filter((t) => t.id !== id);
            saveData();
            renderAll();
            showToast("♻️ Görev aktif listeye geri yüklendi!");
          }
        } else if (action === "purge-trashed-task") {
          state.trashedTasks = (state.trashedTasks || []).filter((t) => t.id !== id);
          saveData();
          renderAll();
          showToast("🔥 Görev çöp kutusundan kalıcı olarak silindi.");
        } else if (action === "assign-day") {
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            task.scope = "day";
            task.date = uiState.selectedDateISO;
            task.weekMonday = getWeekMondayISO(uiState.selectedDateISO);
            saveData();
            renderAll();
            showToast(`📌 Görev ${formatShortTR(uiState.selectedDateISO)} gününe alındı.`);
          }
        } else if (action === "add-inline-subtask") {
          const inp = document.querySelector(`[data-subtask-input="${id}"]`);
          if (inp && inp.value.trim()) {
            const task = state.tasks.find((t) => t.id === id);
            if (task) {
              task.subtasks = task.subtasks || [];
              task.subtasks.push({ id: uid("st"), text: inp.value.trim(), done: false });
              saveData();
              renderAll();
            }
          }
        } else if (action === "toggle-subtask") {
          const taskId = actionBtn.dataset.taskId;
          const idx = Number(actionBtn.dataset.idx);
          const task = state.tasks.find((t) => t.id === taskId);
          if (task && task.subtasks && task.subtasks[idx]) {
            task.subtasks[idx].done = !task.subtasks[idx].done;
            saveData();
            renderAll();
          }
        } else if (action === "toggle-routine-day") {
          const dateISO = actionBtn.dataset.date;
          const routine = state.routines.find((r) => r.id === id);
          if (routine && dateISO) {
            routine.completions = routine.completions || {};
            routine.completions[dateISO] = !routine.completions[dateISO];
            playClickSound();
            saveData();
            renderAll();
          }
        } else if (action === "edit-routine") {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) openRoutineModal(routine);
        } else if (action === "archive-routine") {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) {
            routine.status = "archived";
            routine.archivedAt = getTodayISO();
            saveData();
            renderAll();
            showToast("📦 Rutin arşivlendi. Önceki seri geçmişin güvende!");
          }
        } else if (action === "trash-routine" || action === "delete-routine") {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) {
            routine.status = "trashed";
            routine.trashedAt = getTodayISO();
            saveData();
            renderAll();
            showToast("🗑️ Rutin Çöp Kutusu'na taşındı (İstediğin zaman geri yükleyebilirsin).");
          }
        } else if (action === "restore-routine") {
          const routine = state.routines.find((r) => r.id === id);
          if (routine) {
            routine.status = "active";
            saveData();
            renderAll();
            showToast("♻️ Rutin tüm seri geçmişiyle birlikte aktif listeye geri yüklendi!");
          }
        } else if (action === "purge-routine") {
          state.routines = state.routines.filter((r) => r.id !== id);
          saveData();
          renderAll();
          showToast("🔥 Rutin çöp kutusundan kalıcı olarak silindi.");
        } else if (action === "add-task-for-goal") {
          openTaskModal(null, id, "day");
        } else if (action === "edit-goal") {
          const goal = getGoalById(id);
          if (goal) openGoalModal(goal);
        } else if (action === "toggle-goal-complete") {
          const goal = getGoalById(id);
          if (goal) {
            goal.completed = !goal.completed;
            saveData();
            renderAll();
            showToast(goal.completed ? "🏆 Tebrikler! Hedef tamamlandı." : "↩️ Hedef tekrar aktif edildi.");
          }
        } else if (action === "delete-goal") {
          const goal = getGoalById(id);
          if (goal) {
            state.trashedGoals = state.trashedGoals || [];
            state.trashedGoals.unshift(Object.assign({}, goal, { trashedAt: getTodayISO() }));
          }
          state.goals = state.goals.filter((g) => g.id !== id);
          state.tasks.forEach((t) => {
            if (t.goalId === id) t.goalId = "";
          });
          saveData();
          renderAll();
          showToast("🗑️ Hedef Çöp Kutusu'na taşındı (Alt panelden geri yükleyebilirsin).");
        } else if (action === "restore-trashed-goal") {
          state.trashedGoals = state.trashedGoals || [];
          const found = state.trashedGoals.find((g) => g.id === id);
          if (found) {
            delete found.trashedAt;
            state.goals.push(found);
            state.trashedGoals = state.trashedGoals.filter((g) => g.id !== id);
            saveData();
            renderAll();
            showToast("♻️ Hedef aktif listeye geri yüklendi!");
          }
        } else if (action === "purge-trashed-goal") {
          state.trashedGoals = (state.trashedGoals || []).filter((g) => g.id !== id);
          saveData();
          renderAll();
          showToast("🔥 Hedef çöp kutusundan kalıcı olarak silindi.");
        } else if (action === "toggle-milestone") {
          const goalId = actionBtn.dataset.goalId;
          const idx = Number(actionBtn.dataset.idx);
          const goal = getGoalById(goalId);
          if (goal && goal.milestones && goal.milestones[idx]) {
            goal.milestones[idx].done = !goal.milestones[idx].done;
            saveData();
            renderAll();
          }
        } else if (action === "delete-saved-quote") {
          state.savedQuotes = (state.savedQuotes || []).filter((sq) => sq.id !== id);
          saveData();
          renderAll();
          showToast("🗑️ Söz koleksiyondan kaldırıldı.");
        } else if (action === "jump-note-date") {
          const dISO = actionBtn.dataset.date;
          if (dISO) {
            uiState.selectedDateISO = dISO;
            switchView("daily");
            showToast(`📅 ${formatFullTR(dISO)} gününe gidildi.`);
          }
        } else if (action === "jump-week-note") {
          const wISO = actionBtn.dataset.date;
          if (wISO) {
            uiState.selectedWeekMondayISO = getWeekMondayISO(wISO);
            switchView("weekly");
            showToast(`📅 ${formatWeekRangeTR(wISO)} haftasına gidildi.`);
          }
        } else if (action === "edit-daily-note-in-page") {
          const dISO = actionBtn.dataset.date;
          if (dISO) {
            uiState.notesPageDateISO = dISO;
            const dateInp = document.getElementById("inputNotesPageDate");
            const area = document.getElementById("textareaNotesPageContent");
            if (dateInp) dateInp.value = dISO;
            if (area) {
              area.value = (state.dailyNotes && state.dailyNotes[dISO]) || "";
              area.focus();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            renderNotesView();
            showToast(`✏️ ${formatFullTR(dISO)} notu düzenleme kutusuna yüklendi.`);
          }
        } else if (action === "delete-daily-note") {
          const dISO = actionBtn.dataset.date;
          if (dISO && state.dailyNotes) {
            delete state.dailyNotes[dISO];
            saveData();
            renderAll();
            showToast("🗑️ Günlük not silindi.");
          }
        } else if (action === "delete-weekly-note") {
          const wISO = actionBtn.dataset.date;
          if (wISO && state.weeklyNotes) {
            delete state.weeklyNotes[wISO];
            saveData();
            renderAll();
            showToast("🗑️ Haftalık not silindi.");
          }
        } else if (action === "edit-report") {
          const repId = actionBtn.dataset.id;
          const rep = (state.reports || []).find((r) => r.id === repId);
          if (rep) {
            const newTitle = prompt("Rapor Başlığı:", rep.title || "Çalışma Raporu");
            if (newTitle === null) return;
            const newContent = prompt(
              "Rapor İçeriği (Yapay zeka için metne #ai ekleyebilirsiniz):",
              rep.content || ""
            );
            if (newContent === null) return;
            rep.title = newTitle.trim();
            rep.content = newContent.trim();
            const isAi = rep.content.includes("#ai");
            rep.author = isAi ? "ai" : (rep.author || "user");
            rep.tags = isAi ? ["#ai"] : [];
            saveData();
            renderAll();
            showToast("✅ Rapor güncellendi.");
          }
        } else if (action === "delete-report") {
          const repId = actionBtn.dataset.id;
          if (repId && state.reports) {
            if (confirm("Bu raporu silmek istediğine emin misin?")) {
              state.reports = state.reports.filter((r) => r.id !== repId);
              saveData();
              renderAll();
              showToast("🗑️ Rapor silindi.");
            }
          }
        }
        return;
      }

      const jumpGoal = e.target.closest("[data-jump-goal]");
      if (jumpGoal) {
        switchView("goals");
      }
    });

    // Görev Altı Inline Not Otomatik Kayıt
    document.addEventListener("input", (e) => {
      if (e.target.matches("[data-inline-note-id]")) {
        const taskId = e.target.dataset.inlineNoteId;
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.note = e.target.value;
          saveData();
        }
      }
    });
  }

  // =========================================================
  // GERÇEK ZAMANLI SAAT & ZAMANLAYICI DÖNGÜSÜ (1 SANİYE)
  // =========================================================
  function startRealTimeLoop() {
    let lastKnownTodayISO = getTodayISO();

    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      const dateLabel = `${now.getDate()} ${TR_MONTHS[now.getMonth()]} ${now.getFullYear()}, ${TR_DAYS_FULL[now.getDay()]}`;

      const clockEl = document.getElementById("liveClockText");
      if (clockEl) {
        clockEl.textContent = `${hh}:${mm}:${ss} • ${dateLabel}`;
      }

      // Gece yarısı gün değişimi kontrolü (gerçek zamanla tam eşzamanlılık)
      const currentTodayISO = getTodayISO();
      if (currentTodayISO !== lastKnownTodayISO) {
        const wasOnToday = uiState.selectedDateISO === lastKnownTodayISO;
        lastKnownTodayISO = currentTodayISO;
        if (wasOnToday) {
          uiState.selectedDateISO = currentTodayISO;
          uiState.selectedWeekMondayISO = getWeekMondayISO(currentTodayISO);
        }
        renderAll();
        showToast(`🌅 Yeni güne geçildi: ${formatFullTR(currentTodayISO)}`);
      }

      // Odak & Ders Zamanlayıcısı çalışıyorsa gerçek zamana göre geri say
      if (uiState.timer.running && uiState.timer.targetTimestamp) {
        const diffSec = Math.max(0, Math.round((uiState.timer.targetTimestamp - Date.now()) / 1000));
        uiState.timer.remainingSeconds = diffSec;
        updateTimerDOM();
        saveTimerState();
        if (diffSec <= 0) {
          handleTimerComplete();
        }
      }
    };

    tick();
    setInterval(tick, 1000);
  }

  // =========================================================
  // BAŞLATMA
  // =========================================================
  document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();
    await loadData();
    restoreTimerState();
    startRealTimeLoop();
    // Sayfa yenilendiyse (host ya da misafir) odaya otomatik geri dön
    resumeRoomSession();
  });
})();
