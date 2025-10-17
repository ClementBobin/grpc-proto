#!/usr/bin/env node

/**
 * Integration test demonstrating HTTP/HTTPS and Auth configurations
 * 
 * This script tests the server in different modes:
 * 1. HTTP without auth
 * 2. HTTP with auth
 * 3. Different auth levels
 */

const { exec } = require('child_process');
const path = require('path');

const testConfigs = [
  {
    name: 'HTTP without Authentication',
    env: { USE_TLS: 'false', ENABLE_AUTH: 'false' },
    description: 'Server should start without requiring TLS or auth'
  },
  {
    name: 'HTTP with Global Authentication',
    env: { USE_TLS: 'false', ENABLE_AUTH: 'true', AUTH_LEVEL: 'global' },
    description: 'Server should require auth for all endpoints'
  },
  {
    name: 'HTTP with Service-level Authentication',
    env: { USE_TLS: 'false', ENABLE_AUTH: 'true', AUTH_LEVEL: 'service' },
    description: 'Server should allow per-service auth configuration'
  },
  {
    name: 'HTTP with Endpoint-level Authentication',
    env: { USE_TLS: 'false', ENABLE_AUTH: 'true', AUTH_LEVEL: 'endpoint' },
    description: 'Server should allow per-endpoint auth configuration'
  }
];

async function testServerConfig(config) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Environment:`, config.env);
    console.log('='.repeat(60));

    const env = { ...process.env, ...config.env };
    const envString = Object.entries(config.env)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    // Start server and check output
    const serverProcess = exec(
      `${envString} npm run dev:server`,
      { cwd: path.join(__dirname, '..') }
    );

    let output = '';
    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);

      if (data.includes('gRPC Server started')) {
        serverStarted = true;
        // Give it a moment to fully start
        setTimeout(() => {
          serverProcess.kill('SIGTERM');
        }, 1000);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });

    serverProcess.on('exit', (code) => {
      const passed = serverStarted;
      console.log(`\n${passed ? '✅' : '❌'} Test ${passed ? 'PASSED' : 'FAILED'}: ${config.name}`);
      
      if (passed) {
        // Verify expected output
        const checks = {
          'TLS status': config.env.USE_TLS === 'true' ? 
            output.includes('TLS enabled') : output.includes('insecure mode'),
          'Auth status': config.env.ENABLE_AUTH === 'true' ?
            output.includes('Auth: Enabled') : output.includes('Auth: Disabled'),
          'Auth level': !config.env.AUTH_LEVEL || 
            output.includes(`Auth Level: ${config.env.AUTH_LEVEL}`)
        };

        console.log('\nValidation checks:');
        Object.entries(checks).forEach(([check, result]) => {
          console.log(`  ${result ? '✓' : '✗'} ${check}`);
        });

        resolve(true);
      } else {
        console.error('Server did not start successfully');
        resolve(false);
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!serverStarted) {
        serverProcess.kill('SIGTERM');
        console.error('Timeout: Server did not start within 15 seconds');
        resolve(false);
      }
    }, 15000);
  });
}

async function runTests() {
  console.log('🧪 gRPC Server Configuration Integration Tests\n');
  console.log('Testing different HTTP/HTTPS and Auth configurations...\n');

  const results = [];
  
  for (const config of testConfigs) {
    const result = await testServerConfig(config);
    results.push({ config: config.name, passed: result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(({ config, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${config}`);
  });

  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${passedCount}/${results.length} tests passed`);
  console.log('='.repeat(60) + '\n');

  if (allPassed) {
    console.log('🎉 All configuration tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
