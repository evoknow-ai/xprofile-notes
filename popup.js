const $ = selector => document.querySelector(selector);
let all = {};
let editingKey = null;

async function reload() {
  all = (await chrome.storage.local.get("profileNotes")).profileNotes || {};
  render();
}

function render() {
  const query = $("#search").value.trim().toLowerCase();
  const items = Object.entries(all).filter(([, item]) =>
    [item.handle, item.note, ...(item.tags || [])].join(" ").toLowerCase().includes(query)
  ).sort((a,b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)));
  $("#list").replaceChildren(...items.map(([key, item]) => {
    const card = document.createElement("article"); card.className = "card";
    const who = document.createElement("div"); who.className = "who";
    const name = document.createElement("a"); name.textContent = `@${item.handle}`;
    name.href = `https://x.com/${encodeURIComponent(item.handle)}`;
    name.target = "_blank";
    name.rel = "noopener noreferrer";
    name.title = `Open @${item.handle} on X`;
    name.addEventListener("click", event => event.stopPropagation());
    const when = document.createElement("span"); when.className = "when"; when.textContent = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "";
    const body = document.createElement("div"); body.className = "text"; body.textContent = item.note || "No note text";
    who.append(name, when); card.append(who, body);
    (item.tags || []).forEach(value => { const tag=document.createElement("span"); tag.className="tag"; tag.textContent=value; card.append(tag); });
    card.addEventListener("click", () => openEditor(key)); return card;
  }));
  $("#empty").hidden = items.length > 0;
  $("#count").textContent = `${Object.keys(all).length} private note${Object.keys(all).length === 1 ? "" : "s"} · stored locally`;
}

function openEditor(key = null) {
  editingKey = key; const item = key ? all[key] : {handle:"",note:"",tags:[]};
  $("#handle").value=item.handle; $("#note").value=item.note; $("#tags").value=(item.tags||[]).join(", ");
  $("#remove").hidden=!key; $("#editorTitle").textContent=key?"Edit profile note":"Add profile note"; $("#editor").showModal();
}

$("#search").addEventListener("input", render);
$("#add").addEventListener("click", () => openEditor());
$("#editor").addEventListener("close", async () => {
  if ($("#editor").returnValue !== "default") return;
  const handle=$("#handle").value.replace(/^@/,"").trim(); if(!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return;
  const key=handle.toLowerCase(), now=new Date().toISOString(), previous=all[editingKey]||all[key];
  if(editingKey && editingKey!==key) delete all[editingKey];
  all[key]={handle,note:$("#note").value.trim(),tags:$("#tags").value.split(",").map(x=>x.trim()).filter(Boolean),createdAt:previous?.createdAt||now,updatedAt:now};
  await chrome.storage.local.set({profileNotes:all}); reload();
});
$("#remove").addEventListener("click", async () => { if(editingKey){delete all[editingKey];await chrome.storage.local.set({profileNotes:all});$("#editor").close();reload();} });
$("#export").addEventListener("click", () => { const blob=new Blob([JSON.stringify({format:"x-profile-notes",version:1,exportedAt:new Date().toISOString(),notes:all},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`x-profile-notes-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); });
$("#import").addEventListener("change", async event => { try{const parsed=JSON.parse(await event.target.files[0].text());const incoming=parsed.notes||parsed;if(!incoming||typeof incoming!=="object")throw Error();all={...all,...incoming};await chrome.storage.local.set({profileNotes:all});reload();}catch{alert("That file is not a valid X Profile Notes backup.");}event.target.value=""; });
chrome.storage.onChanged.addListener(reload); reload();
