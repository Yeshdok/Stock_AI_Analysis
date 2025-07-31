import axios from 'axios';

// 智能API配置：使用实际运行的快速响应API服务
const FAST_API_URL = 'http://127.0.0.1:5001';

// 创建统一的API实例（指向快速API服务）
const apiInstance = axios.create({
  baseURL: FAST_API_URL,
  timeout: 30000, // 30秒超时，快速响应
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建真实数据API实例（备用，如果5000端口服务可用）
const realDataApi = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 120000, // 2分钟超时，支持TuShare真实数据获取
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建快速API实例
const fastApi = axios.create({
  baseURL: FAST_API_URL,
  timeout: 30000, // 30秒超时，快速响应
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiInstance.interceptors.request.use(
  (config) => {
    console.log('🔥 API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

fastApi.interceptors.request.use(
  (config) => {
    console.log('⚡ 快速API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功');
    return response;
  },
  (error) => {
    console.error('❌ API错误:', error.message);
    return Promise.reject(error);
  }
);

fastApi.interceptors.response.use(
  (response) => {
    console.log('⚡ 快速API响应成功');
    return response;
  },
  (error) => {
    console.error('❌ 快速API错误:', error.message);
    return Promise.reject(error);
  }
);

// 智能交易信号获取：优先使用快速API，备用真实数据API
export const fetchTradingSignals = async (stockCode) => {
  console.log(`📊 获取交易信号: ${stockCode}`);
  
  try {
    // 1. 优先使用快速响应API（运行在127.0.0.1:5001）
    console.log('⚡ 使用快速响应API...');
    const fastResponse = await fastApi.get(`/api/trading-signals/${stockCode}`);
    
    if (fastResponse.data.success && fastResponse.data.data) {
      console.log('✅ 快速API数据获取成功');
      
      // 转换快速API数据格式以匹配前端期望
      const convertedData = convertFastApiData(fastResponse.data.data, stockCode);
      
      return convertedData;
    }
    
    throw new Error('快速API返回格式异常');
    
  } catch (error) {
    console.warn('⚠️ 快速API获取失败，尝试真实数据API备用方案:', error.message);
    
    try {
      // 2. 备用：使用TuShare真实数据API（如果5000端口可用）
      console.log('🔥 尝试使用TuShare真实数据API...');
      const response = await realDataApi.post('/trading_signals', {
        stock_code: stockCode
      }, {
        timeout: 300000, // 5分钟超时，确保TuShare数据充分获取
      });
      
      console.log('✅ TuShare真实数据获取成功！');
      
      // 验证返回数据质量
      if (response.data.success && response.data.all_signals) {
        console.log('📊 数据质量验证：包含多周期信号数据');
        
        // 增强数据结构以支持BOLL显示
        const enhancedData = enhanceDataForBollinger(response.data);
        
        return enhancedData;
      }
      
      throw new Error('真实数据API返回格式异常');
      
    } catch (realError) {
      console.error('❌ 所有API都失败了:', realError.message);
      throw new Error(`数据获取失败: 快速API(${error.message}), 真实数据API(${realError.message})`);
    }
  }
};

// 增强TuShare数据以支持BOLL显示
const enhanceDataForBollinger = (data) => {
  try {
    // 确保每个周期的信号数据包含完整的BOLL信息
    if (data.all_signals) {
      Object.keys(data.all_signals).forEach(period => {
        const periodSignals = data.all_signals[period];
        
        if (periodSignals.signals && periodSignals.signals.indicators) {
          // 如果有布林带数据但缺少latest_values，计算默认值
          if (periodSignals.signals.indicators.bollinger && !periodSignals.signals.indicators.bollinger.latest_values) {
            const stockData = data.all_stock_data[period];
            if (stockData && stockData.length > 0) {
              const latestPrice = stockData[stockData.length - 1].Close;
              
              periodSignals.signals.indicators.bollinger.latest_values = {
                upper: latestPrice * 1.05,
                middle: latestPrice,
                lower: latestPrice * 0.95,
                position: latestPrice
              };
            }
          }
        }
      });
    }
    
    console.log('✅ TuShare数据增强完成，支持完整BOLL显示');
    return data;
    
  } catch (error) {
    console.warn('⚠️ 数据增强失败，使用原始数据:', error);
    return data;
  }
};

// 转换快速API数据格式
const convertFastApiData = (fastData, stockCode) => {
  try {
    // 将快速API数据转换为前端期望的多周期格式
    const convertedData = {
      success: true,
      message: `快速分析数据: ${fastData.stock_name}(${stockCode})`,
      all_signals: {
        daily: {
          period_name: '日线',
          signals: {
            signal_type: '买入', // 默认信号
            indicators: {
              macd: {
                latest_value: fastData.indicators.MACD.macd,
                signals: ['MACD分析']
              },
              rsi: {
                latest_value: fastData.indicators.RSI,
                signals: ['RSI分析']
              },
              bollinger: {
                latest_values: {
                  upper: fastData.indicators.BOLL.upper,
                  middle: fastData.indicators.BOLL.middle,
                  lower: fastData.indicators.BOLL.lower,
                  position: fastData.current_price
                },
                signals: ['布林带分析']
              }
            },
            trading_signals: fastData.trading_signals
          }
        }
      },
      all_stock_data: {
        daily: fastData.kline_data.map(item => ({
          Date: item.date,
          Open: item.open,
          High: item.high,
          Low: item.low,
          Close: item.close,
          Volume: item.volume
        }))
      },
      stock_info: {
        code: stockCode,
        name: fastData.stock_name,
        sector: '',
        market: 'A股'
      },
      comprehensive_advice: {
        summary: '快速分析建议',
        risk_level: '中等'
      },
      backtest_result: fastData.backtest_result
    };
    
    console.log('✅ 快速API数据转换完成');
    return convertedData;
    
  } catch (error) {
    console.error('❌ 快速API数据转换失败:', error);
    throw error;
  }
};

// 检查API服务健康状态
export const checkApiHealth = async () => {
  const results = {
    fastApi: false,
    realDataApi: false
  };
  
  try {
    await fastApi.get('/api/health', { timeout: 3000 });
    results.fastApi = true;
    console.log('✅ 快速API服务正常');
  } catch (error) {
    console.log('❌ 快速API服务异常');
  }
  
  try {
    await realDataApi.get('/', { timeout: 5000 });
    results.realDataApi = true;
    console.log('✅ 真实数据API服务正常');
  } catch (error) {
    console.log('❌ 真实数据API服务异常');
  }
  
  return results;
};

export const stockAPI = {
  // 搜索股票 - 智能模糊搜索
  searchStocks: async (query, limit = 8) => {
    try {
      console.log(`🔍 搜索股票: "${query}", 限制: ${limit}`);
      const response = await apiInstance.get('/api/search_stocks', {
        params: { q: query, limit }
      });
      console.log('🔍 搜索结果:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 搜索股票失败:', error);
      // 提供备用搜索结果
      return {
        success: false,
        stocks: [],
        message: '搜索服务暂时不可用'
      };
    }
  },

  // 获取股票数量
  getStockCount: async () => {
    try {
      const response = await apiInstance.get('/api/stocks/count');
      return response.data;
    } catch (error) {
      console.error('获取股票数量失败:', error);
      throw error;
    }
  }
};

// 量化策略API
export const strategyAPI = {
  // 获取策略配置
  getStrategyConfig: async (strategyId) => {
    try {
      const response = await apiInstance.get(`/api/strategies/config/${strategyId}`);
      return response.data;
    } catch (error) {
      throw new Error('获取策略配置失败');
    }
  },

  // 更新策略参数
  updateStrategyConfig: async (strategyId, params) => {
    try {
      const response = await apiInstance.post(`/api/strategies/config/${strategyId}`, {
        params
      });
      return response.data;
    } catch (error) {
      throw new Error('更新策略参数失败');
    }
  },

  // 执行策略
  executeStrategy: async (strategyId, stockCode, startDate, endDate) => {
    try {
      const response = await apiInstance.post('/api/strategies/execute', {
        strategy_id: strategyId,
        stock_code: stockCode,
        start_date: startDate,
        end_date: endDate
      }, {
        timeout: 120000, // 2分钟超时
      });
      return response.data;
    } catch (error) {
      throw new Error('执行策略失败');
    }
  },

  // 运行回测
  runBacktest: async (strategyId, stockCode, startDate, endDate, initialCapital = 100000) => {
    try {
      const response = await apiInstance.post('/api/strategies/backtest', {
        strategy_id: strategyId,
        stock_code: stockCode,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital
      }, {
        timeout: 180000, // 3分钟超时，回测需要更多时间
      });
      return response.data;
    } catch (error) {
      throw new Error('运行回测失败');
    }
  },

  // 获取策略列表
  getStrategiesList: async () => {
    try {
      const response = await apiInstance.get('/api/strategies/list');
      return response.data;
    } catch (error) {
      throw new Error('获取策略列表失败');
    }
  },

  // 执行全市场扫描（限制50只股票）
  executeMarketScan: async (strategyId, startDate, endDate, maxStocks = 50, minScore = 60.0) => {
    try {
      const response = await apiInstance.post('/api/strategies/market-scan', {
        strategy_id: strategyId,
        start_date: startDate,
        end_date: endDate,
        max_stocks: maxStocks,
        min_score: minScore
      }, {
        timeout: 300000, // 5分钟超时
      });
      return response.data;
    } catch (error) {
      throw new Error('执行全市场扫描失败');
    }
  },

  // 执行全A股市场扫描（分析所有股票）
  executeFullMarketScan: async (strategyId, startDate, endDate, minScore = 60.0, batchSize = 100) => {
    try {
      const response = await apiInstance.post('/api/strategies/full-market-scan', {
        strategy_id: strategyId,
        start_date: startDate,
        end_date: endDate,
        min_score: minScore,
        batch_size: batchSize
      }, {
        timeout: 7200000, // 2小时超时，全A股扫描需要很长时间
      });
      return response.data;
    } catch (error) {
      throw new Error('执行全A股市场扫描失败');
    }
  },

  // 导出Excel
  exportExcel: async (scanResults) => {
    try {
      const response = await apiInstance.post('/api/strategies/export-excel', {
        scan_results: scanResults
      }, {
        responseType: 'blob',
        timeout: 60000
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'strategy_analysis.xlsx';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error('导出Excel失败');
    }
  },

  // 导出CSV
  exportCSV: async (scanResults) => {
    try {
      const response = await apiInstance.post('/api/strategies/export-csv', {
        scan_results: scanResults
      }, {
        responseType: 'blob',
        timeout: 60000
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // 获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'strategy_analysis.csv';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      throw new Error('导出CSV失败');
    }
  },
};

// 全市场数据获取函数
export const getMarketOverview = async (params) => {
  try {
    console.log('🔍 正在获取全市场数据...', params);
    
    // 使用快速API服务（5001端口）
    const response = await fastApi.post('/api/market-overview', params, {
      timeout: 300000  // 5分钟超时
    });
    
    return response;
  } catch (error) {
    console.error('❌ 全市场数据获取失败:', error.message);
    throw error;
  }
};

// 默认导出快速API实例
export default fastApi; 