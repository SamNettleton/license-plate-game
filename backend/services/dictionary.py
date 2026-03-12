from wordfreq import top_n_list
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

# Load these ONCE at the module level
# This list is used to generate "goal" words whereas database is used to validate all words
COMMON_WORDS_10K = set(top_n_list('en', 10000))

async def validate_word(db: AsyncSession, word: str) -> bool:
    """
    Checks the PostgreSQL dictionary table for the existence of a word
    """
    # Using 'EXISTS' is the most performant way to check for membership
    query = text("SELECT EXISTS(SELECT 1 FROM dictionary WHERE word = :w)")
    result = await db.execute(query, {"w": word})
    return result.scalar()

def find_matches_for_sequence(sequence: str) -> list[str]:
    """
    Finds words containing the 3-letter sequence in order only within the top 20k list.
    """
    sequence = sequence.lower()
    matches = []
    
    for word in COMMON_WORDS_10K:
        # Find letters in order (e.g., B...T...R)
        it = iter(word.lower())
        if all(char in it for char in sequence):
            matches.append(word)

    return sorted(matches, key=len)