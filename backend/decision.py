#!/usr/bin/env python3
"""
ComfortRoom Decision Algorithm
Weighted sum scoring for room selection based on environmental criteria.

Based on standards from docs/criteria.md:
- EN 16798-1:2019 (indoor environmental parameters)
- ISO 7730:2005 (thermal comfort)
- ASHRAE Standards 62.1 and 55
- WHO Housing and Health Guidelines
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class SensorReading:
    """Sensor data for a room."""
    temperature: Optional[float] = None  # Celsius
    co2: Optional[int] = None            # ppm
    humidity: Optional[float] = None     # %
    sound: Optional[float] = None        # dB


@dataclass
class Weights:
    """User preference weights (should sum to 1.0)."""
    temperature: float = 0.25
    co2: float = 0.30
    humidity: float = 0.20
    sound: float = 0.25


@dataclass
class DesiredProfile:
    """User's desired ideal values for each criterion."""
    temperature: Optional[float] = None  # Celsius
    co2: Optional[int] = None            # ppm
    humidity: Optional[float] = None     # %
    sound: Optional[float] = None        # dB


# Criteria thresholds based on docs/criteria.md
CRITERIA = {
    "temperature": {
        "ideal": 22.0,
        "good_min": 20.0,
        "good_max": 24.0,
        "acceptable_min": 18.0,
        "acceptable_max": 26.0,
    },
    "co2": {
        "ideal": 600,
        "good_max": 800,
        "acceptable_max": 1000,
        "poor_threshold": 1400,
    },
    "humidity": {
        "ideal_min": 45.0,
        "ideal_max": 55.0,
        "good_min": 40.0,
        "good_max": 60.0,
        "acceptable_min": 30.0,
        "acceptable_max": 70.0,
    },
    "sound": {
        "ideal": 30.0,
        "good_max": 35.0,
        "acceptable_max": 45.0,
        "poor_threshold": 55.0,
    },
}


def score_temperature(value: float, ideal: Optional[float] = None) -> float:
    """
    Score temperature on 0-100 scale.
    Ideal: 22°C (100), Good: 20-24°C (80-99), Acceptable: 18-26°C (50-79), Poor: outside (0-49)
    """
    c = CRITERIA["temperature"]
    if ideal is None:
        ideal = c["ideal"]

    if value == ideal:
        return 100.0

    # Good range: 20-24°C → 80-100
    if c["good_min"] <= value <= c["good_max"]:
        distance = abs(value - ideal)
        max_distance = max(ideal - c["good_min"], c["good_max"] - ideal)
        return 100.0 - (distance / max_distance) * 20.0

    # Acceptable range: 18-20 or 24-26 → 50-79
    if c["acceptable_min"] <= value < c["good_min"]:
        distance = c["good_min"] - value
        max_distance = c["good_min"] - c["acceptable_min"]
        return 80.0 - (distance / max_distance) * 30.0

    if c["good_max"] < value <= c["acceptable_max"]:
        distance = value - c["good_max"]
        max_distance = c["acceptable_max"] - c["good_max"]
        return 80.0 - (distance / max_distance) * 30.0

    # Poor range: outside acceptable → 0-49
    if value < c["acceptable_min"]:
        distance = c["acceptable_min"] - value
        return max(0.0, 50.0 - distance * 10.0)

    # value > acceptable_max
    distance = value - c["acceptable_max"]
    return max(0.0, 50.0 - distance * 10.0)


def score_co2(value: int, ideal: Optional[int] = None) -> float:
    """
    Score CO2 on 0-100 scale (lower is better).
    Ideal: <600 (100), Good: 600-800 (90-99), Acceptable: 800-1000 (70-89),
    Medium: 1000-1400 (50-69), Poor: >1400 (0-49)
    """
    c = CRITERIA["co2"]
    if ideal is None:
        ideal = c["ideal"]

    if value <= ideal:
        return 100.0

    if value <= c["good_max"]:
        # 600-800 → 90-100
        ratio = (value - ideal) / (c["good_max"] - ideal)
        return 100.0 - ratio * 10.0

    if value <= c["acceptable_max"]:
        # 800-1000 → 70-90
        ratio = (value - c["good_max"]) / (c["acceptable_max"] - c["good_max"])
        return 90.0 - ratio * 20.0

    if value <= c["poor_threshold"]:
        # 1000-1400 → 50-70
        ratio = (value - c["acceptable_max"]) / (c["poor_threshold"] - c["acceptable_max"])
        return 70.0 - ratio * 20.0

    # >1400 → 0-50
    excess = value - c["poor_threshold"]
    return max(0.0, 50.0 - excess * 0.1)


