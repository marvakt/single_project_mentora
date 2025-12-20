ALLOWED_SEVERITIES = {"mild", "moderate", "severe"}


class SymptomService:
    @staticmethod
    def normalize(symptom: str) -> str:
        return symptom.strip().lower()

    @staticmethod
    def validate_severity(severity: str):
        if severity not in ALLOWED_SEVERITIES:
            raise ValueError("Invalid symptom severity")
