# Dimensity GPU Governor 🚀

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)
[![Version](https://img.shields.io/badge/Version-v2.7-brightgreen)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor)
[![Language](https://img.shields.io/badge/Language-Rust-orange)](https://www.rust-lang.org/)

## Introduction 📝
[简体中文](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/README.md) | [English](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/en/README.md)

Dimensity GPU Governor (Mediatek Mali GPU Governor) is an advanced GPU governor specifically designed for MediaTek processors. Featuring a high-performance core engine developed in **Rust**, it achieves optimal balance between gaming experience and power consumption by intelligently monitoring GPU load and dynamically adjusting frequencies. The module integrates a modern **WebUI management interface**, **multi-level load threshold system**, **adaptive frequency scaling algorithm**, and **complete game mode detection**, providing users with a professional-grade GPU frequency scaling solution.

## Features ✨

### Core Functions
- 🎮 **Smart Game Mode**: Automatically detects gaming applications configured in `games.conf` and applies performance-optimized GPU frequency strategies
- 📊 **Real-time Load Monitoring**: Based on high-performance Rust implementation, monitors GPU load in real-time
- ⚡ **Multi-level Load Thresholds**: Supports five load regions: very low (5-10%), low (20-30%), medium (60-70%), high (85-90%), and very high (90%+)
- 🔄 **Adaptive Frequency Scaling Algorithm**: Game mode uses aggressive upscaling strategy, normal mode uses power-saving downscaling strategy
- 🎯 **Precise Frequency Control**: Full support for GPUFreq v1/v2 drivers, automatically detects driver version and adapts
- 🧠 **Load Trend Analysis**: Analyzes trends based on historical load data for predictive frequency adjustments
- ⚙️ **Smart Frequency Writing**: V2 driver optimization mechanism reduces unnecessary frequency write operations
- 🎛️ **Voltage and Memory Linkage**: Supports DDR frequency level adjustment with precise voltage-frequency correspondence

### User Interface & Interaction
- 🖥️ **Modern WebUI**: Graphical management interface based on KernelSU API with Miuix style design
- 🌓 **Smart Theme System**: Supports dark/light/auto modes, automatically adapts to system settings
- 🌐 **Complete Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings
- 📊 **Visual Configuration Editing**: Supports direct editing of frequency tables, voltages, and game lists through WebUI
- 🔧 **Interactive Control Scripts**: Provides `action.sh` volume key control script supporting service management and log level settings

### Technical Features
- 🦀 **Rust Core Engine**: Developed in Rust language, ensuring memory safety, zero-cost abstractions, and ultimate performance
- 🔧 **Highly Customizable**: Customize GPU frequency, voltage, and memory frequency levels through configuration files
- 📱 **Wide Device Compatibility**: Supports multiple MediaTek processor series including Dimensity, Helio, MT6xxx
- 📝 **Professional Logging System**: Supports four log levels: debug/info/warn/error
- 🔄 **Automatic Device Adaptation**: Automatically detects device model during installation and applies optimal configuration files
- ⚡ **Hysteresis and Debouncing**: Implements hysteresis thresholds and debouncing mechanisms for frequency adjustments to avoid frequent frequency hopping
- 🎯 **Margin Adjustment System**: Supports 0-100% frequency calculation margin adjustment, balancing performance and power consumption

## Installation Requirements 📋

### Device Requirements
- Rooted Android device
- Device with MediaTek processor (MTK) supporting Mali GPU
- Device supporting GPUFreq v1 or v2 drivers
- Magisk v20.4+ or KernelSU or APatch or other Root solutions supporting modules

### WebUI Function Requirements
- To use WebUI functions, one of the following environments is required:
  - **KernelSU/APatch users**: Directly click the module's "Open WebUI" function in the manager
  - **Magisk users**: Need to install one of the following applications
    - [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) - Standalone WebUI application
    - [MMRL](https://github.com/MMRLApp/MMRL) - Module manager application

## Configuration Files ⚙️

### GPU Frequency Table Configuration

The main configuration file is located at `/data/gpu_freq_table.conf`. The module will automatically select appropriate configuration files based on device model:

```
# Margin: Adjust GPU frequency calculation margin percentage
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

**Configuration Parameter Explanation**:
- **Freq**: GPU frequency (KHz)
- **Volt**: Voltage (μV)
- **DDR_OPP**: Memory frequency level (999 means no adjustment, 0-3 represent different levels)
- **Margin**: Frequency calculation margin percentage (adjustable through WebUI or direct configuration file editing)

**Preset Configuration Files**:
- `config/mtd720.conf` - Dimensity 720 series
- `config/mtd1000.conf` - Dimensity 1000 series
- `config/mtd1100.conf` - Dimensity 1100 series
- `config/mtd1200.conf` - Dimensity 1200 series
- `config/mtd8100.conf` - Dimensity 8100 series
- `config/mtd8200.conf` - Dimensity 8200 series
- `config/mtd9000.conf` - Dimensity 9000 series

### Game List Configuration

The game list configuration file is located at `/data/adb/gpu_governor/game/games.conf`, containing application package names that need game mode applied. The module will automatically scan installed games on the device and generate this configuration file during installation.

**Note**: The installation script will check if the game list file already exists. If it exists, it will not be overwritten to preserve user custom settings.

### Interactive Control Menu

The module provides an `action.sh` script supporting interactive operations through volume keys:

**Script Functions**:
- **Control Governor Service**: Start or stop GPU governor service
- **Set Log Level**: Choose debug, info, warn, or error level
- **View Module Status**: Display module version, running status, etc.
- **Log Management**: Automatic log rotation to prevent log files from becoming too large

**Important Change**: Starting from v2.7, the `action.sh` script no longer supports manual game mode switching. Game mode completely relies on automatic detection of application package names configured in `games.conf`.

**Operation Methods**:
- Volume Up key: Select option up
- Volume Down key: Select option down
- Power key: Confirm selection

The script automatically detects current system language and displays corresponding Chinese or English interface.

**Module Files**:
- Game mode status: `/data/adb/gpu_governor/game/game_mode` (1=enabled, 0=disabled)
- Log level setting: `/data/adb/gpu_governor/log/log_level`
- Game list configuration: `/data/adb/gpu_governor/game/games.conf`
- Process ID management: `/data/adb/gpu_governor/gpu_governor.pid`

### Log Level Settings

Log level settings are saved in the `/data/adb/gpu_governor/log/log_level` file, defaulting to `info` level. Can be set through three methods:
1. Use interactive menu `./action.sh` to select log level
2. Adjust through WebUI interface settings page
3. Directly edit `/data/adb/gpu_governor/log/log_level` file

Log level changes take effect immediately without needing to restart the module.

### Load Threshold Settings

The module internally implements an intelligent multi-level load threshold system for precise GPU frequency adjustment. The system automatically adjusts thresholds based on current mode:

**Normal Mode** (default load thresholds: 10/30/70/90):
- **Very Low Load**: Below 10%, reduce frequency to save power, supports deep power saving
- **Low Load**: 10-30%, appropriately reduce frequency, maintain basic performance
- **Medium Load**: 30-70%, maintain balanced frequency, optimal for daily use
- **High Load**: 70-90%, increase frequency for better performance
- **Very High Load**: Above 90%, use maximum frequency, full output

**Game Mode** (performance load thresholds: 5/20/60/85):
- **Very Low Load**: Below 5%, minimum frequency, save standby power consumption
- **Low Load**: 5-20%, lower frequency, game menu interface
- **Medium Load**: 20-60%, medium frequency, light gaming load
- **High Load**: 60-85%, high frequency, medium to heavy gaming scenarios
- **Very High Load**: Above 85%, maximum frequency, extreme gaming performance

**Advanced Scaling Parameters**:
- **Hysteresis Threshold Mechanism**: Game mode 65%/40%, normal mode 75%/30%, prevents frequency oscillation
- **Debouncing Time Control**: Game mode 10ms/30ms, normal mode 20ms/50ms, ensures stable frequency scaling
- **Adaptive Sampling Algorithm**: Base interval 16ms (approximately 60Hz), dynamically adjusts 8-100ms based on load
- **Load Trend Analysis**: Detects load rising/falling trends for predictive frequency adjustment
- **Margin Adjustment System**: Supports 0-100% frequency calculation margin

## Logging System 📊

Log files are stored in the `/data/adb/gpu_governor/log/` directory, mainly including:

- **gpu_gov.log**: Main log file recording GPU governor running status and frequency adjustment records
- **initsvc.log**: Initialization service log recording module startup process

Log file size is limited to 5MB. When exceeding the limit, automatic rotation occurs to prevent excessive storage usage. During rotation, the original log file is backed up as a `.bak` file and a new log file is created. Log content can be viewed through the WebUI interface or directly through file manager.

### Log Levels

The module supports four log levels, which can be set through the `action.sh` script or WebUI interface:

- **debug**: Debug level, records all detailed information including frequency adjustments, load monitoring, etc.
- **info**: Information level, records normal operation information, default level
- **warn**: Warning level, only records warning and error information
- **error**: Error level, only records error information

Log level settings are saved in the `/data/adb/gpu_governor/log/log_level` file and take effect immediately after modification without needing to restart the module.

### Log Rotation Mechanism

The module implements automatic log rotation mechanism:

1. During rotation, the current log file is backed up as a `.bak` file and a new empty log file is created
2. Necessary rotation is performed each time the module starts

## Uninstallation Method 🗑️

Uninstall the module through the root manager, or execute the `uninstall.sh` script to clean configuration files. During uninstallation, the following files will be automatically deleted:

- `/data/gpu_freq_table.conf`
- `/data/adb/gpu_governor/` directory and all its contents

## Supported Devices 📱

Supports most MediaTek processors with Mali GPU, including but not limited to:
- Dimensity series (such as D700/D800/D900/D1x00/D8x00/D9000, etc.) where 0 ≤ x ≤ 2
- Helio series
- MT6xxx series

The module will automatically detect device model and apply suitable configuration.

If your device is not in the support list, the module will use default configuration. You can also manually edit configuration files to adapt to your device.

## Acknowledgments 🙏

- **Author**: 瓦力喀 @CoolApk, rtools @CoolApk
- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **Testing Feedback**: All members of the beta testing group
- **Configuration Assistance**: Fiagelia @CoolApk, 忘渐 @CoolApk

## Important Notes ⚠️

- Modifying GPU frequency and voltage may affect device stability
- Improper configuration may cause device overheating or performance issues
- Recommend backing up original configuration files for recovery
- If problems occur, check log files for troubleshooting

## WebUI Interface 🖥️

This module provides a modern WebUI interface based on KernelSU API with Miuix style design, offering users an intuitive GPU governor management and monitoring experience.

### Feature Highlights

#### Core Functions
- **Real-time Status Monitoring**: View module running status, version information, and game mode status
- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supports adjusting frequency, voltage, and memory levels
- **Game List Management**: View and edit configured game lists, supports adding/removing games
- **Log Viewing**: Real-time module running log viewing, supports selecting different log files and log levels
- **Margin Settings**: Supports adjusting GPU frequency calculation margin percentage

#### Interface Features
- **Dark Mode Support**: Automatically adapts to system dark/light mode, can also be manually switched
- **Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings
- **Voltage Adjuster**: Supports using rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)
- **Real-time Updates**: Detects game mode status changes every second and updates interface
- **Toast Notifications**: Operation feedback and status prompts

### Interface Layout

WebUI uses multi-page layout with page switching through bottom navigation bar:

#### 📊 Status Page
- Display module running status and version information
- Game mode switch control
- Current GPU frequency and load display

#### ⚙️ Configuration Page
- GPU frequency table configuration editing
- Voltage and memory frequency level adjustment
- Game list management
- Margin setting adjustment

#### 📝 Log Page
- Real-time log viewing
- Log file selection (gpu_gov.log, initsvc.log)
- Log level filtering

#### 🔧 Settings Page
- Theme settings (dark/light/auto)
- Language settings (Chinese/English/auto)
- Log level settings
- Other advanced options

## Frequently Asked Questions ❓

### Basic Usage Questions

**Q: How to confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file to confirm normal frequency adjustment records. Or view module status and logs through the WebUI interface. When working normally, the log should contain GPU load and frequency adjustment records.

**Q: How does game mode work?**
A: When applications listed in `games.conf` are detected running in the foreground, game mode is automatically applied; in game mode, more aggressive upscaling strategies are used (load thresholds of 5/20/60/85), providing better gaming experience in high-load regions.

**Q: How to add custom games to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.conf` file and add the game's package name. Or add through the game list page in the WebUI interface. The module will automatically scan installed games on the device and generate an initial game list during installation.

**Q: How to adjust log level?**
A: There are three methods: 1) Use interactive menu `./action.sh` to select log level; 2) Adjust through WebUI interface settings page; 3) Directly edit `/data/adb/gpu_governor/log/log_level` file. Changes take effect immediately without needing to restart the module.

**Q: How to use WebUI?**
A: KernelSU/APatch users can click this module in the root manager and select "Open WebUI". Magisk users can install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [MMRL](https://github.com/MMRLApp/MMRL) applications to access the module's WebUI.

**Q: How to adjust GPU frequency calculation margin?**
A: Add or modify the `Margin=value` line in the `/data/gpu_freq_table.conf` file, where value represents margin percentage. Can also be adjusted through the configuration page in the WebUI interface. Higher margin means higher actual frequency, better performance but also higher power consumption.

## Uninstallation Method 🗑️

Uninstall the module through the root manager. During uninstallation, the following files will be automatically deleted:

- `/data/gpu_freq_table.conf`
- `/data/adb/gpu_governor/` directory and all its contents
