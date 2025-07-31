import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Alert,
  Tabs,
  Tab,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Info,
  ExpandMore,
  ExpandLess,
  Timeline,
  Security,
  AccountBalance,
  TableRows,
  BarChart,
  Assessment,
} from '@mui/icons-material';

const TradingSignals = ({ allSignals, comprehensiveAdvice, backtestResult }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    details: true,
    indicators: false,
    chip_distribution: false,
    fundamentals: false,
    pe_analysis: false,
    risk: false,
    trades: true,
  });

  // 使用 ref 来跟踪滚动和用户交互状态
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const lastInteractionRef = useRef(0);
  const containerRef = useRef(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 优化的 toggleSection 函数，完全防止滚动干扰
  const toggleSection = useCallback((section, event) => {
    // 记录用户交互时间戳
    const now = Date.now();
    lastInteractionRef.current = now;

    // 阻止滚动相关的事件传播
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // 延迟执行状态更新，确保不会被滚动事件干扰
    setTimeout(() => {
      // 只有在没有新的用户交互时才执行状态更新
      if (lastInteractionRef.current === now) {
        setExpandedSections(prev => ({
          ...prev,
          [section]: !prev[section]
        }));
      }
    }, 10);
  }, []);

  // 滚动开始处理函数 - 优化版
  const handleScrollStart = useCallback(() => {
    isScrollingRef.current = true;
    
    // 清除之前的计时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 延长恢复时间，确保滚动完全结束
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  // 滚轮事件处理函数 - 优化版
  const handleWheelEvent = useCallback((event) => {
    // 只处理滚动，不阻止卡片操作
    const isCardHeader = event.target.closest('[data-card-header]');
    const isToggleButton = event.target.closest('[data-toggle-button]');
    
    if (!isCardHeader && !isToggleButton) {
      handleScrollStart();
    }
  }, [handleScrollStart]);

  // 防止滚动时误触发状态变化的包装函数
  const createScrollSafeHandler = useCallback((handler) => {
    return (event) => {
      // 如果正在滚动或刚完成滚动，忽略事件
      if (isScrollingRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      handler(event);
    };
  }, []);

  // Early return 必须在所有 Hooks 之后
  if (!allSignals || !comprehensiveAdvice) return null;

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  // 获取当前选中周期的信号
  const currentSignals = allSignals[selectedPeriod]?.signals;
  if (!currentSignals) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          当前周期暂无交易信号数据
        </Alert>
      </Box>
    );
  }

  // 确定信号类型样式
  const getSignalTypeColor = (signalType) => {
    if (signalType.includes('强烈买入')) return 'success';
    if (signalType.includes('买入')) return 'success';
    if (signalType.includes('强烈卖出')) return 'error';
    if (signalType.includes('卖出')) return 'secondary';
    return 'warning';
  };

  // 确定风险等级样式
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case '高': return 'error';
      case '中': return 'warning';
      default: return 'info';
    }
  };

  // 获取信号图标
  const getSignalIcon = (signalType) => {
    if (signalType.includes('买入')) return <CheckCircle color="success" />;
    if (signalType.includes('卖出')) return <Cancel color="error" />;
    return <Info color="warning" />;
  };

  // 渲染值的辅助函数
  const renderValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // 渲染筹码分布分析
  const renderChipDistribution = () => {
    // 从indicators中获取筹码分布数据
    const chipData = currentSignals.indicators?.chip?.latest_values || 
                     allSignals[selectedPeriod]?.indicators?.chip_distribution;
    
    if (!chipData) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取筹码分布数据...
        </Alert>
      );
    }

    return (
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              主力成本
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.main_peak_price ? `${chipData.main_peak_price.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              平均成本
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.avg_price ? `${chipData.avg_price.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              压力位
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.pressure_level ? `${chipData.pressure_level.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              支撑位
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.support_level ? `${chipData.support_level.toFixed(2)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              筹码集中度
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {chipData.concentration ? `${(chipData.concentration * 100).toFixed(1)}%` : '-'}
            </Typography>
          </Paper>
        </Grid>
        {chipData.analysis && Array.isArray(chipData.analysis) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                分析要点
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {chipData.analysis.slice(0, 3).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // 渲染PE分析
  const renderPEAnalysis = () => {
    // 从pe_analysis中获取数据
    const peData = currentSignals.pe_analysis || 
                   currentSignals.indicators?.pe?.latest_values ||
                   allSignals[selectedPeriod]?.pe_analysis;
    
    if (!peData) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取PE分析数据...
        </Alert>
      );
    }

    const peInfo = peData.pe_data || peData.latest_values || {};
    const analysis = peData.analysis || [];

    return (
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              当前PE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peData.current_pe ? `${peData.current_pe.toFixed(2)}倍` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              市净率(PB)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peInfo.pb ? `${peInfo.pb.toFixed(2)}倍` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              每股收益(EPS)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peInfo.eps ? `${peInfo.eps.toFixed(3)}元` : '-'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              净资产收益率(ROE)
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {peInfo.roe ? `${peInfo.roe.toFixed(2)}%` : '-'}
            </Typography>
          </Paper>
        </Grid>
        {analysis && analysis.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                估值分析
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {analysis.slice(0, 4).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  // 渲染基本面分析
  const renderFundamentalAnalysis = () => {
    // 从fundamental_analysis或fundamental_indicators中获取数据
    const fundamentalData = currentSignals.fundamental_analysis || 
                           currentSignals.fundamental_indicators ||
                           currentSignals.indicators?.fundamental?.latest_values ||
                           allSignals[selectedPeriod]?.fundamental_indicators;
    
    if (!fundamentalData || Object.keys(fundamentalData).length === 0) {
      return (
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          正在获取基本面数据...
        </Alert>
      );
    }

    return (
      <Grid container spacing={1}>
        {Object.entries(fundamentalData).map(([key, value]) => {
          // 跳过非数据字段
          if (key === 'analysis' || key === 'investment_advice' || key === 'risk_factors') {
            return null;
          }
          
          return (
            <Grid item xs={6} key={key}>
              <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">
                  {key}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {renderValue(value)}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
        
        {/* 显示基本面分析要点 */}
        {fundamentalData.analysis && Array.isArray(fundamentalData.analysis) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary">
                分析要点
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                {fundamentalData.analysis.slice(0, 3).map((item, index) => (
                  <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                    {item}
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };



  // 构建信号芯片的辅助函数
  const buildSignalChip = (periodKey, periodName, sig, keySeed) => {
    let color = 'default';
    if (sig.includes('强烈买入')) color = 'success';
    else if (sig.includes('买入')) color = 'success';
    else if (sig.includes('强烈卖出')) color = 'error';
    else if (sig.includes('卖出')) color = 'secondary';
    else color = 'warning';
    return (
      <Chip
        key={`${periodKey}-${keySeed}`} 
        label={`${periodName} ${sig}`} 
        color={color} 
        size="small" 
        sx={{ mr: 0.5, mb: 0.5 }}
      />
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 综合建议区域 - 固定在顶部 */}
        <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
            {comprehensiveAdvice.overall_signal}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {comprehensiveAdvice.advice}
          </Typography>

          {/* 统计信息 - 紧凑布局 */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                <Typography variant="h6">{comprehensiveAdvice.statistics.buy_count}</Typography>
                <Typography variant="caption">买入</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                <Typography variant="h6">{comprehensiveAdvice.statistics.sell_count}</Typography>
                <Typography variant="caption">卖出</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                <Typography variant="h6">{comprehensiveAdvice.statistics.hold_count}</Typography>
                <Typography variant="caption">观望</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
                <Typography variant="h6">{comprehensiveAdvice.statistics.total_periods}</Typography>
                <Typography variant="caption">总周期</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 回测结果 */}
          {backtestResult && (
            <Box sx={{ mt: 1 }}>
              <Paper sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="body2">
                  回测收益率: {backtestResult.total_return_pct}% | 收益金额: ¥{backtestResult.profit_amount.toLocaleString()} | 期末资产: ¥{backtestResult.capital_end.toLocaleString()}
                </Typography>
              </Paper>

              {/* 交易明细表格 - 可折叠 */}
              {backtestResult.details && (
                <Card variant="outlined" sx={{ mt: 1, '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('trades', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableRows color="info" />
                      交易明细 ({backtestResult.details.daily?.trades?.length || 0})
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.trades ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  <Collapse in={expandedSections.trades}>
                    <TableContainer 
                      component={Paper} 
                      sx={{ maxHeight: 300 }}
                      onWheel={handleWheelEvent}
                      onScroll={handleScrollStart}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>类型</TableCell>
                            <TableCell>时间</TableCell>
                            <TableCell>价格</TableCell>
                            <TableCell>收益%</TableCell>
                            <TableCell>收益额</TableCell>
                            <TableCell>决策</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backtestResult.details.daily?.trades?.map((trade, idx) => {
                            let decisionChips = [];
                            if (trade.decisions && trade.decisions.length > 0) {
                              decisionChips = trade.decisions.map((d, chipIdx) => {
                                const label = ['15', '30', '60'].includes(d.period) ? `${d.period}min` : (allSignals?.[d.period]?.period_name || d.period);
                                return buildSignalChip(d.period, label, d.signal_type, chipIdx);
                              });
                            } else {
                              // fallback to current signals snapshot
                              decisionChips = Object.entries(allSignals || {}).map(([key, data]) => {
                                const label = ['15', '30', '60'].includes(key) ? `${key}min` : (data.period_name || key);
                                const sig = data.signals?.signal_type || '未知';
                                return buildSignalChip(key, label, sig, idx);
                              });
                            }

                            return (
                              <TableRow key={idx}>
                                <TableCell>{trade.type === 'buy' ? '买入' : '卖出'}</TableCell>
                                <TableCell>{trade.date}</TableCell>
                                <TableCell>{trade.price.toFixed(2)}</TableCell>
                                {trade.type === 'sell' ? (
                                  <>
                                    <TableCell
                                      sx={{ color: trade.profit_pct >= 0 ? 'error.main' : 'success.main' }}
                                    >
                                      {trade.profit_pct >= 0 ? '+' : ''}{trade.profit_pct.toFixed(2)}%
                                    </TableCell>
                                    <TableCell
                                      sx={{ color: trade.profit_amount >= 0 ? 'error.main' : 'success.main' }}
                                    >
                                      {trade.profit_amount >= 0 ? '+' : ''}{trade.profit_amount.toFixed(2)}
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>-</TableCell>
                                    <TableCell>-</TableCell>
                                  </>
                                )}
                                <TableCell sx={{ whiteSpace: 'normal' }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                    {decisionChips}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </Card>
              )}
            </Box>
          )}
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

        {/* 周期内容 - 可滚动区域 */}
        <Box 
          ref={containerRef}
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            }
          }}
          onWheel={handleWheelEvent}
          onScroll={handleScrollStart}
          onTouchMove={handleScrollStart}
        >
          <Box sx={{ p: 2 }}>
            {/* 当前周期信号概览 */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSignalIcon(currentSignals.signal_type)}
                  <Typography variant="h6" component="h3">
                    {currentSignals.signal_type}
                  </Typography>
                </Box>
                <Chip
                  label={`信号强度: ${currentSignals.signal_strength}`}
                  color={getSignalTypeColor(currentSignals.signal_type)}
                  size="small"
                />
              </Box>
              
              {currentSignals.advice && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {currentSignals.advice}
                </Alert>
              )}
            </Box>

            {/* 信号详情 - 可折叠区域 */}
            <Grid container spacing={2}>
              {/* 技术指标信号 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('indicators', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Timeline color="primary" />
                      技术指标信号
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.indicators ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.indicators}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      <Grid container spacing={1}>
                        {currentSignals.indicators && Object.entries(currentSignals.indicators).map(([key, value]) => (
                          <Grid item xs={6} key={key}>
                            <Paper sx={{ p: 1, bgcolor: 'background.paper' }}>
                              <Typography variant="caption" color="text.secondary">
                                {key}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {renderValue(value)}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 筹码分布 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                                         data-card-header="true"
                     onClick={createScrollSafeHandler((event) => toggleSection('chip_distribution', event))}
                     onWheel={handleWheelEvent}
                     onScroll={handleScrollStart}
                     onTouchMove={handleScrollStart}
                   >
                     <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <BarChart color="info" />
                       筹码分布
                     </Typography>
                     <IconButton size="small" data-toggle-button="true">
                       {expandedSections.chip_distribution ? <ExpandLess /> : <ExpandMore />}
                     </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.chip_distribution}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      {renderChipDistribution()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 基本面分析 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('fundamentals', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalance color="secondary" />
                      基本面分析
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.fundamentals ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.fundamentals}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      {renderFundamentalAnalysis()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* PE分析 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                                         data-card-header="true"
                     onClick={createScrollSafeHandler((event) => toggleSection('pe_analysis', event))}
                     onWheel={handleWheelEvent}
                     onScroll={handleScrollStart}
                     onTouchMove={handleScrollStart}
                   >
                     <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Assessment color="warning" />
                       PE分析
                     </Typography>
                     <IconButton size="small" data-toggle-button="true">
                       {expandedSections.pe_analysis ? <ExpandLess /> : <ExpandMore />}
                     </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.pe_analysis}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      {renderPEAnalysis()}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>

              {/* 风险评估 */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 2 } }}>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'background.default',
                      userSelect: 'none',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    data-card-header="true"
                    onClick={createScrollSafeHandler((event) => toggleSection('risk', event))}
                    onWheel={handleWheelEvent}
                    onScroll={handleScrollStart}
                    onTouchMove={handleScrollStart}
                  >
                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security color="warning" />
                      风险评估
                    </Typography>
                    <IconButton size="small" data-toggle-button="true">
                      {expandedSections.risk ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  
                  <Collapse in={expandedSections.risk}>
                    <Box sx={{ p: 1.5, pt: 0 }} onWheel={handleWheelEvent}>
                      {currentSignals.risk_assessment ? (
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                              <Typography variant="caption" color="text.secondary">
                                风险等级
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                <Chip 
                                  label={currentSignals.risk_assessment.risk_level || '未知'}
                                  color={getRiskLevelColor(currentSignals.risk_assessment.risk_level)}
                                  size="small"
                                />
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                              <Typography variant="caption" color="text.secondary">
                                风险因子
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {currentSignals.risk_assessment.risk_factors?.join(', ') || '无'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      ) : (
                        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                          暂无风险评估数据
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradingSignals; 