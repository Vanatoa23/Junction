# Junction 2026 — Arduino partner intelligence

> **Roster update — 24 October 2026:** independently confirmed in the official page's partner section as **Main**. This update supersedes earlier uncertainty about the listing/tier below. The original product research date remains as stated; API versions, prices and access in the older report have not all been re-tested or re-researched. Challenge briefs remain TBA. [Current coverage and source record](README.md).

**Research cutoff: 7 October 2026. Audience:** Markus plus three full-stack developers. **Recommendation:** prepare a Python-to-hardware workflow and a repeatable camera-to-actuator demo. Choose robotics only after confirming access to an assembled, working kit.

**Evidence labels:** CONFIRMED = supported by an official source; INFERENCE = our interpretation; SPECULATION = possible future challenge. Timing and feasibility estimates below are planning estimates, not benchmarks or guarantees.

## 1. Exact Junction role and access

**CONFIRMED:** Junction advertises a “Hardware Lab by Arduino”: UNO Q boards, components, 3D printers, LeRobot arms and hardware mentoring. The published platform emphasis is physical AI, robotics and embedded development. [Junction 2026](https://2026.hackjunction.com/)

**Unresolved:** Arduino’s precise contractual partner tier; board RAM variants; quantities; allocation, loans, reservations and deposits; exact cameras/sensors/motors; arm models and leader/follower configurations; named Arduino engineers; hardware-specific workshops. The schedule lists workshops generally, which does not establish Arduino workshops. Challenge tracks remain TBA.

Before choosing this track, ask the desk: “Can we retain one board and actuator through judging? Is the arm assembled/calibrated? Which camera works with the supplied image? Can we use our own parts?” Do not interpret advertised equipment as guaranteed exclusive team access.

## 2. Strategic direction in 2025–2026

**CONFIRMED:** Arduino announced UNO Q and App Lab alongside its Qualcomm acquisition agreement in October 2025; its current FAQ states that the acquisition has occurred. App Lab links Python/Linux, sketches and AI services; Edge Impulse is part of the broader ecosystem. This makes developer accessibility to physical AI a stronger sponsorship hypothesis than conventional sensor dashboards. [Announcement](https://www.qualcomm.com/news/releases/2025/10/qualcomm-to-acquire-arduino-accelerating-developers--access-to-i) · [Current FAQ](https://www.arduino.cc/qualcomm-faq/)

The newer **VENTUNO Q** targets heavier AI with 16 GB RAM and a marketed 40-TOPS NPU. **Its Junction availability is unconfirmed.** Do not transfer its LLM demonstrations or acceleration claims to UNO Q. [VENTUNO Q](https://www.arduino.cc/product-ventuno-q)

## 3. UNO Q: the practical division of labour

| Subsystem | Confirmed capability | Our use |
| --- | --- | --- |
| Linux processor | QRB2210; four Cortex-A53 cores, up to 2 GHz; Debian | Python, vision, APIs, UI |
| MCU | STM32U585 Cortex-M33, up to 160 MHz; 2 MB flash, 786 kB SRAM; Arduino Core on Zephyr | Sampling, PWM, bounded actuation |
| Memory/storage | 2 GB/16 GB or 4 GB/32 GB | Prefer 4 GB; verify loan variant |
| Connectivity | Wi-Fi 5, Bluetooth 5.1, USB-C; Qwiic, Arduino headers, high-density media interfaces | USB camera and simple sensors |
| Media/acceleration | Adreno 702 GPU, camera interfaces, video support | Graphics acceleration is not guaranteed ML acceleration |

Source: [current UNO Q datasheet](https://docs.arduino.cc/resources/datasheets/ABX00162-ABX00173-datasheet.pdf). UNO Q is Linux-capable; conventional UNO assumptions do not suffice.

Use `camera → Linux/Python classifier → Bridge RPC → MCU → actuator`. Or `sensor → MCU sampling → Linux inference → API/log → MCU action`. Keep time-critical loops and command expiry on the MCU; Linux and internet requests can stall.

App Lab coordinates Python, sketches and containerized services (“Bricks”). IDE 2 can program the MCU alone. USB-C power guidance is 5 V/3 A; use an appropriate powered hub for peripherals. [User manual](https://docs.arduino.cc/tutorials/uno-q/user-manual/?queryID=bbb993e8bdbcff412df9e47ab674ffd1)

## 4. Previous hackathon evidence

I found **no verified Arduino-specific Junction 2024/2025 challenge, winner or judge statement** in the searched official archives and Arduino results. This is an evidence gap, not proof of absence. Avoid treating other sponsors’ hardware winners as Arduino precedent. [Challenge archive](https://www.hackjunction.com/challenges/) · [2025 event](https://hackjunction.app/hackathons/junction-2025)

A useful alternative: Arduino’s September 2026 Copenhagen game hackathon report describes nine teams deploying to UNO Q with a Media Carrier, display and Modulino controls. It reports plug-and-play assembly in roughly ten minutes. **Inference:** supported accessories and examples offer more reliable speed than custom wiring. This is participant execution evidence, not Arduino judging criteria. [Arduino Project Hub](https://projecthub.arduino.cc/ksoderby/develop-games-with-ai-and-run-them-on-the-uno-q-3097a1)

## 5. Possible challenge directions

All rows are **SPECULATION**; likelihood is relative, not a numerical forecast.

| Theme / likelihood | Evidence and possible format | Build; hardware/software | 48-hour feasibility |
| --- | --- | --- | --- |
| Physical AI / High | Lab positioning; perceive and act | Camera, UNO Q, servo; App Lab | High, one action |
| Embodied robotics / High | LeRobot arms advertised; automate a task | Supplied arm, camera; LeRobot/Python | Medium with working kit |
| Local vision / High | UNO Q and vision examples; offline inspection | USB camera, indicator/gate; Brick | High for fixed scene |
| Assistive interaction / Medium | Accessibility strategy; physical interface | Buttons/mic, light/servo; classifier/API | High with narrow vocabulary |
| Environmental control / Medium | IoT direction; act on sensor fusion | Sensors, fan; rules/anomaly model | High with fast-changing input |
| Industrial inspection / Medium | Automation portfolio; reject defects | Camera, tabletop gate; CV | Medium; mechanics dominate |

## 6. Hardware shortlist

Difficulty assumes existing examples; every unconfirmed item needs an access check.

| Hardware | Main capability / sensors or interfaces | AI relevance | Difficulty | Junction availability |
| --- | --- | --- | --- | --- |
| UNO Q | Linux + MCU; USB, Qwiic, GPIO | Edge inference | Medium | Confirmed; variant unknown |
| LeRobot arm | Articulated physical manipulation | Teleoperation/imitation | High | Confirmed category; model unknown |
| Camera + servo/driver | Vision input; physical action | Complete perception-action loop | Low–medium | Specific parts unconfirmed |
| Nicla Vision | Camera, IMU, microphone, distance | Embedded vision | Medium | Unconfirmed |
| Nano 33 BLE Sense Rev2 | Motion/audio/environment sensors, BLE | TinyML | Medium | Unconfirmed |
| Portenta H7 / X8 | H7 MCU; X8 Linux + MCU; carriers | Embedded ML / Linux | High | Unconfirmed |
| Opta | Industrial micro-PLC; variant-dependent networking | Control with external AI | High | Unconfirmed |

Official references: [Nicla](https://docs.arduino.cc/hardware/nicla-vision/) · [Nano](https://docs.arduino.cc/hardware/nano-33-ble-sense-rev2/) · [H7](https://docs.arduino.cc/hardware/portenta-h7/) · [X8](https://docs.arduino.cc/hardware/portenta-x8/) · [Opta](https://docs.arduino.cc/hardware/opta/). Choose the supplied UNO Q before learning an alternative ecosystem.

## 7. Fastest software stack for this team

**Default:** App Lab example + Python + Bridge + minimal sketch + local browser UI. One developer owns hardware/control, one perception/backend, one UI/integration; Markus owns problem selection, evidence and pitch.

Use App Lab’s container workflow before custom Docker. IDE/CLI are useful for sketch compilation and reproducibility; VS Code can remain your editor. REST/WebSockets suit browser control; MQTT fits multiple devices but adds a broker. For another board, USB serial plus Python is a straightforward fallback. Node.js belongs in the UI/backend if familiar, rather than adding a second board service unnecessarily.

Arduino Cloud helps remote telemetry, but is optional for a local demo. MicroPython is board-specific, not a replacement for UNO Q Linux Python. OpenCV or built-in Bricks precede custom ONNX/TFLite deployment. PyTorch export requires a validated ARM runtime/operator set. ROS2 and LeRobot add value only when the chosen robot requires them. [Official component repositories](https://support.arduino.cc/hc/en-us/articles/24358702846748-Code-repositories-for-Arduino-App-Lab-components)

## 8. Realistic AI workloads

These are conservative engineering budgets to validate on the actual board.

| Route | Model scale / timing target | Offline, power, setup | Good use |
| --- | --- | --- | --- |
| TinyML on MCU | kB to small-MB models constrained by board RAM; tens–hundreds of ms | Offline, relatively low power; conversion/calibration work | Audio, vibration, gestures |
| UNO Q Linux inference | Small quantized vision/audio models; target sub-second decisions | Offline after downloads; Linux power budget; medium setup | Classification, inspection |
| Cloud/API AI | Larger models remotely; seconds and variable tails | Network-dependent; device plus remote compute; easy API, harder recovery | Semantic reasoning, language |

**Preferred:** existing object-detection/image-classification Brick, small MobileNet-class vision or audio/anomaly model. YOLO variants may work, but model size, resolution and runtime determine usability; measure before committing. Pose estimation and small vision transformers are stretch options. Avoid making local UNO Q LLM/VLM inference the critical demo path; use a laptop/API for that layer. No verified event-board FPS or inference benchmark was found. [Examples](https://github.com/arduino/app-bricks-examples/) · [Bricks implementation](https://github.com/arduino/app-bricks-py)

## 9. Robotics scope gates

Assuming a compatible assembled kit and mentor support:

| Time | Conservative milestone |
| --- | --- |
| 2 hours | Connect, verify power, calibrate, stop/reset, teleoperate |
| 6 hours | Repeat a fixed movement or pick from a known position |
| 12 hours | Fixed-camera object selection with bounded actions |
| 24 hours | Narrow imitation-learning experiment, only after baseline works |

An unassembled kit can consume these budgets before task development begins. LeRobot arms may use their own serial motor controller: **do not assume UNO Q directly drives their joints**. Keep calibration files, camera position and robot identifiers stable. [SO-101 setup](https://huggingface.co/docs/lerobot/en/so101) · [Real-world workflow](https://huggingface.co/docs/lerobot/main/en/getting_started_real_world_robot)

Best wow/risk ratio: a camera-selected servo gate or constrained tabletop arm task. Avoid reinforcement learning from scratch, mobile navigation and unrestricted manipulation.

## 10. Bookmark these resources

| Official resource | Teaches / Junction value | Time |
| --- | --- | --- |
| [UNO Q manual](https://docs.arduino.cc/tutorials/uno-q/user-manual/?queryID=bbb993e8bdbcff412df9e47ab674ffd1) | Power, setup, operating modes; first boot | 1 hour |
| [Hardware page](https://docs.arduino.cc/hardware/uno-q/) | Pinout/datasheet; prevent electrical mistakes | 15 min |
| [App examples](https://github.com/arduino/app-bricks-examples/) | Python, Bridge, web and AI workflows; working baseline | 1 hour |
| [Bricks source](https://github.com/arduino/app-bricks-py) | Actual APIs; debug integration | 1 hour |
| [Phone camera integration](https://docs.arduino.cc/de/software/app-lab/integrations/companion-app/) | Wireless camera fallback; same-network requirement | 15 min |
| [LeRobot cheat sheet](https://huggingface.co/docs/lerobot/en/cheat-sheet) | Calibration, recording, teleoperation | Several hours |

## 11. Reusable architectures

Latency ranges are design targets, not measured performance.

| Pattern | Use / difficulty | Reliability; latency; failure |
| --- | --- | --- |
| Sensor → MCU → Python → light/fan | Environmental intervention; low | High; 0.1–1 s; noisy sensor |
| Camera → local CV → MCU → gate | Sorting/inspection; medium | High in fixed scene; 0.2–2 s; lighting |
| Voice/image → API → validated command → MCU | Semantic interaction; medium | Medium; 1–10+ s; network |
| Multi-sensor → anomaly score → vibration alert | Equipment monitoring; medium | Medium; window-dependent; drift |
| Leader arm → recorder → follower | Remote assistance; high | Medium; interactive; calibration |
| Local detector → cloud escalation → bounded action | Ambiguous cases; medium | Medium; local fast, cloud slower; timeout |

Every actuator path needs bounds, acknowledgement and a safe stale-command state. A web UI should show observed state separately from requested state.

## 12. What might impress judges?

**INFERENCE, not an announced rubric:** show an unfamiliar input, a visible decision and a repeatable useful physical result. Explain why local sensing/control makes the product possible; quantify response time, successful trials and offline behaviour.

Decorative hardware, one sensor chart without intervention, a cloud chatbot flashing an LED, or an unreliable arm weakens that argument. A simple sensor dashboard can still be valuable if it solves the announced problem; the challenge rubric takes precedence over our hypotheses.

## 13. Adaptable project seeds

All are SPECULATION and tabletop MVPs, not validated products.

| Problem / seed | Input → decision → physical output | 48-hour MVP / live demo | Arduino necessity / main risk |
| --- | --- | --- | --- |
| Incorrect sorting | Camera → category → servo chute | Two classes; audience supplies object | Local routing; lighting/mechanics |
| Blocked access route | Distance + camera → obstruction → directional indicator | Model doorway; move obstacle | Physical context; false alarms |
| Cold-chain excursion | Temperature → trend/rules → fan/alarm | Warm sensor gently; show response | Measured intervention; slow dynamics |
| Assembly mistakes | Camera + button → step verification → release latch | Three-piece fixture | Workflow control; occlusion |
| Motor anomaly | Vibration → anomaly score → low-voltage shutdown | Toy motor; introduce imbalance | Fast sampling/action; training data |
| Assisted object handover | Camera + request → target choice → arm handover | Two fixed objects | Manipulation; grasp/calibration |

## 14. Five strongest cross-partner combinations

These are architectural suggestions, **not verified joint challenges or credit offers**.

| Combination | Contribution and scope |
| --- | --- |
| Arduino + OpenAI | Sensors/actuation plus semantic interpretation; validate structured commands locally |
| Arduino + NVIDIA | Local sensing/control plus GPU perception on a separate available machine; UNO Q is not CUDA hardware |
| Arduino + Aalto | Physical prototype plus a concrete research/user problem, if supplied |
| Arduino + City of Espoo | Physical accessibility/infrastructure demo plus municipal problem context |
| Arduino + Valio Aimo | Inspection/cold-chain prototype plus logistics use case and challenge data, if supplied |

Google DeepMind could support a robotics theme, but specific tools/access remain unknown. Modal or Verda could run heavier models/training; Featherless could provide remote language reasoning. Cloudinary could manage visual evidence; Exa could retrieve manuals; AfterQuery could be considered for evaluation only after verifying its actual offering. None is necessary for motor control, and adding all of them creates integration risk.

## 15. Prepare before the event

**Definitely:** install App Lab/IDE; GPIO and voltage basics; read one sensor; drive one safely powered servo; Python ↔ sketch commands; camera capture; one local classifier; timeouts/reset; repeatable startup.

**Worth preparing:** UNO Q Linux deployment, API structured outputs, offline dependency/model caching, one sensor-fusion example. If robotics appeals, practise LeRobot calibration and teleoperation with actual hardware.

**Wait:** custom TinyML training, ROS2, imitation learning, custom carriers and heavy model optimisation until the challenge justifies them.

Minimum skill set: **physical input, Python decision, acknowledged physical output, safe reset**. Practise workflows beforehand; check event rules before reusing prewritten submission code.

## 16. A 2–4 hour learning exercise

Build a **desk practice metronome**: tap a button; Python estimates tempo and classifies “steady/irregular”; an LED or servo pointer displays the result. This is a learning instrument, not a polished challenge proposal.

Budget: 30 minutes setup, 45 input/output, 45 Python/Bridge, 30 UI/logging, 30 fault tests. Disconnect the backend, send malformed commands, restart and repeat ten times. Learn debounce, timestamps, serialization, acknowledgement, power, command expiry and calibration. A conventional board with USB serial teaches most of this; UNO Q adds App Lab deployment.

## 17. Risks and fallback

| Risk | Mitigation |
| --- | --- |
| Hardware unavailable/shared | Obtain confirmed access before choosing mechanics; retain simple actuator option |
| Cables, drivers, firmware | Known data cables; run official example first; retain working versions |
| Voltage/power | Check pinout: UNO Q MCU headers use 3.3 V; some MPU lines 1.8 V; avoid 5 V signal assumptions |
| Motor resets/damage | Separate suitable motor supply/driver; common ground where required; physical stop |
| Camera/lighting | Tested camera, fixed mount and light; avoid new MIPI integration |
| Network/model latency | Local baseline, cached assets, bounded API waits |
| Flaky calibration/mechanics | Fixed workspace; strain relief; no last-minute rebuild |
| Heat/long debugging | Monitor load; lower resolution; after two blocked hours simplify with mentor |

**Fallback ladder:** live local baseline → manual physical control with AI decision displayed → clearly labelled telemetry replay plus short recorded working demo. Disclose which layer is live. Never present prerecorded motion as autonomous live operation.

## 18. Packing checklist

**Bring ourselves:**

- [ ] Laptops with working App Lab/IDE and Python; tested example and pinned dependencies.
- [ ] USB data cables, adapters, compatible powered USB-C hub, charger; tested power bank if useful.
- [ ] Jumper wires, breadboard, multimeter, tape, cable ties, small tools.
- [ ] Tested USB webcam and small spare sensor/servo if permitted; appropriate low-voltage supply.
- [ ] Cached manuals/pinouts, model files, ARM-compatible dependencies; demo recording equipment.

**Advertised on site, access details unresolved:** UNO Q boards, general components, 3D printers, LeRobot arms and mentoring. **Do not assume supplied:** your exact camera, servo, driver, cables, power supply, exclusive arm or spare board.

## 19. Final cheat sheet

| Field | Team takeaway |
| --- | --- |
| Partner / role | Arduino; confirmed Hardware Lab branding; exact challenge tier unresolved |
| Key hardware / platform | UNO Q; LeRobot arms; App Lab |
| Likely themes | Physical AI, local vision, embodied robotics — speculation |
| Fastest stack | Python + App Lab Bricks + Bridge + minimal sketch |
| Best AI approach | Small local model; cloud only for semantics |
| Best physical pattern | Camera → decision → one bounded actuator |
| Best combination | OpenAI for semantics; NVIDIA for heavier separate-machine vision |
| Impress / bore | Reliable useful physical result / decorative hardware |
| Learn first | Python-to-MCU command/acknowledgement loop |
| Biggest risk / fallback | Unavailable or unstable mechanics / simpler live actuator and labelled recording |
| Relevance | **9/10**, subjective given advertised equipment |
| Confidence | **7/10 overall**: strong platform evidence; incomplete event logistics/rubric |

### Five things our team should remember about Arduino

1. UNO Q combines Linux intelligence with a separate real-time MCU.
2. Junction advertises arms and boards, but team allocation remains unconfirmed.
3. A reliable simple actuator beats an ambitious robot that cannot repeat its demo.
4. Use supported examples before experimenting with model runtimes or camera drivers.
5. Make the physical result essential to the problem and observable to the audience.