import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Paper,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Schedule,
  Speed,
  Assessment,
  DataUsage,
  Timeline,
  Close
} from '@mui/icons-material';

const RealTimeProgress = ({ 
  open = false,
  onClose = () => {},
  strategy,
  progress, 
  currentStep, 
  isFullMarket = false,
  realTimeData = {}
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [stepHistory, setStepHistory] = useState([]);

  // 平滑动画进度
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // 步骤历史记录
  useEffect(() => {
    if (currentStep && !stepHistory.includes(currentStep)) {
      setStepHistory(prev => [...prev, currentStep].slice(-6)); // 保留最近6步
    }
  }, [currentStep, stepHistory]);

  // 获取阶段颜色
  const getPhaseColor = (progress) => {
    if (progress < 20) return '#2196f3'; // 蓝色 - 初始化
    if (progress < 40) return '#ff9800'; // 橙色 - 数据获取
    if (progress < 60) return '#9c27b0'; // 紫色 - 分析中
    if (progress < 80) return '#f44336'; // 红色 - 筛选中
    return '#4caf50'; // 绿色 - 完成
  };

  // 获取当前阶段名称
  const getCurrentPhase = (progress) => {
    if (progress < 20) return '初始化阶段';
    if (progress < 40) return '数据获取阶段';
    if (progress < 60) return '策略分析阶段';
    if (progress < 80) return '智能筛选阶段';
    return '结果生成阶段';
  };

  // 预估剩余时间
  const getEstimatedTime = (progress, isFullMarket) => {
    if (progress === 0) return isFullMarket ? '90-120分钟' : '2-3分钟';
    
    const baseTime = isFullMarket ? 90 : 3; // 基础时间（分钟）
    const remaining = ((100 - progress) / 100) * baseTime;
    
    if (remaining < 1) return '不到1分钟';
    if (remaining < 60) return `约${Math.ceil(remaining)}分钟`;
    return `约${Math.ceil(remaining / 60)}小时${Math.ceil(remaining % 60)}分钟`;
  };

  const currentPhase = getCurrentPhase(animatedProgress);
  const phaseColor = getPhaseColor(animatedProgress);
  const estimatedTime = getEstimatedTime(animatedProgress, isFullMarket);

  if (!open || !strategy) return null;

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      bgcolor: 'rgba(0,0,0,0.8)', 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* 进度卡片 */}
      <Card sx={{ 
        width: '90%', 
        maxWidth: 800, 
        maxHeight: '90vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
        border: '1px solid rgba(33, 150, 243, 0.2)',
        borderRadius: 3
      }}>
        <CardContent sx={{ p: 4 }}>
          {/* 标题栏和关闭按钮 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: strategy.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {strategy.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {strategy.name} - 执行中
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {strategy.description}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: phaseColor }}>
                  {animatedProgress.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isFullMarket ? '全市场扫描' : '快速扫描'}
                </Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* 主进度条 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {currentPhase}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                预计剩余时间: {estimatedTime}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={animatedProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: phaseColor,
                  borderRadius: 4,
                }
              }}
            />
          </Box>

          {/* 当前步骤 */}
          <Alert 
            severity={realTimeData.stage === 'completed' ? 'success' : 'info'}
            icon={realTimeData.stage === 'completed' ? <CheckCircle size={20} /> : <CircularProgress size={20} />}
            sx={{ mb: 3, bgcolor: realTimeData.stage === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)' }}
          >
            <Typography variant="body2">
              {currentStep || '正在准备...'}
            </Typography>
          </Alert>

          {/* 实时数据统计 */}
          {Object.keys(realTimeData).length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ color: '#4caf50', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      分析进度
                    </Typography>
                  </Box>
                  
                  {/* 当前分析股票 */}
                  {realTimeData.currentStock && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        当前分析股票
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        color: '#2196f3',
                        fontSize: '1.1rem'
                      }}>
                        📈 {realTimeData.currentStock}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* 分析统计 */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        已分析
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        {realTimeData.analyzedStocks || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        总数量
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {realTimeData.totalStocks || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        符合条件
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        {realTimeData.qualifiedStocks || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        成功率
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                        {realTimeData.totalStocks > 0 
                          ? Math.round((realTimeData.qualifiedStocks / realTimeData.totalStocks) * 100)
                          : 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DataUsage sx={{ color: '#2196f3', mr: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      执行信息
                    </Typography>
                  </Box>
                  
                  <List dense sx={{ p: 0 }}>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Schedule sx={{ fontSize: 18, color: '#ff9800' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="执行时间" 
                        secondary={realTimeData.elapsedTime || '计算中...'}
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                        secondaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Assessment sx={{ fontSize: 18, color: '#4caf50' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="数据源" 
                        secondary={realTimeData.dataSource || 'TuShare + AkShare'}
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                        secondaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Timeline sx={{ fontSize: 18, color: '#9c27b0' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="执行阶段" 
                        secondary={
                          realTimeData.stage === 'filtering' ? '📊 筛选股票' :
                          realTimeData.stage === 'analyzing' ? '🔍 分析中' :
                          realTimeData.stage === 'completing' ? '📋 生成报告' :
                          realTimeData.stage === 'completed' ? '✅ 已完成' :
                          '🚀 执行中'
                        }
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                        secondaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* 分析效率展示 */}
          {realTimeData.analyzedStocks > 0 && realTimeData.totalStocks > 0 && (
            <Alert 
              severity="info" 
              icon={<Speed />}
              sx={{ mb: 3, bgcolor: 'rgba(33, 150, 243, 0.1)' }}
            >
              <Typography variant="body2">
                📈 <strong>优化分析效率</strong>：已完成 {realTimeData.analyzedStocks}/{realTimeData.totalStocks} 只股票
                {realTimeData.qualifiedStocks > 0 && (
                  <>，发现 <span style={{color: '#ff9800', fontWeight: 'bold'}}>{realTimeData.qualifiedStocks}</span> 只优质股票</>
                )}
                {realTimeData.elapsedTime && (
                  <>，用时 <span style={{color: '#2196f3', fontWeight: 'bold'}}>{realTimeData.elapsedTime}</span></>
                )}
              </Typography>
            </Alert>
          )}

          {/* 步骤历史记录 */}
          {stepHistory.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                执行步骤历史
              </Typography>
              <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                <List dense>
                  {stepHistory.slice(-5).map((step, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={step}
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeProgress; 