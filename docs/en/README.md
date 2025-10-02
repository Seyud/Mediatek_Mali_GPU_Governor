# Dimensity GPU Governor 🚀

[![Version](https://img.shields.io/github/v/release/Seyud/Mediatek_Mali_GPU_Governor?logo=github)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases/latest)
[![GitHub Downloads](https://img.shields.io/github/downloads/Seyud/Mediatek_Mali_GPU_Governor/total?logo=github&logoColor=green)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases)
[![Language](https://img.shields.io/badge/language-Rust-orange?logo=rust&logoColor=orange)](https://www.rust-lang.org/)
[![Telegram](https://img.shields.io/badge/channel-Telegram-2CA5E0?logo=telegram&logoColor=87CEEB)](https://t.me/Mediatek_Mali_GPU_Governor)

## Introduction 📝

**English** | [简体中文](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/README.md)

Dimensity GPU Governor (Mediatek Mali GPU Governor) is an advanced GPU governor designed specifically for MediaTek processors. Developed in **Rust**, the high-performance core engine intelligently monitors GPU load and dynamically adjusts frequency, achieving the best balance between gaming experience and power consumption. The module integrates a modern **WebUI management interface** and **complete game mode detection**, providing users with an excellent GPU tuning solution.

## Related Open Source Projects 📦

**Core Source Code Repository**: [GPU-Governor-Core](https://github.com/Seyud/GPU-Governor-Core)

## Features ✨

### Core Features

- 🎮 **Intelligent Game Mode**: Automatically detects game apps configured in `games.toml` and applies performance-optimized GPU frequency strategies

- ⚙️ **Custom Configuration System**: Flexible adjustment of governor strategies through `config.toml` configuration file, supporting global configuration and four mode configuration items

- 📊 **Real-time Load Monitoring**: High-performance implementation in Rust, real-time monitoring of GPU load

- 🔄 **Adaptive Frequency Algorithm**: Aggressive up-frequency strategy in game mode, energy-saving down-frequency strategy in normal mode

- 🎯 **Precise Frequency Control**: Fully supports GPUFreq v1/v2 drivers, automatically detects driver version and adapts

- ⚙️ **Intelligent Frequency Writing**: V2 driver optimization mechanism reduces unnecessary frequency write operations

- 🎛️ **Voltage & Memory Linkage**: Supports DDR frequency adjustment, precise mapping between voltage and frequency

### User Interface & Interaction

- 🖥️ **Modern WebUI**: Graphical management interface based on KernelSU API, designed in Miuix style

- 🌓 **Smart Theme System**: Supports dark/light/auto mode, automatically adapts to system settings

- 🌐 **Full Multi-language Support**: Supports Chinese and English UI, automatically detects system language

- 📊 **Visual Config Editing**: Edit frequency table, custom configurations, and game list directly via WebUI

- 🔧 **Interactive Control Script**: Provides `action.sh` volume key control script, supports service management and log level settings

### Technical Features

- 🦀 **Rust Core Engine & Multithreaded Monitoring**: Developed in Rust for memory safety, zero-cost abstraction, and ultimate performance. The main program uses a multithreaded architecture, responsible for GPU load monitoring, foreground app monitoring, frequency table file hot-reload, custom configuration monitoring, log level monitoring, etc., ensuring the governor responds to system state changes in real time.

- 🔧 **Highly Customizable**: Customize GPU frequency, voltage, and memory frequency levels via config files

- 📱 **Wide Device Compatibility**: Supports Dimensity series MediaTek processors

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
    - [SSU](https://ssu.oom-wg.dev/base/install) - SSU manager app

## Configuration Files ⚙️

### Custom Configuration

Users can customize the behavior of the GPU governor by modifying the `/data/adb/gpu_governor/config/config.toml` file. The configuration file contains global settings and detailed parameters for four modes (powersave, balance, performance, fast).

#### Global Configuration

- `mode`: Set the default mode, options are `powersave`, `balance`, `performance`, `fast`

- `idle_threshold`: Idle threshold (percentage), the system is considered idle when GPU load is below this value

#### Mode Configuration

Each mode has the following configurable parameters:

- `margin`: Margin

- `aggressive_down`: Whether to use aggressive down frequency strategy

- `sampling_interval`: Sampling interval (milliseconds)

- `gaming_mode`: Gaming optimization, enable special memory optimization for games

- `adaptive_sampling`: Whether to enable adaptive sampling

- `min_adaptive_interval`: Minimum adaptive sampling interval (milliseconds)

- `max_adaptive_interval`: Maximum adaptive sampling interval (milliseconds)

- `up_rate_delay`: Frequency increase delay (milliseconds)

- `down_rate_delay`: Frequency decrease delay (milliseconds)

### GPU Frequency Table Configuration

The frequency table file is located at `/data/adb/gpu_governor/config/gpu_freq_table.toml`:

```toml

# GPU frequency table

# freq unit: kHz

# volt unit: uV

# ddr_opp: DDR OPP level

[[freq_table]]
freq = 218000
volt = 45000
ddr_opp = 999

[[freq_table]]
freq = 280000
volt = 46875
ddr_opp = 999

[[freq_table]]
freq = 350000
volt = 48750
ddr_opp = 999

[[freq_table]]
freq = 431000
volt = 49375
ddr_opp = 999

[[freq_table]]
freq = 471000
volt = 50625
ddr_opp = 999

[[freq_table]]
freq = 532000
volt = 51875
ddr_opp = 999

[[freq_table]]
freq = 573000
volt = 53125
ddr_opp = 3

[[freq_table]]
freq = 634000
volt = 55000
ddr_opp = 3

[[freq_table]]
freq = 685000
volt = 56875
ddr_opp = 0

[[freq_table]]
freq = 755000
volt = 59375
ddr_opp = 0

[[freq_table]]
freq = 853000
volt = 60625
ddr_opp = 0
```

**Configuration Parameter Description**:

- **freq**: GPU frequency (kHz)

- **volt**: Voltage (μV)

- **ddr_opp**: DDR OPP level (999 means no adjustment, 0-3 means different levels)

**Preset Configuration Files**:

- `config/mtd1000.toml` - Dimensity 1000 series

- `config/mtd1100.toml` - Dimensity 1100 series

- `config/mtd1200.toml` - Dimensity 1200 series

- `config/mtd8100.toml` - Dimensity 8100 series

- `config/mtd8200.toml` - Dimensity 8200 series

- `config/mtd9000.toml` - Dimensity 9000 series

### Preset Frequency Table Format

Each preset configuration file uses TOML array format to define the frequency table for specific processors:

```toml
freq_table = [
    { freq = 219000, volt = 45000, ddr_opp = 999 },
    { freq = 280000, volt = 46875, ddr_opp = 999 },
    { freq = 351000, volt = 48750, ddr_opp = 999 },
    { freq = 402000, volt = 50000, ddr_opp = 999 },
    { freq = 487000, volt = 52500, ddr_opp = 999 },
    { freq = 555000, volt = 55625, ddr_opp = 0 },
    { freq = 642000, volt = 57500, ddr_opp = 0 },
    { freq = 721000, volt = 58125, ddr_opp = 0 },
    { freq = 800000, volt = 59375, ddr_opp = 0 },
    { freq = 852000, volt = 60000, ddr_opp = 0 }
]
```

Different processor series have different frequency ranges and voltage configurations. The module will automatically select the matching frequency table configuration based on the device model.

### Game List Configuration

The game list configuration file is located at `/data/adb/gpu_governor/game/games.toml`, containing game package names and corresponding modes. The module will automatically scan installed games on the device and generate this configuration file during installation.

**Note**: The installation script will check if the game list file already exists, and if so, it will not overwrite it to preserve user's game preferences.

### Interactive Control Menu

The module provides the `action.sh` script, supporting interactive operations via volume keys:

**Script Features**:

- **Control Governor Service**: Start or stop the GPU governor service

- **Set Log Level**: Choose debug, info, warn, or error level

- **View Module Status**: Display module version, running status, and other information

**Operation**:

- Volume Up Key: Move selection down (increment selection in menu)

- Volume Down Key: Confirm selection

The script will automatically detect the current system language and display the corresponding Chinese or English interface.

**Module Files**:

- Log level setting: `/data/adb/gpu_governor/log/log_level`

- Game list configuration: `/data/adb/gpu_governor/game/games.toml`

- PID management: `/data/adb/gpu_governor/gpu_governor.pid`

### Log Level Setting

Log level setting is saved in `/data/adb/gpu_governor/log/log_level` file, default is `info` level. It can be set in three ways:

1. Use interactive menu `./action.sh` to select log level

2. Adjust via WebUI settings page

3. Directly edit `/data/adb/gpu_governor/log/log_level` file

Changes to log level take effect immediately after saving, without restarting the module.

## Logging System 📊

Log files are stored in `/data/adb/gpu_governor/log/` directory, mainly including:

- **gpu_gov.log**: Main log file, managed by Rust core, records GPU governor running status

- **initsvc.log**: Initialization log, records module startup process and script initialization information

Log content can be viewed through the WebUI interface or directly through a file manager.

### Log Management

The module's main log has been fully implemented by the Rust core, including:

- Log file creation and writing

- Automatic log rotation and size control

- Real-time monitoring and response to log level changes

## Supported Devices 📱

Supports most MediaTek processors with Mali GPU:

- Dimensity series (e.g. D1x00/D8x00/D9000, etc.) 0 ≤ x ≤ 2

The module will automatically detect the device model and apply the appropriate configuration.
If your device is not in the adaptation list, the module will use the default configuration.

## Acknowledgements 🙏

- **Developers**: WaliKa @CoolApk = Seyud @GitHub, Tools-cx-app @GitHub

- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @GitHub

- **Testing Feedback**: All members of the internal testing group

- **Configuration Assistance**: Fiagelia @CoolApk, Wangjian @CoolApk

## Notes ⚠️

- Modifying GPU frequency and voltage may affect device stability

- Improper configuration may cause device performance or stability issues

- If problems occur, you can check the log files for troubleshooting

## WebUI Interface 🖥️

This module provides a modern WebUI interface based on KernelSU API, designed in Miuix style, providing users with an intuitive GPU governor management and monitoring experience.
WebUI supports configuration file hot-reload, real-time log viewing, visual editing of game lists and frequency tables, with all changes taking effect immediately.

### Features

#### WebUI Features

- **Real-time Status Monitoring**: View running status, current mode, and version information

- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supporting adjustment of frequency, voltage, and memory levels

- **Custom Configuration**: View and edit current custom configuration, supporting global configuration and mode configuration

- **Game List Management**: View and edit configured game list, supporting adding/removing games and selecting corresponding modes

- **Log Viewing**: Real-time viewing of module running logs, supporting selection of different log files and log levels

#### UI Features

- **Dark Mode Support**: Automatically adapts to system dark/light mode, can also be manually switched

- **Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings

- **Voltage Adjuster**: Supports using rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)

- **Real-time Updates**: Detects game mode status changes every second and updates the interface

- **Toast Notifications**: Operation feedback and status tips

### UI Layout

WebUI uses a multi-page layout, switching pages through the bottom navigation bar:

## FAQ ❓

### Basic Usage Questions

**Q: How to confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file, or view the running status and logs through the WebUI interface, confirming no frequent abnormal errors.

**Q: How does game mode work?**
A: When apps listed in `games.toml` are detected running in the foreground, game mode will be automatically applied; in game mode, the corresponding mode in the game list will be used.

**Q: How to add custom games to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.toml` file, add the game's package name. Or add through the game list page of the WebUI interface. The module will automatically scan installed games on the device and generate the initial game list during installation.

**Q: How to adjust log level?**
A: Three ways: 1) Use interactive menu `./action.sh` to select log level; 2) Adjust via WebUI settings page; 3) Directly edit `/data/adb/gpu_governor/log/log_level` file. Changes take effect immediately after adjustment, without restarting the module.

**Q: How to use WebUI?**
A: KernelSU/APatch users can click this module in the root manager and select "Open WebUI". Magisk users can install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [SSU](https://ssu.oom-wg.dev/base/install) apps to access the module's WebUI.

**Q: Do I need to restart after modifying configuration files and parameters?**
A: No. The module supports configuration file hot-reload and multithreaded monitoring. All changes (such as frequency table, game list, log level, etc.) can take effect in real time without restarting.
