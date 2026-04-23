(() => {

  // ===== 共通設定 =====
  window.APP_CONFIG = {
    LIFF_ID: "2008912129-TQRCpL9d",
    FORM_RESPONSE:
      "https://docs.google.com/forms/d/e/1FAIpQLSfZeKs2ZPJ0iIOxg6L7UZUr7fUmZy-E5OwA7aq93Uu7VaysBA/formResponse",
    ENTRY_MEMBER: "entry.71375240",
    ENTRY_CLASS: "entry.403922703",
    SPREADSHEET_ID: "1z7xSOOjsXyuQn5p9aE3tl5fgzIMkxoLKVnnpTYUTS9k",
    DUPLICATE_GID: "969068048",
    COUNT_GID: "218311726",
    DUPLICATE_CACHE_MS: 10000,
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

  // ===== 東京の年月 =====
  function getTokyoYearMonth(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal"){
        map[p.type] = p.value;
      }
    });

    return `${map.year}-${map.month}`;
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

  // ===== 全角英数記号を半角へ =====
  function toHalfWidthAscii(str){
    return String(str || "").replace(/[！-～]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );
  }

  // ===== URLっぽい崩れを補正 =====
  function normalizeRawInputForUrl(value){
    let s = String(value || "");

    s = toHalfWidthAscii(s);

    const map = {
      "。": ".",
      "、": ",",
      "・": "/",
      "：": ":",
      "；": ";",
      "？": "?",
      "！": "!",
      "＆": "&",
      "＝": "=",
      "＿": "_",
      "－": "-",
      "―": "-",
      "ー": "-",
      "／": "/",
      "＼": "\\",
      "（": "(",
      "）": ")",
      "［": "[",
      "］": "]",
      "｛": "{",
      "｝": "}",
      "　": " ",
      "”": "\"",
      "’": "'",
      "＋": "+",
      "％": "%",
      "＃": "#",
      "ぃ": "l",
      "ね": "n",
      "め": "m"
    };

    s = s.replace(/[。、・：；？！＆＝＿－―ー／＼（）［］｛｝　”’＋％＃ぃねめ]/g, ch => map[ch] || ch);

    return s.trim();
  }

  function cleanupScanNoise(value){
    let s = normalizeRawInputForUrl(value);
    s = s.replace(/\s+/g, "");
    s = s.replace(/[<>]/g, "");
    return s;
  }

  // ===== 会員番号整形 =====
  window.normalizeMember = function(value){
    let s = cleanupScanNoise(value);

    if(!s) return "";

    try{
      if(/^https?:/i.test(s)){
        const u = new URL(s);
        s = u.searchParams.get("member") || s;
      }
    }catch(e){}

    try{
      s = decodeURIComponent(s);
    }catch(e){}

    const candidates = [String(s || ""), cleanupScanNoise(s)];

    for(const source of candidates){
      const m1 = source.match(/[?&]member=([A-Za-z0-9\-_]+)/i);
      if(m1 && m1[1]){
        return String(m1[1]).trim().toUpperCase();
      }

      const m2 = source.match(/member=([A-Za-z0-9\-_]+)/i);
      if(m2 && m2[1]){
        return String(m2[1]).trim().toUpperCase();
      }
    }

    try{
      s = decodeURIComponent(s);
    }catch(e){}

    s = String(s || "").split("?")[0].trim();
    s = cleanupScanNoise(s);
    s = s.replace(/[^A-Za-z0-9\-_]/g, "");
    s = s.toUpperCase();

    if(s){
      return s;
    }

    const raw = cleanupScanNoise(value);
    const tailNum = raw.match(/(\d{7,8})(?!.*\d)/);
    if(tailNum && tailNum[1]){
      return tailNum[1];
    }

    return "";
  };

  // ===== 会員番号比較 =====
  function isSameMemberId(a, b){
    const aa = window.normalizeMember(a);
    const bb = window.normalizeMember(b);

    if(!aa || !bb) return false;

    // 先頭0を正式な番号として扱うので、完全一致優先
    return aa === bb;
  }

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

  window.addLocalPendingClasses = addLocalPendingClasses;
  window.removeLocalPendingClasses = removeLocalPendingClasses;
  window.addLocalConfirmedClasses = addLocalConfirmedClasses;
  window.promotePendingToConfirmed = promotePendingToConfirmed;

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

  // ===== 受講数取得 =====
  window.fetchCount = async function(member){
    const cleanMember = window.normalizeMember(member);
    const ym = getTokyoYearMonth();

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

  // ===== 重複チェック =====
  function getDuplicateCacheKey(member, date){
    return `${date}__${member}`;
  }

  async function fetchTodayRemoteDuplicateClassSet(member){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const duplicateSet = new Set();

    if(!cleanMember) return duplicateSet;

    const tq = [
      "select B,C,D",
      "where D = '" + escapeForGvizString(today) + "'"
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
        const rawMember = r.c?.[0]?.v ?? r.c?.[0]?.f ?? "";
        const cls = normalizeClassName(r.c?.[1]?.v || r.c?.[1]?.f || "");
        const date = normalizeSheetDateCell(r.c?.[2]?.v ?? r.c?.[2]?.f ?? "");

        if(!cls) continue;
        if(date !== today) continue;
        if(!isSameMemberId(rawMember, cleanMember)) continue;

        duplicateSet.add(cls);
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

  window.checkDuplicate = async function(member, className, forceRefresh = false){
    const duplicates = await window.getTodayDuplicateClasses(member, [className], forceRefresh);
    return duplicates.includes(normalizeClassName(className));
  };

})();
