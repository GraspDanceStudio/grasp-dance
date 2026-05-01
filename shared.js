(() => {

  window.APP_CONFIG = {
    LIFF_ID: "2008912129-TQRCpL9d",
    FORM_RESPONSE:
      "https://docs.google.com/forms/d/e/1FAIpQLSfZeKs2ZPJ0iIOxg6L7UZUr7fUmZy-E5OwA7aq93Uu7VaysBA/formResponse",
    ENTRY_MEMBER: "entry.71375240",
    ENTRY_CLASS: "entry.403922703",
    SPREADSHEET_ID: "1z7xSOOjsXyuQn5p9aE3tl5fgzIMkxoLKVnnpTYUTS9k",
    DUPLICATE_GID: "969068048",
    COUNT_GID: "218311726",
    DUPLICATE_CACHE_MS: 10000
  };

  window.DAY_MAP = ["月","火","水","木","金","土","WS"];

  window.CLASSES_BY_DAY = {
    "月":["UCCHY初級","UCCHY中級","SHINYA","あすぴ","K×G中村キッズ","K×G中村オープン","K×G長久手"],
    "火":["SHO-TA","KIBE中級","MIZUKI","K×G池下4~6年","K×G池下中高生以上"],
    "水":["AIRI初級","ruchica","AIRI中級","RYOTAMEN","K×G高針キッズ","K×G高針オープン"],
    "木":["SERINAキッズ","SERINA初中級","Shogo","RIN","心","K×G瀬戸愛梨","K×G瀬戸Natsune"],
    "金":["manaキッズ","mana初級","KANAMI","SAMURAI4～6年","SAMURAI中高生以上"],
    "土":["幼児","nikoキッズ","SAORI","TAKUEI","愛梨","MAHIRO初級","MAHIRO中級","NC_スターター","RYUYA"],
    "WS":["WS_5/2Akane練習会","WS_5/9niko練習会"]
  };

  let duplicateCacheMap = {};

  window.getTokyoTodayString = function(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal") map[p.type] = p.value;
    });

    return `${map.year}-${map.month}-${map.day}`;
  };

  function getTokyoYear(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal") map[p.type] = p.value;
    });

    return map.year || String(new Date().getFullYear());
  }

  function getTokyoYearMonth(){
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());

    const map = {};
    parts.forEach(p => {
      if(p.type !== "literal") map[p.type] = p.value;
    });

    return `${map.year}-${map.month}`;
  }

  window.getTokyoWeekdayLabel = function(){
    const wd = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      weekday: "short"
    }).format(new Date());

    const map = {
      Sun:"日", Mon:"月", Tue:"火", Wed:"水",
      Thu:"木", Fri:"金", Sat:"土"
    };

    return map[wd] || "月";
  };

  window.escapeHtml = function(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  };

  function toHalfWidthAscii(str){
    return String(str || "").replace(/[！-～]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );
  }

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
      "‐": "-",
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
      "｜": "|",
      "〜": "~",
      "ぃ": "l",
      "ね": "n",
      "め": "m",
      "お": "0"
    };

    s = s.replace(/[。、・：；？！＆＝＿－―ー‐／＼（）［］｛｝　”’＋％＃｜〜ぃねめお]/g, ch => map[ch] || ch);
    s = s.replace(/[\r\n\t]/g, "");
    s = s.replace(/\u00A0/g, " ");

    return s.trim();
  }

  function cleanupScanNoise(value){
    let s = normalizeRawInputForUrl(value);

    s = s.replace(/\s+/g, "");
    s = s.replace(/[<>]/g, "");
    s = s.replace(/^HTTPS?/i, match => match.toLowerCase());
    s = s.replace(/^HTTPSLIFFLINEME/i, "httpslifflineme");
    s = s.replace(/LIFFLINEME/ig, "lifflineme");

    return s;
  }

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
      if(m1 && m1[1]) return String(m1[1]).trim().toUpperCase();

      const m2 = source.match(/member=([A-Za-z0-9\-_]+)/i);
      if(m2 && m2[1]) return String(m2[1]).trim().toUpperCase();

      const m3 = source.match(/member[^A-Za-z0-9]{0,5}([A-Za-z0-9\-_]{3,})/i);
      if(m3 && m3[1]) return String(m3[1]).trim().toUpperCase();

      const m4 = source.match(/member([A-Za-z0-9\-_]{3,})/i);
      if(m4 && m4[1]) return String(m4[1]).trim().toUpperCase();

      const m5 = source.match(/(\d{7,8})(?!.*\d)/);
      if(m5 && m5[1]) return m5[1];
    }

    s = String(s || "").split("?")[0].trim();
    s = cleanupScanNoise(s);
    s = s.replace(/[^A-Za-z0-9\-_]/g, "");
    s = s.toUpperCase();

    return s;
  };

  /*
    【重要：先頭0落ち対策・消さない】
    normalizeMember() は、表示・フォーム送信用の会員番号をそのまま返す。
    例：01210018 は 01210018 のまま送信する。

    ただしGoogle Sheets / gvizは、シート側の型推定により
    01210018 を 1210018 として返すことがある。

    そのため、重複チェックなどの「比較」だけは
    getMemberCompareKey() で数字のみ会員番号の先頭0を落として比較する。

    これにより、
      01210018
      1210018
    を同一会員として扱う。

    今後 shared.js を修正するときも、
    isSameMemberId() と getMemberCompareKey() の仕様は変更しないこと。
  */
  function getMemberCompareKey(value){
    const s = window.normalizeMember(value);

    if(!s) return "";

    if(/^\d+$/.test(s)){
      return s.replace(/^0+/, "") || "0";
    }

    return s;
  }

  function isSameMemberId(a, b){
    const aa = getMemberCompareKey(a);
    const bb = getMemberCompareKey(b);

    if(!aa || !bb) return false;

    return aa === bb;
  }

  function normalizeClassName(value){
    return String(value || "")
      .replace(/\u3000/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function displayClassName(day, className){
    const s = String(className || "");
    return day === "WS" ? s.replace(/^WS_/, "") : s;
  }

  function escapeForGvizString(value){
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
  }

  function parseGvizJson(text){
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if(start < 0 || end < 0) throw new Error("Invalid gviz response");
    return JSON.parse(text.substring(start, end + 1));
  }

  function normalizeSheetDateCell(cellValue){
    if(cellValue == null) return "";

    let s = String(cellValue).trim();
    if(!s) return "";

    s = s.replace(/\s+/g, " ");
    s = s.replace(/年/g, "-").replace(/月/g, "-").replace(/日/g, "");
    s = s.replace(/\./g, "/");

    const m1 = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:\s.*)?$/);
    if(m1){
      return m1[1] + "-" + String(m1[2]).padStart(2, "0") + "-" + String(m1[3]).padStart(2, "0");
    }

    const m2 = s.match(/^(\d{1,2})[-\/](\d{1,2})(?:\s.*)?$/);
    if(m2){
      const todayYear = getTokyoYear();
      return todayYear + "-" + String(m2[1]).padStart(2, "0") + "-" + String(m2[2]).padStart(2, "0");
    }

    const m3 = s.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})/);
    if(m3){
      return m3[1] + "-" + String(Number(m3[2]) + 1).padStart(2, "0") + "-" + String(m3[3]).padStart(2, "0");
    }

    return s;
  }

  window.initLiffSafe = async function(){
    try{
      if(typeof liff !== "undefined"){
        await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
      }
    }catch(e){
      console.log("LIFF init error:", e);
    }
  };

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
        "select C,D where A='" +
        escapeForGvizString(cleanMember) +
        "' and B='" +
        escapeForGvizString(ym) +
        "'"
      );

    try{
      const res = await fetch(url,{cache:"no-store"});
      const text = await res.text();
      const json = parseGvizJson(text);
      const rows = json.table?.rows || [];

      if(rows.length > 0){
        const count = Number(rows[0].c?.[0]?.v || 0);
        let last = "";

        if(rows[0].c?.[1]?.f){
          const f = rows[0].c[1].f;
          const parts = f.split(" ")[0].split("/");
          if(parts.length >= 3) last = Number(parts[1]) + "/" + Number(parts[2]);
          else last = f;
        }else if(rows[0].c?.[1]?.v){
          last = String(rows[0].c[1].v || "");
        }

        return { member: cleanMember, count, last };
      }

    }catch(e){
      console.log("fetchCount error:", e);
    }

    return { member: cleanMember, count:0, last:"" };
  };

  window.showLoading = function(){
    const complete = document.getElementById("complete");
    const completeDetail = document.getElementById("completeDetail");
    if(!complete || !completeDetail) return;

    completeDetail.innerHTML =
      "<span class='complete-title'>受講数照会</span><br><br>照会中…";

    complete.style.display = "flex";
  };

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
    },3000);
  };

  function getDuplicateCacheKey(member, date){
    return `${date}__${member}`;
  }

  async function fetchTodayRemoteDuplicateClassSet(member){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const duplicateSet = new Set();

    if(!cleanMember) return duplicateSet;

    const tq =
      "select B,C,D where D='" +
      escapeForGvizString(today) +
      "'";

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      window.APP_CONFIG.SPREADSHEET_ID +
      "/gviz/tq?tqx=out:json&gid=" +
      window.APP_CONFIG.DUPLICATE_GID +
      "&tq=" +
      encodeURIComponent(tq);

    try{
      const res = await fetch(url,{cache:"no-store"});
      const text = await res.text();
      const json = parseGvizJson(text);
      const rows = json.table?.rows || [];

      rows.forEach(r => {
        const rawMember = r.c?.[0]?.v ?? r.c?.[0]?.f ?? "";
        const cls = normalizeClassName(r.c?.[1]?.v ?? r.c?.[1]?.f ?? "");
        const date = normalizeSheetDateCell(r.c?.[2]?.v ?? r.c?.[2]?.f ?? "");

        if(!cls) return;
        if(date !== today) return;
        if(!isSameMemberId(rawMember, cleanMember)) return;

        duplicateSet.add(cls);
      });

    }catch(e){
      console.log("fetchTodayRemoteDuplicateClassSet error:", e);
    }

    return duplicateSet;
  }

  window.getTodayRemoteDuplicateClassSet = async function(member, forceRefresh = false){
    const cleanMember = window.normalizeMember(member);
    const today = window.getTokyoTodayString();
    const cacheKey = getDuplicateCacheKey(getMemberCompareKey(cleanMember), today);
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
    return await window.getTodayRemoteDuplicateClassSet(member, forceRefresh);
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
      delete duplicateCacheMap[getDuplicateCacheKey(getMemberCompareKey(cleanMember), today)];
      return;
    }

    duplicateCacheMap = {};
  };

  window.checkDuplicate = async function(member, className, forceRefresh = false){
    const duplicates = await window.getTodayDuplicateClasses(member, [className], forceRefresh);
    return duplicates.includes(normalizeClassName(className));
  };

  function getCurrentMemberForDuplicateCheck(){
    return window.currentMember ||
      document.getElementById("memberInput")?.value ||
      document.getElementById("member")?.value ||
      "";
  }

  function markButtonAsAccepted(btn, day, className){
    btn.disabled = true;
    btn.style.background = "#b8b8b8";
    btn.style.color = "#666";
    btn.style.fontWeight = "bold";
    btn.style.opacity = "1";
    btn.textContent = "受付済み ✓ " + displayClassName(day, className);
  }

  function markButtonAsSelected(btn){
    btn.style.background = "#66ADFF";
    btn.style.color = "#fff";
    btn.style.fontWeight = "bold";
  }

  function clearButtonSelectedStyle(btn){
    btn.style.background = "";
    btn.style.color = "";
    btn.style.fontWeight = "";
  }

  window.renderDayButtons = function({ dayButtonsEl, selectedDay, onSelect }){
    dayButtonsEl.innerHTML = "";

    window.DAY_MAP.forEach(day => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day-btn" + (day === selectedDay ? " today" : "");
      btn.textContent = day === "WS" ? "WS" : `${day}曜`;
      btn.onclick = () => onSelect(day);
      dayButtonsEl.appendChild(btn);
    });
  };

  window.renderClasses = function({ day, titleEl, containerEl, onSubmit }){

    titleEl.textContent =
      day === "WS"
        ? "本日のクラス（WS）"
        : `本日のクラス（${day}曜日）`;

    containerEl.innerHTML = "";

    const list = window.CLASSES_BY_DAY[day] || [];
    const selectedClasses = [];
    const buttonMap = new Map();

    const selectedBox = document.createElement("div");
    selectedBox.style.fontSize = "24px";
    selectedBox.style.margin = "12px 0 20px";
    selectedBox.style.lineHeight = "1.6";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "remain-btn";
    confirmBtn.textContent = "選択したクラスを受付";
    confirmBtn.style.display = "none";

    function refreshSelected(){
      if(!selectedClasses.length){
        selectedBox.innerHTML = "";
        confirmBtn.style.display = "none";
        return;
      }

      selectedBox.innerHTML =
        "<b>選択中：</b><br>" +
        selectedClasses
          .map(c => "・" + window.escapeHtml(displayClassName(day,c)))
          .join("<br>");

      confirmBtn.style.display = "block";
    }

    function removeSelectedClass(className){
      const idx = selectedClasses.indexOf(className);
      if(idx >= 0) selectedClasses.splice(idx, 1);
      refreshSelected();
    }

    function applyDuplicateButtons(duplicateSet){
      buttonMap.forEach((btn, className) => {
        const normalized = normalizeClassName(className);
        if(duplicateSet.has(normalized)){
          removeSelectedClass(className);
          markButtonAsAccepted(btn, day, className);
        }
      });
    }

    list.forEach(className => {

      const raw = String(className || "");

      if(day !== "WS" && raw.startsWith("WS_")){
        return;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "class-btn";
      btn.textContent = "受付 ▶ " + displayClassName(day,className);

      buttonMap.set(className, btn);

      btn.onclick = () => {
        if(btn.disabled) return;

        const idx = selectedClasses.indexOf(className);

        if(idx >= 0){
          selectedClasses.splice(idx,1);
          clearButtonSelectedStyle(btn);
        }else{
          selectedClasses.push(className);
          markButtonAsSelected(btn);
        }

        refreshSelected();
      };

      containerEl.appendChild(btn);
    });

    containerEl.appendChild(selectedBox);
    containerEl.appendChild(confirmBtn);

    const memberForCheck = getCurrentMemberForDuplicateCheck();

    if(memberForCheck){
      window.getTodayDuplicateClassSet(memberForCheck, false)
        .then(duplicateSet => {
          applyDuplicateButtons(duplicateSet);
        })
        .catch(err => {
          console.log("duplicate button render error:", err);
        });
    }

    confirmBtn.onclick = async () => {
      if(!selectedClasses.length){
        alert("クラスを選択してください");
        return;
      }

      const member = getCurrentMemberForDuplicateCheck();
      const classesToSubmit = selectedClasses.slice();

      if(member){
        const duplicates = await window.getTodayDuplicateClasses(member, classesToSubmit, true);

        if(duplicates.length > 0){
          alert(
            "すでに受付済みのクラスがあります。\n\n" +
            duplicates.map(c => "・" + c).join("\n")
          );

          const duplicateSet = new Set(duplicates.map(normalizeClassName));
          applyDuplicateButtons(duplicateSet);
          return;
        }
      }

      await Promise.resolve(onSubmit(classesToSubmit));
    };
  };

})();
