# Dimensity GPU Governor 🚀

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)
[![Version](https://img.shields.io/badge/Version-v2.7-brightgreen)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor)
[![Language](https://img.shields.io/badge/Language-Rust-orange)](https://www.rust-lang.org/)

## Introduction 📝
[简体中文](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/README.md) | **English**

Dimensity GPU Governor (Mediatek Mali GPU Governor) is an advanced GPU governor designed specifically for MediaTek processors. Developed in **Rust**, the high-performance core engine intelligently monitors GPU load and dynamically adjusts frequency, achieving the best balance between gaming experience and power consumption. The module integrates a modern **WebUI management interface** and **complete game mode detection**, providing users with an excellent GPU tuning solution.

## Features ✨

### Core Features
- 🎮 **Intelligent Game Mode**: Automatically detects game apps configured in `games.conf` and applies performance-optimized GPU frequency strategies
- 📊 **Real-time Load Monitoring**: High-performance implementation in Rust, real-time monitoring of GPU load
- 🔄 **Adaptive Frequency Algorithm**: Aggressive up-frequency strategy in game mode, energy-saving down-frequency strategy in normal mode
- 🎯 **Precise Frequency Control**: Fully supports GPUFreq v1/v2 drivers, automatically detects driver version and adapts
- ⚙️ **Intelligent Frequency Writing**: V2 driver optimization mechanism reduces unnecessary frequency write operations
- 🎛️ **Voltage & Memory Linkage**: Supports DDR frequency adjustment, precise mapping between voltage and frequency

### User Interface & Interaction
- 🖥️ **Modern WebUI**: Graphical management interface based on KernelSU API, designed in Miuix style
- 🌓 **Smart Theme System**: Supports dark/light/auto mode, automatically adapts to system settings
- 🌐 **Full Multi-language Support**: Supports Chinese and English UI, automatically detects system language
- 📊 **Visual Config Editing**: Edit frequency table, voltage, and game list directly via WebUI
- 🔧 **Interactive Control Script**: Provides `action.sh` volume key control script, supports service management and log level settings

### Technical Features
- 🦀 **Rust Core Engine & Multithreaded Monitoring**: Developed in Rust for memory safety, zero-cost abstraction, and ultimate performance. The main program uses a multithreaded architecture, responsible for GPU load monitoring, foreground app monitoring, config hot-reload, game mode monitoring, log level monitoring, etc., ensuring the governor responds to system state changes in real time.
- 🔧 **Highly Customizable**: Customize GPU frequency, voltage, and memory frequency levels via config files
- 📱 **Wide Device Compatibility**: Supports Dimensity, Helio, MT6xxx and other MediaTek series processors
- 📝 **Professional Logging System**: Supports debug/info/warn/error log levels
- 🔄 **Automatic Device Adaptation**: Automatically detects device model during installation and applies the best config file

## Installation Requirements 📋

### Device Requirements
- Rooted Android device
- Device with MediaTek (MTK) processor, supporting Mali GPU
- Device supporting GPUFreq v1 or v2 driver
- Magisk v20.4+ or KernelSU or APatch or other root solutions supporting modules

### WebUI Requirements
- To use WebUI, one of the following environments is required:
  - **KernelSU/APatch users**: Directly click "Open WebUI" in the manager
  - **Magisk users**: Need to install one of the following apps
    - [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) - Standalone WebUI app
    - [SSU](https://ssu.oom-wg.dev/base/install) - SSU module manager app

## Configuration Files ⚙️

### GPU Frequency Table Configuration

The main config file is located at `/data/gpu_freq_table.conf`. The module will automatically select the appropriate config file based on the device model:

```
# Margin: Adjustment margin percentage for GPU frequency calculation
Margin=5
# Freq Volt DDR_OPP
218000 45000 999
280000 46875 999
350000 48750 999
431000 49375 999
471000 50625 999
532000 51875 999
573000 53125 2
634000 55000 1
685000 56875 1
755000 59375 0
853000 60625 0
```

**Config Parameter Description**:
- **Freq**: GPU frequency (KHz)
- **Volt**: Voltage (μV)
- **DDR_OPP**: Memory frequency level (999 means no adjustment, 0-3 means different levels)
- **Margin**: Frequency calculation margin percentage (can be adjusted via WebUI or by editing the config file directly)

**Preset Config Files**:
- `config/mtd1000.conf` - Dimensity 1000 series
- `config/mtd1100.conf` - Dimensity 1100
- `config/mtd1200.conf` - Dimensity 1200
- `config/mtd8100.conf` - Dimensity 8100
- `config/mtd8200.conf` - Dimensity 8200
- `config/mtd9000.conf` - Dimensity 9000 series

### Game List Configuration

The game list config file is located at `/data/adb/gpu_governor/game/games.conf`, containing package names of apps to apply game mode. The module will automatically scan installed games and generate this file during installation.

**Note**: The installation script will check if the game list file exists. If it does, it will not overwrite it, preserving user customizations.

### Interactive Control Menu

The module provides the `action.sh` script, supporting interactive operations via volume keys:

**Script Features**:
- **Control Governor Service**: Start or stop the GPU governor service
- **Set Log Level**: Choose debug, info, warn, or error level
- **View Module Status**: Display module version, running status, etc.

**Operation**:
- Volume Up: Move selection up
- Volume Down: Move selection down
- Power: Confirm selection

The script will automatically detect the current system language and display the corresponding Chinese or English interface.

**Module Files**:
- Log level setting: `/data/adb/gpu_governor/log/log_level`
- Game list config: `/data/adb/gpu_governor/game/games.conf`
- PID management: `/data/adb/gpu_governor/gpu_governor.pid`

### Log Level Setting

Log level is saved in `/data/adb/gpu_governor/log/log_level`, default is `info`. It can be set in three ways:
1. Use the interactive menu `./action.sh` to select log level
2. Adjust via the WebUI settings page
3. Edit `/data/adb/gpu_governor/log/log_level` directly

Changes take effect immediately, no need to restart the module.

## Logging System 📊

Log files are stored in `/data/adb/gpu_governor/log/`, mainly including:

- **gpu_gov.log**: Main log file, managed by the Rust core, records the governor's running status
- **initsvc.log**: Initialization service log, records module startup and script initialization info

Log content can be viewed via the WebUI or directly with a file manager.

### Log Levels

The module supports four log levels, which can be set via `action.sh` or the WebUI:

- **debug**: Debug level, records all details including frequency adjustment, load monitoring, etc.
- **info**: Info level, records normal operation info, default level
- **warn**: Warning level, records only warnings and errors
- **error**: Error level, records only errors

Log level is saved in `/data/adb/gpu_governor/log/log_level`, changes take effect immediately, no need to restart the module.

### Log Management

The main log is fully managed by the Rust core, including:
- Log file creation and writing
- Automatic log rotation and size control
- Real-time monitoring and response to log level changes


## Supported Devices 📱

Supports most MediaTek processors with Mali GPU, including but not limited to:
- Dimensity series (e.g. D700/D800/D900/D1x00/D8x00/D9000, 0 ≤ x ≤ 2)
- Helio series
- MT6xxx series

The module will automatically detect the device model and apply the appropriate config. If your device is not in the supported list, the default config will be used.

## Acknowledgements 🙏

- **Author**: WaliKa @CoolApk, rtools @CoolApk
- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **Testing Feedback**: All members of the internal test group
- **Config Assistance**: Fiagelia @CoolApk, Wangjian @CoolApk

## Notes ⚠️

- Modifying GPU frequency and voltage may affect device stability
- Improper configuration may cause overheating or performance issues
- It is recommended to back up the original config file for recovery
- If you encounter problems, check the log files for troubleshooting

## WebUI Interface 🖥️

This module provides a modern WebUI interface based on KernelSU API and designed in Miuix style, offering users an intuitive GPU governor management and monitoring experience. WebUI supports config hot-reload, real-time log viewing, visual editing of game list and frequency table, and all changes take effect immediately.

### Features

#### Core Features
- **Real-time Status Monitoring**: View module running status, version info, and game mode status
- **GPU Frequency Config**: View and edit current GPU frequency table, adjust frequency, voltage, and memory level
- **Game List Management**: View and edit configured game list, add/remove games
- **Log Viewing**: Real-time log viewing, select different log files and log levels

#### UI Features
- **Dark Mode Support**: Automatically adapts to system dark/light mode, can also be switched manually
- **Multi-language Support**: Supports Chinese and English UI, auto-detects system language
- **Voltage Adjuster**: Supports rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)
- **Real-time Update**: Checks game mode status every second and updates UI
- **Toast Notification**: Operation feedback and status tips

### UI Layout

WebUI uses a multi-page layout, switching pages via the bottom navigation bar:

#### 📊 Status Page
- Displays module running status and version info
- Game mode switch control

#### ⚙️ Config Page
- GPU frequency table editing
- Voltage and memory level adjustment
- Game list management

#### 📝 Log Page
- Real-time log viewing
- Log file selection (gpu_gov.log, initsvc.log)

#### 🔧 Settings Page
- Theme settings (dark/light/auto)
- Language settings (Chinese/English/auto)
- Log level settings
- Other advanced options

## FAQ ❓

### Basic Usage

**Q: How to confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file for normal frequency adjustment records, or view module status and logs via the WebUI. When working properly, the log should contain GPU load and frequency adjustment records.

**Q: How does game mode work?**
A: When an app listed in `games.conf` is detected running in the foreground, game mode is automatically applied; in game mode, a more aggressive up-frequency strategy is used (load thresholds: 5/20/60/85), providing a better gaming experience under high load.

**Q: How to add a custom game to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.conf` file and add the package name of the game, or add it via the WebUI game list page. The module will automatically scan installed games and generate the initial game list during installation.

**Q: How to adjust log level?**
A: Three ways: 1) Use the interactive menu `./action.sh` to select log level; 2) Adjust via the WebUI settings page; 3) Edit `/data/adb/gpu_governor/log/log_level` directly. Changes take effect immediately, no need to restart the module.

**Q: How to use the WebUI?**
A: KernelSU/APatch users can click the module in the root manager and select "Open WebUI". Magisk users can install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [SSU](https://ssu.oom-wg.dev/base/install) to access the module's WebUI.

**Q: Do I need to restart the module after modifying config files and parameters?**
A: No. The module supports config hot-reload and multithreaded monitoring. All changes (frequency table, game list, log level, etc.) take effect in real time, no restart required.
