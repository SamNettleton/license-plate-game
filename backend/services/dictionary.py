from wordfreq import top_n_list

# Load these ONCE at the module level
COMMON_WORDS_10K = set(top_n_list('en', 40000))

def validate_word(word: str) -> bool:
    return word in COMMON_WORDS_10K

def verify_word_against_sequence(word: str, sequence: str) -> bool:
    word = word.lower()
    sequence = sequence.lower()
    
    # Use an iterator to check if letters exist in sequence
    it = iter(word)
    return all(char in it for char in sequence)

def find_matches_for_sequence(sequence: str) -> list[str]:
    """Finds all words containing the 3-letter sequence in order."""
    sequence = sequence.lower()
    matches = []
    
    for word in COMMON_WORDS_10K:
        # Optimized logic to find letters in order (e.g., B...T...R)
        it = iter(word.lower())
        if all(char in it for char in sequence):
            matches.append(word)
            
    return sorted(matches, key=len)