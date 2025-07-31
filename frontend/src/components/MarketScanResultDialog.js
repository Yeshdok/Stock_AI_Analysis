import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as DownloadIcon,
  TableChart as ExcelIcon,
  Assessment as CSVIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { strategyAPI } from '../utils/api';

function TabPanel({ children, value, index, ...other }) {
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

export default function MarketScanResultDialog({ open, onClose, scanResults, onExport }) {
  const [tabValue, setTabValue] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  if (!scanResults || !scanResults.success) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">扫描结果</Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            {scanResults?.message || '扫描失败，请重试'}
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const { 
    strategy_name, 
    scan_time, 
    total_analyzed, 
    qualified_count, 
    top_30_count,
    top_30_stocks,
    summary_stats,
    max_score,
    avg_score,
    elapsed_time
  } = scanResults;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      await strategyAPI.exportExcel(scanResults);
      // 显示成功消息
      if (onExport) {
        onExport('Excel导出成功');
      }
    } catch (error) {
      console.error('导出Excel失败:', error);
      if (onExport) {
        onExport('Excel导出失败: ' + error.message, 'error');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      await strategyAPI.exportCSV(scanResults);
      // 显示成功消息
      if (onExport) {
        onExport('CSV导出成功');
      }
    } catch (error) {
      console.error('导出CSV失败:', error);
      if (onExport) {
        onExport('CSV导出失败: ' + error.message, 'error');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      'S+': '#ff4569',
      'S': '#ff6b6b',
      'A+': '#4ecdc4',
      'A': '#45b7d1',
      'B+': '#f9ca24',
      'B': '#f0932b',
      'C+': '#eb4d4b',
      'C': '#6c5ce7',
      'D': '#a55eea'
    };
    return gradeColors[grade] || '#95a5a6';
  };

  const getSignalIcon = (signalStrength) => {
    switch (signalStrength) {
      case '强烈买入':
        return <TrendingUpIcon sx={{ color: '#e74c3c', fontSize: 16 }} />;
      case '买入':
        return <TrendingUpIcon sx={{ color: '#27ae60', fontSize: 16 }} />;
      case '强烈卖出':
        return <TrendingDownIcon sx={{ color: '#e74c3c', fontSize: 16 }} />;
      case '卖出':
        return <TrendingDownIcon sx={{ color: '#e67e22', fontSize: 16 }} />;
      default:
        return <RemoveIcon sx={{ color: '#95a5a6', fontSize: 16 }} />;
    }
  };

  const getRecommendationStars = (recommendation) => {
    const starCount = (recommendation.match(/⭐/g) || []).length;
    return starCount;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              🏆 {strategy_name} - 前30强股票
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              扫描时间: {scan_time} | 分析耗时: {elapsed_time}秒
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="导出Excel">
              <IconButton 
                onClick={handleExportExcel} 
                disabled={exportLoading}
                color="primary"
              >
                {exportLoading ? <CircularProgress size={20} /> : <ExcelIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="导出CSV">
              <IconButton 
                onClick={handleExportCSV} 
                disabled={exportLoading}
                color="primary"
              >
                {exportLoading ? <CircularProgress size={20} /> : <CSVIcon />}
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="扫描结果选项卡">
          <Tab 
            label={`前30强股票 (${top_30_count})`} 
            icon={<TimelineIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="统计分析" 
            icon={<PieChartIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <TabPanel value={tabValue} index={0}>
          {/* 概览卡片 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {total_analyzed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    总分析股票
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {qualified_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    符合条件股票
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {max_score?.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    最高评分
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {avg_score?.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均评分
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 股票排行榜 */}
          <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 400px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>排名</strong></TableCell>
                  <TableCell><strong>股票</strong></TableCell>
                  <TableCell align="center"><strong>评分</strong></TableCell>
                  <TableCell align="center"><strong>等级</strong></TableCell>
                  <TableCell align="center"><strong>信号</strong></TableCell>
                  <TableCell align="center"><strong>信号强度</strong></TableCell>
                  <TableCell align="right"><strong>最新价格</strong></TableCell>
                  <TableCell align="right"><strong>涨跌幅</strong></TableCell>
                  <TableCell align="center"><strong>推荐度</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {top_30_stocks?.map((stock, index) => (
                  <TableRow 
                    key={stock.stock_code}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        backgroundColor: 'action.hover' 
                      },
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            color: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : 'text.primary',
                            minWidth: 30
                          }}
                        >
                          {index + 1}
                        </Typography>
                        {index < 3 && (
                          <StarIcon 
                            sx={{ 
                              ml: 0.5, 
                              color: ['#ffd700', '#c0c0c0', '#cd7f32'][index] 
                            }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {stock.stock_code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stock.stock_name}
                        </Typography>
                        <Chip 
                          label={stock.market} 
                          size="small" 
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {stock.score?.toFixed(1)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={stock.score}
                          sx={{ 
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.300',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: stock.score >= 85 ? '#4caf50' : 
                                              stock.score >= 70 ? '#ff9800' : '#f44336'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={stock.grade}
                        sx={{
                          backgroundColor: getGradeColor(stock.grade),
                          color: 'white',
                          fontWeight: 'bold',
                          minWidth: 40
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stock.signals_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          买{stock.buy_signals}/卖{stock.sell_signals}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        {getSignalIcon(stock.signal_strength)}
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {stock.signal_strength}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ¥{stock.latest_price?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          color: stock.price_change >= 0 ? '#e74c3c' : '#27ae60',
                          fontWeight: 'bold'
                        }}
                      >
                        {stock.price_change >= 0 ? '+' : ''}{stock.price_change?.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        {Array.from({ length: getRecommendationStars(stock.recommendation) }, (_, i) => (
                          <StarIcon key={i} sx={{ color: '#ffd700', fontSize: 16 }} />
                        ))}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          ({getRecommendationStars(stock.recommendation)}/5)
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* 统计分析 */}
          <Grid container spacing={3}>
            {summary_stats && (
              <>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <BarChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        等级分布
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {Object.entries(summary_stats.grade_distribution || {}).map(([grade, count]) => (
                        <Box key={grade} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={grade}
                            size="small"
                            sx={{
                              backgroundColor: getGradeColor(grade),
                              color: 'white',
                              minWidth: 40
                            }}
                          />
                          <Typography>{count} 只</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <PieChartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        市场分布
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {Object.entries(summary_stats.market_distribution || {}).map(([market, count]) => (
                        <Box key={market} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Chip label={market} size="small" variant="outlined" />
                          <Typography>{count} 只</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <TimelineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        信号强度分布
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      {Object.entries(summary_stats.signal_strength_distribution || {}).map(([strength, count]) => (
                        <Box key={strength} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {getSignalIcon(strength)}
                            <Typography variant="body2">{strength}</Typography>
                          </Box>
                          <Typography>{count} 只</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<ExcelIcon />}
              onClick={handleExportExcel}
              disabled={exportLoading}
              color="success"
            >
              导出Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<CSVIcon />}
              onClick={handleExportCSV}
              disabled={exportLoading}
            >
              导出CSV
            </Button>
          </Box>
          <Button onClick={onClose} variant="contained">
            关闭
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
} 