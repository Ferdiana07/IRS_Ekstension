import{D as v}from"./chunks/config-Dllf2bEH.js";let n={courses:[],settings:{...v}},m="assisted";document.querySelectorAll(".nav-item").forEach(t=>{t.addEventListener("click",()=>{var s;const e=t.dataset.section;document.querySelectorAll(".nav-item").forEach(a=>a.classList.remove("active")),document.querySelectorAll(".section").forEach(a=>a.classList.remove("active")),t.classList.add("active"),(s=document.getElementById(`section-${e}`))==null||s.classList.add("active")})});function y(){return`course-${Date.now()}-${Math.random().toString(36).slice(2,6)}`}function c(){const t=document.getElementById("course-list");t.innerHTML="",n.courses.forEach((e,s)=>{const a=document.createElement("div");a.className="course-item",a.dataset.id=e.id,a.innerHTML=`
      <div class="course-item-header">
        <div class="course-priority-badge">${s+1}</div>
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
    `,t.appendChild(a)}),t.querySelectorAll("[data-field]").forEach(e=>{e.addEventListener("input",f),e.addEventListener("change",f)}),t.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",h)})}function f(t){const e=t.target,s=e.dataset.id,a=e.dataset.field,i=n.courses.find(o=>o.id===s);i&&(a==="name"&&(i.name=e.value),a==="code"&&(i.code=e.value||void 0),a==="priority"&&(i.priority=parseInt(e.value)||1),a==="enabled"&&(i.enabled=e.checked),a==="preferredClasses"&&(i.preferredClasses=e.value.split(",").map(o=>o.trim().toUpperCase()).filter(o=>o.length>0)))}function h(t){const e=t.target,s=e.dataset.action,a=e.dataset.id,i=n.courses.findIndex(o=>o.id===a);i!==-1&&(s==="delete"?(n.courses.splice(i,1),c()):s==="move-up"&&i>0?([n.courses[i-1],n.courses[i]]=[n.courses[i],n.courses[i-1]],n.courses.forEach((o,g)=>{o.priority=g+1}),c()):s==="move-down"&&i<n.courses.length-1&&([n.courses[i],n.courses[i+1]]=[n.courses[i+1],n.courses[i]],n.courses.forEach((o,g)=>{o.priority=g+1}),c()))}document.getElementById("btn-add-course").addEventListener("click",()=>{var s;const t={id:y(),name:"",code:void 0,preferredClasses:["A"],priority:n.courses.length+1,enabled:!0};n.courses.push(t),c();const e=document.querySelectorAll('[data-field="name"]');(s=e[e.length-1])==null||s.focus()});const r=document.getElementById("btn-scan-courses"),p=document.getElementById("scan-results-container"),u=document.getElementById("scan-results-list"),E=document.getElementById("btn-close-scan"),k=document.getElementById("btn-add-scanned");r.addEventListener("click",async()=>{r.disabled=!0,r.textContent="Memindai...",u.innerHTML='<div style="padding:12px;text-align:center">Memindai halaman IRS...</div>',p.style.display="block";try{const t=await chrome.runtime.sendMessage({type:"SCAN_COURSES"});if(!t||!t.ok)throw new Error((t==null?void 0:t.error)||"Pastikan kamu sedang membuka halaman IRS dan sudah di-refresh (F5).");const e=t.courses||[];e.length===0?u.innerHTML='<div style="padding:12px;text-align:center;color:var(--clr-danger)">Tidak ada mata kuliah yang terdeteksi di halaman kalender.</div>':u.innerHTML=e.map((s,a)=>`
        <label style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--clr-surface2); border-radius:4px; cursor:pointer;">
          <input type="checkbox" class="scan-checkbox" data-index="${a}" data-name="${l(s.name)}" data-classes="${l(s.classes.join(","))}" />
          <div>
            <div style="font-weight:600; font-size:13px">${l(s.name)}</div>
            <div style="font-size:11px; color:var(--clr-text-muted)">Kelas: ${l(s.classes.join(", "))}</div>
          </div>
        </label>
      `).join("")}catch(t){u.innerHTML=`<div style="padding:12px;color:var(--clr-danger);font-size:12px">Gagal memindai: ${t}</div>`}finally{r.disabled=!1,r.textContent="🔍 Pindai Mata Kuliah dari Halaman"}});E.addEventListener("click",()=>{p.style.display="none"});k.addEventListener("click",()=>{const t=u.querySelectorAll(".scan-checkbox:checked");t.length!==0&&(t.forEach(e=>{const s=e.dataset.name,a=e.dataset.classes.split(",");n.courses.some(i=>i.name.toLowerCase()===s.toLowerCase())||n.courses.push({id:y(),name:s,code:void 0,preferredClasses:a.length>0&&a[0]!==""?a:["A"],priority:n.courses.length+1,enabled:!0})}),c(),p.style.display="none")});document.querySelectorAll(".mode-card").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.mode;m=e,n.settings.automationMode=e,document.querySelectorAll(".mode-card").forEach(a=>a.classList.remove("selected")),t.classList.add("selected");const s=document.getElementById("card-final-submit");s.style.display=e==="full"?"block":"none"})});function d(t,e,s="number"){const a=document.getElementById(t);if(a)if(s==="boolean"){const i=a;i.addEventListener("change",()=>{n.settings[e]=i.checked})}else{const i=a;i.addEventListener("input",()=>{n.settings[e]=parseInt(i.value)||v[e]})}}d("input-scan-interval","scanInterval");d("input-confirm-timeout","confirmationTimeout");d("input-max-retries","maxRetries");d("input-countdown","finalSubmissionCountdown");d("toggle-sound","enableSound","boolean");d("toggle-notifications","enableNotifications","boolean");d("toggle-debug","debugMode","boolean");d("toggle-final-submit","enableFinalSubmission","boolean");document.getElementById("btn-save").addEventListener("click",async()=>{try{await chrome.runtime.sendMessage({type:"SAVE_CONFIG",config:n});const t=document.getElementById("save-indicator");t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2e3)}catch(t){console.error("Save failed",t)}});document.getElementById("btn-reset").addEventListener("click",async()=>{confirm("Hapus semua data konfigurasi? Tindakan ini tidak dapat dibatalkan.")&&(await chrome.storage.local.clear(),window.location.reload())});async function I(){try{const t=await chrome.runtime.sendMessage({type:"GET_CONFIG"});if(t!=null&&t.ok&&t.config){n=t.config,m=n.settings.automationMode,c(),document.querySelectorAll(".mode-card").forEach(s=>{const a=s;a.classList.toggle("selected",a.dataset.mode===m)});const e=document.getElementById("card-final-submit");e.style.display=m==="full"?"block":"none",document.getElementById("input-scan-interval").value=String(n.settings.scanInterval),document.getElementById("input-confirm-timeout").value=String(n.settings.confirmationTimeout),document.getElementById("input-max-retries").value=String(n.settings.maxRetries),document.getElementById("input-countdown").value=String(n.settings.finalSubmissionCountdown),document.getElementById("toggle-sound").checked=n.settings.enableSound,document.getElementById("toggle-notifications").checked=n.settings.enableNotifications,document.getElementById("toggle-debug").checked=n.settings.debugMode,document.getElementById("toggle-final-submit").checked=n.settings.enableFinalSubmission}}catch{}}var b;(b=document.getElementById("btn-open-mock"))==null||b.addEventListener("click",()=>{chrome.tabs.create({url:chrome.runtime.getURL("mock-irs/index.html")}).catch(()=>{alert("Cannot open mock IRS. Make sure mock-irs/index.html is included in the extension package.")})});function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}I();
//# sourceMappingURL=options.js.map
