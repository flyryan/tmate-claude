import { OutputProcessor } from '../output-processor';
import { CommandExecutor } from '../command-executor';
import { performance } from 'perf_hooks';
import * as os from 'os';

async function benchmarkOutputProcessor() {
  console.log('\nBenchmarking OutputProcessor...');
  const processor = new OutputProcessor(1000);
  const samples = 1000;
  const results = {
    latencies: [] as number[],
    memoryUsage: [] as number[],
    bufferUtilization: [] as number[]
  };

  // Generate test data of varying sizes
  const testData = Array.from({ length: samples }, (_, i) => 
    Buffer.from('x'.repeat(Math.floor(Math.random() * 10000)))
  );

  console.log(`Running ${samples} samples for output processing...`);
  
  for (const data of testData) {
    const start = performance.now();
    processor.processRawOutput(data);
    const end = performance.now();
    
    const metrics = processor.getMetrics();
    results.latencies.push(end - start);
    results.memoryUsage.push(metrics.memoryUsage);
    results.bufferUtilization.push(metrics.bufferUtilization);
  }

  // Calculate statistics
  const avgLatency = results.latencies.reduce((a, b) => a + b) / samples;
  const maxLatency = Math.max(...results.latencies);
  const avgMemory = results.memoryUsage.reduce((a, b) => a + b) / samples;
  const maxMemory = Math.max(...results.memoryUsage);

  console.log('\nOutput Processing Results:');
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms (Target: <50ms)`);
  console.log(`Max Latency: ${maxLatency.toFixed(2)}ms`);
  console.log(`Average Memory Usage: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Max Memory Usage: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
  
  return {
    meetsLatencyRequirement: avgLatency < 50,
    meetsMemoryRequirement: maxMemory < 100 * 1024 * 1024 // 100MB
  };
}

async function benchmarkCommandExecutor() {
  console.log('\nBenchmarking CommandExecutor...');
  const executor = new CommandExecutor();
  const samples = 50;
  const results = {
    executionTimes: [] as number[],
    cpuUsage: [] as number[],
    memoryUsage: [] as number[]
  };

  // Test commands of varying complexity
  const testCommands = [
    'echo "test"',
    'ls -la',
    'ps aux',
    'cat /dev/null',
    'find . -type f -name "*.ts"'
  ];

  console.log(`Running ${samples} samples for command execution...`);

  for (let i = 0; i < samples; i++) {
    const command = testCommands[i % testCommands.length];
    
    const start = performance.now();
    await executor.executeCommand(command);
    const end = performance.now();

    const usage = executor.getResourceUsage();
    results.executionTimes.push(end - start);
    results.cpuUsage.push(usage.cpuUsage);
    results.memoryUsage.push(usage.memoryUsage);

    // Small delay between commands to measure idle state
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const avgExecTime = results.executionTimes.reduce((a, b) => a + b) / samples;
  const maxExecTime = Math.max(...results.executionTimes);
  const avgCpu = results.cpuUsage.reduce((a, b) => a + b) / samples;
  const avgMemory = results.memoryUsage.reduce((a, b) => a + b) / samples;

  console.log('\nCommand Execution Results:');
  console.log(`Average Execution Time: ${avgExecTime.toFixed(2)}ms (Target: <100ms)`);
  console.log(`Max Execution Time: ${maxExecTime.toFixed(2)}ms`);
  console.log(`Average CPU Usage: ${avgCpu.toFixed(2)}% (Target: <10%)`);
  console.log(`Average Memory Usage: ${(avgMemory / 1024 / 1024).toFixed(2)}MB (Target: <100MB)`);

  return {
    meetsExecutionRequirement: avgExecTime < 100,
    meetsCpuRequirement: avgCpu < 10,
    meetsMemoryRequirement: avgMemory < 100 * 1024 * 1024
  };
}

async function verifyProcessIsolation() {
  console.log('\nVerifying Process Isolation...');
  const executor = new CommandExecutor();

  // Test environment isolation
  console.log('Testing environment isolation...');
  const envTests = [
    // Try to modify environment
    'export TEST_VAR=123',
    // Try to access sensitive files
    'cat /etc/passwd',
    // Try to create files outside working directory
    'touch ../test.txt',
    // Try to run privileged commands
    'sudo ls',
    // Try to kill other processes
    'pkill -f node'
  ];

  let isolationScore = 0;
  const results = [];

  for (const test of envTests) {
    const result = await executor.executeCommand(test);
    const blocked = !result.success || result.error;
    if (blocked) isolationScore++;
    results.push({ command: test, blocked });
  }

  console.log('\nProcess Isolation Results:');
  console.log(`Isolation Score: ${isolationScore}/${envTests.length}`);
  console.log('Detailed Results:');
  results.forEach(r => console.log(`${r.blocked ? '✅' : '❌'} ${r.command}`));

  return {
    meetsIsolationRequirement: isolationScore === envTests.length
  };
}

async function runBenchmarks() {
  console.log('Starting Comprehensive Benchmarks...');

  try {
    // Run all benchmarks
    const outputResults = await benchmarkOutputProcessor();
    const commandResults = await benchmarkCommandExecutor();
    const isolationResults = await verifyProcessIsolation();

    // Summarize results
    console.log('\n=== Benchmark Summary ===');
    
    console.log('\nPerformance Requirements:');
    console.log(`Output Latency: ${outputResults.meetsLatencyRequirement ? '✅' : '❌'}`);
    console.log(`Command Execution: ${commandResults.meetsExecutionRequirement ? '✅' : '❌'}`);
    console.log(`CPU Usage: ${commandResults.meetsCpuRequirement ? '✅' : '❌'}`);
    console.log(`Memory Usage: ${commandResults.meetsMemoryRequirement ? '✅' : '❌'}`);
    
    console.log('\nSecurity Requirements:');
    console.log(`Process Isolation: ${isolationResults.meetsIsolationRequirement ? '✅' : '❌'}`);

    // Overall assessment
    const allRequirementsMet = 
      outputResults.meetsLatencyRequirement &&
      commandResults.meetsExecutionRequirement &&
      commandResults.meetsCpuRequirement &&
      commandResults.meetsMemoryRequirement &&
      isolationResults.meetsIsolationRequirement;

    console.log('\nFinal Assessment:');
    console.log(allRequirementsMet ? 
      '✅ All requirements met - Ready for Phase 2' :
      '❌ Some requirements not met - See detailed results above'
    );

  } catch (error) {
    console.error('Benchmark failed:', error);
    process.exit(1);
  }
}

// Run benchmarks if this file is being executed directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}
