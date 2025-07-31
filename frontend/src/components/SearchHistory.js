import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  History as HistoryIcon,
  Delete as DeleteIcon,
  TipsAndUpdates as TipsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const SearchHistory = ({ onStockSelect }) => {
  const [searchHistory, setSearchHistory] = useState([]);

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

  // 从历史记录中选择
  const selectFromHistory = (stock) => {
    if (onStockSelect) {
      onStockSelect(stock.code);
    }
  };

  // 热门股票推荐
  const popularStocks = [
    { code: '000001', name: '平安银行', sector: '银行' },
    { code: '000002', name: '万科A', sector: '房地产' },
    { code: '600000', name: '浦发银行', sector: '银行' },
    { code: '600036', name: '招商银行', sector: '银行' },
    { code: '000858', name: '五粮液', sector: '白酒' },
    { code: '601717', name: '郑煤机', sector: '机械' },
  ];

  return (
    <Box>
      {/* 搜索历史区域 */}
      {searchHistory.length > 0 ? (
        <Paper elevation={2} sx={{ mb: 2 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              sx={{ 
                fontSize: '0.75rem', 
                '&:hover': { 
                  bgcolor: 'error.main', 
                  color: 'white',
                  borderColor: 'error.main'
                } 
              }}
            />
          </Box>
          
          <List sx={{ py: 0, maxHeight: 200, overflow: 'auto' }}>
            {searchHistory.map((stock, index) => (
              <ListItem 
                key={stock.code} 
                button 
                onClick={() => selectFromHistory(stock)}
                sx={{ 
                  py: 1,
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
            ))}
          </List>
        </Paper>
      ) : (
        /* 无历史记录时显示推荐股票 */
        <Paper elevation={2} sx={{ mb: 2 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: 'primary.main' }}>
              <TipsIcon fontSize="small" />
              推荐股票
            </Typography>
          </Box>
          
          <List sx={{ py: 0 }}>
            {popularStocks.map((stock, index) => (
              <ListItem 
                key={stock.code} 
                button 
                onClick={() => selectFromHistory(stock)}
                sx={{ 
                  py: 1,
                  px: 2,
                  borderBottom: index < popularStocks.length - 1 ? '1px solid' : 'none',
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
                        label={stock.sector} 
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
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 搜索提示信息 */}
      <Alert 
        severity="info" 
        sx={{ 
          bgcolor: 'primary.50',
          '& .MuiAlert-message': { fontSize: '0.875rem' }
        }}
      >
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>💡 搜索技巧</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ✅ 支持股票代码直接输入（如：000001、600039）<br/>
          ✅ 支持公司名称搜索（如：平安银行、招商银行）<br/>
          ✅ 点击历史记录或推荐股票快速选择<br/>
          ✅ 搜索过的股票会自动保存到历史记录
        </Typography>
      </Alert>
    </Box>
  );
};

export default SearchHistory; 