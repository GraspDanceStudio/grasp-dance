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
    DUPLICATE_CACHE_MS: 10000,
    LOCAL_PENDING_MINUTES: 10
  };

  window.getTokyoTodayString = function(){
    const d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth()+1).padStart(2,"0") + "-" +
      String(d.getDate()).padStart(2,"0");
  };

  window.escapeHtml = function(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;");
  };

  window.normalizeMember = function(value){
    let s = String(value || "").trim();

    s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
    );

    s = s.replace(/[^0-9]/g, "");

    return s;
  };

  function normalizeClassName(v){
    return String(v || "").trim();
  }

  function parseGvizJson(text){
    return JSON.parse(
      text.replace("/*O_o*/","")
          .replace("google.visualization.Query.setResponse(","")
          .slice(0,-2)
    );
  }

  async function fetchRemote(member){

    const today = window.getTokyoTodayString();
    const duplicateSet = new Set();

    const url =
      "https://docs.google.com/spreadsheets/d/" +
      window.APP_CONFIG.SPREADSHEET_ID +
      "/gviz/tq?tqx=out:json&gid=" +
      window.APP_CONFIG.DUPLICATE_GID +
      "&tq=" + encodeURIComponent(
        "select B,C,D where D='" + today + "'"
      );

    try{
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      const json = parseGvizJson(text);

      const rows = json.table?.rows || [];

      const targetNum = Number(member);

      for(const r of rows){

        const rawMember = r.c?.[0]?.v || r.c?.[0]?.f || "";
        const cls = normalizeClassName(r.c?.[1]?.v || "");
        const date = String(r.c?.[2]?.v || "");

        if(!cls) continue;
        if(date !== today) continue;

        const rowNum = Number(rawMember);

        if(rowNum !== targetNum) continue;

        duplicateSet.add(cls);
      }

      return duplicateSet;

    }catch(e){
      console.log("fetchRemote error", e);
      return duplicateSet;
    }
  }

  window.getTodayDuplicateClassSet = async function(member){

    const remote = await fetchRemote(member);

    return remote;
  };

})();
