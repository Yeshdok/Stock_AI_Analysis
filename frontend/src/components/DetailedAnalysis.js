import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Alert,
  Tabs,
  Tab,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  TrendingUp,
  ShowChart,
  Analytics,
  Timeline,
  Assessment,
  Speed,
  BarChart,
} from '@mui/icons-material';

const DetailedAnalysis = ({ allSignals }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [expandedSections, setExpandedSections] = useState({
    macd: true,
    rsi: false,
    bollinger: false,
    ma: false,
    volume: false,
    chip: false,
    kdj: false,
    other: false
  });

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 检查数据是否存在
  if (!allSignals || Object.keys(allSignals).length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          暂无详细分析数据，请先生成交易信号
        </Alert>
      </Box>
    );
  }

  // 获取当前选中周期的信号
  const currentSignals = allSignals[selectedPeriod]?.signals;
  if (!currentSignals || !currentSignals.indicators) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          当前周期暂无详细分析数据
        </Alert>
      </Box>
    );
  }

  const indicators = currentSignals.indicators || {};

  // 智能渲染对象
  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return '暂无数据';
    }
    
    if (typeof value === 'object') {
      if (value.latest_values && typeof value.latest_values === 'object') {
        const entries = Object.entries(value.latest_values);
        if (entries.length === 0) return '暂无数据';
        
        return entries.map(([key, val]) => {
          const displayValue = typeof val === 'number' ? val.toFixed(2) : String(val);
          return `${key}: ${displayValue}`;
        }).join(', ');
      }
      
      if (value.latest_value !== undefined) {
        const displayValue = typeof value.latest_value === 'number' 
          ? value.latest_value.toFixed(2) 
          : String(value.latest_value);
        return displayValue;
      }
      
      try {
        const entries = Object.entries(value);
        if (entries.length === 0) return '暂无数据';
        
        return entries.map(([key, val]) => {
          const displayValue = typeof val === 'number' ? val.toFixed(2) : String(val);
          return `${key}: ${displayValue}`;
        }).join(', ');
      } catch (e) {
        return JSON.stringify(value);
      }
    }
    
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    return String(value);
  };

  const renderAnalysisSection = (key, data, title, icon, color = 'primary') => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }

    return (
      <Grid item xs={12} key={key}>
        <Card variant="outlined">
          <Box 
            sx={{ 
              p: 1.5, 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'background.default'
            }}
            onClick={() => toggleSection(key)}
          >
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {React.cloneElement(icon, { color })}
              {title}
            </Typography>
            <IconButton size="small">
              {expandedSections[key] ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections[key]}>
            <Box sx={{ p: 1.5, pt: 0 }}>
              {/* 信号描述 */}
              {data.signals && data.signals.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    分析信号
                  </Typography>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                    {data.signals.map((signal, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {signal}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              )}
              
              {/* 数值数据 */}
              {data.latest_values && Object.keys(data.latest_values).length > 0 && (
                <Grid container spacing={1}>
                  {Object.entries(data.latest_values).map(([valueKey, value]) => (
                    <Grid item xs={6} key={valueKey}>
                      <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="caption" color="text.secondary">
                          {valueKey}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {renderValue(value)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {/* 其他数据 */}
              {!data.signals && !data.latest_values && (
                <Paper sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                  <Typography variant="body2">
                    {renderValue(data)}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Collapse>
        </Card>
      </Grid>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 当前周期信息 - 固定在顶部 */}
        <Box sx={{ p: 2, bgcolor: 'secondary.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" color="secondary.main" gutterBottom>
            📊 {allSignals[selectedPeriod]?.period_name} 详细分析
          </Typography>
          <Typography variant="body2" color="text.secondary">
            信号类型: {currentSignals.signal_type} | 信号强度: {currentSignals.signal_strength} | 风险等级: {currentSignals.risk_level}
          </Typography>
        </Box>

        {/* 周期选择器 - 二级标签 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedPeriod} 
            onChange={handlePeriodChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            {Object.entries(allSignals).map(([periodKey, periodData]) => (
              <Tab 
                key={periodKey} 
                value={periodKey} 
                label={periodData.period_name}
                sx={{ minHeight: 40, py: 1 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* 分析内容 - 可滚动区域 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {/* MACD分析 */}
              {renderAnalysisSection(
                'macd',
                indicators.macd,
                'MACD分析',
                <ShowChart />,
                'primary'
              )}

              {/* RSI分析 */}
              {renderAnalysisSection(
                'rsi',
                indicators.rsi,
                'RSI分析',
                <Speed />,
                'secondary'
              )}

              {/* 布林带分析 */}
              {renderAnalysisSection(
                'bollinger',
                indicators.bollinger,
                '布林带分析',
                <Timeline />,
                'info'
              )}

              {/* 移动平均线分析 */}
              {renderAnalysisSection(
                'ma',
                indicators.ma,
                '移动平均线分析',
                <TrendingUp />,
                'success'
              )}

              {/* 成交量分析 */}
              {renderAnalysisSection(
                'volume',
                indicators.volume,
                '成交量分析',
                <BarChart />,
                'warning'
              )}

              {/* 筹码分布分析 */}
              {renderAnalysisSection(
                'chip',
                indicators.chip,
                '筹码分布分析',
                <Assessment />,
                'error'
              )}

              {/* KDJ分析 */}
              {renderAnalysisSection(
                'kdj',
                indicators.kdj,
                'KDJ分析',
                <Analytics />,
                'primary'
              )}

              {/* 其他指标 */}
              {Object.entries(indicators).map(([key, data]) => {
                // 跳过已经渲染的指标
                if (['macd', 'rsi', 'bollinger', 'ma', 'volume', 'chip', 'kdj'].includes(key)) {
                  return null;
                }
                
                return renderAnalysisSection(
                  key,
                  data,
                  `${key.toUpperCase()}分析`,
                  <Analytics />,
                  'default'
                );
              })}
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalysis; 