def score_humidity(value: float, ideal: Optional[float] = None) -> float:
    """
    Score humidity on 0-100 scale.
    Ideal: 45-55% (100), Good: 40-60% (80-99), Acceptable: 30-70% (50-79), Poor: outside (0-49)
    """
    c = CRITERIA["humidity"]

    # Use custom ideal or default range
    if ideal is not None:
        ideal_min = ideal - 5.0
        ideal_max = ideal + 5.0
    else:
        ideal_min = c["ideal_min"]
        ideal_max = c["ideal_max"]

    # Ideal range: custom or 45-55%
    if ideal_min <= value <= ideal_max:
        return 100.0

    # Good range: 40-45 or 55-60 → 80-100
    if c["good_min"] <= value < ideal_min:
        distance = ideal_min - value
        max_distance = ideal_min - c["good_min"]
        return 100.0 - (distance / max_distance) * 20.0

    if ideal_max < value <= c["good_max"]:
        distance = value - ideal_max
        max_distance = c["good_max"] - ideal_max
        return 100.0 - (distance / max_distance) * 20.0

    # Acceptable range: 30-40 or 60-70 → 50-80
    if c["acceptable_min"] <= value < c["good_min"]:
        distance = c["good_min"] - value
        max_distance = c["good_min"] - c["acceptable_min"]
        return 80.0 - (distance / max_distance) * 30.0

    if c["good_max"] < value <= c["acceptable_max"]:
        distance = value - c["good_max"]
        max_distance = c["acceptable_max"] - c["good_max"]
        return 80.0 - (distance / max_distance) * 30.0

    # Poor range: <30 or >70 → 0-50
    if value < c["acceptable_min"]:
        distance = c["acceptable_min"] - value
        return max(0.0, 50.0 - distance * 2.5)

    distance = value - c["acceptable_max"]
    return max(0.0, 50.0 - distance * 2.5)


def score_sound(value: float, ideal: Optional[float] = None) -> float:
    """
    Score sound level on 0-100 scale (lower is better).
    Ideal: <30 dB (100), Good: 30-35 dB (80-99), Acceptable: 35-45 dB (50-79), Poor: >45 dB (0-49)
    """
    c = CRITERIA["sound"]
    if ideal is None:
        ideal = c["ideal"]

    if value <= ideal:
        return 100.0

    if value <= c["good_max"]:
        # 30-35 → 80-100
        ratio = (value - ideal) / (c["good_max"] - ideal)
        return 100.0 - ratio * 20.0

    if value <= c["acceptable_max"]:
        # 35-45 → 50-80
        ratio = (value - c["good_max"]) / (c["acceptable_max"] - c["good_max"])
        return 80.0 - ratio * 30.0

    # >45 → 0-50
    excess = value - c["acceptable_max"]
    max_excess = c["poor_threshold"] - c["acceptable_max"]
    return max(0.0, 50.0 - (excess / max_excess) * 50.0)


def calculate_room_score(reading: SensorReading, weights: Weights, desired_profile: Optional[DesiredProfile] = None) -> dict:
    """
    Calculate weighted comfort score for a room.

    Returns dict with individual scores and final weighted score.
    """
    scores = {}
    weighted_sum = 0.0
    total_weight = 0.0

    # Temperature
    if reading.temperature is not None:
        ideal_temp = desired_profile.temperature if desired_profile and desired_profile.temperature is not None else None
        scores["temperature"] = round(score_temperature(reading.temperature, ideal_temp), 1)
        weighted_sum += scores["temperature"] * weights.temperature
        total_weight += weights.temperature

    # CO2
    if reading.co2 is not None:
        ideal_co2 = desired_profile.co2 if desired_profile and desired_profile.co2 is not None else None
        scores["co2"] = round(score_co2(reading.co2, ideal_co2), 1)
        weighted_sum += scores["co2"] * weights.co2
        total_weight += weights.co2

    # Humidity
    if reading.humidity is not None:
        ideal_humidity = desired_profile.humidity if desired_profile and desired_profile.humidity is not None else None
        scores["humidity"] = round(score_humidity(reading.humidity, ideal_humidity), 1)
        weighted_sum += scores["humidity"] * weights.humidity
        total_weight += weights.humidity

    # Sound
    if reading.sound is not None:
        ideal_sound = desired_profile.sound if desired_profile and desired_profile.sound is not None else None
        scores["sound"] = round(score_sound(reading.sound, ideal_sound), 1)
        weighted_sum += scores["sound"] * weights.sound
        total_weight += weights.sound

    # Calculate final score (normalized if some readings missing)
    final_score = weighted_sum / total_weight if total_weight > 0 else 0.0

    return {
        "individual_scores": scores,
        "final_score": round(final_score, 1),
        "weights_used": {
            "temperature": weights.temperature,
            "co2": weights.co2,
            "humidity": weights.humidity,
            "sound": weights.sound,
        },
    }


