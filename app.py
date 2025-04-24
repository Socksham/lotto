import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from simulation import LotterySimulation, run_simulation_with_volume

st.set_page_config(page_title="Lottery Simulation", layout="wide")

st.title("🎲 Lottery Simulation Dashboard")

# Sidebar for parameters
st.sidebar.header("Simulation Parameters")

# Number of simulations
num_simulations = st.sidebar.slider(
    "Number of Simulations",
    min_value=100,
    max_value=5000,
    value=1000,
    step=100
)

# Base ticket price
base_ticket_price = st.sidebar.number_input(
    "Base Ticket Price ($)",
    min_value=1.0,
    max_value=100.0,
    value=10.0,
    step=1.0
)

# Daily ticket parameters
st.sidebar.subheader("Daily Ticket Sales")
min_tickets = st.sidebar.number_input(
    "Minimum Tickets per Day",
    min_value=1,
    max_value=100,
    value=5,
    step=1
)

max_tickets = st.sidebar.number_input(
    "Maximum Tickets per Day",
    min_value=min_tickets,
    max_value=1000,
    value=50,
    step=5
)

# Prize structure
st.sidebar.subheader("Prize Structure")
prize_structure = {
    6: st.sidebar.number_input("6 Matches Prize ($)", value=1000000, step=10000),
    5: st.sidebar.number_input("5 Matches Prize ($)", value=10000, step=1000),
    4: st.sidebar.number_input("4 Matches Prize ($)", value=1000, step=100),
    3: st.sidebar.number_input("3 Matches Prize ($)", value=100, step=10),
    2: st.sidebar.number_input("2 Matches Prize ($)", value=10, step=1),
    1: st.sidebar.number_input("1 Match Prize ($)", value=1, step=1)
}

# Run simulation button
if st.sidebar.button("Run Simulation"):
    with st.spinner("Running simulation..."):
        try:
            results = run_simulation_with_volume(
                num_simulations=num_simulations,
                base_ticket_price=base_ticket_price,
                min_tickets_per_day=min_tickets,
                max_tickets_per_day=max_tickets,
                prize_structure=prize_structure
            )
            
            # Debug information
            st.write("Debug Info:")
            st.write(f"Total tickets: {results['total_tickets']}")
            st.write(f"Daily ticket counts: {len(results['daily_ticket_counts'])}")
            st.write(f"Average daily tickets: {results['avg_daily_tickets']}")
            
            # Display key metrics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Tickets Analyzed", f"{results['total_tickets']:,}")
            with col2:
                st.metric("Total Prizes Awarded", f"{results['total_prizes']:,}")
            with col3:
                st.metric("Average Prize per Simulation", f"${results['average_prize']:,.2f}")
            with col4:
                total_revenue = sum(results['avg_daily_revenue'])
                total_prizes = sum(results['avg_daily_prizes'])
                profit_margin = ((total_revenue - total_prizes) / total_revenue * 100) if total_revenue > 0 else 0
                st.metric("Profit Margin", f"{profit_margin:.2f}%")
            
            # Create tabs for different visualizations
            tab1, tab2, tab3, tab4 = st.tabs(["Matches Distribution", "Daily Sales", "Revenue & Prizes", "Prize Breakdown"])
            
            with tab1:
                # Matches distribution chart
                matches_df = pd.DataFrame({
                    'Matches': list(results['matches_distribution'].keys()),
                    'Percentage': [p * 100 for p in results['matches_distribution'].values()]
                })
                
                fig_matches = px.bar(
                    matches_df,
                    x='Matches',
                    y='Percentage',
                    text='Percentage',
                    title='Percentage of Tickets by Number of Matches'
                )
                fig_matches.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
                fig_matches.update_layout(
                    xaxis_title="Number of Matches",
                    yaxis_title="Percentage of Tickets (%)",
                    yaxis_range=[0, 100]
                )
                st.plotly_chart(fig_matches, use_container_width=True)
            
            with tab2:
                # Daily ticket sales chart
                days = list(range(1, len(results['avg_daily_tickets']) + 1))
                fig_sales = go.Figure()
                
                fig_sales.add_trace(go.Scatter(
                    x=days,
                    y=results['avg_daily_tickets'],
                    name='Average Sales',
                    mode='lines+markers',
                    line=dict(color='blue', width=2)
                ))
                
                fig_sales.update_layout(
                    title='Daily Ticket Sales',
                    xaxis_title='Day',
                    yaxis_title='Number of Tickets Sold',
                    showlegend=True
                )
                st.plotly_chart(fig_sales, use_container_width=True)
            
            with tab3:
                # Revenue and prizes chart
                fig_financial = go.Figure()
                
                fig_financial.add_trace(go.Scatter(
                    x=days,
                    y=results['avg_daily_revenue'],
                    name='Daily Revenue',
                    mode='lines+markers',
                    line=dict(color='green', width=2)
                ))
                
                fig_financial.add_trace(go.Scatter(
                    x=days,
                    y=results['avg_daily_prizes'],
                    name='Daily Prizes',
                    mode='lines+markers',
                    line=dict(color='red', width=2)
                ))
                
                fig_financial.update_layout(
                    title='Daily Revenue vs Prizes',
                    xaxis_title='Day',
                    yaxis_title='Amount ($)',
                    showlegend=True
                )
                st.plotly_chart(fig_financial, use_container_width=True)
            
            with tab4:
                # Prize breakdown table
                prize_data = []
                for matches, count in results['prize_breakdown'].items():
                    prize_amount = prize_structure[matches]
                    total_prize = count * prize_amount
                    prize_data.append({
                        'Matches': matches,
                        'Prize Amount': f"${prize_amount:,}",
                        'Number of Winners': f"{count:,}",
                        'Total Prize Pool': f"${total_prize:,.2f}"
                    })
                
                prize_df = pd.DataFrame(prize_data)
                st.dataframe(prize_df, use_container_width=True)
                
                # Prize distribution pie chart
                fig_pie = px.pie(
                    prize_df,
                    values='Number of Winners',
                    names='Matches',
                    title='Distribution of Winners by Number of Matches',
                    labels={'Matches': 'Number of Matches', 'Number of Winners': 'Winners'}
                )
                st.plotly_chart(fig_pie, use_container_width=True)
                
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
            st.write("Debug Info:")
            st.write(f"Number of simulations: {num_simulations}")
            st.write(f"Base ticket price: {base_ticket_price}")
            st.write(f"Min tickets: {min_tickets}")
            st.write(f"Max tickets: {max_tickets}")
            st.write(f"Prize structure: {prize_structure}") 