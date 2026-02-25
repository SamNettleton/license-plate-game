from wordfreq import top_n_list
from sqlalchemy.orm import Session
from sqlalchemy import text

# Load these ONCE at the module level
# This list is used to generate "goal" words whereas database is used to validate all words
COMMON_WORDS_20K = set(top_n_list('en', 20000))

def validate_word(db: Session, word: str) -> bool:
    """
    Checks the PostgreSQL dictionary table for the existence of a word
    """
    # Using 'EXISTS' is the most performant way to check for membership
    query = text("SELECT EXISTS(SELECT 1 FROM dictionary WHERE word = :w)")
    result = db.execute(query, {"w": word}).scalar()
    return result

def verify_word_against_sequence(word: str, sequence: str) -> bool:
    """
    Checks if a given word is a valid solution for a given sequence
    """
    word = word.lower()
    sequence = sequence.lower()
    
    # Use an iterator to check if letters exist in sequence
    it = iter(word)
    return all(char in it for char in sequence)

def find_matches_for_sequence(sequence: str) -> list[str]:
    """
    Finds all words containing the 3-letter sequence in order.
    """
    sequence = sequence.lower()
    matches = []
    
    for word in COMMON_WORDS_20K:
        # Optimized logic to find letters in order (e.g., B...T...R)
        it = iter(word.lower())
        if all(char in it for char in sequence):
            matches.append(word)
            
    return sorted(matches, key=len)