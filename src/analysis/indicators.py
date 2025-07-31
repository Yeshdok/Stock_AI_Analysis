"""
技术指标计算模块
提供各种技术指标的计算方法
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
import os

def get_tushare_token():
    """从配置文件读取tushare token"""
    try:
        # 获取项目根目录
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        token_file = os.path.join(project_root, 'config', 'tushare_token.txt')
        
        with open(token_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                line = line.strip()
                if line and not line.startswith('#') and line != 'your_tushare_token_here':
                    return line
        print("警告: 未找到有效的tushare token，请在config/tushare_token.txt中填写")
        return None
    except Exception as e:
        print(f"无法读取tushare token: {e}")
        return None

class TechnicalIndicators:
    """技术指标计算类"""
    
    @staticmethod
    def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
        """
        计算RSI指标
        :param prices: 价格序列
        :param period: 计算周期
        :return: RSI值序列
        """
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    @staticmethod
    def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: float = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """
        计算布林带
        :param prices: 价格序列
        :param period: 计算周期
        :param std_dev: 标准差倍数
        :return: (上轨, 中轨, 下轨)
        """
        middle = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        return upper, middle, lower
    
    @staticmethod
    def calculate_moving_averages(prices: pd.Series, periods: List[int] = [5, 10, 20]) -> Dict[int, pd.Series]:
        """
        计算移动平均线
        :param prices: 价格序列
        :param periods: 计算周期列表
        :return: 各周期移动平均线字典
        """
        ma_dict = {}
        for period in periods:
            ma_dict[period] = prices.rolling(window=period).mean()
        return ma_dict
    
    @staticmethod
    def calculate_macd(prices: pd.Series, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9) -> Dict[str, pd.Series]:
        """
        计算MACD指标
        :param prices: 价格序列
        :param fast_period: 快线周期
        :param slow_period: 慢线周期
        :param signal_period: 信号线周期
        :return: MACD指标字典
        """
        ema_fast = prices.ewm(span=fast_period).mean()
        ema_slow = prices.ewm(span=slow_period).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal_period).mean()
        histogram = macd_line - signal_line
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    @staticmethod
    def calculate_stochastic(high: pd.Series, low: pd.Series, close: pd.Series, 
                           k_period: int = 14, d_period: int = 3) -> Tuple[pd.Series, pd.Series]:
        """
        计算随机指标
        :param high: 最高价序列
        :param low: 最低价序列
        :param close: 收盘价序列
        :param k_period: K值周期
        :param d_period: D值周期
        :return: (K值, D值)
        """
        lowest_low = low.rolling(window=k_period).min()
        highest_high = high.rolling(window=k_period).max()
        k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
        d_percent = k_percent.rolling(window=d_period).mean()
        return k_percent, d_percent
    
    @staticmethod
    def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
        """
        计算平均真实波幅(ATR)
        :param high: 最高价序列
        :low: 最低价序列
        :close: 收盘价序列
        :period: 计算周期
        :return: ATR值序列
        """
        tr1 = high - low
        tr2 = abs(high - close.shift())
        tr3 = abs(low - close.shift())
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        return atr
    
    @staticmethod
    def calculate_volume_indicators(volume: pd.Series, close: pd.Series, period: int = 20) -> Dict[str, pd.Series]:
        """
        计算成交量指标
        :param volume: 成交量序列
        :param close: 收盘价序列
        :param period: 计算周期
        :return: 成交量指标字典
        """
        # 成交量移动平均
        volume_ma = volume.rolling(window=period).mean()
        
        # 量比
        volume_ratio = volume / volume_ma
        
        # 价量关系
        price_change = close.pct_change()
        volume_change = volume.pct_change()
        
        # 价量配合度
        price_volume_correlation = pd.Series(index=close.index)
        for i in range(period, len(close)):
            price_volume_correlation.iloc[i] = np.corrcoef(
                price_change.iloc[i-period:i], 
                volume_change.iloc[i-period:i]
            )[0, 1]
        
        return {
            'volume_ma': volume_ma,
            'volume_ratio': volume_ratio,
            'price_volume_correlation': price_volume_correlation
        }
    
    @staticmethod
    def calculate_chip_distribution(close: pd.Series, volume: pd.Series, 
                                  price_range: int = 100) -> Dict[str, any]:
        """
        计算筹码分布
        :param close: 收盘价序列
        :param volume: 成交量序列
        :param price_range: 价格区间数量
        :return: 筹码分布信息
        """
        if len(close) < 20:
            return {
                'main_peak_price': close.iloc[-1],
                'avg_price': close.mean(),
                'pressure_level': close.max(),
                'support_level': close.min(),
                'concentration': 0.5,
                'distribution_summary': f"主力筹码集中在{close.iloc[-1]:.2f}元附近",
                'chip_concentration': "50.0%",
                'price_range': f"{close.min():.2f} - {close.max():.2f}元",
                'analysis': [
                    f"📊 当前价格: {close.iloc[-1]:.2f}元",
                    f"💰 平均成本: {close.mean():.2f}元",
                    f"📈 价格区间: {close.min():.2f} - {close.max():.2f}元",
                    "📋 数据量较少，建议增加分析周期",
                    "💡 筹码分布需要更多历史数据支撑"
                ]
            }
        
        # 计算价格区间
        min_price = close.min()
        max_price = close.max()
        price_step = (max_price - min_price) / price_range if max_price > min_price else 1
        
        # 初始化筹码分布数组
        chip_distribution = np.zeros(price_range)
        
        # 计算每个交易日的筹码分布，考虑时间衰减
        decay_factor = 0.97  # 时间衰减因子
        total_days = len(close)
        
        for i in range(len(close)):
            price = close.iloc[i]
            vol = volume.iloc[i]
            
            # 时间衰减权重（越新的数据权重越大）
            days_ago = total_days - i - 1
            weight = decay_factor ** days_ago
            
            # 将成交量分配到价格区间
            if price_step > 0:
                price_index = int((price - min_price) / price_step)
                price_index = max(0, min(price_index, price_range - 1))
                chip_distribution[price_index] += vol * weight
        
        # 找到主要筹码峰
        main_peak_index = np.argmax(chip_distribution)
        main_peak_price = min_price + main_peak_index * price_step
        
        # 计算加权平均价格
        price_levels = np.arange(price_range) * price_step + min_price
        total_weighted_chips = np.sum(chip_distribution)
        if total_weighted_chips > 0:
            weighted_avg_price = np.sum(price_levels * chip_distribution) / total_weighted_chips
        else:
            weighted_avg_price = close.mean()
        
        # 计算筹码集中度
        if total_weighted_chips > 0:
            concentration = np.max(chip_distribution) / total_weighted_chips
        else:
            concentration = 0
        
        # 找到压力位和支撑位（基于筹码密集区）
        sorted_indices = np.argsort(chip_distribution)[::-1]
        top_20_percent = sorted_indices[:max(1, int(price_range * 0.2))]
        pressure_level = min_price + np.max(top_20_percent) * price_step
        support_level = min_price + np.min(top_20_percent) * price_step
        
        # 当前价格分析
        current_price = close.iloc[-1]
        
        # 生成详细分析
        analysis = []
        analysis.append(f"📊 当前价格: {current_price:.2f}元")
        analysis.append(f"💰 主力成本: {main_peak_price:.2f}元")
        analysis.append(f"📈 平均成本: {weighted_avg_price:.2f}元")
        analysis.append(f"🔴 压力位: {pressure_level:.2f}元")
        analysis.append(f"🟢 支撑位: {support_level:.2f}元")
        analysis.append(f"📊 筹码集中度: {concentration:.1%}")
        
        # 价格位置分析
        if current_price > main_peak_price:
            price_position = "主力成本上方"
            if current_price > pressure_level:
                analysis.append("✅ 价格突破压力位，上涨动能较强")
            else:
                analysis.append("⚠️ 价格接近压力位，注意回调风险")
        elif current_price < main_peak_price:
            price_position = "主力成本下方"
            if current_price < support_level:
                analysis.append("🚨 价格跌破支撑位，下跌压力较大")
            else:
                analysis.append("💡 价格接近支撑位，可能企稳反弹")
        else:
            price_position = "主力成本附近"
            analysis.append("📍 价格在主力成本附近，关注方向选择")
        
        # 筹码集中度分析
        if concentration > 0.4:
            concentration_desc = "高度集中"
            analysis.append("🎯 筹码高度集中，主力控盘明显")
        elif concentration > 0.25:
            concentration_desc = "较为集中"
            analysis.append("📊 筹码较为集中，有一定控盘迹象")
        elif concentration > 0.15:
            concentration_desc = "分布均匀"
            analysis.append("⚖️ 筹码分布相对均匀，换手较为充分")
        else:
            concentration_desc = "高度分散"
            analysis.append("🌊 筹码高度分散，市场参与者众多")
        
        # 获利盘分析
        if current_price > weighted_avg_price:
            profit_ratio = ((current_price - weighted_avg_price) / weighted_avg_price) * 100
            analysis.append(f"💹 获利盘比例较高，平均盈利{profit_ratio:.1f}%")
        else:
            loss_ratio = ((weighted_avg_price - current_price) / weighted_avg_price) * 100
            analysis.append(f"📉 套牢盘较多，平均亏损{loss_ratio:.1f}%")
        
        return {
            'main_peak_price': float(main_peak_price),
            'avg_price': float(weighted_avg_price),
            'pressure_level': float(pressure_level),
            'support_level': float(support_level),
            'concentration': float(concentration),
            'distribution_summary': f"主力筹码集中在{main_peak_price:.2f}元附近，当前价格{price_position}",
            'chip_concentration': f"{concentration:.1%}",
            'price_range': f"{support_level:.2f} - {pressure_level:.2f}元",
            'concentration_desc': concentration_desc,
            'price_position': price_position,
            'current_price': float(current_price),
            'analysis': analysis,
            'technical_summary': {
                'trend': '上涨' if current_price > weighted_avg_price else '下跌',
                'strength': '强' if concentration > 0.3 else '中等' if concentration > 0.15 else '弱',
                'risk_level': '高' if current_price < support_level or current_price > pressure_level * 1.1 else '中等'
            }
        }
    
    @staticmethod
    def calculate_pe_analysis(stock_code: str) -> Dict[str, any]:
        """
        计算市盈率分析，优先用tushare，获取不到再用akshare
        :param stock_code: 股票代码
        :return: 市盈率分析信息
        """
        # 初始化默认结果
        pe_analysis = {
            'current_pe': None,
            'pe_data': {},
            'industry_pe': None,
            'analysis': []
        }
        
        # 1. 尝试akshare获取实时数据
        try:
            import akshare as ak
            
            # 获取当前股价
            stock_data = ak.stock_zh_a_hist(symbol=stock_code, period="daily", adjust="qfq")
            current_price = None
            if not stock_data.empty:
                current_price = float(stock_data.iloc[-1]['收盘'])
                pe_analysis['pe_data']['current_price'] = current_price
            
            # 方法1: 个股信息
            try:
                stock_info = ak.stock_individual_info_em(symbol=stock_code)
                if not stock_info.empty:
                    # 查找市盈率
                    pe_rows = stock_info[stock_info['item'].str.contains('市盈率', na=False)]
                    if not pe_rows.empty:
                        for _, row in pe_rows.iterrows():
                            value = row['value']
                            if isinstance(value, str):
                                value_clean = value.replace('倍', '').replace(',', '').strip()
                                try:
                                    pe_value = float(value_clean)
                                    pe_analysis['current_pe'] = pe_value
                                    pe_analysis['pe_data']['pe'] = pe_value
                                    break
                                except ValueError:
                                    continue
                    
                    # 查找市净率
                    pb_rows = stock_info[stock_info['item'].str.contains('市净率', na=False)]
                    if not pb_rows.empty:
                        for _, row in pb_rows.iterrows():
                            value = row['value']
                            if isinstance(value, str):
                                try:
                                    pb_value = float(value.replace('倍', '').replace(',', '').strip())
                                    pe_analysis['pe_data']['pb'] = pb_value
                                    break
                                except ValueError:
                                    continue
                    
                    # 查找每股收益
                    eps_keys = ['每股收益', 'EPS', '基本每股收益']
                    for eps_key in eps_keys:
                        eps_rows = stock_info[stock_info['item'].str.contains(eps_key, na=False)]
                        if not eps_rows.empty:
                            try:
                                eps_value = float(str(eps_rows.iloc[0]['value']).replace('元', '').replace(',', '').strip())
                                pe_analysis['pe_data']['eps'] = eps_value
                                break
                            except ValueError:
                                continue
                                
            except Exception as e:
                print(f"获取个股信息失败: {e}")
            
            # 方法2: 财务分析指标
            try:
                df_finance = ak.stock_financial_analysis_indicator(symbol=stock_code)
                if df_finance is not None and len(df_finance) > 0:
                    latest_data = df_finance.iloc[-1]
                    
                    # 获取ROE
                    roe = latest_data.get('净资产收益率(%)', None)
                    if roe is not None:
                        pe_analysis['pe_data']['roe'] = float(roe)
                    
                    # 获取每股收益
                    eps = latest_data.get('摊薄每股收益(元)', None)
                    if eps is not None and current_price is not None:
                        eps_val = float(eps)
                        pe_analysis['pe_data']['eps'] = eps_val
                        if eps_val > 0:
                            calculated_pe = current_price / eps_val
                            if pe_analysis['current_pe'] is None:
                                pe_analysis['current_pe'] = calculated_pe
                                pe_analysis['pe_data']['pe'] = calculated_pe
                                
            except Exception as e:
                print(f"获取财务分析指标失败: {e}")
                
        except Exception as e:
            print(f"akshare数据获取失败: {e}")
        
        # 2. 尝试tushare作为备用
        try:
            import tushare as ts
            token = get_tushare_token()
            if token and pe_analysis['current_pe'] is None:
                ts.set_token(token)
                pro = ts.pro_api()
                ts_code = f"{stock_code}.SH" if stock_code.startswith('6') else f"{stock_code}.SZ"
                df = pro.daily_basic(ts_code=ts_code, fields='ts_code,trade_date,pe,pb,ps,roe')
                if df is not None and len(df) > 0:
                    latest = df.sort_values('trade_date').iloc[-1]
                    pe = latest.get('pe', None)
                    if pe is not None and not pd.isna(pe):
                        pe_analysis['current_pe'] = float(pe)
                        pe_analysis['pe_data']['pe'] = float(pe)
                    
                    pb = latest.get('pb', None)
                    if pb is not None and not pd.isna(pb):
                        pe_analysis['pe_data']['pb'] = float(pb)
                    
                    roe = latest.get('roe', None)
                    if roe is not None and not pd.isna(roe):
                        pe_analysis['pe_data']['roe'] = float(roe)
                        
        except Exception as e:
            print(f"tushare数据获取失败: {e}")
        
        # 3. 生成分析内容
        if pe_analysis['current_pe'] is not None:
            pe = pe_analysis['current_pe']
            if pe < 0:
                pe_analysis['analysis'].append("⚠️ 市盈率为负，公司当前亏损")
                pe_analysis['analysis'].append("💡 建议关注公司转亏为盈的可能性")
            elif pe < 10:
                pe_analysis['analysis'].append("✅ 市盈率较低，可能被市场低估")
                pe_analysis['analysis'].append("💡 相对安全的投资机会")
            elif pe < 20:
                pe_analysis['analysis'].append("✅ 市盈率适中，估值相对合理")
                pe_analysis['analysis'].append("💡 符合价值投资标准")
            elif pe < 30:
                pe_analysis['analysis'].append("⚠️ 市盈率偏高，需注意估值风险")
                pe_analysis['analysis'].append("💡 建议关注业绩增长支撑")
            else:
                pe_analysis['analysis'].append("🚨 市盈率过高，存在估值泡沫风险")
                pe_analysis['analysis'].append("💡 谨慎投资，关注基本面变化")
            pe_analysis['analysis'].append(f"📊 当前市盈率: {pe:.2f}倍")
        else:
            pe_analysis['analysis'].append("📋 当前无法获取准确的市盈率数据")
            pe_analysis['analysis'].append("💡 建议查看公司最新财报")
        
        # 添加其他指标分析
        if 'pb' in pe_analysis['pe_data']:
            pb = pe_analysis['pe_data']['pb']
            pe_analysis['analysis'].append(f"📊 市净率: {pb:.2f}倍")
            if pb < 1:
                pe_analysis['analysis'].append("✅ 市净率小于1，资产价值相对安全")
            elif pb > 3:
                pe_analysis['analysis'].append("⚠️ 市净率较高，关注资产质量")
        
        if 'roe' in pe_analysis['pe_data']:
            roe = pe_analysis['pe_data']['roe']
            pe_analysis['analysis'].append(f"📊 净资产收益率: {roe:.2f}%")
            if roe > 15:
                pe_analysis['analysis'].append("✅ ROE较高，盈利能力强")
            elif roe < 5:
                pe_analysis['analysis'].append("⚠️ ROE较低，盈利能力有限")
        
        if 'current_price' in pe_analysis['pe_data']:
            price = pe_analysis['pe_data']['current_price']
            pe_analysis['analysis'].append(f"💰 当前股价: {price:.2f}元")
        
        if 'eps' in pe_analysis['pe_data']:
            eps = pe_analysis['pe_data']['eps']
            pe_analysis['analysis'].append(f"📊 每股收益: {eps:.3f}元")
        
        # 确保总是有分析内容
        if not pe_analysis['analysis']:
            pe_analysis['analysis'] = [
                "📋 数据获取中，请稍后刷新",
                "💡 建议关注公司基本面信息",
                "📈 可参考同行业平均PE水平",
                "⚠️ 投资需谨慎，注意风险控制"
            ]
        
        return pe_analysis

    @staticmethod
    def calculate_fundamental_indicators(stock_code: str) -> Dict[str, any]:
        """
        计算基本面指标，优先用akshare，获取不到再用tushare
        :param stock_code: 股票代码
        :return: 基本面指标信息
        """
        result = {
            'indicators': {},
            'analysis': [],
            'rating': '待评估',
            'risk_level': '中等',
            'investment_advice': []
        }
        
        # 1. AkShare 免费接口优先
        try:
            import akshare as ak
            
            # 方法1: 个股信息
            try:
                stock_info = ak.stock_individual_info_em(symbol=stock_code)
                if stock_info is not None and not stock_info.empty:
                    indicator_map = {
                        '市盈率': 'PE市盈率',
                        '市净率': 'PB市净率', 
                        '市销率': 'PS市销率',
                        '净资产收益率': 'ROE净资产收益率',
                        '毛利率': '毛利率',
                        '总股本': '总股本',
                        '流通股': '流通股本',
                        '每股收益': 'EPS每股收益',
                        '总市值': '总市值',
                        '流通市值': '流通市值'
                    }
                    
                    for search_key, display_key in indicator_map.items():
                        rows = stock_info[stock_info['item'].str.contains(search_key, na=False)]
                        if not rows.empty:
                            val_raw = rows.iloc[0]['value']
                            if isinstance(val_raw, str):
                                # 清洗数据
                                clean = val_raw.replace('%', '').replace('倍', '').replace(',', '').replace('元', '').replace('万股', '').replace('股', '').replace('亿', '').strip()
                                try:
                                    val_num = float(clean)
                                    result['indicators'][display_key] = val_num
                                except ValueError:
                                    result['indicators'][display_key] = val_raw  # 保留原始文本
                            else:
                                try:
                                    result['indicators'][display_key] = float(val_raw)
                                except:
                                    result['indicators'][display_key] = val_raw
                                    
            except Exception as e:
                print(f"获取个股信息失败: {e}")
            
            # 方法2: 财务分析指标
            try:
                df_finance = ak.stock_financial_analysis_indicator(symbol=stock_code)
                if df_finance is not None and len(df_finance) > 0:
                    latest_data = df_finance.iloc[-1]
                    
                    financial_map = {
                        '净资产收益率(%)': 'ROE净资产收益率',
                        '摊薄每股收益(元)': 'EPS每股收益',
                        '每股净资产_调整前(元)': '每股净资产',
                        '营业收入增长率(%)': '营收增长率',
                        '净利润增长率(%)': '净利润增长率',
                        '资产负债率(%)': '资产负债率',
                        '流动比率': '流动比率',
                        '速动比率': '速动比率',
                        '毛利率(%)': '毛利率',
                        '净利率(%)': '净利率'
                    }
                    
                    for key, display_key in financial_map.items():
                        if key in latest_data and pd.notna(latest_data[key]):
                            try:
                                val = float(latest_data[key])
                                result['indicators'][display_key] = val
                            except (ValueError, TypeError):
                                pass
                                
            except Exception as e:
                print(f"获取财务分析指标失败: {e}")
                
        except Exception as e:
            print(f"akshare数据获取失败: {e}")
        
        # 2. TuShare作为备用数据源
        try:
            import tushare as ts
            token = get_tushare_token()
            if token:
                ts.set_token(token)
                pro = ts.pro_api()
                ts_code = f"{stock_code}.SH" if stock_code.startswith('6') else f"{stock_code}.SZ"
                
                # 获取基本指标
                df = pro.daily_basic(ts_code=ts_code, fields='ts_code,trade_date,pe,pb,ps,roe,turnover_rate')
                if df is not None and len(df) > 0:
                    latest = df.sort_values('trade_date').iloc[-1]
                    
                    tushare_map = {
                        'pe': 'PE市盈率',
                        'pb': 'PB市净率',
                        'ps': 'PS市销率',
                        'roe': 'ROE净资产收益率',
                        'turnover_rate': '换手率'
                    }
                    
                    for key, display_key in tushare_map.items():
                        val = latest.get(key, None)
                        if val is not None and not pd.isna(val) and display_key not in result['indicators']:
                            result['indicators'][display_key] = float(val)
                            
        except Exception as e:
            print(f"tushare数据获取失败: {e}")
        
        # 3. 生成分析内容和评级
        analysis = []
        investment_advice = []
        rating_score = 0
        risk_factors = []
        
        # PE分析
        if 'PE市盈率' in result['indicators']:
            pe = result['indicators']['PE市盈率']
            analysis.append(f"📊 市盈率: {pe:.2f}倍")
            if pe < 0:
                analysis.append("⚠️ 市盈率为负，公司处于亏损状态")
                risk_factors.append("亏损状态")
            elif pe < 10:
                analysis.append("✅ 市盈率较低，可能被低估")
                rating_score += 2
            elif pe < 20:
                analysis.append("✅ 市盈率适中，估值合理")
                rating_score += 1
            elif pe < 30:
                analysis.append("⚠️ 市盈率偏高，估值风险增加")
                risk_factors.append("高估值")
            else:
                analysis.append("🚨 市盈率过高，泡沫风险")
                risk_factors.append("严重高估")
                rating_score -= 1
        
        # PB分析
        if 'PB市净率' in result['indicators']:
            pb = result['indicators']['PB市净率']
            analysis.append(f"📊 市净率: {pb:.2f}倍")
            if pb < 1:
                analysis.append("✅ 市净率<1，资产安全边际高")
                rating_score += 1
            elif pb < 2:
                analysis.append("✅ 市净率适中，资产价值合理")
            elif pb > 3:
                analysis.append("⚠️ 市净率较高，资产估值偏贵")
                risk_factors.append("资产高估")
        
        # ROE分析
        if 'ROE净资产收益率' in result['indicators']:
            roe = result['indicators']['ROE净资产收益率']
            analysis.append(f"📊 净资产收益率: {roe:.2f}%")
            if roe > 20:
                analysis.append("✅ ROE优秀，盈利能力很强")
                rating_score += 2
            elif roe > 15:
                analysis.append("✅ ROE良好，盈利能力较强")
                rating_score += 1
            elif roe > 10:
                analysis.append("⚖️ ROE一般，盈利能力中等")
            elif roe > 5:
                analysis.append("⚠️ ROE偏低，盈利能力较弱")
            else:
                analysis.append("🚨 ROE很低，盈利能力堪忧")
                risk_factors.append("盈利能力弱")
                rating_score -= 1
        
        # EPS分析
        if 'EPS每股收益' in result['indicators']:
            eps = result['indicators']['EPS每股收益']
            analysis.append(f"📊 每股收益: {eps:.3f}元")
            if eps > 1:
                analysis.append("✅ 每股收益较高，盈利质量好")
                rating_score += 1
            elif eps > 0.5:
                analysis.append("✅ 每股收益中等，盈利稳定")
            elif eps > 0:
                analysis.append("⚖️ 每股收益偏低")
            else:
                analysis.append("🚨 每股收益为负，公司亏损")
                risk_factors.append("每股亏损")
                rating_score -= 2
        
        # 成长性分析
        if '营收增长率' in result['indicators']:
            revenue_growth = result['indicators']['营收增长率']
            analysis.append(f"📈 营收增长率: {revenue_growth:.2f}%")
            if revenue_growth > 20:
                analysis.append("✅ 营收高速增长，成长性优秀")
                rating_score += 1
            elif revenue_growth > 10:
                analysis.append("✅ 营收稳步增长，成长性良好")
            elif revenue_growth > 0:
                analysis.append("⚖️ 营收正增长，成长性一般")
            else:
                analysis.append("⚠️ 营收负增长，业务萎缩")
                risk_factors.append("营收下滑")
        
        if '净利润增长率' in result['indicators']:
            profit_growth = result['indicators']['净利润增长率']
            analysis.append(f"📈 净利润增长率: {profit_growth:.2f}%")
            if profit_growth > 25:
                analysis.append("✅ 利润高速增长，业绩优秀")
                rating_score += 1
            elif profit_growth > 10:
                analysis.append("✅ 利润稳步增长，业绩良好")
            elif profit_growth > 0:
                analysis.append("⚖️ 利润正增长，业绩一般")
            else:
                analysis.append("⚠️ 利润负增长，业绩下滑")
                risk_factors.append("利润下降")
        
        # 债务风险分析
        if '资产负债率' in result['indicators']:
            debt_ratio = result['indicators']['资产负债率']
            analysis.append(f"💼 资产负债率: {debt_ratio:.2f}%")
            if debt_ratio < 30:
                analysis.append("✅ 负债率低，财务风险小")
            elif debt_ratio < 50:
                analysis.append("✅ 负债率适中，财务状况良好")
            elif debt_ratio < 70:
                analysis.append("⚠️ 负债率偏高，需关注财务风险")
                risk_factors.append("负债偏高")
            else:
                analysis.append("🚨 负债率过高，财务风险大")
                risk_factors.append("高负债风险")
                rating_score -= 1
        
        # 流动性分析
        if '流动比率' in result['indicators']:
            current_ratio = result['indicators']['流动比率']
            analysis.append(f"💧 流动比率: {current_ratio:.2f}")
            if current_ratio > 2:
                analysis.append("✅ 流动性充足，短期偿债能力强")
            elif current_ratio > 1.5:
                analysis.append("✅ 流动性良好，短期偿债无忧")
            elif current_ratio > 1:
                analysis.append("⚖️ 流动性一般，基本满足需求")
            else:
                analysis.append("⚠️ 流动性不足，短期偿债压力大")
                risk_factors.append("流动性风险")
        
        # 盈利质量分析
        if '毛利率' in result['indicators']:
            gross_margin = result['indicators']['毛利率']
            analysis.append(f"💰 毛利率: {gross_margin:.2f}%")
            if gross_margin > 40:
                analysis.append("✅ 毛利率较高，产品竞争力强")
                rating_score += 1
            elif gross_margin > 20:
                analysis.append("✅ 毛利率适中，盈利质量良好")
            elif gross_margin > 10:
                analysis.append("⚖️ 毛利率一般，成本控制有待提升")
            else:
                analysis.append("⚠️ 毛利率偏低，盈利压力大")
                risk_factors.append("毛利率低")
        
        if '净利率' in result['indicators']:
            net_margin = result['indicators']['净利率']
            analysis.append(f"💰 净利率: {net_margin:.2f}%")
            if net_margin > 15:
                analysis.append("✅ 净利率较高，经营效率优秀")
                rating_score += 1
            elif net_margin > 8:
                analysis.append("✅ 净利率良好，经营效率不错")
            elif net_margin > 3:
                analysis.append("⚖️ 净利率一般，经营效率中等")
            else:
                analysis.append("⚠️ 净利率偏低，经营效率有待提升")
        
        # 综合评级
        if rating_score >= 5:
            rating = "优秀⭐⭐⭐⭐⭐"
            investment_advice.extend([
                "✅ 基本面优秀，具备长期投资价值",
                "💡 可考虑中长期持有",
                "📈 关注业绩持续性和估值安全边际"
            ])
        elif rating_score >= 3:
            rating = "良好⭐⭐⭐⭐"
            investment_advice.extend([
                "✅ 基本面良好，投资价值较高",
                "💡 适合价值投资者关注",
                "📈 建议结合技术面择时介入"
            ])
        elif rating_score >= 1:
            rating = "一般⭐⭐⭐"
            investment_advice.extend([
                "⚖️ 基本面一般，需谨慎评估",
                "💡 建议等待更好的投资机会",
                "📈 重点关注财务指标改善情况"
            ])
        elif rating_score >= -1:
            rating = "较差⭐⭐"
            investment_advice.extend([
                "⚠️ 基本面存在一些问题",
                "💡 不建议普通投资者参与",
                "📈 等待基本面明显改善"
            ])
        else:
            rating = "很差⭐"
            investment_advice.extend([
                "🚨 基本面较差，风险较高",
                "💡 强烈建议回避",
                "📈 关注公司是否有重大改革措施"
            ])
        
        # 风险等级评估
        if len(risk_factors) == 0:
            risk_level = "低"
        elif len(risk_factors) <= 2:
            risk_level = "中等"
        else:
            risk_level = "高"
        
        # 风险提示
        if risk_factors:
            analysis.append(f"⚠️ 风险因素: {', '.join(risk_factors)}")
        
        # 确保有基本的分析内容
        if not analysis:
            analysis = [
                "📋 基本面数据获取中，请稍后刷新",
                "💡 建议关注公司最新财报数据",
                "📈 可关注行业整体表现",
                "⚠️ 投资需结合多维度分析"
            ]
        
        if not investment_advice:
            investment_advice = [
                "📋 投资建议生成中，请稍后查看",
                "💡 建议综合考虑技术面和基本面",
                "⚠️ 投资有风险，决策需谨慎"
            ]
        
        result['analysis'] = analysis
        result['rating'] = rating
        result['risk_level'] = risk_level
        result['investment_advice'] = investment_advice
        result['risk_factors'] = risk_factors
        result['rating_score'] = rating_score
        
        return result 