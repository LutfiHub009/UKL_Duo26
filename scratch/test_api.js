const baseUrl = "https://lar-production-1d83.up.railway.app";

async function run() {
  const rand = Math.floor(Math.random() * 100000);
  const username = `user_${rand}`;
  const email = `email_${rand}@example.com`;
  const password = "password123";

  console.log(`Registering user: ${username} (${email})...`);
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      username,
      fullname: `Test User ${rand}`,
      role: "customer"
    })
  });

  if (!registerRes.ok) {
    const text = await registerRes.text();
    console.error("Register failed:", text);
    return;
  }
  console.log("Register success!");

  console.log("Logging in...");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!loginRes.ok) {
    console.error("Login failed");
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.token || loginData.accessToken || loginData.data?.token;
  console.log("Login success! Token:", token ? "Found" : "Not Found");

  console.log("Fetching all projects...");
  const listRes = await fetch(`${baseUrl}/projects`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    console.error("Fetch projects failed");
    return;
  }

  const listData = await listRes.json();
  console.log("List projects response count:", listData.length);
  if (listData.length > 0) {
    console.log("List projects response first item:", JSON.stringify(listData[0], null, 2));
  } else {
    console.log("No projects in database.");
  }

  console.log("Creating a test project...");
  const createRes = await fetch(`${baseUrl}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: "Test Car Build",
      description: "A test description for gemini",
      imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70"
    })
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error("Create project failed:", text);
    return;
  }
  const project = await createRes.json();
  console.log("Created project response:", JSON.stringify(project, null, 2));

  console.log("Fetching all projects...");
  const listRes = await fetch(`${baseUrl}/projects`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!listRes.ok) {
    console.error("Fetch projects failed");
    return;
  }

  const listData = await listRes.json();
  console.log("List projects response (first 2 items):", JSON.stringify(listData.slice(0, 2), null, 2));
}

run().catch(console.error);
