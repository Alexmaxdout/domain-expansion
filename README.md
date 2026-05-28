# Domain Expansion

![Python](https://img.shields.io/badge/Python-3.10+-blue) ![MediaPipe](https://img.shields.io/badge/MediaPipe-latest-green)

A real-time hand gesture recognition system that maps user-defined hand signs to animated domain expansion sequences from Jujutsu Kaisen, using computer vision and a custom-trained classification model.

---

## How it works

| Step | Description |
|------|-------------|
| 01 — Capture | Webcam feed processed frame-by-frame via OpenCV |
| 02 — Classify | MediaPipe extracts hand landmarks, fed into a custom classifier |
| 03 — Animate | Recognized sign triggers the corresponding domain expansion sequence |

---

## Features

- Real-time hand landmark detection using MediaPipe Hands
- Custom gesture classifier trained on landmark coordinate data
- Deterministic trigger conditions — handles occlusion, varied lighting, and ambiguous poses
- Frame-synchronized animation playback engine driven by model output
- Modular architecture: landmark extraction, classification, and animation rendering are fully decoupled

---

## Tech stack

- **Python**
- **MediaPipe** — hand landmark detection
- **OpenCV** — webcam capture and frame processing
- **NumPy** — landmark coordinate processing

---

## Getting started

```bash
# clone the repo
git clone https://github.com/alexmaxdout/domain-expansion

# install dependencies
pip install -r requirements.txt

# run
python main.py
```

---

## Supported signs

- Unlimited Void
- Chimera Shadow Garden
- Malevolent Shrine

---

Built by [Alexander Maxwell](https://www.linkedin.com/in/alexmaxdout) · [GitHub](https://www.github.com/alexmaxdout)
