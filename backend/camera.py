from __future__ import annotations

import threading
import time
from pathlib import Path
from typing import TypedDict

import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from gesture_detector import detect_domain_from_landmarks


MODEL_PATH = Path(__file__).with_name("hand_landmarker.task")
MODEL_DOWNLOAD_COMMAND = (
    "curl -L -o hand_landmarker.task "
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/latest/hand_landmarker.task"
)
DEBUG_WINDOW_TITLE = "Domain Expansion Camera Debug"


class DomainEvent(TypedDict):
    id: int
    domain: str


class DomainCamera:
    def __init__(
        self,
        camera_index: int = 0,
        cooldown_seconds: float = 2.0,
        show_debug_window: bool = True,
    ):
        self.camera_index = camera_index
        self.cooldown_seconds = cooldown_seconds
        self.show_debug_window = show_debug_window
        self.latest_event: DomainEvent | None = None
        self.error: str | None = None
        self.is_running = False

        self._capture: cv2.VideoCapture | None = None
        self._landmarker: vision.HandLandmarker | None = None
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._event_id = 0
        self._last_domain: str | None = None
        self._last_sent_at = 0.0
        self._debug_window_open = False

    def start(self) -> None:
        if self.is_running:
            return

        self.error = self._validate_model()
        if self.error:
            print(self.error)
            return

        try:
            self._landmarker = self._create_landmarker()
            self._capture = cv2.VideoCapture(self.camera_index)
            if not self._capture.isOpened():
                self.error = "Could not open webcam with OpenCV. Check camera permissions and that no other app is using it."
                print(self.error)
                self._cleanup()
                return
        except Exception as exc:
            self.error = f"Failed to start camera or MediaPipe HandLandmarker: {exc}"
            print(self.error)
            self._cleanup()
            return

        self._stop_event.clear()
        self._debug_window_open = self.show_debug_window
        self.is_running = True
        self._thread = threading.Thread(target=self._run, name="domain-camera", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._cleanup()
        self.is_running = False

    def _validate_model(self) -> str | None:
        if MODEL_PATH.exists():
            return None

        return (
            f"Missing MediaPipe model file: {MODEL_PATH}. "
            "Download it from the backend folder with: "
            f"{MODEL_DOWNLOAD_COMMAND}"
        )

    def _create_landmarker(self) -> vision.HandLandmarker:
        options = vision.HandLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=str(MODEL_PATH)),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.6,
            min_hand_presence_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        return vision.HandLandmarker.create_from_options(options)

    def _run(self) -> None:
        while not self._stop_event.is_set():
            if self._capture is None or self._landmarker is None:
                break

            ok, frame = self._capture.read()
            if not ok:
                time.sleep(0.1)
                continue

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

            try:
                result = self._landmarker.detect(image)
            except Exception as exc:
                self.error = f"MediaPipe detection failed: {exc}"
                print(self.error)
                time.sleep(0.5)
                continue

            domain = None
            landmarks = None
            if result.hand_landmarks:
                landmarks = result.hand_landmarks[0]
                domain = detect_domain_from_landmarks(landmarks)

            if domain:
                self._publish_if_ready(domain)

            if self._debug_window_open:
                self._show_debug_frame(frame, landmarks, domain)

            time.sleep(0.03)

    def _publish_if_ready(self, domain: str) -> None:
        now = time.monotonic()
        same_domain_cooling_down = (
            domain == self._last_domain
            and now - self._last_sent_at < self.cooldown_seconds
        )
        if same_domain_cooling_down:
            return

        self._event_id += 1
        self.latest_event = {"id": self._event_id, "domain": domain}
        self._last_domain = domain
        self._last_sent_at = now

    def _show_debug_frame(self, frame, landmarks, domain: str | None) -> None:
        try:
            label = domain or ("hand detected" if landmarks else "no hand detected")
            color = (0, 255, 0) if domain else (0, 220, 255)

            if landmarks:
                height, width, _ = frame.shape
                for landmark in landmarks:
                    x = int(landmark.x * width)
                    y = int(landmark.y * height)
                    cv2.circle(frame, (x, y), 4, (80, 255, 120), -1)

            cv2.putText(
                frame,
                f"Domain: {label}",
                (16, 34),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2,
                cv2.LINE_AA,
            )
            cv2.putText(
                frame,
                "Press q to close debug window",
                (16, 68),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (230, 230, 230),
                1,
                cv2.LINE_AA,
            )

            cv2.imshow(DEBUG_WINDOW_TITLE, frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                self._debug_window_open = False
                cv2.destroyWindow(DEBUG_WINDOW_TITLE)
        except Exception as exc:
            self._debug_window_open = False
            print(f"OpenCV debug window disabled: {exc}")

    def _cleanup(self) -> None:
        if self._capture is not None:
            self._capture.release()
            self._capture = None

        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None

        cv2.destroyAllWindows()
