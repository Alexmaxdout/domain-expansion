from __future__ import annotations

from typing import Protocol, Sequence


class Landmark(Protocol):
    x: float
    y: float
    z: float


def _finger_is_up(landmarks: Sequence[Landmark], tip_id: int, pip_id: int) -> bool:
    return landmarks[tip_id].y < landmarks[pip_id].y


def detect_domain_from_landmarks(landmarks: Sequence[Landmark]) -> str | None:
    index_up = _finger_is_up(landmarks, 8, 6)
    middle_up = _finger_is_up(landmarks, 12, 10)
    ring_up = _finger_is_up(landmarks, 16, 14)
    pinky_up = _finger_is_up(landmarks, 20, 18)

    if index_up and middle_up and ring_up and pinky_up:
        return "unlimited_void"

    if index_up and not middle_up and not ring_up and not pinky_up:
        return "malevolent_shrine"

    if index_up and middle_up and not ring_up and not pinky_up:
        return "chimera_shadow_garden"

    return None
