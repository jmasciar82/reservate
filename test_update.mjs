

async function test() {
  console.log("Login...");
  const loginRes = await fetch("http://localhost:3001/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@reservate.com", password: "admin123" })
  });
  
  const { access_token } = await loginRes.json();
  console.log("Token:", access_token ? "OK" : "FAIL");

  console.log("Fetching courts...");
  const courtsRes = await fetch("http://localhost:3001/courts", {
    headers: { "Authorization": `Bearer ${access_token}` }
  });
  const courts = await courtsRes.json();
  const court = courts[0];
  console.log("First court:", court._id, court.name, court.clubId);

  console.log("Updating court...");
  const putRes = await fetch(`http://localhost:3001/courts/${court._id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`
    },
    body: JSON.stringify({
      name: court.name + " EDITADO",
      sport: court.sport,
      clubId: court.clubId,
      isActive: court.isActive,
      isCovered: court.isCovered,
      pricePerHour: 99999
    })
  });
  
  console.log("PUT status:", putRes.status);
  const updatedCourt = await putRes.json();
  console.log("Updated court:", updatedCourt);
}

test().catch(console.error);
