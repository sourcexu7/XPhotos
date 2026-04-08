const axios = require('axios');
const fs = require('fs');

// 配置
const BASE_URL = 'http://localhost:3001';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;
const TEST_ENDPOINTS = [
  {
    name: '图片列表查询',
    url: '/api/v1/public/gallery/images',
    method: 'GET',
    params: { page: 1, album: '/', pageSize: 16 }
  },
  {
    name: '相机和镜头列表',
    url: '/api/v1/public/gallery/cameras-lenses',
    method: 'GET'
  }
];

// 性能测试结果
const results = {
  start: new Date(),
  end: null,
  totalRequests: TOTAL_REQUESTS,
  concurrentRequests: CONCURRENT_REQUESTS,
  endpoints: {}
};

// 初始化端点结果
TEST_ENDPOINTS.forEach(endpoint => {
  results.endpoints[endpoint.name] = {
    total: 0,
    success: 0,
    failed: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    minTime: Infinity,
    responses: []
  };
});

// 执行单个请求
async function executeRequest(endpoint, requestId) {
  const start = Date.now();
  try {
    const response = await axios({
      method: endpoint.method,
      url: `${BASE_URL}${endpoint.url}`,
      params: endpoint.params,
      timeout: 10000
    });
    const end = Date.now();
    const duration = end - start;
    
    const result = results.endpoints[endpoint.name];
    result.total++;
    result.success++;
    result.totalTime += duration;
    result.averageTime = result.totalTime / result.total;
    result.maxTime = Math.max(result.maxTime, duration);
    result.minTime = Math.min(result.minTime, duration);
    result.responses.push({
      requestId,
      status: response.status,
      duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ ${endpoint.name} - ${requestId}: ${duration}ms`);
  } catch (error) {
    const end = Date.now();
    const duration = end - start;
    
    const result = results.endpoints[endpoint.name];
    result.total++;
    result.failed++;
    result.totalTime += duration;
    result.averageTime = result.totalTime / result.total;
    result.responses.push({
      requestId,
      status: error.response?.status || 0,
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`❌ ${endpoint.name} - ${requestId}: ${duration}ms - ${error.message}`);
  }
}

// 执行压力测试
async function runLoadTest() {
  console.log(`开始压力测试...`);
  console.log(`并发请求数: ${CONCURRENT_REQUESTS}`);
  console.log(`总请求数: ${TOTAL_REQUESTS}`);
  console.log(`测试端点: ${TEST_ENDPOINTS.map(e => e.name).join(', ')}
`);
  
  const requestsPerEndpoint = Math.floor(TOTAL_REQUESTS / TEST_ENDPOINTS.length);
  const allRequests = [];
  
  // 为每个端点创建请求
  TEST_ENDPOINTS.forEach(endpoint => {
    for (let i = 0; i < requestsPerEndpoint; i++) {
      allRequests.push(() => executeRequest(endpoint, i + 1));
    }
  });
  
  // 并发执行请求
  const batches = [];
  for (let i = 0; i < allRequests.length; i += CONCURRENT_REQUESTS) {
    const batch = allRequests.slice(i, i + CONCURRENT_REQUESTS);
    batches.push(Promise.all(batch.map(fn => fn())));
  }
  
  await Promise.all(batches);
  
  results.end = new Date();
  results.totalDuration = results.end - results.start;
  
  // 生成测试报告
  generateReport();
}

// 生成测试报告
function generateReport() {
  console.log('\n====================================');
  console.log('性能测试报告');
  console.log('====================================');
  console.log(`测试时间: ${results.start.toISOString()} 到 ${results.end.toISOString()}`);
  console.log(`总测试时间: ${results.totalDuration}ms`);
  console.log(`总请求数: ${results.totalRequests}`);
  console.log(`并发请求数: ${results.concurrentRequests}\n`);
  
  Object.entries(results.endpoints).forEach(([name, data]) => {
    console.log(`📊 ${name}:`);
    console.log(`   总请求: ${data.total}`);
    console.log(`   成功: ${data.success}`);
    console.log(`   失败: ${data.failed}`);
    console.log(`   成功率: ${((data.success / data.total) * 100).toFixed(2)}%`);
    console.log(`   平均响应时间: ${data.averageTime.toFixed(2)}ms`);
    console.log(`   最大响应时间: ${data.maxTime}ms`);
    console.log(`   最小响应时间: ${data.minTime === Infinity ? 0 : data.minTime}ms`);
    console.log('');
  });
  
  // 保存结果到文件
  const reportFile = `performance-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`测试报告已保存到: ${reportFile}`);
}

// 检查是否安装了axios
if (!fs.existsSync('./node_modules/axios')) {
  console.log('请先安装axios: npm install axios');
  process.exit(1);
}

// 运行测试
runLoadTest().catch(console.error);
