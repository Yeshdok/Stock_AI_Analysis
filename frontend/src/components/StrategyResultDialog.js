import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Speed,
  Info,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

function StrategyResultDialog({ open, onClose, result }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!result) {
    return null;
  }

  // 处理错误情况
  if (!result.success) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorIcon color="error" />
            策略执行失败
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            {result.error || '策略执行过程中发生未知错误'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const {
    strategy_name,
    strategy_type,
    stock_code,
    data_source,
    data_period,
    data_points,
    signals_count,
    buy_signals_count,
    sell_signals_count,
    signals,
    execution_result,
    latest_price,
    price_change,
    message,
    recommendations
  } = result;

  const getStrategyTypeLabel = (type) => {
    const types = {
      'trend': '趋势跟踪',
      'mean_reversion': '均值回归',
      'arbitrage': '统计套利',
      'high_frequency': '高频交易',
      'multi_factor': '多因子选股'
    };
    return types[type] || type;
  };

  const getSignalColor = (type) => {
    switch (type) {
      case 'BUY': return 'success';
      case 'SELL': return 'error';
      default: return 'default';
    }
  };

  const getSignalIcon = (type) => {
    switch (type) {
      case 'BUY': return <TrendingUp />;
      case 'SELL': return <TrendingDown />;
      default: return <Info />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const formatPrice = (price) => {
    return price ? `¥${price.toFixed(2)}` : '-';
  };

  const formatPercent = (value) => {
    return value ? `${value.toFixed(2)}%` : '0%';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircle color="success" />
            <Box>
              <Typography variant="h6">{strategy_name} - 执行结果</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {stock_code} | {getStrategyTypeLabel(strategy_type)}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={`${signals_count} 个信号`} 
            color="primary" 
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* 执行摘要 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>

        {/* 快速统计 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  数据期间
                </Typography>
                <Typography variant="h6">
                  {data_period}
                </Typography>
                <Typography variant="body2">
                  {data_points} 个数据点
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  当前价格
                </Typography>
                <Typography variant="h6">
                  {formatPrice(latest_price)}
                </Typography>
                <Typography variant="body2" color={price_change >= 0 ? 'success.main' : 'error.main'}>
                  {price_change >= 0 ? '+' : ''}{formatPercent(price_change)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  买入信号
                </Typography>
                <Typography variant="h6" color="success.main">
                  {buy_signals_count}
                </Typography>
                <Typography variant="body2">
                  {signals_count > 0 ? `${(buy_signals_count / signals_count * 100).toFixed(1)}%` : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom>
                  卖出信号
                </Typography>
                <Typography variant="h6" color="error.main">
                  {sell_signals_count}
                </Typography>
                <Typography variant="body2">
                  {signals_count > 0 ? `${(sell_signals_count / signals_count * 100).toFixed(1)}%` : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 详细信息选项卡 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="执行指标" />
            <Tab label="交易信号" />
            <Tab label="策略建议" />
            <Tab label="数据详情" />
          </Tabs>
        </Box>

        {/* 执行指标 */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                信号统计
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="总信号数" 
                    secondary={execution_result?.total_signals || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="买入信号" 
                    secondary={execution_result?.buy_signals || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="卖出信号" 
                    secondary={execution_result?.sell_signals || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="平均信号强度" 
                    secondary={execution_result?.avg_signal_strength ? `${(execution_result.avg_signal_strength * 100).toFixed(1)}%` : '0%'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="信号频率" 
                    secondary={execution_result?.signal_frequency ? `${execution_result.signal_frequency.toFixed(2)}%` : '0%'} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                数据源信息
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="数据来源" 
                    secondary={data_source} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="策略类型" 
                    secondary={getStrategyTypeLabel(strategy_type)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="分析时间范围" 
                    secondary={data_period} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="数据点数量" 
                    secondary={`${data_points} 个交易日`} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 交易信号 */}
        <TabPanel value={tabValue} index={1}>
          {signals && signals.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>日期</TableCell>
                    <TableCell>信号类型</TableCell>
                    <TableCell align="right">价格</TableCell>
                    <TableCell>信号描述</TableCell>
                    <TableCell align="right">强度</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {signals.map((signal, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(signal.date)}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getSignalIcon(signal.type)}
                          label={signal.type}
                          color={getSignalColor(signal.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatPrice(signal.price)}</TableCell>
                      <TableCell>{signal.signal}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={signal.strength * 100}
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {(signal.strength * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              当前市场条件下未产生交易信号
            </Alert>
          )}
        </TabPanel>

        {/* 策略建议 */}
        <TabPanel value={tabValue} index={2}>
          {recommendations && recommendations.length > 0 ? (
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Info color="primary" fontSize="small" />
                        {recommendation}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              暂无策略建议
            </Alert>
          )}
        </TabPanel>

        {/* 数据详情 */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                执行参数
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>股票代码:</strong> {stock_code}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>策略名称:</strong> {strategy_name}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>策略类型:</strong> {getStrategyTypeLabel(strategy_type)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>数据源:</strong> {data_source}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                数据质量
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>数据期间:</strong> {data_period}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>数据点数:</strong> {data_points} 个交易日
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>信号密度:</strong> {execution_result?.signal_frequency ? `${execution_result.signal_frequency.toFixed(2)}%` : '0%'}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>当前价格:</strong> {formatPrice(latest_price)}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StrategyResultDialog; 