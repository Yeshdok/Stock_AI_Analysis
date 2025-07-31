import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Chip,
  useTheme
} from '@mui/material';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  ShowChart,
  DataUsage
} from '@mui/icons-material';

/**
 * 专业筹码分布图表组件
 * 基于Canvas绘制，集成TuShare真实数据
 */
const ChipDistributionChart = ({ stockCode, stockName, chipData, height = 400 }) => {
  const canvasRef = useRef(null);
  const theme = useTheme();
  const [hoveredChip, setHoveredChip] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (chipData && chipData.distribution && canvasRef.current) {
      drawChipDistribution();
    }
  }, [chipData, height]);

  const drawChipDistribution = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 设置Canvas尺寸
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const width = rect.width;
    const canvasHeight = height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, canvasHeight);
    
    if (!chipData.distribution || chipData.distribution.length === 0) {
      drawNoDataMessage(ctx, width, canvasHeight);
      return;
    }
    
    // 绘制参数
    const padding = { top: 40, right: 80, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = canvasHeight - padding.top - padding.bottom;
    
    // 数据处理
    const distribution = chipData.distribution;
    const maxVolume = Math.max(...distribution.map(d => d.volume));
    const minPrice = Math.min(...distribution.map(d => d.price));
    const maxPrice = Math.max(...distribution.map(d => d.price));
    const currentPrice = chipData.statistics?.current_price || 0;
    
    // 绘制背景网格
    drawGrid(ctx, padding, chartWidth, chartHeight, minPrice, maxPrice);
    
    // 绘制筹码分布柱状图
    drawChipBars(ctx, distribution, padding, chartWidth, chartHeight, minPrice, maxPrice, maxVolume, currentPrice);
    
    // 绘制关键价格线
    drawKeyPriceLines(ctx, chipData.statistics, padding, chartWidth, chartHeight, minPrice, maxPrice);
    
    // 绘制价格轴
    drawPriceAxis(ctx, padding, chartWidth, chartHeight, minPrice, maxPrice);
    
    // 绘制成交量轴
    drawVolumeAxis(ctx, padding, chartWidth, chartHeight, maxVolume);
    
    // 绘制图例
    drawLegend(ctx, width, chipData.statistics);
    
    // 绘制标题
    drawTitle(ctx, width, `${stockName || stockCode} - 筹码分布分析`);
  };
  
  const drawGrid = (ctx, padding, width, height, minPrice, maxPrice) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    // 绘制水平网格线 (价格网格)
    const priceStep = (maxPrice - minPrice) / 10;
    for (let i = 0; i <= 10; i++) {
      const price = minPrice + priceStep * i;
      const y = padding.top + (1 - (price - minPrice) / (maxPrice - minPrice)) * height;
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }
    
    // 绘制垂直网格线 (成交量网格)
    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (width / 5) * i;
      
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + height);
      ctx.stroke();
    }
  };
  
  const drawChipBars = (ctx, distribution, padding, width, height, minPrice, maxPrice, maxVolume, currentPrice) => {
    const barWidth = Math.max(2, height / distribution.length * 0.8);
    
    distribution.forEach((chip, index) => {
      const y = padding.top + (1 - (chip.price - minPrice) / (maxPrice - minPrice)) * height;
      const barHeight = Math.max(1, (chip.volume / maxVolume) * width);
      
      // 根据价格与当前价的关系确定颜色
      let color;
      if (chip.price < currentPrice * 0.99) {
        // 获利筹码 - 绿色渐变
        color = `rgba(76, 175, 80, ${0.3 + (chip.volume / maxVolume) * 0.7})`;
      } else if (chip.price > currentPrice * 1.01) {
        // 套牢筹码 - 红色渐变
        color = `rgba(244, 67, 54, ${0.3 + (chip.volume / maxVolume) * 0.7})`;
      } else {
        // 当前价格附近 - 蓝色渐变
        color = `rgba(33, 150, 243, ${0.5 + (chip.volume / maxVolume) * 0.5})`;
      }
      
      // 绘制筹码柱
      ctx.fillStyle = color;
      ctx.fillRect(padding.left, y - barWidth / 2, barHeight, barWidth);
      
      // 高亮主要筹码峰
      if (chip.volume === maxVolume) {
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2;
        ctx.strokeRect(padding.left, y - barWidth / 2, barHeight, barWidth);
      }
    });
  };
  
  const drawKeyPriceLines = (ctx, statistics, padding, width, height, minPrice, maxPrice) => {
    if (!statistics) return;
    
    const lines = [
      { price: statistics.current_price, color: '#2196F3', label: '当前价', style: 'solid' },
      { price: statistics.avg_cost, color: '#FF9800', label: '平均成本', style: 'dash' },
      { price: statistics.main_peak_price, color: '#9C27B0', label: '主力成本', style: 'dash' },
      { price: statistics.support_level, color: '#4CAF50', label: '支撑位', style: 'dot' },
      { price: statistics.resistance_level, color: '#F44336', label: '压力位', style: 'dot' }
    ];
    
    lines.forEach(line => {
      if (!line.price) return;
      
      const y = padding.top + (1 - (line.price - minPrice) / (maxPrice - minPrice)) * height;
      
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      
      // 设置线型
      if (line.style === 'dash') {
        ctx.setLineDash([5, 5]);
      } else if (line.style === 'dot') {
        ctx.setLineDash([2, 3]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
      
      // 绘制标签
      ctx.fillStyle = line.color;
      ctx.font = '12px Arial';
      ctx.fillText(`${line.label}: ${line.price.toFixed(2)}`, padding.left + width + 5, y + 4);
    });
    
    ctx.setLineDash([]); // 重置线型
  };
  
  const drawPriceAxis = (ctx, padding, width, height, minPrice, maxPrice) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.stroke();
    
    // 绘制价格刻度
    const priceStep = (maxPrice - minPrice) / 8;
    for (let i = 0; i <= 8; i++) {
      const price = minPrice + priceStep * i;
      const y = padding.top + (1 - (price - minPrice) / (maxPrice - minPrice)) * height;
      
      // 刻度线
      ctx.beginPath();
      ctx.moveTo(padding.left - 5, y);
      ctx.lineTo(padding.left, y);
      ctx.stroke();
      
      // 刻度标签
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding.left - 8, y + 4);
    }
    
    // Y轴标签
    ctx.save();
    ctx.translate(20, padding.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('价格 (元)', 0, 0);
    ctx.restore();
  };
  
  const drawVolumeAxis = (ctx, padding, width, height, maxVolume) => {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    
    // 绘制X轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
    
    // 绘制成交量刻度
    for (let i = 0; i <= 5; i++) {
      const volume = (maxVolume / 5) * i;
      const x = padding.left + (width / 5) * i;
      
      // 刻度线
      ctx.beginPath();
      ctx.moveTo(x, padding.top + height);
      ctx.lineTo(x, padding.top + height + 5);
      ctx.stroke();
      
      // 刻度标签
      ctx.textAlign = 'center';
      ctx.fillText(volume.toFixed(1), x, padding.top + height + 18);
    }
    
    // X轴标签
    ctx.textAlign = 'center';
    ctx.font = '12px Arial';
    ctx.fillText('筹码量 (万股)', padding.left + width / 2, padding.top + height + 35);
  };
  
  const drawLegend = (ctx, width, statistics) => {
    const legendItems = [
      { color: 'rgba(76, 175, 80, 0.7)', label: '获利筹码' },
      { color: 'rgba(244, 67, 54, 0.7)', label: '套牢筹码' },
      { color: 'rgba(33, 150, 243, 0.7)', label: '当前筹码' }
    ];
    
    let x = width - 150;
    const y = 25;
    
    legendItems.forEach((item, index) => {
      // 绘制颜色块
      ctx.fillStyle = item.color;
      ctx.fillRect(x, y, 12, 12);
      
      // 绘制文字
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 15, y + 9);
      
      x += 60;
    });
  };
  
  const drawTitle = (ctx, width, title) => {
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
  };
  
  const drawNoDataMessage = (ctx, width, height) => {
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('正在加载筹码分布数据...', width / 2, height / 2);
  };
  
  const handleMouseMove = (event) => {
    if (!chipData || !chipData.distribution) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    // 检测鼠标是否悬停在某个筹码柱上
    // 这里简化处理，实际应该根据坐标计算对应的价格和筹码
    // 可以在未来版本中实现更精确的交互
  };

  if (!chipData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          正在获取筹码分布数据...
        </Typography>
      </Box>
    );
  }

  if (chipData.distribution && chipData.distribution.length === 0) {
    return (
      <Alert severity="warning">
        未获取到{stockCode}的筹码分布数据，请稍后重试
      </Alert>
    );
  }

  return (
    <Box>
      {/* 筹码分布图表 */}
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: height,
              cursor: 'crosshair'
            }}
            onMouseMove={handleMouseMove}
          />
        </Box>
      </Paper>
      
      {/* 筹码分布统计信息 */}
      {chipData.statistics && (
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'primary.50' }}>
              <Typography variant="caption" color="text.secondary">
                主力成本
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {chipData.statistics.main_peak_price?.toFixed(2)}元
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'warning.50' }}>
              <Typography variant="caption" color="text.secondary">
                平均成本
              </Typography>
              <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {chipData.statistics.avg_cost?.toFixed(2)}元
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'success.50' }}>
              <Typography variant="caption" color="text.secondary">
                筹码集中度
              </Typography>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                {(chipData.statistics.concentration_ratio * 100)?.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'info.50' }}>
              <Typography variant="caption" color="text.secondary">
                获利比例
              </Typography>
              <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                {(chipData.statistics.profit_ratio * 100)?.toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* 技术分析要点 */}
      {chipData.analysis && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DataUsage sx={{ mr: 1 }} />
            技术分析要点
          </Typography>
          <Grid container spacing={1}>
            {chipData.analysis.slice(0, 6).map((point, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Typography variant="body2" sx={{ py: 0.5 }}>
                  {point}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {chipData.market_status && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={chipData.market_status}
                color={chipData.market_status.includes('异常') ? 'error' : 'primary'}
                size="small"
                icon={<ShowChart />}
              />
            </Box>
          )}
        </Paper>
      )}
      
      {/* 数据质量信息 */}
      {chipData.statistics?.data_quality && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            数据来源: {chipData.statistics.data_quality} | 
            计算周期: {chipData.statistics.calculation_period}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChipDistributionChart;