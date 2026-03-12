from prometheus_client import Counter, Histogram

GUESSES_COUNTER = Counter(
    "game_guesses_total", 
    "Total guesses categorized by status", 
    ["status", "app_name"]
)

# Custom buckets: 0.5ms, 1ms, 2.5ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, +Inf
CUSTOM_DB_BUCKETS = (
    .0005, .001, .0025, .005, .01, .025, .05, .1, .25, .5, 1.0, 2.5, float("inf")
)

DB_QUERY_TIME = Histogram(
    "db_query_duration_seconds",
    "Time spent on database lookups",
    ["query_type"],
    buckets=CUSTOM_DB_BUCKETS
)