const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : null;
const SUPABASE_KEY = process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.trim() : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL y SUPABASE_KEY son requeridos.");
  process.exit(1);
}

let cleanUrl = SUPABASE_URL;
if (cleanUrl.endsWith('/rest/v1')) {
  cleanUrl = cleanUrl.slice(0, -8);
} else if (cleanUrl.endsWith('/rest/v1/')) {
  cleanUrl = cleanUrl.slice(0, -9);
}
if (cleanUrl.endsWith('/')) {
  cleanUrl = cleanUrl.slice(0, -1);
}

async function run() {
  try {
    console.log("Vaciando tabla prode_predictions...");
    const resPreds = await fetch(`${cleanUrl}/rest/v1/prode_predictions?id=not.is.null`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!resPreds.ok) {
      const err = await resPreds.text();
      throw new Error(`Fallo al vaciar predictions: ${resPreds.status} - ${err}`);
    }
    console.log("Tabla prode_predictions vaciada con éxito.");

    console.log("Vaciando tabla prode_users...");
    const resUsers = await fetch(`${cleanUrl}/rest/v1/prode_users?email=not.is.null`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!resUsers.ok) {
      const err = await resUsers.text();
      throw new Error(`Fallo al vaciar users: ${resUsers.status} - ${err}`);
    }
    console.log("Tabla prode_users vaciada con éxito.");
    
    console.log("¡Operación completada! Base de datos de usuarios y pronósticos restablecida a cero.");
  } catch (e) {
    console.error("Error al vaciar la base de datos:", e);
    process.exit(1);
  }
}

run();
