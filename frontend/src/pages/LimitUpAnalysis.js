import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  Analytics,
  Refresh
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`limit-up-tabpanel-${index}`}
      aria-labelledby={`limit-up-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function LimitUpAnalysis() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7'); // 默认7天
  const [limitUpData, setLimitUpData] = useState(null);
  const [timeDistributionData, setTimeDistributionData] = useState(null);
  const [continuationData, setContinuationData] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 获取涨停数据
  const fetchLimitUpData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 开始获取涨停分析数据...');
      
      const response = await fetch('/api/limit-up-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: parseInt(dateRange)
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLimitUpData(data.data.daily_stats);
        setTimeDistributionData(data.data.time_distribution);
        setContinuationData(data.data.continuation_analysis);
        console.log('✅ 涨停数据获取成功');
      } else {
        throw new Error(data.message || '数据获取失败');
      }
    } catch (err) {
      console.error('❌ 涨停数据获取失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchLimitUpData();
  }, [fetchLimitUpData]);

  // 颜色配置
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#e74c3c', '#9b59b6', '#3498db'];

  // 涨停时间分布图表
  const TimeDistributionChart = () => {
    if (!timeDistributionData) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ mr: 1, color: 'primary.main' }} />
            涨停时间分布统计
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            分析股票在交易日内不同时间段达到涨停的分布情况
          </Typography>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={timeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time_range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="涨停股票数量" />
              <Bar dataKey="percentage" fill="#82ca9d" name="占比%" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // 连板成功率分析
  const ContinuationAnalysisChart = () => {
    if (!continuationData) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
            首次涨停股次日连板分析
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            分析首次涨停股票第二天继续涨停的成功率
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={continuationData.success_rate_pie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {continuationData.success_rate_pie?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  关键指标
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                      <Typography variant="h4" color="success.contrastText">
                        {continuationData.total_first_limit_up || 0}
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        首次涨停股票
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                      <Typography variant="h4" color="info.contrastText">
                        {continuationData.continuation_count || 0}
                      </Typography>
                      <Typography variant="body2" color="info.contrastText">
                        次日继续涨停
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                      <Typography variant="h4" color="primary.contrastText">
                        {continuationData.success_rate || 0}%
                      </Typography>
                      <Typography variant="body2" color="primary.contrastText">
                        连板成功率
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // 每日涨停统计表格
  const DailyStatsTable = () => {
    if (!limitUpData) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Analytics sx={{ mr: 1, color: 'warning.main' }} />
            每日涨停股票统计
          </Typography>
          
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>交易日期</TableCell>
                  <TableCell align="right">涨停股票数量</TableCell>
                  <TableCell align="right">首次涨停</TableCell>
                  <TableCell align="right">连续涨停</TableCell>
                  <TableCell align="right">次日连板率</TableCell>
                  <TableCell>市场情绪</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {limitUpData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      {row.trade_date}
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={row.total_limit_up} 
                        color="primary" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell align="right">{row.first_limit_up}</TableCell>
                    <TableCell align="right">{row.continuous_limit_up}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${row.next_day_rate}%`}
                        color={row.next_day_rate > 30 ? 'success' : row.next_day_rate > 15 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={row.market_sentiment}
                        color={
                          row.market_sentiment === '强势' ? 'success' : 
                          row.market_sentiment === '中性' ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 标题和控制面板 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1, fontSize: '2rem', color: 'primary.main' }} />
          涨停股分析中心
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          基于TuShare+AkShare真实数据，深度分析涨停股表现和连板成功率
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <FormControl size="small">
            <InputLabel>分析时间范围</InputLabel>
            <Select
              value={dateRange}
              label="分析时间范围"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="3">近3天</MenuItem>
              <MenuItem value="7">近7天</MenuItem>
              <MenuItem value="15">近15天</MenuItem>
              <MenuItem value="30">近30天</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={fetchLimitUpData}
            disabled={loading}
          >
            {loading ? '分析中...' : '刷新数据'}
          </Button>
        </Box>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          数据获取失败：{error}
        </Alert>
      )}

      {/* 加载进度条 */}
      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            正在分析涨停数据，请稍候...
          </Typography>
        </Box>
      )}

      {/* 标签页导航 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label="涨停时间分布" 
            icon={<Schedule />} 
            iconPosition="start"
          />
          <Tab 
            label="连板成功率分析" 
            icon={<TrendingUp />} 
            iconPosition="start"
          />
          <Tab 
            label="每日统计详情" 
            icon={<Analytics />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 标签页内容 */}
      <TabPanel value={tabValue} index={0}>
        <TimeDistributionChart />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ContinuationAnalysisChart />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <DailyStatsTable />
      </TabPanel>
    </Container>
  );
}

export default LimitUpAnalysis;