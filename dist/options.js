import{D as f}from"./chunks/config-Dllf2bEH.js";let n={courses:[],settings:{...f}},c="assisted";document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{var o;const e=t.dataset.section;document.querySelectorAll(".nav-item").forEach(a=>a.classList.remove("active")),document.querySelectorAll(".section").forEach(a=>a.classList.remove("active")),t.classList.add("active"),(o=document.getElementById(`section-${e}`))==null||o.classList.add("active")})});function p(){return`course-${Date.now()}-${Math.random().toString(36).slice(2,6)}`}function l(){const t=document.getElementById("course-list");t.innerHTML="",n.courses.forEach((e,o)=>{const a=document.createElement("div");a.className="course-item",a.dataset.id=e.id,a.innerHTML=`
      <div class="course-item-header">
        <div class="course-priority-badge">${o+1}</div>
        <input
          class="form-input course-name-input"
          type="text"
          placeholder="Nama Mata Kuliah (contoh: Pemrograman Web)"
          value="${m(e.name)}"
          data-field="name"
          data-id="${e.id}"
        />
        <label class="toggle" title="Enable/Disable">
          <input type="checkbox" ${e.enabled?"checked":""} data-field="enabled" data-id="${e.id}" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <div class="course-item-row">
        <div class="form-group" style="margin:0">
          <label class="form-label">Kode MK (opsional)</label>
          <input
            class="form-input"
            type="text"
            placeholder="contoh: TIF305"
            value="${m(e.code??"")}"
            data-field="code"
            data-id="${e.id}"
          />
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label">Priority</label>
          <input
            class="form-input"
            type="number"
            min="1"
            max="99"
            value="${e.priority}"
            style="width:80px"
            data-field="priority"
            data-id="${e.id}"
          />
        </div>
      </div>

      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Kelas Prioritas (pisah koma, kiri = utama)</label>
        <input
          class="form-input"
          type="text"
          placeholder="contoh: A, B, C"
          value="${e.preferredClasses.join(", ")}"
          data-field="preferredClasses"
          data-id="${e.id}"
        />
        <div class="form-hint">Kelas A akan dicoba pertama, lalu B, lalu C.</div>
      </div>

      <div class="course-actions">
        <button class="btn btn-ghost btn-sm" data-action="move-up" data-id="${e.id}">↑ Naik</button>
        <button class="btn btn-ghost btn-sm" data-action="move-down" data-id="${e.id}">↓ Turun</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${e.id}">🗑️ Hapus</button>
      </div>
    `,t.appendChild(a)}),t.querySelectorAll("[data-field]").forEach(e=>{e.addEventListener("input",u),e.addEventListener("change",u)}),t.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",b)})}function u(t){const e=t.target,o=e.dataset.id,a=e.dataset.field,i=n.courses.find(s=>s.id===o);i&&(a==="name"&&(i.name=e.value),a==="code"&&(i.code=e.value||void 0),a==="priority"&&(i.priority=parseInt(e.value)||1),a==="enabled"&&(i.enabled=e.checked),a==="preferredClasses"&&(i.preferredClasses=e.value.split(",").map(s=>s.trim().toUpperCase()).filter(s=>s.length>0)))}function b(t){const e=t.target,o=e.dataset.action,a=e.dataset.id,i=n.courses.findIndex(s=>s.id===a);i!==-1&&(o==="delete"?(n.courses.splice(i,1),l()):o==="move-up"&&i>0?([n.courses[i-1],n.courses[i]]=[n.courses[i],n.courses[i-1]],n.courses.forEach((s,r)=>{s.priority=r+1}),l()):o==="move-down"&&i<n.courses.length-1&&([n.courses[i],n.courses[i+1]]=[n.courses[i+1],n.courses[i]],n.courses.forEach((s,r)=>{s.priority=r+1}),l()))}document.getElementById("btn-add-course").addEventListener("click",()=>{var o;const t={id:p(),name:"",code:void 0,preferredClasses:["A"],priority:n.courses.length+1,enabled:!0};n.courses.push(t),l();const e=document.querySelectorAll('[data-field="name"]');(o=e[e.length-1])==null||o.focus()});document.querySelectorAll(".mode-card").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.mode;c=e,n.settings.automationMode=e,document.querySelectorAll(".mode-card").forEach(a=>a.classList.remove("selected")),t.classList.add("selected");const o=document.getElementById("card-final-submit");o.style.display=e==="full"?"block":"none"})});function d(t,e,o="number"){const a=document.getElementById(t);if(a)if(o==="boolean"){const i=a;i.addEventListener("change",()=>{n.settings[e]=i.checked})}else{const i=a;i.addEventListener("input",()=>{n.settings[e]=parseInt(i.value)||f[e]})}}d("input-scan-interval","scanInterval");d("input-confirm-timeout","confirmationTimeout");d("input-max-retries","maxRetries");d("input-countdown","finalSubmissionCountdown");d("toggle-sound","enableSound","boolean");d("toggle-notifications","enableNotifications","boolean");d("toggle-debug","debugMode","boolean");d("toggle-final-submit","enableFinalSubmission","boolean");document.getElementById("btn-save").addEventListener("click",async()=>{try{await chrome.runtime.sendMessage({type:"SAVE_CONFIG",config:n});const t=document.getElementById("save-indicator");t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2e3)}catch(t){console.error("Save failed",t)}});document.getElementById("btn-reset").addEventListener("click",async()=>{confirm("Hapus semua data konfigurasi? Tindakan ini tidak dapat dibatalkan.")&&(await chrome.storage.local.clear(),window.location.reload())});async function v(){try{const t=await chrome.runtime.sendMessage({type:"GET_CONFIG"});if(t!=null&&t.ok&&t.config){n=t.config,c=n.settings.automationMode,l(),document.querySelectorAll(".mode-card").forEach(o=>{const a=o;a.classList.toggle("selected",a.dataset.mode===c)});const e=document.getElementById("card-final-submit");e.style.display=c==="full"?"block":"none",document.getElementById("input-scan-interval").value=String(n.settings.scanInterval),document.getElementById("input-confirm-timeout").value=String(n.settings.confirmationTimeout),document.getElementById("input-max-retries").value=String(n.settings.maxRetries),document.getElementById("input-countdown").value=String(n.settings.finalSubmissionCountdown),document.getElementById("toggle-sound").checked=n.settings.enableSound,document.getElementById("toggle-notifications").checked=n.settings.enableNotifications,document.getElementById("toggle-debug").checked=n.settings.debugMode,document.getElementById("toggle-final-submit").checked=n.settings.enableFinalSubmission}}catch{}}var g;(g=document.getElementById("btn-open-mock"))==null||g.addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("mock-irs/index.html")}).catch(()=>{alert("Cannot open mock IRS. Make sure mock-irs/index.html is included in the extension package.")})});function m(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}v();
//# sourceMappingURL=options.js.map
