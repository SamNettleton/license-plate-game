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

def find_matches_for_sequence(sequence: str) -> list[str]:
    """
    Finds words containing the 3-letter sequence in order only within the top 20k list.
    """
    sequence = sequence.lower()
    matches = []
    
    for word in COMMON_WORDS_20K:
        # Find letters in order (e.g., B...T...R)
        it = iter(word.lower())
        if all(char in it for char in sequence):
            matches.append(word)
            
    return sorted(matches, key=len)