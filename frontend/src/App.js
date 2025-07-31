import React, { useState } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Container,
  useMediaQuery 
} from '@mui/material';
import {
  Analytics,
  ShowChart,
  Psychology,
  Assessment,
  Insights,
  Settings,
  TrendingUp,
  BarChart
} from '@mui/icons-material';
import theme from './theme';
import HomePage from './pages/HomePage';
import QuantitativeStrategies from './pages/QuantitativeStrategies';
import PresetStrategies from './pages/PresetStrategies';
import AdvancedStrategyConfig from './pages/AdvancedStrategyConfig';
import MarketOverview from './pages/MarketOverview';
import LimitUpAnalysis from './pages/LimitUpAnalysis';
import MarketBreadth from './pages/MarketBreadth';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [selectedStock, setSelectedStock] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 处理股票选择事件（从预置策略页面跳转到技术分析页面）
  const handleStockSelect = (stockInfo) => {
    console.log('🎯 App收到股票选择:', stockInfo);
    setSelectedStock(stockInfo);
    setTabValue(0); // 切换到技术分析页面
  };

  const tabProps = (index) => ({
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`,
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* 主导航栏 */}
      <AppBar 
        position="sticky" 
        elevation={2}
        sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
          borderBottom: '3px solid #e3f2fd'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: 0, minHeight: { xs: 64, sm: 80 } }}>
            {/* 系统标题 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
              <Psychology sx={{ mr: 1, fontSize: 32, color: '#ffffff' }} />
              <Typography 
                variant={isMobile ? "h6" : "h5"} 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'linear-gradient(45deg, #ffffff, #e3f2fd)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                A股智能分析系统
              </Typography>
            </Box>

            {/* 主导航标签页 */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#ffffff',
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  },
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    minWidth: isMobile ? 120 : 160,
                    textTransform: 'none',
                    '&.Mui-selected': {
                      color: '#ffffff',
                    },
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }
                }}
              >
                <Tab
                  icon={<Analytics />}
                  label={isMobile ? "股票分析" : "股票技术分析"}
                  iconPosition="start"
                  {...tabProps(0)}
                />
                <Tab
                  icon={<Assessment />}
                  label={isMobile ? "量化策略" : "量化策略中心"}
                  iconPosition="start"
                  {...tabProps(1)}
                />
                <Tab
                  icon={<Insights />}
                  label={isMobile ? "策略配置" : "预置策略配置"}
                  iconPosition="start"
                  {...tabProps(2)}
                />
                <Tab
                  icon={<Settings />}
                  label={isMobile ? "高级策略" : "高级策略配置"}
                  iconPosition="start"
                  {...tabProps(3)}
                />
                <Tab
                  icon={<ShowChart />}
                  label={isMobile ? "全市场分析" : "全市场分析"}
                  iconPosition="start"
                  {...tabProps(4)}
                />
                <Tab
                  icon={<TrendingUp />}
                  label={isMobile ? "涨停分析" : "涨停股分析"}
                  iconPosition="start"
                  {...tabProps(5)}
                />
                <Tab
                  icon={<BarChart />}
                  label={isMobile ? "市场宽度" : "市场宽度分析"}
                  iconPosition="start"
                  {...tabProps(6)}
                />
              </Tabs>
            </Box>

            {/* 右侧装饰 */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShowChart sx={{ fontSize: 28, color: 'rgba(255, 255, 255, 0.8)' }} />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 主内容区域 */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <TabPanel value={tabValue} index={0}>
          <HomePage selectedStock={selectedStock} onStockSelected={setSelectedStock} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <QuantitativeStrategies />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PresetStrategies onTabChange={handleTabChange} onStockSelect={handleStockSelect} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <AdvancedStrategyConfig />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <MarketOverview />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <LimitUpAnalysis />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <MarketBreadth />
        </TabPanel>
      </Box>

      {/* 页脚 */}
      <Box 
        component="footer" 
        sx={{ 
          mt: 'auto',
          py: 2, 
          px: 3, 
          bgcolor: 'rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'medium' }}>
          © 2024 A股智能分析系统 - 基于大数据与AI技术的专业量化分析平台
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App; 