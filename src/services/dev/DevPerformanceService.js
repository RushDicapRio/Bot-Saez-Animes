const v8 = require('v8');
const os = require('os');
const { formatBytes } = require('../../utils/dev/formatters');
class DevPerformanceService {
  /**
   * @returns {Promise<number>} 
   */
  static measureEventLoopLag() {
    return new Promise(resolve => {
      const start = process.hrtime();
      setImmediate(() => {
        const diff = process.hrtime(start);
        resolve(Number((diff[0] * 1000 + diff[1] / 1e6).toFixed(2)));
      });
    });
  }
  static getHeapStats() {
    const stats = v8.getHeapStatistics();
    return {
      totalHeapSize: formatBytes(stats.total_heap_size),
      totalHeapSizeExecutable: formatBytes(stats.total_heap_size_executable),
      totalPhysicalSize: formatBytes(stats.total_physical_size),
      totalAvailableSize: formatBytes(stats.total_available_size),
      usedHeapSize: formatBytes(stats.used_heap_size),
      heapSizeLimit: formatBytes(stats.heap_size_limit),
      mallocedMemory: formatBytes(stats.malloced_memory),
      peakMallocedMemory: formatBytes(stats.peak_malloced_memory)
    };
  }
  /**
   * @param {() => Promise<void>|void} fn 
   * @param {number} [iterations=100] 
   */
  static async benchmark(fn, iterations = 100) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime();
      await fn();
      const diff = process.hrtime(start);
      times.push(diff[0] * 1000 + diff[1] / 1e6);
    }
    const min = Math.min(...times);
    const max = Math.max(...times);
    const total = times.reduce((a, b) => a + b, 0);
    const avg = total / times.length;
    return {
      iterations,
      minMs: min.toFixed(3),
      maxMs: max.toFixed(3),
      avgMs: avg.toFixed(3),
      totalMs: total.toFixed(3)
    };
  }
  static getCpuUsage() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    return {
      cores: cpus.length,
      model: cpus[0]?.model || 'Inconnu',
      speedMHz: cpus[0]?.speed || 0,
      load1m: loadAvg[0].toFixed(2),
      load5m: loadAvg[1].toFixed(2),
      load15m: loadAvg[2].toFixed(2)
    };
  }
}
module.exports = DevPerformanceService;
