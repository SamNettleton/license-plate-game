import pytest
import random
from logic.game import (
    verify_word_against_sequence,
    generate_valid_plate,
    calculate_points_for_word,
    calculate_total_points
)

class TestGameLogic:

    @pytest.mark.parametrize("word, sequence, expected", [
        ("leapfrog", "lpg", True),
        ("LEAPFROG", "LPG", True),     # Case-insensitive
        ("sleep", "slp", True),
        ("limping", "lpg", True),
        ("goalpost", "lpg", False),    # G is before L and P
        ("apple", "pl", True),
        ("banana", "xyz", False),      # Letters not in word
        ("cat", "cta", False)          # Letters out of order
    ])
    def test_verify_word_against_sequence(self, word, sequence, expected):
        assert verify_word_against_sequence(word, sequence) == expected

    def test_calculate_points_for_word(self):
        assert calculate_points_for_word("cat") == 8
        assert calculate_points_for_word("apple") == 10
        assert calculate_points_for_word("leapfrog") == 13

    def test_calculate_total_points(self):
        solutions = ["cat", "apple", "leapfrog"]
        expected_total = 8 + 10 + 13
        assert calculate_total_points(solutions) == expected_total

    def test_generate_valid_plate_with_seed(self, monkeypatch):
        # We use a seeded random instance to ensure deterministic generation
        seeded_rng = random.Random(42)
        
        # We need to mock `dictionary.find_matches_for_sequence` otherwise this
        # relies on the 10k word set which could change
        def mock_find_matches(seq):
            # For testing, pretend "QAH" (from seed 42) has exactly 15 valid words
            if seq == "QAH":
                return ["qabalah", "qaqarin", "quartz"] * 5 # 15 words
            return []

        import services.dictionary as dictionary
        monkeypatch.setattr(dictionary, "find_matches_for_sequence", mock_find_matches)

        plate, num_solutions, points = generate_valid_plate(rng=seeded_rng)

        assert plate == "QAH"
        assert num_solutions == 15
        
        # points for 'qabalah' (7+5=12), 'qaqarin' (7+5=12), 'quartz' (6+5=11)
        # points per 3 words = 35. 
        # total points = 35 * 5 = 175
        assert points == 175

    def test_generate_valid_plate_fallback(self, monkeypatch):
        """Test the fallback scenario when 50 attempts fail to find a good plate."""
        def mock_find_matches(seq):
             # Ensure no matches are ever found
            return []
        
        import services.dictionary as dictionary
        monkeypatch.setattr(dictionary, "find_matches_for_sequence", mock_find_matches)
        
        plate, num_solutions, points = generate_valid_plate()
        
        # Should fallback to the hardcoded safe bet
        assert plate == "SIR"
        assert num_solutions == 400
        assert points == 300
