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
        
        if len(solutions) >= 5:
            return letters, len(solutions)
    
    # Fallback to a guaranteed common sequence if we're extremely unlucky
    return "PAR", 100 