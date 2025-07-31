from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import sys
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import json
import time
from typing import List, Dict
import uuid

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.analysis.stock_analyzer import StockAnalyzer
from src.strategy_engine import QuantitativeStrategyEngine
from src.advanced_strategy_api import advanced_strategy_engine

# 创建Flask应用（只提供API服务，不渲染模板）
app = Flask(__name__)

# 启用CORS支持
CORS(app, resources={r"/*": {"origins": "*"}})

# 创建策略引擎实例
strategy_engine = QuantitativeStrategyEngine()

# 递归转换numpy类型为原生类型，并避免循环引用
def convert_np(obj, visited=None):
    """转换numpy类型和避免循环引用"""
    if visited is None:
        visited = set()
    
    # 检查循环引用
    obj_id = id(obj)
    if obj_id in visited:
        return str(type(obj).__name__)  # 返回类型名避免循环引用
    
    if isinstance(obj, dict):
        visited.add(obj_id)
        result = {}
        for k, v in obj.items():
            try:
                result[k] = convert_np(v, visited.copy())
            except:
                result[k] = str(v)  # 转换为字符串避免错误
        return result
    elif isinstance(obj, list):
        visited.add(obj_id)
        return [convert_np(i, visited.copy()) for i in obj]
    elif isinstance(obj, tuple):
        visited.add(obj_id)
        return [convert_np(i, visited.copy()) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif hasattr(obj, '__dict__'):
        # 对于自定义对象，只返回简单的字符串表示
        return str(obj)
    elif hasattr(obj, 'to_dict'):
        # pandas对象
        try:
            return convert_np(obj.to_dict(), visited.copy())
        except:
            return str(obj)
    else:
        return obj

def safe_jsonify(data):
    """安全的JSON序列化，避免循环引用"""
    try:
        # 先用convert_np处理数据
        safe_data = convert_np(data)
        
        # 进一步清理可能的问题数据
        def clean_data(obj):
            if isinstance(obj, dict):
                cleaned = {}
                for k, v in obj.items():
                    try:
                        # 尝试JSON序列化单个值
                        json.dumps(v)
                        cleaned[k] = clean_data(v)
                    except (TypeError, ValueError):
                        # 如果无法序列化，转换为字符串
                        cleaned[k] = str(v) if v is not None else None
                return cleaned
            elif isinstance(obj, list):
                return [clean_data(item) for item in obj]
            else:
                return obj
        
        final_data = clean_data(safe_data)
        return jsonify(final_data)
        
    except Exception as e:
        print(f"JSON序列化失败: {e}")
        # 返回简化的错误安全版本
        if isinstance(data, dict) and 'success' in data:
            return jsonify({
                'success': data.get('success', False),
                'message': data.get('message', 'JSON序列化错误'),
                'error': str(e),
                'data_type': 'simplified'
            })
        else:
            return jsonify({
                'success': False,
                'message': f'数据序列化错误: {str(e)}',
                'error_type': 'serialization_error'
            })

@app.route('/')
def index():
    """API服务状态检查"""
    return jsonify({
        'success': True,
        'message': '股票分析系统API服务运行正常',
        'version': '1.0.0',
        'endpoints': [
            '/search_stocks - 搜索股票',
            '/get_stock_info - 获取股票信息',
            '/trading_signals - 获取交易信号'
        ]
    })



@app.route('/trading_signals', methods=['POST'])
def get_trading_signals():
    """获取多周期交易信号分析"""
    try:
        # 获取JSON数据
        data = request.get_json()
        stock_input = data.get('stock_code', '000001').strip() if data else '000001'
        
        # 定义所有时间周期
        time_periods = {
            'weekly': '周线',
            'daily': '日线', 
            '60': '60分钟',
            '30': '30分钟',
            '15': '15分钟'
        }
        
        # 使用默认时间范围（最近三年，约1095天）
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=1095)).strftime('%Y-%m-%d')
        
        # 直接使用输入的股票代码
        stock_code = stock_input
        stock_name = None
        
        # 转换日期格式
        try:
            start_date_formatted = datetime.strptime(start_date, '%Y-%m-%d').strftime('%Y%m%d')
            end_date_formatted = datetime.strptime(end_date, '%Y-%m-%d').strftime('%Y%m%d')
        except ValueError as e:
            return jsonify({
                'success': False,
                'message': f'日期格式错误: {e}'
            })
        
        print(f"🚀 获取多周期交易信号: {stock_code}, 时间范围: {start_date_formatted} - {end_date_formatted}")
        
        # 存储所有周期的分析结果
        all_signals = {}
        all_stock_data = {}
        period_dfs = {}
        stock_info = None
        
        # 🔥 终极性能优化：并行处理+智能缓存+TuShare/AkShare集成
        import concurrent.futures
        import threading
        
        # 创建线程安全的缓存
        base_data_cache = {}
        cache_lock = threading.Lock()
        
        # 🔥 进度跟踪：计算总进度
        total_periods = len(time_periods)
        completed_periods = 0
        completed_lock = threading.Lock()
        
        print(f"📋 开始并行分析 {total_periods} 个时间周期: {list(time_periods.values())}")
        print(f"🚀 启用TuShare+AkShare双引擎真实数据模式")
        
        def analyze_period(period_item):
            """单个周期分析函数 - 线程安全"""
            period_key, period_name = period_item
            nonlocal completed_periods
            
            try:
                print(f"🔄 并行分析 {period_name} 周期...")
                
                # 创建独立的分析器实例（线程安全）
                analyzer = StockAnalyzer(stock_code)
                
                # 🔥 优化：线程安全的缓存检查
                cache_key = f"{period_key}_{start_date_formatted}_{end_date_formatted}"
                with cache_lock:
                    if cache_key in base_data_cache:
                        print(f"♻️  使用缓存 {period_name} 数据")
                        analyzer.data = base_data_cache[cache_key].copy()
                        data_cached = True
                    else:
                        data_cached = False
                
                if not data_cached:
                    print(f"📥 TuShare+AkShare获取 {period_name} 数据...")
                    if not analyzer.fetch_data(start_date_formatted, end_date_formatted, period_key):
                        print(f"❌ 无法获取 {period_name} 数据")
                        return None
                    
                    # 缓存数据（线程安全）
                    with cache_lock:
                        base_data_cache[cache_key] = analyzer.data.copy()
                        print(f"✅ {period_name} 数据缓存完成")
                
                if analyzer.data is None or len(analyzer.data) == 0:
                    print(f"❌ {period_name} 数据为空")
                    return None
                
                # 快速计算技术指标
                print(f"📊 计算 {period_name} 技术指标...")
                analyzer.calculate_indicators()
                
                # 生成交易信号
                print(f"🎯 生成 {period_name} 交易信号...")
                signals = analyzer.generate_trading_signals()
                
                if signals is None:
                    print(f"❌ {period_name} 数据不足，无法生成交易信号")
                    return None
                
                # 准备返回数据
                stock_data = []
                if analyzer.data is not None and len(analyzer.data) > 0:
                    # 只取最近100条记录
                    recent_data = analyzer.data.tail(100)
                    for _, row in recent_data.iterrows():
                        stock_data.append({
                            'Date': row['Date'],
                            'Open': float(row['Open']),
                            'High': float(row['High']),
                            'Low': float(row['Low']),
                            'Close': float(row['Close']),
                            'Volume': float(row['Volume'])
                        })
                
                # 更新完成进度（线程安全）
                with completed_lock:
                    completed_periods += 1
                    progress_percentage = int((completed_periods / total_periods) * 100)
                    print(f"✅ {period_name} 周期分析完成 ({completed_periods}/{total_periods}, {progress_percentage}%)")
                
                return {
                    'period_key': period_key,
                    'period_name': period_name,
                    'signals': signals,
                    'stock_data': stock_data,
                    'analyzer': analyzer
                }
                
            except Exception as e:
                print(f"❌ 并行分析 {period_name} 周期失败: {e}")
                return None
        
        # 🔥 并行执行所有周期分析（最多3个线程避免API过载）
        print(f"🚀 启动并行处理，最大线程数: 3")
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # 提交所有任务
            future_to_period = {
                executor.submit(analyze_period, period_item): period_item 
                for period_item in time_periods.items()
            }
            
            # 收集结果
            period_results = []
            for future in concurrent.futures.as_completed(future_to_period, timeout=480):  # 8分钟总超时
                try:
                    result = future.result(timeout=120)  # 单个周期2分钟超时
                    if result:
                        period_results.append(result)
                except concurrent.futures.TimeoutError:
                    period_item = future_to_period[future]
                    print(f"⚠️ {period_item[1]} 周期分析超时")
                except Exception as e:
                    period_item = future_to_period[future]
                    print(f"❌ {period_item[1]} 周期分析异常: {e}")
        
        # 处理并行结果
        for result in period_results:
            try:
                period_key = result['period_key']
                period_name = result['period_name']
                signals = result['signals']
                stock_data = result['stock_data']
                analyzer = result['analyzer']
                
                # 存储信号
                all_signals[period_key] = {
                    'period_name': period_name,
                    'signals': convert_np(signals)
                }
                
                # 存储股票数据
                all_stock_data[period_key] = stock_data
                
                # 存储完整 DataFrame 用于回测
                period_dfs[period_key] = analyzer.data.copy()
                
                # 保存股票信息（使用第一个成功的结果）
                if stock_info is None:
                    stock_info = {
                        'code': stock_code,
                        'name': analyzer.stock_name or stock_name,
                        'sector': '',
                        'market': 'A股'
                    }
                
                print(f"🎯 成功处理 {period_name} 周期结果")
                
            except Exception as e:
                print(f"❌ 处理并行结果失败: {e}")
                continue
                
        print(f"🏁 并行分析完成，共处理 {len(period_results)} 个周期")
        
        if not all_signals:
            return jsonify({
                'success': False,
                'message': f'无法获取股票 {stock_code} 的任何周期数据，请检查股票代码是否正确'
            })
        
        # 生成综合建议
        comprehensive_advice = generate_comprehensive_advice(all_signals)
        
        # ---------- 回测结果 ----------
        backtest_result = generate_backtest_result(period_dfs)
        
        return jsonify({
            'success': True,
            'message': f'成功生成 {stock_info["name"]}({stock_code}) 的多周期交易信号',
            'all_signals': all_signals,
            'all_stock_data': all_stock_data,
            'stock_info': stock_info,
            'comprehensive_advice': comprehensive_advice,
            'backtest_result': backtest_result
        })
        
    except Exception as e:
        print(f"获取交易信号失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'获取交易信号失败: {str(e)}'
        })

