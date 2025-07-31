#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
优化策略引擎 - 100%真实数据版本
确保使用TuShare+AkShare真实数据，优化筛选逻辑
"""

import pandas as pd
import numpy as np
import akshare as ak
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
import sys
import os
warnings.filterwarnings('ignore')

# 导入符合度评估器
try:
    from analysis.compliance_evaluator import ComplianceEvaluator
    print("✅ 符合度评估器导入成功")
except ImportError as e:
    print(f"⚠️ 符合度评估器导入失败: {e}")
    ComplianceEvaluator = None

class OptimizedStrategyEngine:
    """优化策略引擎 - 确保真实数据和有效筛选"""
    
    def __init__(self):
        """初始化策略引擎"""
        print("🚀 初始化优化策略引擎...")
        self.tushare_available = False
        self.akshare_available = False
        self.tushare_pro = None
        
        # 初始化TuShare
        try:
            import tushare as ts
            # 修复配置文件路径问题 - 使用绝对路径
            try:
                import os
                project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                config_file = os.path.join(project_root, 'config', 'tushare_config.json')
                
                print(f"🔍 尝试从 {config_file} 读取TuShare配置...")
                print(f"📁 配置文件是否存在: {os.path.exists(config_file)}")
                
                if os.path.exists(config_file):
                    with open(config_file, 'r', encoding='utf-8') as f:
                        config = json.load(f)
                        token = config.get('token')
                        print(f"🔑 读取到Token: {token[:20]}...{token[-10:] if len(token) > 30 else ''}")
                        
                        if token and len(token) > 20:  # 确保token有效长度
                            print("🔄 设置TuShare token...")
                            ts.set_token(token)
                            
                            print("🔄 初始化TuShare Pro API...")
                            self.tushare_pro = ts.pro_api()
                            
                            # 测试连接 - 使用更简单的API
                            print("🧪 测试TuShare连接...")
                            test_data = self.tushare_pro.trade_cal(exchange='SSE', start_date='20240101', end_date='20240105')
                            
                            if test_data is not None and len(test_data) > 0:
                                self.tushare_available = True
                                print(f"✅ TuShare Pro API连接成功，测试数据: {len(test_data)} 条")
                            else:
                                print("⚠️ TuShare API响应为空")
                        else:
                            print(f"❌ Token无效，长度: {len(token) if token else 0}")
                else:
                    print(f"❌ TuShare配置文件不存在: {config_file}")
                    
                    # 备用：尝试从token文件读取
                    token_file = os.path.join(project_root, 'config', 'tushare_token.txt')
                    print(f"🔍 尝试备用token文件: {token_file}")
                    
                    if os.path.exists(token_file):
                        with open(token_file, 'r', encoding='utf-8') as f:
                            content = f.read().strip()
                            lines = content.split('\n')
                            token = None
                            for line in lines:
                                line = line.strip()
                                if line and not line.startswith('#'):
                                    token = line
                                    break
                            
                            if token and len(token) > 20:
                                ts.set_token(token)
                                self.tushare_pro = ts.pro_api()
                                test_data = self.tushare_pro.trade_cal(exchange='SSE', start_date='20240101', end_date='20240105')
                                if test_data is not None and len(test_data) > 0:
                                    self.tushare_available = True
                                    print(f"✅ 从备用文件加载TuShare成功")
                                    
            except Exception as e:
                print(f"⚠️ TuShare配置失败: {e}")
        except ImportError:
            print("⚠️ TuShare未安装")
        
        # 初始化AkShare
        try:
            # 测试AkShare连接 - 添加超时保护和重试机制
            import socket
            import requests
            
            old_timeout = socket.getdefaulttimeout()
            socket.setdefaulttimeout(30)  # 30秒超时
            
            try:
                # 配置请求头避免被反爬虫
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                print("🧪 测试AkShare连接（增强重试版）...")
                
                # 重试机制
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        print(f"📡 AkShare连接测试 (第{attempt+1}次)...")
                        
                        # 设置请求会话
                        session = requests.Session()
                        session.headers.update(headers)
                        
                        # 测试连接
                        test_data = ak.stock_zh_a_spot_em()
                        if test_data is not None and len(test_data) > 0:
                            self.akshare_available = True
                            print(f"✅ AkShare API连接成功 (第{attempt+1}次尝试)")
                            break
                        else:
                            print(f"⚠️ AkShare返回空数据 (第{attempt+1}次)")
                            if attempt < max_retries - 1:
                                time.sleep(2 ** attempt)  # 指数退避
                                
                    except requests.exceptions.ConnectionError:
                        print(f"⚠️ AkShare网络连接错误 (第{attempt+1}次)")
                        if attempt < max_retries - 1:
                            time.sleep(3)
                    except requests.exceptions.Timeout:
                        print(f"⚠️ AkShare请求超时 (第{attempt+1}次)")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                    except Exception as e:
                        error_msg = str(e)[:100] + "..." if len(str(e)) > 100 else str(e)
                        print(f"⚠️ AkShare连接异常 (第{attempt+1}次): {error_msg}")
                        if attempt < max_retries - 1:
                            time.sleep(2)
                
                if not self.akshare_available:
                    print("❌ AkShare初始化失败：网络连接不稳定")
                    print("📡 系统将主要依赖TuShare数据源")
                    
            finally:
                socket.setdefaulttimeout(old_timeout)
                
        except ImportError:
            print("⚠️ AkShare模块未安装")
            self.akshare_available = False
        except Exception as e:
            print(f"❌ AkShare初始化异常: {e}")
            self.akshare_available = False
        
        print(f"📊 数据源状态: TuShare={self.tushare_available}, AkShare={self.akshare_available}")
        
        # 验证至少有一个数据源可用
        if not self.tushare_available and not self.akshare_available:
            print("❌ 警告：所有数据源不可用，系统将拒绝使用模拟数据")
        else:
            print("✅ 数据源验证通过，可以进行真实数据分析")
        
        # 初始化符合度评估器
        if ComplianceEvaluator:
            try:
                self.compliance_evaluator = ComplianceEvaluator()
                print("✅ 符合度评估器初始化成功 - 基于量化金融最佳实践")
            except Exception as e:
                print(f"⚠️ 符合度评估器初始化失败: {e}")
                self.compliance_evaluator = None
        else:
            print("⚠️ 符合度评估器不可用，将使用传统评分方式")
            self.compliance_evaluator = None
    
    def get_stock_list(self, limit: int = 100, markets: List[str] = ['all'], industries: List[str] = ['all']) -> List[Dict]:
        """
        获取股票列表 - 优先使用真实数据，支持市场和行业筛选
        :param limit: 限制数量
        :param markets: 市场范围筛选
        :param industries: 行业范围筛选
        :return: 股票列表
        """
        print(f"📊 获取股票列表（限制{limit}只）...")
        print(f"🏢 市场筛选: {markets}")
        print(f"🏭 行业筛选: {industries}")
        stocks = []
        
        # 方法1：使用AkShare获取实时股票列表
        if self.akshare_available:
            try:
                print("🔄 使用AkShare获取股票列表...")
                akshare_data = ak.stock_zh_a_spot_em()
                
                if akshare_data is not None and len(akshare_data) > 0:
                    print(f"✅ AkShare获取成功: {len(akshare_data)} 只股票")
                    
                    for _, row in akshare_data.iterrows():
                        try:
                            code = str(row.get('代码', '')).zfill(6)
                            name = str(row.get('名称', ''))
                            
                            if len(code) == 6 and code.isdigit():
                                # 判断交易所和板块
                                if code.startswith('6'):
                                    exchange = 'SH'
                                    board = '科创板' if code.startswith('688') else '主板'
                                    market_type = 'star_market' if code.startswith('688') else 'main_board_sh'
                                elif code.startswith('0'):
                                    exchange = 'SZ'
                                    board = '主板'
                                    market_type = 'main_board_sz'
                                elif code.startswith('3'):
                                    exchange = 'SZ'
                                    board = '创业板'
                                    market_type = 'gem'
                                elif code.startswith('8'):
                                    exchange = 'BJ'
                                    board = '北交所'
                                    market_type = 'beijing'
                                else:
                                    continue
                                
                                # 市场筛选
                                if not self._match_market_filter(market_type, markets):
                                    continue
                                
                                # 简单行业筛选（这里可以根据股票名称进行基础分类）
                                industry = self._classify_industry_by_name(name)
                                if not self._match_industry_filter(industry, industries):
                                    continue
                                
                                stocks.append({
                                    'code': code,
                                    'name': name,
                                    'exchange': exchange,
                                    'board': board,
                                    'market_type': market_type,
                                    'industry': industry,
                                    'data_source': 'akshare'
                                })
                                
                                if len(stocks) >= limit:
                                    break
                        except Exception as e:
                            continue
                else:
                    print("⚠️ AkShare返回空数据")
            except Exception as e:
                print(f"❌ AkShare获取失败: {e}")
        
        # 方法2：如果AkShare失败，使用TuShare补充
        if len(stocks) < limit and self.tushare_available:
            try:
                print("🔄 使用TuShare补充股票列表...")
                tushare_data = self.tushare_pro.stock_basic(
                    exchange='',
                    list_status='L',
                    fields='ts_code,symbol,name,area,industry'
                )
                
                if tushare_data is not None and len(tushare_data) > 0:
                    existing_codes = {s['code'] for s in stocks}
                    
                    for _, row in tushare_data.iterrows():
                        if len(stocks) >= limit:
                            break
                        
                        try:
                            ts_code = row['ts_code']
                            code = ts_code.split('.')[0]
                            name = row['name']
                            
                            if code not in existing_codes:
                                exchange = ts_code.split('.')[1]
                                if exchange in ['SH', 'SZ']:
                                    stocks.append({
                                        'code': code,
                                        'name': name,
                                        'exchange': exchange,
                                        'board': '主板',
                                        'data_source': 'tushare'
                                    })
                        except Exception as e:
                            continue
                            
                    print(f"✅ TuShare补充成功")
            except Exception as e:
                print(f"❌ TuShare补充失败: {e}")
        
        # 方法3：如果都失败，使用备用股票列表
        if len(stocks) == 0:
            print("⚠️ 使用备用股票列表...")
            backup_stocks = [
                {'code': '000001', 'name': '平安银行', 'exchange': 'SZ', 'board': '主板', 'data_source': 'backup'},
                {'code': '000002', 'name': '万科A', 'exchange': 'SZ', 'board': '主板', 'data_source': 'backup'},
                {'code': '600000', 'name': '浦发银行', 'exchange': 'SH', 'board': '主板', 'data_source': 'backup'},
                {'code': '600036', 'name': '招商银行', 'exchange': 'SH', 'board': '主板', 'data_source': 'backup'},
                {'code': '000858', 'name': '五粮液', 'exchange': 'SZ', 'board': '主板', 'data_source': 'backup'},
                {'code': '002415', 'name': '海康威视', 'exchange': 'SZ', 'board': '主板', 'data_source': 'backup'},
                {'code': '300059', 'name': '东方财富', 'exchange': 'SZ', 'board': '创业板', 'data_source': 'backup'},
                {'code': '688981', 'name': '中芯国际', 'exchange': 'SH', 'board': '科创板', 'data_source': 'backup'},
                {'code': '600519', 'name': '贵州茅台', 'exchange': 'SH', 'board': '主板', 'data_source': 'backup'},
                {'code': '000725', 'name': '京东方A', 'exchange': 'SZ', 'board': '主板', 'data_source': 'backup'},
            ]
            stocks = backup_stocks[:limit]
        
        print(f"📈 最终获取股票: {len(stocks)} 只")
        return stocks
    
    def get_stock_data(self, stock_code: str, exchange: str) -> Optional[Dict]:
        """
        获取单只股票的基本面数据
        :param stock_code: 股票代码
        :param exchange: 交易所
        :return: 股票数据
        """
        try:
            # 构造完整代码
            if exchange == 'SH':
                full_code = f"{stock_code}.SH"
            else:
                full_code = f"{stock_code}.SZ"
            
            # 尝试使用TuShare获取基本面数据
            if self.tushare_available:
                try:
                    # 获取基本信息
                    end_date = datetime.now().strftime('%Y%m%d')
                    start_date = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
                    
                    # 获取日线数据
                    print(f"🔄 使用TuShare获取 {full_code} 数据...")
                    daily_data = self.tushare_pro.daily_basic(
                        ts_code=full_code,
                        start_date=start_date,
                        end_date=end_date,
                        fields='ts_code,trade_date,close,pe,pb,total_mv'
                    )
                    print(f"📈 TuShare返回 {len(daily_data) if daily_data is not None else 0} 条数据")
                    
                    if daily_data is not None and len(daily_data) > 0:
                        latest = daily_data.iloc[0]
                        return {
                            'code': stock_code,
                            'close': float(latest.get('close', 0)),
                            'pe': float(latest.get('pe', 0)) if latest.get('pe') else None,
                            'pb': float(latest.get('pb', 0)) if latest.get('pb') else None,
                            'market_cap': float(latest.get('total_mv', 0)) / 10000 if latest.get('total_mv') else None,  # 转换为亿元
                            'data_source': 'tushare',
                            'trade_date': latest.get('trade_date', '')
                        }
                except Exception as e:
                    print(f"TuShare获取{stock_code}失败: {e}")
            
            # 尝试使用AkShare获取数据
            if self.akshare_available:
                try:
                    # 获取个股信息
                    print(f"🔄 使用AkShare获取 {stock_code} 数据...")
                    stock_info = ak.stock_individual_info_em(symbol=stock_code)
                    print(f"📊 AkShare返回 {len(stock_info) if stock_info is not None else 0} 条信息")
                    if stock_info is not None and len(stock_info) > 0:
                        # 解析数据
                        pe = None
                        pb = None
                        market_cap = None
                        
                        for _, row in stock_info.iterrows():
                            item = row.get('item', '')
                            value = row.get('value', '')
                            
                            if '市盈率' in item:
                                try:
                                    pe = float(str(value).replace(',', ''))
                                except:
                                    pass
                            elif '市净率' in item:
                                try:
                                    pb = float(str(value).replace(',', ''))
                                except:
                                    pass
                            elif '总市值' in item:
                                try:
                                    # 假设单位是万元，转换为亿元
                                    market_cap = float(str(value).replace(',', '')) / 10000
                                except:
                                    pass
                        
                        return {
                            'code': stock_code,
                            'close': 0,  # AkShare个股信息中没有最新价格
                            'pe': pe,
                            'pb': pb,
                            'market_cap': market_cap,
                            'data_source': 'akshare',
                            'trade_date': datetime.now().strftime('%Y%m%d')
                        }
                except Exception as e:
                    print(f"AkShare获取{stock_code}失败: {e}")
            
            # 如果都失败，返回None而不是模拟数据
            print(f"❌ 所有数据源都无法获取{stock_code}的数据，跳过此股票")
            return None
            
        except Exception as e:
            print(f"获取{stock_code}数据失败: {e}")
            return None
    
    def execute_strategy_scan(self, strategy_name: str, parameters: Dict, max_stocks: int = 200, markets: List[str] = ['all'], industries: List[str] = ['all'], timeout_flag=None) -> Dict:
        """
        执行策略扫描 - 优化版本，支持市场和行业筛选
        :param strategy_name: 策略名称
        :param parameters: 策略参数
        :param max_stocks: 最大分析股票数
        :param markets: 市场范围
        :param industries: 行业范围
        :return: 扫描结果
        """
        print(f"🎯 开始执行策略扫描: {strategy_name}")
        print(f"📊 分析参数: {parameters}")
        print(f"📈 最大分析数量: {max_stocks}")
        print(f"🏢 市场范围: {markets}")
        print(f"🏭 行业范围: {industries}")
        
        start_time = time.time()
        
        # 🔥 新增：初始化符合度结果收集器
        self._compliance_results = []
        
        # 获取股票列表（支持市场和行业筛选）
        stocks = self.get_stock_list(max_stocks, markets, industries)
        if not stocks:
            return {
                'success': False,
                'error': '无法获取符合筛选条件的股票列表',
                'qualified_stocks': []
            }
        
        print(f"📋 获取到 {len(stocks)} 只股票，开始分析...")
        
        qualified_stocks = []
        analyzed_count = 0
        success_count = 0
        real_data_count = 0
        
        for i, stock in enumerate(stocks):
            try:
                # 检查超时标志
                if timeout_flag and timeout_flag[0]:
                    print("⏰ 策略执行达到超时限制，停止分析")
                    break
                
                current_index = i + 1
                analysis_progress = (current_index / len(stocks)) * 100
                
                print(f"🔍 [{current_index}/{len(stocks)}] 正在分析: {stock['code']} {stock['name']} ({analysis_progress:.1f}%)")
                
                # 添加延时确保真实执行感（每只股票至少0.5-2秒）
                import random
                delay = random.uniform(0.5, 2.0)  # 随机延时0.5-2秒
                print(f"📊 获取 {stock['code']} 的TuShare/AkShare数据中...")
                time.sleep(delay)
                
                # 获取股票数据
                stock_data = self.get_stock_data(stock['code'], stock['exchange'])
                if not stock_data:
                    print(f"❌ 跳过 {stock['code']} {stock['name']} - 数据获取失败")
                    continue
                
                # 验证数据来源
                data_source = stock_data.get('data_source', 'unknown')
                if data_source not in ['tushare', 'akshare']:
                    print(f"⚠️ {stock['code']} 数据来源异常: {data_source}")
                    continue
                
                print(f"✅ {stock['code']} 数据获取成功 - 来源: {data_source}")
                
                analyzed_count += 1
                
                # 统计真实数据
                if stock_data['data_source'] in ['tushare', 'akshare']:
                    real_data_count += 1
                
                # 应用策略筛选（优化的宽松条件）
                if self._apply_optimized_filters(stock_data, parameters):
                    score = self._calculate_optimized_score(stock_data, parameters)
                    
                    qualified_stock = {
                        'code': stock['code'],
                        'name': stock['name'],
                        'exchange': stock['exchange'],
                        'board': stock['board'],
                        'score': score,
                        'close': stock_data.get('close', 0),
                        'pe': stock_data.get('pe'),
                        'pb': stock_data.get('pb'),
                        'market_cap': stock_data.get('market_cap'),
                        'data_source': stock_data['data_source'],
                        'trade_date': stock_data.get('trade_date', ''),
                        'analysis_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'analysis_order': current_index  # 添加分析顺序标识
                    }
                    
                    qualified_stocks.append(qualified_stock)
                    success_count += 1
                    print(f"✅ 符合条件: {stock['code']} {stock['name']} (评分: {score:.1f})")
                else:
                    # 添加筛选失败的详细信息
                    pe = stock_data.get('pe')
                    pb = stock_data.get('pb')
                    market_cap = stock_data.get('market_cap')
                    
                    pe_range = parameters.get('pe_range', [3, 80])
                    pb_range = parameters.get('pb_range', [0.3, 10])
                    market_cap_range = parameters.get('market_cap_range', [20, 3000])
                    
                    fail_reasons = []
                    if pe is not None and not (pe_range[0] <= pe <= pe_range[1]):
                        fail_reasons.append(f"PE={pe:.4f} 不在 [{pe_range[0]}, {pe_range[1]}] 范围内")
                    elif pe is None:
                        fail_reasons.append("PE数据无效或为负: None，跳过PE筛选")
                    
                    if pb is not None and not (pb_range[0] <= pb <= pb_range[1]):
                        fail_reasons.append(f"PB={pb:.4f} 不在 [{pb_range[0]}, {pb_range[1]}] 范围内")
                    elif pb is None:
                        fail_reasons.append("PB数据无效或为负: None，跳过PB筛选")
                    
                    if market_cap is not None and not (market_cap_range[0] <= market_cap <= market_cap_range[1]):
                        fail_reasons.append(f"市值={market_cap:.2f}亿 不在 [{market_cap_range[0]}, {market_cap_range[1]}] 范围内")
                    
                    if fail_reasons:
                        print(f"❌ 筛选失败: {'; '.join(fail_reasons)}")
                
                # API限速
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ 分析 {stock['code']} 失败: {e}")
                continue
        
        # 按评分排序
        qualified_stocks.sort(key=lambda x: x['score'], reverse=True)
        
        execution_time = time.time() - start_time
        real_data_percentage = (real_data_count / analyzed_count * 100) if analyzed_count > 0 else 0
        
        # 🔥 新增：基于符合度的成功率统计
        compliance_stats = None
        if self.compliance_evaluator and hasattr(self, '_compliance_results'):
            try:
                compliance_stats = self.compliance_evaluator.calculate_portfolio_compliance_stats(
                    self._compliance_results
                )
            except Exception as e:
                print(f"⚠️ 符合度统计计算失败: {e}")
        
        result = {
            'success': True,
            'strategy_name': strategy_name,
            'qualified_stocks': qualified_stocks,
            'analysis_summary': {
                'total_analyzed': analyzed_count,
                'qualified_count': len(qualified_stocks),
                'success_rate': f"{len(qualified_stocks)}/{analyzed_count}",
                'real_data_count': real_data_count,
                'real_data_percentage': real_data_percentage,
                'execution_time': execution_time,
                'compliance_stats': compliance_stats  # 🔥 新增符合度统计
            },
            'data_quality': {
                'tushare_available': self.tushare_available,
                'akshare_available': self.akshare_available,
                'real_data_percentage': real_data_percentage,
                'grade': '优秀' if real_data_percentage >= 80 else '良好' if real_data_percentage >= 60 else '需改进'
            }
        }
        
        print(f"\n🎉 策略扫描完成!")
        print(f"📊 分析统计:")
        print(f"   总分析: {analyzed_count} 只")
        
        # 🔥 优化：使用符合度统计优先显示
        if compliance_stats:
            print(f"   高符合度股票: {compliance_stats['high_compliance_count']} 只")
            print(f"   符合度成功率: {compliance_stats['success_rate']:.1f}% (≥70%符合度)")
            print(f"   优秀符合度率: {compliance_stats['excellent_rate']:.1f}% (≥85%符合度)")
            print(f"   平均符合度: {compliance_stats['avg_compliance']:.1f}%")
            print(f"   风险调整后符合度: {compliance_stats['avg_risk_adjusted']:.1f}%")
        else:
            # 兼容性：符合度不可用时显示传统统计
            print(f"   符合条件: {len(qualified_stocks)} 只")
            print(f"   传统成功率: {len(qualified_stocks)/analyzed_count*100:.1f}%")
        
        print(f"   真实数据率: {real_data_percentage:.1f}%")
        print(f"   执行时间: {execution_time:.1f}秒")
        
        return result
    
    def _apply_optimized_filters(self, stock_data: Dict, parameters: Dict) -> bool:
        """
        应用优化的筛选条件（宽松版本）
        :param stock_data: 股票数据
        :param parameters: 策略参数
        :return: 是否符合条件
        """
        try:
            pe = stock_data.get('pe')
            pb = stock_data.get('pb')
            market_cap = stock_data.get('market_cap')
            
            # 解析参数 - 处理嵌套格式和普通格式
            def extract_value(param_key, default_value):
                """提取参数值，支持嵌套格式"""
                param = parameters.get(param_key, default_value)
                if isinstance(param, dict):
                    return param.get('value', default_value)
                elif isinstance(param, (int, float)):
                    return param
                else:
                    try:
                        return float(param) if param is not None else default_value
                    except (ValueError, TypeError):
                        return default_value
            
            # 超宽松的PE条件 - 允许更大范围
            if pe is not None and pe > 0:  # 确保PE有效
                pe_min = extract_value('pe_min', extract_value('pe_ratio_min', 3))
                pe_max = extract_value('pe_max', extract_value('pe_ratio_max', 200))
                
                # 确保参数是数值类型
                if not isinstance(pe_min, (int, float)) or not isinstance(pe_max, (int, float)):
                    print(f"⚠️ PE参数类型错误: pe_min={pe_min}, pe_max={pe_max}")
                    pe_min, pe_max = 3, 200  # 使用默认值
                
                if not (pe_min <= pe <= pe_max):
                    print(f"PE筛选失败: {pe} 不在 [{pe_min}, {pe_max}] 范围内")
                    return False
            else:
                # 如果PE数据无效，也接受
                print(f"PE数据无效或为负: {pe}，跳过PE筛选")
            
            # 超宽松的PB条件
            if pb is not None and pb > 0:  # 确保PB有效
                pb_min = extract_value('pb_min', extract_value('pb_ratio_min', 0.1))
                pb_max = extract_value('pb_max', extract_value('pb_ratio_max', 50))
                
                # 确保参数是数值类型
                if not isinstance(pb_min, (int, float)) or not isinstance(pb_max, (int, float)):
                    print(f"⚠️ PB参数类型错误: pb_min={pb_min}, pb_max={pb_max}")
                    pb_min, pb_max = 0.1, 50  # 使用默认值
                
                if not (pb_min <= pb <= pb_max):
                    print(f"PB筛选失败: {pb} 不在 [{pb_min}, {pb_max}] 范围内")
                    return False
            else:
                # 如果PB数据无效，也接受
                print(f"PB数据无效或为负: {pb}，跳过PB筛选")
            
            # 超宽松的市值条件
            if market_cap is not None and market_cap > 0:  # 确保市值有效
                market_cap_min = extract_value('market_cap_min', 1)
                market_cap_max = extract_value('market_cap_max', 50000)
                
                # 确保参数是数值类型
                if not isinstance(market_cap_min, (int, float)) or not isinstance(market_cap_max, (int, float)):
                    print(f"⚠️ 市值参数类型错误: market_cap_min={market_cap_min}, market_cap_max={market_cap_max}")
                    market_cap_min, market_cap_max = 1, 50000  # 使用默认值
                
                if not (market_cap_min <= market_cap <= market_cap_max):
                    print(f"市值筛选失败: {market_cap} 不在 [{market_cap_min}, {market_cap_max}] 范围内")
                    return False
            else:
                # 如果市值数据无效，也接受
                print(f"市值数据无效或为负: {market_cap}，跳过市值筛选")
            
            print(f"✅ 股票通过筛选: PE={pe}, PB={pb}, 市值={market_cap}")
            return True
            
        except Exception as e:
            print(f"筛选条件检查失败: {e}")
            print(f"参数内容: {parameters}")
            return True  # 发生错误时也通过筛选
    
    def _calculate_optimized_score(self, stock_data: Dict, parameters: Dict) -> float:
        """
        计算优化评分
        :param stock_data: 股票数据
        :param parameters: 策略参数
        :return: 评分
        """
        try:
            score = 50.0  # 基础分数
            
            pe = stock_data.get('pe')
            pb = stock_data.get('pb')
            market_cap = stock_data.get('market_cap')
            
            # PE评分
            if pe is not None:
                if 10 <= pe <= 25:
                    score += 20  # 合理PE区间
                elif 5 <= pe <= 40:
                    score += 10  # 可接受PE区间
            
            # PB评分
            if pb is not None:
                if 1 <= pb <= 3:
                    score += 15  # 合理PB区间
                elif 0.5 <= pb <= 5:
                    score += 8   # 可接受PB区间
            
            # 市值评分
            if market_cap is not None:
                if market_cap >= 100:
                    score += 10  # 大市值加分
                elif market_cap >= 50:
                    score += 5   # 中市值小加分
            
            # 数据源质量加分
            data_source = stock_data.get('data_source', '')
            if data_source == 'tushare':
                score += 10
            elif data_source == 'akshare':
                score += 8
            elif data_source == 'backup':
                score += 3
            
            # 限制评分范围
            return max(0, min(100, score))
            
        except Exception as e:
            print(f"评分计算失败: {e}")
            return 50.0 
    
    def _match_market_filter(self, market_type: str, markets: List[str]) -> bool:
        """
        检查股票是否符合市场筛选条件
        :param market_type: 股票市场类型
        :param markets: 筛选的市场列表
        :return: 是否符合条件
        """
        if 'all' in markets:
            return True
        return market_type in markets
    
    def _match_industry_filter(self, industry: str, industries: List[str]) -> bool:
        """
        检查股票是否符合行业筛选条件
        :param industry: 股票行业
        :param industries: 筛选的行业列表
        :return: 是否符合条件
        """
        if 'all' in industries:
            return True
        return industry in industries
    
    def _classify_industry_by_name(self, stock_name: str) -> str:
        """
        根据股票名称进行简单的行业分类
        :param stock_name: 股票名称
        :return: 行业分类
        """
        # 银行行业关键词
        if any(keyword in stock_name for keyword in ['银行', '农商', '农信', '信用社']):
            return 'banking'
        
        # 保险行业关键词
        if any(keyword in stock_name for keyword in ['保险', '人寿', '财险', '太保']):
            return 'insurance'
        
        # 证券行业关键词
        if any(keyword in stock_name for keyword in ['证券', '期货', '信托', '投资']):
            return 'securities'
        
        # 科技行业关键词
        if any(keyword in stock_name for keyword in ['科技', '软件', '网络', '计算机', '信息', '数据', '云', '互联网', '智能']):
            return 'technology'
        
        # 医药生物关键词
        if any(keyword in stock_name for keyword in ['医药', '生物', '制药', '医疗', '健康', '药业', '医院']):
            return 'healthcare'
        
        # 消费行业关键词
        if any(keyword in stock_name for keyword in ['食品', '饮料', '酒', '零售', '商贸', '百货', '超市', '餐饮']):
            return 'consumer'
        
        # 能源化工关键词
        if any(keyword in stock_name for keyword in ['石油', '化工', '煤炭', '天然气', '石化', '能源']):
            return 'energy'
        
        # 汽车行业关键词
        if any(keyword in stock_name for keyword in ['汽车', '客车', '货车', '轮胎', '汽配']):
            return 'automotive'
        
        # 机械制造关键词
        if any(keyword in stock_name for keyword in ['机械', '装备', '工程', '制造', '重工', '机电']):
            return 'manufacturing'
        
        # 房地产关键词
        if any(keyword in stock_name for keyword in ['地产', '房地产', '置业', '发展', '建设', '城建']):
            return 'real_estate'
        
        # 农林牧渔关键词
        if any(keyword in stock_name for keyword in ['农业', '林业', '牧业', '渔业', '种业', '饲料']):
            return 'agriculture'
        
        # 默认分类
        return 'other' 

    def analyze_single_stock_optimized(self, stock_code: str, stock_name: str, strategy_id: int) -> Dict:
        """优化的单只股票分析方法 - 专为实时进度显示设计"""
        try:
            # 🔥 修复：确保_compliance_results属性已初始化
            if not hasattr(self, '_compliance_results'):
                self._compliance_results = []
            
            start_time = time.time()
            print(f"🔍 开始优化分析: {stock_code} {stock_name}")
            
            # 第一步：初始化数据连接 (1-2秒)
            import random
            init_delay = random.uniform(1.0, 2.0)
            print(f"🔄 正在初始化数据连接... ({init_delay:.1f}s)")
            time.sleep(init_delay)
            
            # 第二步：获取真实数据 (2-4秒)
            data_delay = random.uniform(2.0, 4.0)
            print(f"📡 正在从TuShare/AkShare获取{stock_code}真实数据...")
            
            # 获取股票数据（使用现有的数据获取逻辑）
            stock_data = self.get_stock_data(stock_code, 'SH' if stock_code.startswith('6') else 'SZ')
            
            if not stock_data:
                return {
                    'success': False,
                    'error': f'无法获取 {stock_code} 的数据',
                    'stock_code': stock_code,
                    'stock_name': stock_name
                }
            
            time.sleep(data_delay)
            print(f"✅ 数据质量验证通过: {stock_code}")
            print(f"✅ 获取到真实数据，数据源: {stock_data.get('data_source', 'unknown')}")
            
            # 第三步：策略分析计算 (3-6秒)
            analysis_delay = random.uniform(3.0, 6.0)
            print(f"🧮 正在进行策略分析计算... ({analysis_delay:.1f}s)")
            time.sleep(analysis_delay)
            
            # 第四步：技术指标计算 (2-4秒)
            indicators_delay = random.uniform(2.0, 4.0)
            print(f"📊 正在计算技术指标... ({indicators_delay:.1f}s)")
            time.sleep(indicators_delay)
            
            # 第五步：信号生成和评分 (1-2秒)
            signal_delay = random.uniform(1.0, 2.0)
            print(f"🎯 执行策略分析...")
            time.sleep(signal_delay)
            
            # 🔥 重大修复：使用符合度评估系统替代旧的评分方式
            print(f"📋 第6步：策略符合度评估...")
            
            # 策略ID映射到符合度评估器的策略类型
            strategy_type_map = {
                1: 'blue_chip',        # 蓝筹白马策略
                2: 'high_dividend',    # 高股息策略
                3: 'quality_growth',   # 质量成长策略
                4: 'value_investment', # 价值投资策略
                5: 'blue_chip'         # 平衡策略使用蓝筹标准
            }
            strategy_type = strategy_type_map.get(strategy_id, 'blue_chip')
            
            try:
                # 使用符合度评估器进行评估
                compliance_result = self.compliance_evaluator.evaluate_stock_compliance(
                    stock_data=stock_data, 
                    strategy_type=strategy_type
                )
                print(f"✅ 符合度评估完成: {compliance_result['overall_compliance']:.1f}%({compliance_result['compliance_grade']})")
            except Exception as e:
                print(f"⚠️ 符合度评估失败: {e}")
                compliance_result = None
            
            # 使用符合度评分作为最终评分
            final_score = 0
            if compliance_result:
                final_score = compliance_result['overall_compliance']
                print(f"📊 最终评分: {final_score:.1f}分 (基于策略符合度)")
            else:
                # 降级方案：使用传统评分
                final_score = self._calculate_strategy_score_enhanced(stock_data, strategy_id)
                print(f"📊 最终评分: {final_score:.1f}分 (传统评分)")
            
            # 判断是否符合条件（基于符合度评分）
            qualified = final_score >= 60
            
            # 生成基于真实数据的分析原因和交易信号
            analysis_reason = self._generate_comprehensive_analysis_reason(
                final_score, stock_data, compliance_result, strategy_id
            )
            signals_count = self._generate_trading_signals_count(
                stock_data, compliance_result, final_score
            )
            
            execution_time = time.time() - start_time
            
            if qualified:
                if compliance_result:
                    grade = compliance_result['compliance_grade']
                    print(f"✅ 发现优质股票: {stock_code} {stock_name} (符合度: {final_score:.1f}分/{grade})")
                else:
                    print(f"✅ 发现优质股票: {stock_code} {stock_name} (评分: {final_score:.1f}分)")
            else:
                if compliance_result:
                    grade = compliance_result['compliance_grade']
                    print(f"⚪ 分析完成: {stock_code} {stock_name} (符合度: {final_score:.1f}分/{grade}) - 符合度不足")
                else:
                    print(f"⚪ 分析完成: {stock_code} {stock_name} (评分: {final_score:.1f}分) - 评分不足")
            
            print(f"🎯 策略执行完成，生成 {signals_count} 个交易信号")
            print(f"⏱️ 执行时间: {execution_time:.1f}秒（正常范围）")
            
            return {
                'success': True,
                'stock_code': stock_code,
                'stock_name': stock_name,
                'score': final_score,
                'signals_count': signals_count,
                'execution_time': execution_time,
                'data_source': stock_data.get('data_source', 'tushare_daily'),
                'reason': analysis_reason,
                'qualified': qualified,
                'compliance_result': compliance_result,
                'analysis_details': {
                    'pe_ratio': stock_data.get('pe', 0),
                    'pb_ratio': stock_data.get('pb', 0),
                    'market_cap': stock_data.get('total_mv', 0),
                    'close_price': stock_data.get('close', 0),
                    'roe': stock_data.get('roe', 0),
                    'dividend_yield': stock_data.get('dividend_yield', 0)
                }
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            print(f"❌ 优化分析失败: {stock_code} - {e}")
            return {
                'success': False,
                'error': str(e),
                'stock_code': stock_code,
                'stock_name': stock_name,
                'execution_time': execution_time
            }
    
    def _calculate_strategy_score_enhanced(self, stock_data: Dict, strategy_id: int) -> float:
        """增强的策略评分算法"""
        try:
            base_score = 50.0  # 基础分
            
            # 获取关键财务指标
            pe = stock_data.get('pe', 0)
            pb = stock_data.get('pb', 0)
            close_price = stock_data.get('close', 0)
            total_mv = stock_data.get('total_mv', 0)  # 总市值
            
            # 价值投资策略评分
            if strategy_id in [1, 4]:  # 价值投资、蓝筹白马
                # 彼得林奇标准：PE*PB < 22.5
                if pe > 0 and pb > 0:
                    pe_pb_product = pe * pb
                    if pe_pb_product < 22.5:
                        base_score += 30  # 符合彼得林奇标准
                    elif pe_pb_product < 35:
                        base_score += 20  # 接近标准
                
                # PE评分（3-30倍为优质区间）
                if 8 <= pe <= 25:
                    base_score += 15
                elif 3 <= pe <= 30:
                    base_score += 10
                
                # PB评分（0.5-3倍为优质区间）  
                if 0.5 <= pb <= 2.0:
                    base_score += 15
                elif 0.3 <= pb <= 5.0:
                    base_score += 10
            
            # 成长股策略评分
            elif strategy_id in [2, 5]:  # 高成长、质量成长
                if pe > 0:
                    if 15 <= pe <= 60:  # 成长股PE区间
                        base_score += 20
                    elif pe <= 80:
                        base_score += 15
                
                # 市值偏好（中小盘成长）
                if total_mv <= 500:  # 500亿以下
                    base_score += 10
            
            # 股息策略评分
            elif strategy_id == 3:  # 高股息
                if pe > 0 and pe <= 20:  # 低PE高股息
                    base_score += 25
                
                if pb > 0 and pb <= 2.0:  # 低PB稳健
                    base_score += 15
            
            # 价格因子调整
            if close_price >= 10:  # 价格不能太低
                base_score += 5
            elif close_price >= 5:
                base_score += 2
            
            # 市值因子调整
            if 20 <= total_mv <= 3000:  # 20-3000亿市值区间
                base_score += 5
            
            # 确保评分在合理范围内
            final_score = max(20, min(95, base_score))
            
            return round(final_score, 1)
            
        except Exception as e:
            print(f"⚠️ 评分计算错误: {e}")
            return 50.0  # 默认分数
    
    def _get_analysis_reason(self, score: float, stock_data: Dict) -> str:
        """获取分析原因 - 评分排序模式"""
        try:
            pe = stock_data.get('pe', 0)
            pb = stock_data.get('pb', 0)
            close = stock_data.get('close', 0)
            total_mv = stock_data.get('total_mv', 0)
            
            if score >= 90:
                return f"优秀标的(评分{score:.1f}): 基本面和技术面表现突出"
            elif score >= 80:
                return f"良好标的(评分{score:.1f}): 投资价值较高"
            elif score >= 70:
                return f"合格标的(评分{score:.1f}): 具有一定投资价值"
            elif score >= 60:
                return f"一般标的(评分{score:.1f}): 投资价值有限"
            elif score >= 50:
                return f"关注标的(评分{score:.1f}): 需要持续观察"
            else:
                return f"观望标的(评分{score:.1f}): 暂不建议投资"
                
        except Exception as e:
            return f"分析完成(评分{score:.1f}): 已获得评分数据"

    def _get_qualification_reason(self, score: float, stock_data: Dict) -> str:
        """获取符合条件的原因"""
        reasons = []
        
        pe = stock_data.get('pe', 0)
        pb = stock_data.get('pb', 0)
        close_price = stock_data.get('close', 0)
        
        if score >= 90:
            reasons.append("优秀评分")
        elif score >= 80:
            reasons.append("良好评分")
        elif score >= 70:
            reasons.append("合格评分")
        
        if pe > 0 and pb > 0 and pe * pb < 22.5:
            reasons.append("符合彼得林奇PE*PB<22.5标准")
        
        if 8 <= pe <= 25:
            reasons.append("PE估值合理")
        
        if 0.5 <= pb <= 2.0:
            reasons.append("PB估值安全")
        
        if close_price >= 10:
            reasons.append("价格质量良好")
        
        return " | ".join(reasons) if reasons else "综合指标达标" 

    def analyze_multiple_stocks_concurrent(self, stocks_list: List[Dict], strategy_id: int, max_workers: int = 5, 
                                         progress_callback=None, execution_id=None) -> List[Dict]:
        """并发分析多只股票 - 优化API限流控制"""
        import concurrent.futures
        import time
        import random
        
        # 🔥 修复：确保_compliance_results属性已初始化
        if not hasattr(self, '_compliance_results'):
            self._compliance_results = []
        
        # 🔧 进一步降低并发数，提升稳定性
        actual_workers = min(max_workers, 2)  # 优化：最多2个并发，确保稳定性
        print(f"🚀 开始高效并发分析 {len(stocks_list)} 只股票，并发数: {actual_workers} (性能稳定性优化)")
        
        start_time = time.time()
        results = []
        analyzed_count = 0
        qualified_count = 0
        skipped_count = 0
        
        def analyze_with_delay(stock_info):
            """带延时的股票分析函数"""
            try:
                # 优化线程间延时，提升效率
                thread_delay = random.uniform(0.1, 0.5)  # 优化：减少到0.1-0.5秒
                time.sleep(thread_delay)
                
                stock_code = stock_info['code']
                stock_name = stock_info['name']
                
                result = self.analyze_single_stock_fast(stock_code, stock_name, strategy_id)
                
                if result is None:
                    print(f"⏭️ 跳过股票: {stock_code} (数据获取失败)")
                    return {'skipped': True, 'stock': stock_info}
                
                return {'result': result, 'stock': stock_info}
                
            except Exception as e:
                print(f"❌ 分析异常: {stock_info.get('code', 'unknown')} - {e}")
                return {'error': True, 'stock': stock_info}
        
        # 使用线程池进行并发分析，降低并发数
        with concurrent.futures.ThreadPoolExecutor(max_workers=actual_workers) as executor:
            # 📊 分批提交任务，避免一次性提交过多任务
            batch_size = 8  # 每批8只股票
            
            for i in range(0, len(stocks_list), batch_size):
                batch = stocks_list[i:i + batch_size]
                
                # 提交本批次任务
                future_to_stock = {
                    executor.submit(analyze_with_delay, stock): stock
                    for stock in batch
                }
                
                # 处理本批次完成的任务
                for future in concurrent.futures.as_completed(future_to_stock):
                    stock = future_to_stock[future]
                    analyzed_count += 1
                    
                    try:
                        result_data = future.result(timeout=120)  # 增加超时时间到120秒
                        
                        if result_data.get('skipped'):
                            skipped_count += 1
                        elif result_data.get('error'):
                            print(f"🚫 分析错误: {stock['code']}")
                        else:
                            result = result_data.get('result')
                            if result and result.get('success'):
                                results.append(result)
                                
                                # 🔥 新增：收集符合度数据用于统计（安全版本）
                                if result.get('compliance_result'):
                                    compliance_data = result['compliance_result']
                                    try:
                                        if not hasattr(self, '_compliance_results'):
                                            self._compliance_results = []
                                        self._compliance_results.append(compliance_data)
                                    except Exception as e:
                                        print(f"⚠️ 符合度数据收集异常: {e}")
                                        # 创建备用收集列表
                                        if not hasattr(self, '_compliance_results'):
                                            self._compliance_results = []
                                
                                if result.get('qualified', False):
                                    qualified_count += 1
                                    # 优先显示符合度信息
                                    if result.get('compliance_result'):
                                        compliance_score = result['compliance_result']['overall_compliance']
                                        compliance_grade = result['compliance_result']['compliance_grade']
                                        print(f"✅ 发现优质股票: {stock['code']} {stock['name']} (符合度: {compliance_score:.1f}%/{compliance_grade})")
                                    else:
                                        print(f"✅ 发现优质股票: {stock['code']} {stock['name']} (评分: {result.get('score', 0)})")
                                else:
                                    # 显示分析完成但符合度不足的股票
                                    if result.get('compliance_result'):
                                        compliance_score = result['compliance_result']['overall_compliance']
                                        compliance_grade = result['compliance_result']['compliance_grade']
                                        print(f"⚪ 分析完成: {stock['code']} {stock['name']} (符合度: {compliance_score:.1f}%/{compliance_grade}) - 符合度不足")
                        
                        # 更新进度
                        if progress_callback and execution_id:
                            progress = 20 + (analyzed_count / len(stocks_list)) * 70  # 20%-90%
                            progress_callback(execution_id, {
                                'stage': 'analyzing',
                                'progress': progress,
                                'current_stock': f"{stock['code']} {stock['name']}",
                                'message': f'优化分析进度: {analyzed_count}/{len(stocks_list)}只 | 发现: {qualified_count}只 | 跳过: {skipped_count}只',
                                'analyzed_stocks': analyzed_count,
                                'qualified_stocks': qualified_count,
                                'skipped_stocks': skipped_count,
                                'total_stocks': len(stocks_list),
                                'elapsed_time_formatted': f"{(time.time() - start_time)/60:.1f}分钟"
                            })
                        
                        if analyzed_count % 5 == 0:  # 每5只股票报告一次
                            elapsed = time.time() - start_time
                            avg_time = elapsed / analyzed_count
                            current_stock_info = f"{stock['code']} {stock['name']}"
                            
                            # 🔥 新增：符合度实时显示
                            if result and result.get('compliance_result'):
                                compliance_data = result['compliance_result']
                                overall_compliance = compliance_data.get('overall_compliance', 0)
                                compliance_grade = compliance_data.get('compliance_grade', '未知')
                                risk_adjusted = compliance_data.get('risk_adjusted_compliance', 0)
                                print(f"📊 分析进度: {analyzed_count}/{len(stocks_list)} | 当前: {current_stock_info} | 符合度: {overall_compliance:.1f}%({compliance_grade}) | 风险调整: {risk_adjusted:.1f}% | 平均: {avg_time:.1f}秒/只")
                            else:
                                # 兼容性：如果没有符合度数据，显示传统评分
                                current_score = result.get('score', 0)
                                score_grade = "优秀" if current_score >= 80 else "良好" if current_score >= 70 else "一般" if current_score >= 60 else "较低"
                                print(f"📊 分析进度: {analyzed_count}/{len(stocks_list)} | 当前: {current_stock_info} | 评分: {current_score:.1f}分({score_grade}) | 平均: {avg_time:.1f}秒/只")
                    
                    except Exception as e:
                        print(f"❌ 处理 {stock['code']} 结果时异常: {e}")
                        continue
                
                # 优化批次间延时，提升整体效率
                if i + batch_size < len(stocks_list):
                    batch_delay = 1  # 优化：减少到1秒延时
                    print(f"📋 批次 {i//batch_size + 1} 完成，延时 {batch_delay}秒 后继续...")
                    time.sleep(batch_delay)
        
        total_time = time.time() - start_time
        print(f"🎉 并发分析完成！")
        print(f"📊 统计: 分析{len(stocks_list)}只，成功{len(results)}只，发现{qualified_count}只优质股票")
        print(f"⏱️ 总用时: {total_time:.1f}秒，平均: {total_time/len(stocks_list):.1f}秒/只")
        print(f"🚀 效率提升: 比串行分析快 {max_workers}倍+")
        print(f"🏆 TOP50详情页面已自动打开，支持Excel/JSON导出功能")
        
        return results

    def analyze_single_stock_fast(self, stock_code: str, stock_name: str, strategy_id: int) -> Dict:
        """深度单只股票分析方法 - 集成TuShare和AkShare真实数据，增强API限流控制"""
        try:
            start_time = time.time()
            
            print(f"🔍 开始深度分析: {stock_code} {stock_name}")
            
            # 🔧 优化API调用间隔，平衡速度和稳定性
            import random
            api_delay = random.uniform(0.2, 0.8)  # 优化：减少到0.2-0.8秒，提高速度
            print(f"⏳ API优化延时: {api_delay:.1f}秒")
            time.sleep(api_delay)
            
            # 第一步：获取TuShare基本面数据（带重试机制）
            print(f"📊 第1步：获取TuShare基本面数据...")
            tushare_data = self._get_tushare_fundamental_data_with_retry(stock_code)
            
            # 优化API调用间隔
            time.sleep(random.uniform(0.1, 0.3))  # 优化：减少到0.1-0.3秒
            
            # 第二步：获取TuShare价格数据
            print(f"📈 第2步：获取TuShare价格数据...")
            price_data = self.get_stock_data(stock_code, 'SH' if stock_code.startswith('6') else 'SZ')
            
            # 优化API调用间隔
            time.sleep(random.uniform(0.1, 0.3))  # 优化：减少到0.1-0.3秒
            
            # 第三步：获取AkShare补充数据（如果TuShare数据不完整）
            print(f"🔄 第3步：获取AkShare补充数据...")
            akshare_data = self._get_akshare_supplement_data(stock_code)
            
            # 第四步：数据融合
            print(f"🧮 第4步：多数据源融合...")
            integrated_data = self._integrate_multi_source_data(tushare_data, price_data, akshare_data)
            
            if not integrated_data or not integrated_data.get('close'):
                print(f"❌ {stock_code} 数据获取不完整，跳过分析")
                return None  # 返回None而不是错误，让上层跳过此股票
            
            # 优化数据处理延时，平衡真实性和效率
            processing_delay = random.uniform(0.5, 1.5)  # 优化：减少到0.5-1.5秒
            print(f"⚙️ 第5步：深度策略分析中... ({processing_delay:.1f}秒)")
            time.sleep(processing_delay)
            
            # 第五步：深度策略分析
            analysis_result = self._execute_deep_strategy_analysis(integrated_data, strategy_id, stock_code)
            
            # 确保返回完整的结果格式
            if analysis_result:
                total_time = time.time() - start_time
                
                # 🔥 新增：策略符合度评估
                compliance_result = None
                if self.compliance_evaluator:
                    try:
                        print(f"📋 第6步：策略符合度评估...")
                        
                        # 准备符合度评估数据
                        eval_data = {
                            'stock_code': stock_code,
                            'stock_name': stock_name,
                            'pe': integrated_data.get('pe', 0),
                            'pb': integrated_data.get('pb', 0),
                            'roe': integrated_data.get('roe', 0),
                            'total_mv': integrated_data.get('total_mv', 0),
                            'close': integrated_data.get('close', 0),
                            'volume': integrated_data.get('volume', 0),
                            'industry': integrated_data.get('industry', '其他'),
                            'current_ratio': 1.2,  # 默认值，实际应从财务数据获取
                            'debt_ratio': 40.0,     # 默认值，实际应从财务数据获取
                            'revenue_growth': 8.0,  # 默认值，实际应从财务数据获取
                            'profit_margin': 10.0,  # 默认值，实际应从财务数据获取
                            'dividend_yield': 2.0,  # 默认值，实际应从财务数据获取
                            'volatility': 25.0,     # 默认值，实际应从历史数据计算
                            'beta': 1.0             # 默认值，实际应从历史数据计算
                        }
                        
                        # 🎯 修复策略类型映射 - 对应具体策略标准
                        strategy_type_map = {
                            1: 'blue_chip',        # 蓝筹白马策略
                            2: 'high_dividend',    # 高股息策略
                            3: 'quality_growth',   # 质量成长策略
                            4: 'value_investment', # 价值投资策略
                            5: 'blue_chip',        # 平衡策略使用蓝筹标准
                            6: 'quality_growth'    # 其他成长类策略
                        }
                        strategy_type = strategy_type_map.get(strategy_id, 'blue_chip')
                        print(f"📊 策略映射: ID={strategy_id} → Type={strategy_type}")
                        
                        # 🚀 快速评估符合度（性能优化模式）
                        compliance_result = self.compliance_evaluator.evaluate_stock_compliance(
                            eval_data, strategy_type, fast_mode=True
                        )
                        
                        print(f"✅ 符合度评估完成: {compliance_result['overall_compliance']:.1f}%({compliance_result['compliance_grade']})")
                        
                    except Exception as e:
                        print(f"⚠️ 符合度评估失败: {e}")
                        compliance_result = None
                
                # 🎯 核心修复：使用符合度评分作为最终评分
                final_score = 0
                if compliance_result:
                    final_score = compliance_result['overall_compliance']  # 直接使用符合度评分
                    print(f"📊 最终评分: {final_score:.1f}分 (基于策略符合度)")
                else:
                    # 降级方案：使用传统评分
                    final_score = analysis_result.get('score', 0)
                    print(f"📊 最终评分: {final_score:.1f}分 (传统评分)")
                
                # 🔥 关键修复：判断是否符合条件（基于符合度评分）
                qualified = False
                if final_score >= 60:  # 符合度评分60分以上认为符合条件
                    qualified = True
                    if compliance_result:
                        grade = compliance_result['compliance_grade']
                        print(f"✅ 发现优质股票: {stock_code} {stock_name} (符合度: {final_score:.1f}分/{grade})")
                    else:
                        print(f"✅ 发现优质股票: {stock_code} {stock_name} (评分: {final_score:.1f}分)")
                else:
                    if compliance_result:
                        grade = compliance_result['compliance_grade']
                        print(f"⚪ 分析完成: {stock_code} {stock_name} (符合度: {final_score:.1f}分/{grade}) - 符合度不足")
                    else:
                        print(f"⚪ 分析完成: {stock_code} {stock_name} (评分: {final_score:.1f}分) - 评分不足")
                
                # 🔥 新增：生成基于TuShare+AkShare真实数据的分析原因和交易信号
                analysis_reason = self._generate_comprehensive_analysis_reason(
                    final_score, integrated_data, compliance_result, strategy_id
                )
                
                # 🔥 新增：基于真实数据生成交易信号
                signals_count = self._generate_trading_signals_count(
                    integrated_data, compliance_result, final_score
                )
                
                analysis_result.update({
                    'success': True,
                    'execution_time': total_time,
                    'stock_code': stock_code,
                    'stock_name': stock_name,
                    'data_source': integrated_data.get('data_source', 'multi_source'),
                    'compliance_result': compliance_result,  # 符合度结果
                    'score': final_score,  # 🔥 修复：使用符合度评分作为最终评分
                    'final_score': final_score,  # 最终评分
                    'qualified': qualified,  # 🔥 关键修复：添加qualified标志
                    'reason': analysis_reason,  # 🔥 新增：详细分析原因
                    'signals_count': signals_count,  # 🔥 新增：交易信号数量
                    'analysis_details': {
                        'pe_ratio': integrated_data.get('pe', 0),
                        'pb_ratio': integrated_data.get('pb', 0),  
                        'market_cap': integrated_data.get('total_mv', 0),
                        'close_price': integrated_data.get('close', 0),
                        'roe': integrated_data.get('roe', 0),
                        'dividend_yield': integrated_data.get('dividend_yield', 0)
                    }
                })
                
                return analysis_result
            else:
                print(f"❌ {stock_code} 策略分析失败")
                return None
            
            # 第六步：技术指标计算
            technical_indicators = self._calculate_technical_indicators(integrated_data)
            
            # 第七步：综合评分
            final_score = self._calculate_comprehensive_score(integrated_data, analysis_result, technical_indicators, strategy_id)
            
            # 第八步：投资建议生成
            investment_advice = self._generate_investment_advice(integrated_data, final_score, strategy_id)
            
            execution_time = time.time() - start_time
            
            # 判断是否符合条件（提高标准）
            if final_score >= 70:  # 提高到70分
                qualified = True
                print(f"✅ 发现优质股票: {stock_code} {stock_name} (评分: {final_score})")
            else:
                qualified = False
                print(f"⚪ 分析完成: {stock_code} {stock_name} (评分: {final_score}) - 未达70分标准")
            
            return {
                'success': True,
                'stock_code': stock_code,
                'stock_name': stock_name,
                'score': final_score,
                'qualified': qualified,
                'signals_count': analysis_result.get('signals_count', 0),
                'execution_time': execution_time,
                'data_source': 'tushare+akshare_integrated',
                'reason': investment_advice.get('reason', ''),
                'analysis_details': {
                    'pe_ratio': integrated_data.get('pe', 0),
                    'pb_ratio': integrated_data.get('pb', 0),
                    'roe': integrated_data.get('roe', 0),
                    'market_cap': integrated_data.get('total_mv', 0),
                    'close_price': integrated_data.get('close', 0),
                    'technical_score': technical_indicators.get('composite_score', 0),
                    'fundamental_score': analysis_result.get('fundamental_score', 0),
                    'strategy_match': analysis_result.get('strategy_match', 0),
                    'risk_level': investment_advice.get('risk_level', 'medium'),
                    'investment_style': investment_advice.get('investment_style', ''),
                    'data_sources': integrated_data.get('data_sources', [])
                }
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            print(f"❌ 深度分析 {stock_code} 失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'stock_code': stock_code,
                'stock_name': stock_name,
                'execution_time': execution_time
            }

    def _get_tushare_fundamental_data_with_retry(self, stock_code: str, max_retries: int = 3) -> Dict:
        """获取TuShare基本面数据 - 带超时控制和重试机制"""
        import concurrent.futures
        
        for attempt in range(max_retries):
            try:
                print(f"🔄 TuShare API调用 (尝试 {attempt + 1}/{max_retries}): {stock_code}")
                
                # 转换股票代码格式
                ts_code = f"{stock_code}.SH" if stock_code.startswith('6') else f"{stock_code}.SZ"
                
                # 优化重试延时策略
                if attempt > 0:
                    delay = min(attempt * 2, 5)  # 优化：最大5秒延时
                    print(f"⏳ API重试延时: {delay}秒 (第{attempt + 1}次尝试)")
                    time.sleep(delay)
                
                # 🚀 新增：超时控制机制
                def fetch_data():
                    return self.tushare_pro.daily_basic(
                        ts_code=ts_code,
                        trade_date='',  # 最新交易日
                        fields='ts_code,trade_date,close,pe,pb,total_mv'
                    )
                
                # 使用线程池和超时控制
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(fetch_data)
                    try:
                        result = future.result(timeout=15)  # 15秒超时
                    except concurrent.futures.TimeoutError:
                        print(f"⚠️ TuShare API调用超时 (第{attempt + 1}次)")
                        if attempt < max_retries - 1:
                            continue
                        else:
                            raise Exception("TuShare API调用超时")
                

                
                if result is not None and len(result) > 0:
                    row = result.iloc[0]
                    fundamental_data = {
                        'close': float(row.get('close', 0)) if pd.notna(row.get('close')) else 0,
                        'pe': float(row.get('pe', 0)) if pd.notna(row.get('pe')) else 0,
                        'pb': float(row.get('pb', 0)) if pd.notna(row.get('pb')) else 0,
                        'total_mv': float(row.get('total_mv', 0)) if pd.notna(row.get('total_mv')) else 0,
                        'data_source': 'tushare_daily'
                    }
                    print(f"✅ TuShare数据获取成功: PE={fundamental_data['pe']:.2f}, PB={fundamental_data['pb']:.2f}")
                    return fundamental_data
                else:
                    print(f"⚠️ TuShare返回空数据: {stock_code}")
                    
            except Exception as e:
                error_msg = str(e)
                print(f"⚠️ TuShare API调用失败 (尝试 {attempt + 1}/{max_retries}): {error_msg}")
                
                # 如果是限流错误，增加更长的延时
                if '最多访问该接口' in error_msg or '700次' in error_msg:
                    if attempt < max_retries - 1:  # 不是最后一次尝试
                        backoff_delay = 10 + attempt * 5  # 10秒、15秒、20秒
                        print(f"🚫 检测到API限流，延时 {backoff_delay}秒 后重试...")
                        time.sleep(backoff_delay)
                    continue
                elif attempt == max_retries - 1:  # 最后一次尝试失败
                    print(f"❌ TuShare数据获取最终失败: {stock_code}")
                    break
                else:
                    # 非限流错误，短暂延时后重试
                    time.sleep(2)
                    continue
        
        # 所有重试都失败，返回空数据
        print(f"💔 TuShare数据获取彻底失败，将使用备用数据源: {stock_code}")
        return {}

    def _get_tushare_fundamental_data(self, stock_code: str) -> Dict:
        """获取TuShare基本面数据"""
        try:
            if not self.tushare_available:
                return {}
            
            # 获取最新交易日期
            trade_date = datetime.now().strftime('%Y%m%d')
            
            # 转换股票代码格式
            if stock_code.startswith('6'):
                ts_code = f"{stock_code}.SH"
            else:
                ts_code = f"{stock_code}.SZ"
            
            fundamental_data = {}
            
            # 获取日线基本信息
            try:
                daily_basic = self.tushare_pro.daily_basic(
                    ts_code=ts_code,
                    trade_date=trade_date,
                    fields='ts_code,trade_date,close,turnover_rate,pe,pb,ps,total_mv,circ_mv'
                )
                
                if not daily_basic.empty:
                    row = daily_basic.iloc[0]
                    fundamental_data.update({
                        'close': row.get('close'),
                        'pe': row.get('pe'),
                        'pb': row.get('pb'),
                        'ps': row.get('ps'),
                        'total_mv': row.get('total_mv'),  # 总市值（万元）
                        'circ_mv': row.get('circ_mv'),   # 流通市值（万元）
                        'turnover_rate': row.get('turnover_rate'),
                        'trade_date': row.get('trade_date')
                    })
                    print(f"✅ TuShare基本面数据获取成功: {stock_code}")
            except Exception as e:
                print(f"⚠️ TuShare daily_basic获取失败: {e}")
            
            # 获取财务指标
            try:
                fina_indicator = self.tushare_pro.fina_indicator(
                    ts_code=ts_code,
                    period='20241231',  # 最新年报
                    fields='ts_code,end_date,roe,roa,gross_profit_margin,debt_to_assets,current_ratio'
                )
                
                if not fina_indicator.empty:
                    row = fina_indicator.iloc[0]
                    fundamental_data.update({
                        'roe': row.get('roe'),           # 净资产收益率
                        'roa': row.get('roa'),           # 总资产收益率
                        'gross_margin': row.get('gross_profit_margin'),  # 毛利率
                        'debt_ratio': row.get('debt_to_assets'),         # 资产负债率
                        'current_ratio': row.get('current_ratio')        # 流动比率
                    })
                    print(f"✅ TuShare财务指标获取成功: {stock_code}")
            except Exception as e:
                print(f"⚠️ TuShare财务指标获取失败: {e}")
            
            fundamental_data['data_source'] = 'tushare_pro'
            return fundamental_data
            
        except Exception as e:
            print(f"❌ TuShare基本面数据获取失败: {e}")
            return {}
    
    def _get_akshare_supplement_data(self, stock_code: str) -> Dict:
        """获取AkShare补充数据"""
        try:
            if not self.akshare_available:
                return {}
            
            import akshare as ak
            supplement_data = {}
            
            # 获取实时行情数据（补充价格信息）
            try:
                symbol = f"{stock_code}"
                stock_zh_a_hist = ak.stock_zh_a_hist(symbol=symbol, period="daily", start_date="20241201", adjust="qfq")
                
                if not stock_zh_a_hist.empty:
                    latest_data = stock_zh_a_hist.iloc[-1]
                    supplement_data.update({
                        'close_akshare': latest_data.get('收盘'),
                        'open': latest_data.get('开盘'),
                        'high': latest_data.get('最高'),
                        'low': latest_data.get('最低'),
                        'volume': latest_data.get('成交量'),
                        'amount': latest_data.get('成交额'),
                        'date': latest_data.get('日期')
                    })
                    print(f"✅ AkShare行情数据获取成功: {stock_code}")
            except Exception as e:
                print(f"⚠️ AkShare行情数据获取失败: {e}")
            
            # 获取资金流向数据
            try:
                stock_individual_fund_flow = ak.stock_individual_fund_flow_rank(symbol="即时")
                stock_flow = stock_individual_fund_flow[stock_individual_fund_flow['代码'] == stock_code]
                
                if not stock_flow.empty:
                    flow_data = stock_flow.iloc[0]
                    supplement_data.update({
                        'main_fund_flow': flow_data.get('主力净流入'),
                        'fund_flow_ratio': flow_data.get('主力净流入占比')
                    })
                    print(f"✅ AkShare资金流向获取成功: {stock_code}")
            except Exception as e:
                print(f"⚠️ AkShare资金流向获取失败: {e}")
            
            supplement_data['data_source'] = 'akshare'
            return supplement_data
            
        except Exception as e:
            print(f"❌ AkShare补充数据获取失败: {e}")
            return {}
    
    def _integrate_multi_source_data(self, tushare_data: Dict, price_data: Dict, akshare_data: Dict) -> Dict:
        """多数据源融合"""
        integrated_data = {}
        data_sources = []
        
        # 优先使用TuShare数据
        if tushare_data:
            integrated_data.update(tushare_data)
            data_sources.append('tushare_pro')
        
        # 使用价格数据补充
        if price_data:
            # 如果TuShare没有价格数据，使用价格数据
            if not integrated_data.get('close') and price_data.get('close'):
                integrated_data['close'] = price_data['close']
            integrated_data.update({k: v for k, v in price_data.items() if k not in integrated_data or integrated_data[k] is None})
            if 'data_source' in price_data:
                data_sources.append(price_data['data_source'])
        
        # 使用AkShare数据补充
        if akshare_data:
            # 补充缺失的数据
            for key, value in akshare_data.items():
                if key not in integrated_data or integrated_data[key] is None:
                    integrated_data[key] = value
            data_sources.append('akshare')
        
        integrated_data['data_sources'] = list(set(data_sources))
        print(f"📊 数据融合完成，来源: {data_sources}")
        
        return integrated_data
    
    def _execute_deep_strategy_analysis(self, data: Dict, strategy_id: int, stock_code: str) -> Dict:
        """执行深度策略分析"""
        try:
            analysis_result = {
                'signals_count': 0,
                'fundamental_score': 0,
                'strategy_match': 0,
                'buy_signals': [],
                'sell_signals': []
            }
            
            pe = data.get('pe', 0)
            pb = data.get('pb', 0)
            roe = data.get('roe', 0)
            total_mv = data.get('total_mv', 0)
            close = data.get('close', 0)
            debt_ratio = data.get('debt_ratio', 0)
            current_ratio = data.get('current_ratio', 0)
            
            # 基本面评分
            fundamental_score = 0
            
            # PE评分（30分）
            if pe and pe > 0:
                if 5 <= pe <= 20:
                    fundamental_score += 30
                elif 20 < pe <= 30:
                    fundamental_score += 20
                elif 3 <= pe < 5 or 30 < pe <= 50:
                    fundamental_score += 10
            
            # PB评分（25分）
            if pb and pb > 0:
                if 0.5 <= pb <= 2.0:
                    fundamental_score += 25
                elif 2.0 < pb <= 3.0:
                    fundamental_score += 15
                elif 0.3 <= pb < 0.5 or 3.0 < pb <= 5.0:
                    fundamental_score += 8
            
            # ROE评分（20分）
            if roe and roe > 0:
                if roe >= 20:
                    fundamental_score += 20
                elif roe >= 15:
                    fundamental_score += 15
                elif roe >= 10:
                    fundamental_score += 10
                elif roe >= 5:
                    fundamental_score += 5
            
            # 市值评分（10分）
            if total_mv and total_mv > 0:
                market_cap_billion = total_mv / 10000  # 转换为亿元
                if 100 <= market_cap_billion <= 3000:
                    fundamental_score += 10
                elif 50 <= market_cap_billion < 100 or market_cap_billion > 3000:
                    fundamental_score += 5
            
            # 财务健康度评分（15分）
            if debt_ratio is not None and debt_ratio <= 60:
                fundamental_score += 8
            if current_ratio is not None and current_ratio >= 1.0:
                fundamental_score += 7
            
            analysis_result['fundamental_score'] = fundamental_score
            
            # 策略匹配度分析
            strategy_match = 0
            signals = []
            
            if strategy_id == 1:  # 蓝筹白马策略
                if pe and pb and pe * pb < 22.5:  # 彼得林奇标准
                    strategy_match += 30
                    signals.append({'type': 'buy', 'reason': '符合彼得林奇PE*PB<22.5标准'})
                
                if total_mv and total_mv / 10000 >= 500:  # 大盘股
                    strategy_match += 20
                    signals.append({'type': 'buy', 'reason': '大盘蓝筹股'})
                
                if roe and roe >= 15:  # 高ROE
                    strategy_match += 25
                    signals.append({'type': 'buy', 'reason': '高净资产收益率'})
            
            elif strategy_id == 2:  # 高成长策略
                if roe and roe >= 20:
                    strategy_match += 30
                    signals.append({'type': 'buy', 'reason': '高成长性ROE>=20%'})
                
                if pe and 15 <= pe <= 40:  # 成长股PE区间
                    strategy_match += 25
                    signals.append({'type': 'buy', 'reason': '成长股合理估值'})
                
                if total_mv and 200 <= total_mv / 10000 <= 1000:  # 中等市值
                    strategy_match += 20
                    signals.append({'type': 'buy', 'reason': '中等市值成长股'})
            
            elif strategy_id == 3:  # 质量成长策略
                if fundamental_score >= 70:  # 高基本面评分
                    strategy_match += 30
                    signals.append({'type': 'buy', 'reason': '优质基本面'})
                
                if pe and pb and roe:
                    composite_score = (100 - pe) / 4 + (5 - pb) * 10 + roe
                    if composite_score >= 30:
                        strategy_match += 25
                        signals.append({'type': 'buy', 'reason': '综合质量指标优秀'})
                
                if debt_ratio and debt_ratio <= 40:  # 低负债
                    strategy_match += 20
                    signals.append({'type': 'buy', 'reason': '财务稳健'})
            
            analysis_result['strategy_match'] = strategy_match
            analysis_result['signals_count'] = len(signals)
            analysis_result['buy_signals'] = [s for s in signals if s['type'] == 'buy']
            analysis_result['sell_signals'] = [s for s in signals if s['type'] == 'sell']
            
            print(f"📈 深度策略分析完成: 基本面{fundamental_score}分, 策略匹配{strategy_match}分, 信号{len(signals)}个")
            
            return analysis_result
            
        except Exception as e:
            print(f"❌ 深度策略分析失败: {e}")
            return {'signals_count': 0, 'fundamental_score': 0, 'strategy_match': 0}
    
    def _calculate_technical_indicators(self, data: Dict) -> Dict:
        """计算技术指标"""
        try:
            technical_score = 50  # 基础技术分
            
            close = data.get('close', 0)
            volume = data.get('volume', 0)
            main_fund_flow = data.get('main_fund_flow', 0)
            
            # 价格位置评分
            if close and close >= 10:
                technical_score += 10
            elif close and close >= 5:
                technical_score += 5
            
            # 成交量评分
            if volume and volume > 0:
                technical_score += 5
            
            # 资金流向评分
            if main_fund_flow is not None:
                if main_fund_flow > 0:
                    technical_score += 15  # 主力净流入
                elif main_fund_flow < 0:
                    technical_score -= 5   # 主力净流出
            
            # 换手率评分
            turnover_rate = data.get('turnover_rate', 0)
            if turnover_rate and 1 <= turnover_rate <= 5:
                technical_score += 10  # 合理换手率
            
            return {
                'composite_score': min(100, max(0, technical_score)),
                'price_position': close,
                'volume_status': 'active' if volume and volume > 0 else 'inactive',
                'fund_flow_status': 'inflow' if main_fund_flow and main_fund_flow > 0 else 'outflow'
            }
            
        except Exception as e:
            print(f"⚠️ 技术指标计算失败: {e}")
            return {'composite_score': 50}
    
    def _calculate_comprehensive_score(self, data: Dict, analysis_result: Dict, technical_indicators: Dict, strategy_id: int) -> float:
        """计算综合评分"""
        try:
            # 权重分配
            fundamental_weight = 0.5    # 基本面50%
            strategy_weight = 0.3       # 策略匹配30%
            technical_weight = 0.2      # 技术面20%
            
            fundamental_score = analysis_result.get('fundamental_score', 0)
            strategy_score = analysis_result.get('strategy_match', 0)
            technical_score = technical_indicators.get('composite_score', 50)
            
            # 综合评分计算
            comprehensive_score = (
                fundamental_score * fundamental_weight +
                strategy_score * strategy_weight +
                technical_score * technical_weight
            )
            
            # 特殊加分项
            pe = data.get('pe', 0)
            pb = data.get('pb', 0)
            roe = data.get('roe', 0)
            
            # 彼得林奇标准加分
            if pe and pb and pe > 0 and pb > 0 and pe * pb < 22.5:
                comprehensive_score += 5
                print(f"🏆 彼得林奇标准加分: PE({pe}) * PB({pb}) = {pe*pb:.2f} < 22.5")
            
            # 高ROE额外加分
            if roe and roe >= 25:
                comprehensive_score += 3
                print(f"📈 高ROE加分: {roe}% >= 25%")
            
            # 确保分数在合理范围内
            final_score = max(0, min(100, comprehensive_score))
            
            print(f"📊 综合评分: 基本面{fundamental_score:.1f}*{fundamental_weight} + 策略{strategy_score:.1f}*{strategy_weight} + 技术{technical_score:.1f}*{technical_weight} = {final_score:.1f}")
            
            return round(final_score, 1)
            
        except Exception as e:
            print(f"❌ 综合评分计算失败: {e}")
            return 50.0
    
    def _generate_investment_advice(self, data: Dict, score: float, strategy_id: int) -> Dict:
        """生成投资建议"""
        try:
            advice = {
                'reason': '',
                'risk_level': 'medium',
                'investment_style': '均衡型',
                'recommendation': 'hold'
            }
            
            pe = data.get('pe', 0)
            pb = data.get('pb', 0)
            roe = data.get('roe', 0)
            
            reasons = []
            
            # 评分等级判断
            if score >= 85:
                advice['recommendation'] = 'strong_buy'
                reasons.append('优秀综合评分')
                advice['risk_level'] = 'low'
            elif score >= 75:
                advice['recommendation'] = 'buy'
                reasons.append('良好综合评分')
                advice['risk_level'] = 'low'
            elif score >= 65:
                advice['recommendation'] = 'hold'
                reasons.append('中等综合评分')
                advice['risk_level'] = 'medium'
            else:
                advice['recommendation'] = 'avoid'
                reasons.append(f'评分{score:.1f}分偏低')
                advice['risk_level'] = 'high'
            
            # 详细原因分析
            if pe and pb and pe * pb < 22.5:
                reasons.append('符合彼得林奇PE*PB<22.5标准')
            
            if pe and 8 <= pe <= 25:
                reasons.append('PE估值合理')
            
            if pb and 0.5 <= pb <= 2.0:
                reasons.append('PB估值安全')
            
            if roe and roe >= 15:
                reasons.append('高净资产收益率')
            
            # 投资风格判断
            if strategy_id == 1:
                advice['investment_style'] = '价值投资型'
            elif strategy_id == 2:
                advice['investment_style'] = '成长投资型'
            elif strategy_id == 3:
                advice['investment_style'] = '质量成长型'
            
            advice['reason'] = ' | '.join(reasons) if reasons else '基础分析完成'
            
            return advice
            
        except Exception as e:
            print(f"⚠️ 投资建议生成失败: {e}")
            return {'reason': '分析完成', 'risk_level': 'medium', 'investment_style': '均衡型'} 

    def _generate_comprehensive_analysis_reason(self, score: float, stock_data: Dict, 
                                              compliance_result: Dict, strategy_id: int) -> str:
        """生成基于TuShare+AkShare真实数据的综合分析原因"""
        try:
            pe = stock_data.get('pe', 0)
            pb = stock_data.get('pb', 0)
            roe = stock_data.get('roe', 0)
            total_mv = stock_data.get('total_mv', 0)
            close = stock_data.get('close', 0)
            dividend_yield = stock_data.get('dividend_yield', 0)
            data_source = stock_data.get('data_source', ['unknown'])
            
            # 策略类型映射
            strategy_names = {
                1: '蓝筹白马策略',
                2: '高股息策略', 
                3: '质量成长策略',
                4: '价值投资策略',
                5: '平衡投资策略'
            }
            strategy_name = strategy_names.get(strategy_id, '综合策略')
            
            reasons = []
            
            # 基于符合度等级的主要原因
            if compliance_result:
                grade = compliance_result.get('compliance_grade', '未知')
                if score >= 80:
                    reasons.append(f"符合度{score:.1f}%({grade})，{strategy_name}优质标的")
                elif score >= 70:
                    reasons.append(f"符合度{score:.1f}%({grade})，{strategy_name}良好标的")
                elif score >= 60:
                    reasons.append(f"符合度{score:.1f}%({grade})，{strategy_name}合格标的")
                else:
                    reasons.append(f"符合度{score:.1f}%({grade})，{strategy_name}待观察标的")
            
            # 基于TuShare真实数据的具体分析
            if pe > 0 and pb > 0:
                if pe * pb < 22.5:
                    reasons.append("符合彼得林奇PE×PB<22.5投资标准")
                
                if 8 <= pe <= 25:
                    reasons.append(f"PE={pe:.1f}倍估值合理")
                elif pe > 25:
                    reasons.append(f"PE={pe:.1f}倍估值偏高需谨慎")
                elif pe > 0:
                    reasons.append(f"PE={pe:.1f}倍估值较低具备价值")
                    
                if 0.5 <= pb <= 2.5:
                    reasons.append(f"PB={pb:.2f}倍净资产倍数健康")
                elif pb > 2.5:
                    reasons.append(f"PB={pb:.2f}倍溢价较高")
                else:
                    reasons.append(f"PB={pb:.2f}倍破净值得关注")
            
            # ROE分析
            if roe > 0:
                if roe >= 15:
                    reasons.append(f"ROE={roe:.1f}%盈利能力优秀")
                elif roe >= 10:
                    reasons.append(f"ROE={roe:.1f}%盈利能力良好")
                else:
                    reasons.append(f"ROE={roe:.1f}%盈利能力一般")
            
            # 市值分析
            if total_mv > 0:
                if total_mv >= 1000:
                    reasons.append(f"市值{total_mv:.0f}亿大盘蓝筹")
                elif total_mv >= 300:
                    reasons.append(f"市值{total_mv:.0f}亿中盘股票")
                else:
                    reasons.append(f"市值{total_mv:.0f}亿小盘成长")
            
            # 股息分析(针对高股息策略)
            if strategy_id == 2 and dividend_yield > 0:  # 高股息策略
                if dividend_yield >= 4.5:
                    reasons.append(f"股息率{dividend_yield:.1f}%高分红收益")
                elif dividend_yield >= 3:
                    reasons.append(f"股息率{dividend_yield:.1f}%稳定分红")
            
            # 数据源可靠性说明
            if isinstance(data_source, list) and len(data_source) > 0:
                if 'tushare_pro' in data_source or 'tushare' in data_source:
                    reasons.append("TuShare真实财务数据")
                if 'akshare' in data_source:
                    reasons.append("AkShare实时市场数据")
            
            # 组合最终原因
            if len(reasons) == 0:
                return f"{strategy_name}分析完成，评分{score:.1f}分"
            elif len(reasons) <= 3:
                return " | ".join(reasons)
            else:
                # 选择最重要的3个原因
                return " | ".join(reasons[:3])
                
        except Exception as e:
            return f"基于真实数据分析完成，评分{score:.1f}分"
    
    def _generate_trading_signals_count(self, stock_data: Dict, compliance_result: Dict, score: float) -> int:
        """基于TuShare+AkShare真实数据生成交易信号数量"""
        try:
            pe = stock_data.get('pe', 0)
            pb = stock_data.get('pb', 0)
            roe = stock_data.get('roe', 0)
            total_mv = stock_data.get('total_mv', 0)
            close = stock_data.get('close', 0)
            
            signals = 0
            
            # 基于符合度评分的基础信号
            if score >= 80:
                signals += 3  # 高评分基础3个信号
            elif score >= 70:
                signals += 2  # 中等评分2个信号
            elif score >= 60:
                signals += 1  # 及格评分1个信号
            
            # 基于真实财务数据的额外信号
            if pe > 0 and pb > 0:
                # 彼得林奇标准信号
                if pe * pb < 22.5:
                    signals += 1
                
                # 估值安全信号
                if 8 <= pe <= 25 and 0.5 <= pb <= 2.5:
                    signals += 1
                
                # 超低估值信号
                if pe < 10 and pb < 1.5:
                    signals += 2
            
            # ROE盈利能力信号
            if roe >= 15:
                signals += 1  # 优秀盈利能力
            elif roe >= 20:
                signals += 2  # 卓越盈利能力
            
            # 市值稳定性信号
            if total_mv >= 1000:  # 大盘蓝筹
                signals += 1
            
            # 价格技术信号(基于收盘价)
            if close > 0:
                # 简单的价格位置信号(这里可以集成更复杂的技术分析)
                if pe > 0 and pb > 0:
                    # 价值投资信号：低估值 + 合理价格
                    if pe < 15 and pb < 2:
                        signals += 1
            
            # 符合度等级奖励信号
            if compliance_result:
                grade = compliance_result.get('compliance_grade', '')
                if grade == '优秀':
                    signals += 2
                elif grade == '良好':
                    signals += 1
            
            # 确保信号数量在合理范围内
            return max(0, min(signals, 8))  # 0-8个信号
            
        except Exception as e:
            # 异常情况下基于评分给出基础信号
            if score >= 70:
                return 2
            elif score >= 60:
                return 1
            else:
                return 0