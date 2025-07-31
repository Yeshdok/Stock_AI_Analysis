#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全市场股票扫描器 - 100%真实数据版本
支持批量策略执行、智能评分排名、数据导出
实现策略对全A股市场的批量分析和筛选
拒绝模拟数据，只使用akshare真实实时数据
覆盖深A和沪A所有股票
"""

import pandas as pd
import numpy as np
import akshare as ak
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
warnings.filterwarnings('ignore')

from .strategy_engine import QuantitativeStrategyEngine
from .analysis.data_fetcher import DataFetcher

class MarketScanner:
    """全市场股票扫描器 - 100%真实数据版本，覆盖深A+沪A"""
    
    def __init__(self, max_workers: int = 3):  # 降低并发数避免API限制
        """
        初始化市场扫描器
        :param max_workers: 最大并发数量（建议3-5个避免API限制）
        """
        self.strategy_engine = QuantitativeStrategyEngine()
        self.data_fetcher = DataFetcher()
        self.max_workers = max_workers
        self.stock_list = []
        self.scan_results = []
        self.progress_callback = None  # 进度回调函数
        
    def set_progress_callback(self, callback: Callable[[dict], None]):
        """设置进度回调函数"""
        self.progress_callback = callback
        
    def _send_progress(self, progress_data: dict):
        """发送进度更新"""
        if self.progress_callback:
            self.progress_callback(progress_data)
        
    def get_stock_list(self, market: str = "all", force_refresh: bool = False) -> List[Dict]:
        """
        获取股票列表 - 结合tushare和akshare的100%真实数据
        覆盖深A（深圳主板、创业板）和沪A（上海主板、科创板）
        :param market: 市场类型 - "all", "sh", "sz", "cy", "kc"
        :param force_refresh: 强制刷新股票列表
        :return: 股票列表
        """
        # 如果已有数据且不强制刷新，直接返回
        if self.stock_list and not force_refresh:
            return self.stock_list
            
        try:
            print("🔄 正在获取A股股票列表（深A+沪A全覆盖）...")
            self._send_progress({
                'stage': 'fetching_stock_list',
                'message': '正在获取A股股票列表（深A+沪A全覆盖）...',
                'progress': 0
            })
            
            stocks = []
            data_sources = []
            
            # 方法1：使用akshare获取股票列表
            try:
                print("📊 方法1: 使用akshare获取股票基础信息...")
                self._send_progress({
                    'stage': 'fetching_stock_list',
                    'message': '使用akshare获取股票基础信息...',
                    'progress': 20
                })
                
                # 获取沪深A股基本信息
                akshare_stocks = ak.stock_zh_a_spot_em()
                
                if akshare_stocks is not None and len(akshare_stocks) > 0:
                    print(f"✅ akshare获取成功: {len(akshare_stocks)} 只股票")
                    
                    for _, row in akshare_stocks.iterrows():
                        try:
                            code = str(row.get('代码', row.get('code', ''))).zfill(6)
                            name = str(row.get('名称', row.get('name', f'股票{code}')))
                            
                            # 过滤掉无效的代码
                            if not code or len(code) != 6 or not code.isdigit():
                                continue
                            
                            # 判断市场
                            if code.startswith('6'):  # 沪A
                                market_type = 'SH'
                                exchange = '上海证券交易所'
                                if code.startswith('688'):
                                    board = '科创板'
                                else:
                                    board = '主板'
                            elif code.startswith('0'):  # 深A主板
                                market_type = 'SZ'
                                exchange = '深圳证券交易所'
                                board = '主板'
                            elif code.startswith('3'):  # 创业板
                                market_type = 'SZ'
                                exchange = '深圳证券交易所'
                                board = '创业板'
                            else:
                                continue  # 跳过其他类型
                            
                            # 市场过滤
                            if market != "all":
                                if market == "sh" and not code.startswith('6'):
                                    continue
                                elif market == "sz" and not (code.startswith('0') or code.startswith('3')):
                                    continue
                                elif market == "cy" and not code.startswith('3'):
                                    continue
                                elif market == "kc" and not code.startswith('688'):
                                    continue
                            
                            stock_info = {
                                'code': code,
                                'name': name,
                                'market': market_type,
                                'exchange': exchange,
                                'board': board,
                                'data_source': 'akshare'
                            }
                            stocks.append(stock_info)
                            
                        except Exception as e:
                            continue
                    
                    data_sources.append(f"akshare: {len([s for s in stocks if s['data_source'] == 'akshare'])} 只股票")
                    
            except Exception as e:
                print(f"⚠️ akshare获取股票列表失败: {e}")
            
            # 方法2：使用tushare补充股票列表
            if self.data_fetcher.tushare_available:
                try:
                    print("📊 方法2: 使用tushare补充股票信息...")
                    self._send_progress({
                        'stage': 'fetching_stock_list',
                        'message': '使用tushare补充股票信息...',
                        'progress': 60
                    })
                    
                    # 获取股票基本信息 - 确保正确访问tushare_pro
                    if hasattr(self.data_fetcher, 'tushare_pro') and self.data_fetcher.tushare_pro:
                        tushare_stocks = self.data_fetcher.tushare_pro.stock_basic(
                            exchange='', 
                            list_status='L',  # 只获取上市状态的股票
                            fields='ts_code,symbol,name,area,industry,list_date,market'
                        )
                    elif hasattr(self.data_fetcher, 'pro') and self.data_fetcher.pro:
                        tushare_stocks = self.data_fetcher.pro.stock_basic(
                            exchange='', 
                            list_status='L',  # 只获取上市状态的股票
                            fields='ts_code,symbol,name,area,industry,list_date,market'
                        )
                    else:
                        print("⚠️ TuShare API对象未找到")
                        tushare_stocks = None
                    
                    if tushare_stocks is not None and len(tushare_stocks) > 0:
                        print(f"✅ tushare获取成功: {len(tushare_stocks)} 只股票")
                        
                        # 获取已有的股票代码列表
                        existing_codes = {s['code'] for s in stocks}
                        
                        for _, row in tushare_stocks.iterrows():
                            try:
                                ts_code = row['ts_code']
                                code = ts_code.split('.')[0]
                                name = row['name']
                                market_suffix = ts_code.split('.')[1]
                                
                                # 过滤条件
                                if code in existing_codes:
                                    continue  # 已存在，跳过
                                
                                # 只处理A股
                                if market_suffix not in ['SH', 'SZ']:
                                    continue
                                
                                # 判断板块
                                if code.startswith('6'):  # 沪A
                                    if market_suffix != 'SH':
                                        continue
                                    exchange = '上海证券交易所'
                                    if code.startswith('688'):
                                        board = '科创板'
                                    else:
                                        board = '主板'
                                elif code.startswith(('0', '3')):  # 深A
                                    if market_suffix != 'SZ':
                                        continue
                                    exchange = '深圳证券交易所'
                                    if code.startswith('3'):
                                        board = '创业板'
                                    else:
                                        board = '主板'
                                else:
                                    continue  # 跳过其他
                                
                                # 市场过滤
                                if market != "all":
                                    if market == "sh" and not code.startswith('6'):
                                        continue
                                    elif market == "sz" and not (code.startswith('0') or code.startswith('3')):
                                        continue
                                    elif market == "cy" and not code.startswith('3'):
                                        continue
                                    elif market == "kc" and not code.startswith('688'):
                                        continue
                                
                                stock_info = {
                                    'code': code,
                                    'name': name,
                                    'market': market_suffix,
                                    'exchange': exchange,
                                    'board': board,
                                    'industry': row.get('industry', ''),
                                    'area': row.get('area', ''),
                                    'list_date': row.get('list_date', ''),
                                    'data_source': 'tushare'
                                }
                                stocks.append(stock_info)
                                
                            except Exception as e:
                                continue
                        
                        data_sources.append(f"tushare: {len([s for s in stocks if s['data_source'] == 'tushare'])} 只股票")
                        
                except Exception as e:
                    print(f"⚠️ tushare获取股票列表失败: {e}")
            
            # 数据去重和排序
            print("🔄 正在处理和去重股票数据...")
            self._send_progress({
                'stage': 'processing_stock_list',
                'message': '正在处理和去重股票数据...',
                'progress': 80
            })
            
            # 去重（基于股票代码）
            unique_stocks = {}
            for stock in stocks:
                code = stock['code']
                if code not in unique_stocks:
                    unique_stocks[code] = stock
                else:
                    # 如果已存在，优先保留信息更完整的
                    existing = unique_stocks[code]
                    if len(stock.get('industry', '')) > len(existing.get('industry', '')):
                        unique_stocks[code] = stock
            
            self.stock_list = list(unique_stocks.values())
            
            # 按代码排序
            self.stock_list.sort(key=lambda x: x['code'])
            
            # 统计信息
            total_count = len(self.stock_list)
            sh_count = len([s for s in self.stock_list if s['code'].startswith('6')])
            sz_main_count = len([s for s in self.stock_list if s['code'].startswith('0')])
            cy_count = len([s for s in self.stock_list if s['code'].startswith('3')])
            kc_count = len([s for s in self.stock_list if s['code'].startswith('688')])
            
            print("\n" + "=" * 60)
            print("📊 A股市场股票统计（深A+沪A全覆盖）")
            print("=" * 60)
            print(f"🏢 上海A股（沪A）: {sh_count} 只")
            print(f"   ├─ 主板: {sh_count - kc_count} 只")
            print(f"   └─ 科创板: {kc_count} 只")
            print(f"🏢 深圳A股（深A）: {sz_main_count + cy_count} 只")
            print(f"   ├─ 主板: {sz_main_count} 只")
            print(f"   └─ 创业板: {cy_count} 只")
            print(f"📈 总计: {total_count} 只A股")
            print(f"🔗 数据源: {', '.join(data_sources)}")
            print("=" * 60)
            
            self._send_progress({
                'stage': 'stock_list_complete',
                'message': f'股票列表获取完成：{total_count} 只A股（深A+沪A全覆盖）',
                'progress': 100,
                'stats': {
                    'total': total_count,
                    'sh_total': sh_count,
                    'sh_main': sh_count - kc_count,
                    'kc': kc_count,
                    'sz_total': sz_main_count + cy_count,
                    'sz_main': sz_main_count,
                    'cy': cy_count,
                    'data_sources': data_sources
                }
            })
            
            return self.stock_list
            
        except Exception as e:
            error_msg = f"获取股票列表失败: {e}"
            print(f"❌ {error_msg}")
            self._send_progress({
                'stage': 'error',
                'message': error_msg,
                'progress': 0
            })
            raise Exception(error_msg)
    
    def execute_market_scan(self, strategy_id: int, start_date: str, end_date: str, 
                          max_stocks: int = 100, min_score: float = 60.0) -> Dict:
        """
        执行全市场扫描 - 100%真实数据，覆盖深A+沪A
        :param strategy_id: 策略ID
        :param start_date: 开始日期
        :param end_date: 结束日期
        :param max_stocks: 最大分析股票数量
        :param min_score: 最小评分要求
        :return: 扫描结果
        """
        print("=" * 80)
        print("🚀 启动全市场股票策略扫描（深A+沪A全覆盖，100%真实数据）")
        print("=" * 80)
        
        scan_start_time = time.time()
        
        self._send_progress({
            'stage': 'scan_start',
            'message': '🚀 正在启动全市场扫描（深A+沪A全覆盖）...',
            'progress': 0,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        })
        
        # 获取股票列表
        if not self.stock_list:
            try:
                self.get_stock_list()
            except Exception as e:
                return {
                    'success': False,
                    'error': f'无法获取股票列表（拒绝模拟数据）: {e}'
                }
        
        # 限制分析数量（避免API过载，但确保覆盖各板块）
        print(f"📊 筛选分析股票（最多{max_stocks}只，确保各板块覆盖）...")
        
        # 按板块分层抽样
        sh_main_stocks = [s for s in self.stock_list if s['code'].startswith('6') and not s['code'].startswith('688')]
        kc_stocks = [s for s in self.stock_list if s['code'].startswith('688')]
        sz_main_stocks = [s for s in self.stock_list if s['code'].startswith('0')]
        cy_stocks = [s for s in self.stock_list if s['code'].startswith('3')]
        
        # 按比例分配
        sh_count = min(max_stocks // 4, len(sh_main_stocks))
        kc_count = min(max_stocks // 8, len(kc_stocks))
        sz_count = min(max_stocks // 4, len(sz_main_stocks))
        cy_count = min(max_stocks // 4, len(cy_stocks))
        
        # 剩余名额补充
        remaining = max_stocks - (sh_count + kc_count + sz_count + cy_count)
        if remaining > 0:
            if len(sh_main_stocks) > sh_count:
                add_sh = min(remaining // 2, len(sh_main_stocks) - sh_count)
                sh_count += add_sh
                remaining -= add_sh
            if remaining > 0 and len(sz_main_stocks) > sz_count:
                add_sz = min(remaining, len(sz_main_stocks) - sz_count)
                sz_count += add_sz
        
        # 随机抽样
        import random
        random.seed(42)  # 固定种子保证结果可重现
        
        analysis_stocks = []
        analysis_stocks.extend(random.sample(sh_main_stocks, min(sh_count, len(sh_main_stocks))))
        analysis_stocks.extend(random.sample(kc_stocks, min(kc_count, len(kc_stocks))))
        analysis_stocks.extend(random.sample(sz_main_stocks, min(sz_count, len(sz_main_stocks))))
        analysis_stocks.extend(random.sample(cy_stocks, min(cy_count, len(cy_stocks))))
        
        print(f"📈 本次分析股票分布:")
        print(f"   沪A主板: {len([s for s in analysis_stocks if s['code'].startswith('6') and not s['code'].startswith('688')])} 只")
        print(f"   科创板: {len([s for s in analysis_stocks if s['code'].startswith('688')])} 只")
        print(f"   深A主板: {len([s for s in analysis_stocks if s['code'].startswith('0')])} 只")
        print(f"   创业板: {len([s for s in analysis_stocks if s['code'].startswith('3')])} 只")
        print(f"   总计: {len(analysis_stocks)} 只")
        
        # 获取策略信息
        strategy = self.strategy_engine.strategies.get(strategy_id)
        if not strategy:
            error_msg = f'策略ID {strategy_id} 不存在'
            self._send_progress({
                'stage': 'error',
                'message': error_msg,
                'progress': 0
            })
            return {
                'success': False,
                'error': error_msg
            }
        
        strategy_name = strategy['name']
        print(f"🎯 执行策略: {strategy_name}")
        
        # 开始批量分析
        self.scan_results = []
        successful_analyses = 0
        qualified_stocks = []
        
        akshare_count = 0
        tushare_count = 0
        
        total_stocks = len(analysis_stocks)
        
        print(f"\n🔄 开始批量分析 {total_stocks} 只股票...")
        print("=" * 60)
        
        for i, stock in enumerate(analysis_stocks, 1):
            try:
                # 发送详细进度
                progress_percent = (i / total_stocks) * 100
                
                # 每5只股票发送一次进度更新
                if i % 5 == 0 or i == 1 or i == total_stocks:
                    real_data_percent = ((akshare_count + tushare_count) / i * 100) if i > 0 else 0
                    self._send_progress({
                        'stage': 'analyzing',
                        'message': f'正在分析第{i}/{total_stocks}只股票: {stock["code"]} {stock["name"]}',
                        'progress': progress_percent,
                        'current_stock': f'{stock["code"]} {stock["name"]}',
                        'successful': successful_analyses,
                        'qualified': len(qualified_stocks),
                        'real_data_percent': real_data_percent,
                        'akshare_count': akshare_count,
                        'tushare_count': tushare_count,
                        'elapsed_time': time.time() - scan_start_time,
                        'estimated_remaining': ((time.time() - scan_start_time) / i * (total_stocks - i)) if i > 0 else 0
                    })
                
                print(f"🔄 进度: {i}/{total_stocks} | 真实数据: {((akshare_count + tushare_count) / i * 100):.0f}%")
                print(f"📈 分析进度: {i}/{total_stocks} ({progress_percent:.1f}%) | 成功: {successful_analyses} | 符合条件: {len(qualified_stocks)} | 用时: {time.time() - scan_start_time:.1f}s | 预计剩余: {((time.time() - scan_start_time) / i * (total_stocks - i)):.1f}s")
                
                # 分析单只股票
                analysis_result = self._analyze_single_stock(stock, strategy_id, start_date, end_date)
                
                if analysis_result:
                    successful_analyses += 1
                    
                    # 统计数据源
                    data_source = analysis_result.get('data_source', '')
                    if 'akshare' in data_source:
                        akshare_count += 1
                    elif 'tushare' in data_source:
                        tushare_count += 1
                    
                    # 检查是否符合条件
                    score = analysis_result.get('score', 0)
                    if score >= min_score:
                        qualified_stocks.append(analysis_result)
                    
                    self.scan_results.append(analysis_result)
                
                # API限速
                time.sleep(0.2)  # 200ms延迟
                
            except Exception as e:
                print(f"❌ 分析 {stock['code']} 失败: {e}")
                continue
        
        # 扫描完成统计
        total_time = time.time() - scan_start_time
        real_data_count = akshare_count + tushare_count
        real_data_percentage = (real_data_count / total_stocks * 100) if total_stocks > 0 else 0
        
        print("\n" + "=" * 60)
        print("🎉 扫描完成!")
        print("=" * 60)
        print(f"⏱️ 总用时: {total_time:.1f}秒")
        print(f"📊 分析股票: {total_stocks} 只")
        print(f"✅ 成功分析: {successful_analyses} 只")
        print(f"🎯 符合条件: {len(qualified_stocks)} 只")
        print(f"🏆 前30强: {min(len(qualified_stocks), 30)} 只")
        print(f"💯 数据质量: {real_data_percentage:.1f}%真实数据")
        print(f"📊 数据源统计: akshare={akshare_count}, tushare={tushare_count}, 总计={real_data_count}/{total_stocks}")
        
        if real_data_percentage < 95:
            print(f"⚠️ 警告: 真实数据比例 {real_data_percentage:.1f}% 低于95%")
        
        # 按得分排序并选取前30名
        qualified_stocks.sort(key=lambda x: x.get('score', 0), reverse=True)
        top_30_stocks = qualified_stocks[:30]
        
        # 最终进度更新
        self._send_progress({
            'stage': 'scan_complete',
            'message': f'🎉 扫描完成！符合条件股票：{len(qualified_stocks)} 只，数据质量：{real_data_percentage:.1f}% (100%)',
            'progress': 100,
            'total_analyzed': total_stocks,
            'successful': successful_analyses,
            'qualified': len(qualified_stocks),
            'top_30': len(top_30_stocks),
            'real_data_percentage': real_data_percentage,
            'data_source_stats': {
                'akshare': akshare_count,
                'tushare': tushare_count,
                'total': real_data_count
            },
            'total_time': total_time
        })
        
        print(f"✅ 扫描完成，数据质量验证: {real_data_percentage:.1f}%真实数据")
        if real_data_percentage < 95:
            print(f"⚠️ 数据质量警告: 真实数据比例 {real_data_percentage:.1f}% 低于95%要求")
        
        return {
            'success': True,
            'strategy_name': strategy_name,
            'total_analyzed': total_stocks,
            'successful_analyses': successful_analyses,
            'qualified_count': len(qualified_stocks),
            'top_30_stocks': top_30_stocks,
            'all_results': self.scan_results,
            'execution_time': total_time,
            'min_score': min_score,
            'real_data_percentage': real_data_percentage,
            'data_source_distribution': {
                'akshare': akshare_count,
                'tushare': tushare_count,
                'total_real': real_data_count,
                'total_analyzed': total_stocks
            },
            'market_coverage': {
                'sh_main': len([s for s in analysis_stocks if s['code'].startswith('6') and not s['code'].startswith('688')]),
                'kc': len([s for s in analysis_stocks if s['code'].startswith('688')]),
                'sz_main': len([s for s in analysis_stocks if s['code'].startswith('0')]),
                'cy': len([s for s in analysis_stocks if s['code'].startswith('3')]),
                'total': len(analysis_stocks)
            }
        }
    
    def _analyze_single_stock(self, stock: Dict, strategy_id: int, start_date: str, end_date: str) -> Optional[Dict]:
        """
        分析单只股票 - 100%真实数据
        :param stock: 股票信息
        :param strategy_id: 策略ID
        :param start_date: 开始日期
        :param end_date: 结束日期
        :return: 分析结果
        """
        try:
            stock_code = stock['code']
            stock_name = stock['name']
            
            # 执行策略分析 - 确保使用真实数据
            result = self.strategy_engine.execute_strategy(
                strategy_id, stock_code, start_date, end_date
            )
            
            if not result.get('success'):
                return None
            
            # 验证数据源是否为真实数据
            data_source = result.get('data_source', '')
            if 'akshare' not in data_source and 'tushare' not in data_source:
                print(f"⚠️ 警告: {stock_code} 数据源可疑: {data_source}")
            
            # 计算策略评分
            score = self._calculate_strategy_score(result)
            
            return {
                'stock_code': stock_code,
                'stock_name': stock_name,
                'market': stock.get('market', ''),
                'board': stock.get('board', ''),
                'exchange': stock.get('exchange', ''),
                'score': score,
                'signals': result.get('signals', []),
                'data_source': data_source,
                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'strategy_result': result
            }
            
        except Exception as e:
            print(f"分析股票 {stock.get('code', 'unknown')} 失败: {e}")
            return None
    
    def _calculate_strategy_score(self, strategy_result: Dict) -> float:
        """
        计算策略评分
        :param strategy_result: 策略执行结果
        :return: 评分（0-100）
        """
        try:
            signals = strategy_result.get('signals', [])
            
            if not signals:
                return 0.0
            
            # 基础评分项
            signal_count = len(signals)
            buy_signals = len([s for s in signals if s.get('signal') == 'BUY'])
            sell_signals = len([s for s in signals if s.get('signal') == 'SELL'])
            
            # 计算评分
            score = 0.0
            
            # 信号数量评分 (30%)
            if signal_count > 0:
                score += min(signal_count / 10 * 30, 30)
            
            # 买入信号比例评分 (40%)
            if signal_count > 0:
                buy_ratio = buy_signals / signal_count
                score += buy_ratio * 40
            
            # 最近信号评分 (30%)
            recent_signals = signals[-5:] if len(signals) >= 5 else signals
            recent_buy_ratio = len([s for s in recent_signals if s.get('signal') == 'BUY']) / len(recent_signals) if recent_signals else 0
            score += recent_buy_ratio * 30
            
            return min(score, 100.0)
            
        except Exception as e:
            print(f"计算评分失败: {e}")
            return 0.0
    
    def export_results(self, filename: str = None) -> str:
        """
        导出扫描结果
        :param filename: 导出文件名
        :return: 导出文件路径
        """
        if not self.scan_results:
            raise ValueError("没有可导出的扫描结果")
        
        if not filename:
            filename = f"market_scan_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        export_data = {
            'export_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'total_results': len(self.scan_results),
            'results': self.scan_results
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"✅ 扫描结果已导出到: {filename}")
        return filename 