import{D as h}from"./chunks/config-BkypKS5e.js";let n={courses:[],settings:{...h}},g="assisted";document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{var i;const e=t.dataset.section;document.querySelectorAll(".nav-item").forEach(a=>a.classList.remove("active")),document.querySelectorAll(".section").forEach(a=>a.classList.remove("active")),t.classList.add("active"),(i=document.getElementById(`section-${e}`))==null||i.classList.add("active")})});function y(){return`course-${Date.now()}-${Math.random().toString(36).slice(2,6)}`}function c(){const t=document.getElementById("course-list");t.innerHTML="",n.courses.forEach((e,i)=>{const a=document.createElement("div");a.className="course-item",a.dataset.id=e.id,a.innerHTML=`
      <div class="course-item-header">
        <div class="course-priority-badge">${i+1}</div>
        <input
          class="form-input course-name-input"
          type="text"
          placeholder="Nama Mata Kuliah (contoh: Pemrograman Web)"
          value="${l(e.name)}"
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
            value="${l(e.code??"")}"
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
    `,t.appendChild(a)}),t.querySelectorAll("[data-field]").forEach(e=>{e.addEventListener("input",b),e.addEventListener("change",b)}),t.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",E)})}function b(t){const e=t.target,i=e.dataset.id,a=e.dataset.field,s=n.courses.find(o=>o.id===i);s&&(a==="name"&&(s.name=e.value),a==="code"&&(s.code=e.value||void 0),a==="priority"&&(s.priority=parseInt(e.value)||1),a==="enabled"&&(s.enabled=e.checked),a==="preferredClasses"&&(s.preferredClasses=e.value.split(",").map(o=>o.trim().toUpperCase()).filter(o=>o.length>0)))}function E(t){const e=t.target,i=e.dataset.action,a=e.dataset.id,s=n.courses.findIndex(o=>o.id===a);s!==-1&&(i==="delete"?(n.courses.splice(s,1),c()):i==="move-up"&&s>0?([n.courses[s-1],n.courses[s]]=[n.courses[s],n.courses[s-1]],n.courses.forEach((o,f)=>{o.priority=f+1}),c()):i==="move-down"&&s<n.courses.length-1&&([n.courses[s],n.courses[s+1]]=[n.courses[s+1],n.courses[s]],n.courses.forEach((o,f)=>{o.priority=f+1}),c()))}document.getElementById("btn-add-course").addEventListener("click",()=>{var i;const t={id:y(),name:"",code:void 0,preferredClasses:["A"],priority:n.courses.length+1,enabled:!0};n.courses.push(t),c();const e=document.querySelectorAll('[data-field="name"]');(i=e[e.length-1])==null||i.focus()});const r=document.getElementById("btn-scan-courses"),p=document.getElementById("scan-results-container"),u=document.getElementById("scan-results-list"),k=document.getElementById("btn-close-scan"),I=document.getElementById("btn-add-scanned");r.addEventListener("click",async()=>{r.disabled=!0,r.textContent="Memindai...",u.innerHTML='<div style="padding:12px;text-align:center">Memindai halaman IRS...</div>',p.style.display="block";try{const t=await chrome.runtime.sendMessage({type:"SCAN_COURSES"});if(!t||!t.ok)throw new Error((t==null?void 0:t.error)||"Pastikan kamu sedang membuka halaman IRS dan sudah di-refresh (F5).");const e=t.courses||[];e.length===0?u.innerHTML='<div style="padding:12px;text-align:center;color:var(--clr-danger)">Tidak ada mata kuliah yang terdeteksi di halaman kalender.</div>':u.innerHTML=e.map((i,a)=>`
        <label style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--clr-surface2); border-radius:4px; cursor:pointer;">
          <input type="checkbox" class="scan-checkbox" data-index="${a}" data-name="${l(i.name)}" data-classes="${l(i.classes.join(","))}" />
          <div>
            <div style="font-weight:600; font-size:13px">${l(i.name)}</div>
            <div style="font-size:11px; color:var(--clr-text-muted)">Kelas: ${l(i.classes.join(", "))}</div>
          </div>
        </label>
      `).join("")}catch(t){u.innerHTML=`<div style="padding:12px;color:var(--clr-danger);font-size:12px">Gagal memindai: ${t}</div>`}finally{r.disabled=!1,r.textContent="🔍 Pindai Mata Kuliah dari Halaman"}});k.addEventListener("click",()=>{p.style.display="none"});I.addEventListener("click",()=>{const t=u.querySelectorAll(".scan-checkbox:checked");t.length!==0&&(t.forEach(e=>{const i=e.dataset.name,a=e.dataset.classes.split(",");n.courses.some(s=>s.name.toLowerCase()===i.toLowerCase())||n.courses.push({id:y(),name:i,code:void 0,preferredClasses:a.length>0&&a[0]!==""?a:["A"],priority:n.courses.length+1,enabled:!0})}),c(),p.style.display="none")});document.querySelectorAll(".mode-card").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.mode;g=e,n.settings.automationMode=e,document.querySelectorAll(".mode-card").forEach(a=>a.classList.remove("selected")),t.classList.add("selected");const i=document.getElementById("card-final-submit");i.style.display=e==="full"?"block":"none"})});function d(t,e,i="number"){const a=document.getElementById(t);if(a)if(i==="boolean"){const s=a;s.addEventListener("change",()=>{n.settings[e]=s.checked})}else{const s=a;s.addEventListener("input",()=>{n.settings[e]=parseInt(s.value)||h[e]})}}d("input-scan-interval","scanInterval");d("input-confirm-timeout","confirmationTimeout");d("input-max-retries","maxRetries");d("input-countdown","finalSubmissionCountdown");d("toggle-sound","enableSound","boolean");d("toggle-notifications","enableNotifications","boolean");d("toggle-debug","debugMode","boolean");d("toggle-final-submit","enableFinalSubmission","boolean");d("toggle-auto-refresh","autoRefresh","boolean");const m=document.getElementById("input-refresh-interval");m==null||m.addEventListener("change",()=>{n.settings.autoRefreshInterval=(parseInt(m.value)||5)*1e3});document.getElementById("btn-save").addEventListener("click",async()=>{try{await chrome.runtime.sendMessage({type:"SAVE_CONFIG",config:n});const t=document.getElementById("save-indicator");t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2e3)}catch(t){console.error("Save failed",t)}});document.getElementById("btn-reset").addEventListener("click",async()=>{confirm("Hapus semua data konfigurasi? Tindakan ini tidak dapat dibatalkan.")&&(await chrome.storage.local.clear(),window.location.reload())});async function L(){try{const t=await chrome.runtime.sendMessage({type:"GET_CONFIG"});if(t!=null&&t.ok&&t.config){n=t.config,g=n.settings.automationMode,c(),document.querySelectorAll(".mode-card").forEach(a=>{const s=a;s.classList.toggle("selected",s.dataset.mode===g)});const e=document.getElementById("card-final-submit");e.style.display=g==="full"?"block":"none",document.getElementById("input-scan-interval").value=String(n.settings.scanInterval),document.getElementById("input-confirm-timeout").value=String(n.settings.confirmationTimeout),document.getElementById("input-max-retries").value=String(n.settings.maxRetries),document.getElementById("input-countdown").value=String(n.settings.finalSubmissionCountdown),document.getElementById("toggle-sound").checked=n.settings.enableSound,document.getElementById("toggle-notifications").checked=n.settings.enableNotifications,document.getElementById("toggle-debug").checked=n.settings.debugMode,document.getElementById("toggle-final-submit").checked=n.settings.enableFinalSubmission,document.getElementById("toggle-auto-refresh").checked=n.settings.autoRefresh;const i=document.getElementById("input-refresh-interval");i&&(i.value=String(n.settings.autoRefreshInterval/1e3))}}catch{}}var v;(v=document.getElementById("btn-open-mock"))==null||v.addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("mock-irs/index.html")}).catch(()=>{alert("Cannot open mock IRS. Make sure mock-irs/index.html is included in the extension package.")})});function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}L();
//# sourceMappingURL=options.js.map
