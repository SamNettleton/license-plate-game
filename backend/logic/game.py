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

def generate_valid_plate(max_attempts=50):
    """
    Business Logic: Defines what constitutes a 'playable' plate.
    Helper to find a 3-letter sequence with at least 5 valid solutions.
    """
    for _ in range(max_attempts):
        letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
        solutions = dictionary.find_matches_for_sequence(letters)
        
        if len(solutions) >= 10:
            goal_points = calculate_total_points(solutions)
            if goal_points > 300:
                goal_points = 300
            return letters, len(solutions), goal_points
    
    # Fallback to a guaranteed common sequence if we're extremely unlucky
    return "PAR", 100

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