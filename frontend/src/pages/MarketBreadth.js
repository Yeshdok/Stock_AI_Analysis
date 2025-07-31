import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Assessment,
  Refresh,
  Timeline
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

const MarketBreadth = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取市场宽度数据
  const fetchMarketBreadthData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 开始获取市场宽度数据...');
      
      const response = await fetch('/api/market-breadth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMarketData(data.data);
        console.log('✅ 市场宽度数据获取成功');
      } else {
        throw new Error(data.message || '数据获取失败');
      }
    } catch (err) {
      console.error('❌ 市场宽度数据获取失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketBreadthData();
  }, [fetchMarketBreadthData]);

  // 颜色配置
  // 专业财经图表颜色配置 - 高对比度、易识别
  const colors = [
    '#1565C0', // 深蓝色 - 专业稳重
    '#D32F2F', // 红色 - 上涨/涨停
    '#2E7D32', // 绿色 - 下跌/跌停  
    '#F57C00', // 橙色 - 中性偏暖
    '#7B1FA2', // 紫色 - 高贵典雅
    '#0277BD', // 蓝色 - 信任可靠
    '#E53935', // 亮红色 - 警示重要
    '#43A047', // 亮绿色 - 积极正面
    '#FB8C00', // 暖橙色 - 活跃动感
    '#8E24AA', // 中紫色 - 独特专业
    '#546E7A'  // 蓝灰色 - 中性平衡
  ];

  // 渲染涨跌家数分析
  const UpDownAnalysisCard = () => {
    if (!marketData?.up_down_analysis) return null;

    const { up_count, down_count, flat_count, total_count, up_ratio, down_ratio, advance_decline_ratio } = marketData.up_down_analysis;

    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#1976d2',
            fontWeight: 700,
            fontSize: '1.4rem',
            mb: 3
          }}>
            <Assessment sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            📈 涨跌家数分析
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: '#fff5f5', 
                borderRadius: 2, 
                border: '3px solid #f44336',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(244, 67, 54, 0.3)' }
              }}>
                <Typography variant="h3" sx={{ 
                  color: '#c62828', 
                  fontWeight: 900,
                  fontSize: '2.2rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{up_count}</Typography>
                <Typography variant="h6" sx={{ 
                  color: '#d32f2f', 
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>📈 上涨股票</Typography>
                <Typography variant="body1" sx={{ 
                  color: '#f44336', 
                  fontWeight: 500,
                  mt: 0.5
                }}>({up_ratio}%)</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: '#f1f8e9', 
                borderRadius: 2, 
                border: '3px solid #4caf50',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)' }
              }}>
                <Typography variant="h3" sx={{ 
                  color: '#2e7d32', 
                  fontWeight: 900,
                  fontSize: '2.2rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{down_count}</Typography>
                <Typography variant="h6" sx={{ 
                  color: '#388e3c', 
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>📉 下跌股票</Typography>
                <Typography variant="body1" sx={{ 
                  color: '#4caf50', 
                  fontWeight: 500,
                  mt: 0.5
                }}>({down_ratio}%)</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: '#fafafa', 
                borderRadius: 2, 
                border: '3px solid #9e9e9e',
                boxShadow: '0 4px 12px rgba(158, 158, 158, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(158, 158, 158, 0.3)' }
              }}>
                <Typography variant="h3" sx={{ 
                  color: '#424242', 
                  fontWeight: 900,
                  fontSize: '2.2rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{flat_count}</Typography>
                <Typography variant="h6" sx={{ 
                  color: '#616161', 
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>⚪ 平盘股票</Typography>
                <Typography variant="body1" sx={{ 
                  color: '#757575', 
                  fontWeight: 500,
                  mt: 0.5
                }}>持平</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 3, 
                bgcolor: '#e3f2fd', 
                borderRadius: 2, 
                border: '3px solid #2196f3',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)' }
              }}>
                <Typography variant="h3" sx={{ 
                  color: '#1565c0', 
                  fontWeight: 900,
                  fontSize: '2.2rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{advance_decline_ratio}</Typography>
                <Typography variant="h6" sx={{ 
                  color: '#1976d2', 
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>⚖️ 涨跌比</Typography>
                <Typography variant="body1" sx={{ 
                  color: '#2196f3', 
                  fontWeight: 500,
                  mt: 0.5
                }}>ADR指标</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              总计: {total_count}只股票参与交易
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={up_ratio} 
              sx={{ 
                mt: 1, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: '#e8f5e8',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: up_ratio > 50 ? '#f44336' : '#4caf50'
                }
              }} 
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 渲染涨跌幅分布图表
  const PriceChangeDistributionChart = () => {
    if (!marketData?.price_change_distribution) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChart sx={{ mr: 1, color: 'primary.main' }} />
            涨跌幅分布
          </Typography>
          
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={marketData.price_change_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="range" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={10}
              />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, '股票数量']} />
              <Bar dataKey="count" fill="#8884d8" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // 渲染涨停跌停分析
  const LimitAnalysisCard = () => {
    if (!marketData?.limit_analysis) return null;

    const { limit_up_count, limit_down_count, limit_up_ratio, limit_down_ratio } = marketData.limit_analysis;

    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#1976d2',
            fontWeight: 700,
            fontSize: '1.4rem',
            mb: 3
          }}>
            <Timeline sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            🔴 涨停跌停分析
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4, 
                bgcolor: '#fff5f5', 
                borderRadius: 3, 
                border: '4px solid #f44336',
                boxShadow: '0 6px 20px rgba(244, 67, 54, 0.2)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-6px)', 
                  boxShadow: '0 12px 30px rgba(244, 67, 54, 0.3)' 
                }
              }}>
                <TrendingUp sx={{ 
                  fontSize: 50, 
                  color: '#d32f2f', 
                  mb: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }} />
                <Typography variant="h2" sx={{ 
                  color: '#c62828', 
                  fontWeight: 900,
                  fontSize: '3rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{limit_up_count}</Typography>
                <Typography variant="h5" sx={{ 
                  color: '#d32f2f', 
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  mb: 2
                }}>📈 涨停股票</Typography>
                <Chip 
                  label={`占比 ${limit_up_ratio}%`} 
                  size="medium" 
                  sx={{ 
                    bgcolor: '#f44336', 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)'
                  }} 
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 4, 
                bgcolor: '#f1f8e9', 
                borderRadius: 3, 
                border: '4px solid #4caf50',
                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.2)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-6px)', 
                  boxShadow: '0 12px 30px rgba(76, 175, 80, 0.3)' 
                }
              }}>
                <TrendingDown sx={{ 
                  fontSize: 50, 
                  color: '#2e7d32', 
                  mb: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }} />
                <Typography variant="h2" sx={{ 
                  color: '#2e7d32', 
                  fontWeight: 900,
                  fontSize: '3rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  mb: 1
                }}>{limit_down_count}</Typography>
                <Typography variant="h5" sx={{ 
                  color: '#388e3c', 
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  mb: 2
                }}>📉 跌停股票</Typography>
                <Chip 
                  label={`占比 ${limit_down_ratio}%`} 
                  size="medium" 
                  sx={{ 
                    bgcolor: '#4caf50', 
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                  }} 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // 渲染成交量分布
  const VolumeDistributionChart = () => {
    if (!marketData?.volume_distribution) return null;

    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#1976d2',
            fontWeight: 700,
            fontSize: '1.4rem',
            mb: 3
          }}>
            <PieChart sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            📊 成交量分布
          </Typography>
          
          <ResponsiveContainer width="100%" height={350}>
            <RechartsPieChart>
              <Pie
                data={marketData.volume_distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, percentage }) => `${range}: ${percentage}%`}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                stroke="#ffffff"
                strokeWidth={3}
              >
                {marketData.volume_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, '股票数量']} 
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // 渲染市值分布
  const MarketCapDistributionChart = () => {
    if (!marketData?.market_cap_distribution) return null;

    return (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 3, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center',
            color: '#1976d2',
            fontWeight: 700,
            fontSize: '1.4rem',
            mb: 3
          }}>
            <Assessment sx={{ mr: 1.5, color: '#1976d2', fontSize: '1.8rem' }} />
            💰 市值分布
          </Typography>
          
          <ResponsiveContainer width="100%" height={350}>
            <RechartsBarChart data={marketData.market_cap_distribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.7} />
              <XAxis 
                dataKey="range" 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#424242' }}
                axisLine={{ stroke: '#bdbdbd', strokeWidth: 2 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#424242' }}
                axisLine={{ stroke: '#bdbdbd', strokeWidth: 2 }}
                label={{ value: '股票数量', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [value, '股票数量']} 
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
              <Bar 
                dataKey="count" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                stroke="#1976d2"
                strokeWidth={1}
              >
                {marketData.market_cap_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // 渲染市场活跃度
  const MarketActivityCard = () => {
    if (!marketData?.market_activity) return null;

    const { 
      active_stocks, 
      active_ratio, 
      high_turnover_stocks, 
      high_turnover_ratio,
      volume_surge_stocks,
      volume_surge_ratio,
      avg_turnover_rate,
      avg_volume_ratio
    } = marketData.market_activity;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
            市场活跃度指标
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h5" color="primary.dark">{active_stocks}</Typography>
                <Typography variant="body2">活跃股票 ({active_ratio}%)</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 1 }}>
                <Typography variant="h5" color="secondary.dark">{high_turnover_stocks}</Typography>
                <Typography variant="body2">高换手股票 ({high_turnover_ratio}%)</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="h5" color="warning.dark">{volume_surge_stocks}</Typography>
                <Typography variant="body2">放量股票 ({volume_surge_ratio}%)</Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                平均换手率: <strong>{avg_turnover_rate}%</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                平均量比: <strong>{avg_volume_ratio}</strong>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* 页面标题 */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ 
              color: '#ffffff', 
              fontWeight: 900,
              fontSize: '2.5rem',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              mb: 1
            }}>
              📊 A股市场宽度分析
            </Typography>
            <Typography variant="h6" sx={{ 
              color: '#e3f2fd', 
              mt: 1,
              fontSize: '1.1rem',
              fontWeight: 500,
              textShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
              🚀 基于TuShare深度API + AkShare，100%真实数据分析市场宽度指标
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={fetchMarketBreadthData}
            disabled={loading}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              py: 1.5,
              px: 3,
              borderRadius: 2,
              border: '2px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.25)',
                border: '2px solid rgba(255,255,255,0.5)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.3)'
              },
              '&:disabled': {
                bgcolor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)'
              },
              transition: 'all 0.3s ease-in-out'
            }}
          >
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </Box>
      </Paper>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          数据获取失败: {error}
        </Alert>
      )}

      {/* 加载状态 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 数据展示 */}
      {marketData && (
        <Box>
          {/* 数据信息 */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  分析日期: <strong>{marketData.trade_date}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  总股票数: <strong>{marketData.total_stocks}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  数据质量: <Chip label={marketData.data_quality} size="small" color="success" />
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">
                  更新时间: <strong>{marketData.analysis_time}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* 核心指标 */}
          <UpDownAnalysisCard />
          <LimitAnalysisCard />
          <MarketActivityCard />

          {/* 分布图表 */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <PriceChangeDistributionChart />
            </Grid>
            <Grid item xs={12} lg={6}>
              <VolumeDistributionChart />
            </Grid>
          </Grid>

          <MarketCapDistributionChart />

          {/* 数据源信息 */}
          <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
            <Typography variant="body2" color="info.dark">
              📊 数据源: {marketData.data_source}
            </Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default MarketBreadth;