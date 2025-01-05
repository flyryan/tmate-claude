import { OutputProcessor } from '../output-processor';
import { CommandExecutor } from '../command-executor';
import assert from 'assert';

async function testOutputProcessor() {
  console.log('\nTesting OutputProcessor...');
  
  const processor = new OutputProcessor(1000);
  
  // Test performance monitoring
  console.log('Testing performance metrics...');
  const largeOutput = Buffer.from('x'.repeat(100000));
  const processed = processor.processRawOutput(largeOutput);
  const metrics = processor.getMetrics();
  
  assert(metrics.latency > 0, 'Latency should be measured');
  assert(metrics.memoryUsage > 0, 'Memory usage should be tracked');
  assert(metrics.outputSize === processed.length, 'Output size should match');
  assert(metrics.bufferUtilization >= 0 && metrics.bufferUtilization <= 100, 'Buffer utilization should be percentage');
  
  console.log('✅ OutputProcessor metrics validated');
}

async function testCommandExecutor() {
  console.log('\nTesting CommandExecutor...');
  
  const executor = new CommandExecutor();
  
  // Test process isolation
  console.log('Testing process isolation...');
  const results = await Promise.all([
    executor.executeCommand('echo "test1"'),
    executor.executeCommand('echo "test2"'),
    executor.executeCommand('echo "test3"')
  ]);
  
  assert(results.every(r => r.success), 'All commands should execute successfully');
  
  // Test resource limits
  console.log('Testing resource limits...');
  const resourceHog = `node -e "
    const arr = [];
    for(let i = 0; i < 1000000; i++) {
      arr.push(new Array(1000).fill('x'));
    }
  "`;
  
  const resourceResult = await executor.executeCommand(resourceHog);
  const usage = executor.getResourceUsage();
  
  assert(usage.cpuUsage >= 0 && usage.cpuUsage <= 100, 'CPU usage should be percentage');
  assert(usage.memoryUsage > 0, 'Memory usage should be tracked');
  assert(usage.fileDescriptors >= 0, 'File descriptors should be tracked');
  assert(usage.networkConnections >= 0, 'Network connections should be tracked');
  
  // Test security events
  console.log('Testing security monitoring...');
  await executor.executeCommand('rm -rf /');  // Should be blocked
  const events = executor.getSecurityEvents();
  
  assert(events.length > 0, 'Security events should be logged');
  assert(events.some(e => e.type === 'command_blocked'), 'Dangerous commands should be blocked');
  
  console.log('✅ CommandExecutor validation complete');
}

async function validatePhase1() {
  console.log('Starting Phase 1 Validation...');
  
  try {
    await testOutputProcessor();
    await testCommandExecutor();
    
    console.log('\n✅ All Phase 1 components validated successfully');
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run validation if this file is being executed directly
if (require.main === module) {
  validatePhase1().catch(console.error);
}