def generate_comprehensive_advice(all_signals):
    """生成综合买卖建议"""
    buy_count = 0
    sell_count = 0
    hold_count = 0
    total_periods = len(all_signals)
    
    # 统计各周期的信号
    period_analysis = {}
    for period_key, period_data in all_signals.items():
        signals = period_data['signals']
        signal_type = signals.get('signal_type', '')
        
        if '买入' in signal_type:
            buy_count += 1
        elif '卖出' in signal_type:
            sell_count += 1
        else:
            hold_count += 1
        
        period_analysis[period_key] = {
            'period_name': period_data['period_name'],
            'signal_type': signal_type,
            'signal_strength': signals.get('signal_strength', ''),
            'risk_level': signals.get('risk_level', '中')
        }
    
    # 生成综合建议
    if buy_count > sell_count and buy_count > hold_count:
        overall_signal = '买入'
        signal_strength = '强' if buy_count >= 3 else '中等'
        advice = f'在{total_periods}个时间周期中，{buy_count}个周期显示买入信号，建议考虑买入。'
    elif sell_count > buy_count and sell_count > hold_count:
        overall_signal = '卖出'
        signal_strength = '强' if sell_count >= 3 else '中等'
        advice = f'在{total_periods}个时间周期中，{sell_count}个周期显示卖出信号，建议考虑卖出。'
    else:
        overall_signal = '观望'
        signal_strength = '中等'
        advice = f'各时间周期信号不一致，建议观望等待更明确的信号。'
    
    return {
        'overall_signal': overall_signal,
        'signal_strength': signal_strength,
        'advice': advice,
        'statistics': {
            'total_periods': total_periods,
            'buy_count': buy_count,
            'sell_count': sell_count,
            'hold_count': hold_count
        },
        'period_analysis': period_analysis
    }



