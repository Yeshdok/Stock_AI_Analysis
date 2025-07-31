import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Fab,
  Zoom,
} from '@mui/material';
import {
  TrendingUp,
  Analytics,
  ShowChart,
  KeyboardArrowUp,
  Info,
} from '@mui/icons-material';
import StockSearch from '../components/StockSearch';
import SearchHistory from '../components/SearchHistory';
import TradingSignals from '../components/TradingSignals';
import DetailedAnalysis from '../components/DetailedAnalysis';
import TradingViewChart from '../components/TradingViewChart';
import { fetchTradingSignals } from '../utils/api';

const HomePage = ({ selectedStock, onStockSelected }) => {
  const [stockCode, setStockCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allSignals, setAllSignals] = useState(null);
  const [comprehensiveAdvice, setComprehensiveAdvice] = useState(null);
  const [allStockData, setAllStockData] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  // 监听外部传入的股票选择
  useEffect(() => {
    if (selectedStock && selectedStock.code) {
      console.log('🎯 HomePage收到外部股票选择:', selectedStock);
      
      // 设置股票代码
      setStockCode(selectedStock.code);
      
      // 自动触发分析
      handleStockAnalysis(selectedStock.code, selectedStock.name);
      
      // 清理选择状态（避免重复触发）
      if (onStockSelected) {
        setTimeout(() => onStockSelected(null), 1000);
      }
    }
  }, [selectedStock]);

  // 添加到搜索历史的函数
  const addToSearchHistory = (stock) => {
    try {
      const savedHistory = localStorage.getItem('stockSearchHistory');
      let history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // 移除重复项，将新项添加到开头
      history = [
        stock,
        ...history.filter(item => item.code !== stock.code)
      ].slice(0, 10); // 最多保存10条记录
      
      localStorage.setItem('stockSearchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 提取股票分析逻辑为独立函数
  const handleStockAnalysis = async (code, name = '') => {
    if (!code || typeof code !== 'string' || !code.trim()) {
      setError('请输入股票代码');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log(`🔍 开始分析股票: ${code} ${name}`);
      console.log('🚀 启动TuShare+AkShare双引擎真实数据分析，并行处理5个周期，预计需要3-8分钟...');
      
      const data = await fetchTradingSignals(code.trim());
      
      if (data.success) {
        setAllSignals(data.all_signals || {});
        setComprehensiveAdvice(data.comprehensive_advice || {});
        setAllStockData(data.all_stock_data || {});
        setStockInfo(data.stock_info || {});
        setBacktestResult(data.backtest_result || {});
        setActiveTab(0);
        
        // 添加到搜索历史
        addToSearchHistory({
          code: code,
          name: name || data.stock_info?.name || code,
          sector: data.stock_info?.sector || '股票'
        });
        
        console.log(`✅ 股票分析完成: ${code} ${name}`);
        console.log('📊 分析结果:', {
          signals: Object.keys(data.all_signals || {}),
          stockData: Object.keys(data.all_stock_data || {}),
          advice: data.comprehensive_advice,
          backtest: data.backtest_result
        });
      } else {
        throw new Error(data.message || data.error || '获取数据失败');
      }
    } catch (error) {
      console.error('❌ 股票分析失败:', error);
      setError(error.message || '获取交易信号失败');
      setAllSignals(null);
      setComprehensiveAdvice(null);
      setAllStockData(null);
      setStockInfo(null);
      setBacktestResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleStockAnalysis(stockCode);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* 主内容区域 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧输入面板 - 固定宽度 */}
        <Box sx={{ width: 320, p: 2, borderRight: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics color="primary" />
                分析参数
              </Typography>
              
              <form onSubmit={handleSubmit}>
                {/* 股票搜索输入框 - 移除下拉功能 */}
                <Box sx={{ mb: 2 }}>
                  <StockSearch
                    value={stockCode}
                    onChange={(value) => setStockCode(typeof value === 'string' ? value : '')}
                    onSelect={(value) => setStockCode(typeof value === 'string' ? value : '')}
                    disableDropdown={true} // 禁用下拉功能
                  />
                </Box>

                {/* 生成交易信号按钮 */}
                <Box sx={{ mb: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                    size="large"
                  disabled={loading}
                  sx={{ 
                      py: 1.5,
                    background: 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)',
                      boxShadow: 3,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #64b5f6 0%, #ab47bc 100%)',
                        boxShadow: 6,
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      TuShare+AkShare并行分析中...3-8分钟
                    </>
                  ) : (
                    <>
                        <TrendingUp sx={{ mr: 1, fontSize: '1.2rem' }} />
                      生成交易信号
                    </>
                  )}
                </Button>
                </Box>
              </form>

              {/* 搜索历史功能区域 - 独立放置在按钮下方 */}
              <SearchHistory 
                onStockSelect={(stockCode) => setStockCode(stockCode)}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2, fontSize: '0.875rem' }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* 右侧分析面板 - 可滚动 */}
        <Box 
          ref={containerRef}
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {allSignals ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* 标签页导航 */}
              <Paper sx={{ m: 2, mb: 0 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab 
                    label="交易信号" 
                    icon={<TrendingUp />} 
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                  <Tab 
                    label="详细分析" 
                    icon={<Analytics />} 
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                  <Tab 
                    label="技术图表" 
                    icon={<ShowChart />} 
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                </Tabs>
              </Paper>

              {/* 标签页内容 */}
              <Box sx={{ flex: 1, m: 2, mt: 0 }}>
                <TabPanel value={activeTab} index={0}>
                  <TradingSignals 
                    allSignals={allSignals}
                    comprehensiveAdvice={comprehensiveAdvice}
                    backtestResult={backtestResult}
                  />
                </TabPanel>
                
                <TabPanel value={activeTab} index={1}>
                  <DetailedAnalysis 
                    allSignals={allSignals}
                  />
                </TabPanel>
                
                <TabPanel value={activeTab} index={2}>
                  <TradingViewChart 
                    allStockData={allStockData}
                    stockInfo={stockInfo}
                    allSignals={allSignals}
                  />
                </TabPanel>
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, p: 2 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 0,
                  border: '2px dashed',
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <Info sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    等待分析
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    请在左侧输入股票代码，<br />
                    然后点击"生成交易信号"按钮开始多周期分析
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Box>

      {/* 回到顶部按钮 */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default HomePage; 