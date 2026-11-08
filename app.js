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
      dailyNotes: {
        [today]: "Yeni planlayıcı sistemimi kurdum. Amacım kendimi saat saat robot gibi sıkmak değil; neyi neden yaptığımı bilerek, ertelediğimde bile farkındalıkla yöneterek sürdürülebilir bir düzen yakalamak."
      },
      weeklyNotes: {
        [weekMon]: "Bu haftanın ana odağı: Günlük 2-3 temel görevi istikrarlı şekilde tamamlamak ve kısa vadeli okuma hedefimde ivme yakalamak."
      }
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
      state.dailyNotes = loaded.dailyNotes || {};
      state.weeklyNotes = loaded.weeklyNotes || {};
      state.savedQuotes = Array.isArray(loaded.savedQuotes) ? loaded.savedQuotes : [];
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
    const totalCompiledNotesCount =
      dailyNotesCount + weeklyNotesCount + taskGoalNotesCount + savedQuotesCount;

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
      badgeEl.textContent = `📜 GÜNÜN SÖZÜ • YILIN ${dayOfYear}. GÜNÜ (${AUTHENTIC_QUOTES.length} GERÇEK ALINTI ARŞİVİ)`;
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
        listEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:6px 0;">Henüz kaydettiğin bir söz yok. Yukarıdaki "⭐ Nota & Koleksiyona Kaydet" butonuna bastığında burada listelenir.</div>`;
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
    card.className = `task-card ${task.completed ? "completed" : ""}`;

    const goal = task.goalId ? getGoalById(task.goalId) : null;
    const isExpanded = uiState.expandedTaskIds.has(task.id);
    const subtasks = task.subtasks || [];
    const doneSubtasks = subtasks.filter((s) => s.done).length;

    let priorityBadge = "";
    if (task.priority === "high") {
      priorityBadge = `<span class="badge badge-priority-high">🔴 Öncelikli</span>`;
    } else if (task.priority === "postponed") {
      priorityBadge = `<span class="badge badge-priority-postponed">⏳ Ertelenmiş</span>`;
    } else if (task.priority === "low") {
      priorityBadge = `<span class="badge badge-priority-low">🟢 Esnek</span>`;
    }

    const goalBadge = goal
      ? `<span class="badge badge-goal" data-jump-goal="${goal.id}" title="Hedefe git">🎯 ${escapeHtml(goal.title)}</span>`
      : "";

    const categoryBadge = task.category
      ? `<span class="badge badge-category">${escapeHtml(task.category)}</span>`
      : "";

    const scopeBadge =
      task.scope === "week"
        ? `<span class="badge badge-weekpool">🧺 Haftalık Esnek</span>`
        : options.showDate && task.date
        ? `<span class="badge badge-category">📅 ${formatShortTR(task.date)}</span>`
        : "";

    const postponeBadge =
      (task.postponeCount || 0) > 0
        ? `<span class="badge badge-postponed" title="Bu görev ${task.postponeCount} kez ertelendi">⏳ ${task.postponeCount}x ertelendi</span>`
        : "";

    const subtasksBadge =
      subtasks.length > 0
        ? `<span class="badge badge-category">☑️ ${doneSubtasks}/${subtasks.length} adım</span>`
        : "";

    const focusBadge =
      (task.focusedMinutes || 0) > 0
        ? `<span class="badge badge-streak">⏱️ ${task.focusedMinutes} dk odaklanıldı</span>`
        : "";

    const assignToDayBtn =
      task.scope === "week" && options.allowAssignToSelectedDay
        ? `<button class="action-btn" data-action="assign-day" data-id="${task.id}" title="Seçili güne (${formatShortTR(uiState.selectedDateISO)}) ata">📌 Güne Al</button>`
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
              ? `<div class="task-note-preview" data-action="toggle-expand" data-id="${task.id}" title="Notu düzenlemek için tıkla">📝 ${escapeHtml(task.note)}</div>`
              : ""
          }
        </div>

        <div class="task-actions">
          ${assignToDayBtn}
          <button class="action-btn" data-action="toggle-expand" data-id="${task.id}" title="Altına Not Yaz / Alt Adımlar">
            📝 ${isExpanded ? "Kapat" : "Not"}
          </button>
          ${
            !task.completed && task.scope !== "week"
              ? `<button class="action-btn postpone-btn" data-action="postpone-task" data-id="${task.id}" title="Görevi Ertele">⏭️ Ertele</button>`
              : ""
          }
          <button class="action-btn" data-action="edit-task" data-id="${task.id}" title="Düzenle">✏️</button>
          <button class="action-btn" data-action="delete-task" data-id="${task.id}" title="Sil">🗑️</button>
        </div>
      </div>

      ${
        isExpanded
          ? `
        <div class="task-drawer">
          <div class="task-inline-note-box">
            <label>📝 Görev Altı Notu (Otomatik kaydedilir)</label>
            <textarea data-inline-note-id="${task.id}" placeholder="Bu görevle ilgili ilerleme notun, düşüncelerin veya bağlantılar...">${escapeHtml(task.note || "")}</textarea>
          </div>

          <div class="subtasks-inline">
            <label style="font-size:11.5px;font-weight:600;color:var(--text-secondary);">☑️ Alt Adımlar</label>
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
              <strong>⏳ Erteleme Geçmişi (${task.postponeHistory.length} kez)</strong>
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
                <span class="badge badge-streak">🔥 ${streak} gün seri</span>
                <span class="badge badge-category">🔁 ${getRoutineFreqLabel(r)}</span>
                ${goal ? `<span class="badge badge-goal" data-jump-goal="${goal.id}">🎯 ${escapeHtml(goal.title)}</span>` : ""}
              </div>
              ${r.note ? `<div class="task-note-preview">📌 ${escapeHtml(r.note)}</div>` : ""}
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
            <strong style="font-size:12.5px;">${g.horizon === "long" ? "🏔️" : "⚡"} ${escapeHtml(g.title)}</strong>
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
            <strong style="font-size:12.5px;">${g.horizon === "long" ? "🏔️" : "⚡"} ${escapeHtml(g.title)}</strong>
            <span class="badge ${isDeadlineToday ? "badge-priority-high" : "badge-category"}">
              ${isDeadlineToday ? "🎯 VADE SONU BUGÜN" : `Vade: ${formatShortTR(g.targetDate)}`}
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
          `<div class="cal-pill-item goal-deadline" title="Hedef Vade Bitişi: ${escapeHtml(g.title)}">🎯 ${escapeHtml(g.title)}</div>`
        );
      });

      // Görevleri göster
      dayTasks.forEach((t) => {
        const cls = t.completed ? "done" : (t.postponeCount || 0) > 0 ? "postponed" : "";
        const icon = t.completed ? "✓" : (t.postponeCount || 0) > 0 ? "⏳" : "•";
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
            ${hasNote ? `<span title="Günlük notu var">📓</span>` : ""}
            ${dueRoutines.length > 0 ? `<span style="color:var(--text-muted);font-size:10px;" title="Tamamlanan Rutinler">🔁${doneRoutinesCount}/${dueRoutines.length}</span>` : ""}
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
        <strong>🎯 Hedef Vade Günü:</strong> ${escapeHtml(g.title)}
        <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">İlerleme: %${calculateGoalProgress(g)}</div>
      `;
      containerEl.appendChild(gBanner);
    });

    // 2. O günün görevleri
    const dayTasks = state.tasks.filter((t) => t.scope === "day" && t.date === isoDate);
    const tasksHeader = document.createElement("div");
    tasksHeader.style.cssText = "font-size:12px;font-weight:700;color:var(--text-secondary);margin-top:4px;";
    tasksHeader.textContent = `✅ Günün Görevleri (${dayTasks.filter((t) => t.completed).length}/${dayTasks.length})`;
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
      rHeader.textContent = `🔁 Günün Rutinleri`;
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
              <span class="badge badge-streak" style="margin-left:6px;">🔥 ${calculateRoutineStreak(r)}</span>
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
        📓 ${formatShortTR(isoDate)} Günlük Notu
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
        <div class="summary-kpi-label">📅 ${year} Yılı Planlı Görevler</div>
        <div class="summary-kpi-val">${yearTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">✅ Tamamlanan Görevler</div>
        <div class="summary-kpi-val" style="color:var(--success);">${yearDone}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">🎯 ${year} Yılı Hedefleri</div>
        <div class="summary-kpi-val">${yearGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">📓 Günlük Not Yazılan Gün</div>
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
              ${isTargetMonth ? `🎯 %${prog}` : isOverlapping ? "•" : ""}
            </div>
          `;
        }

        row.innerHTML = `
          <div class="roadmap-goal-name" title="${escapeHtml(g.title)}">
            ${g.horizon === "long" ? "🏔️" : "⚡"} ${escapeHtml(g.title)}
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
          hasGoal ? "🎯 Hedef Vade Sonu" : ""
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
        <div class="summary-kpi-label">⚡ Aktif Kısa Vadeli Hedefler</div>
        <div class="summary-kpi-val">${shortGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">🏔️ Aktif Uzun Vadeli Hedefler</div>
        <div class="summary-kpi-val">${longGoals.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">🔗 Hedefe Bağlı Görev Sayısı</div>
        <div class="summary-kpi-val">${state.tasks.filter((t) => Boolean(t.goalId)).length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">🏆 Tamamlanan Hedefler</div>
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
              ${goal.horizon === "long" ? "🏔️ UZUN VADELİ HEDEF" : "⚡ KISA VADELİ HEDEF"}
            </span>
            <span class="badge badge-category" style="margin-left:6px;">${escapeHtml(goal.category || "Genel")}</span>
            <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
            ${
              parentGoal
                ? `<div style="font-size:11.5px;color:var(--text-muted);margin-top:3px;">🔗 Üst Vizyon: <strong>${escapeHtml(parentGoal.title)}</strong></div>`
                : ""
            }
          </div>

          <div class="task-actions">
            <button class="action-btn" data-action="add-task-for-goal" data-id="${goal.id}" title="Bu hedefe bağlı yeni görev ekle">＋ Görev</button>
            <button class="action-btn" data-action="edit-goal" data-id="${goal.id}" title="Hedefi Düzenle">✏️</button>
            <button class="action-btn" data-action="toggle-goal-complete" data-id="${goal.id}" title="${goal.completed ? "Aktif Et" : "Hedefi Tamamlandı İşaretle"}">
              ${goal.completed ? "↩️" : "🏆"}
            </button>
            <button class="action-btn" data-action="delete-goal" data-id="${goal.id}" title="Hedefi Sil">🗑️</button>
          </div>
        </div>

        ${goal.why ? `<div class="goal-why-box">💡 ${escapeHtml(goal.why)}</div>` : ""}

        <div class="goal-timeline-meta">
          <div>
            <span>📅 Vade: <strong>${formatShortTR(goal.startDate)} → ${formatShortTR(goal.targetDate)}</strong></span>
            <span style="margin-left:6px;color:var(--text-muted);">(${timeStats.totalDays} gün)</span>
          </div>
          <span class="deadline-countdown ${timeStats.statusClass}">⏳ ${timeStats.remainingLabel}</span>
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
              <span>🚩 Kilometre Taşları (Alt Hedefler)</span>
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
            <span>📌 Bu Hedefe Bağlı Son Görevler</span>
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
                    ${t.completed ? "✅" : "⬜"} ${escapeHtml(t.title)}
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

  function handleTimerComplete() {
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

      const linkedTaskId = document.getElementById("selectTimerLinkedTask")?.value;
      if (linkedTaskId) {
        const task = state.tasks.find((t) => t.id === linkedTaskId);
        if (task) {
          task.focusedMinutes = (task.focusedMinutes || 0) + completedMinutes;
        }
      }
      saveData();
      showToast(`🎉 Harika! ${completedMinutes} dakikalık odak oturumu tamamlandı. Kısa mola zamanı!`);
      switchTimerMode("short_break");
    } else {
      showToast("☕ Mola süresi bitti! Yeni ders/odak oturumuna hazırsın.");
      switchTimerMode("study");
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
          ? "📚 DERS & ODAK OTURUMU"
          : t.mode === "short_break"
          ? "☕ KISA MOLA ZAMANI"
          : "🛋️ UZUN MOLA & DİNLENME";
    }

    const pct =
      t.totalSeconds > 0
        ? Math.min(100, Math.max(0, Math.round(((t.totalSeconds - t.remainingSeconds) / t.totalSeconds) * 100)))
        : 0;
    const fillEl = document.getElementById("timerProgressBarFill");
    if (fillEl) fillEl.style.width = `${pct}%`;

    const startPauseBtn = document.getElementById("btnTimerStartPause");
    if (startPauseBtn) {
      startPauseBtn.textContent = t.running ? "⏸️ Duraklat" : "▶️ Başlat";
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
          t.mode === "study" ? "📚 Ders" : "☕ Mola";
        document.getElementById("floatingTimerDigits").textContent = formatted;
        document.getElementById("btnFloatingStartPause").textContent = t.running ? "⏸️" : "▶️";
      }
    }
  }

  function renderTimerView() {
    const today = getTodayISO();
    const todayStats = (state.focusStats && state.focusStats[today]) || { sessions: 0, minutes: 0 };

    const sessEl = document.getElementById("statTimerSessionsToday");
    const minsEl = document.getElementById("statTimerMinutesToday");
    if (sessEl) sessEl.textContent = `${todayStats.sessions} Oturum`;
    if (minsEl) minsEl.textContent = `${todayStats.minutes} dk`;

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

    updateTimerDOM();
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
          "Aktif tekrarlayan görevlerin. Her kartın altında <strong>📊 Önceki Serilerim</strong> kaydını görebilir, rutini arşivleyebilir veya çöp kutusuna taşıyabilirsin.";
      } else if (uiState.routineTab === "archived") {
        descEl.innerHTML =
          "📦 <strong>Arşivlenen Rutinler:</strong> Şu an günlük akışta görünmeyen ancak tüm geçmiş seri (streak) kayıtları korunan rutinlerin.";
      } else {
        descEl.innerHTML =
          "🗑️ <strong>Çöp Kutusu:</strong> Silinen rutinler doğrudan yok olmaz, buraya gelir. İstediğin zaman <strong>♻️ Geri Yükle</strong> diyebilir veya kalıcı olarak silebilirsin.";
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
          <button class="action-btn" data-action="edit-routine" data-id="${routine.id}" title="Düzenle">✏️</button>
          <button class="action-btn" data-action="archive-routine" data-id="${routine.id}" title="Arşive Kaldır (Serileri Korunur)">📦 Arşivle</button>
          <button class="action-btn" data-action="trash-routine" data-id="${routine.id}" title="Çöp Kutusuna Taşı">🗑️</button>
        `;
      } else if (rStatus === "archived") {
        actionButtonsHtml = `
          <button class="action-btn" data-action="restore-routine" data-id="${routine.id}" title="Tekrar Aktif Et">♻️ Aktif Et</button>
          <button class="action-btn" data-action="trash-routine" data-id="${routine.id}" title="Çöp Kutusuna Taşı">🗑️</button>
        `;
      } else if (rStatus === "trashed") {
        actionButtonsHtml = `
          <button class="action-btn" data-action="restore-routine" data-id="${routine.id}" title="Çöp Kutusundan Geri Yükle">♻️ Geri Yükle</button>
          <button class="action-btn" data-action="archive-routine" data-id="${routine.id}" title="Arşive Taşı">📦 Arşivle</button>
          <button class="action-btn" data-action="purge-routine" data-id="${routine.id}" title="Kalıcı Olarak Sil" style="color:var(--danger);">🔥 Kalıcı Sil</button>
        `;
      }

      const card = document.createElement("div");
      card.className = "routine-card";

      card.innerHTML = `
        <div class="routine-streak-row">
          <div>
            <span class="badge badge-streak">🔥 ${streak} Gün Seri</span>
            <span class="badge badge-category" style="margin-left:4px;">🏆 En Uzun: ${routine.bestStreak || streak} Gün</span>
            <span class="badge badge-category" style="margin-left:4px;">✅ Toplam: ${totalCompletions} Kez</span>
          </div>
          <div class="task-actions">
            ${actionButtonsHtml}
          </div>
        </div>

        <div>
          <h4 style="font-size:15.5px;font-weight:700;">${escapeHtml(routine.title)}</h4>
          <div class="task-badges" style="margin-top:6px;">
            <span class="badge badge-category">🔁 ${getRoutineFreqLabel(routine)}</span>
            ${goal ? `<span class="badge badge-goal" data-jump-goal="${goal.id}">🎯 ${escapeHtml(goal.title)}</span>` : ""}
          </div>
        </div>

        ${routine.note ? `<div class="task-note-preview">📌 ${escapeHtml(routine.note)}</div>` : ""}

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
            <span>📊 Önceki Serilerim & Seri Geçmişi</span>
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
                    ${sh.isActive ? "🔥 <strong>Aktif Seri:</strong>" : `⏳ ${streakHistory.length - idx}. Seri:`}
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
        <div class="summary-kpi-label">✅ Genel Görev Tamamlama</div>
        <div class="summary-kpi-val">${completedTasks}/${totalTasks}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">⏳ En Az 1 Kez Ertelenen</div>
        <div class="summary-kpi-val">${postponedTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">⚠️ Kronik Ertelenen (2+ Kez)</div>
        <div class="summary-kpi-val" style="color:var(--warning);">${chronicTasks.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">📝 Kayıtlı Not & Yansıma</div>
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
            type: "📓 Günlük Not",
            date: dISO,
            title: `${formatFullTR(dISO)} Günlük Notu`,
            text
          });
        }
      });
      Object.entries(state.weeklyNotes || {}).forEach(([wISO, text]) => {
        if (text && text.trim()) {
          archiveItems.push({
            type: "🧭 Haftalık Odak Notu",
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
            type: "⏳ Erteleme Kaydı",
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
          type: "📜 Kaydedilen Günün Sözü",
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
              <h4>🔁 ${escapeHtml(r.title)}</h4>
              <span class="badge ${isArchived ? "badge-category" : "badge-priority-high"}">
                ${isArchived ? "📦 Arşivlenmiş Rutin" : "🗑️ Çöp Kutusunda (Rutin)"}
              </span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">${getRoutineFreqLabel(r)}</span>
              <span class="badge badge-streak">🏆 En Uzun Seri: ${r.bestStreak || 0} gün</span>
            </div>
            ${r.note ? `<div class="task-note-preview">📌 ${escapeHtml(r.note)}</div>` : ""}
            <div class="streak-history-box" style="margin-top:8px;">
              <div class="streak-history-title">
                <span>📊 Önceki Serilerim (Ne Kadar Sürmüş?)</span>
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
                            <span>📅 ${formatShortTR(h.start)} — ${formatShortTR(h.end)}</span>
                            <strong style="color:var(--warning);">🔥 ${h.count} gün sürdü</strong>
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
              ♻️ Geri Yükle (Aktif Et)
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-routine" data-id="${r.id}">
              🔥 Kalıcı Sil
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
              <h4>✅ ${escapeHtml(t.title)}</h4>
              <span class="badge badge-priority-high">🗑️ Çöp Kutusunda (Görev)</span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">📂 ${escapeHtml(t.category || "Genel")}</span>
              ${t.date ? `<span class="badge badge-category">📅 Görev Tarihi: ${formatShortTR(t.date)}</span>` : ""}
              ${(t.postponeCount || 0) > 0 ? `<span class="badge badge-postponed">⏳ ${t.postponeCount}x ertelendi</span>` : ""}
            </div>
            ${t.note ? `<div class="task-note-preview">📝 ${escapeHtml(t.note)}</div>` : ""}
          </div>
          <div class="task-actions" style="opacity:1;">
            <button class="btn btn-primary btn-xs" data-action="restore-trashed-task" data-id="${t.id}">
              ♻️ Geri Yükle
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-trashed-task" data-id="${t.id}">
              🔥 Kalıcı Sil
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
              <h4>🎯 ${escapeHtml(g.title)}</h4>
              <span class="badge badge-priority-high">🗑️ Çöp Kutusunda (Hedef)</span>
            </div>
            <div class="routine-meta">
              <span class="badge badge-category">${g.horizon === "long" ? "🏔️ Uzun Vadeli" : "⚡ Kısa Vadeli"}</span>
              <span class="badge badge-category">📂 ${escapeHtml(g.category || "Genel")}</span>
              ${g.targetDate ? `<span class="badge badge-category">🏁 Vade: ${formatShortTR(g.targetDate)}</span>` : ""}
            </div>
            ${g.why ? `<div class="task-note-preview">💡 ${escapeHtml(g.why)}</div>` : ""}
          </div>
          <div class="task-actions" style="opacity:1;">
            <button class="btn btn-primary btn-xs" data-action="restore-trashed-goal" data-id="${g.id}">
              ♻️ Geri Yükle
            </button>
            <button class="btn btn-secondary btn-xs" style="color:var(--danger);" data-action="purge-trashed-goal" data-id="${g.id}">
              🔥 Kalıcı Sil
            </button>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    if (renderedCount === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          🗑️ Çöp kutusu ve arşiv şu an boş. Silinen görevler, hedefler ve rutinler burada güvende tutulur.
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
        dailyEntries.push({
          id: `daily_${dISO}`,
          category: "daily",
          badge: "📓 Günün Notu",
          dateISO: dISO,
          dateTitle: formatFullTR(dISO),
          relativeLabel: getRelativeDayLabel(dISO),
          subtitle: "Günlük Yansıma & Serbest Not",
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
          badge: "🧭 Haftalık Odak Notu",
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
          badge: "📝 Görev Altı Notu",
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
          badge: "🎯 Hedef & Vizyon Notu",
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
        badge: "📜 Kaydedilen Günün Sözü",
        dateISO: dISO,
        dateTitle: `${formatFullTR(dISO)} tarihinde kaydedildi`,
        relativeLabel: getRelativeDayLabel(dISO),
        subtitle: `${sq.author} — ${sq.source || "Gerçek Alıntı"}`,
        text: `❝ "${sq.text}"`
      });
    });

    const allCompiled = [
      ...dailyEntries,
      ...weeklyEntries,
      ...taskGoalEntries,
      ...quoteEntries
    ];

    // Üst İstatistik Şeridi
    summaryEl.innerHTML = `
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">📓 Günlük Not Yazılan Gün</div>
        <div class="summary-kpi-val">${dailyEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">🧭 Haftalık Odak Notları</div>
        <div class="summary-kpi-val">${weeklyEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">📝 Görev & Hedef Notları</div>
        <div class="summary-kpi-val">${taskGoalEntries.length}</div>
      </div>
      <div class="summary-kpi-card">
        <div class="summary-kpi-label">📜 Kaydedilen Günün Sözleri</div>
        <div class="summary-kpi-val">${quoteEntries.length}</div>
      </div>
    `;

    // Sekme Sayaçlarını Güncelle
    const cAll = document.getElementById("countNotesAll");
    const cDaily = document.getElementById("countNotesDaily");
    const cWeekly = document.getElementById("countNotesWeekly");
    const cTaskGoal = document.getElementById("countNotesTaskGoal");
    const cQuotes = document.getElementById("countNotesQuotes");
    if (cAll) cAll.textContent = allCompiled.length;
    if (cDaily) cDaily.textContent = dailyEntries.length;
    if (cWeekly) cWeekly.textContent = weeklyEntries.length;
    if (cTaskGoal) cTaskGoal.textContent = taskGoalEntries.length;
    if (cQuotes) cQuotes.textContent = quoteEntries.length;

    const activeFilter = uiState.compiledNoteFilter || "all";
    document.querySelectorAll("[data-compiled-note-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.compiledNoteFilter === activeFilter);
    });

    let filtered = allCompiled;
    if (activeFilter !== "all") {
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
          📓 Bu filtrede henüz kayıtlı bir not bulunmuyor. Yukarıdaki kutudan istediğin bir tarihi seçip hemen günlük notunu yazabilirsin.
        </div>
      `;
      return;
    }

    filtered.forEach((item) => {
      const card = document.createElement("div");
      card.className = `compiled-note-card type-${item.category}`;

      let actionsHtml = "";
      if (item.category === "daily") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-note-date" data-date="${item.dateISO}">
            📅 O Güne Git
          </button>
          <button class="btn btn-secondary btn-xs" data-action="edit-daily-note-in-page" data-date="${item.dateISO}">
            ✏️ Düzenle
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-daily-note" data-date="${item.dateISO}">
            🗑️ Sil
          </button>
        `;
      } else if (item.category === "weekly") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-week-note" data-date="${item.dateISO}">
            📅 O Haftaya Git
          </button>
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-weekly-note" data-date="${item.dateISO}">
            🗑️ Sil
          </button>
        `;
      } else if (item.category === "task_goal") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" data-action="jump-note-date" data-date="${item.dateISO}">
            📅 Tarihe Git
          </button>
          <button class="btn btn-secondary btn-xs" data-action="${item.itemType === "task" ? "edit-task" : "edit-goal"}" data-id="${item.rawId}">
            ✏️ Düzenle
          </button>
        `;
      } else if (item.category === "quotes") {
        actionsHtml = `
          <button class="btn btn-ghost btn-xs" style="color:var(--danger);" data-action="delete-saved-quote" data-id="${item.rawId}">
            🗑️ Koleksiyondan Kaldır
          </button>
        `;
      }

      card.innerHTML = `
        <div class="compiled-note-header">
          <div class="compiled-note-date-box">
            <span class="badge badge-category">${item.badge}</span>
            <span class="compiled-note-date-main">📅 ${escapeHtml(item.dateTitle)}</span>
            <span class="badge badge-streak">${escapeHtml(item.relativeLabel)}</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${actionsHtml}
          </div>
        </div>
        <div class="compiled-note-title">${escapeHtml(item.subtitle)}</div>
        <div class="compiled-note-body">${escapeHtml(item.text)}</div>
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
      subtitle: "Ders, kısa mola ve uzun mola sürelerini Spotify müzikleri ve ses efektleri eşliğinde yönet."
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
      titleEl.textContent = "✏️ Hedefi Düzenle";
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
      titleEl.textContent = "🎯 Yeni Hedef Tanımla";
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
      document.getElementById("modalRoutineTitle").textContent = "✏️ Tekrarlayan Görevi Düzenle";
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
      document.getElementById("modalRoutineTitle").textContent = "🔁 Tekrarlayan Görev (Rutin) Ekle";
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
  // =========================================================
  let roomState = {
    peer: null,
    conn: null,
    isHost: false,
    roomCode: null,
    connectedPeerName: null,
    myUserName: "Ben"
  };

  function initRoomState() {
    const savedName = localStorage.getItem("pusulapp_user_name");
    if (savedName) {
      roomState.myUserName = savedName;
      const inp = document.getElementById("inputRoomUserName");
      if (inp) inp.value = savedName;
    }
  }

  function broadcastTimerAction(action, data = {}) {
    if (roomState.conn && roomState.conn.open) {
      try {
        roomState.conn.send({
          type: "TIMER_SYNC",
          action,
          data,
          sender: roomState.myUserName,
          timestamp: Date.now()
        });
      } catch (err) {
        console.warn("PeerJS send error:", err);
      }
    }
  }

  function handleIncomingTimerAction(msg) {
    if (!msg || msg.type !== "TIMER_SYNC") return;

    if (msg.action === "START") {
      uiState.timer.running = true;
      uiState.timer.mode = msg.data.mode || uiState.timer.mode;
      uiState.timer.totalSeconds = msg.data.totalSeconds || uiState.timer.totalSeconds;
      uiState.timer.remainingSeconds = msg.data.remainingSeconds || uiState.timer.remainingSeconds;
      uiState.timer.targetTimestamp = Date.now() + uiState.timer.remainingSeconds * 1000;
      updateTimerDOM();
      showToast(`▶️ ${msg.sender || "Arkadaşın"} sayacı başlattı!`);
    } else if (msg.action === "PAUSE") {
      uiState.timer.running = false;
      uiState.timer.remainingSeconds = msg.data.remainingSeconds || uiState.timer.remainingSeconds;
      uiState.timer.targetTimestamp = null;
      updateTimerDOM();
      showToast(`⏸️ ${msg.sender || "Arkadaşın"} sayacı duraklattı.`);
    } else if (msg.action === "RESET") {
      uiState.timer.running = false;
      uiState.timer.targetTimestamp = null;
      uiState.timer.mode = msg.data.mode || uiState.timer.mode;
      uiState.timer.totalSeconds = msg.data.totalSeconds;
      uiState.timer.remainingSeconds = msg.data.remainingSeconds;
      updateTimerDOM();
      showToast(`🔄 ${msg.sender || "Arkadaşın"} sayacı sıfırladı.`);
    } else if (msg.action === "SWITCH_MODE") {
      switchTimerMode(msg.data.mode, msg.data.customMinutes, false);
      showToast(`🔀 ${msg.sender || "Arkadaşın"} oturumu değiştirdi: ${msg.data.mode === "study" ? "Ders" : "Mola"}`);
    }
  }

  function setupPeerConnection(conn) {
    roomState.conn = conn;

    conn.on("open", () => {
      // Bağlantı başarılı!
      conn.send({
        type: "HANDSHAKE",
        name: roomState.myUserName
      });
      updateRoomUI(true);
      showToast(`🎉 Ortak Çalışma Odasına bağlandınız!`);
      closeModal("modalRoomConnect");
    });

    conn.on("data", (data) => {
      if (data.type === "HANDSHAKE") {
        roomState.connectedPeerName = data.name || "Arkadaşın";
        updateRoomUI(true);
        showToast(`👋 ${roomState.connectedPeerName} odaya katıldı!`);
      } else if (data.type === "TIMER_SYNC") {
        handleIncomingTimerAction(data);
      }
    });

    conn.on("close", () => {
      showToast("ℹ️ Arkadaşınız odadan ayrıldı.");
      updateRoomUI(false);
      roomState.conn = null;
      roomState.connectedPeerName = null;
    });

    conn.on("error", (err) => {
      console.warn("Peer connection error:", err);
      showToast("⚠️ Bağlantı kesildi.");
      updateRoomUI(false);
    });
  }

  function createPomodoroRoom() {
    if (typeof Peer === "undefined") {
      showToast("⚠️ Bağlantı kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      return;
    }

    const nameInput = document.getElementById("inputRoomUserName");
    const name = (nameInput && nameInput.value.trim()) || "Ben";
    roomState.myUserName = name;
    localStorage.setItem("pusulapp_user_name", name);

    // Rastgele 6 haneli oda kodu üret
    const randomCode = "PUSULA-" + Math.floor(100 + Math.random() * 900);
    const peerId = "pusulapp-room-" + randomCode.toLowerCase();

    if (roomState.peer) {
      roomState.peer.destroy();
    }

    const statusEl = document.getElementById("roomPeerStatus");
    if (statusEl) statusEl.textContent = "⏳ Oda kuruluyor, lütfen bekleyin...";

    const activeBox = document.getElementById("roomActiveInfoBox");
    if (activeBox) activeBox.classList.remove("hidden");

    const codeBadge = document.getElementById("displayRoomCode");
    if (codeBadge) codeBadge.textContent = randomCode;

    try {
      const peer = new Peer(peerId);
      roomState.peer = peer;
      roomState.isHost = true;
      roomState.roomCode = randomCode;

      peer.on("open", () => {
        if (statusEl) {
          statusEl.innerHTML = `✅ <strong>Oda hazır!</strong> Yukarıdaki kodu arkadaşına gönder. Arkadaşın bağlandığında sayaçlarınız kilitlenecek.`;
        }
      });

      peer.on("connection", (conn) => {
        setupPeerConnection(conn);
      });

      peer.on("error", (err) => {
        console.warn("PeerJS host error:", err);
        if (err.type === "unavailable-id") {
          // Kod çakışması, tekrar dene
          createPomodoroRoom();
        } else {
          showToast("⚠️ Oda kurulamadı. Lütfen tekrar deneyin.");
        }
      });
    } catch (e) {
      console.warn("Peer error:", e);
      showToast("⚠️ Oda oluşturulurken hata meydana geldi.");
    }
  }

  function joinPomodoroRoom(inputCode) {
    if (typeof Peer === "undefined") {
      showToast("⚠️ Bağlantı kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin.");
      return;
    }

    const nameInput = document.getElementById("inputRoomUserName");
    const name = (nameInput && nameInput.value.trim()) || "Ben";
    roomState.myUserName = name;
    localStorage.setItem("pusulapp_user_name", name);

    const code = inputCode.trim().toUpperCase();
    if (!code) {
      showToast("⚠️ Lütfen arkadaşınızın verdiği oda kodunu girin.");
      return;
    }

    const targetPeerId = "pusulapp-room-" + code.toLowerCase();

    if (roomState.peer) {
      roomState.peer.destroy();
    }

    try {
      const peer = new Peer();
      roomState.peer = peer;
      roomState.isHost = false;
      roomState.roomCode = code;

      peer.on("open", () => {
        const conn = peer.connect(targetPeerId, { reliable: true });
        setupPeerConnection(conn);
      });

      peer.on("error", (err) => {
        console.warn("PeerJS join error:", err);
        showToast("⚠️ Odaya bağlanılamadı. Kodun doğruluğunu kontrol edin.");
      });
    } catch (e) {
      console.warn("Peer join error:", e);
      showToast("⚠️ Odaya bağlanırken hata oluştu.");
    }
  }

  function leavePomodoroRoom() {
    if (roomState.conn) {
      roomState.conn.close();
      roomState.conn = null;
    }
    if (roomState.peer) {
      roomState.peer.destroy();
      roomState.peer = null;
    }
    roomState.roomCode = null;
    roomState.connectedPeerName = null;
    updateRoomUI(false);
    showToast("🚪 Odadan ayrıldınız. Bireysel moda dönüldü.");
  }

  function updateRoomUI(isConnected) {
    const dot = document.getElementById("roomStatusDot");
    const text = document.getElementById("roomStatusText");
    const leaveBtn = document.getElementById("btnLeaveRoom");
    const openBtn = document.getElementById("btnOpenRoomModal");

    if (isConnected) {
      if (dot) {
        dot.className = "room-status-dot online";
      }
      if (text) {
        const other = roomState.connectedPeerName || "Arkadaşın";
        text.innerHTML = `🟢 <strong>Ortak Odadasınız:</strong> ${escapeHtml(other)} ile eşzamanlı çalışıyorsunuz (${roomState.roomCode})`;
      }
      if (leaveBtn) leaveBtn.classList.remove("hidden");
      if (openBtn) openBtn.classList.add("hidden");
    } else {
      if (dot) {
        dot.className = "room-status-dot offline";
      }
      if (text) {
        text.textContent = "Tek Başına Çalışma Modu";
      }
      if (leaveBtn) leaveBtn.classList.add("hidden");
      if (openBtn) openBtn.classList.remove("hidden");
    }
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
          bestStreak: 0
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
        btnFocusPage.textContent = uiState.focusOnlyPage ? "🔙 Menüyü Göster" : "🔲 Sadece Bu Sayfa";
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

    // Spotify Hazır İstasyonlar ve Özel Link
    document.querySelectorAll("[data-spotify-uri]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-spotify-uri]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const uri = btn.dataset.spotifyUri;
        const iframe = document.getElementById("spotifyEmbedFrame");
        if (iframe && uri) {
          iframe.src = `https://open.spotify.com/embed/${uri}?utm_source=generator&theme=0`;
          showToast("🎵 Spotify istasyonu değiştirildi.");
        }
      });
    });

    const formCustomSpotify = document.getElementById("formCustomSpotify");
    if (formCustomSpotify) {
      formCustomSpotify.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = document.getElementById("inputCustomSpotifyUrl");
        const raw = (inp && inp.value.trim()) || "";
        if (!raw) return;

        // open.spotify.com/(intl-tr/)?(playlist|track|album|episode|show)/ID yakala
        const match = raw.match(/spotify\.com\/(?:intl-[a-z]+\/)?(playlist|track|album|episode|show)\/([a-zA-Z0-9]+)/);
        const iframe = document.getElementById("spotifyEmbedFrame");
        if (match && iframe) {
          const type = match[1];
          const spId = match[2];
          iframe.src = `https://open.spotify.com/embed/${type}/${spId}?utm_source=generator&theme=0`;
          inp.value = "";
          showToast("🎵 Özel Spotify bağlantısı yüklendi!");
        } else {
          showToast("⚠️ Geçerli bir Spotify (playlist, track veya album) linki girin.");
        }
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
        const text = (area && area.value.trim()) || "";
        state.dailyNotes = state.dailyNotes || {};
        state.dailyNotes[dateVal] = text;
        uiState.notesPageDateISO = dateVal;
        saveData();
        renderAll();
        showToast(`📓 ${formatFullTR(dateVal)} gününün notu kaydedildi!`);
      });
    }

    document.querySelectorAll("[data-compiled-note-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        uiState.compiledNoteFilter = btn.dataset.compiledNoteFilter;
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
  });
})();
