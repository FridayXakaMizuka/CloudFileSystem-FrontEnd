/**
 * HTTPS Configuration Test Script
 * Tests if HTTPS server is properly configured and accessible
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('HTTPS Configuration Test');
console.log('========================================\n');

// Test 1: Check certificate files
console.log('[Test 1] Checking certificate files...');
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('✅ Certificate files exist');
    const certStat = fs.statSync(certPath);
    const keyStat = fs.statSync(keyPath);
    console.log(`   cert.pem: ${certStat.size} bytes`);
    console.log(`   key.pem: ${keyStat.size} bytes`);
} else {
    console.log('❌ Certificate files NOT found');
    process.exit(1);
}
console.log();

// Test 2: Read and parse certificate
console.log('[Test 2] Reading certificate...');
try {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    console.log('✅ Certificate loaded successfully');
    
    // Extract certificate info
    const certString = cert.toString();
    const subjectMatch = certString.match(/Subject:.*?\n/);
    const expiryMatch = certString.match(/notAfter=(.*?)\n/);
    
    if (subjectMatch) {
        console.log('   Subject:', subjectMatch[0].trim());
    }
    if (expiryMatch) {
        console.log('   Expires:', expiryMatch[1].trim());
    }
} catch (error) {
    console.log('❌ Failed to read certificate:', error.message);
    process.exit(1);
}
console.log();

// Test 3: Create HTTPS server
console.log('[Test 3] Creating test HTTPS server...');
const httpsServer = https.createServer({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
}, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>HTTPS Test Server</h1><p>If you see this, HTTPS is working!</p>');
});

const TEST_PORT = 2399;

httpsServer.listen(TEST_PORT, 'localhost', () => {
    console.log(`✅ HTTPS test server started on port ${TEST_PORT}`);
    console.log(`   URL: https://localhost:${TEST_PORT}`);
    console.log();
    
    // Test 4: Make HTTPS request
    console.log('[Test 4] Testing HTTPS connection...');
    
    const testReq = https.request({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/',
        method: 'GET',
        rejectUnauthorized: false // Allow self-signed certificates
    }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('✅ HTTPS connection successful');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Response length: ${data.length} bytes`);
            
            if (data.includes('HTTPS Test Server')) {
                console.log('   Content: ✅ Valid HTML response');
            }
            
            console.log();
            console.log('========================================');
            console.log('All tests passed! ✅');
            console.log('========================================');
            console.log();
            console.log('Your HTTPS configuration is working correctly.');
            console.log('You can now run: npm run dev');
            console.log('And access: https://localhost:2311');
            console.log();
            
            httpsServer.close();
            process.exit(0);
        });
    });
    
    testReq.on('error', (error) => {
        console.log('❌ HTTPS connection failed:', error.message);
        httpsServer.close();
        process.exit(1);
    });
    
    testReq.end();
});

httpsServer.on('error', (error) => {
    console.log('❌ Failed to start HTTPS server:', error.message);
    process.exit(1);
});

// Timeout after 5 seconds
setTimeout(() => {
    console.log('❌ Test timeout');
    httpsServer.close();
    process.exit(1);
}, 5000);
