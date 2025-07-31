import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ChipDistributionChart from '../components/ChipDistributionChart';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import * as api from '../utils/api';

const MarketOverview = () => {
  // 状态管理 - 强制启用真实数据
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [useRealData, setUseRealData] = useState(true); // 强制启用真实数据
  const [sortField, setSortField] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dataSource, setDataSource] = useState('');
  const [processingTime, setProcessingTime] = useState('');
  
  // 筹码分布对话框状态
  const [chipDialogOpen, setChipDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [chipData, setChipData] = useState(null);
  const [chipLoading, setChipLoading] = useState(false);
  
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 数据获取函数 - 强化版修复
  const fetchData = async (currentPage = page, currentKeyword = keyword, forceRealData = useRealData) => {
    // 取消之前的请求 - 优化：只有在页面或关键词真正变化时才取消
    const isNewRequest = currentPage !== page || currentKeyword !== keyword;
    if (abortControllerRef.current && isNewRequest) {
      console.log('🚫 取消之前的请求，开始新请求');
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 正在获取全市场真实数据...', { page: currentPage, keyword: currentKeyword, realData: forceRealData });
      const startTime = Date.now();
      
      const response = await api.getMarketOverview({
        page: currentPage,
        page_size: pageSize,
        keyword: currentKeyword.trim(),
        real_data: forceRealData,
        sort_field: sortField,
        sort_order: sortOrder
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (response.data.success) {
        // 修复数据解析路径 - 数据在response.data.data.stocks中
        const stocksData = response.data.data?.stocks || [];
        const totalCount = response.data.data?.total || 0;
        const dataSourceInfo = response.data.data?.data_source || response.data.data_source || '未知数据源';
        
        console.log('✅ 真实数据获取成功:', stocksData.length, '条', 'Total:', totalCount);
        console.log('📊 数据源:', dataSourceInfo);
        console.log('🔍 样本数据:', stocksData.slice(0, 2)); // 显示前2条用于调试
        
        setData(stocksData);
        setTotal(totalCount);
        setDataSource(dataSourceInfo);
        setProcessingTime(response.data.processing_time || `${elapsed}秒`);
        
        // 验证数据源是否为真实数据
        const dataSourceStr = response.data.data_source || '';
        if (!dataSourceStr.includes('TuShare') && !dataSourceStr.includes('AkShare') && !forceRealData) {
          console.warn('⚠️ 警告：数据源可能不是真实数据:', dataSourceStr);
        }
        
      } else {
        const errorMsg = response.data.message || response.data.error || 'API返回未知错误';
        console.error('❌ API返回错误:', errorMsg);
        setError('API返回错误: ' + errorMsg);
      }
    } catch (err) {
      // 改进错误处理：区分不同类型的错误
      if (err.name === 'AbortError') {
        console.log('⚠️ 请求被用户取消');
        return; // 不显示错误信息，因为是用户主动取消
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        console.error('⏰ 请求超时:', err);
        setError('数据获取超时，请稍后重试或尝试减少每页数量');
      } else if (err.response?.status >= 500) {
        console.error('🔥 服务器错误:', err);
        setError('服务器内部错误，请稍后重试');
      } else if (err.response?.status === 404) {
        console.error('🔍 API不存在:', err);
        setError('API服务不可用，请确认后端服务正在运行');
      } else {
        console.error('❌ 数据获取失败:', err);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || '网络连接错误';
        setError('数据获取失败: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理 - 智能搜索功能
  const handleSearch = async () => {
    console.log('🔍 执行智能搜索:', keyword);
    
    if (!keyword.trim()) {
      // 如果搜索框为空，显示全市场数据
      setPage(1);
      setError('');
      fetchData(1, '', true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 开始搜索股票:', keyword);
      const response = await api.stockAPI.searchStocks(keyword, 50); // 搜索最多50只股票
      
      if (response && response.success && response.stocks) {
        console.log('✅ 搜索成功:', response.stocks.length, '只股票');
        
        // 数据去重处理：基于股票代码去重，优先保留有效价格的数据
        const uniqueStocks = [];
        const seenCodes = new Set();
        
        // 先处理有价格数据的股票
        response.stocks.forEach(stock => {
          if (stock.close > 0 && !seenCodes.has(stock.code)) {
            uniqueStocks.push(stock);
            seenCodes.add(stock.code);
          }
        });
        
        // 再处理无价格数据的股票（如果对应代码还没有记录）
        response.stocks.forEach(stock => {
          if (stock.close === 0 && !seenCodes.has(stock.code)) {
            uniqueStocks.push(stock);
            seenCodes.add(stock.code);
          }
        });
        
        console.log('✅ 去重后:', uniqueStocks.length, '只股票');
        setData(uniqueStocks);
        setTotal(uniqueStocks.length);
        setPage(1);
        setDataSource(`搜索结果 - 关键词: "${keyword}"`);
        setProcessingTime('搜索完成');
      } else {
        console.warn('⚠️ 搜索无结果');
        setData([]);
        setTotal(0);
        setDataSource(`搜索无结果 - 关键词: "${keyword}"`);
        setError(`未找到包含 "${keyword}" 的股票`);
      }
    } catch (err) {
      console.error('❌ 搜索失败:', err);
      setError(`搜索失败: ${err.message || '网络错误'}`);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 页面变化处理 - 强化版防抖
  const handlePageChange = (event, newPage) => {
    console.log('📄 页面切换:', newPage);
    setPage(newPage);
    setError(''); // 清除错误信息
    
    // 防抖：短暂延迟避免快速分页点击
    setTimeout(() => {
      fetchData(newPage, keyword, true); // 强制使用真实数据
    }, 100);
  };

  // 每页数量变化处理 - 强化版防抖
  const handlePageSizeChange = (event) => {
    const newPageSize = event.target.value;
    console.log('📊 每页数量变化:', newPageSize);
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
    setError(''); // 清除错误信息
    
    // 防抖：短暂延迟确保状态更新完成
    setTimeout(() => {
      fetchData(1, keyword, true); // 强制使用真实数据
    }, 200);
  };

  // 手动刷新处理 - 增加冷却时间
  const handleManualRefresh = () => {
    if (loading) {
      console.log('⏸️ 正在加载中，跳过手动刷新');
      return;
    }
    
    console.log('🔄 手动刷新数据...');
    setError(''); // 清除错误信息
    fetchData(page, keyword, true); // 强制使用真实数据
  };

  // 自动刷新设置 - 强化版优化
  useEffect(() => {
    // 清理之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      // 延迟启动自动刷新，避免与初始化冲突
      const startAutoRefresh = () => {
        intervalRef.current = setInterval(() => {
          // 只有在非加载状态且无错误时才自动刷新
          if (!loading && !error) {
            console.log('🔄 自动刷新真实数据...');
            fetchData(page, keyword, true); // 强制使用真实数据
          } else {
            console.log('⏸️ 跳过自动刷新 - 系统忙碌中');
          }
        }, 600000); // 600秒（10分钟）自动刷新
      };
      
      // 延迟5秒启动自动刷新，让初始加载完成
      const delayTimer = setTimeout(startAutoRefresh, 5000);
      
      return () => {
        clearTimeout(delayTimer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // 只在组件卸载时取消请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoRefresh]); // 移除 page 和 keyword 依赖，避免频繁重建定时器

  // 初始化数据加载 - 强制真实数据优化
  useEffect(() => {
    console.log('🚀 初始化加载真实数据...');
    
    // 防抖：延迟一小段时间再加载，确保所有状态都稳定
    const initTimer = setTimeout(() => {
      fetchData(1, '', true); // 强制使用真实数据初始化
    }, 500);
    
    return () => {
      clearTimeout(initTimer);
    };
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // 键盘事件处理（回车搜索）- 智能搜索版
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // 防止表单提交
      handleSearch();
    }
  };
  
  // 清空搜索处理
  const handleClearSearch = () => {
    console.log('🧹 清空搜索');
    setKeyword('');
    setPage(1);
    setError('');
    fetchData(1, '', true); // 显示全市场数据
  };

  // 双击显示筹码分布
  const handleStockDoubleClick = async (stock) => {
    console.log('双击股票:', stock.name, stock.code);
    setSelectedStock(stock);
    setChipDialogOpen(true);
    setChipLoading(true);
    
    try {
      const response = await axios.get(`http://127.0.0.1:5001/api/chip-distribution/${stock.code}`, {
        timeout: 15000
      });
      
      if (response.data && response.data.success) {
        const chipDistributionData = response.data.data;
        console.log('筹码分布数据:', chipDistributionData);
        
        // 确保数据格式正确 - 修复版
        if (chipDistributionData && (chipDistributionData.distribution || chipDistributionData.chip_distribution)) {
          // 统一数据格式：确保使用 distribution 字段
          if (chipDistributionData.chip_distribution && !chipDistributionData.distribution) {
            chipDistributionData.distribution = chipDistributionData.chip_distribution;
            delete chipDistributionData.chip_distribution;
          }
          
          // 确保statistics字段格式正确
          if (chipDistributionData.statistics) {
            const stats = chipDistributionData.statistics;
            // 统一字段名称
            if (stats.avg_cost && !stats.average_cost) {
              stats.average_cost = stats.avg_cost;
            }
            if (stats.average_cost && !stats.avg_cost) {
              stats.avg_cost = stats.average_cost;
            }
            // 确保集中度字段
            if (stats.concentration_ratio && !stats.concentration) {
              stats.concentration = stats.concentration_ratio * 100;
            }
          }
          
          console.log('✅ 筹码分布数据格式化完成:', chipDistributionData);
          setChipData(chipDistributionData);
        } else {
          console.warn('筹码分布数据格式异常:', chipDistributionData);
          setChipData(null);
        }
      } else {
        console.error('筹码分布数据获取失败:', response.data?.error);
        setChipData(null);
      }
    } catch (error) {
      console.error('筹码分布API调用失败:', error);
      setChipData(null);
    } finally {
      setChipLoading(false);
    }
  };

  // 关闭筹码分布对话框
  const handleCloseChipDialog = () => {
    setChipDialogOpen(false);
    setSelectedStock(null);
    setChipData(null);
  };

  // 获取数值颜色样式 - 优化可见性
  const getNumberStyle = (value, field) => {
    if (field === 'pct_chg' || field === 'change') {
      if (value > 0) return { color: '#d32f2f', fontWeight: 'bold', fontSize: '14px' }; // 深红色上涨
      if (value < 0) return { color: '#2e7d32', fontWeight: 'bold', fontSize: '14px' }; // 深绿色下跌
    }
    if (field === 'score') {
      if (value >= 90) return { color: '#d32f2f', fontWeight: 'bold', fontSize: '14px' }; // 高分深红色
      if (value >= 80) return { color: '#f57c00', fontWeight: 'bold', fontSize: '14px' }; // 中高分深橙色
      if (value >= 70) return { color: '#1976d2', fontWeight: 'bold', fontSize: '14px' }; // 中分深蓝色
      if (value < 60) return { color: '#616161', fontSize: '14px' }; // 低分深灰色
    }
    return { color: '#212121', fontSize: '14px' }; // 默认深色字体
  };

  // 获取信号类型颜色 - 优化对比度
  const getSignalColor = (signal) => {
    const colors = {
      '强烈买入': '#d32f2f',   // 深红色
      '买入': '#f57c00',       // 深橙色
      '持有': '#1976d2',       // 深蓝色
      '卖出': '#388e3c',       // 深绿色
      '强烈卖出': '#7b1fa2'    // 深紫色
    };
    return colors[signal] || '#616161';
  };

  // 渲染表格行 - 优化样式和可见性
  const renderTableRow = (stock, index) => (
    <tr key={stock.code} style={{ 
      backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
      transition: 'background-color 0.2s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#e3f2fd'}
    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff'}
    onDoubleClick={() => handleStockDoubleClick(stock)}
    title="双击查看筹码分布"
    >
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0', 
        fontWeight: 'bold',
        color: '#1565c0',
        fontSize: '14px'
      }}>
        {stock.code}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#212121',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {stock.name}
      </td>
      <td style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>
        <Chip 
          size="small" 
          label={stock.industry} 
          sx={{ 
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        />
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.area || '深圳'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0', 
        fontWeight: 'bold',
        color: '#212121',
        fontSize: '15px'
      }}>
        ¥{stock.close}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0', 
        ...getNumberStyle(stock.change_pct, 'pct_chg') 
      }}>
        {stock.change_pct !== undefined ? `${stock.change_pct > 0 ? '+' : ''}${stock.change_pct}%` : '0.00%'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0', 
        ...getNumberStyle((stock.close - stock.pre_close), 'change') 
      }}>
        {(stock.close !== undefined && stock.pre_close !== undefined) ? 
          `${(stock.close - stock.pre_close) > 0 ? '+' : ''}${(stock.close - stock.pre_close).toFixed(2)}` : '0.00'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.volume !== undefined && stock.volume !== null ? 
          (typeof stock.volume === 'number' ? 
            (stock.volume >= 10000 ? (stock.volume / 10000).toFixed(2) : stock.volume.toFixed(2)) : 
            parseFloat(stock.volume || 0).toFixed(2)
          ) : '0.00'}万手
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.amount ? (stock.amount / 10000).toFixed(2) : '0.00'}亿
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.turnover_rate !== undefined ? `${stock.turnover_rate}%` : '0.00%'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.pe !== undefined ? stock.pe : '0.00'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.pb !== undefined ? stock.pb : '0.000'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.roe !== undefined && stock.roe !== null ? 
          (stock.roe === 0 ? '0.0%' : `${stock.roe}%`) : '-'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.macd !== undefined ? stock.macd : '0.000'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0',
        color: '#424242',
        fontSize: '13px'
      }}>
        {stock.rsi !== undefined ? stock.rsi : '50'}
      </td>
      <td style={{ 
        padding: '12px 8px', 
        borderBottom: '1px solid #e0e0e0', 
        ...getNumberStyle(stock.score, 'score') 
      }}>
        {stock.score}分
      </td>
      <td style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>
        <Chip 
          size="small" 
          label={stock.signal_type}
          sx={{ 
            backgroundColor: getSignalColor(stock.signal_type),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            minWidth: '80px'
          }}
        />
      </td>
      <td style={{ padding: '12px 8px', borderBottom: '1px solid #e0e0e0' }}>
        <Chip 
          size="small" 
          label={stock.investment_style} 
          sx={{
            backgroundColor: '#f5f5f5',
            color: '#424242',
            fontSize: '12px'
          }}
        />
      </td>
    </tr>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AssignmentIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          全市场分析
        </Typography>
        <Chip 
          label={`${total}只股票`} 
          color="primary" 
          sx={{ ml: 2 }}
        />
      </Box>

      {/* 控制面板 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* 智能搜索框 */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="智能股票搜索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: keyword && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button
                        size="small"
                        onClick={handleClearSearch}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 1,
                          color: 'text.secondary',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                      >
                        清空
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSearch}
                        sx={{ 
                          minWidth: 'auto', 
                          px: 1.5,
                          fontSize: '0.75rem'
                        }}
                      >
                        搜索
                      </Button>
                    </Box>
                  )
                }}
                placeholder="支持：股票代码、公司名称、拼音缩写、行业关键词"
                size="small"
                helperText={
                  <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    💡 示例：平安 | 000001 | pab | 银行 | 科技 (支持模糊搜索)
                  </Box>
                }
              />
            </Grid>
            
            {/* 每页数量 */}
            <Grid item xs={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>每页显示</InputLabel>
                <Select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  label="每页显示"
                >
                  <MenuItem value={25}>25条</MenuItem>
                  <MenuItem value={50}>50条</MenuItem>
                  <MenuItem value={100}>100条</MenuItem>
                  <MenuItem value={200}>200条</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 数据源切换 - 锁定真实数据模式 */}
            <Grid item xs={6} md={1.8}>
              <FormControlLabel
                control={
                  <Switch
                    checked={true} // 强制锁定为真实数据
                    disabled={true} // 禁用切换
                    color="primary"
                  />
                }
                label="TuShare+AkShare真实数据"
              />
            </Grid>

            {/* 自动刷新 */}
            <Grid item xs={6} md={1.2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="secondary"
                  />
                }
                label="600秒刷新"
              />
            </Grid>

            {/* 操作按钮 */}
            <Grid item xs={6} md={2.5}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  size="small"
                >
                  搜索
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleManualRefresh}
                  startIcon={<RefreshIcon />}
                  size="small"
                  disabled={loading}
                >
                  刷新
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 数据状态信息 */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip label={`数据源: ${dataSource}`} color="info" size="small" />
        <Chip label={`处理时间: ${processingTime}`} color="default" size="small" />
        <Chip label={`第${page}页，共${Math.ceil(total/pageSize)}页`} color="primary" size="small" />
        {autoRefresh && <Chip label="自动刷新中" color="secondary" size="small" />}
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 加载状态 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>正在加载数据...</Typography>
        </Box>
      )}

      {/* 数据表格 */}
      {!loading && data.length > 0 && (
        <Card>
          <Box sx={{ overflow: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>代码</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>名称</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>行业</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>地区</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>最新价</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>涨跌幅%</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>涨跌额</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>成交量</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>成交额</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>换手率%</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>PE</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>PB</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>ROE%</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>MACD</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>RSI</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>评分</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>信号</th>
                  <th style={{ 
                    padding: '16px 12px', 
                    borderBottom: '2px solid #1565c0', 
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>投资风格</th>
                </tr>
              </thead>
              <tbody>
                {data.map((stock, index) => renderTableRow(stock, index))}
              </tbody>
            </table>
          </Box>
        </Card>
      )}

      {/* 空数据提示 */}
      {!loading && data.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            没有找到数据
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            请尝试调整搜索条件或刷新页面
          </Typography>
        </Card>
      )}

      {/* 分页控件 */}
      {total > pageSize && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={Math.ceil(total / pageSize)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* 筹码分布对话框 */}
      <Dialog 
        open={chipDialogOpen} 
        onClose={handleCloseChipDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              {selectedStock ? `${selectedStock.name} (${selectedStock.code})` : '筹码分布分析'}
            </Typography>
          </Box>
          <Button 
            onClick={handleCloseChipDialog}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          {chipLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>正在获取筹码分布数据...</Typography>
            </Box>
          ) : chipData ? (
            <Box>
              {/* 筹码分布关键指标 - 优化版 */}
              <Card sx={{ 
                mb: 3, 
                p: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.18)'
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
                  📊 筹码分布核心数据
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'medium' }}>
                        💰 当前价格
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: '#FFD700',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mt: 0.5
                      }}>
                        ¥{chipData.statistics?.current_price?.toFixed(2) || chipData.current_price?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'medium' }}>
                        🎯 主筹码峰
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: '#FF6B6B',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mt: 0.5
                      }}>
                        ¥{chipData.statistics?.main_peak_price?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'medium' }}>
                        ⚖️ 平均成本
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: '#4ECDC4',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mt: 0.5
                      }}>
                        ¥{chipData.statistics?.average_cost?.toFixed(2) || chipData.statistics?.avg_cost?.toFixed(2) || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'medium' }}>
                        📈 集中度
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        color: '#95E1D3',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mt: 0.5
                      }}>
                        {chipData.statistics?.concentration?.toFixed(1) || '0'}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>

              {/* 智能技术分析 - 优化版 */}
              <Card sx={{ mb: 3, p: 3, background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748', textAlign: 'center' }}>
                  🔍 智能技术分析
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(76, 175, 80, 0.15)',
                      border: '2px solid rgba(76, 175, 80, 0.3)',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                        📉 支撑位
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                        ¥{chipData.statistics?.support_level?.toFixed(2) || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#2e7d32', mt: 1, display: 'block' }}>
                        筹码密集区下沿
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(244, 67, 54, 0.15)',
                      border: '2px solid rgba(244, 67, 54, 0.3)',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#c62828', fontWeight: 'bold', mb: 1 }}>
                        📈 压力位
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#b71c1c', fontWeight: 'bold' }}>
                        ¥{chipData.statistics?.resistance_level?.toFixed(2) || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#c62828', mt: 1, display: 'block' }}>
                        筹码密集区上沿
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2.5, 
                      borderRadius: '12px', 
                      backgroundColor: 'rgba(63, 81, 181, 0.15)',
                      border: '2px solid rgba(63, 81, 181, 0.3)',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                        🎯 趋势判断
                      </Typography>
                      <Chip 
                        label={chipData.technical_summary?.trend || chipData.market_status || '分析中'} 
                        size="large"
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: 
                            chipData.technical_summary?.trend === '强势上涨' ? '#4caf50' :
                            chipData.technical_summary?.trend === '弱势下跌' ? '#f44336' :
                            chipData.technical_summary?.trend === '震荡整理' ? '#ff9800' : '#2196f3',
                          color: 'white',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#1976d2', mt: 1, display: 'block' }}>
                        强度: {chipData.technical_summary?.strength || '中性'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* 详细分析文字 */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                  <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 'bold', mb: 2 }}>
                    📊 专业分析报告
                  </Typography>
                  {chipData.analysis && Array.isArray(chipData.analysis) ? (
                    <Grid container spacing={2}>
                      {chipData.analysis.slice(0, 4).map((point, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ 
                            p: 1.5, 
                            borderLeft: '4px solid #3f51b5', 
                            backgroundColor: 'rgba(63, 81, 181, 0.05)',
                            borderRadius: '0 8px 8px 0'
                          }}>
                            <Typography variant="body2" sx={{ color: '#2d3748', lineHeight: 1.6 }}>
                              {point}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      分析数据加载中...
                    </Typography>
                  )}
                  
                  {/* 市场状态 */}
                  {chipData.market_status && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(63, 81, 181, 0.1)', borderRadius: '8px' }}>
                      <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        💡 市场状态: {chipData.market_status}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* 风险评估 */}
                  {chipData.technical_summary?.risk_level && (
                    <Box sx={{ mt: 1, p: 1.5, borderRadius: '8px', backgroundColor: 
                      chipData.technical_summary.risk_level === '高' ? 'rgba(244, 67, 54, 0.1)' :
                      chipData.technical_summary.risk_level === '低' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)'
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: 
                          chipData.technical_summary.risk_level === '高' ? '#d32f2f' :
                          chipData.technical_summary.risk_level === '低' ? '#388e3c' : '#f57c00',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ 风险等级: {chipData.technical_summary.risk_level}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* 专业筹码分布图表 */}
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                  筹码分布图表
                </Typography>
                <ChipDistributionChart
                  stockCode={selectedStock?.code}
                  stockName={selectedStock?.name}
                  chipData={chipData}
                  height={400}
                />
              </Card>
            </Box>
          ) : (
            <Alert severity="error">筹码分布数据获取失败，请稍后重试</Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={handleCloseChipDialog} variant="outlined">
            关闭
          </Button>
          {chipData && (
            <Button variant="contained" color="primary">
              详细分析
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketOverview; 