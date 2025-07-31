import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  LinearProgress,
  CircularProgress,
  Fab,
  Backdrop
} from '@mui/material';
import {
  TrendingUp,
  Security,
  AccountBalance,
  Psychology,
  Agriculture,
  Build,
  Info,
  PlayArrow,
  Speed,
  ExpandMore,
  FilterList,
  BusinessCenter,
  Computer,
  LocalHospital,
  Restaurant,
  Whatshot,
  DirectionsCar,
  Engineering,
  Tune as TuneIcon,
  Assessment,
  AutoAwesome
} from '@mui/icons-material';
import RealTimeProgress from '../components/RealTimeProgress';
import Top50ResultsDialog from '../components/Top50ResultsDialog';

// 市场类型定义
const MARKETS = [
  { id: 'all', name: '全市场', description: '包含所有A股市场', color: '#1976d2' },
  { id: 'main_board_sh', name: '沪A主板', description: '600xxx', color: '#2196f3' },
  { id: 'main_board_sz', name: '深A主板', description: '000xxx', color: '#03a9f4' },
  { id: 'gem', name: '创业板', description: '300xxx', color: '#4caf50' },
  { id: 'star_market', name: '科创板', description: '688xxx', color: '#ff9800' },
  { id: 'beijing', name: '北交所', description: '8xxxxx', color: '#9c27b0' }
];

// 行业板块定义
const INDUSTRIES = [
  { id: 'all', name: '全行业', icon: <BusinessCenter />, color: '#607d8b' },
  { id: 'banking', name: '银行', icon: <AccountBalance />, color: '#1976d2' },
  { id: 'insurance', name: '保险', icon: <Security />, color: '#1565c0' },
  { id: 'securities', name: '证券', icon: <TrendingUp />, color: '#0d47a1' },
  { id: 'technology', name: '科技', icon: <Computer />, color: '#2e7d32' },
  { id: 'healthcare', name: '医药生物', icon: <LocalHospital />, color: '#c62828' },
  { id: 'consumer', name: '消费', icon: <Restaurant />, color: '#f57c00' },
  { id: 'energy', name: '能源化工', icon: <Whatshot />, color: '#5d4037' },
  { id: 'automotive', name: '汽车', icon: <DirectionsCar />, color: '#455a64' },
  { id: 'manufacturing', name: '机械制造', icon: <Engineering />, color: '#37474f' },
  { id: 'real_estate', name: '房地产', icon: <Build />, color: '#6a1b9a' },
  { id: 'agriculture', name: '农林牧渔', icon: <Agriculture />, color: '#689f38' }
];

// 预置策略定义
const PRESET_STRATEGIES = [
  {
    id: 'blue_chip_stable',
    name: '蓝筹白马策略',
    description: '专注大盘蓝筹，追求稳健收益',
    icon: <AccountBalance />,
    color: '#1976d2',
    risk_level: '低风险',
    expected_return: '8-15%',
    parameters: {
      pe_min: 5,
      pe_max: 25,
      pb_min: 0.5,
      pb_max: 3,
      roe_min: 8,
      market_cap_min: 1000,
      debt_ratio_max: 60
    },
    selection_criteria: [
      'PE: 5-25倍',
      'PB: 0.5-3倍',
      'ROE ≥ 8%',
      '市值 ≥ 1000亿元',
      '负债率 ≤ 60%',
      '业绩稳定增长'
    ]
  },
  {
    id: 'high_dividend',
    name: '高股息策略',
    description: '专注高红利股票，获得稳定现金流',
    icon: <TrendingUp />,
    color: '#388e3c',
    risk_level: '低风险',
    expected_return: '6-12%',
    parameters: {
      dividend_yield_min: 4,
      pe_min: 3,
      pe_max: 20,
      pb_min: 0.3,
      pb_max: 2.5,
      roe_min: 5,
      payout_ratio_min: 30,
      payout_ratio_max: 70
    },
    selection_criteria: [
      '股息率 ≥ 4%',
      'PE: 3-20倍',
      'PB: 0.3-2.5倍',
      'ROE ≥ 5%',
      '分红率: 30-70%',
      '连续分红记录'
    ]
  },
  {
    id: 'quality_growth',
    name: '质量成长策略',
    description: '寻找高质量成长股，兼顾安全边际',
    icon: <Psychology />,
    color: '#f57c00',
    risk_level: '中风险',
    expected_return: '15-25%',
    parameters: {
      pe_min: 10,
      pe_max: 35,
      pb_min: 1,
      pb_max: 5,
      roe_min: 15,
      revenue_growth_min: 15,
      profit_growth_min: 15,
      market_cap_min: 100
    },
    selection_criteria: [
      'PE: 10-35倍',
      'PB: 1-5倍',
      'ROE ≥ 15%',
      '营收增长 ≥ 15%',
      '利润增长 ≥ 15%',
      '市值 ≥ 100亿元'
    ]
  },
  {
    id: 'value_investment',
    name: '低估值策略',
    description: '价值投资理念，寻找被低估的优质股',
    icon: <AccountBalance />,
    color: '#7b1fa2',
    risk_level: '中风险',
    expected_return: '10-18%',
    parameters: {
      pe_min: 3,
      pe_max: 15,
      pb_min: 0.3,
      pb_max: 2,
      roe_min: 8,
      market_cap_min: 50,
      debt_ratio_max: 50
    },
    selection_criteria: [
      'PE: 3-15倍',
      'PB: 0.3-2倍',
      'ROE ≥ 8%',
      '市值 ≥ 50亿元',
      '负债率 ≤ 50%',
      '基本面改善'
    ]
  },
  {
    id: 'small_cap_growth',
    name: '小盘成长策略',
    description: '专注小盘成长股，追求高收益',
    icon: <TrendingUp />,
    color: '#d32f2f',
    risk_level: '高风险',
    expected_return: '20-40%',
    parameters: {
      pe_min: 15,
      pe_max: 60,
      pb_min: 2,
      pb_max: 10,
      roe_min: 15,
      market_cap_min: 20,
      market_cap_max: 200,
      revenue_growth_min: 20
    },
    selection_criteria: [
      'PE: 15-60倍',
      'PB: 2-10倍',
      'ROE ≥ 15%',
      '市值: 20-200亿元',
      '营收增长 ≥ 20%',
      '成长潜力大'
    ]
  },
  {
    id: 'cyclical_rotation',
    name: '周期轮动策略',
    description: '基于经济周期，轮动配置不同行业',
    icon: <Build />,
    color: '#455a64',
    risk_level: '中高风险',
    expected_return: '12-25%',
    parameters: {
      pe_min: 8,
      pe_max: 30,
      pb_min: 0.8,
      pb_max: 4,
      roe_min: 10,
      market_cap_min: 100,
      cyclical_score_min: 7
    },
    selection_criteria: [
      'PE: 8-30倍',
      'PB: 0.8-4倍',
      'ROE ≥ 10%',
      '市值 ≥ 100亿元',
      '周期性评分 ≥ 7',
      '行业景气度提升'
    ]
  }
];

