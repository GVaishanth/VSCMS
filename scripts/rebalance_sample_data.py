#!/usr/bin/env python3
"""Make the synthetic review baseline less mechanically uniform.

Run from the repository root with Python 3. The source-of-truth fixture remains
src/data/review-demo-backup.json; the compact v3 distribution file is retained
for a field-preserving one-time IndexedDB migration.
"""
from __future__ import annotations

import json
import random
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / "src/data/review-demo-backup.json"

SERVICE_TYPE_COUNTS = {
    "General Service": 51,
    "Oil Change": 54,
    "Brake Repair": 38,
    "AC Service": 30,
    "Wheel Alignment": 27,
}
BOOKING_MODE_COUNTS = {"ONLINE": 95, "PHONE": 62, "WALK_IN": 43}

# Slots are deliberately unequal and vary by work status. The seven mechanics
# currently marked BUSY share active work; AVAILABLE / ON_LEAVE mechanics have
# historical and cancelled work only.
ASSIGNMENT_TARGETS = {
    "COMPLETED": [13, 11, 14, 10, 15, 12, 13, 11, 10, 11],
    "ACTIVE": [9, 8, 11, 7, 10, 9, 11, 0, 0, 0],
    "CANCELLED": [2, 1, 2, 1, 2, 1, 2, 1, 1, 2],
}

# Relative specialization preferences for mechanic IDs 1..10. Other mechanics
# remain eligible for cross-skilled/general work; quotas are the hard limits.
SPECIALTY_WEIGHTS = {
    "General Service": [1.3, 1.2, 1.0, 1.3, 1.3, 1.2, 1.0, 1.2, 0.9, 1.0],
    "Oil Change": [2.6, 0.7, 0.4, 0.6, 2.6, 0.7, 0.4, 0.6, 0.5, 0.6],
    "Brake Repair": [0.4, 0.4, 3.0, 0.9, 0.4, 0.4, 3.0, 0.9, 1.5, 0.4],
    "AC Service": [0.4, 1.4, 0.4, 0.9, 0.4, 1.4, 0.4, 0.9, 0.3, 3.0],
    "Wheel Alignment": [0.5, 0.5, 1.5, 0.5, 0.5, 0.5, 1.5, 0.5, 3.0, 0.4],
}


def shuffled_values(counts: dict[str, int], seed: int) -> list[str]:
    values = [value for value, count in counts.items() for _ in range(count)]
    random.Random(seed).shuffle(values)
    return values


def assign_group(rows: list[dict], capacities: list[int], appointment_by_id: dict[int, dict], rng: random.Random) -> None:
    remaining = {mechanic_id: capacity for mechanic_id, capacity in enumerate(capacities, 1)}
    shuffled = list(rows)
    rng.shuffle(shuffled)
    for request in shuffled:
        appointment = appointment_by_id[int(request["appointment_id"])]
        service_type = appointment["service_type"]
        preference = SPECIALTY_WEIGHTS[service_type]
        eligible = [mechanic_id for mechanic_id, slots in remaining.items() if slots > 0]
        if not eligible:
            raise ValueError(f"Assignment target exhausted for {request['service_status']}")
        weights = [preference[mechanic_id - 1] * remaining[mechanic_id] for mechanic_id in eligible]
        selected = rng.choices(eligible, weights=weights, k=1)[0]
        request["mechanic_id"] = selected
        remaining[selected] -= 1
    if any(remaining.values()):
        raise ValueError(f"Unused assignment slots: {remaining}")


def main() -> None:
    snapshot = json.loads(FIXTURE.read_text())
    records = snapshot["records"]
    appointments = sorted(records["appointments"], key=lambda row: int(row["appointment_id"]))
    requests = sorted(records["requests"], key=lambda row: int(row["request_id"]))
    mechanics = sorted(records["mechanics"], key=lambda row: int(row["mechanic_id"]))
    if len(appointments) != 205 or len(requests) != 200 or len(mechanics) != 10:
        raise ValueError("Unexpected baseline size; refusing to rewrite the fixture")

    baseline_appointments = [row for row in appointments if int(row["appointment_id"]) <= 200]
    if len(baseline_appointments) != 200:
        raise ValueError("Expected 200 appointments linked to the six-month work-order history")
    types = shuffled_values(SERVICE_TYPE_COUNTS, 20261011)
    modes = shuffled_values(BOOKING_MODE_COUNTS, 20261012)
    for appointment, service_type, booking_mode in zip(baseline_appointments, types, modes, strict=True):
        appointment["service_type"] = service_type
        appointment["booking_mode"] = booking_mode

    appointment_by_id = {int(row["appointment_id"]): row for row in appointments}
    rng = random.Random(20261013)
    completed = [row for row in requests if row["service_status"] == "COMPLETED"]
    cancelled = [row for row in requests if row["service_status"] == "CANCELLED"]
    active = [row for row in requests if row["service_status"] in {"OPEN", "IN_PROGRESS", "ON_HOLD"}]
    if (len(completed), len(active), len(cancelled)) != (120, 65, 15):
        raise ValueError("Work-order status totals changed; refusing to rewrite the fixture")
    assign_group(completed, ASSIGNMENT_TARGETS["COMPLETED"], appointment_by_id, rng)
    assign_group(active, ASSIGNMENT_TARGETS["ACTIVE"], appointment_by_id, rng)
    assign_group(cancelled, ASSIGNMENT_TARGETS["CANCELLED"], appointment_by_id, rng)

    ratings = {int(row["request_id"]): int(row["rating"]) for row in records["feedback"]}
    bonuses = Counter()
    for request in requests:
        if request["service_status"] != "COMPLETED":
            continue
        amount = 100 + (250 if float(request.get("actual_cost") or 0) >= 5000 else 0)
        if ratings.get(int(request["request_id"])) == 5:
            amount += 100
        bonuses[int(request["mechanic_id"])] += amount
    for mechanic in mechanics:
        mechanic["total_bonus"] = bonuses[int(mechanic["mechanic_id"])]

    records["appointments"] = appointments
    records["requests"] = requests
    records["mechanics"] = mechanics
    FIXTURE.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + "\n")

    assignment_counts = Counter(int(row["mechanic_id"]) for row in requests)
    active_counts = Counter(int(row["mechanic_id"]) for row in active)
    completed_counts = Counter(int(row["mechanic_id"]) for row in completed)
    appointment_type_counts = Counter(row["service_type"] for row in appointments)
    booking_mode_counts = Counter(row["booking_mode"] for row in appointments)
    print("Requests by mechanic:", dict(sorted(assignment_counts.items())))
    print("Active by mechanic:", dict(sorted(active_counts.items())))
    print("Completed by mechanic:", dict(sorted(completed_counts.items())))
    print("Appointment service types:", dict(sorted(appointment_type_counts.items())))
    print("Booking modes:", dict(sorted(booking_mode_counts.items())))
    print("Mechanic bonuses:", {m["mechanic_id"]: m["total_bonus"] for m in mechanics})


if __name__ == "__main__":
    main()
