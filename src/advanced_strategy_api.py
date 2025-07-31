"""
高级策略API - 支持更多专业量化策略
集成TuShare和AkShare，提供全市场股票分析评分和选股功能
"""

import pandas as pd
import numpy as np
import akshare as ak
import warnings
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

warnings.filterwarnings('ignore')

class AdvancedStrategyEngine:
    """高级策略引擎"""
    
    def __init__(self):
        """初始化高级策略引擎"""
        self.tushare_available = True
        self.akshare_available = True
        
        # 初始化TuShare
        try:
            import tushare as ts
            # 修复配置文件路径问题
            try:
                import os
                project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                config_file = os.path.join(project_root, 'config', 'tushare_config.json')
                
                print(f"🔍 查找TuShare配置文件: {config_file}")
                print(f"📁 配置文件是否存在: {os.path.exists(config_file)}")
                
                if os.path.exists(config_file):
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        token = config.get('token')
                        if token:
                            ts.set_token(token)
                            self.tushare_pro = ts.pro_api()
                            print("✅ TuShare Pro API初始化成功")
                        else:
                            self.tushare_available = False
                            print("⚠️ TuShare Token未配置")
                else:
                    self.tushare_available = False
                    print("⚠️ TuShare配置文件未找到")
            except UnicodeDecodeError as e:
                self.tushare_available = False
                print(f"❌ TuShare配置文件编码错误: {e}")
                print("提示: 请确保config/tushare_config.json文件为UTF-8编码")
            except json.JSONDecodeError as e:
                self.tushare_available = False
                print(f"❌ TuShare配置文件JSON格式错误: {e}")
                print("提示: 请检查JSON文件格式是否正确")
            except Exception as e:
                self.tushare_available = False
                print(f"❌ TuShare配置失败: {e}")
        except ImportError:
            self.tushare_available = False
            print("⚠️ TuShare未安装")
        
        print(f"📊 数据源状态: TuShare={self.tushare_available}, AkShare={self.akshare_available}")
    
    def get_stock_universe(self, min_market_cap: float = 50) -> List[Dict]:
        """
        获取股票池 - 结合TuShare和AkShare
        :param min_market_cap: 最小市值(亿元)
        :return: 股票列表
        """
        print("🔄 正在获取股票池...")
        stocks = []
        
        try:
            # 方法1：AkShare获取基础信息
            if self.akshare_available:
                try:
                    stock_info = ak.stock_zh_a_spot_em()
                    if stock_info is not None and len(stock_info) > 0:
                        for _, row in stock_info.iterrows():
                            code = str(row.get('代码', '')).zfill(6)
                            name = str(row.get('名称', ''))
                            market_cap = float(row.get('总市值', 0)) / 100000000  # 转换为亿元
                            
                            if len(code) == 6 and code.isdigit() and market_cap >= min_market_cap:
                                # 确定交易所
                                if code.startswith('6'):
                                    exchange = 'SH'
                                elif code.startswith(('0', '3')):
                                    exchange = 'SZ'
                                elif code.startswith('8'):
                                    exchange = 'BJ'
                                else:
                                    continue
                                
                                stocks.append({
                                    'code': code,
                                    'name': name,
                                    'exchange': exchange,
                                    'market_cap': market_cap,
                                    'data_source': 'akshare'
                                })
                        
                        print(f"✅ AkShare获取到 {len(stocks)} 只股票")
                except Exception as e:
                    print(f"⚠️ AkShare获取股票列表失败: {e}")
            
            # 方法2：TuShare补充信息
            if self.tushare_available and len(stocks) < 1000:
                try:
                    stock_basic = self.tushare_pro.stock_basic(
                        exchange='',
                        list_status='L',
                        fields='ts_code,symbol,name,area,industry,market,list_date'
                    )
                    
                    if stock_basic is not None and len(stock_basic) > 0:
                        existing_codes = {s['code'] for s in stocks}
                        
                        for _, row in stock_basic.iterrows():
                            ts_code = row['ts_code']
                            code = row['symbol']
                            name = row['name']
                            market = row['market']
                            
                            if code not in existing_codes:
                                stocks.append({
                                    'code': code,
                                    'name': name,
                                    'exchange': 'SH' if market == '主板' and code.startswith('6') else 'SZ',
                                    'market_cap': 0,  # 需要后续获取
                                    'data_source': 'tushare'
                                })
                        
                        print(f"✅ TuShare补充股票信息")
                except Exception as e:
                    print(f"⚠️ TuShare获取股票基础信息失败: {e}")
        
        except Exception as e:
            print(f"❌ 获取股票池失败: {e}")
        
        print(f"📊 最终股票池: {len(stocks)} 只股票")
        return stocks[:3000]  # 限制在3000只以内避免API过载
    
    def get_stock_fundamental_data(self, stock_code: str) -> Dict:
        """
        获取股票基本面数据
        :param stock_code: 股票代码
        :return: 基本面数据
        """
        fundamental_data = {
            'pe': None,
            'pb': None,
            'roe': None,
            'revenue_growth': None,
            'profit_growth': None,
            'debt_ratio': None,
            'current_ratio': None,
            'dividend_yield': None,
            'market_cap': None,
            'data_source': 'unknown'
        }
        
        try:
            # 方法1：AkShare获取
            if self.akshare_available:
                try:
                    # 获取个股信息
                    stock_info = ak.stock_individual_info_em(symbol=stock_code)
                    if stock_info is not None and not stock_info.empty:
                        indicator_map = {
                            '市盈率-动态': 'pe',
                            '市净率': 'pb',
                            '净资产收益率': 'roe',
                            '总市值': 'market_cap'
                        }
                        
                        for ak_key, our_key in indicator_map.items():
                            if ak_key in stock_info.index:
                                value = stock_info.loc[ak_key]
                                if pd.notna(value) and str(value).replace('.', '').replace('-', '').isdigit():
                                    fundamental_data[our_key] = float(value)
                        
                        fundamental_data['data_source'] = 'akshare'
                        print(f"✅ AkShare获取 {stock_code} 基本面数据成功")
                        return fundamental_data
                        
                except Exception as e:
                    print(f"⚠️ AkShare获取 {stock_code} 基本面数据失败: {e}")
            
            # 方法2：TuShare备用
            if self.tushare_available:
                try:
                    ts_code = f"{stock_code}.SH" if stock_code.startswith('6') else f"{stock_code}.SZ"
                    
                    # 获取基本指标
                    daily_basic = self.tushare_pro.daily_basic(
                        ts_code=ts_code,
                        trade_date=datetime.now().strftime('%Y%m%d'),
                        fields='ts_code,trade_date,pe,pb,turnover_rate'
                    )
                    
                    if daily_basic is not None and len(daily_basic) > 0:
                        latest = daily_basic.iloc[0]
                        if pd.notna(latest['pe']):
                            fundamental_data['pe'] = float(latest['pe'])
                        if pd.notna(latest['pb']):
                            fundamental_data['pb'] = float(latest['pb'])
                    
                    # 获取财务指标
                    fina_indicator = self.tushare_pro.fina_indicator(
                        ts_code=ts_code,
                        period=datetime.now().strftime('%Y%m%d'),
                        fields='ts_code,end_date,roe,debt_to_assets,current_ratio'
                    )
                    
                    if fina_indicator is not None and len(fina_indicator) > 0:
                        latest = fina_indicator.iloc[0]
                        if pd.notna(latest['roe']):
                            fundamental_data['roe'] = float(latest['roe'])
                        if pd.notna(latest['debt_to_assets']):
                            fundamental_data['debt_ratio'] = float(latest['debt_to_assets'])
                        if pd.notna(latest['current_ratio']):
                            fundamental_data['current_ratio'] = float(latest['current_ratio'])
                    
                    fundamental_data['data_source'] = 'tushare'
                    print(f"✅ TuShare获取 {stock_code} 基本面数据成功")
                    
                except Exception as e:
                    print(f"⚠️ TuShare获取 {stock_code} 基本面数据失败: {e}")
        
        except Exception as e:
            print(f"❌ 获取 {stock_code} 基本面数据失败: {e}")
        
        return fundamental_data
    
    def calculate_strategy_score(self, stock_data: Dict, strategy_params: Dict) -> float:
        """
        根据策略参数计算股票评分
        :param stock_data: 股票数据
        :param strategy_params: 策略参数
        :return: 评分(0-100)
        """
        score = 0
        max_score = 100
        
        try:
            # PE评分 (20分)
            if 'pe_min' in strategy_params and 'pe_max' in strategy_params:
                pe = stock_data.get('pe')
                if pe is not None:
                    pe_min = strategy_params['pe_min']['value']
                    pe_max = strategy_params['pe_max']['value']
                    if pe_min <= pe <= pe_max:
                        score += 20
                    elif pe < pe_min * 0.8 or pe > pe_max * 1.2:
                        score -= 10
            
            # PB评分 (15分)
            if 'pb_min' in strategy_params and 'pb_max' in strategy_params:
                pb = stock_data.get('pb')
                if pb is not None:
                    pb_min = strategy_params['pb_min']['value']
                    pb_max = strategy_params['pb_max']['value']
                    if pb_min <= pb <= pb_max:
                        score += 15
                    elif pb < pb_min * 0.8 or pb > pb_max * 1.2:
                        score -= 8
            
            # ROE评分 (20分)
            if 'roe_min' in strategy_params:
                roe = stock_data.get('roe')
                if roe is not None:
                    roe_min = strategy_params['roe_min']['value']
                    if roe >= roe_min:
                        score += 20
                        # 超额奖励
                        if roe >= roe_min * 1.5:
                            score += 5
                    else:
                        score -= 15
            
            # 市值评分 (10分)
            if 'market_cap_min' in strategy_params:
                market_cap = stock_data.get('market_cap', 0)
                if market_cap >= strategy_params['market_cap_min']['value']:
                    score += 10
            
            # 增长性评分 (15分)
            if 'revenue_growth_min' in strategy_params:
                revenue_growth = stock_data.get('revenue_growth')
                if revenue_growth is not None:
                    growth_min = strategy_params['revenue_growth_min']['value']
                    if revenue_growth >= growth_min:
                        score += 15
                        # 高增长奖励
                        if revenue_growth >= growth_min * 2:
                            score += 10
            
            # 安全性评分 (10分)
            if 'debt_ratio_max' in strategy_params:
                debt_ratio = stock_data.get('debt_ratio')
                if debt_ratio is not None:
                    debt_max = strategy_params['debt_ratio_max']['value']
                    if debt_ratio <= debt_max:
                        score += 10
                    else:
                        score -= 5
            
            # 流动性评分 (10分)
            if 'current_ratio_min' in strategy_params:
                current_ratio = stock_data.get('current_ratio')
                if current_ratio is not None:
                    ratio_min = strategy_params['current_ratio_min']['value']
                    if current_ratio >= ratio_min:
                        score += 10
        
        except Exception as e:
            print(f"⚠️ 计算评分失败: {e}")
        
        return max(0, min(score, max_score))
    
    def execute_advanced_strategy(self, strategy_id: str, strategy_params: Dict, 
                                max_stocks: int = 100) -> Dict:
        """
        执行高级策略分析
        :param strategy_id: 策略ID
        :param strategy_params: 策略参数
        :param max_stocks: 最大分析股票数
        :return: 分析结果
        """
        print(f"🚀 开始执行高级策略: {strategy_id}")
        start_time = time.time()
        
        results = {
            'success': False,
            'strategy_id': strategy_id,
            'total_analyzed': 0,
            'qualified_stocks': [],
            'top_30_stocks': [],
            'data_quality': 0,
            'execution_time': 0,
            'data_sources': {'akshare': 0, 'tushare': 0}
        }
        
        try:
            # 获取股票池
            stock_universe = self.get_stock_universe()
            if not stock_universe:
                return {'success': False, 'error': '无法获取股票池'}
            
            # 限制分析数量
            stocks_to_analyze = stock_universe[:max_stocks]
            results['total_analyzed'] = len(stocks_to_analyze)
            
            print(f"📊 开始分析 {len(stocks_to_analyze)} 只股票...")
            
            qualified_stocks = []
            successful_analyses = 0
            
            # 使用线程池并行处理
            with ThreadPoolExecutor(max_workers=3) as executor:
                future_to_stock = {
                    executor.submit(self._analyze_single_stock, stock, strategy_params): stock
                    for stock in stocks_to_analyze
                }
                
                for future in as_completed(future_to_stock):
                    stock = future_to_stock[future]
                    try:
                        result = future.result(timeout=30)  # 30秒超时
                        if result:
                            successful_analyses += 1
                            results['data_sources'][result.get('data_source', 'unknown')] += 1
                            
                            if result['score'] >= 60:  # 合格分数线
                                qualified_stocks.append(result)
                        
                        # API限速
                        time.sleep(0.1)
                        
                    except Exception as e:
                        print(f"⚠️ 分析股票失败: {e}")
            
            # 按评分排序
            qualified_stocks.sort(key=lambda x: x['score'], reverse=True)
            
            # 设置结果
            results['success'] = True
            results['qualified_stocks'] = qualified_stocks
            results['top_30_stocks'] = qualified_stocks[:30]
            results['data_quality'] = (successful_analyses / len(stocks_to_analyze) * 100) if stocks_to_analyze else 0
            results['execution_time'] = round(time.time() - start_time, 2)
            
            print(f"🎉 策略执行完成!")
            print(f"⏱️ 执行时间: {results['execution_time']}秒")
            print(f"📊 成功分析: {successful_analyses}/{len(stocks_to_analyze)} 只股票")
            print(f"🎯 符合条件: {len(qualified_stocks)} 只股票")
            print(f"🏆 前30强: {len(results['top_30_stocks'])} 只股票")
            print(f"💯 数据质量: {results['data_quality']:.1f}%")
            
        except Exception as e:
            print(f"❌ 策略执行失败: {e}")
            results['error'] = str(e)
        
        return results
    
    def _analyze_single_stock(self, stock: Dict, strategy_params: Dict) -> Optional[Dict]:
        """分析单只股票"""
        try:
            stock_code = stock['code']
            
            # 获取基本面数据
            fundamental_data = self.get_stock_fundamental_data(stock_code)
            
            # 合并股票信息和基本面数据
            stock_data = {**stock, **fundamental_data}
            
            # 计算评分
            score = self.calculate_strategy_score(stock_data, strategy_params)
            
            return {
                'stock_code': stock_code,
                'stock_name': stock['name'],
                'exchange': stock['exchange'],
                'score': score,
                'pe': fundamental_data.get('pe'),
                'pb': fundamental_data.get('pb'),
                'roe': fundamental_data.get('roe'),
                'market_cap': fundamental_data.get('market_cap'),
                'data_source': fundamental_data.get('data_source'),
                'analysis_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            
        except Exception as e:
            print(f"⚠️ 分析股票 {stock.get('code', 'unknown')} 失败: {e}")
            return None
    
    def get_strategy_templates(self) -> Dict:
        """获取策略模板"""
        return {
            'blue_chip_enhanced': {
                'name': '蓝筹白马增强策略',
                'description': '专注大盘蓝筹股，追求稳健收益',
                'category': 'value'
            },
            'high_dividend_plus': {
                'name': '高股息Plus策略',
                'description': '专注高分红优质股，获取稳定现金流',
                'category': 'dividend'
            },
            'quality_growth_pro': {
                'name': '质量成长Pro策略',
                'description': '寻找高质量成长股，兼顾安全边际',
                'category': 'growth'
            },
            'deep_value_investing': {
                'name': '深度价值投资策略',
                'description': '严格按照价值投资理念选股',
                'category': 'value'
            },
            'small_cap_momentum': {
                'name': '小盘动量策略',
                'description': '专注小盘成长股，结合动量因子',
                'category': 'momentum'
            }
        }

# 创建全局策略引擎实例
advanced_strategy_engine = AdvancedStrategyEngine() 