import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Assessment,
  Star,
  Visibility,
  PieChart,
  BarChart,
  Close,
  Info,
  CheckCircle
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`result-tabpanel-${index}`}
      aria-labelledby={`result-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StrategyResultDisplay = ({ open, onClose, scanResults }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExportResults = () => {
    if (!scanResults?.qualified_stocks) return;

    // 准备导出数据
    const exportData = scanResults.qualified_stocks.map((stock, index) => ({
      排名: index + 1,
      股票代码: stock.stock_code,
      股票名称: stock.stock_name,
      交易所: stock.exchange,
      综合评分: stock.score?.toFixed(2) || 'N/A',
      市盈率PE: stock.pe?.toFixed(2) || 'N/A',
      市净率PB: stock.pb?.toFixed(2) || 'N/A',
      净资产收益率ROE: stock.roe ? `${stock.roe.toFixed(2)}%` : 'N/A',
      市值: stock.market_cap ? `${stock.market_cap.toFixed(2)}亿` : 'N/A',
      数据源: stock.data_source,
      分析时间: stock.analysis_time
    }));

    // 转换为CSV格式
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `策略分析结果_${scanResults.strategy_info?.name || '未知策略'}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 70) return '#8bc34a';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '合格';
    return '不合格';
  };

  if (!scanResults) return null;

  const {
    strategy_info = {},
    scan_summary = {},
    qualified_stocks = [],
    top_30_stocks = [],
    data_sources = {},
    total_analyzed = 0,
    data_quality = 0,
    execution_time = 0
  } = scanResults;

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
      <DialogTitle 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment />
          策略执行结果: {strategy_info.name || '未知策略'}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 执行概览 */}
        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Card elevation={2}>
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
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {qualified_stocks.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    符合条件股票
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {data_quality.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    数据质量
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                    {execution_time}s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    执行耗时
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 数据源统计 */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              数据源统计:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`AkShare: ${data_sources.akshare || 0}`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`TuShare: ${data_sources.tushare || 0}`} 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* 结果标签页 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="策略结果标签页">
            <Tab 
              label={`前30强股票 (${top_30_stocks.length})`} 
              icon={<Star />} 
              iconPosition="start"
            />
            <Tab 
              label={`全部结果 (${qualified_stocks.length})`} 
              icon={<Assessment />} 
              iconPosition="start"
            />
            <Tab 
              label="数据分析" 
              icon={<PieChart />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 标签页内容 */}
        <Box sx={{ height: '400px', overflow: 'auto' }}>
          <TabPanel value={activeTab} index={0}>
            {/* 前30强股票 */}
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>排名</TableCell>
                    <TableCell>股票代码</TableCell>
                    <TableCell>股票名称</TableCell>
                    <TableCell>综合评分</TableCell>
                    <TableCell>PE</TableCell>
                    <TableCell>PB</TableCell>
                    <TableCell>ROE(%)</TableCell>
                    <TableCell>市值(亿)</TableCell>
                    <TableCell>数据源</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {top_30_stocks.map((stock, index) => (
                    <TableRow key={stock.stock_code} hover>
                      <TableCell>
                        <Chip
                          label={index + 1}
                          size="small"
                          color={index < 3 ? 'secondary' : 'default'}
                          sx={{ 
                            fontWeight: 'bold',
                            ...(index < 3 && { bgcolor: '#ffd700', color: 'black' })
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {stock.stock_code}
                      </TableCell>
                      <TableCell>{stock.stock_name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: getScoreColor(stock.score)
                            }}
                          >
                            {stock.score?.toFixed(1) || 'N/A'}
                          </Typography>
                          <Chip
                            label={getScoreLabel(stock.score)}
                            size="small"
                            sx={{
                              bgcolor: getScoreColor(stock.score),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{stock.pe?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.pb?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.roe?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.market_cap?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={stock.data_source || 'unknown'}
                          size="small"
                          variant="outlined"
                          color={stock.data_source === 'akshare' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* 全部结果 */}
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>排名</TableCell>
                    <TableCell>股票代码</TableCell>
                    <TableCell>股票名称</TableCell>
                    <TableCell>交易所</TableCell>
                    <TableCell>综合评分</TableCell>
                    <TableCell>PE</TableCell>
                    <TableCell>PB</TableCell>
                    <TableCell>ROE(%)</TableCell>
                    <TableCell>市值(亿)</TableCell>
                    <TableCell>分析时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {qualified_stocks.map((stock, index) => (
                    <TableRow key={stock.stock_code} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {stock.stock_code}
                      </TableCell>
                      <TableCell>{stock.stock_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={stock.exchange}
                          size="small"
                          color={stock.exchange === 'SH' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: getScoreColor(stock.score)
                          }}
                        >
                          {stock.score?.toFixed(1) || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{stock.pe?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.pb?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.roe?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>{stock.market_cap?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {stock.analysis_time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* 数据分析 */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 评分分布统计
                    </Typography>
                    {(() => {
                      const scoreRanges = {
                        '优秀(80+)': qualified_stocks.filter(s => s.score >= 80).length,
                        '良好(70-79)': qualified_stocks.filter(s => s.score >= 70 && s.score < 80).length,
                        '合格(60-69)': qualified_stocks.filter(s => s.score >= 60 && s.score < 70).length,
                        '不合格(<60)': qualified_stocks.filter(s => s.score < 60).length
                      };
                      
                      return Object.entries(scoreRanges).map(([range, count]) => (
                        <Box key={range} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{range}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {count} ({((count / qualified_stocks.length) * 100).toFixed(1)}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / qualified_stocks.length) * 100}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      ));
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🏢 交易所分布
                    </Typography>
                    {(() => {
                      const exchangeStats = qualified_stocks.reduce((acc, stock) => {
                        acc[stock.exchange] = (acc[stock.exchange] || 0) + 1;
                        return acc;
                      }, {});
                      
                      return Object.entries(exchangeStats).map(([exchange, count]) => (
                        <Box key={exchange} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{exchange}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {count} ({((count / qualified_stocks.length) * 100).toFixed(1)}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={(count / qualified_stocks.length) * 100}
                            color={exchange === 'SH' ? 'primary' : 'secondary'}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>
                      ));
                    })()}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" icon={<Info />}>
                  <Typography variant="body2">
                    <strong>分析说明:</strong> 本次策略分析共检测 {total_analyzed} 只股票，
                    其中 {qualified_stocks.length} 只股票符合策略条件，
                    数据质量达到 {data_quality.toFixed(1)}%，执行耗时 {execution_time} 秒。
                    数据来源包括 AkShare ({data_sources.akshare || 0} 只股票) 
                    和 TuShare ({data_sources.tushare || 0} 只股票)。
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          关闭
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Download />}
          onClick={handleExportResults}
          disabled={!qualified_stocks.length}
        >
          导出结果
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StrategyResultDisplay; 