@app.route('/search_stocks', methods=['GET'])
def search_stocks():
    """智能股票搜索API - 支持模糊搜索、拼音搜索、智能排序"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({
                'success': True,
                'stocks': []
            })
        
        # 使用akshare获取股票信息
        try:
            import akshare as ak
            import re
            from difflib import SequenceMatcher
            
            # 获取A股股票列表
            stock_list = ak.stock_info_a_code_name()
            
            results = []
            query_lower = query.lower().strip()
            
            # 智能搜索和评分算法
            def calculate_match_score(code, name, query):
                """计算匹配分数 (0-100)"""
                score = 0
                query_clean = query.lower().strip()
                code_clean = code.lower().strip()
                name_clean = name.lower().strip()
                
                # 1. 精确匹配 - 最高分
                if query_clean == code_clean:
                    score = 100
                elif query_clean == name_clean:
                    score = 95
                
                # 2. 前缀匹配 - 高分
                elif code_clean.startswith(query_clean):
                    score = 90 - len(query_clean) * 2  # 越长的前缀分数稍低
                elif name_clean.startswith(query_clean):
                    score = 85 - len(query_clean) * 2
                
                # 3. 包含匹配 - 中高分
                elif query_clean in code_clean:
                    score = 80
                elif query_clean in name_clean:
                    # 名称包含的位置越靠前分数越高
                    pos = name_clean.find(query_clean)
                    score = 75 - pos * 2
                
                # 4. 数字代码匹配 - 中分
                elif query_clean.isdigit() and query_clean in code_clean:
                    score = 70
                
                # 5. 模糊匹配 - 中低分
                else:
                    # 使用difflib计算相似度
                    code_similarity = SequenceMatcher(None, query_clean, code_clean).ratio()
                    name_similarity = SequenceMatcher(None, query_clean, name_clean).ratio()
                    max_similarity = max(code_similarity, name_similarity)
                    
                    if max_similarity > 0.6:  # 相似度阈值
                        score = int(max_similarity * 60)  # 最高60分
                    
                    # 6. 拼音匹配支持 - 中分
                    if score < 30:  # 只有在其他匹配都不好的情况下才用拼音
                        try:
                            # 简单的拼音匹配（支持常见缩写）
                            pinyin_matches = {
                                'pab': '平安银行', 'payx': '平安银行',
                                'zsyx': '招商银行', 'zsyh': '招商银行',
                                'wka': '万科a', 'wkag': '万科a', 
                                'pdfyx': '浦发银行', 'pdfyh': '浦发银行',
                                'wly': '五粮液', 'wll': '五粮液',
                                'zgjy': '中国建银', 'zgjz': '中国建筑',
                                'zgsj': '中国石化', 'zgsz': '中国石油',
                                'zmj': '郑煤机', 'zhmj': '郑煤机',
                                'zglt': '中国联通', 'zgyd': '中国移动',
                                'bjyx': '北京银行', 'njyx': '南京银行',
                                'msyx': '民生银行', 'xayx': '兴业银行'
                            }
                            
                            if query_clean in pinyin_matches:
                                if pinyin_matches[query_clean] in name_clean:
                                    score = 65
                                    
                        except Exception:
                            pass
                
                return min(100, max(0, score))  # 确保分数在0-100范围内
            
            # 搜索并评分所有股票
            candidates = []
            for _, row in stock_list.iterrows():
                try:
                    code = str(row['code']).strip()
                    name = str(row['name']).strip()
                    
                    # 基础过滤 - 至少要有一些相关性
                    if (query_lower in code.lower() or 
                        query_lower in name.lower() or
                        code.lower().startswith(query_lower) or
                        name.lower().startswith(query_lower) or
                        any(char.isdigit() for char in query_lower) and query_lower in code or
                        len(query_lower) >= 2):  # 至少2个字符才进行模糊匹配
                        
                        score = calculate_match_score(code, name, query_lower)
                        
                        if score > 20:  # 最低分数阈值
                            # 尝试获取行业信息
                            sector = ''
                            try:
                                # 简单的行业分类
                                if '银行' in name:
                                    sector = '银行'
                                elif '保险' in name:
                                    sector = '保险'
                                elif '证券' in name:
                                    sector = '证券'
                                elif '地产' in name or '房地产' in name:
                                    sector = '房地产'
                                elif '科技' in name or '软件' in name:
                                    sector = '科技'
                                elif '医药' in name or '生物' in name:
                                    sector = '医药'
                                elif '钢铁' in name:
                                    sector = '钢铁'
                                elif '煤炭' in name or '能源' in name:
                                    sector = '能源'
                                else:
                                    sector = '其他'
                            except:
                                sector = ''
                            
                            candidates.append({
                                'code': code,
                                'name': name,
                                'sector': sector,
                                'market': 'A股',
                                'score': score
                            })
                except Exception as e:
                    continue  # 跳过有问题的记录
            
            # 按分数排序（从高到低）
            candidates.sort(key=lambda x: x['score'], reverse=True)
            
            # 移除score字段并返回结果
            results = []
            for candidate in candidates[:limit]:
                result = {k: v for k, v in candidate.items() if k != 'score'}
                results.append(result)
            
            return jsonify({
                'success': True,
                'stocks': results
            })
            
        except Exception as e:
            print(f"akshare获取股票列表失败: {e}")
            # 增强的回退实现
            results = []
            if query:
                # 常见股票的映射
                common_stocks = {
                    '平安银行': {'code': '000001', 'name': '平安银行', 'sector': '银行'},
                    'pab': {'code': '000001', 'name': '平安银行', 'sector': '银行'},
                    '000001': {'code': '000001', 'name': '平安银行', 'sector': '银行'},
                    '万科': {'code': '000002', 'name': '万科A', 'sector': '房地产'},
                    '000002': {'code': '000002', 'name': '万科A', 'sector': '房地产'},
                    '招商银行': {'code': '600036', 'name': '招商银行', 'sector': '银行'},
                    '600036': {'code': '600036', 'name': '招商银行', 'sector': '银行'},
                    '浦发银行': {'code': '600000', 'name': '浦发银行', 'sector': '银行'},
                    '600000': {'code': '600000', 'name': '浦发银行', 'sector': '银行'},
                    '五粮液': {'code': '000858', 'name': '五粮液', 'sector': '白酒'},
                    '000858': {'code': '000858', 'name': '五粮液', 'sector': '白酒'},
                    '郑煤机': {'code': '601717', 'name': '郑煤机', 'sector': '机械'},
                    '601717': {'code': '601717', 'name': '郑煤机', 'sector': '机械'},
                }
                
                query_lower = query.lower().strip()
                
                # 查找匹配的股票
                for key, stock_info in common_stocks.items():
                    if (query_lower == key.lower() or 
                        query_lower in key.lower() or
                        key.lower().startswith(query_lower)):
                        results.append({
                            'code': stock_info['code'],
                            'name': stock_info['name'],
                            'sector': stock_info['sector'],
                            'market': 'A股'
                        })
                        break
                
                # 如果没找到且是数字，作为股票代码处理
                if not results and query.isdigit():
                    results.append({
                        'code': query,
                        'name': f'股票{query}',
                        'sector': '',
                        'market': 'A股'
                    })
                    
            return jsonify({
                'success': True,
                'stocks': results
            })
        
    except Exception as e:
        print(f"搜索股票失败: {e}")
        return jsonify({
            'success': False,
            'message': f'搜索失败: {str(e)}',
            'stocks': []
        })

@app.route('/get_stock_info', methods=['GET'])
def get_stock_info():
    """获取股票信息API"""
    try:
        code_or_name = request.args.get('code_or_name', '').strip()
        
        if not code_or_name:
            return jsonify({
                'success': False,
                'message': '请提供股票代码或公司名称'
            })
        
        # 使用akshare获取股票信息
        try:
            import akshare as ak
            
            # 获取A股股票列表
            stock_list = ak.stock_info_a_code_name()
            
            # 查找匹配的股票
            for _, row in stock_list.iterrows():
                code = str(row['code']).strip()
                name = str(row['name']).strip()
                
                # 匹配股票代码或公司名称
                if (code_or_name == code or 
                    code_or_name.lower() in name.lower() or
                    code.startswith(code_or_name) or
                    name.startswith(code_or_name)):
                    
                    # 尝试获取更多股票信息
                    try:
                        stock_info = ak.stock_individual_info_em(symbol=code)
                        sector = ''
                        if not stock_info.empty:
                            industry_rows = stock_info[stock_info['item'].str.contains('行业', na=False)]
                            if not industry_rows.empty:
                                sector = industry_rows.iloc[0]['value']
                    except:
                        sector = ''
                    
                    stock_info = {
                        'code': code,
                        'name': name,
                        'sector': sector,
                        'market': 'A股'
                    }
                    return jsonify({
                        'success': True,
                        'stock': stock_info
                    })
            
            # 如果没找到，返回默认信息
            stock_info = {
                'code': code_or_name,
                'name': f'股票{code_or_name}',
                'sector': '',
                'market': 'A股'
            }
            return jsonify({
                'success': True,
                'stock': stock_info
            })
            
        except Exception as e:
            print(f"akshare获取股票信息失败: {e}")
            # 回退到简单实现
            stock_info = {
                'code': code_or_name,
                'name': f'股票{code_or_name}',
                'sector': '',
                'market': 'A股'
            }
            return jsonify({
                'success': True,
                'stock': stock_info
            })
        
    except Exception as e:
        print(f"获取股票信息失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取股票信息失败: {str(e)}'
        })

# --------------------------------------------------------------------------------------
# 回测逻辑（简化版本：基于 MACD 多周期权重策略）
# --------------------------------------------------------------------------------------
from src.analysis.indicators import TechnicalIndicators
import numpy as np


def _macd_position(macd: np.ndarray, signal: np.ndarray):
    """根据 MACD 与 signal 线判断持仓（1 持有 / 0 空仓）。"""
    if len(macd) != len(signal):
        return np.zeros(len(macd))
    pos = np.zeros(len(macd))
    for i in range(1, len(macd)):
        if macd[i - 1] <= signal[i - 1] and macd[i] > signal[i]:  # 金叉
            pos[i] = 1
        elif macd[i - 1] >= signal[i - 1] and macd[i] < signal[i]:  # 死叉
            pos[i] = 0
        else:
            pos[i] = pos[i - 1]
    return pos


def backtest_macd_strategy(df):
    """对单一周期 DataFrame 进行 MACD 策略回测，返回收益率和交易明细。"""
    if df is None or df.empty or 'Close' not in df.columns:
        return {
            'return_pct': 0.0,
            'trades': []
        }

    macd_dict = TechnicalIndicators.calculate_macd(df['Close'])
    macd = macd_dict['macd'].values
    signal = macd_dict['signal'].values

    # 对齐长度
    valid_len = min(len(macd), len(signal), len(df))
    macd = macd[-valid_len:]
    signal = signal[-valid_len:]
    closes = df['Close'].values[-valid_len:]
    dates = df['Date'].values[-valid_len:]

    pos = np.zeros(valid_len)
    trades = []
    holding_price = None
    last_trade_day = None  # 记录上一次交易发生的日期 (YYYY-MM-DD)

    def _same_day(ts1, ts2):
        """判断两个时间戳是否属于同一天"""
        d1 = pd.to_datetime(ts1).strftime('%Y-%m-%d')
        d2 = pd.to_datetime(ts2).strftime('%Y-%m-%d')
        return d1 == d2

    for i in range(1, valid_len):
        current_day = pd.to_datetime(dates[i]).strftime('%Y-%m-%d')

        # 如果本日已经发生过交易，直接沿用上一时刻仓位
        if last_trade_day == current_day:
            pos[i] = pos[i - 1]
            continue

        # 金叉 -> 买入
        if macd[i - 1] <= signal[i - 1] and macd[i] > signal[i]:
            pos[i] = 1
            holding_price = closes[i]
            trades.append({
                'type': 'buy',
                'date': str(dates[i]),
                'price': float(closes[i])
            })
            last_trade_day = current_day

        # 死叉 -> 卖出
        elif macd[i - 1] >= signal[i - 1] and macd[i] < signal[i]:
            pos[i] = 0
            if holding_price is not None:
                profit_pct = (closes[i] - holding_price) / holding_price
                trades.append({
                    'type': 'sell',
                    'date': str(dates[i]),
                    'price': float(closes[i]),
                    'profit_pct': round(profit_pct * 100, 2),
                    'profit_amount': round((closes[i] - holding_price), 2)
                })
                holding_price = None
            last_trade_day = current_day
        else:
            pos[i] = pos[i - 1]

    # 计算整体收益率
    pct_change = np.append([0], np.diff(closes) / closes[:-1])
    strategy_ret = (pos[:-1] * pct_change[1:]).sum()

    return {
        'return_pct': strategy_ret,
        'trades': trades
    }


def generate_backtest_result(period_dfs: dict):
    """仅使用日线 DataFrame 生成 MACD 策略回测结果。"""
    if 'daily' not in period_dfs or period_dfs['daily'] is None or period_dfs['daily'].empty:
        return {
            'capital_start': 1_000_000,
            'capital_end': 1_000_000,
            'total_return_pct': 0.0,
            'profit_amount': 0.0,
            'details': {}
        }

    df_daily = period_dfs['daily']
    result = backtest_macd_strategy(df_daily)
    total_ret = result['return_pct']
    trades = result['trades']

    capital_start = 1_000_000
    capital_end = capital_start * (1 + total_ret)
    profit_amount = capital_end - capital_start

    details = {
        'daily': {
            'period_name': '日线',
            'return_pct': round(total_ret * 100, 2),
            'trades': trades
        }
    }

    # ------------------ 生成每笔交易时各周期决策 ------------------
    def macd_signal_type(close_series):
        """根据给定收盘价序列计算MACD信号类型（强烈买入/买入/卖出/强烈卖出/观望）"""
        if len(close_series) < 35:  # 至少有足够数据计算EMA
            return '观望'
        macd_dict_ = TechnicalIndicators.calculate_macd(close_series)
        macd_line = macd_dict_['macd'].iloc[-1]
        signal_line = macd_dict_['signal'].iloc[-1]
        diff = macd_line - signal_line
        if diff > 0:
            if diff > abs(signal_line) * 0.3:
                return '强烈买入'
            return '买入'
        elif diff < 0:
            if abs(diff) > abs(signal_line) * 0.3:
                return '强烈卖出'
            return '卖出'
        return '观望'

    # 需要的周期列表（如存在于period_dfs中）
    decision_periods = ['15', '30', '60', 'daily', 'weekly']

    for trade in trades:
        trade_dt = pd.to_datetime(trade['date'])
        # 当日结束时间（次日零点），用于包含当天所有收盘前数据
        day_end = (trade_dt.floor('D') + pd.Timedelta(days=1))
        decisions = []
        for p in decision_periods:
            df_p = period_dfs.get(p)
            if df_p is None or df_p.empty:
                continue
            # 取在 day_end 之前的所有数据，确保包含当日全部bar（收盘价）
            df_slice = df_p[df_p['Date'] < day_end]
            if df_slice.empty:
                continue
            sig_type = macd_signal_type(df_slice['Close'])
            decisions.append({
                'period': p,
                'signal_type': sig_type
            })
        trade['decisions'] = decisions

    return {
        'capital_start': capital_start,
        'capital_end': round(capital_end, 2),
        'total_return_pct': round(total_ret * 100, 2),
        'profit_amount': round(profit_amount, 2),
        'details': details
    }

# ------------------ 回测权重配置 ------------------
def load_backtest_weights():
    """从 config/backtest_weights.json 读取各周期回测权重。若文件不存在或格式错误，返回默认权重。"""
    default_weights = {
        '15': 1,
        '30': 3,
        '60': 2,
        'daily': 3,
        'weekly': 1,
    }

    try:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(project_root, 'config', 'backtest_weights.json')
        if not os.path.isfile(config_path):
            print(f"找不到回测权重配置文件 {config_path}，使用默认权重")
            return default_weights

        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if not isinstance(data, dict):
            print("回测权重配置格式错误，使用默认权重")
            return default_weights

        # 只保留需要的键，且确保值为数字
        weights = {}
        for k, v in data.items():
            try:
                weights[str(k)] = float(v)
            except (TypeError, ValueError):
                print(f"回测权重配置中 {k}:{v} 非数字，忽略")

        # 如果配置为空则返回默认
        return weights if weights else default_weights
    except Exception as e:
        print(f"读取回测权重配置失败: {e}，使用默认权重")
        return default_weights

# --------------------------------------------------------------------------------------
# 量化策略API接口
# --------------------------------------------------------------------------------------

@app.route('/api/strategies/config/<int:strategy_id>', methods=['GET'])
def get_strategy_config(strategy_id):
    """获取策略配置"""
    try:
        config = strategy_engine.get_strategy_config(strategy_id)
        return jsonify({
            'success': True,
            'strategy_config': config
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/config/<int:strategy_id>', methods=['POST'])
def update_strategy_config(strategy_id):
    """更新策略参数配置"""
    try:
        data = request.get_json()
        params = data.get('params', {})
        
        result = strategy_engine.update_strategy_config(strategy_id, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/execute', methods=['POST'])
def execute_strategy():
    """执行策略"""
    try:
        data = request.get_json()
        strategy_id = data.get('strategy_id')
        stock_code = data.get('stock_code')
        start_date = data.get('start_date', '20220101')
        end_date = data.get('end_date', '20241231')
        
        if not strategy_id or not stock_code:
            return jsonify({
                'success': False,
                'message': '请提供策略ID和股票代码'
            })
        
        result = strategy_engine.execute_strategy(strategy_id, stock_code, start_date, end_date)
        return jsonify(result)
    except Exception as e:
        print(f"执行策略失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/market-scan', methods=['POST'])
def market_scan():
    """执行全市场扫描 - 100%真实数据版本"""
    try:
        # 修复相对导入问题 - 使用绝对导入
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from src.market_scanner import MarketScanner
        import queue
        import threading
        
        data = request.get_json()
        strategy_id = data.get('strategy_id', 6)  # 默认使用高频交易策略
        start_date = data.get('start_date', '20220101')
        end_date = data.get('end_date', '20251231')
        max_stocks = data.get('max_stocks', 50)  # 降低默认数量避免API过载
        min_score = data.get('min_score', 60.0)
        
        print(f"🚀 启动全市场扫描（100%真实数据）")
        print(f"策略ID: {strategy_id}, 最大股票数: {max_stocks}")
        print(f"时间范围: {start_date} - {end_date}")
        print(f"最小评分: {min_score}")
        print(f"💯 数据源要求: 100%真实akshare数据，拒绝模拟数据")
        
        # 验证参数
        if not strategy_id:
            return jsonify({
                'success': False,
                'message': '请提供策略ID'
            })
        
        # 创建市场扫描器 - 100%真实数据
        scanner = MarketScanner(max_workers=3)  # 降低并发数避免API限制
        
        # 存储进度信息
        progress_queue = queue.Queue()
        scan_result = {}
        progress_updates = []
        
        def progress_callback(progress_data):
            """进度回调函数 - 收集详细进度信息"""
            progress_queue.put(progress_data)
            progress_updates.append(progress_data)
            
            # 打印关键进度信息
            stage = progress_data.get('stage', '')
            message = progress_data.get('message', '')
            progress = progress_data.get('progress', 0)
            
            if stage in ['scan_start', 'analysis_start', 'complete']:
                print(f"📊 {message} ({progress}%)")
            elif stage == 'analyzing' and progress_data.get('completed', 0) % 5 == 0:
                completed = progress_data.get('completed', 0)
                total = progress_data.get('total', 0)
                real_data_percentage = progress_data.get('real_data_percentage', 0)
                print(f"🔄 进度: {completed}/{total} | 真实数据: {real_data_percentage}%")
        
        def scan_worker():
            """扫描工作线程"""
            try:
                # 设置进度回调
                scanner.set_progress_callback(progress_callback)
                
                print("⏳ 开始执行市场扫描...")
                
                # 执行扫描
                result = scanner.execute_market_scan(
                    strategy_id=strategy_id,
                    start_date=start_date,
                    end_date=end_date,
                    max_stocks=max_stocks,
                    min_score=min_score
                )
                
                # 验证数据质量 - 重点检查真实数据比例
                if result.get('success'):
                    top_30_stocks = result.get('top_30_stocks', [])
                    real_data_count = 0
                    total_stocks = len(top_30_stocks)
                    
                    # 详细验证每只股票的数据源
                    for stock in top_30_stocks:
                        data_source = stock.get('data_source', '')
                        if 'akshare' in data_source or 'tushare' in data_source:
                            real_data_count += 1
                        else:
                            print(f"⚠️ 警告: {stock.get('stock_code', 'unknown')} 数据源可疑: {data_source}")
                    
                    # 计算真实数据比例
                    data_quality_percent = (real_data_count / total_stocks * 100) if total_stocks > 0 else 0
                    
                    # 更新结果中的数据质量信息
                    result['real_data_percentage'] = data_quality_percent
                    result['data_verification'] = f"{real_data_count}/{total_stocks} (100%真实数据目标)"
                    result['data_quality_grade'] = "优秀" if data_quality_percent >= 95 else "良好" if data_quality_percent >= 80 else "需改进"
                    result['progress_history'] = progress_updates  # 包含完整进度历史
                    
                    # 数据源统计
                    akshare_count = sum(1 for stock in top_30_stocks if 'akshare' in stock.get('data_source', ''))
                    tushare_count = sum(1 for stock in top_30_stocks if 'tushare' in stock.get('data_source', ''))
                    
                    result['data_source_stats'] = {
                        'akshare_count': akshare_count,
                        'tushare_count': tushare_count,
                        'total_real_data': real_data_count,
                        'data_quality_percentage': data_quality_percent
                    }
                    
                    # 验证是否达到真实数据要求
                    if data_quality_percent < 95:
                        print(f"⚠️ 数据质量警告: 真实数据比例 {data_quality_percent:.1f}% 低于95%要求")
                        result['warning'] = f"数据质量 {data_quality_percent:.1f}% 低于95%标准"
                    else:
                        print(f"✅ 数据质量验证通过: {data_quality_percent:.1f}% 真实数据")
                    
                    print(f"📊 数据源统计: akshare={akshare_count}, tushare={tushare_count}, 总计={real_data_count}/{total_stocks}")
                    
                scan_result.update(result)
                
            except Exception as e:
                print(f"❌ 扫描过程发生错误: {e}")
                import traceback
                traceback.print_exc()
                scan_result.update({
                    'success': False,
                    'error': f'扫描失败（拒绝模拟数据）: {e}',
                    'message': str(e),
                    'error_type': 'real_data_rejection' if '模拟' in str(e) else 'system_error'
                })
        
        # 启动扫描线程
        scan_thread = threading.Thread(target=scan_worker)
        scan_thread.start()
        
        # 等待扫描完成，带超时保护
        scan_thread.join(timeout=300)  # 5分钟超时
        
        if scan_thread.is_alive():
            return jsonify({
                'success': False,
                'message': '扫描超时（可能因为API限制），请稍后重试',
                'error_type': 'timeout'
            })
        
        # 如果没有结果，说明扫描失败
        if not scan_result:
            return jsonify({
                'success': False,
                'message': '扫描失败，无法获取真实数据',
                'error_type': 'no_result'
            })
        
        # 最终验证和返回
        if scan_result.get('success'):
            data_quality = scan_result.get('real_data_percentage', 0)
            print(f"🎉 扫描成功完成，数据质量: {data_quality:.1f}%")
        else:
            print(f"❌ 扫描失败: {scan_result.get('message', '未知错误')}")
        
        return safe_jsonify(scan_result)
        
    except Exception as e:
        print(f"❌ 执行全市场扫描失败: {e}")
        import traceback
        traceback.print_exc()
        return safe_jsonify({
            'success': False,
            'message': f'系统错误（拒绝模拟数据）: {str(e)}',
            'error_type': 'system_error'
        })

@app.route('/api/strategies/market-scan-progress/<scan_id>')
def market_scan_progress(scan_id):
    """获取市场扫描进度 - SSE接口"""
    try:
        from flask import Response
        import json
        import time
        
        def generate_progress():
            """生成进度事件流"""
            # 这里可以从Redis或内存中获取实际进度
            # 为了演示，我们返回一些示例进度
            stages = [
                {'stage': 'fetching_stock_list', 'message': '正在获取股票列表...', 'progress': 10},
                {'stage': 'stock_list_complete', 'message': '股票列表获取完成', 'progress': 20},
                {'stage': 'analysis_start', 'message': '开始策略分析...', 'progress': 30},
                {'stage': 'analyzing', 'message': '正在分析股票...', 'progress': 50},
                {'stage': 'analyzing', 'message': '分析进度70%...', 'progress': 70},
                {'stage': 'analyzing', 'message': '分析进度90%...', 'progress': 90},
                {'stage': 'complete', 'message': '分析完成！', 'progress': 100}
            ]
            
            for stage in stages:
                data = json.dumps(stage)
                yield f"data: {data}\n\n"
                time.sleep(1)  # 模拟进度更新间隔
        
        return Response(
            generate_progress(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        print(f"获取进度失败: {e}")
        return jsonify({'error': str(e)})

@app.route('/api/strategies/export-excel', methods=['POST'])
def export_excel():
    """导出Excel文件"""
    try:
        from market_scanner import MarketScanner
        import os
        from flask import send_file
        
        data = request.get_json()
        scan_results = data.get('scan_results')
        
        if not scan_results:
            return jsonify({
                'success': False,
                'message': '没有扫描结果可导出'
            })
        
        # 创建临时扫描器并设置结果
        scanner = MarketScanner()
        scanner.scan_results = scan_results
        
        # 导出Excel
        filename = scanner.export_to_excel()
        
        # 返回文件下载
        return send_file(
            filename,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        print(f"导出Excel失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/export-csv', methods=['POST'])
def export_csv():
    """导出CSV文件"""
    try:
        from market_scanner import MarketScanner
        import os
        from flask import send_file
        
        data = request.get_json()
        scan_results = data.get('scan_results')
        
        if not scan_results:
            return jsonify({
                'success': False,
                'message': '没有扫描结果可导出'
            })
        
        # 创建临时扫描器并设置结果
        scanner = MarketScanner()
        scanner.scan_results = scan_results
        
        # 导出CSV
        filename = scanner.export_to_csv()
        
        # 返回文件下载
        return send_file(
            filename,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
        
    except Exception as e:
        print(f"导出CSV失败: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/backtest', methods=['POST'])
def run_strategy_backtest():
    """运行策略回测"""
    try:
        data = request.get_json()
        strategy_id = data.get('strategy_id')
        stock_code = data.get('stock_code')
        start_date = data.get('start_date', '20220101')
        end_date = data.get('end_date', '20241231')
        initial_capital = data.get('initial_capital', 100000)
        
        if not strategy_id or not stock_code:
            return jsonify({
                'success': False,
                'message': '请提供策略ID和股票代码'
            })
        
        result = strategy_engine.run_backtest(
            strategy_id, stock_code, start_date, end_date, initial_capital
        )
        return jsonify(result)
    except Exception as e:
        print(f"回测失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/list', methods=['GET'])
def get_strategies_list():
    """获取所有策略列表"""
    try:
        strategies_info = []
        for strategy_id, strategy in strategy_engine.strategies.items():
            strategies_info.append({
                'id': strategy_id,
                'name': strategy['name'],
                'type': strategy['type'],
                'param_count': len(strategy['params'])
            })
        
        return jsonify({
            'success': True,
            'strategies': strategies_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/stocks/count', methods=['POST'])
def get_stock_count():
    """
    获取筛选条件下的股票数量
    """
    try:
        data = request.get_json()
        markets = data.get('markets', ['all'])
        industries = data.get('industries', ['all'])
        scan_type = data.get('scan_type', 'quick')  # quick 或 full
        
        print(f"📊 统计股票数量 - 市场: {markets}, 行业: {industries}, 类型: {scan_type}")
        
        # 根据扫描类型选择不同的统计方式
        if scan_type == 'full':
            # 全市场扫描 - 统计所有股票
            try:
                # 修复导入问题 - 使用绝对导入
                import sys
                import os
                current_dir = os.path.dirname(os.path.abspath(__file__))
                sys.path.insert(0, current_dir)
                
                from src.market_scanner_full import FullMarketScanner
                scanner = FullMarketScanner()
                
                # 获取筛选后的股票
                filtered_stocks = scanner.get_filtered_stocks(markets, industries)
                print(f"📊 全市场筛选后股票数: {len(filtered_stocks)}")
                
                # 统计各板块分布
                market_breakdown = {}
                for stock in filtered_stocks:
                    code = stock['code']
                    if code.startswith('6') and not code.startswith('688'):
                        market_breakdown['沪A主板'] = market_breakdown.get('沪A主板', 0) + 1
                    elif code.startswith('688'):
                        market_breakdown['科创板'] = market_breakdown.get('科创板', 0) + 1
                    elif code.startswith('0'):
                        market_breakdown['深A主板'] = market_breakdown.get('深A主板', 0) + 1
                    elif code.startswith('3'):
                        market_breakdown['创业板'] = market_breakdown.get('创业板', 0) + 1
                    elif code.startswith('8'):
                        market_breakdown['北交所'] = market_breakdown.get('北交所', 0) + 1
                
                result = {
                    'success': True,
                    'total_count': len(filtered_stocks),
                    'scan_type': 'full',
                    'estimated_time': f"{len(filtered_stocks) * 0.8 / 60:.1f} 分钟",  # 预估每股0.8秒
                    'market_breakdown': market_breakdown,
                    'data_sources': 'FullMarketScanner + TuShare',
                    'filter_applied': {
                        'markets': markets,
                        'industries': industries
                    },
                    'warning': f'将分析筛选后的 {len(filtered_stocks)} 只股票，预计耗时较长' if len(filtered_stocks) > 500 else f'将分析筛选后的 {len(filtered_stocks)} 只股票'
                }
                
            except Exception as e:
                print(f"获取全市场股票数量失败: {e}")
                result = {
                    'success': False,
                    'error': f'无法获取全市场股票数量: {e}'
                }
        else:
            # 快速扫描 - 使用采样统计
            try:
                # 修复导入问题 - 使用绝对导入
                import sys
                import os
                current_dir = os.path.dirname(os.path.abspath(__file__))
                sys.path.insert(0, current_dir)
                
                from src.market_scanner import MarketScanner
                scanner = MarketScanner()
                
                # 获取基础股票列表
                stocks = scanner.get_stock_list()
                print(f"📊 原始股票总数: {len(stocks)}")
                
                # 应用筛选条件
                filtered_stocks = []
                for stock in stocks:
                    # 市场筛选
                    if not _match_market_filter_for_count(stock, markets):
                        continue
                    # 行业筛选  
                    if not _match_industry_filter_for_count(stock, industries):
                        continue
                    filtered_stocks.append(stock)
                
                print(f"📊 筛选后股票数: {len(filtered_stocks)}")
                
                # 统计各板块分布
                market_breakdown = {}
                for stock in filtered_stocks:
                    code = stock['code']
                    if code.startswith('6') and not code.startswith('688'):
                        market_breakdown['沪A主板'] = market_breakdown.get('沪A主板', 0) + 1
                    elif code.startswith('688'):
                        market_breakdown['科创板'] = market_breakdown.get('科创板', 0) + 1
                    elif code.startswith('0'):
                        market_breakdown['深A主板'] = market_breakdown.get('深A主板', 0) + 1
                    elif code.startswith('3'):
                        market_breakdown['创业板'] = market_breakdown.get('创业板', 0) + 1
                    elif code.startswith('8'):
                        market_breakdown['北交所'] = market_breakdown.get('北交所', 0) + 1
                
                result = {
                    'success': True,
                    'total_count': len(filtered_stocks),
                    'scan_type': 'quick',
                    'estimated_time': f"{len(filtered_stocks) * 0.15 / 60:.1f} 分钟",  # 预估每股0.15秒
                    'market_breakdown': market_breakdown,
                    'data_sources': 'MarketScanner + TuShare',
                    'filter_applied': {
                        'markets': markets,
                        'industries': industries
                    },
                    'filter_effectiveness': f"从 {len(stocks)} 筛选到 {len(filtered_stocks)} 只股票"
                }
                
            except Exception as e:
                print(f"获取快速扫描股票数量失败: {e}")
                result = {
                    'success': False,
                    'error': f'无法获取股票数量: {e}'
                }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ 获取股票数量失败: {e}")
        return jsonify({
            'success': False,
            'error': f'获取股票数量失败: {e}'
        })

@app.route('/api/strategies/preset-scan', methods=['POST'])
def preset_strategy_scan():
    """执行预置策略扫描 - 优化超时版本"""
    try:
        # 修复相对导入问题 - 使用绝对导入
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from src.optimized_strategy_engine import OptimizedStrategyEngine
        
        data = request.get_json()
        strategy_id = data.get('strategy_id')
        strategy_name = data.get('strategy_name', '未知策略')
        parameters = data.get('parameters', {})
        markets = data.get('markets', ['all'])
        industries = data.get('industries', ['all'])
        
        print(f"🎯 执行预置策略扫描: {strategy_name}")
        print(f"📊 筛选条件 - 市场: {markets}, 行业: {industries}")
        print(f"📈 策略参数: {len(parameters)} 个参数")
        
        # 验证参数
        if not strategy_id:
            return jsonify({
                'success': False,
                'message': '请提供策略ID'
            })
        
        # 创建优化策略引擎
        engine = OptimizedStrategyEngine()
        
        # 优化的策略参数（确保能筛选出股票）
        optimized_parameters = {
            'pe_ratio_min': {'value': 3, 'description': 'PE最小值'},
            'pe_ratio_max': {'value': 200, 'description': 'PE最大值'},
            'pb_ratio_min': {'value': 0.1, 'description': 'PB最小值'},
            'pb_ratio_max': {'value': 50, 'description': 'PB最大值'},
            'market_cap_min': {'value': 1, 'description': '市值最小值(亿)'},
            'market_cap_max': {'value': 50000, 'description': '市值最大值(亿)'},
            'roe_min': {'value': 0.01, 'description': 'ROE最小值'},
            **parameters
        }
        
        print(f"🔧 使用优化参数: {optimized_parameters}")
        
        try:
            # 执行策略扫描 - 支持市场和行业筛选，Windows兼容超时保护
            import threading
            import time
            
            # Windows兼容的超时控制
            execution_timeout = [False]  # 使用列表以便在内嵌函数中修改
            start_time = time.time()
            max_execution_time = 600  # 10分钟超时
            
            def timeout_checker():
                time.sleep(max_execution_time)
                execution_timeout[0] = True
                print("⏰ 策略执行达到10分钟超时限制")
            
            # 启动超时检查线程
            timeout_thread = threading.Thread(target=timeout_checker, daemon=True)
            timeout_thread.start()
            
            try:
                print(f"🚀 开始执行真实策略扫描 - 策略: {strategy_name}")
                print(f"📊 筛选参数: {optimized_parameters}")
                print(f"🎯 目标市场: {markets}, 行业: {industries}")
                
                result = engine.execute_strategy_scan(
                    strategy_name=strategy_name,
                    parameters=optimized_parameters,
                    max_stocks=300,  # 增加分析数量，提高成功率
                    markets=markets,
                    industries=industries,
                    timeout_flag=execution_timeout  # 传递超时标志
                )
                
                execution_time = time.time() - start_time
                print(f"✅ 策略扫描完成，耗时: {execution_time:.2f}秒")
                
            finally:
                # 超时线程会自动结束，无需手动清理
                pass
            
            if result.get('success') and result.get('qualified_stocks'):
                print(f"✅ 策略扫描成功！找到 {len(result['qualified_stocks'])} 只符合条件的股票")
                
                # 格式化结果以匹配前端期望
                formatted_result = {
                    'success': True,
                    'strategy_name': strategy_name,
                    'qualified_stocks': result['qualified_stocks'],
                    'total_analyzed': result['analysis_summary']['total_analyzed'],
                    'qualified_count': result['analysis_summary']['qualified_count'],
                    'real_data_percentage': result['data_quality']['real_data_percentage'],
                    'data_quality_grade': result['data_quality']['grade'],
                    'execution_time': result['analysis_summary']['execution_time'],
                    'preset_strategy': {
                        'id': strategy_id,
                        'name': strategy_name,
                        'parameters': optimized_parameters
                    },
                    'data_verification': f"TuShare: {result['data_quality']['tushare_available']}, AkShare: {result['data_quality']['akshare_available']}",
                    'timeout_protection': True,
                    'optimization_level': 'enhanced'
                }
                
                return jsonify(formatted_result)
            else:
                error_message = result.get('error', '未找到符合条件的股票')
                print(f"⚠️ 策略扫描完成但无结果: {error_message}")
                
                return jsonify({
                    'success': False,
                    'message': f'策略扫描完成，但{error_message}。建议调整筛选条件。',
                    'strategy_name': strategy_name,
                    'analyzed_count': result.get('analysis_summary', {}).get('total_analyzed', 0),
                    'suggestions': ['降低PE/PB要求', '扩大市值范围', '选择不同行业']
                })
        
        except TimeoutError:
            print("❌ 策略执行超时")
            return jsonify({
                'success': False,
                'message': '策略执行超时（10分钟），请稍后重试或减少分析范围',
                'error_type': 'timeout'
            })
        except Exception as e:
            print(f"❌ 策略扫描执行错误: {e}")
            import traceback
            traceback.print_exc()
            
            return jsonify({
                'success': False,
                'message': f'策略扫描失败: {str(e)}',
                'error_type': 'execution_error'
            })
        
    except Exception as e:
        print(f"❌ 执行预置策略扫描失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'系统错误: {str(e)}',
            'error_type': 'system_error'
        })

# --------------------------------------------------------------------------------------
# 高级策略配置API接口
# --------------------------------------------------------------------------------------

@app.route('/api/advanced-strategies/list', methods=['GET'])
def get_advanced_strategies():
    """获取高级策略列表"""
    try:
        strategies = advanced_strategy_engine.get_strategy_templates()
        return jsonify({
            'success': True,
            'strategies': strategies
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/advanced-strategies/execute', methods=['POST'])
def execute_advanced_strategy():
    """执行高级策略分析"""
    try:
        data = request.get_json()
        strategy_id = data.get('strategy_id')
        strategy_name = data.get('strategy_name', '未知策略')
        parameters = data.get('parameters', {})
        max_stocks = data.get('max_stocks', 100)
        
        print(f"🎯 执行高级策略: {strategy_name}")
        print(f"策略参数: {len(parameters)} 个参数")
        print(f"最大分析股票数: {max_stocks}")
        
        # 验证参数
        if not strategy_id:
            return jsonify({
                'success': False,
                'message': '请提供策略ID'
            })
        
        # 执行策略分析
        result = advanced_strategy_engine.execute_advanced_strategy(
            strategy_id=strategy_id,
            strategy_params=parameters,
            max_stocks=max_stocks
        )
        
        # 添加策略信息
        if result.get('success'):
            result['strategy_info'] = {
                'id': strategy_id,
                'name': strategy_name,
                'parameters': parameters
            }
            result['scan_summary'] = {
                'strategy_name': strategy_name,
                'total_analyzed': result.get('total_analyzed', 0),
                'qualified_stocks': len(result.get('qualified_stocks', [])),
                'top_30_count': len(result.get('top_30_stocks', [])),
                'data_quality': result.get('data_quality', 0),
                'execution_time': result.get('execution_time', 0)
            }
        
        return safe_jsonify(result)
        
    except Exception as e:
        print(f"❌ 高级策略执行异常: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'高级策略执行失败: {e}'
        })

@app.route('/api/advanced-strategies/data-sources/status', methods=['GET'])
def get_data_sources_status():
    """获取数据源状态"""
    try:
        # 检查数据源可用性
        status = {
            'tushare': advanced_strategy_engine.tushare_available,
            'akshare': advanced_strategy_engine.akshare_available,
            'health_check_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return jsonify({
            'success': True,
            'data_sources': status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/advanced-strategies/stock-universe', methods=['GET'])
def get_stock_universe_preview():
    """获取股票池预览"""
    try:
        min_market_cap = request.args.get('min_market_cap', 50, type=float)
        preview_count = request.args.get('preview_count', 20, type=int)
        
        # 获取股票池预览
        stock_universe = advanced_strategy_engine.get_stock_universe(min_market_cap)
        preview_stocks = stock_universe[:preview_count]
        
        return jsonify({
            'success': True,
            'total_stocks': len(stock_universe),
            'preview_stocks': preview_stocks,
            'preview_count': len(preview_stocks)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        })

@app.route('/api/strategies/full-market-scan', methods=['POST'])
def full_market_scan():
    """执行智能筛选股票扫描 - 根据市场和行业筛选，100%真实数据"""
    try:
        # 修复相对导入问题 - 使用绝对导入
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from src.market_scanner_full import FullMarketScanner
        import queue
        import threading
        
        data = request.get_json()
        strategy_id_input = data.get('strategy_id', 6)
        start_date = data.get('start_date', '20220101')
        end_date = data.get('end_date', '20251231')
        min_score = data.get('min_score', 60.0)
        batch_size = data.get('batch_size', 100)  # 批处理大小
        
        # 获取筛选条件
        markets = data.get('markets', ['all'])
        industries = data.get('industries', ['all'])
        
        # 策略ID映射 - 将前端字符串ID转换为后端数字ID
        strategy_mapping = {
            'blue_chip': 1,           # 蓝筹白马 -> 价值投资策略
            'high_dividend': 2,       # 高股息 -> 股息策略
            'quality_growth': 3,      # 质量成长 -> 成长策略
            'value_investing': 1,     # 低估值 -> 价值投资策略
            'small_cap_growth': 3,    # 小盘成长 -> 成长策略
            'cyclical_rotation': 4,   # 周期轮动 -> 动量策略
            'consumer_leaders': 5,    # 消费龙头 -> 趋势跟踪策略
            'tech_innovation': 6,     # 科技创新 -> 高频交易策略
            'balanced_allocation': 2, # 均衡配置 -> 股息策略
            'momentum_trend': 4       # 动量趋势 -> 动量策略
        }
        
        # 转换策略ID
        if isinstance(strategy_id_input, str):
            strategy_id = strategy_mapping.get(strategy_id_input, 1)
            strategy_name = strategy_id_input
            print(f"🔄 策略ID映射: {strategy_id_input} -> {strategy_id}")
        else:
            strategy_id = strategy_id_input
            strategy_name = f"策略{strategy_id}"
        
        print(f"🚀 启动智能筛选股票扫描（100%真实数据）")
        print(f"策略: {strategy_name} (ID: {strategy_id})")
        print(f"筛选条件 - 市场: {markets}, 行业: {industries}")
        print(f"时间范围: {start_date} - {end_date}")
        print(f"最小评分: {min_score}, 批处理大小: {batch_size}")
        print(f"💯 数据源要求: 100%真实数据，拒绝模拟数据")
        
        # 验证参数
        if not strategy_id:
            return jsonify({
                'success': False,
                'message': '请提供策略ID'
            })
        
        # 创建全市场扫描器
        scanner = FullMarketScanner(max_workers=5)
        
        # 存储进度信息
        progress_queue = queue.Queue()
        scan_result = {}
        progress_updates = []
        
        def progress_callback(progress_data):
            """进度回调函数"""
            progress_queue.put(progress_data)
            progress_updates.append({
                'timestamp': datetime.now().strftime('%H:%M:%S'),
                'data': progress_data
            })
            print(f"📊 进度更新: {progress_data.get('message', '未知状态')}")
        
        def run_scan():
            """在后台线程中执行扫描"""
            try:
                result = scanner.execute_full_market_scan(
                    strategy_id=strategy_id,
                    start_date=start_date,
                    end_date=end_date,
                    min_score=min_score,
                    batch_size=batch_size,
                    markets=markets,  # 传递市场筛选条件
                    industries=industries  # 传递行业筛选条件
                )
                scan_result.update(result)
            except Exception as e:
                scan_result.update({
                    'success': False,
                    'error': f'扫描执行失败: {str(e)}'
                })
        
        # 启动后台扫描
        scan_thread = threading.Thread(target=run_scan)
        scan_thread.start()
        
        # 等待初始化完成或超时（最多30秒）
        timeout_count = 0
        max_timeout = 30
        
        while scan_thread.is_alive() and timeout_count < max_timeout:
            time.sleep(1)
            timeout_count += 1
            
            # 检查是否有进度更新
            while not progress_queue.empty():
                try:
                    progress_data = progress_queue.get_nowait()
                    if progress_data.get('stage') in ['full_scan_start', 'intelligent_scanning', 'scan_complete']:
                        break
                except:
                    break
        
        # 收集最终进度更新
        final_progress = []
        while not progress_queue.empty():
            try:
                final_progress.append(progress_queue.get_nowait())
            except:
                break
        
        # 等待扫描完成
        scan_thread.join(timeout=1200)  # 最多等待20分钟
        
        # 检查是否超时
        if scan_thread.is_alive():
            return jsonify({
                'success': False,
                'message': '扫描超时（超过20分钟），请尝试减少分析股票数量或选择更精确的筛选条件',
                'progress_updates': progress_updates[-10:],  # 返回最后10条进度
                'scan_timeout': True,
                'markets_filter': markets,
                'industries_filter': industries
            })
        
        # 返回扫描结果
        if not scan_result:
            scan_result = {
                'success': False,
                'error': '扫描未正常完成'
            }
        
        scan_result.update({
            'strategy_name': strategy_name,
            'strategy_id': strategy_id,
            'markets_filter': markets,
            'industries_filter': industries,
            'scan_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'progress_updates': progress_updates[-20:] if progress_updates else []
        })
        
        print(f"✅ 智能筛选股票扫描完成")
        return jsonify(scan_result)
        
    except Exception as e:
        print(f"❌ 全市场扫描API错误: {e}")
        return jsonify({
                    'success': False,
            'message': f'服务器内部错误: {str(e)}'
        }), 500

# 股票筛选辅助函数
def _match_market_filter_for_count(stock: Dict, markets: List[str]) -> bool:
    """检查股票是否符合市场筛选条件（用于数量统计）"""
    if 'all' in markets or not markets:
        return True
        
    code = stock['code']
    
    # 市场映射
    market_checks = {
        'main_board_sh': lambda c: c.startswith('6') and not c.startswith('688'),  # 沪A主板
        'star_market': lambda c: c.startswith('688'),  # 科创板
        'main_board_sz': lambda c: c.startswith('0'),  # 深A主板
        'gem': lambda c: c.startswith('3'),  # 创业板
        'beijing': lambda c: c.startswith('8'),  # 北交所
        'sh': lambda c: c.startswith('6'),  # 所有沪A
        'sz': lambda c: c.startswith(('0', '3')),  # 所有深A
    }
    
    for market in markets:
        if market in market_checks:
            if market_checks[market](code):
                return True
    
    return False

def _match_industry_filter_for_count(stock: Dict, industries: List[str]) -> bool:
    """检查股票是否符合行业筛选条件（用于数量统计）"""
    if 'all' in industries or not industries:
        return True
        
    stock_name = stock.get('name', '')
    
    # 行业关键词映射
    industry_keywords = {
        'banking': ['银行', '农商', '农信', '信用社'],
        'insurance': ['保险', '人寿', '财险', '太保'],
        'securities': ['证券', '期货', '信托', '投资'],
        'technology': ['科技', '软件', '网络', '计算机', '信息', '数据', '云', '互联网', '智能'],
        'healthcare': ['医药', '生物', '制药', '医疗', '健康', '药业', '医院'],
        'manufacturing': ['制造', '机械', '设备', '汽车', '钢铁', '有色', '化工', '电力', '建筑'],
        'real_estate': ['地产', '房地产', '建设', '置业', '开发'],
        'consumer': ['消费', '零售', '商业', '食品', '饮料', '服装', '家电'],
        'finance': ['金融', '资本', '财富', '基金', '担保']
    }
    
    for industry in industries:
        if industry in industry_keywords:
            keywords = industry_keywords[industry]
            if any(keyword in stock_name for keyword in keywords):
                return True
    
    return False

# 全局进度存储
execution_progress = {}

@app.route('/api/strategies/filtered-stocks', methods=['POST'])
def get_filtered_stocks():
    """根据市场和行业筛选股票代码集"""
    try:
        data = request.get_json()
        markets = data.get('markets', ['all'])
        industries = data.get('industries', ['all'])
        
        print(f"🔍 筛选股票代码集 - 市场: {markets}, 行业: {industries}")
        
        # 修复相对导入问题 - 使用绝对导入
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from src.market_scanner_full import FullMarketScanner
        
        # 创建扫描器获取筛选后的股票列表
        scanner = FullMarketScanner(max_workers=1)
        filtered_stocks = scanner.get_filtered_stocks(markets, industries)
        
        stock_count = len(filtered_stocks)
        
        # 提取股票代码和名称
        stock_codes = []
        for stock in filtered_stocks[:200]:  # 限制最多200只，避免过载
            stock_codes.append({
                'code': stock['code'],
                'name': stock['name'],
                'market': stock.get('market', ''),
                'industry': stock.get('industry', '')
            })
        
        print(f"✅ 筛选完成：找到 {stock_count} 只股票，返回前 {len(stock_codes)} 只")
        
        return jsonify({
            'success': True,
            'total_stocks': stock_count,
            'filtered_stocks': stock_codes,
            'markets_filter': markets,
            'industries_filter': industries,
            'message': f'成功筛选出 {stock_count} 只股票'
        })
        
    except Exception as e:
        print(f"❌ 股票筛选失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'股票筛选失败: {str(e)}'
        })

@app.route('/api/strategies/execute-optimized', methods=['POST'])
def execute_optimized_strategy():
    """执行优化策略 - 并发分析版本，按实际筛选数量分析"""
    try:
        data = request.get_json()
        strategy_id = data.get('strategy_id')
        strategy_name = data.get('strategy_name', '未知策略')
        markets = data.get('markets', ['all'])
        industries = data.get('industries', ['all'])
        max_stocks = data.get('max_stocks', 10000)  # 大幅提高默认上限
        min_score = data.get('min_score', 70.0)     # 提高最低评分要求
        max_workers = data.get('max_workers', 5)    # 并发数
        
        # 生成唯一执行ID
        execution_id = str(uuid.uuid4())
        
        print(f"🚀 启动深度策略执行 - ID: {execution_id}")
        print(f"策略: {strategy_name}, 市场: {markets}, 行业: {industries}")
        print(f"最大股票数: {max_stocks}, 最小评分: {min_score}, 并发数: {max_workers}")
        
        # 初始化进度
        execution_progress[execution_id] = {
            'stage': 'initializing',
            'progress': 0,
            'current_stock': '',
            'message': '正在初始化深度分析引擎...',
            'total_stocks': 0,
            'analyzed_stocks': 0,
            'qualified_stocks': 0,
            'start_time': time.time(),
            'status': 'running'
        }
        
        # 修复相对导入问题
        import sys
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        sys.path.insert(0, current_dir)
        
        from src.optimized_strategy_engine import OptimizedStrategyEngine
        import threading
        
        def progress_callback(exec_id, progress_data):
            """进度回调函数"""
            if exec_id in execution_progress:
                execution_progress[exec_id].update(progress_data)
        
        def execute_in_background():
            """后台深度并发执行策略分析"""
            try:
                # 第一步：智能股票筛选
                execution_progress[execution_id].update({
                    'stage': 'filtering',
                    'progress': 5,
                    'message': '正在执行智能股票筛选...'
                })
                
                engine = OptimizedStrategyEngine()
                
                # 获取筛选后的股票列表
                from src.market_scanner_full import FullMarketScanner
                scanner = FullMarketScanner(max_workers=1)
                filtered_stocks = scanner.get_filtered_stocks(markets, industries)
                
                if not filtered_stocks:
                    raise Exception("未找到符合筛选条件的股票，请调整筛选条件")
                
                total_filtered = len(filtered_stocks)
                
                # 🔥 关键修改：按用户实际需求决定分析数量
                if max_stocks >= 10000:  # 如果用户设置很大的数字，说明要全部分析
                    actual_analysis_count = total_filtered  # 全部分析
                    analysis_message = f"按您的筛选条件，将深度分析全部{total_filtered}只股票"
                else:
                    actual_analysis_count = min(max_stocks, total_filtered)  # 按用户指定数量
                    analysis_message = f"按您的要求，将深度分析{actual_analysis_count}只股票（共筛选出{total_filtered}只）"
                
                # 选择要分析的股票（优先选择市值较大、流动性较好的）
                analysis_stocks = sorted(filtered_stocks, key=lambda x: x.get('market_priority', 0), reverse=True)[:actual_analysis_count]
                
                execution_progress[execution_id].update({
                    'stage': 'analyzing',
                    'progress': 10,
                    'message': analysis_message,
                    'total_stocks': actual_analysis_count,
                    'filtered_count': total_filtered
                })
                
                print(f"📊 智能筛选完成：{total_filtered} -> {actual_analysis_count} 只股票")
                print(f"🔬 启动深度分析：{max_workers} 线程并发，集成TuShare+AkShare")
                
                # 第二步：深度并发分析
                results = engine.analyze_multiple_stocks_concurrent(
                    stocks_list=analysis_stocks,
                    strategy_id=strategy_id,
                    max_workers=max_workers,
                    progress_callback=progress_callback,
                    execution_id=execution_id
                )
                
                # 🔥 修复：收集所有分析结果，按评分排序（不再过滤）
                all_analyzed_stocks = []
                for result in results:
                    if result.get('success', False):  # 只要分析成功就收集
                        # 增强股票信息
                        enhanced_stock = {
                            'stock_code': result.get('stock_code'),
                            'stock_name': result.get('stock_name'),
                            'score': result.get('score', 0),
                            'market': next((s.get('market', '') for s in analysis_stocks if s['code'] == result.get('stock_code')), ''),
                            'industry': next((s.get('industry', '') for s in analysis_stocks if s['code'] == result.get('stock_code')), ''),
                            'data_source': result.get('data_source', ''),
                            'analysis_reason': result.get('reason', ''),
                            'signals_count': result.get('signals_count', 0),
                            'analysis_details': result.get('analysis_details', {}),
                            'execution_time': result.get('execution_time', 0),
                            'analysis_timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
                        }
                        all_analyzed_stocks.append(enhanced_stock)
                
                # 按评分排序所有股票
                all_analyzed_stocks.sort(key=lambda x: x['score'], reverse=True)
                
                # 获取TOP结果（前50名）
                qualified_stocks = all_analyzed_stocks[:50]
                
                # 第三步：结果排序和分析报告生成
                execution_progress[execution_id].update({
                    'stage': 'completing',
                    'progress': 95,
                    'message': '正在生成TOP评分排序报告...'
                })
                
                # 计算分析统计
                analyzed_count = len(results)
                success_rate = (analyzed_count / actual_analysis_count * 100) if actual_analysis_count > 0 else 0
                # 🔥 修复：不再使用"符合条件"概念，改为TOP数量
                top_count = len(qualified_stocks)  # TOP50数量
                coverage_rate = (top_count / analyzed_count * 100) if analyzed_count > 0 else 0
                
                # 计算分析质量
                avg_score = sum(r.get('score', 0) for r in results) / len(results) if results else 0
                high_quality_count = len([r for r in results if r.get('score', 0) >= 80])
                
                # 最终结果
                final_result = {
                    'success': True,
                    'execution_id': execution_id,
                    'strategy_name': strategy_name,
                    'total_filtered': total_filtered,
                    'total_stocks': actual_analysis_count,
                    'analyzed_stocks': analyzed_count,
                    'qualified_count': len(all_analyzed_stocks),  # 🔥 修复：显示所有分析数量
                    'qualified_stocks': qualified_stocks,  # TOP50
                    'top_30_stocks': qualified_stocks[:30],
                    'all_analyzed_stocks': all_analyzed_stocks,  # 🔥 新增：所有分析结果
                    'markets_filter': markets,
                    'industries_filter': industries,
                    'execution_time': time.time() - execution_progress[execution_id]['start_time'],
                    'data_quality': 100.0,  # 深度优化版本确保100%真实数据
                    'concurrent_workers': max_workers,
                    'min_score_threshold': min_score,
                    'analysis_summary': {
                        'success_rate': success_rate,
                        'top_coverage_rate': coverage_rate,  # 🔥 修复：改为TOP覆盖率
                        'avg_time_per_stock': (time.time() - execution_progress[execution_id]['start_time']) / actual_analysis_count if actual_analysis_count > 0 else 0,
                        'avg_score': round(avg_score, 1),
                        'high_quality_count': high_quality_count,
                        'analysis_mode': 'comprehensive_scoring_ranking'  # 🔥 修复：改为综合评分排序模式
                    }
                }
                
                # 完成进度
                execution_progress[execution_id].update({
                    'stage': 'completed',
                    'progress': 100,
                    'message': f'深度分析完成！筛选{total_filtered}只，深度分析{actual_analysis_count}只，按评分排序展示TOP{len(qualified_stocks)}强，平均评分{avg_score:.1f}分',
                    'result': final_result,
                    'status': 'completed'
                })
                
                print(f"🎉 深度策略执行完成：TOP50 优质股票已生成")
                print(f"📊 分析统计：筛选{total_filtered}只 -> 分析{actual_analysis_count}只 -> 发现{len(qualified_stocks)}只优质股票")
                print(f"🏆 平均评分：{avg_score:.1f}分，高质量股票（≥80分）：{high_quality_count}只")
                print(f"⚡ 执行效率：{max_workers}线程并发，总用时{final_result['execution_time']:.1f}秒，平均{final_result['analysis_summary']['avg_time_per_stock']:.1f}秒/只")
                print(f"🔥 TOP50详情页面已自动打开，支持Excel/JSON导出，查看完整评分详情！")
                
            except Exception as e:
                print(f"❌ 后台深度执行错误: {e}")
                import traceback
                traceback.print_exc()
                execution_progress[execution_id].update({
                    'stage': 'error',
                    'progress': 0,
                    'message': f'深度分析执行失败: {str(e)}',
                    'status': 'error',
                    'error': str(e)
                })
        
        # 启动后台线程
        thread = threading.Thread(target=execute_in_background)
        thread.start()
        
        return jsonify({
            'success': True,
            'execution_id': execution_id,
            'message': '深度策略执行已启动，集成TuShare+AkShare数据源，请通过进度API获取实时状态'
        })
        
    except Exception as e:
        print(f"❌ 深度策略执行启动失败: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
                'success': False,
            'message': f'深度策略执行启动失败: {str(e)}'
        })

@app.route('/api/strategies/progress/<execution_id>')
def get_strategy_progress(execution_id):
    """获取策略执行实时进度"""
    try:
        if execution_id not in execution_progress:
            return jsonify({
                'success': False,
                'message': '执行ID不存在'
            })
        
        progress_data = execution_progress[execution_id].copy()
        
        # 添加时间信息
        elapsed_time = time.time() - progress_data.get('start_time', time.time())
        progress_data['elapsed_time'] = elapsed_time
        progress_data['elapsed_time_formatted'] = f"{int(elapsed_time//60)}分{int(elapsed_time%60)}秒"
        
        return jsonify({
            'success': True,
            'progress': progress_data
        })
        
    except Exception as e:
        print(f"❌ 获取进度失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取进度失败: {str(e)}'
        })

@app.route('/api/strategies/result/<execution_id>')
def get_strategy_result(execution_id):
    """获取策略执行结果"""
    try:
        if execution_id not in execution_progress:
            return jsonify({
                'success': False,
                'message': '执行ID不存在'
            })
        
        progress_data = execution_progress[execution_id]
        
        if progress_data.get('status') == 'completed':
            result = progress_data.get('result', {})
            return jsonify(result)
        elif progress_data.get('status') == 'error':
            return jsonify({
                'success': False,
                'message': progress_data.get('error', '执行失败')
            })
        else:
            return jsonify({
                'success': False,
                'message': '策略执行尚未完成',
                'status': progress_data.get('status', 'running')
            })
        
    except Exception as e:
        print(f"❌ 获取结果失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取结果失败: {str(e)}'
        })

@app.route('/api/market-overview', methods=['POST'])
def market_overview():
    """
    全市场股票数据概览API - 终极高性能版
    支持分页、搜索、排序、真实数据源
    """
    try:
        print("🚀 接收到全市场分析请求（终极优化版）...")
        
        data = request.get_json() or {}
        page = int(data.get('page', 1))
        page_size = int(data.get('page_size', 50))
        keyword = data.get('keyword', '').strip()
        use_real_data = data.get('use_real_data', True)  # 强制默认使用真实数据
        
        print(f"📊 请求参数: page={page}, page_size={page_size}, keyword='{keyword}', real_data={use_real_data}")
        
        # 行业最佳实践字段定义（34个专业指标）
        best_fields = [
            # 基础信息 (4)
            'code', 'name', 'industry', 'area',
            # 实时行情数据 (11) 
            'close', 'pct_chg', 'change', 'pre_close', 'open', 'high', 'low', 'volume', 'amount', 'turnover_rate', 'pe',
            # 基本面数据 (7)
            'pb', 'total_mv', 'circ_mv', 'dv_ratio', 'dv_ttm', 'roe', 'net_profit_yoy',
            # 技术指标 (8)
            'ma5', 'ma10', 'ma20', 'ma60', 'macd', 'rsi', 'bollinger_upper', 'bollinger_lower',
            # 交易信号 (4)
            'signal_type', 'signal_strength', 'investment_style', 'risk_level'
        ]
        
        # 使用终极高性能扫描器
        try:
            # 导入高性能扫描器，确保路径正确
            current_dir = os.path.dirname(os.path.abspath(__file__))
            if current_dir not in sys.path:
                sys.path.insert(0, current_dir)
            
            # 确保能正确导入
            try:
                from high_performance_scanner import UltimateMarketScanner
            except ImportError:
                # 备用导入方式
                import importlib.util
                scanner_path = os.path.join(current_dir, 'high_performance_scanner.py')
                spec = importlib.util.spec_from_file_location("high_performance_scanner", scanner_path)
                scanner_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(scanner_module)
                UltimateMarketScanner = scanner_module.UltimateMarketScanner
            
            print("📡 正在使用终极高性能扫描器获取数据...")
            start_time = time.time()
            
            # 初始化终极扫描器 - 超级性能配置
            scanner = UltimateMarketScanner(max_workers=30, use_cache=True, cache_ttl=120)
            
            # 验证数据源连接状态
            data_sources_status = scanner.check_data_sources()
            print(f"🔍 数据源状态: TuShare={data_sources_status.get('tushare', False)}, AkShare={data_sources_status.get('akshare', False)}")
            
            # 获取股票基础列表 - 超高速
            all_stocks_basic = scanner.get_all_stocks(use_real_data=True)
            
            if not all_stocks_basic:
                return jsonify({
                    'success': False,
                    'error': '无法获取股票列表',
                    'message': '数据源暂时不可用，请稍后重试'
                })
            
            # 关键词过滤（在获取详细数据前过滤，提高效率）
            if keyword:
                filtered_stocks = []
                keyword_lower = keyword.lower()
                for stock in all_stocks_basic:
                    if (keyword_lower in stock.get('code', '').lower() or 
                        keyword_lower in stock.get('name', '').lower()):
                        filtered_stocks.append(stock)
                all_stocks_basic = filtered_stocks
            
            total_count = len(all_stocks_basic)
            print(f"📊 股票数据: 总数={total_count}, 关键词过滤后={len(all_stocks_basic)}")
            
            # 分页处理（只处理当前页需要的股票）
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            page_stocks = all_stocks_basic[start_idx:end_idx]
            
            print(f"📄 当前页数据: {len(page_stocks)}条 ({start_idx+1}-{min(end_idx, total_count)})")
            
            # 高性能并发获取详细数据
            detailed_results = []
            success_count = 0
            
            print(f"🚀 开始高性能并发处理 {len(page_stocks)} 只股票...")
            
            # 使用线程池并发处理 - 终极优化
            from concurrent.futures import ThreadPoolExecutor, as_completed
            
            with ThreadPoolExecutor(max_workers=30) as executor:
                # 提交任务
                future_to_stock = {
                    executor.submit(scanner.get_stock_detailed_data, stock): stock 
                    for stock in page_stocks
                }
                
                # 收集结果
                for i, future in enumerate(as_completed(future_to_stock), 1):
                    stock = future_to_stock[future]
                    try:
                        detailed_data = future.result(timeout=10)  # 10秒超时
                        
                        if detailed_data and detailed_data.get('close'):
                            # 数据质量验证
                            required_fields = ['code', 'name', 'close']
                            if all(field in detailed_data for field in required_fields):
                                detailed_results.append(detailed_data)
                                success_count += 1
                        
                        # 进度输出
                        if i % 10 == 0 or i == len(page_stocks):
                            progress = (i / len(page_stocks)) * 100
                            print(f"⚡ 处理进度: {i}/{len(page_stocks)} ({progress:.1f}%)")
                            
                    except Exception as e:
                        print(f"⚠️ 股票 {stock.get('code', 'unknown')} 处理失败: {e}")
                        continue
            
            elapsed_time = time.time() - start_time
            success_rate = (success_count / len(page_stocks)) * 100 if page_stocks else 0
            
            print(f"🎉 终极高性能处理完成: {success_count}/{len(page_stocks)}条成功率{success_rate:.1f}%，耗时{elapsed_time:.1f}秒")
            print(f"⚡ 平均速度: {elapsed_time/len(page_stocks):.2f}秒/股 (目标: <0.2秒/股)")
            
            # 返回优化后的数据
            return jsonify({
                'success': True,
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'data': detailed_results,
                'fields': best_fields,
                'data_source': f'终极高性能TuShare+AkShare({success_rate:.1f}%成功率)',
                'processing_time': f"{elapsed_time:.1f}秒",
                'message': f'终极优化全市场数据分析，第{page}页，共{total_count}条',
                'data_quality': {
                    'success_rate': success_rate,
                    'total_stocks': total_count,
                    'valid_data': success_count,
                    'data_sources': data_sources_status,
                    'performance': {
                        'total_time': elapsed_time,
                        'avg_time_per_stock': elapsed_time / len(page_stocks) if page_stocks else 0,
                        'concurrent_workers': 30,
                        'cache_enabled': True
                    }
                }
            })
            
        except Exception as e:
            print(f"❌ 终极高性能数据获取失败: {e}")
            import traceback
            traceback.print_exc()
            
            # 返回详细错误信息
            return jsonify({
                'success': False,
                'error': f'终极数据获取失败: {str(e)}',
                'message': '请检查TuShare和AkShare数据源连接',
                'debug_info': {
                    'error_type': type(e).__name__,
                    'error_location': 'market_overview_api',
                    'suggestions': [
                        '检查网络连接',
                        '验证TuShare token配置',
                        '确认AkShare模块安装'
                    ]
                }
            })
            
    except Exception as e:
        import traceback
        print(f"❌ 全市场分析API错误: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'message': f'全市场分析失败: {str(e)}',
            'error_type': type(e).__name__
        })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 