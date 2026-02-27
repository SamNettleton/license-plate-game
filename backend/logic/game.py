import random
from services import dictionary

def verify_word_against_sequence(word: str, sequence: str) -> bool:
    """
    Checks if a given word is a valid solution for a given sequence
    """
    word = word.lower()
    sequence = sequence.lower()
    
    it = iter(word)
    return all(char in it for char in sequence)

def generate_valid_plate(max_attempts=50, rng=None):
    """
    Business Logic: Defines what constitutes a 'playable' plate.
    Helper to find a 3-letter sequence with at least 10 valid solutions.
    rng: random.Random instance for thread-safe deterministic generation.
    """
    # Use the passed-in Random instance or fall back to the global random module
    r = rng or random
    
    for _ in range(max_attempts):
        # Use r.choices to ensure we are pulling from the seeded instance
        letters = "".join(r.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
        
        # Find all words containing these 3 letters in order
        solutions = dictionary.find_matches_for_sequence(letters)
        
        # Check if the sequence is "fun" (at least 10 words)
        if len(solutions) >= 10:
            total_possible_points = calculate_total_points(solutions)
            
            # Balancing: Cap the goal at 300 to avoid excessive goal
            goal_points = min(total_possible_points, 300)
            
            return letters, len(solutions), goal_points
    
    # Fallback: If 50 attempts fail to find a 10-word sequence, 
    # use a hardcoded safe bet.
    return "SIR", 400, 300

def calculate_points_for_word(word: str) -> int:
    """
    Business Logic: Defines scoring system
    """
    return 5 + len(word)

def calculate_total_points(solutions: list[str]) -> int:
    """
    Helper method to calculate the total "goal" points for a given word list
    """
    total_points = 0
    for solution in solutions:
        total_points += calculate_points_for_word(solution)
    return total_points