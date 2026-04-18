(() => {

  // ===== 共通設定 =====
  window.APP_CONFIG = {
    LIFF_ID: "2008912129-TQRCpL9d",
    FORM_RESPONSE:
      "https://docs.google.com/forms/d/e/1FAIpQLSfZeKs2ZPJ0iIOxg6L7UZUr7fUmZy-E5OwA7aq93Uu7VaysBA/formResponse",
    ENTRY_MEMBER: "entry.71375240",
    ENTRY_CLASS: "entry.403922703",

    // スプレッドシート
    SPREADSHEET_ID: "1z7xSOOjsXyuQn5p9aE3tl5fgzIMkxoLKVnnpTYUTS9k",

    // 受講ログ_（重複チェック元）
    // A:タイムスタンプ / B:番号 / C:クラス名 / D:日付(YYYY-MM-DD テキスト)
    DUPLICATE_GID: "969068048",

    // 照会用
    COUNT_GID: "218311726",

    // キャッシュ
    DUPLICATE_CACHE_MS: 10000,

    // ローカル仮押さえ保持
    LOCAL_PENDING_MINUTES: 10
  };

  // ===== 共通データ =====
  window.DAY_MAP = ["月","火","水","木","金","土","WS"];

  window.CLASSES_BY_DAY = {
    "月":["UCCHY初級","UCCHY中級","SHINYA","あすぴ","K×G中村キッズ","K×G中村オープン","K×G長久手"],
    "火":["SHO-TA","KIBE初級","KIBE中級","MIZUKI","K×G茶屋ヶ坂"],
    "水":["AIRI初級","AIRI中級","ruchica","K×G高針キッズ","K×G高針オープン"],
    "木":["SERINAキッズ","SERINA初中級","Shogo","RIN","心","K×G瀬戸"],
    "金":["manaキッズ","mana初級","KANAMI","RYUYA","SAMURAI"],
    "土":["幼児","nikoキッズ","SAORI","TAKUEI","愛梨","MAHIRO初級","MAHIRO中級"],
    "WS":["WS_4/11Cocona練習会","WS_4/18Konoka練習会","WS_4/25Rena練習会"]
  };

  // ===== 内部キャッシュ =====
  // member + today ごとに重複クラス一覧を持つ
  let duplicateCacheMap = {};

  // ===== 東京の今日文字列 =====
  window.getTokyoTodayString = function(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal"){
        map[p.type] = p.value;
      }
    });

    return `${map.year}-${map.month}-${map.day}`;
  };

  // ===== 東京の今年 =====
  function getTokyoYear(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal"){
        map[p.type] = p.value;
      }
    });

    return map.year || String(new Date().getFullYear());
  }

  // ===== 今日の曜日 =====
  window.getTokyoWeekdayLabel = function(){
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short",
    }).format(new Date());

    const map = {
      Sun:"日", Mon:"月", Tue:"火", Wed:"水",
      Thu:"木", Fri:"金", Sat:"土"
    };

    return map[wd] || "月";
  };

  // ===== HTMLエスケープ =====
  window.escapeHtml = function(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  };

  // ===== 会員番号整形（英数字 + - _ 対応） =====
  window.normalizeMember = function(value){
    let s = String(value || "").trim();

    try{
      if(/^https?:/i.test(s)){
        const u = new URL(s);
        s = u.searchParams.get("member") || s;
      }
    }catch(e){}

    try{
      s = decodeURIComponent(s);
    }catch(e){}

    s = s.split("?")[0].trim();

    s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );

    s = s.replace(/[^A-Za-z0-9\-_]/g, "");
    s = s.toUpperCase();

    return s;
  };

  // ===== クラス名整形 =====
  function normalizeClassName(value){
    return String(value || "")
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ===== gviz用シングルクォートエスケープ =====
  function escapeForGvizString(value){
    return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  // ===== gvizレスポンスをJSON化 =====
  function parseGvizJson(text){
    return JSON.parse(
      text.replace("/*O_o*/","")
          .replace("google.visualization.Query.setResponse(","")
          .slice(0,-2)
    );
  }

  // ===== セル値の日付を YYYY-MM-DD 化 =====
  function normalizeSheetDateCell(cellValue){
    if(cellValue == null) return "";

    if(cellValue instanceof Date){
      return (
        cellValue.getFullYear() + "-" +
        String(cellValue.getMonth() + 1).padStart(2, "0") + "-" +
        String(cellValue.getDate()).padStart(2, "0")
      );
    }

    let s = String(cellValue).trim();
    if(!s) return "";

    s = s.replace(/\s+/g, " ");
    s = s.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "");
    s = s.replace(/\./g, "/");

    const m1 = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:\s.*)?$/);
    if(m1){
      return (
        m1[1] + "-" +
        String(m1[2]).padStart(2, "0") + "-" +
        String(m1[3]).padStart(2, "0")
      );
    }

    const m2 = s.match(/^(\d{1,2})[-\/](\d{1,2})(?:\s.*)?$/);
    if(m2){
      const todayYear = getTokyoYear();
      return (
        todayYear + "-" +
        String(m2[1]).padStart(2, "0") + "-" +
        String(m2[2]).padStart(2, "0")
      );
    }

    const m3 = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
    if(m3){
      return (
        m3[1] + "-" +
        String(Number(m3[2]) + 1).padStart(2, "0") + "-" +
        String(m3[3]).padStart(2, "0")
      );
    }

    return s;
  }

  // =========================================================
  // ローカル保存
  // pending: 送信中・未確定
  // confirmed: 送信成功済み（当日中）
  // =========================================================

  function getLocalPendingStorageKey(){
    return "danceStudioPendingReceipts";
  }

  function getLocalConfirmedStorageKey(){
    return "danceStudioConfirmedReceipts";
  }

  function readJsonStorage(key){
    try{
      const raw = localStorage.getItem(key);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === "object" ? obj : {};
    }catch(e){
      return {};
    }
  }

  function writeJsonStorage(key, map){
    try{
      localStorage.setItem(key, JSON.stringify(map));
    }catch(e){}
  }

  function getLocalReceiptKey(member, date){
    return `${date}__${member}`;
  }

  function cleanupLocalPending(){
    const map = readJsonStorage(getLocalPendingStorageKey());
    const now = Date.now();
    let changed = false;

    Object.keys(map).forEach(key => {
      const arr = Array.isArray(map[key]) ? map[key] : [];
      const filtered = arr.filter(item => {
        return item && item.className && item.expiresAt && item.expiresAt > now;
      });

      if(filtered.length > 0){
        if(filtered.length !== arr.length){
          map[key] = filtered;
          changed = true;
        }
      }else{
        delete map[key];
        changed = true;
      }
    });

    if(changed){
      writeJsonStorage(getLocalPendingStorageKey(), map);
    }

    return map;
  }

  function cleanupLocalConfirmed(){
    const map = readJsonStorage(getLocalConfirmedStorageKey());
    const today = window.getTokyoTodayString();
    let changed = false;

    Object.keys(map).forEach(key => {
      if(!key.startsWith(today + "__")){
        delete map[key];
        changed = true;
      }
    });

    if(changed){
      writeJsonStorage(getLocalConfirmedStorageKey(), map);
    }

    return map;
  }

  function getLocalPendingClassSet(member){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const map = cleanupLocalPending();
    const key = getLocalReceiptKey(cleanMember, today);
    const arr = Array.isArray(map[key]) ? map[key] : [];
    return new Set(arr.map(item => normalizeClassName(item.className)));
  }

  function getLocalConfirmedClassSet(member){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const map = cleanupLocalConfirmed();
    const key = getLocalReceiptKey(cleanMember, today);
    const arr = Array.isArray(map[key]) ? map[key] : [];
    return new Set(arr.map(item => normalizeClassName(item.className)));
  }

  function addLocalPendingClasses(member, classNames){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const map = cleanupLocalPending();
    const key = getLocalReceiptKey(cleanMember, today);
    const now = Date.now();
    const expiresAt = now + Number(window.APP_CONFIG.LOCAL_PENDING_MINUTES || 10) * 60 * 1000;

    const current = Array.isArray(map[key]) ? map[key] : [];
    const byClass = new Map();

    current.forEach(item => {
      if(item && item.className && item.expiresAt && item.expiresAt > now){
        byClass.set(normalizeClassName(item.className), {
          className: normalizeClassName(item.className),
          expiresAt: item.expiresAt
        });
      }
    });

    (classNames || []).forEach(cls => {
      const normalized = normalizeClassName(cls);
      if(!normalized) return;
      byClass.set(normalized, {
        className: normalized,
        expiresAt
      });
    });

    map[key] = Array.from(byClass.values());
    writeJsonStorage(getLocalPendingStorageKey(), map);
  }

  function removeLocalPendingClasses(member, classNames){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const map = cleanupLocalPending();
    const key = getLocalReceiptKey(cleanMember, today);
    const arr = Array.isArray(map[key]) ? map[key] : [];
    const removeSet = new Set((classNames || []).map(c => normalizeClassName(c)));

    const filtered = arr.filter(item => {
      return !removeSet.has(normalizeClassName(item.className));
    });

    if(filtered.length > 0){
      map[key] = filtered;
    }else{
      delete map[key];
    }

    writeJsonStorage(getLocalPendingStorageKey(), map);
  }

  function addLocalConfirmedClasses(member, classNames){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const map = cleanupLocalConfirmed();
    const key = getLocalReceiptKey(cleanMember, today);
    const current = Array.isArray(map[key]) ? map[key] : [];
    const byClass = new Map();

    current.forEach(cls => {
      const normalized = normalizeClassName(cls);
      if(normalized){
        byClass.set(normalized, normalized);
      }
    });

    (classNames || []).forEach(cls => {
      const normalized = normalizeClassName(cls);
      if(normalized){
        byClass.set(normalized, normalized);
      }
    });

    map[key] = Array.from(byClass.values());
    writeJsonStorage(getLocalConfirmedStorageKey(), map);
  }

  function promotePendingToConfirmed(member, classNames){
    addLocalConfirmedClasses(member, classNames);
    removeLocalPendingClasses(member, classNames);
  }

  // ===== 曜日ボタン =====
  window.renderDayButtons = function({ dayButtonsEl, selectedDay, onSelect }){
    dayButtonsEl.innerHTML = "";

    window.DAY_MAP.forEach((day) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = day === "WS" ? "WS" : `${day}曜`;
      btn.className = "day-btn" + (day === selectedDay ? " today" : "");
      btn.onclick = () => onSelect(day);
      dayButtonsEl.appendChild(btn);
    });
  };

  // ===== 確認UI =====
  window.showSelectionConfirm = function({ member, selectedClasses }){
    return new Promise((resolve) => {

      const old = document.getElementById("selectionConfirmOverlay");
      if(old) old.remove();

      const overlay = document.createElement("div");
      overlay.id = "selectionConfirmOverlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.65)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";

      const box = document.createElement("div");
      box.style.background = "#fff";
      box.style.padding = "36px 22px";
      box.style.borderRadius = "18px";
      box.style.textAlign = "center";
      box.style.width = "92%";
      box.style.maxWidth = "560px";
      box.style.boxSizing = "border-box";
      box.style.lineHeight = "1.6";

      let html =
        "<div style='font-size:44px;font-weight:800;margin-bottom:18px;'>受付確認</div>" +
        "会員番号：<b style='font-size:38px;'>" + window.escapeHtml(member) + "</b><br><br>" +
        "<div style='font-size:36px;font-weight:800;text-align:left;display:inline-block;line-height:1.6;'>" +
        selectedClasses.map(c => "▶ " + window.escapeHtml(c)).join("<br>") +
        "</div>";

      html +=
        "<div style='display:flex;gap:14px;margin-top:26px;'>" +
        "<button id='selectionConfirmCancel' style='flex:1;font-size:30px;padding:20px;border:none;border-radius:12px;background:#ddd;color:#000;font-weight:700;'>戻る</button>" +
        "<button id='selectionConfirmOk' style='flex:1;font-size:30px;padding:20px;border:none;border-radius:12px;background:#66adff;color:#fff;font-weight:700;'>受付する</button>" +
        "</div>";

      box.innerHTML = html;
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      document.getElementById("selectionConfirmCancel").onclick = () => {
        overlay.remove();
        resolve(false);
      };

      document.getElementById("selectionConfirmOk").onclick = () => {
        overlay.remove();
        resolve(true);
      };
    });
  };

  // =========================================================
  // 重複チェック
  // 受講ログ_ を直接参照
  // B:番号 / C:クラス名 / D:日付(YYYY-MM-DD)
  // =========================================================

  function getDuplicateCacheKey(member, date){
    return `${date}__${member}`;
  }

  async function fetchTodayRemoteDuplicateClassSet(member){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const duplicateSet = new Set();

    if(!cleanMember) return duplicateSet;

    const tq = [
      "select C",
      "where B = '" + escapeForGvizString(cleanMember) + "'",
      "and D = '" + escapeForGvizString(today) + "'"
    ].join(" ");

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      window.APP_CONFIG.SPREADSHEET_ID +
      "/gviz/tq?tqx=out:json&gid=" +
      window.APP_CONFIG.DUPLICATE_GID +
      "&tq=" + encodeURIComponent(tq);

    try{
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      const json = parseGvizJson(text);
      const rows = json.table?.rows || [];

      for(const r of rows){
        const cls = normalizeClassName(r.c?.[0]?.v || r.c?.[0]?.f || "");
        if(cls){
          duplicateSet.add(cls);
        }
      }

      return duplicateSet;
    }catch(e){
      console.log("fetchTodayRemoteDuplicateClassSet error", e);
      return duplicateSet;
    }
  }

  window.getTodayRemoteDuplicateClassSet = async function(member, forceRefresh = false){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const cacheKey = getDuplicateCacheKey(cleanMember, today);
    const now = Date.now();
    const cacheMs = Number(window.APP_CONFIG.DUPLICATE_CACHE_MS || 0);

    const cached = duplicateCacheMap[cacheKey];

    if(
      !forceRefresh &&
      cached &&
      cached.set instanceof Set &&
      cached.fetchedAt &&
      (now - cached.fetchedAt) < cacheMs
    ){
      return new Set(cached.set);
    }

    if(!forceRefresh && cached && cached.promise){
      return cached.promise.then(set => new Set(set));
    }

    duplicateCacheMap[cacheKey] = duplicateCacheMap[cacheKey] || {};

    duplicateCacheMap[cacheKey].promise = fetchTodayRemoteDuplicateClassSet(cleanMember)
      .then(set => {
        duplicateCacheMap[cacheKey] = {
          set: new Set(set),
          fetchedAt: Date.now(),
          promise: null
        };
        return new Set(set);
      })
      .catch(e => {
        console.log("getTodayRemoteDuplicateClassSet error", e);
        duplicateCacheMap[cacheKey] = {
          set: new Set(),
          fetchedAt: 0,
          promise: null
        };
        return new Set();
      });

    return duplicateCacheMap[cacheKey].promise.then(set => new Set(set));
  };

  window.getTodayDuplicateClassSet = async function(member, forceRefresh = false){
    const remoteSet = await window.getTodayRemoteDuplicateClassSet(member, forceRefresh);
    const localPendingSet = getLocalPendingClassSet(member);
    const localConfirmedSet = getLocalConfirmedClassSet(member);
    const merged = new Set();

    remoteSet.forEach(v => merged.add(v));
    localPendingSet.forEach(v => merged.add(v));
    localConfirmedSet.forEach(v => merged.add(v));

    return merged;
  };

  window.getTodayDuplicateClasses = async function(member, classNames, forceRefresh = false){
    const duplicateSet = await window.getTodayDuplicateClassSet(member, forceRefresh);

    return (classNames || [])
      .map(normalizeClassName)
      .filter(cls => duplicateSet.has(cls));
  };

  window.clearDuplicateCache = function(member){
    const today = window.getTokyoTodayString();

    if(member){
      const cleanMember = window.normalizeMember(member);
      delete duplicateCacheMap[getDuplicateCacheKey(cleanMember, today)];
      return;
    }

    duplicateCacheMap = {};
  };

  // ===== クラス描画（複数選択対応・重複クラス無効化版） =====
  window.renderClasses = function({ day, titleEl, containerEl, onSubmit }){

    titleEl.textContent =
      day === "WS"
        ? "本日のクラス（WS）"
        : `本日のクラス（${day}曜日）`;

    containerEl.innerHTML = "";

    const list = window.CLASSES_BY_DAY[day] || [];
    const selectedClasses = [];
    const classButtonMap = new Map();
    let duplicateClassSet = new Set();
    let isSubmitting = false;

    const infoBox = document.createElement("div");
    infoBox.style.fontSize = "22px";
    infoBox.style.margin = "0 0 12px";
    infoBox.style.lineHeight = "1.6";

    const selectedBox = document.createElement("div");
    selectedBox.style.fontSize = "24px";
    selectedBox.style.margin = "12px 0 20px";
    selectedBox.style.lineHeight = "1.6";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.textContent = "選択したクラスを確認";
    confirmBtn.className = "remain-btn";
    confirmBtn.style.display = "none";
    confirmBtn.style.fontSize = "34px";
    confirmBtn.style.padding = "34px 24px";
    confirmBtn.style.marginTop = "20px";
    confirmBtn.style.fontWeight = "800";
    confirmBtn.style.borderRadius = "16px";

    function refreshSelectedView(){
      if(selectedClasses.length === 0){
        selectedBox.innerHTML = "";
        confirmBtn.style.display = "none";
        return;
      }

      selectedBox.innerHTML =
        "<b>選択中：</b><br>" +
        selectedClasses.map(c => "・" + window.escapeHtml(c)).join("<br>");

      confirmBtn.style.display = "block";
    }

    function applyDuplicateStyles(btn, isDuplicate){
      if(isDuplicate){
        btn.disabled = true;
        btn.style.opacity = "1";
        btn.style.background = "#d9d9d9";
        btn.style.color = "#666";
        btn.style.fontWeight = "700";
        btn.style.border = "none";
        btn.textContent = btn.dataset.baseLabel + "（受付済み）";
        btn.style.cursor = "not-allowed";
      }else{
        btn.disabled = false;
        btn.style.cursor = "pointer";
        btn.textContent = btn.dataset.baseLabel;

        // 未選択見た目に戻す
        btn.style.background = "";
        btn.style.color = "";
        btn.style.fontWeight = "";
        btn.style.border = "";
      }
    }

    function setSubmittingState(flag){
      isSubmitting = flag;

      classButtonMap.forEach((btn) => {
        const baseLabel = btn.dataset.className || "";
        const isDuplicate = duplicateClassSet.has(normalizeClassName(baseLabel));

        if(flag){
          btn.disabled = true;
          btn.style.cursor = "wait";
        }else{
          applyDuplicateStyles(btn, isDuplicate);

          // duplicateでない選択中のものは青を戻す
          if(!isDuplicate && selectedClasses.includes(baseLabel)){
            btn.style.background = "#66ADFF";
            btn.style.color = "#FFF";
            btn.style.fontWeight = "bold";
          }
        }
      });

      if(flag){
        confirmBtn.disabled = true;
        confirmBtn.textContent = "受付中…";
      }else{
        confirmBtn.disabled = false;
        confirmBtn.textContent = "選択したクラスを確認";
      }
    }

    function toggleClass(btn, cls){
      if(btn.disabled || isSubmitting) return;

      const idx = selectedClasses.indexOf(cls);

      if(idx >= 0){
        selectedClasses.splice(idx, 1);
        btn.style.opacity = "1";
        btn.style.background = "";
        btn.style.color = "";
        btn.style.fontWeight = "";
      }else{
        selectedClasses.push(cls);
        btn.style.opacity = "1";
        btn.style.background = "#66ADFF";
        btn.style.color = "#FFF";
        btn.style.fontWeight = "bold";
      }

      refreshSelectedView();
    }

    function removeDuplicateSelections(){
      for(let i = selectedClasses.length - 1; i >= 0; i--){
        if(duplicateClassSet.has(normalizeClassName(selectedClasses[i]))){
          selectedClasses.splice(i, 1);
        }
      }
    }

    function clearSelectionsAndBlueState(){
      selectedClasses.splice(0, selectedClasses.length);

      classButtonMap.forEach((btn, cls) => {
        const isDuplicate = duplicateClassSet.has(normalizeClassName(cls));
        if(!isDuplicate){
          btn.style.opacity = "1";
          btn.style.background = "";
          btn.style.color = "";
          btn.style.fontWeight = "";
        }
      });

      refreshSelectedView();
    }

    async function paintDuplicateButtons(forceRefresh = false){
      const member = window.normalizeMember(window.currentMember);

      if(!member){
        infoBox.innerHTML = "";
        duplicateClassSet = new Set();
        return;
      }

      infoBox.innerHTML = "受付済みクラス確認中…";

      duplicateClassSet = await window.getTodayDuplicateClassSet(member, forceRefresh);

      classButtonMap.forEach((btn, cls) => {
        const isDuplicate = duplicateClassSet.has(normalizeClassName(cls));
        applyDuplicateStyles(btn, isDuplicate);

        if(!isDuplicate && selectedClasses.includes(cls)){
          btn.style.background = "#66ADFF";
          btn.style.color = "#FFF";
          btn.style.fontWeight = "bold";
        }
      });

      removeDuplicateSelections();
      refreshSelectedView();

      const dayDuplicateCount = list.filter(cls =>
        duplicateClassSet.has(normalizeClassName(cls))
      ).length;

      if(dayDuplicateCount > 0){
        infoBox.innerHTML =
          "<span style='color:#666;font-weight:700;'>グレー表示のクラスは本日受付済みです</span>";
      }else{
        infoBox.innerHTML = "";
      }
    }

    containerEl.appendChild(infoBox);

    list.forEach((cls) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.baseLabel = `受付 ▶ ${cls}`;
      btn.dataset.className = cls;
      btn.textContent = btn.dataset.baseLabel;
      btn.className = "class-btn";

      btn.onclick = () => {
        toggleClass(btn, cls);
      };

      classButtonMap.set(cls, btn);
      containerEl.appendChild(btn);
    });

    containerEl.appendChild(selectedBox);
    containerEl.appendChild(confirmBtn);

    confirmBtn.onclick = async () => {
      const member = window.normalizeMember(window.currentMember);

      if(isSubmitting) return;

      if(!member){
        alert("会員番号が取得できていません");
        return;
      }

      if(selectedClasses.length === 0){
        alert("クラスを選択してください");
        return;
      }

      const submitClasses = selectedClasses.slice();

      // 1回目の再チェック（確認前）
      confirmBtn.disabled = true;
      confirmBtn.textContent = "確認中…";

      window.clearDuplicateCache(member);
      let duplicateClasses = await window.getTodayDuplicateClasses(member, submitClasses, true);

      confirmBtn.disabled = false;
      confirmBtn.textContent = "選択したクラスを確認";

      if(duplicateClasses.length > 0){
        await paintDuplicateButtons(true);
        alert(
          "すでに受付済みのクラスが含まれています。\n\n" +
          duplicateClasses.map(c => "・" + c).join("\n")
        );
        return;
      }

      const ok = await window.showSelectionConfirm({
        member,
        selectedClasses: submitClasses
      });

      if(!ok) return;

      // 2回目の再チェック（確認OK直後）
      confirmBtn.disabled = true;
      confirmBtn.textContent = "最終確認中…";

      window.clearDuplicateCache(member);
      duplicateClasses = await window.getTodayDuplicateClasses(member, submitClasses, true);

      confirmBtn.disabled = false;
      confirmBtn.textContent = "選択したクラスを確認";

      if(duplicateClasses.length > 0){
        await paintDuplicateButtons(true);
        alert(
          "確認中に受付済みになったクラスがあります。\n\n" +
          duplicateClasses.map(c => "・" + c).join("\n")
        );
        return;
      }

      // ローカル仮押さえ
      addLocalPendingClasses(member, submitClasses);
      await paintDuplicateButtons(false);
      clearSelectionsAndBlueState();
      setSubmittingState(true);

      try{
        await Promise.resolve(onSubmit(submitClasses));

        // 成功したら確定扱いへ
        promotePendingToConfirmed(member, submitClasses);

        // 念のため最新反映を取り直し
        window.clearDuplicateCache(member);
        await paintDuplicateButtons(true);

      }catch(e){
        console.log("onSubmit error", e);

        // 失敗したら仮押さえ解除
        removeLocalPendingClasses(member, submitClasses);
        window.clearDuplicateCache(member);
        await paintDuplicateButtons(true);

        alert("受付送信時にエラーが発生しました。通信状況をご確認ください。");
      }finally{
        setSubmittingState(false);
      }
    };

    paintDuplicateButtons(false);
  };

  // ===== LIFF初期化 =====
  window.initLiffSafe = async function(){
    try{
      if(typeof liff !== "undefined"){
        await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
      }
    }catch(e){
      console.log("LIFF init error:", e);
    }
  };

  // ===== 照会中表示 =====
  window.showLoading = function(){
    const complete = document.getElementById("complete");
    const completeDetail = document.getElementById("completeDetail");

    if(!complete || !completeDetail) return;

    completeDetail.innerHTML =
      "<span class='complete-title'>受講数照会</span><br><br>" +
      "照会中…";

    complete.style.display = "flex";
  };

  // ===== 受講数表示 =====
  window.showCount = function(data){
    const complete = document.getElementById("complete");
    const completeDetail = document.getElementById("completeDetail");

    if(!complete || !completeDetail) return;

    completeDetail.innerHTML =
      "<span class='complete-title'>受講数照会</span><br><br>" +
      "会員番号：<b>" + window.escapeHtml(data.member) + "</b><br>" +
      "今月受講：<b>" + window.escapeHtml(data.count) + " 回</b><br>" +
      "最終受講：<b>" + window.escapeHtml(data.last) + "</b>";

    complete.style.display = "flex";

    setTimeout(() => {
      complete.style.display = "none";
    }, 5000);
  };

  // ===== 受講数取得（照会シート A:会員番号 B:年月 C:受講回数 D:最終受講 対応） =====
  window.fetchCount = async function(member){

    const cleanMember = window.normalizeMember(member);

    const now = new Date();
    const ym =
      now.getFullYear() + "-" +
      String(now.getMonth() + 1).padStart(2, "0");

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      window.APP_CONFIG.SPREADSHEET_ID +
      "/gviz/tq?tqx=out:json&gid=" +
      window.APP_CONFIG.COUNT_GID +
      "&tq=" +
      encodeURIComponent(
        "select C,D where A='" + escapeForGvizString(cleanMember) + "' and B='" + escapeForGvizString(ym) + "'"
      );

    try{
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();

      const json = JSON.parse(
        text.substring(
          text.indexOf("{"),
          text.lastIndexOf("}") + 1
        )
      );

      const rows = json.table?.rows || [];

      if(rows.length > 0){
        const count = Number(rows[0].c?.[0]?.v || 0);

        let last = "";
        if(rows[0].c?.[1]?.f){
          const f = rows[0].c[1].f;
          const parts = f.split(" ")[0].split("/");
          if(parts.length >= 3){
            last = Number(parts[1]) + "/" + Number(parts[2]);
          }else{
            last = f;
          }
        }else if(rows[0].c?.[1]?.v){
          const raw = rows[0].c[1].v;

          if(raw instanceof Date){
            last =
              Number(raw.getMonth() + 1) + "/" +
              Number(raw.getDate());
          }else{
            const s = String(raw).trim();
            const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
            if(m){
              last = Number(m[2]) + "/" + Number(m[3]);
            }else{
              last = s;
            }
          }
        }

        return {
          member: cleanMember,
          count: count,
          last: last
        };
      }

    }catch(e){
      console.log("fetchCount error:", e);
    }

    return {
      member: cleanMember,
      count: 0,
      last: ""
    };
  };

  // ===== 単体重複チェック =====
  window.checkDuplicate = async function(member, className){
    const duplicates = await window.getTodayDuplicateClasses(member, [className], true);
    return duplicates.includes(normalizeClassName(className));
  };

})();
