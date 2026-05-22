window.GB_SUPABASE_CONFIG = {
  url: "https://cuxcgfdstqxhxvcyyqtp.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eGNnZmRzdHF4aHh2Y3l5cXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDI1MzksImV4cCI6MjA5NTAxODUzOX0.ihBzgVOglFzcCIkp10U72tGKoBdyKs6FJWmpKdg5o-o"
};

// ===== AUTO CLOUD SYNC =====
window.GB_AUTO_SYNC = true;

function gbSaveLocal(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function gbLoadLocal(key){
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

async function gbAutoSync(){
  console.log("GymBaddies auto sync active");
}

window.addEventListener("online", gbAutoSync);
