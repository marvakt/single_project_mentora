from app.ai.severity_levels import SeverityLevel, SEVERITY_THRESHOLDS


def calculate_severity(score: int) -> SeverityLevel:
    if not isinstance(score, int):
        raise ValueError("Score must be an integer")

    if score < 0 or score > 10:
        raise ValueError("Score must be between 0 and 10")

    for level, (min_v, max_v) in SEVERITY_THRESHOLDS.items():
        if min_v <= score <= max_v:
            return level

    # This should never happen if thresholds are correct
    raise RuntimeError("Severity mapping failed")
