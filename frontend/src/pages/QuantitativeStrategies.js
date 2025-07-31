import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Container,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  ShowChart,
  Timeline,
  Speed,
  AccountBalance,
  Psychology,
  Settings,
  AutoGraph,
  Insights,
  CandlestickChart,
  PlayArrow,
  Info,
  Star,
  Assessment,
  Search,
} from '@mui/icons-material';
import StrategyConfigDialog from '../components/StrategyConfigDialog';
import MarketScanResultDialog from '../components/MarketScanResultDialog';
import { strategyAPI, stockAPI } from '../utils/api';

function QuantitativeStrategies() {
  const [strategies, setStrategies] = useState([]);
  const [filteredStrategies, setFilteredStrategies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [expandedStrategy, setExpandedStrategy] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [backtestDialogOpen, setBacktestDialogOpen] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const [resultType, setResultType] = useState('execute');
  const [selectedStock, setSelectedStock] = useState('000001');
  const [loadingStates, setLoadingStates] = useState({});
  const [executionResult, setExecutionResult] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 策略分类
  const categories = [
    { label: '全部策略', value: 'all' },
    { label: '趋势跟踪', value: 'trend' },
    { label: '均值回归', value: 'mean_reversion' },
    { label: '套利策略', value: 'arbitrage' },
    { label: '高频交易', value: 'high_frequency' },
    { label: '多因子模型', value: 'multi_factor' },
  ];

  // 初始化策略数据
  useEffect(() => {
    const strategiesData = [
      {
        id: 1,
        name: '海龟交易法则',
        version: 'v0.1',
        category: 'trend',
        description: '突破20日/55日价格通道触发交易信号。短线交易在20日高点做多、低点做空，中长线则参考55日通道。',
        details: {
          适用市场: '期货、股指等高流动性市场',
          历史年化收益: '超50%',
          核心原理: '价格突破通道上轨做多，突破下轨做空',
          止损策略: '2%资金止损，通道回撤平仓',
          优势: '简单易懂，适合程序化交易',
          风险提示: '震荡市容易频繁止损',
          回测表现: '在趋势市场表现优异，震荡市较差'
        },
        risk: '中等',
        complexity: '简单',
        annualReturn: '52%',
        maxDrawdown: '15%',
        sharpeRatio: 2.1,
        winRate: '65%',
        icon: 'trending_up',
        color: '#4caf50'
      },
      {
        id: 2,
        name: '多因子选股策略',
        version: 'v0.1',
        category: 'multi_factor',
        description: '使用价值、成长、质量、动量等多维度指标评分选股。通过因子合成构建最优投资组合。',
        details: {
          适用市场: 'A股、美股等股票市场',
          历史年化收益: '约12%',
          核心原理: '多因子评分模型，动态权重配置',
          止损策略: '组合层面风险控制',
          优势: '分散化投资，长期稳健',
          风险提示: '因子失效风险',
          回测表现: '长期跑赢指数3-5%'
        },
        risk: '中低',
        complexity: '复杂',
        annualReturn: '12%',
        maxDrawdown: '8%',
        sharpeRatio: 1.5,
        winRate: '58%',
        icon: 'analytics',
        color: '#2196f3'
      },
      {
        id: 3,
        name: '均值回归策略',
        version: 'v0.1',
        category: 'mean_reversion',
        description: '利用RSI超买超卖信号配合布林带通道，在价格偏离均值时进行反向交易。',
        details: {
          适用市场: '震荡性股票、ETF',
          历史年化收益: '约18%',
          核心原理: 'RSI+布林带双重确认',
          止损策略: '突破布林带中轨止损',
          优势: '震荡市表现出色',
          风险提示: '趋势市容易被套',
          回测表现: '震荡市年化20%+，趋势市较差'
        },
        risk: '中等',
        complexity: '中等',
        annualReturn: '18%',
        maxDrawdown: '12%',
        sharpeRatio: 1.8,
        winRate: '62%',
        icon: 'waves',
        color: '#ff9800'
      },
      {
        id: 4,
        name: '趋势跟踪策略',
        version: 'v0.1',
        category: 'trend',
        description: '使用MACD和移动平均线组合，识别并跟踪中长期趋势。适合牛熊市明确的市场环境。',
        details: {
          适用市场: '股指期货、大盘ETF',
          历史年化收益: '约25%',
          核心原理: 'MACD金叉死叉+均线多头排列',
          止损策略: '均线破位止损',
          优势: '抓住大趋势',
          风险提示: '延迟入场，错过最佳时点',
          回测表现: '趋势市表现优异'
        },
        risk: '中等',
        complexity: '简单',
        annualReturn: '25%',
        maxDrawdown: '18%',
        sharpeRatio: 1.9,
        winRate: '55%',
        icon: 'trending_up',
        color: '#4caf50'
      },
      {
        id: 5,
        name: '统计套利策略',
        version: 'v0.1',
        category: 'arbitrage',
        description: '通过配对交易捕捉相关性资产间的价差收敛机会。市场中性策略，风险相对较低。',
        details: {
          适用市场: '同行业股票对、ETF套利',
          历史年化收益: '约15%',
          核心原理: '协整关系+Z-Score模型',
          止损策略: '价差扩大至2倍标准差止损',
          优势: '市场中性，风险较低',
          风险提示: '相关性破裂风险',
          回测表现: '稳定盈利，回撤较小'
        },
        risk: '低',
        complexity: '复杂',
        annualReturn: '15%',
        maxDrawdown: '6%',
        sharpeRatio: 2.2,
        winRate: '68%',
        icon: 'compare_arrows',
        color: '#9c27b0'
      },
      {
        id: 6,
        name: '高频交易策略',
        version: 'v0.1',
        category: 'high_frequency',
        description: '利用微观结构信号进行超短期交易。依赖订单流分析和市场微观结构。',
        details: {
          适用市场: '高流动性股票、期货',
          历史年化收益: '约35%',
          核心原理: '订单流分析+微观结构',
          止损策略: '即时止损，持仓时间秒级',
          优势: '高频率，积少成多',
          风险提示: '技术要求极高，成本敏感',
          回测表现: '胜率较高，单笔盈利微薄'
        },
        risk: '低',
        complexity: '极难',
        annualReturn: '35%',
        maxDrawdown: '3%',
        sharpeRatio: 3.1,
        winRate: '75%',
        icon: 'speed',
        color: '#f44336'
      },
      {
        id: 7,
        name: '网格交易策略',
        version: 'v0.1',
        category: 'arbitrage',
        description: '在价格区间内设置买卖网格，通过价格波动赚取价差。适合震荡市场。',
        details: {
          适用市场: '波动率适中的股票',
          历史年化收益: '约22%',
          核心原理: '网格区间自动买卖',
          止损策略: '突破网格区间止损',
          优势: '无需预测方向',
          风险提示: '趋势市容易爆仓',
          回测表现: '震荡市稳定盈利'
        },
        risk: '中高',
        complexity: '中等',
        annualReturn: '22%',
        maxDrawdown: '20%',
        sharpeRatio: 1.6,
        winRate: '70%',
        icon: 'grid_view',
        color: '#795548'
      },
      {
        id: 8,
        name: '阿尔法策略',
        version: 'v0.1',
        category: 'arbitrage',
        description: '市场中性策略，通过多空配对获得与市场无关的阿尔法收益。',
        details: {
          适用市场: '股票多空对冲',
          历史年化收益: '约8%',
          核心原理: '多空对冲+阿尔法挖掘',
          止损策略: '动态对冲调整',
          优势: '与市场走势无关',
          风险提示: '对冲成本较高',
          回测表现: '收益稳定，波动极小'
        },
        risk: '极低',
        complexity: '复杂',
        annualReturn: '8%',
        maxDrawdown: '2%',
        sharpeRatio: 2.8,
        winRate: '65%',
        icon: 'alpha',
        color: '#607d8b'
      },
      {
        id: 9,
        name: '动量注入策略',
        version: 'v0.1',
        category: 'trend',
        description: '捕捉短期价格动量，在动量强劲时顺势而为。结合成交量确认信号。',
        details: {
          适用市场: '中小盘股票',
          历史年化收益: '约28%',
          核心原理: '价格动量+成交量确认',
          止损策略: '动量衰减立即止损',
          优势: '捕捉短期爆发',
          风险提示: '容易追高杀跌',
          回测表现: '短期爆发力强'
        },
        risk: '中等',
        complexity: '中等',
        annualReturn: '28%',
        maxDrawdown: '16%',
        sharpeRatio: 2.0,
        winRate: '58%',
        icon: 'flash_on',
        color: '#ff5722'
      },
      {
        id: 10,
        name: '隐马尔可夫策略',
        version: 'v0.1',
        category: 'multi_factor',
        description: '使用隐马尔可夫模型识别市场状态，根据不同状态调整交易策略。',
        details: {
          适用市场: '各类金融资产',
          历史年化收益: '约19%',
          核心原理: 'HMM状态识别+自适应策略',
          止损策略: '状态转换时调整策略',
          优势: '自适应市场环境',
          风险提示: '模型复杂，调参困难',
          回测表现: '各类市场环境适应性强'
        },
        risk: '中等',
        complexity: '极难',
        annualReturn: '19%',
        maxDrawdown: '11%',
        sharpeRatio: 1.7,
        winRate: '61%',
        icon: 'psychology',
        color: '#3f51b5'
      }
    ];
    
    setStrategies(strategiesData);
    setFilteredStrategies(strategiesData);
  }, []);

  // 策略过滤
  useEffect(() => {
    if (selectedCategory === '全部') {
      setFilteredStrategies(strategies);
    } else {
      setFilteredStrategies(strategies.filter(strategy => strategy.category === selectedCategory));
    }
  }, [selectedCategory, strategies]);

  const getRiskColor = (risk) => {
    switch(risk) {
      case '极低': return '#4caf50';
      case '低': return '#8bc34a';
      case '低-中等': return '#cddc39';
      case '中等': return '#ff9800';
      case '中高': return '#ff5722';
      case '高': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getComplexityColor = (complexity) => {
    switch(complexity) {
      case '简单': return '#4caf50';
      case '中等': return '#ff9800';
      case '复杂': return '#ff5722';
      case '极复杂': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleExpandStrategy = (strategyId) => {
    setExpandedStrategy(expandedStrategy === strategyId ? null : strategyId);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedStrategy(isExpanded ? panel : null);
  };

  const handleConfigStrategy = (strategy) => {
    setCurrentStrategy(strategy);
    setConfigDialogOpen(true);
  };

  const handleExecuteStrategy = async (strategyId) => {
    try {
      setLoadingStates(prev => ({ ...prev, [strategyId]: true }));
      
      console.log('执行全市场策略扫描:', strategyId);
      
      const startDate = '20220101';
      const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const maxStocks = 50; // 分析50只股票
      const minScore = 60.0; // 最小评分60分
      
      console.log('扫描参数:', { strategyId, startDate, endDate, maxStocks, minScore });
      
      // 显示扫描进度消息
      setSnackbar({
        open: true,
        message: '🚀 正在执行全市场扫描，预计需要1-3分钟，请耐心等待...',
        severity: 'info'
      });
      
      const response = await strategyAPI.executeMarketScan(strategyId, startDate, endDate, maxStocks, minScore);
      
      console.log('扫描结果:', response);
      
      if (response.success) {
        setExecutionResult(response);
        setResultDialogOpen(true);
        
        // 显示成功消息
        setSnackbar({
          open: true,
          message: `🎉 扫描完成！发现 ${response.qualified_count} 只符合条件的股票，前30强已准备就绪！`,
          severity: 'success'
        });
      } else {
        throw new Error(response.message || '全市场扫描失败');
      }
    } catch (error) {
      console.error('全市场扫描错误:', error);
      setSnackbar({
        open: true,
        message: `全市场扫描失败: ${error.message}`,
        severity: 'error'
      });
      
      // 显示错误结果
      setExecutionResult({
        success: false,
        message: error.message,
        strategy_name: strategies.find(s => s.id === strategyId)?.name || '未知策略'
      });
      setResultDialogOpen(true);
    } finally {
      setLoadingStates(prev => ({ ...prev, [strategyId]: false }));
    }
  };

  const handleBacktestStrategy = async (strategyId) => {
    try {
      setLoadingStates(prev => ({ ...prev, [`backtest_${strategyId}`]: true }));
      
      console.log('回测策略:', strategyId);
      
      const stockCode = selectedStock || '000001';
      const startDate = '20230101';
      const endDate = '20241231';
      const initialCapital = 100000;
      
      console.log('回测参数:', { strategyId, stockCode, startDate, endDate, initialCapital });
      
      const response = await strategyAPI.runBacktest(strategyId, stockCode, startDate, endDate, initialCapital);
      
      console.log('回测结果:', response);
      
      if (response.success) {
        setBacktestResult(response);
        setBacktestDialogOpen(true);
        
        setSnackbar({
          open: true,
          message: '回测分析完成！',
          severity: 'success'
        });
      } else {
        throw new Error(response.error || '回测分析失败');
      }
    } catch (error) {
      console.error('回测分析错误:', error);
      setSnackbar({
        open: true,
        message: `回测分析失败: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [`backtest_${strategyId}`]: false }));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          🌍 全球十大经典量化策略解析
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          深度解析全球顶级量化交易策略，助力您的投资决策
        </Typography>
        
        {/* 统计数据卡片 */}
        <Grid container spacing={2} sx={{ mb: 4, justifyContent: 'center' }}>
          <Grid item xs={12} sm={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                10+
              </Typography>
              <Typography variant="body2" color="primary.light" sx={{ fontWeight: 'medium' }}>
                经典策略
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                50%+
              </Typography>
              <Typography variant="body2" color="secondary.light" sx={{ fontWeight: 'medium' }}>
                最高年化收益
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                6
              </Typography>
              <Typography variant="body2" color="success.light" sx={{ fontWeight: 'medium' }}>
                策略分类
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                100%
              </Typography>
              <Typography variant="body2" color="warning.light" sx={{ fontWeight: 'medium' }}>
                实战验证
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 策略分类标签页 */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          {categories.map((category, index) => (
            <Tab
              key={category.value}
              label={category.label}
              icon={index === 0 ? <Star /> : 
                   index === 1 ? <TrendingUp /> :
                   index === 2 ? <ShowChart /> :
                   index === 3 ? <AccountBalance /> :
                   index === 4 ? <Speed /> : <Assessment />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* 策略列表 */}
      <Grid container spacing={3}>
        {filteredStrategies.map((strategy, index) => (
          <Grid item xs={12} key={strategy.id}>
            <Accordion 
              expanded={expandedStrategy === `strategy${strategy.id}`}
              onChange={handleAccordionChange(`strategy${strategy.id}`)}
              elevation={2}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ 
                  bgcolor: `${strategy.color}10`,
                  '&:hover': { bgcolor: `${strategy.color}20` }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '50%', 
                    bgcolor: strategy.color, 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {strategy.icon}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {index + 1}. {strategy.name} 
                      <Chip 
                        label={strategy.version} 
                        size="small" 
                        sx={{ ml: 1, bgcolor: strategy.color, color: 'white' }}
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {strategy.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`风险: ${strategy.risk}`}
                      size="small"
                      sx={{ bgcolor: getRiskColor(strategy.risk), color: 'white' }}
                    />
                    <Chip 
                      label={`复杂度: ${strategy.complexity}`}
                      size="small"
                      sx={{ bgcolor: getComplexityColor(strategy.complexity), color: 'white' }}
                    />
                    <Chip 
                      label={strategy.timeframe}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* 策略详情 */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Info color="primary" />
                          策略详情
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {strategy.details && Object.entries(strategy.details).map(([key, value]) => (
                          <Box key={key} sx={{ mb: 1.5 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                              {key}:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {value}
                            </Typography>
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 性能指标 */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={1}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CandlestickChart color="success" />
                          性能表现
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {/* 性能指标显示 */}
                        {[
                          { key: '年化收益率', value: strategy.annualReturn },
                          { key: '最大回撤', value: strategy.maxDrawdown },
                          { key: '夏普比率', value: strategy.sharpeRatio },
                          { key: '胜率', value: strategy.winRate },
                          { key: '风险等级', value: strategy.risk },
                          { key: '复杂度', value: strategy.complexity }
                        ].map(({ key, value }) => (
                          <Box key={key} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="subtitle2" color="primary">
                                {key}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {value}
                              </Typography>
                            </Box>
                            {(key.includes('率') || key.includes('胜率')) && (
                              <LinearProgress 
                                variant="determinate" 
                                value={parseFloat(String(value).replace('%', '')) || 50} 
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  bgcolor: '#f5f5f5',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    bgcolor: strategy.color
                                  }
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 操作按钮 */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        sx={{ bgcolor: strategy.color }}
                        onClick={() => {
                          setResultType('execute');
                          handleExecuteStrategy(strategy.id);
                        }}
                      >
                        全市场扫描
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Assessment />}
                        sx={{ borderColor: strategy.color, color: strategy.color }}
                        onClick={() => {
                          setResultType('backtest');
                          handleBacktestStrategy(strategy.id);
                        }}
                      >
                        回测分析
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Settings />}
                        sx={{ borderColor: strategy.color, color: strategy.color }}
                        onClick={() => handleConfigStrategy(strategy)}
                      >
                        参数配置
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* 页面底部提示 */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
          💡 提示：所有策略均基于历史数据回测，投资有风险，入市需谨慎。
          建议结合个人风险承受能力选择合适的量化策略。
        </Typography>
      </Box>

      {/* 策略配置对话框 */}
      <StrategyConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        strategy={currentStrategy}
      />

      {/* 全市场扫描结果对话框 */}
      <MarketScanResultDialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        scanResults={executionResult}
        onExport={(message, severity = 'success') => {
          setSnackbar({
            open: true,
            message,
            severity
          });
        }}
      />

      {/* 回测结果对话框 */}
      <MarketScanResultDialog
        open={backtestDialogOpen}
        onClose={() => setBacktestDialogOpen(false)}
        scanResults={backtestResult}
        onExport={(message, severity = 'success') => {
          setSnackbar({
            open: true,
            message,
            severity
          });
        }}
      />

      {/* 通知栏 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QuantitativeStrategies; 