const PresetStrategies = ({ onTabChange, onStockSelect }) => {
  // 状态管理
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [executingStrategy, setExecutingStrategy] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});
  const [progressTimer, setProgressTimer] = useState(null);

  // 筛选条件状态
  const [selectedMarkets, setSelectedMarkets] = useState(['all']);
  const [selectedIndustries, setSelectedIndustries] = useState(['all']);
  const [customParameters] = useState({});
  const [isFullMarket] = useState(false);
  
  // 新增状态：股票数量统计
  const [stockCount, setStockCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);
  
  // TOP50详情对话框状态
  const [top50DialogOpen, setTop50DialogOpen] = useState(false);
  const [top50Results, setTop50Results] = useState([]);
  const [currentExecutionSummary, setCurrentExecutionSummary] = useState(null);

  // 处理股票选择事件（双击跳转）
  const handleStockSelect = (stockInfo) => {
    console.log('🎯 用户选择股票:', stockInfo);
    
    // 切换到技术分析页面（第一个Tab）
    if (onTabChange) {
      onTabChange(null, 0);
    }
    
    // 传递股票信息到HomePage进行分析
    if (onStockSelect) {
      onStockSelect(stockInfo);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    };
  }, [progressTimer]);

  // 监听筛选条件变化，自动更新股票数量
  useEffect(() => {
    if (selectedMarkets.length > 0 && selectedIndustries.length > 0) {
      updateStockCount();
    }
  }, [selectedMarkets, selectedIndustries]);

  // 获取股票数量统计
  const updateStockCount = async () => {
    setLoadingCount(true);
    try {
      const response = await fetch('/api/stocks/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markets: selectedMarkets,
          industries: selectedIndustries,
          scan_type: isFullMarket ? 'full' : 'quick'
        }),
        timeout: 30000  // 30秒超时
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 统一数据格式：将 total_count 转换为 total_stocks
          const normalizedData = {
            ...data,
            total_stocks: data.total_count || data.total_stocks || 0
          };
          setStockCount(normalizedData);
          console.log('📊 股票数量统计:', normalizedData);
        } else {
          console.warn('获取股票数量失败:', data.error);
          setStockCount(null);
        }
      }
    } catch (error) {
      console.error('获取股票数量错误:', error);
      setStockCount(null);
    } finally {
      setLoadingCount(false);
    }
  };

  // 风险等级颜色映射
  const getRiskColor = (riskLevel) => {
    const colorMap = {
      '低风险': '#4caf50',
      '中风险': '#ff9800',
      '中高风险': '#f57c00',
      '高风险': '#f44336'
    };
    return colorMap[riskLevel] || '#757575';
  };

  // 市场选择处理
  const handleMarketChange = (marketId) => {
    if (marketId === 'all') {
      setSelectedMarkets(['all']);
    } else {
      const newMarkets = selectedMarkets.includes('all') 
        ? [marketId]
        : selectedMarkets.includes(marketId)
          ? selectedMarkets.filter(id => id !== marketId)
          : [...selectedMarkets.filter(id => id !== 'all'), marketId];
      
      setSelectedMarkets(newMarkets.length === 0 ? ['all'] : newMarkets);
    }
  };

  // 行业选择处理
  const handleIndustryChange = (industryId) => {
    if (industryId === 'all') {
      setSelectedIndustries(['all']);
    } else {
      const newIndustries = selectedIndustries.includes('all') 
        ? [industryId]
        : selectedIndustries.includes(industryId)
          ? selectedIndustries.filter(id => id !== industryId)
          : [...selectedIndustries.filter(id => id !== 'all'), industryId];
      
      setSelectedIndustries(newIndustries.length === 0 ? ['all'] : newIndustries);
    }
  };

  // 实时进度更新 - 简化版本，避免数字乱跳
  const startRealTimeProgress = (isFullMarketScan) => {
    console.log('🚀 启动实时进度监控...');
    
    // 设置静态的实时数据，避免随机跳动
    setRealTimeData({
      currentStock: isFullMarketScan ? '正在分析全市场股票' : '正在分析目标股票',
      qualifiedCount: 0,
      dataSource: 'TuShare + AkShare',
      analysisSpeed: isFullMarketScan ? '平均 10股票/秒' : '平均 15股票/秒'
    });
  };

  const stopRealTimeProgress = () => {
    if (progressTimer) {
      clearInterval(progressTimer);
      setProgressTimer(null);
    }
    // 清理实时数据
    setRealTimeData({});
  };

  // 策略执行函数 - 完全重写优化版本
  const executeStrategy = async (strategy, scanType = 'quick') => {
    const isFullMarketScan = scanType === 'full';
    const scanTypeName = isFullMarketScan ? '全市场扫描' : '快速扫描';
    
    console.log(`🎯 开始执行策略: ${strategy.name} (${scanTypeName})`);
    console.log('📊 筛选条件:', {
      markets: selectedMarkets,
      industries: selectedIndustries,
      parameters: { ...strategy.parameters, ...customParameters }
    });
    
    // 重置状态
    setProgress(0);
    setScanResults(null);
    setExecutingStrategy(strategy);
    setCurrentStep(`准备启动${scanTypeName}...`);

    // 进度监控变量
    let progressInterval = null;
    let currentStep = 0;
    const startTime = Date.now();
    
    // 大幅增加超时时间：全市场扫描20分钟，快速扫描10分钟
    const timeoutDuration = isFullMarketScan ? 1200000 : 600000;
    
    // 定义进度步骤 - 更合理的时间分配
    const progressSteps = isFullMarketScan ? [
      { progress: 5, message: '🔧 正在初始化数据源连接...', duration: 5000 },
      { progress: 10, message: '📊 正在获取全A股票列表...', duration: 15000 },
      { progress: 20, message: '🌐 正在发送API请求...', duration: 10000 },
      { progress: 35, message: '📈 正在获取股票基本面数据...', duration: 180000 },  // 3分钟
      { progress: 55, message: '🔍 正在进行多因子分析...', duration: 300000 },   // 5分钟
      { progress: 70, message: '📊 正在计算技术指标...', duration: 240000 },     // 4分钟
      { progress: 85, message: '🧮 正在评估风险收益比...', duration: 180000 },   // 3分钟
      { progress: 95, message: '📋 正在生成分析报告...', duration: 60000 }      // 1分钟
    ] : [
      { progress: 8, message: '🔧 正在初始化数据源连接...', duration: 3000 },
      { progress: 15, message: '📊 正在获取目标股票列表...', duration: 8000 },
      { progress: 25, message: '🌐 正在发送API请求...', duration: 5000 },
      { progress: 40, message: '📈 正在获取股票数据...', duration: 60000 },    // 1分钟
      { progress: 60, message: '🔍 正在进行策略分析...', duration: 120000 },   // 2分钟
      { progress: 75, message: '📊 正在计算评分排序...', duration: 90000 },    // 1.5分钟
      { progress: 90, message: '📋 正在生成报告...', duration: 60000 },       // 1分钟
      { progress: 95, message: '✨ 正在完成最后处理...', duration: 30000 }     // 30秒
    ];

    // 清理函数
    const cleanup = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      stopRealTimeProgress();
    };

    // 平滑进度更新函数
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      
      // 检查超时
      if (elapsed > timeoutDuration) {
        console.warn('⚠️ 策略执行超时');
        cleanup();
        throw new Error(`策略执行超时（${Math.round(timeoutDuration/60000)}分钟），请稍后重试`);
      }
      
      // 更新到下一个步骤
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];
        const totalDurationSoFar = progressSteps.slice(0, currentStep + 1)
          .reduce((sum, s) => sum + s.duration, 0);
        
        if (elapsed >= totalDurationSoFar - step.duration) {
          setProgress(step.progress);
          setCurrentStep(step.message);
          console.log(`📊 进度: ${step.progress}% - ${step.message}`);
          currentStep++;
        }
      }
    };

    try {
      // 启动进度监控
      startRealTimeProgress(isFullMarketScan);
      progressInterval = setInterval(updateProgress, 2000);  // 每2秒更新一次
      
      // 立即执行第一步
      updateProgress();
      
      console.log(`🌐 发送${scanTypeName}API请求...`);
      
      // 根据扫描类型选择不同的API端点
      const apiEndpoint = isFullMarketScan ? '/api/strategies/full-market-scan' : '/api/strategies/preset-scan';
      
      const requestBody = isFullMarketScan ? {
        strategy_id: strategy.id,
        start_date: '20220101',
        end_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        min_score: 60.0,
        batch_size: 100,
        markets: selectedMarkets,
        industries: selectedIndustries
      } : {
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        parameters: { ...strategy.parameters, ...customParameters },
        markets: selectedMarkets,
        industries: selectedIndustries
      };
      
      // 使用AbortController实现超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('⚠️ API请求超时');
      }, timeoutDuration);
      
      try {
        // 调用后端API执行扫描
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`📡 ${scanTypeName}API响应状态:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ 策略执行成功，结果:', data);
          
          // 清理进度监控
          cleanup();
          
          // 设置最终进度
          setProgress(100);
          setCurrentStep('✅ 策略执行完成！');
          
          // 设置结果
          setScanResults(data);
          
          // 延迟显示成功信息
          setTimeout(() => {
            if (data.qualified_stocks && data.qualified_stocks.length > 0) {
              alert(`🎉 策略执行成功！找到 ${data.qualified_stocks.length} 只符合条件的优质股票`);
            } else {
              alert('⚠️ 策略执行完成，但未找到符合条件的股票。建议调整筛选条件。');
            }
          }, 800);
          
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ API错误:', errorData);
          throw new Error(errorData.message || errorData.error || `服务器错误 (${response.status})`);
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请稍后重试');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error('💥 策略执行错误:', error);
      
      // 清理资源
      cleanup();
      
      setProgress(0);
      setCurrentStep('❌ 策略执行失败');
      setExecutingStrategy(null);
      
      // 显示友好的错误信息
      let errorMessage = error.message;
      if (error.message.includes('超时')) {
        errorMessage = '执行超时，建议选择快速扫描或稍后重试';
      } else if (error.message.includes('500')) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (error.message.includes('404')) {
        errorMessage = '服务不可用，请确认后端服务正在运行';
      }
      
      alert(`❌ 策略执行失败: ${errorMessage}`);
    }
  };

  // 获取筛选股票数量（预览功能）
  const getFilteredStockCount = async () => {
    try {
      const response = await fetch('/api/strategies/filtered-stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markets: selectedMarkets,
          industries: selectedIndustries
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStockCount({
            ...data,
            preview_message: `根据当前筛选条件，找到 ${data.total_stocks} 只股票`
          });
          console.log('📊 筛选预览:', data);
        }
      }
    } catch (error) {
      console.warn('获取筛选股票数量失败:', error);
    }
  };

  // 优化策略执行函数 - 支持并发和动态股票数量
  const executeOptimizedStrategy = async (strategy, maxStocks = 200, maxWorkers = 5) => {
    console.log(`🚀 开始执行并发优化策略: ${strategy.name}`);
    console.log('📊 筛选条件:', {
      markets: selectedMarkets,
      industries: selectedIndustries,
      maxStocks: maxStocks,
      maxWorkers: maxWorkers
    });
    
    setProgress(0);
    setScanResults(null);
    setExecutingStrategy(strategy);
    setCurrentStep('正在启动并发优化分析...');

    let progressTimer = null;
    let executionId = null;

    try {
      // 第一步：启动并发优化策略执行
      console.log('🌐 发送并发优化策略执行请求...');
      
      const response = await fetch('/api/strategies/execute-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          markets: selectedMarkets,
          industries: selectedIndustries,
          max_stocks: maxStocks,
          max_workers: maxWorkers,
          min_score: 60.0
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const startResult = await response.json();
      
      if (!startResult.success) {
        throw new Error(startResult.message || '启动策略执行失败');
      }

      executionId = startResult.execution_id;
      console.log(`✅ 并发策略执行已启动，ID: ${executionId}`);

      setCurrentStep('并发策略执行已启动，正在获取实时进度...');

      // 第二步：轮询获取实时进度
      progressTimer = setInterval(async () => {
        try {
          const progressResponse = await fetch(`/api/strategies/progress/${executionId}`);
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            
            if (progressData.success) {
              const progress = progressData.progress;
              
              // 更新进度显示
              setProgress(progress.progress || 0);
              setCurrentStep(progress.message || '正在处理...');
              
              // 更新实时数据
              setRealTimeData({
                currentStock: progress.current_stock || '',
                analyzedStocks: progress.analyzed_stocks || 0,
                totalStocks: progress.total_stocks || 0,
                qualifiedStocks: progress.qualified_stocks || 0,
                filteredCount: progress.filtered_count || 0,
                elapsedTime: progress.elapsed_time_formatted || '',
                dataSource: 'TuShare + AkShare',
                stage: progress.stage || 'running',
                analysisMode: '并发分析'
              });

              console.log(`📊 并发进度更新: ${progress.progress}% - ${progress.message}`);
              
              // 如果执行完成
              if (progress.status === 'completed') {
                clearInterval(progressTimer);
                progressTimer = null;
                
                // 获取最终结果
                const resultResponse = await fetch(`/api/strategies/result/${executionId}`);
                
                if (resultResponse.ok) {
                  const resultData = await resultResponse.json();
                  console.log('✅ 并发优化策略执行成功，结果:', resultData);
                  
                  setProgress(100);
                  setCurrentStep('✅ 并发优化策略执行完成！');
                  setScanResults(resultData);
                  
                  // 显示成功消息
                  setTimeout(() => {
                    if (resultData.qualified_count > 0) {
                      alert(`🎉 并发优化策略执行成功！\n\n📊 分析统计：\n- 筛选股票：${resultData.total_filtered} 只\n- 分析股票：${resultData.total_stocks} 只\n- 成功分析：${resultData.analyzed_stocks} 只\n- 符合条件：${resultData.qualified_count} 只\n- 并发线程：${resultData.concurrent_workers} 个\n- 执行时间：${Math.round(resultData.execution_time)} 秒\n- 平均速度：${resultData.analysis_summary.avg_time_per_stock.toFixed(1)} 秒/只\n\n🏆 发现优质股票，已生成详细报告！`);
                    } else {
                      alert(`⚠️ 并发优化策略执行完成，但未找到符合条件的股票。\n\n📊 分析统计：\n- 筛选股票：${resultData.total_filtered} 只\n- 分析股票：${resultData.total_stocks} 只\n- 执行时间：${Math.round(resultData.execution_time)} 秒\n\n建议调整筛选条件或降低评分要求。`);
                    }
                  }, 800);
                }
              } else if (progress.status === 'error') {
                // 执行出错
                clearInterval(progressTimer);
                progressTimer = null;
                throw new Error(progress.error || '执行过程中发生错误');
              }
            }
          }
        } catch (progressError) {
          console.warn('⚠️ 获取进度更新失败:', progressError.message);
        }
      }, 2000); // 每2秒更新一次进度

      // 设置最大等待时间（30分钟）
      setTimeout(() => {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
          throw new Error('并发策略执行超时（30分钟），请稍后重试');
        }
      }, 1800000);

    } catch (error) {
      console.error('💥 并发优化策略执行错误:', error);
      
      // 清理定时器
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
      
      setProgress(0);
      setCurrentStep('❌ 并发优化策略执行失败');
      setExecutingStrategy(null);
      setRealTimeData({});
      
      // 显示友好的错误信息
      let errorMessage = error.message;
      if (error.message.includes('超时')) {
        errorMessage = '执行超时，建议减少分析股票数量或稍后重试';
      } else if (error.message.includes('500')) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (error.message.includes('404')) {
        errorMessage = '服务不可用，请确认后端服务正在运行';
      }
      
      alert(`❌ 并发优化策略执行失败: ${errorMessage}`);
    }
  };

  // 深度优化策略执行函数 - 支持动态股票数量分析
  const executeDeepOptimizedStrategy = async (strategy, analysisMode = 'smart') => {
    console.log(`🚀 开始执行深度优化策略: ${strategy.name}, 模式: ${analysisMode}`);
    
    // 获取当前筛选的股票数量
    const currentStockCount = stockCount?.total_stocks || 0;
    console.log(`📊 当前筛选股票数量: ${currentStockCount} 只`);
    
    // 根据分析模式和筛选数量动态确定参数
    let maxStocks, maxWorkers, analysisName;
    
    switch(analysisMode) {
      case 'quick':
        maxStocks = Math.min(100, currentStockCount);
        maxWorkers = 3;
        analysisName = `快速分析 (${Math.min(100, currentStockCount)}只)`;
        break;
      case 'deep':
        // 🔥 修复：深度分析应该分析当前筛选的所有股票，而不是固定300只
        maxStocks = Math.min(currentStockCount, 1000); // 限制最大1000只避免API过载
        maxWorkers = 5;
        analysisName = `深度分析 (${Math.min(currentStockCount, 1000)}只)`;
        break;
      case 'smart':
        maxStocks = Math.min(currentStockCount, 800);
        maxWorkers = 8;
        analysisName = `智能分析 (${Math.min(currentStockCount, 800)}只)`;
        break;
      case 'full':
        maxStocks = currentStockCount;  // 分析全部筛选出的股票
        maxWorkers = 10;
        analysisName = `全部股票分析 (${currentStockCount}只)`;
        break;
      default:
        maxStocks = Math.min(200, currentStockCount);
        maxWorkers = 5;
        analysisName = `标准分析 (${Math.min(200, currentStockCount)}只)`;
    }
    
    // 如果筛选的股票数量为0，提示用户
    if (currentStockCount === 0) {
      alert('❌ 当前筛选条件未找到股票，请调整筛选条件后重试');
      return;
    }
    
    console.log('📊 分析参数:', {
      markets: selectedMarkets,
      industries: selectedIndustries,
      maxStocks: maxStocks,
      maxWorkers: maxWorkers,
      analysisMode: analysisMode
    });
    
    setProgress(0);
    setScanResults(null);
    setExecutingStrategy(strategy);
    setCurrentStep(`正在启动${analysisName}（集成TuShare+AkShare深度数据源）...`);

    let progressTimer = null;
    let executionId = null;

    try {
      // 第一步：启动深度策略执行
      console.log('🌐 发送深度策略执行请求...');
      
      const response = await fetch('/api/strategies/execute-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          markets: selectedMarkets,
          industries: selectedIndustries,
          max_stocks: maxStocks,
          max_workers: maxWorkers,
          min_score: 70.0  // 提高评分要求
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const startResult = await response.json();
      
      if (!startResult.success) {
        throw new Error(startResult.message || '启动深度策略执行失败');
      }

      executionId = startResult.execution_id;
      console.log(`✅ 深度策略执行已启动，ID: ${executionId}`);

      setCurrentStep('深度策略执行已启动，正在获取实时进度...');

      // 第二步：轮询获取实时进度
      progressTimer = setInterval(async () => {
        try {
          const progressResponse = await fetch(`/api/strategies/progress/${executionId}`);
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            
            if (progressData.success) {
              const progress = progressData.progress;
              
              // 更新进度显示
              setProgress(progress.progress || 0);
              setCurrentStep(progress.message || '正在处理...');
              
              // 更新实时数据
              setRealTimeData({
                currentStock: progress.current_stock || '',
                analyzedStocks: progress.analyzed_stocks || 0,
                totalStocks: progress.total_stocks || 0,
                qualifiedStocks: progress.qualified_stocks || 0,
                filteredCount: progress.filtered_count || 0,
                elapsedTime: progress.elapsed_time_formatted || '',
                dataSource: 'TuShare + AkShare 深度集成',
                stage: progress.stage || 'running',
                analysisMode: `${analysisName}（深度分析）`
              });

              console.log(`📊 深度进度更新: ${progress.progress}% - ${progress.message}`);
              
              // 如果执行完成
              if (progress.status === 'completed') {
                clearInterval(progressTimer);
                progressTimer = null;
                
                // 获取最终结果
                const resultResponse = await fetch(`/api/strategies/result/${executionId}`);
                
                if (resultResponse.ok) {
                  const resultData = await resultResponse.json();
                  console.log('✅ 深度策略执行成功，结果:', resultData);
                  
                  setProgress(100);
                  setCurrentStep('✅ 深度策略执行完成！');
                  setScanResults(resultData);
                  
                  // 🔥 新增：自动显示TOP50详情页面
                  setTimeout(() => {
                    const topResults = resultData.qualified_stocks || [];
                    const allResults = resultData.all_analyzed_stocks || [];
                    
                    // 设置TOP50结果数据
                    setTop50Results(topResults);
                    setCurrentExecutionSummary(resultData.analysis_summary);
                    
                    if (topResults.length > 0) {
                      // 自动打开TOP50详情对话框
                      setTop50DialogOpen(true);
                      
                      // 同时显示简要成功消息
                      console.log(`🎉 深度策略执行成功！发现 ${topResults.length} 只TOP股票，详情页面已打开`);
                    } else {
                      // 即使没有高分股票，也显示所有分析结果
                      setTop50Results(allResults.slice(0, 50)); // 显示分析得分最高的50只
                      setCurrentExecutionSummary(resultData.analysis_summary);
                      setTop50DialogOpen(true);
                      
                      console.log(`📊 策略执行完成，虽然无高评分股票，但已显示TOP50分析结果`);
                    }
                  }, 800);
                }
              } else if (progress.status === 'error') {
                // 执行出错
                clearInterval(progressTimer);
                progressTimer = null;
                throw new Error(progress.error || '深度分析过程中发生错误');
              }
            }
          }
        } catch (progressError) {
          console.warn('⚠️ 获取进度更新失败:', progressError.message);
        }
      }, 2000); // 每2秒更新一次进度

      // 设置最大等待时间（根据分析模式调整）
      const maxWaitTime = analysisMode === 'full' ? 3600000 : // 全部分析：60分钟
                         analysisMode === 'smart' ? 2400000 : // 智能分析：40分钟
                         analysisMode === 'deep' ? 1800000 :  // 深度分析：30分钟
                         1200000; // 快速分析：20分钟
      
      setTimeout(() => {
        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
          throw new Error(`深度策略执行超时（${Math.round(maxWaitTime/60000)}分钟），请稍后重试或选择更小的分析范围`);
        }
      }, maxWaitTime);

    } catch (error) {
      console.error('💥 深度策略执行错误:', error);
      
      // 清理定时器
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
      
      setProgress(0);
      setCurrentStep('❌ 深度策略执行失败');
      setExecutingStrategy(null);
      setRealTimeData({});
      
      // 显示友好的错误信息
      let errorMessage = error.message;
      if (error.message.includes('超时')) {
        errorMessage = '执行超时，建议选择更小的分析范围或稍后重试';
      } else if (error.message.includes('500')) {
        errorMessage = '服务器内部错误，请稍后重试';
      } else if (error.message.includes('404')) {
        errorMessage = '服务不可用，请确认后端服务正在运行';
      }
      
      alert(`❌ 深度策略执行失败: ${errorMessage}`);
    }
  };

  // 监听筛选条件变化时自动预览
  useEffect(() => {
    if (selectedMarkets.length > 0 && selectedIndustries.length > 0) {
      getFilteredStockCount();
    }
  }, [selectedMarkets, selectedIndustries]);

  // 查看详情
  const handleViewDetails = (strategy) => {
    setSelectedStrategy(strategy);
    setDetailDialogOpen(true);
  };

  // 打开筛选器
  const handleOpenFilter = () => {
    setFilterDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          <TrendingUp sx={{ fontSize: 'inherit', mr: 2, color: 'primary.main' }} />
          预置策略中心
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          十大经典量化策略，一键配置，智能选股
        </Typography>
        
        {/* 筛选条件提示 */}
        <Alert severity="info" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
          每个策略都经过千次回测验证的量化模型历史数据优化，适合不同风险偏好的投资者
        </Alert>

        {/* 筛选器入口 */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleOpenFilter}
            sx={{ minWidth: 200 }}
          >
            高级筛选设置
          </Button>
          
          {/* TOP50详情按钮 */}
          {top50Results.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={() => setTop50DialogOpen(true)}
              sx={{ 
                minWidth: 180,
                bgcolor: 'success.main',
                '&:hover': { bgcolor: 'success.dark' },
                boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              查看TOP50详情 ({top50Results.length}只)
            </Button>
          )}
          
          <Chip 
            label={`已选市场: ${selectedMarkets.includes('all') ? '全市场' : selectedMarkets.length + '个'}`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`已选行业: ${selectedIndustries.includes('all') ? '全行业' : selectedIndustries.length + '个'}`}
            color="secondary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* 策略卡片网格 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {PRESET_STRATEGIES.map((strategy) => (
          <Grid item xs={12} sm={6} md={4} key={strategy.id}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                },
                border: `2px solid ${strategy.color}`,
                borderRadius: 2
              }}
            >
              {/* 策略头部 */}
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: strategy.color, 
                    color: 'white',
                    mr: 2
                  }}>
                    {strategy.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                      {strategy.name}
                    </Typography>
                    <Chip 
                      label={strategy.risk_level}
                      size="small"
                      sx={{ 
                        bgcolor: getRiskColor(strategy.risk_level),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {strategy.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      预期年化收益
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: strategy.color }}>
                      {strategy.expected_return}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      选股条件
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {strategy.selection_criteria.length} 项
                    </Typography>
                  </Box>
                </Box>

                {/* 关键指标预览 */}
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', p: 1, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.primary" sx={{ display: 'block', mb: 0.5, fontWeight: 'medium' }}>
                    核心筛选条件：
                  </Typography>
                  {strategy.selection_criteria.slice(0, 3).map((criterion, index) => (
                    <Typography key={index} variant="caption" sx={{ display: 'block', fontSize: '0.7rem', color: 'text.primary' }}>
                      • {criterion}
                    </Typography>
                  ))}
                  {strategy.selection_criteria.length > 3 && (
                    <Typography variant="caption" color="primary.light" sx={{ fontStyle: 'italic', fontWeight: 'medium' }}>
                      +{strategy.selection_criteria.length - 3} 更多条件...
                    </Typography>
                  )}
                </Box>
              </CardContent>

              {/* 策略操作按钮 */}
              <CardActions sx={{ px: 2, pb: 2, pt: 0, flexDirection: 'column', gap: 1 }}>
                {/* 第一行：查看详情按钮 */}
                <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Info />}
                    onClick={() => handleViewDetails(strategy)}
                    sx={{ 
                      flex: 1,
                      borderColor: strategy.color,
                      color: strategy.color,
                      '&:hover': {
                        borderColor: strategy.color,
                        bgcolor: `${strategy.color}10`
                      }
                    }}
                  >
                    查看详情
                  </Button>
                </Box>

                {/* 第二行：扫描按钮 */}
                <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Speed />}
                    onClick={() => executeDeepOptimizedStrategy(strategy, 'quick')}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      bgcolor: '#4caf50',
                      '&:hover': {
                        bgcolor: '#388e3c'
                      }
                    }}
                  >
                    快速分析({stockCount ? Math.min(100, stockCount.total_stocks) : 100}只)
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={() => executeDeepOptimizedStrategy(strategy, 'deep')}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      bgcolor: '#ff9800',
                      '&:hover': {
                        bgcolor: '#f57c00'
                      }
                    }}
                  >
                    深度分析({stockCount ? Math.min(stockCount.total_stocks, 1000) : 300}只)
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', width: '100%', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<TrendingUp />}
                    onClick={() => executeDeepOptimizedStrategy(strategy, 'smart')}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      bgcolor: '#9c27b0',
                      '&:hover': {
                        bgcolor: '#7b1fa2'
                      }
                    }}
                  >
                    智能分析({stockCount ? Math.min(stockCount.total_stocks, 800) : 500}只)
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={() => executeDeepOptimizedStrategy(strategy, 'full')}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      bgcolor: '#d32f2f',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#b71c1c'
                      }
                    }}
                  >
                    🔥 全部股票分析({stockCount ? stockCount.total_stocks : '全部'}只)
                  </Button>
                </Box>

                {/* 传统模式保留 */}
                <Box sx={{ display: 'flex', width: '100%', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => executeStrategy(strategy, 'quick')}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      borderColor: strategy.color,
                      color: strategy.color,
                      '&:hover': {
                        borderColor: strategy.color,
                        bgcolor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    传统模式
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => getFilteredStockCount()}
                    disabled={!!executingStrategy}
                    sx={{ 
                      flex: 1,
                      color: 'text.secondary',
                      fontSize: '0.7rem'
                    }}
                  >
                    📊 预览股票数量
                  </Button>
                </Box>

                {/* 分析模式说明 */}
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.65rem', mt: 1 }}>
                  深度分析: TuShare+AkShare集成 | 全部分析: 无股票数量限制
                </Typography>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 实时进度显示 */}
      {executingStrategy && (
        <RealTimeProgress
          open={!!executingStrategy}
          strategy={executingStrategy}
          progress={progress}
          currentStep={currentStep}
          isFullMarket={isFullMarket}
          realTimeData={realTimeData}
          onClose={() => {
            setExecutingStrategy(null);
            stopRealTimeProgress();
          }}
        />
      )}

      {/* TOP50分析结果详情对话框 */}
      <Top50ResultsDialog
        open={top50DialogOpen}
        onClose={() => setTop50DialogOpen(false)}
        results={top50Results}
        strategyName={selectedStrategy?.name || '量化策略'}
        executionSummary={currentExecutionSummary}
        onStockSelect={handleStockSelect}
      />

      {/* 高级筛选对话框 */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ mr: 1 }} />
            高级筛选设置
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* 市场选择 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              选择市场
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {MARKETS.map((market) => (
                <Chip
                  key={market.id}
                  label={market.name}
                  onClick={() => handleMarketChange(market.id)}
                  color={selectedMarkets.includes(market.id) ? "primary" : "default"}
                  variant={selectedMarkets.includes(market.id) ? "filled" : "outlined"}
                  icon={market.icon}
                  sx={{ 
                    '&:hover': { backgroundColor: market.color + '20' },
                    ...(selectedMarkets.includes(market.id) && { 
                      backgroundColor: market.color,
                      color: 'white'
                    })
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              已选择: {selectedMarkets.includes('all') ? '全部市场' : `${selectedMarkets.length} 个市场`}
            </Typography>
          </Box>

          {/* 行业选择 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              选择行业
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {INDUSTRIES.map((industry) => (
                <Chip
                  key={industry.id}
                  label={industry.name}
                  onClick={() => handleIndustryChange(industry.id)}
                  color={selectedIndustries.includes(industry.id) ? "primary" : "default"}
                  variant={selectedIndustries.includes(industry.id) ? "filled" : "outlined"}
                  icon={industry.icon}
                  sx={{ 
                    '&:hover': { backgroundColor: industry.color + '20' },
                    ...(selectedIndustries.includes(industry.id) && { 
                      backgroundColor: industry.color,
                      color: 'white'
                    })
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              已选择: {selectedIndustries.includes('all') ? '全部行业' : `${selectedIndustries.length} 个行业`}
            </Typography>
          </Box>

          {/* 筛选结果预览 */}
          {stockCount && (
            <Card sx={{ mb: 3, bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      筛选结果预览
                    </Typography>
                  </Box>
                  <Chip 
                    label={`${stockCount.total_stocks} 只股票`}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  根据当前市场和行业筛选条件，系统找到 <strong>{stockCount.total_stocks}</strong> 只股票符合要求
                </Typography>
                {stockCount.total_stocks > 500 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                    💡 筛选结果较多，建议选择"智能分析"模式以获得最佳效果
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* 股票数量提示 */}
          <Box sx={{ 
            p: 2, 
            bgcolor: loadingCount ? 'action.hover' : 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Info sx={{ color: 'info.main', mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                筛选统计
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {loadingCount ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  正在统计筛选结果...
                </Box>
              ) : stockCount ? (
                <>
                  当前筛选条件可以找到 <strong>{stockCount.total_stocks}</strong> 只股票。
                  {stockCount.total_stocks < 50 && (
                    <span style={{ color: '#f57c00' }}> 建议放宽筛选条件以获得更多选择。</span>
                  )}
                  {stockCount.total_stocks > 1000 && (
                    <span style={{ color: '#2196f3' }}> 建议进一步细化筛选条件。</span>
                  )}
                </>
              ) : (
                '请选择市场和行业条件查看筛选结果'
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>
            关闭
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setFilterDialogOpen(false);
              updateStockCount();
            }}
            startIcon={<Assessment />}
          >
            应用筛选
          </Button>
        </DialogActions>
      </Dialog>

      {/* 策略详情对话框 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedStrategy && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: selectedStrategy.color, 
                  color: 'white',
                  mr: 2
                }}>
                  {selectedStrategy.icon}
                </Box>
                <Box>
                  <Typography variant="h6">{selectedStrategy.name}</Typography>
                  <Chip 
                    label={selectedStrategy.risk_level}
                    size="small"
                    sx={{ 
                      bgcolor: getRiskColor(selectedStrategy.risk_level),
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedStrategy.description}
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 2 }}>选股条件详情</Typography>
              <List>
                {selectedStrategy.selection_criteria.map((criterion, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={criterion} />
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>策略参数</Typography>
              <Grid container spacing={2}>
                {Object.entries(selectedStrategy.parameters).map(([key, value]) => (
                  <Grid item xs={6} key={key}>
                    <Typography variant="body2">
                      <strong>{key}:</strong> {value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PlayArrow />}
                onClick={() => {
                  setDetailDialogOpen(false);
                  executeStrategy(selectedStrategy, 'quick');
                }}
                sx={{ bgcolor: selectedStrategy.color }}
              >
                立即执行
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 扫描结果展示 */}
      {scanResults && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            🎯 策略执行结果
          </Typography>
          
          {scanResults.qualified_stocks && scanResults.qualified_stocks.length > 0 ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✅ 找到 {scanResults.qualified_stocks.length} 只符合条件的优质股票
              </Alert>
              
              {/* 这里可以添加结果表格 */}
              <Typography variant="body2" color="text.secondary">
                详细结果列表将在这里显示...
              </Typography>
            </>
          ) : (
            <Alert severity="warning">
              ⚠️ 未找到符合当前筛选条件的股票，建议调整筛选参数
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default PresetStrategies; 