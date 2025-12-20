from statistics import mean


class InsightService:
    @staticmethod
    def generate(severity_scores: list[int], moods: list[str]) -> dict:
        insights = []

        if len(severity_scores) >= 3:
            avg_recent = mean(severity_scores[-3:])
            avg_overall = mean(severity_scores)

            if avg_recent > avg_overall:
                insights.append("Severity has increased recently")

            elif avg_recent < avg_overall:
                insights.append("Severity has decreased recently")

        if moods.count("anxious") >= 3:
            insights.append("Persistent anxiety pattern detected")

        if moods.count("depressed") >= 3:
            insights.append("Persistent low mood detected")

        return {
            "insights": insights,
            "data_points": {
                "severity_samples": len(severity_scores),
                "mood_samples": len(moods),
            },
        }
