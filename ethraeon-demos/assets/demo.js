async function loadJSON(path){ const r=await fetch(path); return r.json(); }
function el(sel){return document.querySelector(sel)}