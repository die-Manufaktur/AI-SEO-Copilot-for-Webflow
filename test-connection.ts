import http from 'http';

console.log("Testing Cloudflare Worker connectivity...");

http.get('http://127.0.0.1:8787/api/ping', (res) => {
  const { statusCode } = res;
  let data = '';

  res.on('data', (chunk: Buffer) => {
    data += chunk.toString();
  });
  
  res.on('end', () => {
    if (statusCode === 200) {
      console.log("✅ Worker connection successful!");
      console.log(`Response: ${data}`);
    } else {
      console.error(`❌ Worker returned status code: ${statusCode}`);
    }
  });
}).on('error', (err: Error) => {
  console.error("❌ Worker connection failed!");
  console.error(`Error: ${err.message}`);
  console.log("\nMake sure you're running 'yarn dev:worker' in a separate terminal.");
});
