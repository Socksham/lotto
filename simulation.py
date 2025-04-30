import random
from typing import List, Dict, Optional
from dataclasses import dataclass
import matplotlib.pyplot as plt
import numpy as np

@dataclass
class LotteryTicket:
    numbers: List[int]
    purchase_price: float
    purchase_day: int
    owner: str

class LotterySimulation:
    def __init__(self, total_days: int = 6, number_range: tuple = (0, 99)):
        self.total_days = total_days
        self.number_range = number_range
        self.released_numbers: List[int] = []
        self.tickets: List[LotteryTicket] = []
        self.current_day = 0
        
    def generate_ticket(self, owner: str, purchase_price: float) -> LotteryTicket:
        """Generate a new lottery ticket with random numbers."""
        numbers = sorted(random.sample(range(self.number_range[0], self.number_range[1] + 1), 6))
        ticket = LotteryTicket(
            numbers=numbers,
            purchase_price=purchase_price,
            purchase_day=self.current_day,
            owner=owner
        )
        self.tickets.append(ticket)
        return ticket
        
    def release_number(self) -> int:
        """Release the next winning number."""
        if self.current_day >= self.total_days:
            raise ValueError("All numbers have been released")
            
        # Generate a new number that hasn't been released yet
        available_numbers = set(range(self.number_range[0], self.number_range[1] + 1)) - set(self.released_numbers)
        new_number = random.choice(list(available_numbers))
        self.released_numbers.append(new_number)
        self.current_day += 1
        return new_number
        
    def calculate_matches(self, ticket: LotteryTicket) -> int:
        """Calculate how many numbers match between ticket and released numbers."""
        return len(set(ticket.numbers) & set(self.released_numbers))
        
    def calculate_prizes(self, prize_structure: Dict[int, float]) -> Dict[str, float]:
        """Calculate prizes for all tickets based on current matches."""
        prizes = {}
        for ticket in self.tickets:
            matches = self.calculate_matches(ticket)
            if matches in prize_structure:
                prizes[ticket.owner] = prize_structure[matches]
        return prizes

def run_simulation_with_volume(num_simulations: int = 1000, 
                             base_ticket_price: float = 10.0,
                             min_tickets_per_day: int = 5,
                             max_tickets_per_day: int = 50,
                             prize_structure: Dict[int, float] = None):
    """Run multiple simulations with varying ticket volumes."""
    if prize_structure is None:
        prize_structure = {
            6: 1000000.0,  # Jackpot
            5: 10000.0,
            4: 1000.0,
            3: 100.0,
            2: 10.0,
            1: 1.0
        }
        
    results = {
        'total_tickets': 0,
        'total_prizes': 0,
        'matches_distribution': {i: 0 for i in range(7)},
        'average_prize': 0.0,
        'daily_ticket_counts': [],
        'daily_revenue': [],
        'daily_prizes': [],
        'prize_breakdown': {i: 0 for i in prize_structure.keys()}
    }
    
    for _ in range(num_simulations):
        sim = LotterySimulation()
        daily_tickets = []
        daily_revenue = []
        daily_prizes = []
        
        # Simulate ticket purchases on different days
        for day in range(sim.total_days):
            # Simulate increasing ticket purchases over days
            growth_factor = 1 + (day / sim.total_days)  # Linear growth
            tickets_today = int(random.uniform(min_tickets_per_day, max_tickets_per_day) * growth_factor)
            daily_tickets.append(tickets_today)
            revenue_today = tickets_today * base_ticket_price
            daily_revenue.append(revenue_today)
            
            for _ in range(tickets_today):
                sim.generate_ticket(f"player_{day}_{_}", base_ticket_price)
                results['total_tickets'] += 1
                
            # Release next number
            sim.release_number()
            
            # Calculate prizes for current day
            prizes = sim.calculate_prizes(prize_structure)
            daily_prizes.append(sum(prizes.values()))
            
        results['daily_ticket_counts'].append(daily_tickets)
        results['daily_revenue'].append(daily_revenue)
        results['daily_prizes'].append(daily_prizes)
        
        # Calculate prizes
        prizes = sim.calculate_prizes(prize_structure)
        results['total_prizes'] += len(prizes)
        results['average_prize'] += sum(prizes.values())
        
        # Update matches distribution and prize breakdown
        for ticket in sim.tickets:
            matches = sim.calculate_matches(ticket)
            results['matches_distribution'][matches] += 1
            if matches in prize_structure:
                results['prize_breakdown'][matches] += 1
            
    # Calculate averages
    results['average_prize'] /= num_simulations
    
    # Calculate percentages based on total tickets
    total_tickets = results['total_tickets']
    results['matches_distribution'] = {
        k: v / total_tickets for k, v in results['matches_distribution'].items()
    }
    
    # Calculate average daily metrics
    results['avg_daily_tickets'] = [sum(x) / num_simulations for x in zip(*results['daily_ticket_counts'])]
    results['avg_daily_revenue'] = [sum(x) / num_simulations for x in zip(*results['daily_revenue'])]
    results['avg_daily_prizes'] = [sum(x) / num_simulations for x in zip(*results['daily_prizes'])]
    
    return results

def plot_simulation_results(results: Dict):
    """Plot the simulation results."""
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 12))
    
    # Plot 1: Matches Distribution
    matches = list(results['matches_distribution'].keys())
    percentages = [results['matches_distribution'][m] * 100 for m in matches]
    
    ax1.bar(matches, percentages)
    ax1.set_title('Distribution of Number Matches')
    ax1.set_xlabel('Number of Matches')
    ax1.set_ylabel('Percentage of Tickets (%)')
    ax1.set_xticks(matches)
    
    # Add percentage labels on top of bars
    for i, v in enumerate(percentages):
        ax1.text(i, v + 0.5, f'{v:.1f}%', ha='center')
    
    # Plot 2: Daily Ticket Sales Growth
    daily_counts = np.array(results['daily_ticket_counts'])
    avg_daily = np.mean(daily_counts, axis=0)
    std_daily = np.std(daily_counts, axis=0)
    
    days = range(1, len(avg_daily) + 1)
    ax2.plot(days, avg_daily, marker='o')
    ax2.fill_between(days, 
                    avg_daily - std_daily, 
                    avg_daily + std_daily, 
                    alpha=0.2)
    ax2.set_title('Average Daily Ticket Sales')
    ax2.set_xlabel('Day')
    ax2.set_ylabel('Number of Tickets Sold')
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig('lottery_simulation_results.png')
    plt.close()

if __name__ == "__main__":
    # Run simulation with higher ticket volumes
    results = run_simulation_with_volume(
        num_simulations=1000,
        base_ticket_price=10.0,
        min_tickets_per_day=5,
        max_tickets_per_day=50
    )
    
    print("\nSimulation Results:")
    print(f"Total tickets analyzed: {results['total_tickets']}")
    print(f"Average prize per simulation: ${results['average_prize']:.2f}")
    print("\nMatches Distribution:")
    for matches, count in results['matches_distribution'].items():
        print(f"{matches} matches: {count:.2%}")
    
    # Plot the results
    plot_simulation_results(results)
    print("\nResults have been plotted and saved as 'lottery_simulation_results.png'")