def rank_rooms(rooms_data: list[dict], weights: Weights, desired_profile: Optional[DesiredProfile] = None) -> list[dict]:
    """
    Rank multiple rooms by comfort score.

    Args:
        rooms_data: List of dicts with room_id and sensor data
        weights: User preference weights
        desired_profile: User's desired ideal values (optional)

    Returns:
        List of rooms sorted by score (highest first)
    """
    results = []

    for room in rooms_data:
        reading = SensorReading(
            temperature=room.get("temperature"),
            co2=room.get("co2"),
            humidity=room.get("humidity"),
            sound=room.get("sound"),
        )

        score_result = calculate_room_score(reading, weights, desired_profile)

        results.append({
            "room_id": room["room_id"],
            "room_name": room.get("room_name", f"Room {room['room_id']}"),
            "score": score_result["final_score"],
            "individual_scores": score_result["individual_scores"],
            "sensor_values": {
                "temperature": reading.temperature,
                "co2": reading.co2,
                "humidity": reading.humidity,
                "sound": reading.sound,
            },
        })

    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)

    # Add rank
    for i, room in enumerate(results):
        room["rank"] = i + 1

    return results


# ============================================================
# Test with sample data
# ============================================================

def test_scoring():
    """Test the scoring functions with sample data."""
    print("=" * 60)
    print("ComfortRoom Decision Algorithm - Test")
    print("=" * 60)

    # Test individual scoring functions
    print("\n1. Temperature Scoring:")
    test_temps = [18, 20, 22, 24, 26, 28]
    for t in test_temps:
        print(f"   {t}°C → Score: {score_temperature(t):.1f}")

    print("\n2. CO2 Scoring:")
    test_co2 = [400, 600, 800, 1000, 1200, 1400, 1600]
    for c in test_co2:
        print(f"   {c} ppm → Score: {score_co2(c):.1f}")

    print("\n3. Humidity Scoring:")
    test_humidity = [25, 35, 45, 50, 55, 65, 75]
    for h in test_humidity:
        print(f"   {h}% → Score: {score_humidity(h):.1f}")

    print("\n4. Sound Scoring:")
    test_sound = [25, 30, 35, 40, 45, 50, 55]
    for s in test_sound:
        print(f"   {s} dB → Score: {score_sound(s):.1f}")

    # Test room ranking
    print("\n" + "=" * 60)
    print("5. Room Ranking Example")
    print("=" * 60)

    sample_rooms = [
        {"room_id": 1, "room_name": "Room A101", "temperature": 22.0, "co2": 650, "humidity": 50, "sound": 32},
        {"room_id": 2, "room_name": "Room A102", "temperature": 24.5, "co2": 850, "humidity": 45, "sound": 38},
        {"room_id": 3, "room_name": "Room A201", "temperature": 21.0, "co2": 550, "humidity": 55, "sound": 28},
        {"room_id": 4, "room_name": "Room B101", "temperature": 25.0, "co2": 1100, "humidity": 62, "sound": 42},
        {"room_id": 5, "room_name": "Room B102", "temperature": 19.5, "co2": 720, "humidity": 38, "sound": 35},
    ]

    # Default weights
    weights = Weights()
    print(f"\nUsing weights: temp={weights.temperature}, co2={weights.co2}, "
          f"humidity={weights.humidity}, sound={weights.sound}")

    ranked = rank_rooms(sample_rooms, weights)

    print("\nRanked Results:")
    print("-" * 60)
    for room in ranked:
        print(f"  #{room['rank']} {room['room_name']}: Score = {room['score']}")
        scores = room['individual_scores']
        print(f"      Temp: {scores.get('temperature', 'N/A')}, "
              f"CO2: {scores.get('co2', 'N/A')}, "
              f"Humidity: {scores.get('humidity', 'N/A')}, "
              f"Sound: {scores.get('sound', 'N/A')}")

    # Test with custom weights (prioritize CO2)
    print("\n" + "=" * 60)
    print("6. Custom Weights (CO2 priority)")
    print("=" * 60)

    custom_weights = Weights(temperature=0.15, co2=0.50, humidity=0.15, sound=0.20)
    print(f"\nUsing weights: temp={custom_weights.temperature}, co2={custom_weights.co2}, "
          f"humidity={custom_weights.humidity}, sound={custom_weights.sound}")

    ranked_custom = rank_rooms(sample_rooms, custom_weights)

    print("\nRanked Results (CO2 prioritized):")
    print("-" * 60)
    for room in ranked_custom:
        print(f"  #{room['rank']} {room['room_name']}: Score = {room['score']}")


if __name__ == "__main__":
    test_scoring()
