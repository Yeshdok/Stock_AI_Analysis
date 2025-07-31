import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  FileDownload as ExcelIcon,
  Description as CsvIcon,
  TrendingUp,
  Assessment,
  Star,
  Timeline
} from '@mui/icons-material';

const Top50ResultsDialog = ({ open, onClose, results, strategyName, executionSummary, onStockSelect }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  // 导出Excel功能
  const exportToExcel = () => {
    try {
      console.log('🚀 开始导出Excel...');
      
      // 构建CSV格式数据（Excel可以直接打开CSV）
      const csvHeaders = [
        '排名',
        '股票代码', 
        '股票名称',
        '评分',
        '市场',
        '行业',
        '分析原因',
        '信号数量',
        '数据源',
        '分析时间'
      ];
      
      const csvData = results.map((stock, index) => [
        index + 1,
        stock.stock_code || '',
        stock.stock_name || '',
        stock.score || 0,
        stock.market || '',
        stock.industry || '',
        stock.analysis_reason || '',
        stock.signals_count || 0,
        stock.data_source || '',
        stock.analysis_timestamp || ''
      ]);
      
      // 转换为CSV格式
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // 添加BOM以支持中文
      const bom = '\uFEFF';
      const csvWithBom = bom + csvContent;
      
      // 创建下载链接
      const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `TOP50分析结果_${strategyName}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Excel导出成功！');
        alert('📊 TOP50分析结果已导出为Excel文件！');
      }
    } catch (error) {
      console.error('❌ Excel导出失败:', error);
      alert('❌ 导出失败，请重试！');
    }
  };

  // 导出JSON功能
  const exportToJson = () => {
    try {
      console.log('🚀 开始导出JSON...');
      
      const exportData = {
        strategy_name: strategyName,
        export_time: new Date().toISOString(),
        execution_summary: executionSummary,
        top50_results: results,
        metadata: {
          total_count: results.length,
          avg_score: results.reduce((sum, stock) => sum + (stock.score || 0), 0) / results.length,
          high_score_count: results.filter(stock => (stock.score || 0) >= 80).length
        }
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `TOP50分析详情_${strategyName}_${new Date().toISOString().slice(0, 10)}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ JSON导出成功！');
        alert('📋 详细分析数据已导出为JSON文件！');
      }
    } catch (error) {
      console.error('❌ JSON导出失败:', error);
      alert('❌ 导出失败，请重试！');
    }
  };

  // 获取评分颜色
  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50'; // 绿色 - 优秀
    if (score >= 80) return '#8bc34a'; // 浅绿 - 良好
    if (score >= 70) return '#ff9800'; // 橙色 - 一般
    if (score >= 60) return '#ff5722'; // 深橙 - 较低
    return '#f44336'; // 红色 - 很低
  };

  // 获取评分等级
  const getScoreGrade = (score) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    if (score >= 60) return '较低';
    return '很低';
  };

  // 处理股票行双击事件
  const handleStockDoubleClick = (stock) => {
    if (onStockSelect && stock.stock_code && stock.stock_name) {
      console.log(`🎯 双击股票: ${stock.stock_code} ${stock.stock_name}`);
      
      // 关闭当前对话框
      onClose();
      
      // 调用回调函数，传递股票信息到父组件
      onStockSelect({
        code: stock.stock_code,
        name: stock.stock_name,
        market: stock.market,
        industry: stock.industry
      });
    }
  };

  // 计算统计数据
  const stats = {
    totalCount: results.length,
    avgScore: results.length > 0 ? (results.reduce((sum, stock) => sum + (stock.score || 0), 0) / results.length).toFixed(1) : 0,
    excellentCount: results.filter(stock => (stock.score || 0) >= 90).length,
    goodCount: results.filter(stock => (stock.score || 0) >= 80 && (stock.score || 0) < 90).length,
    fairCount: results.filter(stock => (stock.score || 0) >= 70 && (stock.score || 0) < 80).length,
    lowCount: results.filter(stock => (stock.score || 0) < 70).length
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          bgcolor: 'background.paper',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                TOP50 分析评分详情
              </Typography>
              <Typography variant="body2" color="text.secondary">
                策略: {strategyName} | 共{stats.totalCount}只股票 | 平均评分: {stats.avgScore}分
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="导出Excel">
              <IconButton 
                onClick={exportToExcel}
                sx={{ 
                  bgcolor: '#1976d2', 
                  color: 'white',
                  '&:hover': { bgcolor: '#1565c0' }
                }}
              >
                <ExcelIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="导出JSON">
              <IconButton 
                onClick={exportToJson}
                sx={{ 
                  bgcolor: '#388e3c', 
                  color: 'white',
                  '&:hover': { bgcolor: '#2e7d32' }
                }}
              >
                <CsvIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 统计概览 */}
        <Box sx={{ p: 3, bgcolor: 'rgba(33, 150, 243, 0.04)' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Star sx={{ fontSize: 40, color: '#ffd700', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffd700' }}>
                    {stats.excellentCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    优秀股票 (≥90分)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <TrendingUp sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {stats.goodCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    良好股票 (80-89分)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Timeline sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {stats.fairCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    一般股票 (70-79分)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: '#666', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#666' }}>
                    {stats.lowCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    其他股票 (&lt;70分)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* 详细列表 */}
        <Box sx={{ p: 3 }}>
          <TableContainer component={Paper} sx={{ maxHeight: '50vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>排名</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>股票代码</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>股票名称</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>评分</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>评级</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>市场</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>行业</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>分析原因</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>信号数</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>数据源</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((stock, index) => {
                  const score = stock.score || 0;
                  const grade = getScoreGrade(score);
                  const color = getScoreColor(score);
                  
                  return (
                    <TableRow 
                      key={stock.stock_code} 
                      hover
                      onDoubleClick={() => handleStockDoubleClick(stock)}
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                          cursor: 'pointer',
                          transform: 'scale(1.01)',
                          transition: 'all 0.2s ease-in-out'
                        },
                        bgcolor: index < 10 ? 'rgba(255, 215, 0, 0.1)' : 'transparent', // TOP10高亮
                        cursor: 'pointer'
                      }}
                      title="双击跳转到技术分析页面"
                    >
                      <TableCell>
                        <Chip 
                          label={index + 1} 
                          size="small" 
                          sx={{ 
                            bgcolor: index < 3 ? '#ffd700' : index < 10 ? '#silver' : 'default',
                            color: index < 10 ? '#000' : 'default',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {stock.stock_code}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {stock.stock_name}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: color,
                              minWidth: '45px'
                            }}
                          >
                            {score.toFixed(1)}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={score} 
                            sx={{ 
                              width: 60, 
                              height: 6,
                              bgcolor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: color
                              }
                            }} 
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={grade} 
                          size="small" 
                          sx={{ 
                            bgcolor: color, 
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={stock.market || '未知'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={stock.industry || '未知'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" title={stock.analysis_reason}>
                          {stock.analysis_reason && stock.analysis_reason.length > 30 
                            ? stock.analysis_reason.substring(0, 30) + '...' 
                            : stock.analysis_reason || '无'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={stock.signals_count || 0} 
                          size="small" 
                          color={(stock.signals_count || 0) > 0 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {stock.data_source || '未知'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {results.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              暂无分析结果数据
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          💡 提示：双击股票行跳转到技术分析页面，TOP10股票已高亮显示
        </Typography>
        <Button 
          onClick={exportToExcel} 
          variant="contained" 
          startIcon={<DownloadIcon />}
          sx={{ mr: 1 }}
        >
          导出Excel
        </Button>
        <Button onClick={onClose} variant="outlined">
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Top50ResultsDialog; 