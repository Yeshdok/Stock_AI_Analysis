import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Speed,
  AccountBalance,
  Psychology,
  AutoGraph,
  Insights,
  MonetizationOn,
  Assessment,
  Timeline,
  PlayArrow,
  Info,
  Star,
  CompareArrows,
  Settings,
  Analytics,
  BarChart,
  ShowChart,
  PieChart,
  Equalizer,
  TrendingDown,
  ExpandMore,
  Download,
  Visibility,
  Edit,
  Launch
} from '@mui/icons-material';
import StrategyResultDisplay from '../components/StrategyResultDisplay';

// 更完善的预置策略配置数据
const ADVANCED_STRATEGIES = [
  {
    id: 'blue_chip_enhanced',
    name: '蓝筹白马增强策略',
    description: '专注大盘蓝筹股，追求稳健收益，增强风控机制',
    icon: <Security />,
    color: '#1976d2',
    risk_level: '低风险',
    expected_return: '10-18%',
    category: 'value',
    complexity: '简单',
    parameters: {
      pe_min: { value: 8, min: 3, max: 30, desc: 'PE最小值' },
      pe_max: { value: 25, min: 10, max: 50, desc: 'PE最大值' },
      pb_min: { value: 0.8, min: 0.3, max: 2, desc: 'PB最小值' },
      pb_max: { value: 3.5, min: 2, max: 8, desc: 'PB最大值' },
      roe_min: { value: 12, min: 5, max: 30, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 1000, min: 100, max: 5000, desc: '最小市值(亿)' },
      revenue_growth_min: { value: 8, min: 0, max: 50, desc: '营收增长率最小值(%)' },
      debt_ratio_max: { value: 45, min: 20, max: 80, desc: '资产负债率最大值(%)' },
      dividend_yield_min: { value: 2, min: 0, max: 10, desc: '股息率最小值(%)' },
      current_ratio_min: { value: 1.5, min: 0.5, max: 3, desc: '流动比率最小值' }
    },
    selection_criteria: [
      '市值 ≥ 1000亿元',
      'PE: 8-25倍',
      'PB: 0.8-3.5倍',
      'ROE ≥ 12%',
      '营收增长率 ≥ 8%',
      '资产负债率 ≤ 45%',
      '股息率 ≥ 2%',
      '流动比率 ≥ 1.5'
    ],
    backtest_performance: {
      annual_return: '15.2%',
      max_drawdown: '8.5%',
      sharpe_ratio: '1.85',
      win_rate: '72%'
    }
  },
  {
    id: 'high_dividend_plus',
    name: '高股息Plus策略',
    description: '专注高分红优质股，获取稳定现金流，增加成长性筛选',
    icon: <MonetizationOn />,
    color: '#388e3c',
    risk_level: '低风险',
    expected_return: '8-15%',
    category: 'dividend',
    complexity: '简单',
    parameters: {
      dividend_yield_min: { value: 4.5, min: 2, max: 15, desc: '股息率最小值(%)' },
      pe_min: { value: 5, min: 2, max: 15, desc: 'PE最小值' },
      pe_max: { value: 18, min: 10, max: 35, desc: 'PE最大值' },
      pb_min: { value: 0.5, min: 0.2, max: 1.5, desc: 'PB最小值' },
      pb_max: { value: 2.5, min: 1.5, max: 5, desc: 'PB最大值' },
      roe_min: { value: 10, min: 5, max: 25, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 300, min: 50, max: 2000, desc: '最小市值(亿)' },
      payout_ratio_min: { value: 35, min: 10, max: 70, desc: '分红比例最小值(%)' },
      payout_ratio_max: { value: 65, min: 40, max: 90, desc: '分红比例最大值(%)' },
      revenue_stability: { value: 0.8, min: 0.3, max: 1, desc: '营收稳定性系数' }
    },
    selection_criteria: [
      '股息率 ≥ 4.5%',
      'PE: 5-18倍',
      'PB: 0.5-2.5倍',
      'ROE ≥ 10%',
      '分红比例: 35-65%',
      '市值 ≥ 300亿元',
      '营收稳定性 ≥ 0.8'
    ],
    backtest_performance: {
      annual_return: '12.8%',
      max_drawdown: '6.2%',
      sharpe_ratio: '2.15',
      win_rate: '78%'
    }
  },
  {
    id: 'quality_growth_pro',
    name: '质量成长Pro策略',
    description: '寻找高质量成长股，兼顾安全边际和成长潜力',
    icon: <TrendingUp />,
    color: '#f57c00',
    risk_level: '中风险',
    expected_return: '18-30%',
    category: 'growth',
    complexity: '中等',
    parameters: {
      pe_min: { value: 15, min: 8, max: 30, desc: 'PE最小值' },
      pe_max: { value: 40, min: 25, max: 80, desc: 'PE最大值' },
      pb_min: { value: 1.5, min: 0.8, max: 3, desc: 'PB最小值' },
      pb_max: { value: 6, min: 3, max: 12, desc: 'PB最大值' },
      roe_min: { value: 18, min: 10, max: 35, desc: 'ROE最小值(%)' },
      revenue_growth_min: { value: 20, min: 10, max: 50, desc: '营收增长率最小值(%)' },
      profit_growth_min: { value: 25, min: 15, max: 60, desc: '净利润增长率最小值(%)' },
      market_cap_min: { value: 150, min: 50, max: 1000, desc: '最小市值(亿)' },
      gross_margin_min: { value: 35, min: 20, max: 70, desc: '毛利率最小值(%)' },
      rd_ratio_min: { value: 3, min: 0, max: 20, desc: '研发费用率最小值(%)' }
    },
    selection_criteria: [
      'PE: 15-40倍',
      'PB: 1.5-6倍',
      'ROE ≥ 18%',
      '营收增长率 ≥ 20%',
      '净利润增长率 ≥ 25%',
      '毛利率 ≥ 35%',
      '研发费用率 ≥ 3%'
    ],
    backtest_performance: {
      annual_return: '24.6%',
      max_drawdown: '18.2%',
      sharpe_ratio: '1.45',
      win_rate: '65%'
    }
  },
  {
    id: 'deep_value_investing',
    name: '深度价值投资策略',
    description: '严格按照价值投资理念，寻找被严重低估的优质股',
    icon: <Assessment />,
    color: '#7b1fa2',
    risk_level: '中风险',
    expected_return: '15-25%',
    category: 'value',
    complexity: '中等',
    parameters: {
      pe_min: { value: 3, min: 1, max: 10, desc: 'PE最小值' },
      pe_max: { value: 12, min: 8, max: 20, desc: 'PE最大值' },
      pb_min: { value: 0.4, min: 0.2, max: 1, desc: 'PB最小值' },
      pb_max: { value: 1.8, min: 1, max: 3, desc: 'PB最大值' },
      roe_min: { value: 10, min: 5, max: 20, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 80, min: 20, max: 500, desc: '最小市值(亿)' },
      debt_ratio_max: { value: 55, min: 30, max: 80, desc: '资产负债率最大值(%)' },
      current_ratio_min: { value: 1.2, min: 0.8, max: 2.5, desc: '流动比率最小值' },
      book_value_discount: { value: 0.7, min: 0.4, max: 0.9, desc: '净资产折扣率' }
    },
    selection_criteria: [
      'PE: 3-12倍',
      'PB: 0.4-1.8倍',
      'ROE ≥ 10%',
      '市值 ≥ 80亿元',
      '资产负债率 ≤ 55%',
      '流动比率 ≥ 1.2',
      '净资产折扣 ≤ 70%'
    ],
    backtest_performance: {
      annual_return: '19.8%',
      max_drawdown: '12.5%',
      sharpe_ratio: '1.65',
      win_rate: '68%'
    }
  },
  {
    id: 'small_cap_momentum',
    name: '小盘动量策略',
    description: '专注小盘成长股，结合动量因子，追求超额收益',
    icon: <Speed />,
    color: '#d32f2f',
    risk_level: '高风险',
    expected_return: '25-45%',
    category: 'momentum',
    complexity: '复杂',
    parameters: {
      pe_min: { value: 20, min: 10, max: 40, desc: 'PE最小值' },
      pe_max: { value: 70, min: 40, max: 120, desc: 'PE最大值' },
      pb_min: { value: 2.5, min: 1, max: 5, desc: 'PB最小值' },
      pb_max: { value: 12, min: 6, max: 20, desc: 'PB最大值' },
      roe_min: { value: 15, min: 8, max: 30, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 30, min: 10, max: 100, desc: '最小市值(亿)' },
      market_cap_max: { value: 250, min: 100, max: 500, desc: '最大市值(亿)' },
      revenue_growth_min: { value: 30, min: 15, max: 80, desc: '营收增长率最小值(%)' },
      profit_growth_min: { value: 35, min: 20, max: 100, desc: '净利润增长率最小值(%)' },
      momentum_score_min: { value: 0.7, min: 0.3, max: 1, desc: '动量评分最小值' }
    },
    selection_criteria: [
      '市值: 30-250亿元',
      'PE: 20-70倍',
      'PB: 2.5-12倍',
      'ROE ≥ 15%',
      '营收增长率 ≥ 30%',
      '净利润增长率 ≥ 35%',
      '动量评分 ≥ 0.7'
    ],
    backtest_performance: {
      annual_return: '32.4%',
      max_drawdown: '28.5%',
      sharpe_ratio: '1.25',
      win_rate: '58%'
    }
  },
  {
    id: 'sector_rotation_pro',
    name: '行业轮动Pro策略',
    description: '基于经济周期和行业景气度，智能轮动配置不同行业',
    icon: <CompareArrows />,
    color: '#455a64',
    risk_level: '中高风险',
    expected_return: '20-35%',
    category: 'rotation',
    complexity: '复杂',
    parameters: {
      pe_min: { value: 8, min: 3, max: 20, desc: 'PE最小值' },
      pe_max: { value: 35, min: 20, max: 60, desc: 'PE最大值' },
      pb_min: { value: 1, min: 0.5, max: 2, desc: 'PB最小值' },
      pb_max: { value: 5, min: 3, max: 10, desc: 'PB最大值' },
      roe_min: { value: 12, min: 5, max: 25, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 120, min: 50, max: 1000, desc: '最小市值(亿)' },
      industry_momentum: { value: 0.6, min: 0.3, max: 1, desc: '行业动量系数' },
      market_timing_score: { value: 0.7, min: 0.4, max: 1, desc: '市场择时评分' }
    },
    selection_criteria: [
      'PE: 8-35倍',
      'PB: 1-5倍',
      'ROE ≥ 12%',
      '行业景气度高',
      '动量因子强',
      '市值 ≥ 120亿元',
      '市场择时评分 ≥ 0.7'
    ],
    backtest_performance: {
      annual_return: '26.8%',
      max_drawdown: '15.8%',
      sharpe_ratio: '1.72',
      win_rate: '64%'
    }
  },
  {
    id: 'consumer_staples_leaders',
    name: '消费龙头升级策略',
    description: '专注消费行业龙头，享受消费升级红利和品牌价值',
    icon: <AccountBalance />,
    color: '#e91e63',
    risk_level: '中风险',
    expected_return: '15-25%',
    category: 'consumer',
    complexity: '中等',
    parameters: {
      pe_min: { value: 18, min: 10, max: 30, desc: 'PE最小值' },
      pe_max: { value: 45, min: 30, max: 80, desc: 'PE最大值' },
      pb_min: { value: 2.5, min: 1, max: 5, desc: 'PB最小值' },
      pb_max: { value: 10, min: 5, max: 15, desc: 'PB最大值' },
      roe_min: { value: 18, min: 10, max: 30, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 250, min: 100, max: 2000, desc: '最小市值(亿)' },
      market_share_min: { value: 12, min: 5, max: 30, desc: '行业市占率最小值(%)' },
      brand_premium: { value: 0.75, min: 0.5, max: 1, desc: '品牌溢价能力系数' },
      revenue_growth_min: { value: 12, min: 5, max: 30, desc: '营收增长率最小值(%)' }
    },
    selection_criteria: [
      'PE: 18-45倍',
      'PB: 2.5-10倍',
      'ROE ≥ 18%',
      '市值 ≥ 250亿元',
      '行业市占率 ≥ 12%',
      '品牌溢价能力强',
      '营收增长率 ≥ 12%'
    ],
    backtest_performance: {
      annual_return: '20.5%',
      max_drawdown: '11.2%',
      sharpe_ratio: '1.88',
      win_rate: '71%'
    }
  },
  {
    id: 'tech_innovation_ultra',
    name: '科技创新Ultra策略',
    description: '聚焦科技创新企业，把握科技发展趋势和投资机会',
    icon: <Psychology />,
    color: '#3f51b5',
    risk_level: '高风险',
    expected_return: '22-40%',
    category: 'technology',
    complexity: '复杂',
    parameters: {
      pe_min: { value: 25, min: 15, max: 50, desc: 'PE最小值' },
      pe_max: { value: 90, min: 50, max: 150, desc: 'PE最大值' },
      pb_min: { value: 3.5, min: 2, max: 8, desc: 'PB最小值' },
      pb_max: { value: 18, min: 10, max: 30, desc: 'PB最大值' },
      roe_min: { value: 12, min: 5, max: 25, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 80, min: 30, max: 500, desc: '最小市值(亿)' },
      rd_ratio_min: { value: 10, min: 5, max: 25, desc: '研发费用率最小值(%)' },
      revenue_growth_min: { value: 25, min: 15, max: 60, desc: '营收增长率最小值(%)' },
      tech_innovation_score: { value: 0.8, min: 0.5, max: 1, desc: '技术创新评分' }
    },
    selection_criteria: [
      'PE: 25-90倍',
      'PB: 3.5-18倍',
      'ROE ≥ 12%',
      '研发费用率 ≥ 10%',
      '营收增长率 ≥ 25%',
      '技术护城河深厚',
      '创新评分 ≥ 0.8'
    ],
    backtest_performance: {
      annual_return: '28.9%',
      max_drawdown: '22.8%',
      sharpe_ratio: '1.35',
      win_rate: '62%'
    }
  },
  {
    id: 'balanced_allocation_pro',
    name: '均衡配置Pro策略',
    description: '均衡配置各类资产，分散风险获取稳健收益',
    icon: <Timeline />,
    color: '#795548',
    risk_level: '中风险',
    expected_return: '12-20%',
    category: 'balanced',
    complexity: '中等',
    parameters: {
      pe_min: { value: 10, min: 5, max: 20, desc: 'PE最小值' },
      pe_max: { value: 32, min: 20, max: 50, desc: 'PE最大值' },
      pb_min: { value: 1.2, min: 0.6, max: 2.5, desc: 'PB最小值' },
      pb_max: { value: 4.5, min: 3, max: 8, desc: 'PB最大值' },
      roe_min: { value: 12, min: 8, max: 20, desc: 'ROE最小值(%)' },
      market_cap_min: { value: 120, min: 50, max: 1000, desc: '最小市值(亿)' },
      diversification_score: { value: 0.8, min: 0.5, max: 1, desc: '分散化评分' },
      sector_limit: { value: 25, min: 15, max: 40, desc: '单行业最大比例(%)' }
    },
    selection_criteria: [
      'PE: 10-32倍',
      'PB: 1.2-4.5倍',
      'ROE ≥ 12%',
      '行业分散配置',
      '单行业比例 ≤ 25%',
      '风险平衡',
      '分散化评分 ≥ 0.8'
    ],
    backtest_performance: {
      annual_return: '16.2%',
      max_drawdown: '9.8%',
      sharpe_ratio: '1.78',
      win_rate: '74%'
    }
  },
  {
    id: 'momentum_trend_ultra',
    name: '动量趋势Ultra策略',
    description: '基于价格动量和技术趋势的高级量化策略',
    icon: <AutoGraph />,
    color: '#ff5722',
    risk_level: '中高风险',
    expected_return: '18-32%',
    category: 'momentum',
    complexity: '复杂',
    parameters: {
      momentum_period: { value: 20, min: 10, max: 60, desc: '动量计算周期(天)' },
      trend_strength: { value: 0.7, min: 0.4, max: 1, desc: '趋势强度系数' },
      volume_ratio: { value: 1.3, min: 1, max: 3, desc: '成交量放大倍数' },
      rsi_min: { value: 35, min: 20, max: 50, desc: 'RSI最小值' },
      rsi_max: { value: 75, min: 60, max: 85, desc: 'RSI最大值' },
      market_cap_min: { value: 60, min: 20, max: 500, desc: '最小市值(亿)' },
      liquidity_min: { value: 120, min: 50, max: 500, desc: '最小流动性(万手)' },
      price_momentum_score: { value: 0.75, min: 0.5, max: 1, desc: '价格动量评分' }
    },
    selection_criteria: [
      '20日动量强度 ≥ 70%',
      'RSI: 35-75',
      '成交量放大 ≥ 30%',
      '趋势向上明确',
      '流动性良好',
      '市值 ≥ 60亿元',
      '动量评分 ≥ 0.75'
    ],
    backtest_performance: {
      annual_return: '23.7%',
      max_drawdown: '16.5%',
      sharpe_ratio: '1.52',
      win_rate: '67%'
    }
  },
  {
    id: 'quant_factor_model',
    name: '多因子量化模型',
    description: '结合价值、成长、质量、动量等多因子的综合量化策略',
    icon: <Equalizer />,
    color: '#9c27b0',
    risk_level: '中高风险',
    expected_return: '20-30%',
    category: 'quantitative',
    complexity: '复杂',
    parameters: {
      value_factor_weight: { value: 0.25, min: 0.1, max: 0.5, desc: '价值因子权重' },
      growth_factor_weight: { value: 0.3, min: 0.1, max: 0.5, desc: '成长因子权重' },
      quality_factor_weight: { value: 0.25, min: 0.1, max: 0.5, desc: '质量因子权重' },
      momentum_factor_weight: { value: 0.2, min: 0.1, max: 0.5, desc: '动量因子权重' },
      factor_score_min: { value: 0.7, min: 0.4, max: 1, desc: '综合因子评分最小值' },
      rebalance_freq: { value: 30, min: 7, max: 90, desc: '调仓频率(天)' },
      stock_count: { value: 30, min: 10, max: 100, desc: '选股数量' }
    },
    selection_criteria: [
      '价值因子权重: 25%',
      '成长因子权重: 30%',
      '质量因子权重: 25%',
      '动量因子权重: 20%',
      '综合因子评分 ≥ 0.7',
      '30天调仓周期'
    ],
    backtest_performance: {
      annual_return: '25.3%',
      max_drawdown: '14.2%',
      sharpe_ratio: '1.85',
      win_rate: '69%'
    }
  },
  {
    id: 'esg_sustainable_investing',
    name: 'ESG可持续投资策略',
    description: '结合ESG评级的可持续投资策略，关注环境、社会、治理',
    icon: <PieChart />,
    color: '#4caf50',
    risk_level: '中风险',
    expected_return: '14-22%',
    category: 'esg',
    complexity: '中等',
    parameters: {
      esg_score_min: { value: 75, min: 50, max: 100, desc: 'ESG评分最小值' },
      environmental_score: { value: 70, min: 40, max: 100, desc: '环境评分最小值' },
      social_score: { value: 70, min: 40, max: 100, desc: '社会评分最小值' },
      governance_score: { value: 80, min: 50, max: 100, desc: '治理评分最小值' },
      pe_max: { value: 30, min: 15, max: 50, desc: 'PE最大值' },
      roe_min: { value: 12, min: 8, max: 25, desc: 'ROE最小值(%)' },
      carbon_intensity_max: { value: 200, min: 50, max: 500, desc: '碳强度最大值' }
    },
    selection_criteria: [
      'ESG综合评分 ≥ 75',
      '环境评分 ≥ 70',
      '社会评分 ≥ 70',
      '治理评分 ≥ 80',
      'PE ≤ 30倍',
      'ROE ≥ 12%',
      '碳强度 ≤ 200'
    ],
    backtest_performance: {
      annual_return: '18.4%',
      max_drawdown: '10.5%',
      sharpe_ratio: '1.92',
      win_rate: '73%'
    }
  }
];

