import pytest
import sys
import os
from unittest.mock import Mock, MagicMock

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from services.dictionary import validate_word, find_matches_for_sequence

class TestDictionaryService:

    def test_validate_word_exists(self):
        # Create a mock database session
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = True

        result = validate_word(mock_db, "apple")

        # Ensure the query was executed and returned True
        assert result is True
        mock_db.execute.assert_called_once()
        
        args, kwargs = mock_db.execute.call_args
        assert "SELECT EXISTS(SELECT 1 FROM dictionary WHERE word = :w)" in str(args[0])
        assert args[1] == {"w": "apple"}

    def test_validate_word_does_not_exist(self):
        # Create a mock database session
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = False

        result = validate_word(mock_db, "notarealword")

        assert result is False

    def test_find_matches_for_sequence(self):
        # We don't want to mock the 10k list, we want to ensure the logic
        # correctly finds items from it. 'the', 'and', 'that' are all in the 10k list.
        
        # Test finding words with "th"
        matches = find_matches_for_sequence("th")
        
        # Ensure 'the' 'that' and 'this' are found, and ensure sorting by length
        assert "the" in matches
        assert "that" in matches
        assert matches == sorted(matches, key=len)
        
        # Ensure it doesn't find words without "th" in order
        assert "hat" not in matches

    def test_find_matches_for_sequence_no_matches(self):
        # Sequence unlikely to exist in 10k words
        matches = find_matches_for_sequence("qqq")
        assert len(matches) == 0
