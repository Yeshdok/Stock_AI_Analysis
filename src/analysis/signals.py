"""
交易信号生成模块
提供各种交易信号的生成逻辑
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from .indicators import TechnicalIndicators

class SignalGenerator:
    """交易信号生成类"""
    
    def __init__(self, data: pd.DataFrame, indicators: Dict):
        """
        初始化信号生成器
        :param data: 股票数据
        :param indicators: 技术指标数据
        """
        self.data = data
        self.indicators = indicators
        self.signals = {}
    
    def generate_macd_signals(self) -> Dict:
        """生成MACD交易信号"""
        if 'macd' not in self.indicators:
            return {}
        
        macd_data = self.indicators['macd']
        macd_line = macd_data['macd']
        signal_line = macd_data['signal']
        histogram = macd_data['histogram']
        
        signals = []
        latest_macd = macd_line.iloc[-1]
        latest_signal = signal_line.iloc[-1]
        latest_histogram = histogram.iloc[-1]
        
        # 金叉/死叉判断
        if len(macd_line) >= 2:
            prev_macd = macd_line.iloc[-2]
            prev_signal = signal_line.iloc[-2]
            
            # 金叉：MACD线从下向上穿越信号线
            if prev_macd < prev_signal and latest_macd > latest_signal:
                signals.append("MACD金叉，买入信号")
            # 死叉：MACD线从上向下穿越信号线
            elif prev_macd > prev_signal and latest_macd < latest_signal:
                signals.append("MACD死叉，卖出信号")
        
        # MACD趋势判断
        if latest_macd > 0:
            if latest_macd > latest_signal:
                signals.append("MACD在零轴上方，且MACD线在信号线上方，多头趋势")
            else:
                signals.append("MACD在零轴上方，但MACD线在信号线下方，可能转弱")
        else:
            if latest_macd < latest_signal:
                signals.append("MACD在零轴下方，且MACD线在信号线下方，空头趋势")
            else:
                signals.append("MACD在零轴下方，但MACD线在信号线上方，可能转强")
        
        # 柱状图趋势
        if len(histogram) >= 2:
            prev_hist = histogram.iloc[-2]
            if latest_histogram > prev_hist:
                signals.append("MACD柱状图上升，动能增强")
            else:
                signals.append("MACD柱状图下降，动能减弱")
        
        return {
            'signals': signals,
            'latest_values': {
                'macd': latest_macd,
                'signal': latest_signal,
                'histogram': latest_histogram
            }
        }
    
    def generate_rsi_signals(self) -> Dict:
        """生成RSI交易信号"""
        if 'rsi' not in self.indicators:
            return {}
        
        rsi = self.indicators['rsi']
        latest_rsi = rsi.iloc[-1]
        
        signals = []
        
        # 超买超卖判断
        if latest_rsi > 70:
            signals.append("RSI超买，可能回调")
        elif latest_rsi < 30:
            signals.append("RSI超卖，可能反弹")
        elif latest_rsi > 50:
            signals.append("RSI在强势区，多头占优")
        else:
            signals.append("RSI在弱势区，空头占优")
        
        # RSI趋势判断
        if len(rsi) >= 2:
            prev_rsi = rsi.iloc[-2]
            if latest_rsi > prev_rsi:
                signals.append("RSI上升，动能增强")
            else:
                signals.append("RSI下降，动能减弱")
        
        return {
            'signals': signals,
            'latest_value': latest_rsi
        }
    
    def generate_bollinger_signals(self) -> Dict:
        """生成布林带交易信号"""
        if 'bollinger' not in self.indicators:
            return {}
        
        bb_data = self.indicators['bollinger']
        upper = bb_data['upper']
        middle = bb_data['middle']
        lower = bb_data['lower']
        
        latest_close = self.data['Close'].iloc[-1]
        latest_upper = upper.iloc[-1]
        latest_middle = middle.iloc[-1]
        latest_lower = lower.iloc[-1]
        
        signals = []
        
        # 价格位置判断
        if latest_close > latest_upper:
            signals.append("价格突破布林带上轨，可能回调")
        elif latest_close < latest_lower:
            signals.append("价格跌破布林带下轨，可能反弹")
        elif latest_close > latest_middle:
            signals.append("价格在布林带中轨上方，偏强")
        else:
            signals.append("价格在布林带中轨下方，偏弱")
        
        # 布林带宽度判断
        bb_width = (latest_upper - latest_lower) / latest_middle
        if bb_width > 0.1:  # 布林带较宽
            signals.append("布林带较宽，波动较大")
        else:
            signals.append("布林带较窄，波动较小")
        
        return {
            'signals': signals,
            'latest_values': {
                'upper': latest_upper,
                'middle': latest_middle,
                'lower': latest_lower,
                'position': latest_close
            }
        }
    
    def generate_ma_signals(self) -> Dict:
        """生成移动平均线交易信号"""
        if 'ma' not in self.indicators:
            return {}
        
        ma_data = self.indicators['ma']
        latest_close = self.data['Close'].iloc[-1]
        
        signals = []
        ma_values = {}
        
        # 检查各均线
        for period, ma_series in ma_data.items():
            latest_ma = ma_series.iloc[-1]
            ma_values[f'MA{period}'] = latest_ma
            
            if latest_close > latest_ma:
                signals.append(f"价格在MA{period}上方，支撑位{latest_ma:.2f}")
            else:
                signals.append(f"价格在MA{period}下方，阻力位{latest_ma:.2f}")
        
        # 均线排列判断
        if len(ma_data) >= 3:
            ma5 = ma_data[5].iloc[-1] if 5 in ma_data else 0
            ma10 = ma_data[10].iloc[-1] if 10 in ma_data else 0
            ma20 = ma_data[20].iloc[-1] if 20 in ma_data else 0
            
            if ma5 > ma10 > ma20:
                signals.append("均线多头排列，趋势向上")
            elif ma5 < ma10 < ma20:
                signals.append("均线空头排列，趋势向下")
            else:
                signals.append("均线混乱排列，趋势不明")
        
        return {
            'signals': signals,
            'latest_values': ma_values
        }
    
    def generate_volume_signals(self) -> Dict:
        """生成成交量交易信号"""
        if 'volume' not in self.indicators:
            return {}
        
        volume_data = self.indicators['volume']
        latest_volume = self.data['Volume'].iloc[-1]
        latest_close = self.data['Close'].iloc[-1]
        
        signals = []
        
        # 量比判断
        if 'volume_ratio' in volume_data:
            latest_ratio = volume_data['volume_ratio'].iloc[-1]
            if latest_ratio > 2:
                signals.append("成交量放大，量比大于2")
            elif latest_ratio > 1.5:
                signals.append("成交量较大，量比大于1.5")
            elif latest_ratio < 0.5:
                signals.append("成交量萎缩，量比小于0.5")
            else:
                signals.append("成交量正常")
        
        # 价量关系判断
        if len(self.data) >= 2:
            prev_close = self.data['Close'].iloc[-2]
            prev_volume = self.data['Volume'].iloc[-2]
            
            price_up = latest_close > prev_close
            volume_up = latest_volume > prev_volume
            
            if price_up and volume_up:
                signals.append("价量配合，上涨有力")
            elif price_up and not volume_up:
                signals.append("价升量缩，上涨乏力")
            elif not price_up and volume_up:
                signals.append("价跌量增，下跌有力")
            else:
                signals.append("价跌量缩，下跌乏力")
        
        return {
            'signals': signals,
            'latest_values': {
                'volume': latest_volume,
                'ratio': volume_data.get('volume_ratio', pd.Series()).iloc[-1] if 'volume_ratio' in volume_data else 1.0
            }
        }
    
    def generate_chip_signals(self) -> Dict:
        """生成筹码分布交易信号"""
        if 'chip_distribution' not in self.indicators:
            return {}
        
        chip_data = self.indicators['chip_distribution']
        latest_close = self.data['Close'].iloc[-1]
        
        signals = []
        
        main_peak_price = chip_data['main_peak_price']
        avg_price = chip_data['avg_price']
        pressure_level = chip_data['pressure_level']
        support_level = chip_data['support_level']
        concentration = chip_data['concentration']
        
        # 价格位置判断
        if latest_close > main_peak_price:
            signals.append(f"价格突破主要筹码峰{main_peak_price:.2f}，上方阻力较小")
        elif latest_close < main_peak_price:
            signals.append(f"价格在主要筹码峰{main_peak_price:.2f}下方，上方阻力较大")
        
        if latest_close > avg_price:
            signals.append(f"价格在平均成本{avg_price:.2f}上方，获利盘较多")
        else:
            signals.append(f"价格在平均成本{avg_price:.2f}下方，套牢盘较多")
        
        # 压力支撑判断
        if latest_close > pressure_level:
            signals.append(f"价格突破压力位{pressure_level:.2f}，可能继续上涨")
        elif latest_close < support_level:
            signals.append(f"价格跌破支撑位{support_level:.2f}，可能继续下跌")
        
        # 筹码集中度判断
        if concentration > 0.3:
            signals.append("筹码高度集中，可能形成重要支撑或阻力")
        elif concentration > 0.1:
            signals.append("筹码集中度正常")
        else:
            signals.append("筹码分散，支撑阻力较弱")
        
        return {
            'signals': signals,
            'latest_values': {
                'main_peak_price': main_peak_price,
                'avg_price': avg_price,
                'pressure_level': pressure_level,
                'support_level': support_level,
                'concentration': concentration
            }
        }
    
    def generate_pe_signals(self) -> Dict:
        """生成市盈率交易信号"""
        if 'pe_analysis' not in self.indicators:
            return {}
        
        pe_data = self.indicators['pe_analysis']
        current_pe = pe_data.get('current_pe')
        
        signals = []
        
        if current_pe is not None:
            # 市盈率水平判断
            if current_pe < 0:
                signals.append("市盈率为负，公司亏损，投资风险较大")
            elif current_pe < 10:
                signals.append("市盈率较低，可能被低估，具有投资价值")
            elif current_pe < 15:
                signals.append("市盈率偏低，估值相对合理")
            elif current_pe < 20:
                signals.append("市盈率适中，估值合理")
            elif current_pe < 30:
                signals.append("市盈率偏高，注意估值风险")
            elif current_pe < 50:
                signals.append("市盈率过高，存在泡沫风险")
            else:
                signals.append("市盈率极高，泡沫严重，建议谨慎")
            
            # 与行业对比（如果有行业数据）
            industry_pe = pe_data.get('industry_pe')
            if industry_pe and isinstance(industry_pe, (int, float)):
                if current_pe < industry_pe * 0.8:
                    signals.append("市盈率低于行业平均水平，相对低估")
                elif current_pe > industry_pe * 1.2:
                    signals.append("市盈率高于行业平均水平，相对高估")
                else:
                    signals.append("市盈率与行业平均水平相当")
        
        return {
            'signals': signals,
            'latest_values': {
                'current_pe': current_pe,
                'pe_data': pe_data.get('pe_data', {})
            }
        }
    
    def generate_fundamental_signals(self) -> Dict:
        """生成基本面交易信号"""
        if 'fundamental' not in self.indicators:
            return {}
        
        fundamental_data = self.indicators['fundamental']
        signals = []
        
        # 市净率分析
        if '市净率' in fundamental_data:
            pb_value = fundamental_data['市净率']
            if isinstance(pb_value, (int, float)):
                if pb_value < 1:
                    signals.append("市净率小于1，可能被低估")
                elif pb_value < 2:
                    signals.append("市净率适中，估值合理")
                else:
                    signals.append("市净率偏高，注意风险")
        
        # 净资产收益率分析
        if '净资产收益率' in fundamental_data:
            roe_value = fundamental_data['净资产收益率']
            if isinstance(roe_value, (int, float)):
                if roe_value > 15:
                    signals.append("净资产收益率较高，公司盈利能力较强")
                elif roe_value > 10:
                    signals.append("净资产收益率良好")
                else:
                    signals.append("净资产收益率偏低，盈利能力有待提升")
        
        # 毛利率分析
        if '毛利率' in fundamental_data:
            gross_margin = fundamental_data['毛利率']
            if isinstance(gross_margin, (int, float)):
                if gross_margin > 30:
                    signals.append("毛利率较高，产品竞争力强")
                elif gross_margin > 20:
                    signals.append("毛利率良好")
                else:
                    signals.append("毛利率偏低，成本控制需改善")
        
        return {
            'signals': signals,
            'latest_values': fundamental_data
        }
    
    def generate_comprehensive_signals(self) -> Dict:
        """生成综合交易信号"""
        all_signals = {
            'macd': self.generate_macd_signals(),
            'rsi': self.generate_rsi_signals(),
            'bollinger': self.generate_bollinger_signals(),
            'ma': self.generate_ma_signals(),
            'volume': self.generate_volume_signals(),
            'chip': self.generate_chip_signals(),
            'pe': self.generate_pe_signals(),
            'fundamental': self.generate_fundamental_signals()
        }
        
        # 统计信号类型
        buy_signals = []
        sell_signals = []
        neutral_signals = []
        
        for indicator, signal_data in all_signals.items():
            if 'signals' in signal_data:
                for signal in signal_data['signals']:
                    if any(keyword in signal for keyword in ['买入', '金叉', '反弹', '上涨', '多头']):
                        buy_signals.append(signal)
                    elif any(keyword in signal for keyword in ['卖出', '死叉', '回调', '下跌', '空头']):
                        sell_signals.append(signal)
                    else:
                        neutral_signals.append(signal)
        
        # 计算信号强度
        signal_strength = len(buy_signals) - len(sell_signals)
        
        # 确定主要信号类型
        if signal_strength > 2:
            signal_type = "强烈买入"
        elif signal_strength > 0:
            signal_type = "买入"
        elif signal_strength < -2:
            signal_type = "强烈卖出"
        elif signal_strength < 0:
            signal_type = "卖出"
        else:
            signal_type = "观望"
        
        return {
            'signal_type': signal_type,
            'signal_strength': abs(signal_strength),
            'buy_signals': buy_signals,
            'sell_signals': sell_signals,
            'neutral_signals': neutral_signals,
            'indicators': all_signals
        } 