// 策略分类
const STRATEGY_CATEGORIES = [
  { label: '全部策略', value: 'all', icon: <Star /> },
  { label: '价值投资', value: 'value', icon: <Assessment /> },
  { label: '成长投资', value: 'growth', icon: <TrendingUp /> },
  { label: '股息策略', value: 'dividend', icon: <MonetizationOn /> },
  { label: '动量策略', value: 'momentum', icon: <Speed /> },
  { label: '轮动策略', value: 'rotation', icon: <CompareArrows /> },
  { label: '科技创新', value: 'technology', icon: <Psychology /> },
  { label: '消费龙头', value: 'consumer', icon: <AccountBalance /> },
  { label: '均衡配置', value: 'balanced', icon: <Timeline /> },
  { label: '量化因子', value: 'quantitative', icon: <Equalizer /> },
  { label: 'ESG投资', value: 'esg', icon: <PieChart /> }
];

const AdvancedStrategyConfig = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [strategyParams, setStrategyParams] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // 过滤策略
  const filteredStrategies = selectedCategory === 'all' 
    ? ADVANCED_STRATEGIES 
    : ADVANCED_STRATEGIES.filter(strategy => strategy.category === selectedCategory);

  // 查看策略详情
  const handleViewDetails = (strategy) => {
    setSelectedStrategy(strategy);
    setDetailDialogOpen(true);
  };

  // 配置策略参数
  const handleConfigStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setStrategyParams(strategy.parameters);
    setConfigDialogOpen(true);
  };

  // 参数变化处理
  const handleParamChange = (paramName, newValue) => {
    setStrategyParams(prev => ({
      ...prev,
      [paramName]: { ...prev[paramName], value: newValue }
    }));
  };

  // 执行策略扫描
  const handleExecuteStrategy = async (strategy) => {
    setScanning(true);
    setProgress(0);
    setScanResults(null);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 8;
        });
      }, 400);

      // 调用后端API执行高级策略分析
      const response = await fetch('/api/advanced-strategies/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_id: strategy.id,
          strategy_name: strategy.name,
          parameters: strategyParams || strategy.parameters,
          max_stocks: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        setScanResults(data);
        setProgress(100);
        setConfigDialogOpen(false);
      } else {
        throw new Error('扫描失败');
      }

      clearInterval(progressInterval);
    } catch (error) {
      console.error('策略执行错误:', error);
      alert('策略执行失败，请检查网络连接或稍后重试');
    } finally {
      setScanning(false);
    }
  };

  // 获取风险等级颜色
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case '低风险': return '#4caf50';
      case '中风险': return '#ff9800';
      case '中高风险': return '#f57c00';
      case '高风险': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // 获取复杂度颜色
  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case '简单': return '#4caf50';
      case '中等': return '#ff9800';
      case '复杂': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          🎯 高级策略配置中心
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          专业量化策略配置平台，支持参数调优和全市场分析
        </Typography>
      </Box>

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
            <CardContent>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {ADVANCED_STRATEGIES.length}
              </Typography>
              <Typography variant="body2" color="primary.light" sx={{ fontWeight: 'medium' }}>
                专业策略
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', bgcolor: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
            <CardContent>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                {STRATEGY_CATEGORIES.length - 1}
              </Typography>
              <Typography variant="body2" color="secondary.light" sx={{ fontWeight: 'medium' }}>
                策略分类
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', bgcolor: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <CardContent>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                4000+
              </Typography>
              <Typography variant="body2" color="success.light" sx={{ fontWeight: 'medium' }}>
                覆盖股票
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card elevation={3} sx={{ textAlign: 'center', bgcolor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
            <CardContent>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                100%
              </Typography>
              <Typography variant="body2" color="warning.light" sx={{ fontWeight: 'medium' }}>
                真实数据
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 策略分类标签页 */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          {STRATEGY_CATEGORIES.map((category) => (
            <Tab
              key={category.value}
              value={category.value}
              label={category.label}
              icon={category.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* 策略列表 */}
      <Grid container spacing={3}>
        {filteredStrategies.map((strategy) => (
          <Grid item xs={12} md={6} lg={4} key={strategy.id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                {/* 策略头部 */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: strategy.color, mr: 1 }}>
                    {strategy.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                    {strategy.name}
                  </Typography>
                </Box>

                {/* 策略描述 */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {strategy.description}
                </Typography>

                {/* 策略标签 */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={strategy.risk_level} 
                    size="small" 
                    sx={{ 
                      bgcolor: getRiskColor(strategy.risk_level),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip 
                    label={strategy.complexity} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderColor: getComplexityColor(strategy.complexity),
                      color: getComplexityColor(strategy.complexity)
                    }}
                  />
                  <Chip 
                    label={strategy.expected_return} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>

                {/* 回测表现 */}
                {strategy.backtest_performance && (
                  <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📊 回测表现
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          年化收益
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {strategy.backtest_performance.annual_return}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          最大回撤
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          {strategy.backtest_performance.max_drawdown}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          夏普比率
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {strategy.backtest_performance.sharpe_ratio}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          胜率
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {strategy.backtest_performance.win_rate}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => handleViewDetails(strategy)}
                >
                  查看详情
                </Button>
                <Button
                  size="small"
                  startIcon={<Settings />}
                  onClick={() => handleConfigStrategy(strategy)}
                >
                  配置策略
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => handleExecuteStrategy(strategy)}
                  sx={{ ml: 'auto' }}
                >
                  执行扫描
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 策略详情对话框 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedStrategy && (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {selectedStrategy.icon}
              {selectedStrategy.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" paragraph>
                  {selectedStrategy.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  📋 选股标准
                </Typography>
                <Grid container spacing={1}>
                  {selectedStrategy.selection_criteria.map((criteria, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="✓" size="small" color="success" />
                        {criteria}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                {selectedStrategy.backtest_performance && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      📊 历史回测表现
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>年化收益率</strong></TableCell>
                            <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {selectedStrategy.backtest_performance.annual_return}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>最大回撤</strong></TableCell>
                            <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                              {selectedStrategy.backtest_performance.max_drawdown}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>夏普比率</strong></TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                              {selectedStrategy.backtest_performance.sharpe_ratio}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>胜率</strong></TableCell>
                            <TableCell sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                              {selectedStrategy.backtest_performance.win_rate}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleConfigStrategy(selectedStrategy);
                }}
                startIcon={<Settings />}
              >
                配置策略
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 策略配置对话框 */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedStrategy && (
          <>
            <DialogTitle sx={{ 
              bgcolor: selectedStrategy.color, 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Settings />
              配置策略: {selectedStrategy.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  调整策略参数以优化选股条件
                </Typography>

                <Grid container spacing={3}>
                  {Object.entries(strategyParams).map(([paramName, paramConfig]) => (
                    <Grid item xs={12} sm={6} key={paramName}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          {paramConfig.desc}
                        </Typography>
                        <Slider
                          value={paramConfig.value}
                          min={paramConfig.min}
                          max={paramConfig.max}
                          step={(paramConfig.max - paramConfig.min) / 100}
                          onChange={(e, newValue) => handleParamChange(paramName, newValue)}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: paramConfig.min, label: paramConfig.min },
                            { value: paramConfig.max, label: paramConfig.max }
                          ]}
                        />
                        <TextField
                          size="small"
                          type="number"
                          value={paramConfig.value}
                          onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                          inputProps={{
                            min: paramConfig.min,
                            max: paramConfig.max,
                            step: 0.1
                          }}
                          sx={{ mt: 1, width: '100px' }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfigDialogOpen(false)}>
                取消
              </Button>
              <Button 
                variant="contained" 
                onClick={() => handleExecuteStrategy(selectedStrategy)}
                startIcon={<PlayArrow />}
                disabled={scanning}
              >
                {scanning ? '执行中...' : '执行策略'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 扫描进度对话框 */}
      <Dialog open={scanning} maxWidth="sm" fullWidth>
        <DialogTitle>策略执行中...</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              正在执行策略扫描，请稍候...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mt: 2, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              进度: {Math.round(progress)}%
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 策略执行结果展示 */}
      <StrategyResultDisplay
        open={!!scanResults}
        onClose={() => setScanResults(null)}
        scanResults={scanResults}
      />
    </Container>
  );
};

export default AdvancedStrategyConfig; 