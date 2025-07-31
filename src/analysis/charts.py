"""
图表生成模块
提供各种图表的生成功能
"""

import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from typing import Dict, List, Optional

class ChartGenerator:
    """图表生成类"""
    
    def __init__(self, data: pd.DataFrame, indicators: Dict):
        """
        初始化图表生成器
        :param data: 股票数据
        :param indicators: 技术指标数据
        """
        self.data = data
        self.indicators = indicators
    
    def create_candlestick_chart(self, title: str = "股票K线图") -> go.Figure:
        """
        创建K线图
        :param title: 图表标题
        :return: Plotly图表对象
        """
        fig = go.Figure()
        
        # 添加K线图
        fig.add_trace(go.Candlestick(
            x=self.data['Date'],
            open=self.data['Open'],
            high=self.data['High'],
            low=self.data['Low'],
            close=self.data['Close'],
            name='K线',
            increasing_line_color='#ff5252',  # A股红色
            decreasing_line_color='#00e676',  # A股绿色
            increasing_fillcolor='#ff5252',
            decreasing_fillcolor='#00e676'
        ))
        
        # 添加移动平均线
        if 'ma' in self.indicators:
            ma_data = self.indicators['ma']
            colors = ['#90caf9', '#ffb74d', '#ce93d8']  # 蓝、橙、紫
            periods = [5, 10, 20]
            
            for i, period in enumerate(periods):
                if period in ma_data:
                    fig.add_trace(go.Scatter(
                        x=self.data['Date'],
                        y=ma_data[period],
                        mode='lines',
                        name=f'MA{period}',
                        line=dict(color=colors[i], width=2)
                    ))
        
        # 添加布林带
        if 'bollinger' in self.indicators:
            bb_data = self.indicators['bollinger']
            
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=bb_data['upper'],
                mode='lines',
                name='布林带上轨',
                line=dict(color='rgba(0, 230, 118, 0.5)', width=1),
                showlegend=True
            ))
            
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=bb_data['lower'],
                mode='lines',
                name='布林带下轨',
                line=dict(color='rgba(0, 230, 118, 0.5)', width=1),
                fill='tonexty',
                fillcolor='rgba(0, 230, 118, 0.1)',
                showlegend=False
            ))
        
        # 更新布局
        fig.update_layout(
            title=title,
            xaxis_title='日期',
            yaxis_title='价格',
            template='plotly_dark',
            height=600,
            showlegend=True
        )
        
        return fig
    
    def create_volume_chart(self, title: str = "成交量图") -> go.Figure:
        """
        创建成交量图
        :param title: 图表标题
        :return: Plotly图表对象
        """
        fig = go.Figure()
        
        # 计算成交量颜色（A股标准：涨红跌绿）
        colors = []
        for i in range(len(self.data)):
            if i == 0:
                colors.append('#00e676')  # 绿色
            else:
                if self.data['Close'].iloc[i] >= self.data['Close'].iloc[i-1]:
                    colors.append('#ff5252')  # 红色（上涨）
                else:
                    colors.append('#00e676')  # 绿色（下跌）
        
        # 添加成交量柱状图
        fig.add_trace(go.Bar(
            x=self.data['Date'],
            y=self.data['Volume'],
            name='成交量',
            marker_color=colors
        ))
        
        # 添加成交量移动平均线
        if 'volume' in self.indicators and 'volume_ma' in self.indicators['volume']:
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=self.indicators['volume']['volume_ma'],
                mode='lines',
                name='成交量MA',
                line=dict(color='#ffb74d', width=2)
            ))
        
        # 更新布局
        fig.update_layout(
            title=title,
            xaxis_title='日期',
            yaxis_title='成交量',
            template='plotly_dark',
            height=300,
            showlegend=True
        )
        
        return fig
    
    def create_macd_chart(self, title: str = "MACD指标图") -> go.Figure:
        """
        创建MACD指标图
        :param title: 图表标题
        :return: Plotly图表对象
        """
        if 'macd' not in self.indicators:
            return go.Figure()
        
        fig = go.Figure()
        macd_data = self.indicators['macd']
        
        # 添加MACD线
        fig.add_trace(go.Scatter(
            x=self.data['Date'],
            y=macd_data['macd'],
            mode='lines',
            name='MACD',
            line=dict(color='#90caf9', width=2)
        ))
        
        # 添加信号线
        fig.add_trace(go.Scatter(
            x=self.data['Date'],
            y=macd_data['signal'],
            mode='lines',
            name='Signal',
            line=dict(color='#ffb74d', width=2)
        ))
        
        # 添加柱状图（A股标准：涨红跌绿）
        colors = ['#ff5252' if x >= 0 else '#00e676' for x in macd_data['histogram']]
        fig.add_trace(go.Bar(
            x=self.data['Date'],
            y=macd_data['histogram'],
            name='Histogram',
            marker_color=colors
        ))
        
        # 添加零轴
        fig.add_hline(y=0, line_dash="dash", line_color="gray")
        
        # 更新布局
        fig.update_layout(
            title=title,
            xaxis_title='日期',
            yaxis_title='MACD',
            template='plotly_dark',
            height=300,
            showlegend=True
        )
        
        return fig
    
    def create_rsi_chart(self, title: str = "RSI指标图") -> go.Figure:
        """
        创建RSI指标图
        :param title: 图表标题
        :return: Plotly图表对象
        """
        if 'rsi' not in self.indicators:
            return go.Figure()
        
        fig = go.Figure()
        
        # 添加RSI线
        fig.add_trace(go.Scatter(
            x=self.data['Date'],
            y=self.indicators['rsi'],
            mode='lines',
            name='RSI',
            line=dict(color='#ce93d8', width=2)
        ))
        
        # 添加超买超卖线
        fig.add_hline(y=70, line_dash="dash", line_color="red", annotation_text="超买线")
        fig.add_hline(y=30, line_dash="dash", line_color="green", annotation_text="超卖线")
        fig.add_hline(y=50, line_dash="dot", line_color="gray", annotation_text="中轴线")
        
        # 更新布局
        fig.update_layout(
            title=title,
            xaxis_title='日期',
            yaxis_title='RSI',
            template='plotly_dark',
            height=300,
            yaxis=dict(range=[0, 100]),
            showlegend=True
        )
        
        return fig
    
    def create_comprehensive_chart(self, title: str = "综合分析图") -> go.Figure:
        """
        创建综合分析图（包含K线、成交量、MACD、RSI）
        :param title: 图表标题
        :return: Plotly图表对象
        """
        # 创建子图
        fig = make_subplots(
            rows=4, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=('K线图', '成交量', 'MACD', 'RSI'),
            row_heights=[0.4, 0.2, 0.2, 0.2]
        )
        
        # 1. K线图
        fig.add_trace(go.Candlestick(
            x=self.data['Date'],
            open=self.data['Open'],
            high=self.data['High'],
            low=self.data['Low'],
            close=self.data['Close'],
            name='K线',
            increasing_line_color='#ff5252',
            decreasing_line_color='#00e676',
            increasing_fillcolor='#ff5252',
            decreasing_fillcolor='#00e676'
        ), row=1, col=1)
        
        # 添加移动平均线
        if 'ma' in self.indicators:
            ma_data = self.indicators['ma']
            colors = ['#90caf9', '#ffb74d', '#ce93d8']
            periods = [5, 10, 20]
            
            for i, period in enumerate(periods):
                if period in ma_data:
                    fig.add_trace(go.Scatter(
                        x=self.data['Date'],
                        y=ma_data[period],
                        mode='lines',
                        name=f'MA{period}',
                        line=dict(color=colors[i], width=2)
                    ), row=1, col=1)
        
        # 2. 成交量图
        colors = []
        for i in range(len(self.data)):
            if i == 0:
                colors.append('#00e676')
            else:
                if self.data['Close'].iloc[i] >= self.data['Close'].iloc[i-1]:
                    colors.append('#ff5252')
                else:
                    colors.append('#00e676')
        
        fig.add_trace(go.Bar(
            x=self.data['Date'],
            y=self.data['Volume'],
            name='成交量',
            marker_color=colors
        ), row=2, col=1)
        
        # 3. MACD图
        if 'macd' in self.indicators:
            macd_data = self.indicators['macd']
            
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=macd_data['macd'],
                mode='lines',
                name='MACD',
                line=dict(color='#90caf9', width=2)
            ), row=3, col=1)
            
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=macd_data['signal'],
                mode='lines',
                name='Signal',
                line=dict(color='#ffb74d', width=2)
            ), row=3, col=1)
            
            colors = ['#ff5252' if x >= 0 else '#00e676' for x in macd_data['histogram']]
            fig.add_trace(go.Bar(
                x=self.data['Date'],
                y=macd_data['histogram'],
                name='Histogram',
                marker_color=colors
            ), row=3, col=1)
            
            fig.add_hline(y=0, line_dash="dash", line_color="gray", row=3, col=1)
        
        # 4. RSI图
        if 'rsi' in self.indicators:
            fig.add_trace(go.Scatter(
                x=self.data['Date'],
                y=self.indicators['rsi'],
                mode='lines',
                name='RSI',
                line=dict(color='#ce93d8', width=2)
            ), row=4, col=1)
            
            fig.add_hline(y=70, line_dash="dash", line_color="red", row=4, col=1)
            fig.add_hline(y=30, line_dash="dash", line_color="green", row=4, col=1)
            fig.add_hline(y=50, line_dash="dot", line_color="gray", row=4, col=1)
        
        # 更新布局
        fig.update_layout(
            title=title,
            template='plotly_dark',
            height=800,
            showlegend=True
        )
        
        return fig
    
    def create_chip_distribution_chart(self, title: str = "筹码分布图") -> go.Figure:
        """
        创建筹码分布图
        :param title: 图表标题
        :return: Plotly图表对象
        """
        if 'chip_distribution' not in self.indicators:
            return go.Figure()
        
        chip_data = self.indicators['chip_distribution']
        
        if 'distribution' not in chip_data or 'price_levels' not in chip_data:
            return go.Figure()
        
        fig = go.Figure()
        
        # 添加筹码分布柱状图
        fig.add_trace(go.Bar(
            x=chip_data['price_levels'],
            y=chip_data['distribution'],
            name='筹码分布',
            marker_color='#90caf9'
        ))
        
        # 添加当前价格线
        current_price = self.data['Close'].iloc[-1]
        fig.add_vline(x=current_price, line_dash="dash", line_color="red", 
                     annotation_text=f"当前价格: {current_price:.2f}")
        
        # 添加主要筹码峰线
        main_peak_price = chip_data['main_peak_price']
        fig.add_vline(x=main_peak_price, line_dash="dash", line_color="green",
                     annotation_text=f"主要筹码峰: {main_peak_price:.2f}")
        
        # 更新布局
        fig.update_layout(
            title=title,
            xaxis_title='价格',
            yaxis_title='筹码数量',
            template='plotly_dark',
            height=400,
            showlegend=True
        )
        
        return fig 