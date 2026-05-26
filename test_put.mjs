import fetch from "node-fetch";

async function test() {
  const res1 = await fetch("http://localhost:3001/courts");
  const courts = await res1.json();
  if (!courts.length) {
    console.log("No courts");
    return;
  }
  
  const court = courts[0];
  console.log("Original court name:", court.name);
  
  const res2 = await fetch(`http://localhost:3001/courts/${court._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: court.name + " TEST" })
  });
  
  console.log("PUT status:", res2.status);
  const updated = await res2.json();
  console.log("Updated court name:", updated.name);
}

test().catch(console.error);
