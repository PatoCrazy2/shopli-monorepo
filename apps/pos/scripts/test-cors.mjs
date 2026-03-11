async function testCors() {
  const url = 'http://localhost:3000/api/pos/auth'; // using the pos auth endpoint
  console.log(`Testing CORS against ${url}`);
  
  try {
    // Test the preflight OPTIONS request
    console.log("\n--- Sending OPTIONS request ---");
    const preflightRes = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    });

    console.log(`Status: ${preflightRes.status}`);
    console.log(`Access-Control-Allow-Origin: ${preflightRes.headers.get('access-control-allow-origin')}`);
    console.log(`Access-Control-Allow-Credentials: ${preflightRes.headers.get('access-control-allow-credentials')}`);
    console.log(`Access-Control-Allow-Methods: ${preflightRes.headers.get('access-control-allow-methods')}`);

    // Test a POST request with credentials
    console.log("\n--- Sending POST request ---");
    const postRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Origin': 'http://localhost:5173',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ pin: "0000" })
    });
    
    console.log(`Status: ${postRes.status}`);
    console.log(`Access-Control-Allow-Origin: ${postRes.headers.get('access-control-allow-origin')}`);
    console.log(`Access-Control-Allow-Credentials: ${postRes.headers.get('access-control-allow-credentials')}`);
    console.log("If status is 401 or 200, CORS passed and the request successfully hit the BFF.");

  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

testCors();
