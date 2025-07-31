import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  Chip,
  Paper,
  IconButton,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Tooltip,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  TipsAndUpdates as TipsIcon,
} from '@mui/icons-material';
import { stockAPI } from '../utils/api';

const StockSearch = ({ value, onChange, onSelect, disableDropdown = false }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showTips, setShowTips] = useState(false);
  const searchTimeoutRef = useRef(null);

  // 智能搜索提示示例 - 增强版
  const searchTips = [
    { type: '股票代码', example: '000001、600036、601717', desc: '直接输入6位股票代码，精确匹配' },
    { type: '公司名称', example: '平安银行、招商银行、万科', desc: '输入完整或部分公司名称，支持模糊匹配' },
    { type: '拼音搜索', example: 'pab、zsyh、zmj、wk', desc: '使用公司名称拼音首字母快速查找' },
    { type: '行业搜索', example: '银行、科技、地产、医药', desc: '按行业关键词搜索相关股票' },
    { type: '混合搜索', example: '招商、深圳、电子', desc: '支持中文、英文、数字组合搜索' },
  ];

  // 热门股票推荐（更新后的列表）- 涵盖各行业龙头
  const popularStocks = [
    { code: '000001', name: '平安银行', sector: '银行', tips: '可搜索：pab、平安、银行' },
    { code: '000002', name: '万科A', sector: '房地产', tips: '可搜索：wk、万科、地产' },
    { code: '600036', name: '招商银行', sector: '银行', tips: '可搜索：zsyh、招商、银行' },
    { code: '000858', name: '五粮液', sector: '白酒', tips: '可搜索：wly、五粮、白酒' },
    { code: '601717', name: '郑煤机', sector: '机械', tips: '可搜索：zmj、郑煤、机械' },
    { code: '000063', name: '中兴通讯', sector: '通信设备', tips: '可搜索：zxtx、中兴、通信' },
    { code: '601318', name: '中国平安', sector: '保险', tips: '可搜索：zgpa、平安、保险' },
    { code: '600519', name: '贵州茅台', sector: '白酒', tips: '可搜索：gzmt、茅台、白酒' },
  ];

  // 从localStorage加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('stockSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('加载搜索历史失败:', error);
        setSearchHistory([]);
      }
    }
  }, []);

  // 保存搜索历史到localStorage
  const saveSearchHistory = (history) => {
    try {
      localStorage.setItem('stockSearchHistory', JSON.stringify(history));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 添加搜索历史
  const addToHistory = (stock) => {
    const newHistory = [
      stock,
      ...searchHistory.filter(item => item.code !== stock.code)
    ].slice(0, 10); // 最多保存10条记录
    
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // 删除搜索历史
  const removeFromHistory = (codeToRemove) => {
    const newHistory = searchHistory.filter(item => item.code !== codeToRemove);
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // 清空搜索历史
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('stockSearchHistory');
  };

  // 智能搜索股票
  const searchStocks = async (query) => {
    if (!query.trim()) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await stockAPI.searchStocks(query, 8);
      if (response.success) {
        setOptions(response.stocks);
        console.log('搜索结果:', response.stocks); // 调试输出
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化 - 优化搜索体验
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    setShowHistory(false);
    setShowTips(false);
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 如果输入为空，清空选项
    if (!newInputValue.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    
    // 延迟搜索（优化为150ms提高响应速度）
    searchTimeoutRef.current = setTimeout(() => {
      if (newInputValue.trim().length >= 1) { // 支持单字符搜索
        searchStocks(newInputValue.trim());
      }
    }, 150);
  };

  // 处理选择
  const handleChange = (event, newValue) => {
    // 确保传递的是字符串
    let valueToSet = '';
    let selectedStock = null;
    
    if (typeof newValue === 'string') {
      valueToSet = newValue;
    } else if (newValue && typeof newValue === 'object' && newValue.code) {
      valueToSet = newValue.code;
      selectedStock = newValue;
    }
    
    onChange(valueToSet);
    if (valueToSet && onSelect) {
      onSelect(valueToSet);
    }
    
    // 只在未禁用下拉功能时添加到搜索历史
    if (!disableDropdown && selectedStock) {
      addToHistory(selectedStock);
    }
    
    setShowHistory(false);
    setShowTips(false);
  };

  // 处理搜索框聚焦
  const handleFocus = () => {
    // 如果禁用下拉功能，则不显示历史记录和提示
    if (disableDropdown) return;
    
    if (!inputValue.trim()) {
      if (searchHistory.length > 0) {
        setShowHistory(true);
      } else {
        setShowTips(true);
      }
    }
  };

  // 处理搜索框失焦
  const handleBlur = () => {
    // 如果禁用下拉功能，则不需要处理
    if (disableDropdown) return;
    
    // 延迟隐藏，让用户有时间点击
    setTimeout(() => {
      setShowHistory(false);
      setShowTips(false);
    }, 200);
  };

  // 从历史记录中选择
  const selectFromHistory = (stock) => {
    setInputValue(stock.code);
    onChange(stock.code);
    if (onSelect) onSelect(stock.code);
    setShowHistory(false);
  };

  // 从热门股票中选择
  const selectFromPopular = (stock) => {
    setInputValue(stock.code);
    onChange(stock.code);
    if (onSelect) onSelect(stock.code);
    addToHistory(stock);
    setShowTips(false);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      <Autocomplete
        value={value}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={options}
        loading={loading}
        freeSolo
        onFocus={handleFocus}
        onBlur={handleBlur}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          if (option && typeof option === 'object' && option.code) {
            return option.name ? `${option.code} ${option.name}` : option.code;
          }
          return '';
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="股票代码或公司名称"
            placeholder="支持股票代码、公司名称、拼音搜索，如：000001、平安银行、pab"
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <SearchIcon color="action" />
                  <Tooltip title="查看搜索技巧">
                    <IconButton
                      size="small"
                      onClick={() => setShowTips(!showTips)}
                      sx={{ ml: 0.5 }}
                    >
                      <TipsIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                }
              }
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {option.code}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.score && option.score >= 90 && (
                      <Chip 
                        label={`${option.score}分`} 
                        size="small" 
                        color="success"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                    <Chip 
                      label={option.industry || option.sector || '股票'} 
                      size="small" 
                      variant="outlined"
                      color={
                        (option.industry || option.sector || '').includes('银行') ? 'primary' : 
                        (option.industry || option.sector || '').includes('科技') || 
                        (option.industry || option.sector || '').includes('通信') ? 'secondary' :
                        (option.industry || option.sector || '').includes('房地产') || 
                        (option.industry || option.sector || '').includes('地产') ? 'warning' : 
                        (option.industry || option.sector || '').includes('医药') || 
                        (option.industry || option.sector || '').includes('生物') ? 'info' : 'default'
                      }
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {option.name}
                </Typography>
                {option.score && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                    匹配度: {option.score}分 • {option.score >= 90 ? '精确匹配' : option.score >= 70 ? '高度匹配' : '相关匹配'}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        }}
        noOptionsText={
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              🔍 未找到匹配的股票
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              搜索提示：
            </Typography>
            <Box sx={{ textAlign: 'left', maxWidth: 300, margin: '0 auto' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • 股票代码：000001、600036
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • 公司名称：平安银行、招商银行
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • 拼音搜索：pab、zsyh、zmj
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • 行业搜索：银行、科技、医药
              </Typography>
            </Box>
          </Box>
        }
        loadingText={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <Typography variant="body2">智能搜索中...</Typography>
          </Box>
        }
        filterOptions={(x) => x} // 禁用内置过滤，使用后端搜索
      />
      
      {/* 搜索历史记录 - 只在未禁用下拉时显示 */}
      {!disableDropdown && showHistory && searchHistory.length > 0 && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 1300, // 提高层级，确保在所有内容之上
            mt: 1, 
            maxHeight: 250, // 减小高度避免遮挡下方按钮
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: 6, // 增强阴影突出层级
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
              <HistoryIcon fontSize="small" />
              搜索历史 ({searchHistory.length})
            </Typography>
            <Chip 
              label="清空" 
              size="small" 
              variant="outlined" 
              clickable
              color="error"
              onClick={clearHistory}
              sx={{ fontSize: '0.75rem', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
            />
          </Box>
          {searchHistory.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                暂无搜索历史
              </Typography>
              <Typography variant="caption" color="text.secondary">
                搜索股票后会自动保存到这里
              </Typography>
            </Box>
          ) : (
            searchHistory.map((stock, index) => (
            <ListItem 
              key={stock.code} 
              button 
              onClick={() => selectFromHistory(stock)}
              sx={{ 
                py: 1.5,
                px: 2,
                borderBottom: index < searchHistory.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'primary.50',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                },
                cursor: 'pointer'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.9rem' }}>
                      {stock.code}
                    </Typography>
                    <Chip 
                      label={stock.sector || '股票'} 
                      size="small" 
                      variant="outlined"
                      color={stock.sector === '银行' ? 'primary' : 
                             stock.sector === '科技' ? 'secondary' :
                             stock.sector === '房地产' ? 'warning' : 'default'}
                      sx={{ fontSize: '0.7rem', height: 18 }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {stock.name}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromHistory(stock.code);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'error.main',
                      color: 'white',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            ))
          )}
        </Paper>
      )}
      
      {/* 搜索技巧和热门股票 - 只在未禁用下拉时显示 */}
      {!disableDropdown && showTips && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 1300, // 提高层级，确保在所有内容之上
            mt: 1, 
            maxHeight: 350, // 减小高度避免遮挡下方按钮
            overflow: 'auto',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            boxShadow: 6, // 增强阴影突出层级
          }}
        >
          {/* 搜索技巧 */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TipsIcon fontSize="small" color="primary" />
              智能搜索技巧
            </Typography>
            {searchTips.map((tip, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {tip.type}:
                </Typography>
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  {tip.example} - {tip.desc}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* 热门股票 */}
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              📈 热门股票推荐
            </Typography>
            {popularStocks.map((stock) => (
              <Box
                key={stock.code}
                onClick={() => selectFromPopular(stock)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {stock.code}
                    </Typography>
                    <Chip 
                      label={stock.sector} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 18 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {stock.name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {stock.tips}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
      
      {/* 搜索提示信息 - 只在未禁用下拉时显示 */}
      {!disableDropdown && (
      <Box sx={{ mt: 2 }}>
          {searchHistory.length > 0 && (
            <Alert 
              severity="success" 
              sx={{ 
                bgcolor: 'success.50',
                mb: 1,
                '& .MuiAlert-message': { fontSize: '0.875rem' }
              }}
            >
              <Typography variant="body2">
                <strong>📚 已保存 {searchHistory.length} 个搜索历史</strong> - 点击搜索框查看历史记录
              </Typography>
            </Alert>
          )}
          
        <Alert 
          severity="info" 
          sx={{ 
            bgcolor: 'primary.50',
            '& .MuiAlert-message': { fontSize: '0.875rem' }
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>💡 智能搜索已升级！</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ✅ 支持拼音搜索（如：pab、zsyh、zmj）<br/>
            ✅ 支持模糊匹配和智能排序<br/>
            ✅ 支持行业关键词搜索（如：银行、科技）<br/>
            ✅ 自动保存搜索历史，快速复用
          </Typography>
        </Alert>
      </Box>
      )}
    </Box>
  );
};

export default StockSearch; 