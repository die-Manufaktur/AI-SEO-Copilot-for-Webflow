import http from 'http';

/**
 * Tests connectivity to the local Cloudflare Worker
 * 
 * This script verifies that the worker is running correctly
 * and can handle requests from your client.
 */
console.log("Testing Cloudflare Worker connectivity...");

const options = {
  hostname: '127.0.0.1',
  port: 8787,
  path: '/api/ping',
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:1337',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  const { statusCode } = res;
  let data = '';

  res.on('data', (chunk) => {
    data += chunk.toString();
  });
  
  res.on('end', () => {
    if (statusCode === 200) {
      console.log("✅ Worker connection successful!");
      console.log(`Response: ${data}`);

      // Test the analyze endpoint with minimal data
      console.log("\nTesting /api/analyze endpoint...");
      testAnalyzeEndpoint();
    } else {
      console.error(`❌ Worker returned status code: ${statusCode}`);
      console.log(`Response data: ${data}`);
    }
  });
});

req.on('error', (err) => {
  console.error("❌ Worker connection failed!");
  console.error(`Error: ${err.message}`);
  console.log("\nMake sure you're running 'pnpm dev:worker' in a separate terminal.");
});

req.end();

/**
 * Tests the /api/analyze endpoint with minimal valid data
 */
function testAnalyzeEndpoint() {
  const testData = JSON.stringify({
    keyphrase: 'test',
    url: 'https://example.com',
    isHomePage: true,
    siteInfo: { title: 'Test Site' },
    publishPath: '/'
  });

  const analyzeOptions = {
    hostname: '127.0.0.1',
    port: 8787,
    path: '/api/analyze',
    method: 'POST',
    headers: {
      'Origin': 'http://localhost:1337',
      'Content-Type': 'application/json'
    }
  };

  const analyzeReq = http.request(analyzeOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log("✅ /api/analyze endpoint working");
      } else {
        console.error(`❌ /api/analyze returned status ${res.statusCode}`);
        console.log(data);
      }
    });
  });

  analyzeReq.on('error', (err) => {
    console.error(`❌ Error testing /api/analyze: ${err.message}`);
  });

  analyzeReq.write(testData);
  analyzeReq.end();
}
