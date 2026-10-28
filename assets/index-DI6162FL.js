(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function o(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=o(s);fetch(s.href,a)}})();function D(t){if(t.byteLength<4)return!1;const e=new Uint8Array(t.slice(0,12)),o=e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71,r=e[0]===255&&e[1]===216&&e[2]===255,s=e[0]===82&&e[1]===73&&e[2]===70&&e[3]===70&&e[8]===87&&e[9]===69&&e[10]===66&&e[11]===80,a=e[0]===71&&e[1]===73&&e[2]===70&&e[3]===56;return o||r||s||a}async function C(t){const e=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(e)).map(r=>r.toString(16).padStart(2,"0")).join("")}async function L(t,e=.96){const o=await t.arrayBuffer();if(!D(o))throw new Error("Arquivo inválido: Formato de imagem não suportado ou corrompido.");const r=await C(o),s=await createImageBitmap(new Blob([o])),a=s.width,n=s.height;let c=a,i=n;const d=1600;(a>d||n>d)&&(a>n?(c=d,i=Math.round(n*d/a)):(i=d,c=Math.round(a*d/n)));const h=document.createElement("canvas");h.width=c,h.height=i;const u=h.getContext("2d");if(!u)throw new Error("Falha ao inicializar contexto 2D do Canvas.");u.fillStyle="#FFFFFF",u.fillRect(0,0,c,i),u.drawImage(s,0,0,c,i);const x=await new Promise((B,M)=>{h.toBlob(E=>{E?B(E):M(new Error("Falha na codificação WebP do canvas."))},"image/webp",e)}),b=h.toDataURL("image/webp",e),g=320,m=Math.round(i*g/c),k=document.createElement("canvas");k.width=g,k.height=m;const w=k.getContext("2d");let I=b;return w&&(w.fillStyle="#FFFFFF",w.fillRect(0,0,g,m),w.drawImage(h,0,0,g,m),I=k.toDataURL("image/webp",.9)),{webpBlob:x,dataUrl:b,sha256:r,width:c,height:i,thumbDataUrl:I}}const A="BalcaoMangueirasDB",P=1,p={PRODUCTS:"products",OVERRIDES:"customOverrides",MEDIA:"mediaStore"};class q{dbPromise=null;getDB(){if(!this.dbPromise){try{typeof indexedDB<"u"&&indexedDB.deleteDatabase("BalcaoMiudezasDB")}catch{}this.dbPromise=new Promise((e,o)=>{const r=indexedDB.open(A,P);r.onupgradeneeded=s=>{const a=s.target.result;if(!a.objectStoreNames.contains(p.PRODUCTS)){const n=a.createObjectStore(p.PRODUCTS,{keyPath:"id"});n.createIndex("boxNumber","boxNumber",{unique:!1}),n.createIndex("internalCode","internalCode",{unique:!1}),n.createIndex("section","section",{unique:!1})}a.objectStoreNames.contains(p.OVERRIDES)||a.createObjectStore(p.OVERRIDES,{keyPath:"id"}),a.objectStoreNames.contains(p.MEDIA)||a.createObjectStore(p.MEDIA,{keyPath:"sha256"})},r.onsuccess=()=>e(r.result),r.onerror=()=>o(r.error)})}return this.dbPromise}async syncStaticCatalogUpdates(e){const o=await this.getDB(),r=await this.getAllFromStore(p.OVERRIDES),s=new Map(r.filter(i=>i.id.startsWith("mang_")||i.isCustom).map(i=>[i.id,i])),a=[];for(const i of e)if(s.has(i.id)){const d=s.get(i.id);a.push({...i,...d,images:Array.from(new Set([...d.images||[],...i.images||[]])),primaryImage:d.primaryImage||i.primaryImage,boxNumber:d.boxNumber||i.boxNumber,internalCode:d.internalCode||i.internalCode,description:d.description||i.description,isEdited:!0}),s.delete(i.id)}else a.push(i);for(const[,i]of s)i.isCustom&&a.push(i);const n=o.transaction(p.PRODUCTS,"readwrite"),c=n.objectStore(p.PRODUCTS);return c.clear(),await new Promise((i,d)=>{n.oncomplete=()=>i(),n.onerror=()=>d(n.error);for(const h of a)c.put(h)}),a}async saveProduct(e){const o=await this.getDB(),r={...e,isEdited:!0,updatedAt:new Date().toISOString()},s=o.transaction([p.PRODUCTS,p.OVERRIDES],"readwrite");return s.objectStore(p.PRODUCTS).put(r),s.objectStore(p.OVERRIDES).put(r),new Promise((a,n)=>{s.oncomplete=()=>a(),s.onerror=()=>n(s.error)})}async deleteProduct(e){const r=(await this.getDB()).transaction([p.PRODUCTS,p.OVERRIDES],"readwrite");return r.objectStore(p.PRODUCTS).delete(e),r.objectStore(p.OVERRIDES).delete(e),new Promise((s,a)=>{r.oncomplete=()=>s(),r.onerror=()=>a(r.error)})}async getAllProducts(){return this.getAllFromStore(p.PRODUCTS)}async saveLocalImage(e,o){const s=(await this.getDB()).transaction(p.MEDIA,"readwrite");return s.objectStore(p.MEDIA).put({sha256:e,dataUrl:o,createdAt:new Date().toISOString()}),new Promise((a,n)=>{s.oncomplete=()=>a(),s.onerror=()=>n(s.error)})}async getLocalImage(e){const a=(await this.getDB()).transaction(p.MEDIA,"readonly").objectStore(p.MEDIA).get(e);return new Promise((n,c)=>{a.onsuccess=()=>n(a.result?a.result.dataUrl:null),a.onerror=()=>c(a.error)})}async exportStoreBackup(){const e=await this.getAllProducts(),o=JSON.stringify(e),r=new TextEncoder,s=await C(r.encode(o).buffer),a={version:"1.0.0",exportedAt:new Date().toISOString(),checksum:s,productsCount:e.length,products:e};return JSON.stringify(a,null,2)}async importStoreBackup(e){try{const o=JSON.parse(e);if(!o.products||!Array.isArray(o.products))return{success:!1,count:0,error:"Arquivo de backup inválido: lista de produtos ausente."};const r=JSON.stringify(o.products),s=new TextEncoder,a=await C(s.encode(r).buffer);if(o.checksum&&o.checksum!==a)return{success:!1,count:0,error:"Checksum SHA-256 divergente: o arquivo de backup foi corrompido."};const c=(await this.getDB()).transaction([p.PRODUCTS,p.OVERRIDES],"readwrite"),i=c.objectStore(p.PRODUCTS),d=c.objectStore(p.OVERRIDES);for(const h of o.products)i.put(h),(h.isEdited||h.isCustom)&&d.put(h);return await new Promise((h,u)=>{c.oncomplete=()=>h(),c.onerror=()=>u(c.error)}),{success:!0,count:o.products.length}}catch(o){return{success:!1,count:0,error:o.message}}}async getAllFromStore(e){const a=(await this.getDB()).transaction(e,"readonly").objectStore(e).getAll();return new Promise((n,c)=>{a.onsuccess=()=>n(a.result),a.onerror=()=>c(a.error)})}}const v=new q;function f(t){return t?t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim():""}class j{indexedItems=[];constructor(e=[]){this.buildIndex(e)}buildIndex(e){this.indexedItems=e.map(o=>{const r=f(o.boxNumber),s=f(o.internalCode),a=s.replace(/\s+/g,""),n=(o.referenceCodes||[]).map(b=>f(b)),c=n.map(b=>b.replace(/\s+/g,"")),i=f(o.description),d=f(o.section),h=(o.manufacturers||[]).map(b=>f(b)),u=(o.technicalSpecs||[]).map(b=>f(b)),x=[r,`cx ${r}`,`caixa ${r}`,s,a,...n,...c,i,d,...h,...u].join(" ");return{item:o,normBox:r,normInternalCode:s,normInternalCodeNoDash:a,normRefs:n,normRefsNoDash:c,normDesc:i,normSection:d,normMfrs:h,searchIndex:x}})}search(e){const o=e.searchQuery.trim(),r=f(o),s=r.split(" ").filter(i=>i.length>0),a=s.length>0,n=r.replace(/^(cx|caixa)\s*/,""),c=[];for(const i of this.indexedItems){const{item:d}=i;if(e.selectedSection&&d.section!==e.selectedSection||e.selectedManufacturer&&!(d.manufacturers||[]).includes(e.selectedManufacturer))continue;if(e.visualStatus==="with-photo"){if(!d.primaryImage&&(!d.images||d.images.length===0))continue}else if(e.visualStatus==="without-photo"){if(d.primaryImage||d.images&&d.images.length>0)continue}else if(e.visualStatus==="visual-only"&&!d.needsDescriptionReview)continue;if(!a){c.push({item:d,score:1});continue}let h=!0,u=0;for(const b of s)if(!i.searchIndex.includes(b)){h=!1;break}if(!h)continue;n&&i.normBox===n?u+=5e3:n&&i.normBox.startsWith(n)&&(u+=2500);const x=r.replace(/\s+/g,"");i.normInternalCodeNoDash&&i.normInternalCodeNoDash===x?u+=4e3:i.normInternalCodeNoDash&&i.normInternalCodeNoDash.includes(x)&&(u+=2e3);for(const b of i.normRefsNoDash)if(b===x){u+=3e3;break}else if(b.includes(x)){u+=1500;break}i.normDesc.includes(r)&&(u+=1e3),c.push({item:d,score:u})}return a?c.sort((i,d)=>d.score-i.score):e.sortBy==="box"?c.sort((i,d)=>(i.item.boxNumber||"").localeCompare(d.item.boxNumber||"",void 0,{numeric:!0})):e.sortBy==="code"?c.sort((i,d)=>(i.item.internalCode||"").localeCompare(d.item.internalCode||"")):e.sortBy==="description"?c.sort((i,d)=>i.item.cleanDescription.localeCompare(d.item.cleanDescription)):e.sortBy==="section"&&c.sort((i,d)=>i.item.section.localeCompare(d.item.section)),c.map(i=>i.item)}}const l={search:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `,box:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  `,tag:(t="w-4 h-4")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  `,camera:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  `,edit:(t="w-4 h-4")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `,copy:(t="w-3.5 h-3.5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `,check:(t="w-4 h-4")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `,zoomIn:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  `,zoomOut:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  `,close:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `,sun:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  `,moon:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `,grid:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `,layoutGrid:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  `,eye:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,eyeOff:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `,plus:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `,trash:(t="w-4 h-4")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `,download:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `,upload:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  `,printer:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  `,alertTriangle:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  `,shieldCheck:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  `,copySuccess:(t="w-3.5 h-3.5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t} text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `,chevronDown:(t="w-4 h-4")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,rotateCw:(t="w-5 h-5")=>`
    <svg xmlns="http://www.w3.org/2000/svg" class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
  `};function T(t,e,o,r){const s=document.createElement("header");s.className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 select-none",s.innerHTML=`
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Identificação do Balcão e Contador -->
      <div class="flex items-center justify-between w-full md:w-auto gap-3">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-blue-600 text-white rounded-xl shadow-md">
            ${l.box("w-6 h-6")}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                CATÁLOGO DE MANGUEIRAS
              </h1>
              <span class="bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                Offline-First
              </span>
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Localizador Visual de Caixas & Mangueiras de Balcão
            </span>
          </div>
        </div>

        <div class="md:hidden flex items-center gap-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          <span class="text-blue-600 dark:text-blue-400">${o}</span>/${e}
        </div>
      </div>

      <!-- Barra de Busca Omnibox (< 50ms) -->
      <div class="relative flex-1 w-full max-w-2xl">
        <div class="relative flex items-center">
          <span class="absolute left-3.5 text-slate-400">
            ${l.search("w-5 h-5")}
          </span>
          <input
            type="text"
            id="omnibox-search"
            value="${t.searchQuery}"
            placeholder="Digite Caixa (ex: 384, 412, 16), Código (21926-9, 15050-0), Veículo (Palio, Gol, Opala)... (Pressione /)"
            class="w-full pl-11 pr-20 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold text-sm placeholder:text-slate-400 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none shadow-inner transition-all"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="absolute right-2.5 flex items-center gap-1">
            ${t.searchQuery?`
              <button id="btn-clear-search" class="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Limpar busca">
                ${l.close("w-4 h-4")}
              </button>
            `:`
              <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 shadow-xs">
                /
              </kbd>
            `}
          </div>
        </div>
      </div>

      <!-- Ações da Barra Superior -->
      <div class="flex items-center justify-between w-full md:w-auto gap-2">
        <div class="hidden md:flex items-center gap-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span class="text-blue-600 dark:text-blue-400 font-black">${o}</span>
          <span class="text-slate-400">/</span>
          <span>${e} peças</span>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Toggle Modo Visual Mural vs Grade -->
          <button id="btn-toggle-view" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-bold shadow-xs" title="${t.viewMode==="grid"?"Mudar para Mural Visual (Fotos Grandes para Comparar Amostra)":"Mudar para Grade Detalhada de Balcão"}">
            ${t.viewMode==="grid"?l.layoutGrid("w-4 h-4 text-blue-600 dark:text-blue-400"):l.grid("w-4 h-4 text-emerald-600 dark:text-emerald-400")}
            <span class="hidden sm:inline">${t.viewMode==="grid"?"Grade":"Mural Visual"}</span>
          </button>

          <!-- Toggle Ocultar/Mostrar Preços -->
          <button id="btn-toggle-prices" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="${t.hidePrices?"Mostrar Preços":"Ocultar Preços (Modo Cliente na Frente)"}">
            ${t.hidePrices?l.eyeOff("w-4 h-4 text-amber-500"):l.eye("w-4 h-4 text-slate-600 dark:text-slate-300")}
          </button>

          <!-- Toggle Dark / Daylight Mode -->
          <button id="btn-toggle-theme" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="Alternar Modo Claro (Daylight Counter) / Escuro">
            <span class="dark:hidden">${l.moon("w-4 h-4")}</span>
            <span class="hidden dark:inline">${l.sun("w-4 h-4")}</span>
          </button>

          <!-- Cadastrar Novo Produto -->
          <button id="btn-new-product" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors">
            ${l.plus("w-4 h-4")}
            <span class="hidden sm:inline">Nova Peça</span>
          </button>

          <!-- Menu de Opções / Backup -->
          <div class="relative group">
            <button id="btn-more-options" class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs" title="Opções, Backup e Relatórios">
              ${l.chevronDown("w-4 h-4")}
            </button>
            <div class="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 hidden group-hover:block hover:block z-40">
              <button id="opt-export-backup" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                ${l.download("w-4 h-4 text-blue-500")}
                <span>Exportar Backup (SHA-256)</span>
              </button>
              <label class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                ${l.upload("w-4 h-4 text-emerald-500")}
                <span>Restaurar Backup</span>
                <input type="file" id="inp-import-file" accept=".json" class="hidden" />
              </label>
              <div class="border-t border-slate-100 dark:border-slate-700 my-1"></div>
              <button id="opt-print-map" class="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                ${l.printer("w-4 h-4 text-amber-500")}
                <span>Imprimir Mapa de Caixas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;const a=s.querySelector("#omnibox-search");a?.addEventListener("input",()=>{r.onSearch(a.value)}),s.querySelector("#btn-clear-search")?.addEventListener("click",()=>{a&&(a.value="",r.onSearch(""),a.focus())}),s.querySelector("#btn-toggle-view")?.addEventListener("click",()=>r.onToggleViewMode()),s.querySelector("#btn-toggle-prices")?.addEventListener("click",()=>r.onToggleHidePrices()),s.querySelector("#btn-toggle-theme")?.addEventListener("click",()=>r.onToggleDarkMode()),s.querySelector("#btn-new-product")?.addEventListener("click",()=>r.onNewProduct()),s.querySelector("#opt-export-backup")?.addEventListener("click",()=>r.onExportBackup()),s.querySelector("#opt-print-map")?.addEventListener("click",()=>r.onPrintBoxMap());const n=s.querySelector("#inp-import-file");return n?.addEventListener("change",()=>{n.files&&n.files[0]&&(r.onImportBackup(n.files[0]),n.value="")}),s}function S(t){return t?/^(data:|blob:|https?:|\.\/|\.\.\/)/i.test(t)?t:t.startsWith("/catalog-images/")?"."+t:t.startsWith("catalog-images/")?"./"+t:t.startsWith("/data/")?"."+t:t.startsWith("data/")?"./"+t:t.startsWith("/")?"."+t:"./"+t:""}const y=["Radiador Superior","Radiador Inferior","Radiador (Geral)","Bomba D'Água","Filtro de Ar","Respiro de Óleo / Antichama","Aquecedor (Ar Quente)","Reservatório de Expansão","Bocal do Tanque / Combustível","Coletor de Admissão","Cavalete / Termostato","Direção Hidráulica","Outras Mangueiras"],$=["Fiat","Ford","GM","VW","Hyundai","Toyota","Renault","Peugeot/Citroën","Universal"];class R{container=null;currentItem=null;currentImages=[];onSaveCallback=null;constructor(){this.createDom()}createDom(){this.container=document.createElement("div"),this.container.id="product-form-modal",this.container.className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm hidden p-4 overflow-y-auto",this.container.innerHTML=`
      <div class="relative w-full max-w-3xl bg-white dark:bg-counter-darkCard rounded-2xl shadow-2xl border border-slate-200 dark:border-counter-darkBorder overflow-hidden my-8">
        <!-- Cabeçalho do Modal -->
        <div class="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b-2 border-amber-500">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500 text-slate-950 rounded-lg">
              ${l.box("w-6 h-6")}
            </div>
            <div>
              <h2 id="modal-title" class="text-lg font-black tracking-tight leading-none text-white">Editar Peça</h2>
              <span class="text-xs text-slate-400 font-mono mt-0.5 block" id="modal-subtitle">Atualize localização, códigos e fotos</span>
            </div>
          </div>
          <button id="modal-close" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            ${l.close("w-5 h-5")}
          </button>
        </div>

        <!-- Formulário -->
        <form id="product-form" class="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          <!-- Linha 1: Localização de Balcão e Códigos -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Caixa -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                ${l.box("w-4 h-4")} Número da Caixa *
              </label>
              <input type="text" id="inp-box" required placeholder="Ex: 940, 10309, 1048B" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 font-mono font-black text-xl focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <!-- Código Interno -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                ${l.tag("w-4 h-4")} Código Interno
              </label>
              <input type="text" id="inp-code" placeholder="Ex: MU392, LT-2340, 526GR" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <!-- Categoria / Seção -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Categoria / Seção *
              </label>
              <select id="sel-section" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                ${y.map(e=>`<option value="${e}">${e}</option>`).join("")}
              </select>
            </div>
          </div>

          <!-- Linha 2: Descrição da Peça -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Descrição e Aplicação da Peça *
            </label>
            <textarea id="inp-desc" rows="2" required placeholder="Ex: GRAMPO SUPERIOR BAGAGITO C3/C4" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
          </div>

          <!-- Linha 3: Códigos de Referência e Montadoras -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Códigos de Referência -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Códigos de Referência (separados por vírgula)
              </label>
              <input type="text" id="inp-refs" placeholder="Ex: P-185, LF0437, JAHU 08271-9" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <!-- Preço e Estoque Opcionais -->
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Preço Balcão (R$)
                </label>
                <input type="number" step="0.01" min="0" id="inp-price" placeholder="0.00" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Qtd. Estoque
                </label>
                <input type="number" min="0" id="inp-stock" placeholder="0" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <!-- Montadoras Selecionadas -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Montadoras Relacionadas
            </label>
            <div class="flex flex-wrap gap-1.5" id="mfr-checkboxes">
              ${$.map(e=>`
                <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold cursor-pointer select-none hover:bg-slate-100">
                  <input type="checkbox" name="mfr" value="${e}" class="rounded text-blue-600 focus:ring-0" />
                  <span>${e}</span>
                </label>
              `).join("")}
            </div>
          </div>

          <!-- Galeria de Fotos Multi-Ângulo + Ctrl+V -->
          <div class="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                ${l.camera("w-4 h-4 text-blue-600")} Fotos da Peça (Multi-Ângulos & Ctrl+V)
              </label>
              <span class="text-[11px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                Dica: Tire print e aperte Ctrl+V para colar aqui!
              </span>
            </div>

            <!-- Área de Upload / Colar com Ctrl+V -->
            <div id="drop-zone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-colors">
              <div class="flex flex-col items-center gap-1 text-slate-500">
                ${l.upload("w-8 h-8 text-slate-400")}
                <p class="text-xs font-medium">
                  <span class="text-blue-600 dark:text-blue-400 font-bold">Clique para enviar</span>, arraste uma foto ou pressione <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 font-mono text-[11px] rounded font-bold">Ctrl+V</kbd>
                </p>
                <span class="text-[10px] text-slate-400">Conversão automática para WebP Ultra Nitidez (Quality 0.96)</span>
              </div>
              <input type="file" id="file-input" accept="image/*" class="hidden" multiple />
            </div>

            <!-- Grade de Imagens Cadastradas -->
            <div id="image-gallery-preview" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2"></div>
          </div>
        </form>

        <!-- Barra Inferior de Ações -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button type="button" id="btn-duplicate" class="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors">
              ${l.copy("w-4 h-4")} Duplicar Peça
            </button>
            <button type="button" id="btn-delete" class="px-3 py-2 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors hidden">
              ${l.trash("w-4 h-4")} Excluir
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" id="btn-cancel" class="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="button" id="btn-save" class="px-5 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-colors">
              ${l.check("w-4 h-4")} Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.container),this.bindEvents()}bindEvents(){if(!this.container)return;this.container.querySelector("#modal-close")?.addEventListener("click",()=>this.close()),this.container.querySelector("#btn-cancel")?.addEventListener("click",()=>this.close()),this.container.querySelector("#btn-save")?.addEventListener("click",()=>this.handleSave()),this.container.querySelector("#btn-duplicate")?.addEventListener("click",()=>this.handleDuplicate()),this.container.querySelector("#btn-delete")?.addEventListener("click",()=>this.handleDelete());const e=this.container.querySelector("#drop-zone"),o=this.container.querySelector("#file-input");e?.addEventListener("click",()=>o?.click()),o?.addEventListener("change",async()=>{if(o.files){for(let r=0;r<o.files.length;r++)await this.processAndAddImage(o.files[r]);o.value=""}}),e?.addEventListener("dragover",r=>{r.preventDefault(),e.classList.add("border-blue-500","bg-blue-50/20")}),e?.addEventListener("dragleave",()=>{e.classList.remove("border-blue-500","bg-blue-50/20")}),e?.addEventListener("drop",async r=>{r.preventDefault(),e.classList.remove("border-blue-500","bg-blue-50/20");const s=r.dataTransfer?.files;if(s)for(let a=0;a<s.length;a++)await this.processAndAddImage(s[a])}),window.addEventListener("paste",async r=>{if(!this.container||this.container.classList.contains("hidden"))return;const s=r.clipboardData?.items;if(s){for(let a=0;a<s.length;a++)if(s[a].type.startsWith("image/")){const n=s[a].getAsFile();n&&(r.preventDefault(),await this.processAndAddImage(n))}}})}async processAndAddImage(e){try{const o=await L(e,.96);await v.saveLocalImage(o.sha256,o.dataUrl),this.currentImages.push(o.dataUrl),this.renderGalleryPreview()}catch(o){alert(`Erro ao processar imagem: ${o.message}`)}}renderGalleryPreview(){const e=this.container?.querySelector("#image-gallery-preview");if(e){if(this.currentImages.length===0){e.innerHTML='<span class="text-xs text-slate-400 col-span-full">Nenhuma foto adicionada.</span>';return}e.innerHTML=this.currentImages.map((o,r)=>`
      <div class="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-1 overflow-hidden">
        <img src="${S(o)}" class="w-full h-full object-contain" alt="Foto ${r+1}" />
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <button type="button" class="btn-del-img p-1 rounded bg-red-600 text-white" data-index="${r}" title="Remover Foto">
            ${l.trash("w-3.5 h-3.5")}
          </button>
        </div>
        ${r===0?`
          <span class="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1 rounded">Principal</span>
        `:""}
      </div>
    `).join(""),e.querySelectorAll(".btn-del-img").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const s=parseInt(o.getAttribute("data-index")||"0",10);this.currentImages.splice(s,1),this.renderGalleryPreview()})})}}open(e,o){if(!this.container)return;this.currentItem=e,this.onSaveCallback=o,this.currentImages=e?.images?[...e.images]:[];const r=this.container.querySelector("#modal-title"),s=this.container.querySelector("#btn-delete");e?(r&&(r.textContent="Editar Peça de Balcão"),s?.classList.toggle("hidden",!e.isCustom),this.populateFields(e)):(r&&(r.textContent="Nova Peça de Balcão"),s?.classList.add("hidden"),this.resetFields()),this.renderGalleryPreview(),this.container.classList.remove("hidden")}close(){this.container&&(this.container.classList.add("hidden"),this.currentItem=null,this.currentImages=[])}populateFields(e){if(!this.container)return;this.container.querySelector("#inp-box").value=e.boxNumber||"",this.container.querySelector("#inp-code").value=e.internalCode||"",this.container.querySelector("#sel-section").value=e.section||y[0],this.container.querySelector("#inp-desc").value=e.cleanDescription||e.description||"",this.container.querySelector("#inp-refs").value=(e.referenceCodes||[]).join(", "),this.container.querySelector("#inp-price").value=e.price!==null?e.price.toString():"",this.container.querySelector("#inp-stock").value=e.stockQty!==null?e.stockQty.toString():"",this.container.querySelectorAll('input[name="mfr"]').forEach(r=>{r.checked=(e.manufacturers||[]).includes(r.value)})}resetFields(){if(!this.container)return;this.container.querySelector("#inp-box").value="",this.container.querySelector("#inp-code").value="",this.container.querySelector("#sel-section").value=y[0],this.container.querySelector("#inp-desc").value="",this.container.querySelector("#inp-refs").value="",this.container.querySelector("#inp-price").value="",this.container.querySelector("#inp-stock").value="",this.container.querySelectorAll('input[name="mfr"]').forEach(o=>{o.checked=o.value==="Universal"})}async handleSave(){if(!this.container)return;const e=this.container.querySelector("#inp-box"),o=this.container.querySelector("#inp-desc");if(!e.value.trim()&&!o.value.trim()&&this.currentImages.length===0){alert("Informe ao menos a Caixa, a Descrição ou anexe uma Foto.");return}const r=this.container.querySelector("#inp-code"),s=this.container.querySelector("#sel-section"),a=this.container.querySelector("#inp-refs"),n=this.container.querySelector("#inp-price"),c=this.container.querySelector("#inp-stock"),i=[];this.container.querySelectorAll('input[name="mfr"]:checked').forEach(m=>{i.push(m.value)}),i.length===0&&i.push("Universal");const d=a.value.split(",").map(m=>m.trim()).filter(m=>m.length>0),h=n.value?parseFloat(n.value):null,u=c.value?parseInt(c.value,10):null,x=new Date().toISOString(),g={id:this.currentItem?this.currentItem.id:`custom_${Date.now()}`,catalogSource:this.currentItem?this.currentItem.catalogSource:"Manual Balcão",section:s.value,boxNumber:e.value.trim(),internalCode:r.value.trim(),referenceCodes:d,description:o.value.trim(),cleanDescription:o.value.trim(),manufacturers:i,technicalSpecs:this.currentItem?.technicalSpecs||[],images:this.currentImages,primaryImage:this.currentImages.length>0?this.currentImages[0]:null,needsDescriptionReview:!1,price:h,stockQty:u,searchTokens:[],createdAt:this.currentItem?this.currentItem.createdAt:x,updatedAt:x,isCustom:this.currentItem?this.currentItem.isCustom:!0,isEdited:!0};await v.saveProduct(g),this.onSaveCallback&&this.onSaveCallback(g),this.close()}handleDuplicate(){if(!this.container)return;const e=this.container.querySelector("#inp-desc");e.value=`${e.value.trim()} (Cópia)`,this.currentItem=null;const o=this.container.querySelector("#modal-title");o&&(o.textContent="Nova Peça (Duplicada)")}async handleDelete(){!this.currentItem||!confirm("Tem certeza que deseja excluir esta peça?")||(await v.deleteProduct(this.currentItem.id),this.onSaveCallback&&this.onSaveCallback(this.currentItem),this.close())}}function O(t,e,o){const r=document.createElement("div");r.className="bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs select-none backdrop-blur-sm";const s=t.selectedSection||t.selectedManufacturer||t.visualStatus!=="all";r.innerHTML=`
    <div class="max-w-7xl mx-auto flex flex-col gap-2.5">
      <!-- Linha 1: Filtro de Seções (Carrossel Horizontal de Pills com contagem) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">Seções:</span>
        <button class="btn-filter-section shrink-0 px-3 py-1 rounded-full font-bold transition-colors ${t.selectedSection?"bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700":"bg-blue-600 text-white shadow-xs"}" data-section="">
          Todas
        </button>
        ${y.map(n=>{const c=e[n]||0,i=t.selectedSection===n;return`
            <button class="btn-filter-section shrink-0 px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1.5 ${i?"bg-blue-600 text-white shadow-xs":"bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}" data-section="${n}">
              <span>${n}</span>
              <span class="font-mono text-[10px] px-1.5 py-0.2 rounded-full ${i?"bg-blue-800 text-white":"bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}">
                ${c}
              </span>
            </button>
          `}).join("")}
      </div>

      <!-- Linha 2: Montadoras, Status Visual e Ordenação -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <!-- Montadoras -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span class="font-bold text-slate-400 uppercase tracking-wider text-[10px] shrink-0">Montadora:</span>
          <button class="btn-filter-mfr px-2.5 py-0.5 rounded-lg font-semibold transition-colors ${t.selectedManufacturer?"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200":"bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"}" data-mfr="">
            Todas
          </button>
          ${$.map(n=>`
            <button class="btn-filter-mfr px-2.5 py-0.5 rounded-lg font-semibold transition-colors shrink-0 ${t.selectedManufacturer===n?"bg-blue-600 text-white":"bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"}" data-mfr="${n}">
              ${n}
            </button>
          `).join("")}
        </div>

        <!-- Status Visual e Ordenação -->
        <div class="flex items-center gap-2 ml-auto">
          <!-- Filtro de Status Visual -->
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${t.visualStatus==="all"?"bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs":"text-slate-600 dark:text-slate-400"}" data-status="all">
              Todos
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${t.visualStatus==="with-photo"?"bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs":"text-slate-600 dark:text-slate-400"}" data-status="with-photo">
              Com Foto
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${t.visualStatus==="without-photo"?"bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs":"text-slate-600 dark:text-slate-400"}" data-status="without-photo">
              Sem Foto
            </button>
            <button class="btn-visual-status px-2 py-0.5 rounded-md font-semibold transition-colors ${t.visualStatus==="visual-only"?"bg-amber-500 text-slate-950 font-bold shadow-xs":"text-slate-600 dark:text-slate-400"}" data-status="visual-only" title="Itens que possuem apenas Foto e Caixa para revisar">
              Foto+Caixa (Revisar)
            </button>
          </div>

          <!-- Ordenação -->
          <div class="flex items-center gap-1">
            <select id="sel-sort-by" class="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold outline-none text-xs">
              <option value="box" ${t.sortBy==="box"?"selected":""}>Ordenar: Caixa</option>
              <option value="code" ${t.sortBy==="code"?"selected":""}>Ordenar: Cód. Interno</option>
              <option value="description" ${t.sortBy==="description"?"selected":""}>Ordenar: Descrição</option>
              <option value="section" ${t.sortBy==="section"?"selected":""}>Ordenar: Seção</option>
            </select>
          </div>

          ${s?`
            <button id="btn-clear-filters" class="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 transition-colors flex items-center gap-1" title="Limpar todos os filtros">
              ${l.close("w-3.5 h-3.5")}
              <span>Limpar</span>
            </button>
          `:""}
        </div>
      </div>
    </div>
  `,r.querySelectorAll(".btn-filter-section").forEach(n=>{n.addEventListener("click",()=>{const c=n.getAttribute("data-section")||"";o.onSelectSection(c)})}),r.querySelectorAll(".btn-filter-mfr").forEach(n=>{n.addEventListener("click",()=>{const c=n.getAttribute("data-mfr")||"";o.onSelectManufacturer(c)})}),r.querySelectorAll(".btn-visual-status").forEach(n=>{n.addEventListener("click",()=>{const c=n.getAttribute("data-status")||"all";o.onSelectVisualStatus(c)})});const a=r.querySelector("#sel-sort-by");return a?.addEventListener("change",()=>{o.onSelectSortBy(a.value)}),r.querySelector("#btn-clear-filters")?.addEventListener("click",()=>{o.onClearAllFilters()}),r}function F(t,e,o,r){const s=document.createElement("article");if(s.className="group relative flex flex-col rounded-xl border transition-all duration-150 ",e==="mural"){s.className+="bg-white dark:bg-counter-darkCard border-slate-200 dark:border-counter-darkBorder hover:border-counter-blue dark:hover:border-blue-500 hover:shadow-md overflow-hidden";const u=t.primaryImage||(t.images&&t.images.length>0?t.images[0]:null),x=t.boxNumber?t.boxNumber:"S/ CAIXA",b=t.internalCode?t.internalCode:"";return s.innerHTML=`
      <!-- Imagem Ampliada do Mural -->
      <div class="relative w-full aspect-square bg-white flex items-center justify-center p-3 cursor-zoom-in overflow-hidden border-b border-slate-100 dark:border-slate-800">
        ${u?`
          <img src="${S(u)}" alt="${t.cleanDescription}" loading="lazy" class="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200" />
        `:`
          <div class="flex flex-col items-center justify-center text-slate-400 text-xs">
            ${l.camera("w-10 h-10 mb-1 text-slate-300")}
            <span>Sem Foto</span>
          </div>
        `}

        ${t.images&&t.images.length>1?`
          <span class="absolute top-2 right-2 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            +${t.images.length-1} fotos
          </span>
        `:""}

        ${t.needsDescriptionReview?`
          <span class="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded shadow flex items-center gap-1">
            ${l.alertTriangle("w-3 h-3")} Revisar
          </span>
        `:""}
      </div>

      <!-- Rodapé de Localização Imediata -->
      <div class="p-2.5 flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-900/60 flex-1 justify-between">
        <div class="flex items-center justify-between gap-1">
          <div class="bg-blue-600 text-white font-mono font-black text-lg px-2 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer hover:bg-blue-700" title="Clique para filtrar esta caixa">
            ${l.box("w-4 h-4")}
            <span>${x}</span>
          </div>
          ${b?`
            <span class="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-mono font-bold text-xs px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
              ${b}
            </span>
          `:""}
        </div>

        <p class="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
          ${t.cleanDescription}
        </p>

        <div class="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <span class="truncate max-w-[120px] font-semibold text-slate-600 dark:text-slate-400">${t.section}</span>
          <button class="btn-edit text-slate-500 hover:text-blue-600 p-1 rounded" title="Editar / Adicionar fotos">
            ${l.edit("w-3.5 h-3.5")}
          </button>
        </div>
      </div>
    `,s.querySelector(".cursor-zoom-in")?.addEventListener("click",()=>r.onZoom(t,0)),s.querySelector(".bg-blue-600")?.addEventListener("click",()=>{t.boxNumber&&r.onBoxClick&&r.onBoxClick(t.boxNumber)}),s.querySelector(".btn-edit")?.addEventListener("click",w=>{w.stopPropagation(),r.onEdit(t)}),s}s.className+="bg-white dark:bg-counter-darkCard border-slate-200 dark:border-counter-darkBorder hover:border-counter-blue dark:hover:border-blue-500 hover:shadow-lg";const a=t.primaryImage||(t.images&&t.images.length>0?t.images[0]:null),n=t.boxNumber?t.boxNumber:"NÃO DEFINIDA";return s.innerHTML=`
    <!-- Topo: BADGE GIGANTE DA CAIXA (Quality Gate 1 - Alto Contraste Industrial) -->
    <div class="p-3 bg-slate-900 text-white rounded-t-xl flex items-center justify-between border-b-2 border-amber-500">
      <div class="flex items-center gap-2 cursor-pointer hover:opacity-90" title="Filtrar por esta caixa">
        ${l.box("w-6 h-6 text-amber-400")}
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-none">LOCALIZAÇÃO BALCÃO</span>
          <span class="font-mono text-2xl font-black text-amber-400 tracking-tight leading-none">${n}</span>
        </div>
      </div>

      ${t.internalCode?`
        <div class="text-right">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block leading-none">CÓD. INTERNO</span>
          <span class="font-mono text-lg font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 leading-none inline-block mt-0.5">
            ${t.internalCode}
          </span>
        </div>
      `:""}
    </div>

    <!-- Corpo: Foto e Informações Técnicas -->
    <div class="p-3.5 flex flex-col gap-3 flex-1">
      <!-- Imagem Central com Zoom -->
      <div class="relative w-full h-48 bg-white rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 cursor-zoom-in group/img overflow-hidden">
        ${a?`
          <img src="${S(a)}" alt="${t.cleanDescription}" loading="lazy" class="w-full h-full object-contain filter drop-shadow-sm group-hover/img:scale-105 transition-transform duration-200" />
        `:`
          <div class="flex flex-col items-center justify-center text-slate-400 text-xs">
            ${l.camera("w-12 h-12 mb-1.5 text-slate-300")}
            <span class="font-medium">Sem Foto Cadastrada</span>
          </div>
        `}

        ${t.images&&t.images.length>1?`
          <span class="absolute bottom-2 right-2 bg-slate-900/80 text-white font-mono text-xs font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
            ${l.camera("w-3.5 h-3.5")} ${t.images.length} fotos
          </span>
        `:""}

        ${t.needsDescriptionReview?`
          <div class="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded shadow flex items-center gap-1">
            ${l.alertTriangle("w-3.5 h-3.5")} Foto Sem Descrição
          </div>
        `:""}

        <button class="btn-zoom-overlay absolute top-2 right-2 p-1.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 opacity-0 group-hover/img:opacity-100 transition-opacity shadow" title="Ampliar Foto">
          ${l.zoomIn("w-4 h-4")}
        </button>
      </div>

      <!-- Descrição da Peça -->
      <div>
        <span class="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
          ${t.section}
        </span>
        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
          ${t.cleanDescription}
        </h3>
      </div>

      <!-- Códigos de Referência / Fabricante com Botão Copiar -->
      ${t.referenceCodes&&t.referenceCodes.length>0?`
        <div class="flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] font-bold text-slate-400">Refs:</span>
          ${t.referenceCodes.map(u=>`
            <button class="btn-copy-ref font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors" data-ref="${u}" title="Clique para copiar">
              <span>${u}</span>
              ${l.copy("w-3 h-3 text-slate-400")}
            </button>
          `).join("")}
        </div>
      `:""}

      <!-- Montadoras e Especificações -->
      <div class="flex flex-wrap gap-1 items-center mt-auto">
        ${(t.manufacturers||[]).map(u=>`
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ${u}
          </span>
        `).join("")}

        ${(t.technicalSpecs||[]).map(u=>`
          <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            ${u}
          </span>
        `).join("")}
      </div>
    </div>

    <!-- Barra de Rodapé do Card -->
    <div class="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-b-xl">
      <!-- Preço se disponível e não oculto -->
      <div>
        ${!o&&t.price!==null?`
          <span class="text-[10px] uppercase font-bold text-slate-400 block leading-none">PREÇO BALCÃO</span>
          <span class="font-mono text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">
            R$ ${t.price.toFixed(2)}
          </span>
        `:`
          <span class="text-xs text-slate-400 font-mono">
            ${t.stockQty!==null?`Estoque: ${t.stockQty}`:"Uso Interno"}
          </span>
        `}
      </div>

      <div class="flex items-center gap-1">
        <button class="btn-card-edit px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1 shadow-sm">
          ${l.edit("w-3.5 h-3.5")}
          <span>Editar</span>
        </button>
      </div>
    </div>
  `,s.querySelector(".cursor-zoom-in")?.addEventListener("click",()=>r.onZoom(t,0)),s.querySelector(".text-amber-400")?.parentElement?.addEventListener("click",()=>{t.boxNumber&&r.onBoxClick&&r.onBoxClick(t.boxNumber)}),s.querySelector(".btn-card-edit")?.addEventListener("click",()=>r.onEdit(t)),s.querySelectorAll(".btn-copy-ref").forEach(u=>{u.addEventListener("click",async x=>{x.stopPropagation();const b=u.getAttribute("data-ref");if(b){await navigator.clipboard.writeText(b);const g=u.innerHTML;u.innerHTML=`<span>${b}</span> ${l.copySuccess("w-3 h-3")}`,setTimeout(()=>{u.innerHTML=g},1500)}})}),s}class N{container=null;currentItem=null;currentImageIndex=0;currentZoom=1;currentRotation=0;constructor(){this.createDom()}createDom(){this.container=document.createElement("div"),this.container.id="lightbox-modal",this.container.className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-200 hidden select-none",this.container.innerHTML=`
      <!-- Barra Superior com Ações -->
      <div class="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10">
        <div class="flex items-center gap-3">
          <div class="bg-amber-500 text-slate-950 font-mono font-black text-sm px-2.5 py-1 rounded shadow" id="lb-box-badge">
            CAIXA
          </div>
          <span class="font-bold text-sm text-slate-100 max-w-md truncate" id="lb-title">Título</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Controles de Zoom -->
          <button id="lb-zoom-out" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Diminuir Zoom">
            ${l.zoomOut("w-5 h-5")}
          </button>
          <span id="lb-zoom-level" class="font-mono text-xs font-bold w-12 text-center text-slate-300">100%</span>
          <button id="lb-zoom-in" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Aumentar Zoom (até 400%)">
            ${l.zoomIn("w-5 h-5")}
          </button>
          <button id="lb-rotate" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Girar 90°">
            ${l.rotateCw("w-5 h-5")}
          </button>
          <button id="lb-close" class="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors ml-2" title="Fechar (Esc)">
            ${l.close("w-5 h-5")}
          </button>
        </div>
      </div>

      <!-- Área Central da Imagem -->
      <div class="relative w-full h-full flex items-center justify-center p-8 overflow-hidden" id="lb-stage">
        <img id="lb-image" src="" alt="Peça ampliada" class="max-h-[85vh] max-w-[85vw] object-contain transition-transform duration-100 filter drop-shadow-2xl cursor-grab" />
      </div>

      <!-- Navegação Entre Ângulos (se houver mais de uma foto) -->
      <button id="lb-prev" class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors hidden shadow-lg" title="Foto Anterior (Seta Esquerda)">
        ${l.copy("w-6 h-6 rotate-180")}
      </button>
      <button id="lb-next" class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors hidden shadow-lg" title="Próxima Foto (Seta Direita)">
        ${l.copy("w-6 h-6")}
      </button>

      <!-- Contador de Fotos Inferior -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white font-mono text-xs font-semibold" id="lb-counter">
        1 / 1
      </div>
    `,document.body.appendChild(this.container),this.bindEvents()}bindEvents(){this.container&&(this.container.querySelector("#lb-close")?.addEventListener("click",()=>this.close()),this.container.querySelector("#lb-zoom-in")?.addEventListener("click",()=>this.setZoom(this.currentZoom+.5)),this.container.querySelector("#lb-zoom-out")?.addEventListener("click",()=>this.setZoom(this.currentZoom-.5)),this.container.querySelector("#lb-rotate")?.addEventListener("click",()=>{this.currentRotation=(this.currentRotation+90)%360,this.updateTransform()}),this.container.querySelector("#lb-prev")?.addEventListener("click",()=>this.navigate(-1)),this.container.querySelector("#lb-next")?.addEventListener("click",()=>this.navigate(1)),this.container.querySelector("#lb-stage")?.addEventListener("click",e=>{e.target===e.currentTarget&&this.close()}),window.addEventListener("keydown",e=>{!this.container||this.container.classList.contains("hidden")||(e.key==="Escape"?this.close():e.key==="ArrowLeft"?this.navigate(-1):e.key==="ArrowRight"&&this.navigate(1))}))}open(e,o=0){if(!this.container)return;this.currentItem=e,this.currentImageIndex=o,this.currentZoom=1,this.currentRotation=0;const r=this.container.querySelector("#lb-box-badge");r&&(r.textContent=e.boxNumber?`CAIXA ${e.boxNumber}`:"SEM CAIXA");const s=this.container.querySelector("#lb-title");s&&(s.textContent=e.cleanDescription),this.updateImage(),this.container.classList.remove("hidden")}close(){this.container&&(this.container.classList.add("hidden"),this.currentItem=null)}navigate(e){if(!this.currentItem||!this.currentItem.images||this.currentItem.images.length<=1)return;const o=this.currentItem.images.length;this.currentImageIndex=(this.currentImageIndex+e+o)%o,this.currentZoom=1,this.updateImage()}updateImage(){if(!this.container||!this.currentItem)return;const e=this.currentItem.images||[],o=e[this.currentImageIndex]||this.currentItem.primaryImage||"",r=this.container.querySelector("#lb-image");r&&(r.src=S(o));const s=this.container.querySelector("#lb-prev"),a=this.container.querySelector("#lb-next"),n=this.container.querySelector("#lb-counter");e.length>1?(s?.classList.remove("hidden"),a?.classList.remove("hidden"),n&&(n.textContent=`${this.currentImageIndex+1} / ${e.length}`)):(s?.classList.add("hidden"),a?.classList.add("hidden"),n&&(n.textContent="1 / 1")),this.updateTransform()}setZoom(e){this.currentZoom=Math.min(4,Math.max(.5,e));const o=this.container?.querySelector("#lb-zoom-level");o&&(o.textContent=`${Math.round(this.currentZoom*100)}%`),this.updateTransform()}updateTransform(){const e=this.container?.querySelector("#lb-image");e&&(e.style.transform=`scale(${this.currentZoom}) rotate(${this.currentRotation}deg)`)}}class z{allProducts=[];searchEngine=new j;lightbox;productModal;state={searchQuery:"",selectedSection:"",selectedManufacturer:"",visualStatus:"all",viewMode:localStorage.getItem("viewMode")||"grid",hidePrices:localStorage.getItem("hidePrices")==="true",sortBy:"box"};appContainer;headerMount=null;filterMount=null;contentMount=null;constructor(){this.appContainer=document.getElementById("app"),this.initTheme(),this.lightbox=new N,this.productModal=new R,this.setupGlobalShortcuts()}async start(){this.renderLoading();try{if(typeof window<"u"&&"caches"in window)try{const r=await caches.keys();for(const s of r)s!=="balcao-mangueiras-v1"&&await caches.delete(s)}catch{}const e=await fetch(`./data/catalog-master-seed.json?t=${Date.now()}`);if(!e.ok)throw new Error(`Falha ao carregar seed de catálogo: status ${e.status}`);const o=await e.json();this.allProducts=await v.syncStaticCatalogUpdates(o),this.searchEngine.buildIndex(this.allProducts),this.mountApp(),this.render()}catch(e){this.renderError(e.message)}}initTheme(){localStorage.getItem("theme")==="dark"?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")}toggleTheme(){const e=document.documentElement.classList.toggle("dark");localStorage.setItem("theme",e?"dark":"light"),this.renderHeader()}setupGlobalShortcuts(){window.addEventListener("keydown",e=>{if(e.key==="/"&&!(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)){e.preventDefault();const o=document.getElementById("omnibox-search");o?.focus(),o?.select()}})}mountApp(){this.appContainer.innerHTML=`
      <div id="header-container"></div>
      <div id="filter-container"></div>
      <main class="flex-1 max-w-7xl mx-auto w-full p-4">
        <div id="content-container"></div>
      </main>
    `,this.headerMount=document.getElementById("header-container"),this.filterMount=document.getElementById("filter-container"),this.contentMount=document.getElementById("content-container")}render(){this.renderHeader(),this.renderFilters(),this.renderProducts()}renderHeader(){if(!this.headerMount)return;const e=this.searchEngine.search(this.state),o=T(this.state,this.allProducts.length,e.length,{onSearch:r=>{this.state.searchQuery=r,this.renderProducts()},onToggleViewMode:()=>{this.state.viewMode=this.state.viewMode==="grid"?"mural":"grid",localStorage.setItem("viewMode",this.state.viewMode),this.render()},onToggleHidePrices:()=>{this.state.hidePrices=!this.state.hidePrices,localStorage.setItem("hidePrices",String(this.state.hidePrices)),this.renderHeader(),this.renderProducts()},onToggleDarkMode:()=>this.toggleTheme(),onNewProduct:()=>{this.productModal.open(null,r=>this.handleProductSaved(r))},onExportBackup:()=>this.handleExportBackup(),onImportBackup:r=>this.handleImportBackup(r),onPrintBoxMap:()=>window.print()});this.headerMount.innerHTML="",this.headerMount.appendChild(o)}renderFilters(){if(!this.filterMount)return;const e={};for(const r of this.allProducts)e[r.section]=(e[r.section]||0)+1;const o=O(this.state,e,{onSelectSection:r=>{this.state.selectedSection=r,this.render()},onSelectManufacturer:r=>{this.state.selectedManufacturer=r,this.render()},onSelectVisualStatus:r=>{this.state.visualStatus=r,this.render()},onSelectSortBy:r=>{this.state.sortBy=r,this.renderProducts()},onClearAllFilters:()=>{this.state.selectedSection="",this.state.selectedManufacturer="",this.state.visualStatus="all",this.state.searchQuery="",this.render()}});this.filterMount.innerHTML="",this.filterMount.appendChild(o)}renderProducts(){if(!this.contentMount)return;const e=this.searchEngine.search(this.state);if(e.length===0){this.contentMount.innerHTML=`
        <div class="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm my-6">
          <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
            ${l.search("w-10 h-10")}
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Nenhuma peça encontrada</h3>
          <p class="text-xs max-w-sm text-slate-500 mb-4">Verifique o número da caixa ou o código digitado, ou limpe os filtros aplicados.</p>
          <button id="btn-empty-clear" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors">
            Limpar Busca e Filtros
          </button>
        </div>
      `,this.contentMount.querySelector("#btn-empty-clear")?.addEventListener("click",()=>{this.state.searchQuery="",this.state.selectedSection="",this.state.selectedManufacturer="",this.state.visualStatus="all",this.render()});return}const o=document.createElement("div");o.id="products-grid",this.state.viewMode==="mural"?o.className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3":o.className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";for(const r of e){const s=F(r,this.state.viewMode,this.state.hidePrices,{onZoom:(a,n)=>this.lightbox.open(a,n),onEdit:a=>this.productModal.open(a,n=>this.handleProductSaved(n)),onBoxClick:a=>{this.state.searchQuery=a;const n=document.getElementById("omnibox-search");n&&(n.value=a),this.renderProducts()}});o.appendChild(s)}this.contentMount.innerHTML="",this.contentMount.appendChild(o)}handleProductSaved(e){const o=this.allProducts.findIndex(r=>r.id===e.id);o>=0?this.allProducts[o]=e:this.allProducts.unshift(e),this.searchEngine.buildIndex(this.allProducts),this.render()}async handleExportBackup(){try{const e=await v.exportStoreBackup(),o=new Blob([e],{type:"application/json"}),r=URL.createObjectURL(o),s=document.createElement("a");s.href=r,s.download=`backup-balcao-miudezas-${new Date().toISOString().slice(0,10)}.json`,s.click(),URL.revokeObjectURL(r)}catch(e){alert(`Erro ao exportar backup: ${e.message}`)}}async handleImportBackup(e){try{const o=await e.text(),r=await v.importStoreBackup(o);r.success?(alert(`Backup restaurado com sucesso! ${r.count} itens atualizados.`),this.allProducts=await v.getAllProducts(),this.searchEngine.buildIndex(this.allProducts),this.render()):alert(`Erro na restauração: ${r.error}`)}catch(o){alert(`Falha ao ler arquivo de backup: ${o.message}`)}}renderLoading(){this.appContainer.innerHTML=`
      <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div class="p-4 bg-blue-600 rounded-2xl shadow-xl mb-4 animate-pulse">
          ${l.box("w-12 h-12")}
        </div>
        <h2 class="text-xl font-black uppercase tracking-tight mb-2">Carregando Catálogo de Balcão...</h2>
        <p class="text-xs text-slate-400 font-mono">Indexando caixas, fotos e códigos internos</p>
      </div>
    `}renderError(e){this.appContainer.innerHTML=`
      <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <div class="p-4 bg-red-600/30 text-red-400 rounded-2xl mb-4">
          ${l.alertTriangle("w-12 h-12")}
        </div>
        <h2 class="text-xl font-bold mb-2">Erro ao Iniciar Catálogo</h2>
        <p class="text-sm text-slate-400 max-w-md mb-6">${e}</p>
        <button onclick="window.location.reload()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors">
          Tentar Novamente
        </button>
      </div>
    `}}document.addEventListener("DOMContentLoaded",()=>{new z().start()});
