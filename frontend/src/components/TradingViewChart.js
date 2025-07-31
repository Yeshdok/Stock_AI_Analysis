import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries
} from 'lightweight-charts';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';

const TradingViewChart = ({ allStockData, stockInfo, allSignals }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initAttempts, setInitAttempts] = useState(0);
  
  // 十字光标实时价格显示状态
  const [crosshairData, setCrosshairData] = useState({
    visible: false,
    time: '',
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    change: 0,
    changePercent: 0
  });

  const priceChartContainerRef = useRef(null);
  const volumeChartContainerRef = useRef(null);
  const macdChartContainerRef = useRef(null);
  
  const priceChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const macdChartRef = useRef(null);

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setSelectedPeriod(newPeriod);
    }
  };

  // 获取当前选中周期的数据
  const stockData = allStockData?.[selectedPeriod] || [];

  // 强制重新初始化的函数
  const forceInit = () => {
    setInitAttempts(prev => prev + 1);
    setLoading(true);
    setError(null);
  };

  // 添加十字光标事件监听器
  const addCrosshairEventListeners = (chart, processedData) => {
    if (!chart || !chart.subscribeCrosshairMove) {
      console.warn('图表不支持十字光标事件监听');
      return;
    }

    chart.subscribeCrosshairMove((param) => {
      try {
        if (!param || param.time === undefined || !param.seriesData) {
          // 鼠标离开图表区域
          setCrosshairData(prev => ({ ...prev, visible: false }));
          return;
        }

        console.log('Crosshair param:', param);
        console.log('Crosshair time:', param.time, 'Type:', typeof param.time);

        // 智能时间匹配：支持Unix时间戳和BusinessDay格式
        let dataIndex = -1;
        
        if (typeof param.time === 'number') {
          // Unix时间戳格式
          dataIndex = processedData.findIndex(item => {
            if (typeof item.time === 'number') {
              // 允许一定的时间差容错（1小时内）
              return Math.abs(item.time - param.time) < 3600;
            }
            return false;
          });
        } else if (param.time && typeof param.time === 'object' && param.time.year) {
          // BusinessDay格式
          dataIndex = processedData.findIndex(item => {
            if (item.time && typeof item.time === 'object' && item.time.year) {
              return item.time.year === param.time.year &&
                     item.time.month === param.time.month &&
                     item.time.day === param.time.day;
            }
            return false;
          });
        }

        // 如果精确匹配失败，尝试模糊匹配
        if (dataIndex < 0 && processedData.length > 0) {
          // 基于系列数据位置进行近似匹配
          const firstSeries = Object.values(param.seriesData)[0];
          if (firstSeries && firstSeries.coordinate !== undefined) {
            // 根据坐标位置估算数据索引
            const totalWidth = chart.timeScale().width();
            const visibleRange = chart.timeScale().getVisibleLogicalRange();
            if (visibleRange) {
              const relativePosition = firstSeries.coordinate / totalWidth;
              const estimatedIndex = Math.round(visibleRange.from + relativePosition * (visibleRange.to - visibleRange.from));
              if (estimatedIndex >= 0 && estimatedIndex < processedData.length) {
                dataIndex = estimatedIndex;
              }
            }
          }
        }

        console.log('Found data index:', dataIndex);

        if (dataIndex >= 0 && dataIndex < processedData.length) {
          const currentData = processedData[dataIndex];
          const prevData = dataIndex > 0 ? processedData[dataIndex - 1] : null;
          
          // 计算涨跌幅
          const change = prevData ? currentData.close - prevData.close : 0;
          const changePercent = prevData ? ((change / prevData.close) * 100) : 0;
          
          // 智能时间格式化
          let timeStr = '';
          if (typeof param.time === 'number') {
            // Unix时间戳转换为日期字符串
            const date = new Date(param.time * 1000);
            timeStr = date.toISOString().split('T')[0];
          } else if (param.time && param.time.year) {
            // BusinessDay格式
            timeStr = `${param.time.year}-${String(param.time.month).padStart(2, '0')}-${String(param.time.day).padStart(2, '0')}`;
          } else {
            // 从数据中获取时间
            if (typeof currentData.time === 'number') {
              const date = new Date(currentData.time * 1000);
              timeStr = date.toISOString().split('T')[0];
            } else if (currentData.time && currentData.time.year) {
              timeStr = `${currentData.time.year}-${String(currentData.time.month).padStart(2, '0')}-${String(currentData.time.day).padStart(2, '0')}`;
            } else {
              timeStr = '未知时间';
            }
          }
          
          setCrosshairData({
            visible: true,
            time: timeStr,
            open: currentData.open.toFixed(2),
            high: currentData.high.toFixed(2),
            low: currentData.low.toFixed(2),
            close: currentData.close.toFixed(2),
            volume: (currentData.volume / 10000).toFixed(0) + '万',
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2)
          });
        } else {
          console.warn('未找到对应的数据点，dataIndex:', dataIndex, 'processedData长度:', processedData.length);
        }
      } catch (error) {
        console.error('十字光标事件处理错误:', error);
      }
    });
  };

  // 添加买入卖出点标记函数
  const addTradingSignalMarkers = (candlestickSeries, processedData) => {
    if (!allSignals || !allSignals[selectedPeriod] || !candlestickSeries.setMarkers) {
      console.log('无法添加标记：缺少信号数据或setMarkers方法');
      return;
    }

    const markers = [];
    const signals = allSignals[selectedPeriod].signals;
    
    // 根据信号类型确定标记
    let signalType = '';
    let markerColor = '';
    let markerText = '';
    
    if (signals?.signal_type) {
      if (signals.signal_type.includes('强烈买入')) {
        signalType = 'strongBuy';
        markerColor = '#00ff00';
        markerText = '强买';
      } else if (signals.signal_type.includes('买入')) {
        signalType = 'buy';
        markerColor = '#4CAF50';
        markerText = '买入';
      } else if (signals.signal_type.includes('强烈卖出')) {
        signalType = 'strongSell';
        markerColor = '#ff0000';
        markerText = '强卖';
      } else if (signals.signal_type.includes('卖出')) {
        signalType = 'sell';
        markerColor = '#f44336';
        markerText = '卖出';
      }
    }

    // 在最近的几个数据点添加标记
    if (signalType && processedData.length > 0) {
      // 在最后3个数据点添加标记（模拟信号触发点）
      const markPoints = Math.min(3, processedData.length);
      for (let i = 0; i < markPoints; i++) {
        const dataPoint = processedData[processedData.length - 1 - i];
        
        let position = 'aboveBar';
        let shape = 'arrowUp';
        
        if (signalType.includes('sell') || signalType === 'strongSell') {
          position = 'belowBar';
          shape = 'arrowDown';
        }

        markers.push({
          time: dataPoint.time,
          position: position,
          color: markerColor,
          shape: shape,
          text: markerText,
          size: i === 0 ? 2 : 1, // 最新的点更大
        });
      }

      // 添加基于技术指标的精准买入卖出点
      addPrecisionTradingPoints(markers, processedData, signals);
    }

    try {
      candlestickSeries.setMarkers(markers);
      console.log(`已添加 ${markers.length} 个交易信号标记`);
    } catch (error) {
      console.error('添加标记失败:', error);
    }
  };

  // 基于技术指标计算精准买入卖出点
  const addPrecisionTradingPoints = (markers, processedData, signals) => {
    if (!signals.indicators || processedData.length < 20) {
      return;
    }

    // 计算RSI超买超卖点
    if (signals.indicators.rsi && signals.indicators.rsi.latest_value) {
      const rsiValue = signals.indicators.rsi.latest_value;
      
      // RSI < 30 为超卖，买入信号
      if (rsiValue < 30) {
        const recentData = processedData.slice(-5);
        recentData.forEach((dataPoint, index) => {
          if (index === recentData.length - 1) { // 最新点
            markers.push({
              time: dataPoint.time,
              position: 'aboveBar',
              color: '#00bcd4',
              shape: 'circle',
              text: 'RSI超卖',
              size: 1
            });
          }
        });
      }
      
      // RSI > 70 为超买，卖出信号
      if (rsiValue > 70) {
        const recentData = processedData.slice(-5);
        recentData.forEach((dataPoint, index) => {
          if (index === recentData.length - 1) { // 最新点
            markers.push({
              time: dataPoint.time,
              position: 'belowBar',
              color: '#ff9800',
              shape: 'circle',
              text: 'RSI超买',
              size: 1
            });
          }
        });
      }
    }

    // 计算MACD金叉死叉点
    if (signals.indicators.macd) {
      const macdData = calculateMACD(processedData);
      if (macdData.histogram.length > 2) {
        const lastTwo = macdData.histogram.slice(-2);
        const [prev, current] = lastTwo;
        
        // 金叉：MACD从负转正
        if (prev.value < 0 && current.value > 0) {
          markers.push({
            time: current.time,
            position: 'aboveBar',
            color: '#ffd700',
            shape: 'square',
            text: '金叉',
            size: 1.5
          });
        }
        
        // 死叉：MACD从正转负
        if (prev.value > 0 && current.value < 0) {
          markers.push({
            time: current.time,
            position: 'belowBar',
            color: '#8b0000',
            shape: 'square',
            text: '死叉',
            size: 1.5
          });
        }
      }
    }

    // 计算布林带突破点
    if (signals.indicators.bollinger) {
      const recent = processedData.slice(-1)[0];
      if (recent) {
        const ma20Data = calculateMA(processedData, 20);
        if (ma20Data.length > 0) {
          const currentMA = ma20Data[ma20Data.length - 1].value;
          
          // 价格突破布林带上轨
          if (recent.close > currentMA * 1.02) { // 假设上轨是MA+2%
            markers.push({
              time: recent.time,
              position: 'aboveBar',
              color: '#e91e63',
              shape: 'arrowUp',
              text: '突破上轨',
              size: 1
            });
          }
          
          // 价格跌破布林带下轨
          if (recent.close < currentMA * 0.98) { // 假设下轨是MA-2%
            markers.push({
              time: recent.time,
              position: 'belowBar',
              color: '#2196f3',
              shape: 'arrowDown',
              text: '跌破下轨',
              size: 1
            });
          }
        }
      }
    }
  };

  // 添加布林带指标线
  const addBollingerBands = (chart, processedData, signals) => {
    if (!chart || !signals || !signals.indicators || !signals.indicators.bollinger) {
      console.log('布林带数据不可用');
      return;
    }

    console.log('添加布林带指标...');
    
    try {
      // 计算布林带数据
      const bollingerData = calculateBollingerBands(processedData, signals.indicators.bollinger);
      
      if (bollingerData.upper.length === 0) {
        console.warn('布林带数据为空');
        return;
      }

      // 添加布林带上轨
      const upperBandSeries = chart.addLineSeries({
        color: 'rgba(255, 82, 82, 0.8)',
        lineWidth: 1,
        title: 'BOLL上轨',
        priceLineVisible: false,
        lastValueVisible: true,
      });
      upperBandSeries.setData(bollingerData.upper);

      // 添加布林带中轨（20日均线）
      const middleBandSeries = chart.addLineSeries({
        color: 'rgba(33, 150, 243, 0.8)',
        lineWidth: 2,
        title: 'BOLL中轨',
        priceLineVisible: false,
        lastValueVisible: true,
      });
      middleBandSeries.setData(bollingerData.middle);

      // 添加布林带下轨
      const lowerBandSeries = chart.addLineSeries({
        color: 'rgba(76, 175, 80, 0.8)',
        lineWidth: 1,
        title: 'BOLL下轨',
        priceLineVisible: false,
        lastValueVisible: true,
      });
      lowerBandSeries.setData(bollingerData.lower);

      console.log('布林带指标添加成功');
    } catch (error) {
      console.error('添加布林带失败:', error);
    }
  };

  // 计算布林带数据
  const calculateBollingerBands = (processedData, bollingerIndicator) => {
    if (!processedData || processedData.length < 20) {
      return { upper: [], middle: [], lower: [] };
    }

    const period = 20;
    const multiplier = 2;
    const upper = [];
    const middle = [];
    const lower = [];

    // 如果后端已提供BOLL数据，直接使用
    if (bollingerIndicator && bollingerIndicator.latest_values) {
      const { upper: latestUpper, middle: latestMiddle, lower: latestLower } = bollingerIndicator.latest_values;
      
      // 为每个数据点生成布林带值（简化版本，实际应该从后端获取完整序列）
      processedData.forEach((dataPoint, index) => {
        if (index >= period - 1) {
          // 计算移动平均
          const slice = processedData.slice(Math.max(0, index - period + 1), index + 1);
          const avgPrice = slice.reduce((sum, d) => sum + d.close, 0) / slice.length;
          
          // 计算标准差
          const variance = slice.reduce((sum, d) => sum + Math.pow(d.close - avgPrice, 2), 0) / slice.length;
          const stdDev = Math.sqrt(variance);
          
          upper.push({
            time: dataPoint.time,
            value: avgPrice + (stdDev * multiplier)
          });
          
          middle.push({
            time: dataPoint.time,
            value: avgPrice
          });
          
          lower.push({
            time: dataPoint.time,
            value: avgPrice - (stdDev * multiplier)
          });
        }
      });
    }

    return { upper, middle, lower };
  };

  // 增强版买入卖出点标记功能
  const addEnhancedTradingSignals = (candlestickSeries, processedData, signals) => {
    if (!candlestickSeries || !processedData || processedData.length === 0 || !signals) {
      console.warn('无法添加交易信号标记');
      return;
    }

    console.log('添加增强版交易信号标记...');
    const markers = [];

    try {
      // 1. 基于MACD的买入卖出点
      if (signals.indicators && signals.indicators.macd) {
        const macdMarkers = calculateMACDSignals(processedData, signals.indicators.macd);
        markers.push(...macdMarkers);
      }

      // 2. 基于RSI的买入卖出点
      if (signals.indicators && signals.indicators.rsi) {
        const rsiMarkers = calculateRSISignals(processedData, signals.indicators.rsi);
        markers.push(...rsiMarkers);
      }

      // 3. 基于布林带的买入卖出点
      if (signals.indicators && signals.indicators.bollinger) {
        const bollMarkers = calculateBollingerSignals(processedData, signals.indicators.bollinger);
        markers.push(...bollMarkers);
      }

      // 4. 基于交易信号的标记
      if (signals.trading_signals && Array.isArray(signals.trading_signals)) {
        signals.trading_signals.forEach((signal, index) => {
          if (processedData.length > index) {
            const dataPoint = processedData[Math.max(0, processedData.length - signals.trading_signals.length + index)];
            
            let markerColor = '#4caf50';
            let markerText = '买入';
            let position = 'belowBar';
            let shape = 'arrowUp';

            if (signal.type && signal.type.includes('卖出')) {
              markerColor = '#f44336';
              markerText = '卖出';
              position = 'aboveBar';
              shape = 'arrowDown';
            }

            markers.push({
              time: dataPoint.time,
              position: position,
              color: markerColor,
              shape: shape,
              text: `${markerText}\n${signal.reason || ''}`,
              size: 1.2
            });
          }
        });
      }

      // 5. 基于信号类型的通用标记
      if (signals.signal_type) {
        const latestData = processedData[processedData.length - 1];
        let markerColor = '#4caf50';
        let markerText = '买入';
        let position = 'belowBar';
        let shape = 'arrowUp';

        if (signals.signal_type.includes('卖出')) {
          markerColor = '#f44336';
          markerText = '卖出';
          position = 'aboveBar';
          shape = 'arrowDown';
        } else if (signals.signal_type.includes('强烈买入')) {
          markerColor = '#00ff00';
          markerText = '强烈买入';
          position = 'belowBar';
          shape = 'arrowUp';
        } else if (signals.signal_type.includes('强烈卖出')) {
          markerColor = '#ff0000';
          markerText = '强烈卖出';
          position = 'aboveBar';
          shape = 'arrowDown';
        }

        markers.push({
          time: latestData.time,
          position: position,
          color: markerColor,
          shape: shape,
          text: markerText,
          size: 2.0
        });
      }

      // 6. 添加技术指标交叉点标记
      addTechnicalCrossSignals(markers, processedData, signals);

      // 应用标记
      if (markers.length > 0) {
        candlestickSeries.setMarkers(markers);
        console.log(`已添加 ${markers.length} 个增强版交易信号标记`);
      } else {
        console.log('未生成任何交易信号标记');
      }

    } catch (error) {
      console.error('添加增强版交易信号失败:', error);
    }
  };

  // 添加技术指标交叉点标记
  const addTechnicalCrossSignals = (markers, processedData, signals) => {
    if (!processedData || processedData.length < 20) return;

    // MACD金叉死叉
    const macdData = calculateMACD(processedData);
    if (macdData.histogram.length >= 2) {
      for (let i = 1; i < macdData.histogram.length; i++) {
        const current = macdData.histogram[i];
        const previous = macdData.histogram[i - 1];
        
        // MACD金叉：从负转正
        if (previous.value < 0 && current.value > 0) {
          markers.push({
            time: current.time,
            position: 'belowBar',
            color: '#FFD700',
            shape: 'circle',
            text: 'MACD金叉',
            size: 1.5
          });
        }
        
        // MACD死叉：从正转负
        if (previous.value > 0 && current.value < 0) {
          markers.push({
            time: current.time,
            position: 'aboveBar',
            color: '#8B0000',
            shape: 'circle',
            text: 'MACD死叉',
            size: 1.5
          });
        }
      }
    }

    // 均线交叉
    const ma5Data = calculateMA(processedData, 5);
    const ma10Data = calculateMA(processedData, 10);
    const ma20Data = calculateMA(processedData, 20);

    // 检查MA5与MA10的交叉
    if (ma5Data.length >= 2 && ma10Data.length >= 2) {
      for (let i = 1; i < Math.min(ma5Data.length, ma10Data.length); i++) {
        const ma5Current = ma5Data[i].value;
        const ma5Previous = ma5Data[i - 1].value;
        const ma10Current = ma10Data[i].value;
        const ma10Previous = ma10Data[i - 1].value;

        // MA5上穿MA10
        if (ma5Previous <= ma10Previous && ma5Current > ma10Current) {
          markers.push({
            time: ma5Data[i].time,
            position: 'belowBar',
            color: '#4CAF50',
            shape: 'triangleUp',
            text: 'MA5上穿MA10',
            size: 1.3
          });
        }

        // MA5下穿MA10
        if (ma5Previous >= ma10Previous && ma5Current < ma10Current) {
          markers.push({
            time: ma5Data[i].time,
            position: 'aboveBar',
            color: '#F44336',
            shape: 'triangleDown',
            text: 'MA5下穿MA10',
            size: 1.3
          });
        }
      }
    }
  };

  // 计算MACD买入卖出信号
  const calculateMACDSignals = (processedData, macdIndicator) => {
    const markers = [];
    
    if (!macdIndicator || processedData.length < 26) return markers;

    // 计算MACD数据
    const macdData = calculateMACD(processedData);
    
    for (let i = 1; i < Math.min(macdData.histogram.length, processedData.length); i++) {
      const current = macdData.histogram[i];
      const previous = macdData.histogram[i - 1];
      
      // MACD金叉：从负转正
      if (previous.value < 0 && current.value > 0) {
        markers.push({
          time: current.time,
          position: 'belowBar',
          color: '#FFD700',
          shape: 'circle',
          text: 'MACD金叉',
          size: 1.5
        });
      }
      
      // MACD死叉：从正转负
      if (previous.value > 0 && current.value < 0) {
        markers.push({
          time: current.time,
          position: 'aboveBar',
          color: '#8B0000',
          shape: 'circle',
          text: 'MACD死叉',
          size: 1.5
        });
      }
    }

    return markers;
  };

  // 计算RSI买入卖出信号
  const calculateRSISignals = (processedData, rsiIndicator) => {
    const markers = [];
    
    if (!rsiIndicator || !rsiIndicator.latest_value) return markers;

    const rsiValue = rsiIndicator.latest_value;
    const latestData = processedData[processedData.length - 1];

    if (latestData) {
      // RSI超卖信号（<30）
      if (rsiValue < 30) {
        markers.push({
          time: latestData.time,
          position: 'belowBar',
          color: '#00BCD4',
          shape: 'square',
          text: `RSI超卖\n${rsiValue.toFixed(1)}`,
          size: 1.3
        });
      }
      
      // RSI超买信号（>70）
      if (rsiValue > 70) {
        markers.push({
          time: latestData.time,
          position: 'aboveBar',
          color: '#FF9800',
          shape: 'square',
          text: `RSI超买\n${rsiValue.toFixed(1)}`,
          size: 1.3
        });
      }
    }

    return markers;
  };

  // 计算布林带买入卖出信号
  const calculateBollingerSignals = (processedData, bollingerIndicator) => {
    const markers = [];
    
    if (!bollingerIndicator || !bollingerIndicator.latest_values || processedData.length === 0) {
      return markers;
    }

    const { upper, middle, lower } = bollingerIndicator.latest_values;
    const latestData = processedData[processedData.length - 1];
    const currentPrice = latestData.close;

    // 突破布林带上轨 - 可能回调
    if (currentPrice > upper) {
      markers.push({
        time: latestData.time,
        position: 'aboveBar',
        color: '#E91E63',
        shape: 'arrowDown',
        text: `突破上轨\n${currentPrice.toFixed(2)}`,
        size: 1.4
      });
    }
    
    // 跌破布林带下轨 - 可能反弹
    if (currentPrice < lower) {
      markers.push({
        time: latestData.time,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'arrowUp',
        text: `跌破下轨\n${currentPrice.toFixed(2)}`,
        size: 1.4
      });
    }

    // 突破中轨
    if (processedData.length >= 2) {
      const previousData = processedData[processedData.length - 2];
      
      // 向上突破中轨
      if (previousData.close <= middle && currentPrice > middle) {
        markers.push({
          time: latestData.time,
          position: 'belowBar',
          color: '#4CAF50',
          shape: 'circle',
          text: '突破中轨',
          size: 1.1
        });
      }
      
      // 向下跌破中轨
      if (previousData.close >= middle && currentPrice < middle) {
        markers.push({
          time: latestData.time,
          position: 'aboveBar',
          color: '#FF5722',
          shape: 'circle',
          text: '跌破中轨',
          size: 1.1
        });
      }
    }

    return markers;
  };

  useEffect(() => {
    console.log('=== TradingViewChart useEffect ===');
    console.log('Stock data available:', !!stockData, 'Length:', stockData?.length);
    console.log('Init attempts:', initAttempts);
    console.log('Current state - loading:', loading, 'error:', !!error);
    
    if (!stockData || stockData.length === 0) {
      console.log('No stock data, setting loading to false');
      setLoading(false);
      return;
    }

    // 清理之前的图表
    [priceChartRef, volumeChartRef, macdChartRef].forEach(chartRef => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          console.warn('Chart cleanup warning:', error);
        }
        chartRef.current = null;
      }
    });

    // 设置loading为false，让容器先渲染出来
    setLoading(false);
    setError(null);

    // 使用更激进的方法：多次重试 + DOM查询
    const maxRetries = 15;
    let retryCount = 0;
    
    const tryInitialize = () => {
      retryCount++;
      console.log(`Starting container check (attempt ${retryCount}/${maxRetries})...`);
      
      // 同时使用ref和DOM查询两种方式
      const priceElRef = priceChartContainerRef.current;
      const volumeElRef = volumeChartContainerRef.current;
      const macdElRef = macdChartContainerRef.current;
      
      // 备用：通过类名查找容器（因为它们有独特的样式）
      const allDivs = document.querySelectorAll('div[style*="background-color: rgb(37, 40, 54)"]');
      console.log('Found divs with background color:', allDivs.length);
      
      // 更精确的查找：通过样式组合查找
      const priceElDOM = Array.from(allDivs).find(div => 
        div.style.height === '400px' && 
        div.style.backgroundColor === 'rgb(37, 40, 54)'
      );
      const volumeElDOM = Array.from(allDivs).find(div => 
        div.style.height === '200px' && 
        div.style.backgroundColor === 'rgb(37, 40, 54)' &&
        div !== priceElDOM
      );
      const macdElDOM = Array.from(allDivs).find(div => 
        div.style.height === '200px' && 
        div.style.backgroundColor === 'rgb(37, 40, 54)' &&
        div !== priceElDOM &&
        div !== volumeElDOM
      );
      
      const priceEl = priceElRef || priceElDOM;
      const volumeEl = volumeElRef || volumeElDOM;
      const macdEl = macdElRef || macdElDOM;
      
      console.log('Container check results:', {
        attempt: retryCount,
        priceElRef: !!priceElRef,
        priceElDOM: !!priceElDOM,
        priceEl: !!priceEl,
        priceWidth: priceEl?.offsetWidth || 0,
        priceHeight: priceEl?.offsetHeight || 0,
        volumeElRef: !!volumeElRef,
        volumeElDOM: !!volumeElDOM,
        volumeEl: !!volumeEl,
        volumeWidth: volumeEl?.offsetWidth || 0,
        volumeHeight: volumeEl?.offsetHeight || 0,
        macdElRef: !!macdElRef,
        macdElDOM: !!macdElDOM,
        macdEl: !!macdEl,
        macdWidth: macdEl?.offsetWidth || 0,
        macdHeight: macdEl?.offsetHeight || 0,
        totalDivsFound: allDivs.length,
        allDivsInfo: Array.from(allDivs).map(div => ({
          height: div.style.height,
          width: div.style.width,
          backgroundColor: div.style.backgroundColor
        }))
      });

      if (!priceEl || !volumeEl || !macdEl) {
        if (retryCount < maxRetries) {
          console.log(`Containers not ready, retrying in 300ms...`);
          setTimeout(tryInitialize, 300);
          return;
        } else {
          console.error('Containers not found after all retries');
          setError('图表容器未找到，请刷新页面重试');
          return;
        }
      }

      if (priceEl.offsetWidth === 0 || volumeEl.offsetWidth === 0 || macdEl.offsetWidth === 0) {
        if (retryCount < maxRetries) {
          console.log(`Containers have zero width, retrying in 300ms...`);
          setTimeout(tryInitialize, 300);
          return;
        } else {
          console.error('Containers have zero width after all retries');
          setError('图表容器尺寸异常，请刷新页面重试');
          return;
        }
      }

      // 更新ref以确保createCharts可以使用
      if (!priceChartContainerRef.current && priceEl) priceChartContainerRef.current = priceEl;
      if (!volumeChartContainerRef.current && volumeEl) volumeChartContainerRef.current = volumeEl;
      if (!macdChartContainerRef.current && macdEl) macdChartContainerRef.current = macdEl;

      // 开始创建图表
      try {
        console.log('All containers ready, creating charts...');
        setLoading(true); // 设置loading为true，显示加载状态
        createCharts();
      } catch (error) {
        console.error('Chart creation failed:', error);
        setError(`图表创建失败: ${error.message}`);
        setLoading(false);
      }
    };
    
    // 首次尝试延迟500ms
    const initTimeout = setTimeout(tryInitialize, 500);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [stockData, initAttempts, selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCharts = () => {
    try {
      console.log('Starting chart creation...');
      
      // ---------- 日期与字段兼容处理 ----------
      const parseDate = (value) => {
        /*
         * 支持以下格式：
         * 1. 字符串 'YYYY-MM-DD' / 'YYYY/MM/DD'
         * 2. JavaScript Date 对象
         * 3. 其他可解析的日期字符串（回退给 Date 构造函数）
         * 返回符合 Lightweight-Charts v5 BusinessDay 格式的对象：{ year, month, day }
         */
        if (!value) return undefined;

        // Date 对象
        if (value instanceof Date) {
          return {
            year: value.getFullYear(),
            month: value.getMonth() + 1, // getMonth() 从 0 开始
            day: value.getDate(),
          };
        }

        // 字符串处理
        if (typeof value === 'string') {
          // 1) 如果包含时间信息 (如 "2024-07-07 14:30:00" 或 ISO 字符串)，直接返回 Unix 时间戳（秒）
          if (value.includes(':')) {
            const d = new Date(value.replace(/-/g, '/'));
            if (!isNaN(d)) {
              return Math.floor(d.getTime() / 1000);
            }
          }

          // 2) 仅日期字符串，兼容 2024-07-07 / 2024/7/7 等形式 -> BusinessDay
          const match = value.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
          if (match) {
            return {
              year: Number(match[1]),
              month: Number(match[2]),
              day: Number(match[3]),
            };
          }

          // 3) 回退：Date 构造解析
          const d = new Date(value);
          if (!isNaN(d)) {
            return {
              year: d.getFullYear(),
              month: d.getMonth() + 1,
              day: d.getDate(),
            };
          }
        }

        return undefined; // 无法解析
      };

      // 将后端各种字段命名统一映射，过滤掉无效数据行
      const processedDataRaw = stockData
        .map((item) => {
          // 后端可能返回 Date/日期字段大小写不一致，做兼容
          const dateValue = item.date ?? item.Date ?? item.time ?? item.Time;

          return {
            rawDate: dateValue,
            time: parseDate(dateValue),
            open: parseFloat(item.open ?? item.Open),
            high: parseFloat(item.high ?? item.High),
            low: parseFloat(item.low ?? item.Low),
            close: parseFloat(item.close ?? item.Close),
            volume: parseFloat(item.volume ?? item.Volume),
          };
        })
        .filter((d) => d.time && !Number.isNaN(d.open) && !Number.isNaN(d.close));

      // ---- 排序并去除重复时间 ----
      const sortedData = [...processedDataRaw].sort((a, b) => {
        const getSec = (t, raw) => {
          if (typeof t === 'number') return t;
          if (t && t.year) return Date.UTC(t.year, t.month - 1, t.day) / 1000;
          return new Date(raw).getTime() / 1000;
        };
        return getSec(a.time, a.rawDate) - getSec(b.time, b.rawDate);
      });

      const uniqueData = [];
      const seen = new Set();
      for (const d of sortedData) {
        const key = typeof d.time === 'number' ? d.time : `${d.time.year}-${d.time.month}-${d.time.day}`;
        if (!seen.has(key)) {
          seen.add(key);
          const { rawDate, ...rest } = d; // 移除辅助字段
          uniqueData.push(rest);
        }
      }

      let processedData = uniqueData;

      // ---- 周线时间跨度限制：仅保留最近26周（约半年） ----
      if (selectedPeriod === 'weekly') {
        processedData = processedData.slice(-26);
      }

      console.log('Processed data sample:', processedData.slice(0, 3));

      // 创建主K线图表
      const priceChartResult = createChart(priceChartContainerRef.current, {
        width: priceChartContainerRef.current.offsetWidth,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: '#253654' },
          textColor: '#DDD',
        },
        grid: {
          vertLines: { color: '#334155' },
          horzLines: { color: '#334155' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          borderColor: '#485462',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#485462',
        },
      });
      
      console.log('Price chart result:', priceChartResult);
      console.log('Price chart result type:', typeof priceChartResult);
      console.log('Price chart result keys:', Object.keys(priceChartResult || {}));
      
      // 根据返回结果确定正确的chart对象
      let priceChart;
      if (priceChartResult && typeof priceChartResult === 'object') {
        // 检查是否有addCandlestickSeries方法（直接是ChartApi对象）
        if (typeof priceChartResult.addCandlestickSeries === 'function') {
          priceChart = priceChartResult;
        } else if (priceChartResult.chart && typeof priceChartResult.chart.addCandlestickSeries === 'function') {
          // 检查是否有.chart属性且该属性有addCandlestickSeries方法
          priceChart = priceChartResult.chart;
        } else {
          // 检查原型链上的方法
          const proto = Object.getPrototypeOf(priceChartResult);
          if (proto && typeof proto.addCandlestickSeries === 'function') {
            priceChart = priceChartResult;
          } else if (proto && typeof proto.addSeries === 'function') {
            // 如果没有addCandlestickSeries，但有addSeries，尝试使用addSeries
            console.log('Using addSeries instead of addCandlestickSeries');
            priceChart = priceChartResult;
          } else {
            console.error('Unexpected priceChartResult structure:', priceChartResult);
            console.error('Available methods:', Object.getOwnPropertyNames(priceChartResult));
            console.error('Prototype methods:', proto ? Object.getOwnPropertyNames(proto) : 'No prototype');
            throw new Error('无法创建价格图表：返回对象结构异常');
          }
        }
      } else {
        console.error('priceChartResult is not an object:', priceChartResult);
        throw new Error('无法创建价格图表：返回结果异常');
      }

      // 创建K线图
      let candlestickSeries;
      if (typeof priceChart.addCandlestickSeries === 'function') {
        candlestickSeries = priceChart.addCandlestickSeries({
          // A股颜色规范：涨红跌绿
          upColor: '#ff4976',
          downColor: '#00ff88',
          borderUpColor: '#ff4976',
          borderDownColor: '#00ff88',
          wickUpColor: '#ff4976',
          wickDownColor: '#00ff88',
        });
      } else if (typeof priceChart.addSeries === 'function') {
        // 使用addSeries方法创建K线图
        candlestickSeries = priceChart.addSeries(CandlestickSeries, {
          upColor: '#ff4976',
          downColor: '#00ff88',
          borderUpColor: '#ff4976',
          borderDownColor: '#00ff88',
          wickUpColor: '#ff4976',
          wickDownColor: '#00ff88',
        });
      } else {
        throw new Error('无法创建K线图：不支持的方法');
      }

      candlestickSeries.setData(processedData);

      // 添加移动平均线
      const ma5Data = calculateMA(processedData, 5);
      const ma10Data = calculateMA(processedData, 10);
      const ma20Data = calculateMA(processedData, 20);

      if (ma5Data.length > 0) {
        let ma5Series;
        if (typeof priceChart.addLineSeries === 'function') {
          ma5Series = priceChart.addLineSeries({
            color: '#ffeb3b',
            lineWidth: 1,
            title: 'MA5',
          });
        } else if (typeof priceChart.addSeries === 'function') {
          ma5Series = priceChart.addSeries(LineSeries, {
            color: '#ffeb3b',
            lineWidth: 1,
            title: 'MA5',
          });
        } else {
          throw new Error('无法创建MA5线：不支持的方法');
        }
        ma5Series.setData(ma5Data);
      }

      if (ma10Data.length > 0) {
        let ma10Series;
        if (typeof priceChart.addLineSeries === 'function') {
          ma10Series = priceChart.addLineSeries({
            color: '#2196f3',
            lineWidth: 1,
            title: 'MA10',
          });
        } else if (typeof priceChart.addSeries === 'function') {
          ma10Series = priceChart.addSeries(LineSeries, {
            color: '#2196f3',
            lineWidth: 1,
            title: 'MA10',
          });
        } else {
          throw new Error('无法创建MA10线：不支持的方法');
        }
        ma10Series.setData(ma10Data);
      }

      if (ma20Data.length > 0) {
        let ma20Series;
        if (typeof priceChart.addLineSeries === 'function') {
          ma20Series = priceChart.addLineSeries({
            color: '#f44336',
            lineWidth: 1,
            title: 'MA20',
          });
        } else if (typeof priceChart.addSeries === 'function') {
          ma20Series = priceChart.addSeries(LineSeries, {
            color: '#f44336',
            lineWidth: 1,
            title: 'MA20',
          });
        } else {
          throw new Error('无法创建MA20线：不支持的方法');
        }
        ma20Series.setData(ma20Data);
      }

      // 创建成交量图表
      const volumeChartResult = createChart(volumeChartContainerRef.current, {
        width: volumeChartContainerRef.current.offsetWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: '#253654' },
          textColor: '#DDD',
        },
        grid: {
          vertLines: { color: '#334155' },
          horzLines: { color: '#334155' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          borderColor: '#485462',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#485462',
        },
      });
      
      // 根据返回结果确定正确的chart对象（兼容v5无addHistogramSeries的情况）
      let volumeChart;
      if (volumeChartResult && typeof volumeChartResult === 'object') {
        if (typeof volumeChartResult.addHistogramSeries === 'function') {
          // v4/v3 旧API
          volumeChart = volumeChartResult;
        } else if (typeof volumeChartResult.addSeries === 'function') {
          // v5 新API，仅提供 addSeries
          volumeChart = volumeChartResult;
        } else if (volumeChartResult.chart && (typeof volumeChartResult.chart.addHistogramSeries === 'function' || typeof volumeChartResult.chart.addSeries === 'function')) {
          // 某些打包工具可能包在 .chart 属性下
          volumeChart = volumeChartResult.chart;
        } else {
          const proto = Object.getPrototypeOf(volumeChartResult);
          if (proto && (typeof proto.addHistogramSeries === 'function' || typeof proto.addSeries === 'function')) {
            volumeChart = volumeChartResult;
          } else {
            console.error('Unexpected volumeChartResult structure:', volumeChartResult);
            console.error('Available methods:', Object.getOwnPropertyNames(volumeChartResult));
            console.error('Prototype methods:', proto ? Object.getOwnPropertyNames(proto) : 'No prototype');
            throw new Error('无法创建成交量图表：返回对象结构异常');
          }
        }
      } else {
        console.error('volumeChartResult is not an object:', volumeChartResult);
        throw new Error('无法创建成交量图表：返回结果异常');
      }

      const volumeData = processedData.map(item => ({
        time: item.time,
        value: item.volume,
        // A股规范：涨红跌绿
        color: item.close >= item.open ? '#ff497640' : '#00ff8840'
      }));

      let volumeSeries;
      if (typeof volumeChart.addHistogramSeries === 'function') {
        volumeSeries = volumeChart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      } else if (typeof volumeChart.addSeries === 'function') {
        // 使用addSeries方法创建成交量图
        volumeSeries = volumeChart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      } else {
        throw new Error('无法创建成交量图：不支持的方法');
      }

      volumeSeries.setData(volumeData);

      // 创建MACD图表
      const macdChartResult = createChart(macdChartContainerRef.current, {
        width: macdChartContainerRef.current.offsetWidth,
        height: 200,
        layout: {
          background: { type: ColorType.Solid, color: '#253654' },
          textColor: '#DDD',
        },
        grid: {
          vertLines: { color: '#334155' },
          horzLines: { color: '#334155' },
        },
        crosshair: { mode: 1 },
        timeScale: {
          borderColor: '#485462',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#485462',
        },
      });
      
      // 根据返回结果确定正确的chart对象
      let macdChart;
      if (macdChartResult && typeof macdChartResult === 'object') {
        // 直接 ChartApi 对象 - 支持 addLineSeries 或 addSeries
        if (typeof macdChartResult.addLineSeries === 'function' || typeof macdChartResult.addSeries === 'function') {
          macdChart = macdChartResult;
        } else if (
          macdChartResult.chart &&
          (typeof macdChartResult.chart.addLineSeries === 'function' || typeof macdChartResult.chart.addSeries === 'function')
        ) {
          macdChart = macdChartResult.chart;
        } else {
          const proto = Object.getPrototypeOf(macdChartResult);
          if (proto && (typeof proto.addLineSeries === 'function' || typeof proto.addSeries === 'function')) {
            macdChart = macdChartResult;
          } else {
            console.error('Unexpected macdChartResult structure:', macdChartResult);
            console.error('Available methods:', Object.getOwnPropertyNames(macdChartResult));
            console.error('Prototype methods:', proto ? Object.getOwnPropertyNames(proto) : 'No prototype');
            throw new Error('无法创建MACD图表：返回对象结构异常');
          }
        }
      } else {
        console.error('macdChartResult is not an object:', macdChartResult);
        throw new Error('无法创建MACD图表：返回结果异常');
      }

      const macdData = calculateMACD(processedData);
      
      if (macdData.macd.length > 0) {
        let macdSeries;
        if (typeof macdChart.addLineSeries === 'function') {
          macdSeries = macdChart.addLineSeries({
            color: '#2196f3',
            lineWidth: 2,
            title: 'MACD',
          });
        } else if (typeof macdChart.addSeries === 'function') {
          macdSeries = macdChart.addSeries(LineSeries, {
            color: '#2196f3',
            lineWidth: 2,
            title: 'MACD',
          });
        } else {
          throw new Error('无法创建MACD线：不支持的方法');
        }
        macdSeries.setData(macdData.macd);
      }

      if (macdData.signal.length > 0) {
        let signalSeries;
        if (typeof macdChart.addLineSeries === 'function') {
          signalSeries = macdChart.addLineSeries({
            color: '#ff9800',
            lineWidth: 2,
            title: 'Signal',
          });
        } else if (typeof macdChart.addSeries === 'function') {
          signalSeries = macdChart.addSeries(LineSeries, {
            color: '#ff9800',
            lineWidth: 2,
            title: 'Signal',
          });
        } else {
          throw new Error('无法创建Signal线：不支持的方法');
        }
        signalSeries.setData(macdData.signal);
      }

      if (macdData.histogram.length > 0) {
        // 为柱状图设置涨红跌绿颜色
        const histogramWithColor = macdData.histogram.map(item => ({
          ...item,
          color: item.value >= 0 ? '#ff4976' : '#00ff88'
        }));

        let histogramSeries;
        if (typeof macdChart.addHistogramSeries === 'function') {
          histogramSeries = macdChart.addHistogramSeries({
            base: 0,
            priceFormat: { type: 'price' },
            lineWidth: 1,
            title: 'Histogram',
          });
        } else if (typeof macdChart.addSeries === 'function') {
          histogramSeries = macdChart.addSeries(HistogramSeries, {
            base: 0,
            priceFormat: { type: 'price' },
            lineWidth: 1,
            title: 'Histogram',
          });
        } else {
          throw new Error('无法创建Histogram：不支持的方法');
        }
        histogramSeries.setData(histogramWithColor);
      }

      // 添加买入卖出点标记
      addTradingSignalMarkers(candlestickSeries, processedData);

      // 获取当前周期的信号数据
      const currentPeriodSignals = allSignals?.[selectedPeriod]?.signals;

      // 添加布林带指标线
      addBollingerBands(priceChart, processedData, currentPeriodSignals);

      // 添加增强版买入卖出点标记
      addEnhancedTradingSignals(candlestickSeries, processedData, currentPeriodSignals);

      // 添加十字光标事件监听器
      addCrosshairEventListeners(priceChart, processedData);

      // 保存图表引用
      priceChartRef.current = priceChart;
      volumeChartRef.current = volumeChart;
      macdChartRef.current = macdChart;

      // ---------- 初始时间范围同步 ----------
      try {
        // 1) 先让主图完整显示全部数据
        priceChart.timeScale().fitContent();

        // 2) 获取主图可见逻辑范围并应用到其他图表
        const initialLogical = priceChart.timeScale().getVisibleLogicalRange();
        if (initialLogical) {
          volumeChart.timeScale().setVisibleLogicalRange(initialLogical);
          macdChart.timeScale().setVisibleLogicalRange(initialLogical);
        }
      } catch (e) {
        console.warn('初始时间范围同步失败:', e);
      }

      // ---------- 动态同步时间轴 ----------
      priceChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        const logical = priceChart.timeScale().getVisibleLogicalRange();
        if (!logical) return;
        try {
          volumeChart.timeScale().setVisibleLogicalRange(logical);
          macdChart.timeScale().setVisibleLogicalRange(logical);
        } catch (e) {
          console.warn('同步时间轴失败:', e);
        }
      });

      console.log('Charts created successfully');
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Chart creation error:', error);
      setError(`图表创建失败: ${error.message}`);
      setLoading(false);
    }
  };

  const calculateMA = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, item) => acc + item.close, 0);
      result.push({
        time: data[i].time,
        value: sum / period
      });
    }
    return result;
  };

  const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (data.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    const prices = data.map(item => item.close);
    const fastEMA = calculateEMAFromValues(prices, fastPeriod);
    const slowEMA = calculateEMAFromValues(prices, slowPeriod);
    
    const macdLine = [];
    const startIndex = slowPeriod - 1;
    
    for (let i = startIndex; i < data.length; i++) {
      const macdValue = fastEMA[i] - slowEMA[i];
      macdLine.push(macdValue);
    }
    
    const signalLine = calculateEMAFromValues(macdLine, signalPeriod);
    
    const macd = [];
    const signal = [];
    const histogram = [];
    
    const signalStartIndex = startIndex + signalPeriod - 1;
    
    for (let i = signalStartIndex; i < data.length; i++) {
      const macdIndex = i - startIndex;
      const signalIndex = i - signalStartIndex;
      
      if (macdIndex < macdLine.length && signalIndex < signalLine.length) {
        macd.push({
          time: data[i].time,
          value: macdLine[macdIndex]
        });
        
        signal.push({
          time: data[i].time,
          value: signalLine[signalIndex]
        });
        
        histogram.push({
          time: data[i].time,
          value: macdLine[macdIndex] - signalLine[signalIndex]
        });
      }
    }
    
    return { macd, signal, histogram };
  };

  const calculateEMAFromValues = (data, period) => {
    const result = [];
    const multiplier = 2 / (period + 1);
    
    let ema = data[0];
    result.push(ema);
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
      result.push(ema);
    }
    
    return result;
  };

  if (!allStockData || Object.keys(allStockData).length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          暂无图表数据，请先生成交易信号
        </Alert>
      </Box>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 股票信息 - 固定在顶部 */}
        <Box sx={{ p: 2, bgcolor: 'info.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" color="info.main" gutterBottom>
            📈 {stockInfo?.name || '股票'} 技术图表
          </Typography>
          
          {/* 实时价格信息显示 */}
          {crosshairData.visible && (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 1.5, 
                mb: 2, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: parseFloat(crosshairData.change) >= 0 ? 'success.main' : 'error.main',
                borderRadius: 2
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2" color="text.secondary">
                    时间: {crosshairData.time}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body1" fontWeight="bold">
                    开盘: {crosshairData.open}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body1" fontWeight="bold" color="error.main">
                    最高: {crosshairData.high}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    最低: {crosshairData.low}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Typography variant="body1" fontWeight="bold" fontSize="1.1rem">
                    收盘: {crosshairData.close}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={parseFloat(crosshairData.change) >= 0 ? 'success.main' : 'error.main'}
                  >
                    涨跌: {parseFloat(crosshairData.change) >= 0 ? '+' : ''}{crosshairData.change}
                    ({parseFloat(crosshairData.changePercent) >= 0 ? '+' : ''}{crosshairData.changePercent}%)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    成交量: {crosshairData.volume}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {stockInfo?.code && (
              <Chip label={`代码: ${stockInfo.code}`} size="small" />
            )}
            {stockInfo?.current_price && (
              <Chip 
                label={`当前价: ¥${stockInfo.current_price}`} 
                size="small"
                color={stockInfo.change_percent > 0 ? 'success' : 'error'}
              />
            )}
            {stockInfo?.change_percent && (
              <Chip 
                label={`涨幅: ${stockInfo.change_percent > 0 ? '+' : ''}${stockInfo.change_percent}%`} 
                size="small"
                color={stockInfo.change_percent > 0 ? 'success' : 'error'}
              />
            )}
          </Box>
        </Box>

        {/* 周期选择器 - 二级标签 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedPeriod} 
            onChange={handlePeriodChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 40 }}
          >
            {Object.entries(allStockData).map(([periodKey, periodData]) => (
              <Tab 
                key={periodKey} 
                value={periodKey} 
                label={allSignals?.[periodKey]?.period_name || periodKey}
                sx={{ minHeight: 40, py: 1 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* 图表内容 - 可滚动区域 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                正在加载图表...
              </Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" action={
                <button onClick={forceInit}>重试</button>
              }>
                {error}
              </Alert>
            </Box>
          )}

          {!loading && !error && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {/* 主价格图表 */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      价格走势 (含移动平均线)
                    </Typography>
                    <Box
                      ref={priceChartContainerRef}
                      sx={{
                        width: '100%',
                        height: 400,
                        backgroundColor: '#253654',
                        borderRadius: 0,
                      }}
                    />
                  </Paper>
                </Grid>

                {/* 成交量图表 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      成交量
                    </Typography>
                    <Box
                      ref={volumeChartContainerRef}
                      sx={{
                        width: '100%',
                        height: 200,
                        backgroundColor: '#253654',
                        borderRadius: 0,
                      }}
                    />
                  </Paper>
                </Grid>

                {/* MACD图表 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      MACD指标
                    </Typography>
                    <Box
                      ref={macdChartContainerRef}
                      sx={{
                        width: '100%',
                        height: 200,
                        backgroundColor: '#253654',
                        borderRadius: 0,
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradingViewChart; 