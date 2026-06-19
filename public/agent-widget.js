(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var agentId = script.getAttribute("data-agent-id");
  if (!agentId) return;

  var BASE_URL = script.src.replace("/agent-widget.js", "");
  var sessionId = "s_" + Math.random().toString(36).slice(2) + Date.now();
  var config = null;
  var isOpen = false;
  var messages = [];

  // Inject styles
  var style = document.createElement("style");
  style.textContent = [
    ".pca-btn{position:fixed;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:99998;transition:transform .2s,box-shadow .2s}",
    ".pca-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,0.4)}",
    ".pca-btn.bottom-left{bottom:24px;left:24px}",
    ".pca-btn.bottom-right{bottom:24px;right:24px}",
    ".pca-box{position:fixed;width:360px;max-height:520px;border-radius:20px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,0.35);z-index:99999;transition:opacity .25s,transform .25s;border:1px solid rgba(255,255,255,0.1)}",
    ".pca-box.bottom-left{bottom:92px;left:24px}",
    ".pca-box.bottom-right{bottom:92px;right:24px}",
    ".pca-box.hidden{opacity:0;transform:translateY(12px) scale(0.97);pointer-events:none}",
    ".pca-head{padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,0.08)}",
    ".pca-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}",
    ".pca-title{font-size:14px;font-weight:600;color:#fff}",
    ".pca-status{font-size:11px;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:4px}",
    ".pca-dot{width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block}",
    ".pca-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:200px}",
    ".pca-msg{max-width:82%;padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.5;word-break:break-word}",
    ".pca-msg.bot{align-self:flex-start;background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);border-bottom-left-radius:4px}",
    ".pca-msg.user{align-self:flex-end;color:#fff;border-bottom-right-radius:4px}",
    ".pca-typing{display:flex;gap:4px;padding:8px 12px;background:rgba(255,255,255,.06);border-radius:14px;width:fit-content}",
    ".pca-typing span{width:7px;height:7px;background:rgba(255,255,255,.4);border-radius:50%;animation:pca-bounce .9s infinite}",
    ".pca-typing span:nth-child(2){animation-delay:.15s}",
    ".pca-typing span:nth-child(3){animation-delay:.3s}",
    "@keyframes pca-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}",
    ".pca-foot{padding:8px;border-top:1px solid rgba(255,255,255,.08);display:flex;gap:6px}",
    ".pca-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 12px;color:#fff;font-size:13px;outline:none;font-family:inherit}",
    ".pca-input::placeholder{color:rgba(255,255,255,.3)}",
    ".pca-send{width:34px;height:34px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;transition:opacity .2s}",
    ".pca-send:hover{opacity:.85}",
    ".pca-brand{text-align:center;font-size:10px;color:rgba(255,255,255,.2);padding:4px 0 6px;direction:rtl}",
    ".pca-brand a{color:rgba(255,255,255,.3);text-decoration:none}",
  ].join("");
  document.head.appendChild(style);

  function loadConfig(cb) {
    fetch(BASE_URL + "/api/agent/chat/" + agentId)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        config = d;
        cb(d);
      })
      .catch(function () {
        cb({ name: "دستیار", welcomeMessage: "سلام! چطور می‌تونم کمک کنم؟", customization: {} });
      });
  }

  function buildUI(cfg) {
    var c = cfg.customization || {};
    var color = c.primaryColor || "#5b6cff";
    var pos = c.position || "bottom-left";
    var emoji = c.avatarEmoji || "🤖";
    var showBrand = c.showBranding !== false;

    // Toggle button
    var btn = document.createElement("button");
    btn.className = "pca-btn " + pos;
    btn.style.background = color;
    btn.innerHTML = emoji;
    document.body.appendChild(btn);

    // Chat box
    var box = document.createElement("div");
    box.className = "pca-box " + pos + " hidden";
    box.style.background = "#0d0d1f";

    box.innerHTML = [
      '<div class="pca-head" style="background:' + color + '18">',
        '<div class="pca-avatar" style="background:' + color + '33">' + emoji + '</div>',
        '<div>',
          '<div class="pca-title">' + (cfg.name || "دستیار") + '</div>',
          '<div class="pca-status"><span class="pca-dot"></span> آنلاین</div>',
        '</div>',
        '<button onclick="this.closest(\'.pca-box\').classList.add(\'hidden\')" style="margin-right:auto;background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:18px;line-height:1">×</button>',
      '</div>',
      '<div class="pca-msgs" id="pca-msgs-' + agentId + '"></div>',
      '<div class="pca-foot">',
        '<input class="pca-input" id="pca-inp-' + agentId + '" placeholder="بنویسید..." dir="auto" />',
        '<button class="pca-send" id="pca-snd-' + agentId + '" style="background:' + color + '">↑</button>',
      '</div>',
      showBrand ? '<div class="pca-brand">پشتیبانی‌شده توسط <a href="https://persicore.ir" target="_blank">پرسیکور</a></div>' : "",
    ].join("");
    document.body.appendChild(box);

    // Welcome message
    addMessage("bot", cfg.welcomeMessage || "سلام! چطور می‌تونم کمک کنم؟", color);

    btn.addEventListener("click", function () {
      isOpen = !isOpen;
      box.classList.toggle("hidden", !isOpen);
      if (isOpen) {
        setTimeout(function () { document.getElementById("pca-inp-" + agentId).focus(); }, 100);
      }
    });

    var inp = document.getElementById("pca-inp-" + agentId);
    var snd = document.getElementById("pca-snd-" + agentId);
    snd.addEventListener("click", sendMessage);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function addMessage(role, text, color) {
    var container = document.getElementById("pca-msgs-" + agentId);
    if (!container) return;
    var div = document.createElement("div");
    div.className = "pca-msg " + role;
    if (role === "user" && color) div.style.background = color;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function showTyping() {
    var container = document.getElementById("pca-msgs-" + agentId);
    if (!container) return null;
    var div = document.createElement("div");
    div.className = "pca-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function sendMessage() {
    var inp = document.getElementById("pca-inp-" + agentId);
    var text = inp.value.trim();
    if (!text) return;
    var c = (config && config.customization) || {};
    var color = c.primaryColor || "#5b6cff";
    inp.value = "";
    addMessage("user", text, color);
    messages.push({ role: "user", content: text });

    var typing = showTyping();

    fetch(BASE_URL + "/api/agent/chat/" + agentId, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (typing) typing.remove();
        var reply = (d.data && d.data.reply) || "متأسفانه پاسخی ندارم.";
        addMessage("bot", reply);
        messages.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        if (typing) typing.remove();
        addMessage("bot", "خطا در اتصال. لطفاً دوباره تلاش کنید.");
      });
  }

  loadConfig(buildUI);
})();
