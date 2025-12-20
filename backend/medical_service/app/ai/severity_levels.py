from enum import Enum


class SeverityLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


# Canonical SRTS v1 thresholds (0–10)
SEVERITY_THRESHOLDS = {
    SeverityLevel.LOW: (0, 3),
    SeverityLevel.MODERATE: (4, 6),
    SeverityLevel.HIGH: (7, 8),
    SeverityLevel.CRITICAL: (9, 10),
}
