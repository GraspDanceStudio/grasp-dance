(() => {

  // ===== 強制確認（これが出ればOK） =====
  alert("shared.js DEBUG 2026-04-18-OK");
  console.log("shared.js DEBUG 2026-04-18-OK");

  // ===== デバッグ表示 =====
  function renderDebugBox(info){
    let box = document.getElementById("debugBox");

    if(!box){
      box = document.createElement("div");
      box.id = "debugBox";
      box.style.position = "fixed";
      box.style.bottom = "0";
      box.style.left = "0";
      box.style.width = "100%";
      box.style.maxHeight = "40%";
      box.style.overflow = "auto";
      box.style.background = "#000";
      box.style.color = "#0f0";
      box.style.fontSize = "18px";
      box.style.zIndex = "99999";
      box.style.padding = "10px";
      document.body.appendChild(box);
    }

    box.innerHTML =
      "<b>DEBUG OK</b><br>" +
      "member: " + info.member + "<br>" +
      "today: " + info.today + "<br><br>" +

      "<b>remote（スプシ）</b><br>" +
      Array.from(info.remote).join("<br>") + "<br><br>" +

      "<b>pending</b><br>" +
      Array.from(info.pending).join("<br>") + "<br><br>" +

      "<b>confirmed</b><br>" +
      Array.from(info.confirmed).join("<br>") + "<br><br>" +

      "<b>merged</b><br>" +
      Array.from(info.merged).join("<br>");
  }

  // ===== 日付 =====
  function getToday(){
    const d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth()+1).padStart(2,"0") + "-" +
      String(d.getDate()).padStart(2,"0");
  }

  function normalize(v){
    return String(v || "").trim();
  }

  // ===== スプシ取得 =====
  async function fetchRemote(member){
    const today = getToday();

    const url =
      "https://docs.google.com/spreadsheets/d/1z7xSOOjsXyuQn5p9aE3tl5fgzIMkxoLKVnnpTYUTS9k/gviz/tq?tqx=out:json&gid=969068048&tq=" +
      encodeURIComponent(
        "select C where B='" + member + "' and D='" + today + "'"
      );

    const res = await fetch(url);
    const text = await res.text();

    const json = JSON.parse(
      text.replace("/*O_o*/","")
          .replace("google.visualization.Query.setResponse(","")
          .slice(0,-2)
    );

    const set = new Set();

    (json.table?.rows || []).forEach(r => {
      const v = normalize(r.c?.[0]?.v);
      if(v) set.add(v);
    });

    return set;
  }

  function getLocalSet(key, member){
    try{
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      const today = getToday();
      return new Set(map[`${today}__${member}`] || []);
    }catch(e){
      return new Set();
    }
  }

  // ===== メイン =====
  window.debugCheck = async function(member){

    const m = normalize(member);
    const today = getToday();

    const remote = await fetchRemote(m);
    const pending = getLocalSet("danceStudioPendingReceipts", m);
    const confirmed = getLocalSet("danceStudioConfirmedReceipts", m);

    const merged = new Set();
    remote.forEach(v => merged.add(v));
    pending.forEach(v => merged.add(v));
    confirmed.forEach(v => merged.add(v));

    renderDebugBox({
      member: m,
      today,
      remote,
      pending,
      confirmed,
      merged
    });
  };

})();
