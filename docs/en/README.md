# Dimensity GPU Governor 🚀

[![Discord](https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white)](https://discord.gg/Hk4uzxGfZp) [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)

## Introduction 📝

Dimensity GPU Governor (Mediatek Mali GPU Governor) is a GPU frequency regulation tool designed specifically for MediaTek processors. By intelligently monitoring GPU load and dynamically adjusting frequency, it provides better gaming experience and power balance. The core program is developed in Rust language, featuring high efficiency and stability, combined with a complete module script system and modern WebUI interface to provide users with a comprehensive GPU governor solution.

## Features ✨

### Core Functionality
- 🎮 **Smart Game Mode**: Automatically identifies gaming applications and applies optimized GPU frequency settings
- 📊 **Real-time Load Monitoring**: High-performance implementation based on Rust, monitors GPU load in real-time and dynamically adjusts frequency based on demand
- ⚡ **Adaptive Performance Optimization**: Provides high performance when needed, reduces frequency when idle to save power
- 🔄 **Multi-level Load Thresholds**: Supports intelligent frequency adjustment for five load regions: very low, low, medium, high, very high
- 🎯 **Precise Frequency Control**: Supports GPUFreq v1/v2 drivers, automatically detects and adapts to different devices

### User Interface & Interaction
- 🖥️ **Modern WebUI**: Graphical management interface based on KernelSU API, using Miuix style design
- 🌓 **Theme Support**: Supports dark/light modes, automatically adapts to system settings or manual switching
- 🌐 **Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings
- 🎛️ **Interactive Control**: Provides volume key control script, supports interactive operations

### Technical Features
- 🦀 **Rust Core**: Core governor algorithms developed in Rust language, ensuring memory safety and high performance
- 🔧 **Highly Customizable**: Customize GPU frequency, voltage, and memory frequency levels through configuration files
- 📱 **Wide Compatibility**: Supports various MediaTek processor platforms, including Dimensity series, Helio series, etc.
- 📝 **Complete Logging System**: Supports debug, info, warn, error log levels with automatic log rotation
- 🔄 **Automatic Configuration**: Automatically detects device model and applies appropriate configuration files during installation

## Installation Requirements 📋

### Device Requirements
- Rooted Android device
- Device with MediaTek processor (MTK) supporting Mali GPU
- Magisk v20.4+ or KernelSU or APatch or other root solutions that support modules

### WebUI Functionality Requirements
- WebUI functionality requires KernelSU, APatch, or installing one of the following applications:
  - [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) - Standalone WebUI application
  - [MMRL](https://github.com/MMRLApp/MMRL) - Module manager application

## Configuration Files ⚙️

### GPU Frequency Table Configuration

The main configuration file is located at `/data/gpu_freq_table.conf`. The module will automatically select the appropriate configuration file based on the device model:

```
# Margin: Adjusts the margin percentage for GPU frequency calculation
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

**Configuration Parameter Description**:
- **Freq**: GPU frequency (KHz)
- **Volt**: Voltage (μV)
- **DDR_OPP**: Memory frequency level (999 means no adjustment, 0-3 represents different levels)
- **Margin**: Frequency calculation margin percentage (can be adjusted through WebUI or by directly editing the configuration file)

**Preset Configuration Files**:
- `config/mtd1000.conf` - Dimensity 1000 series
- `config/mtd1100.conf` - Dimensity 1100 series
- `config/mtd1200.conf` - Dimensity 1200 series
- `config/mtd8100.conf` - Dimensity 8100 series
- `config/mtd8200.conf` - Dimensity 8200 series
- `config/mtd9000.conf` - Dimensity 9000 series

### Game List Configuration

The game list configuration file is located at `/data/adb/gpu_governor/game/games.conf` and contains package names of applications that should use game mode. The module will automatically scan for installed games on the device during installation and generate this configuration file.

**Note**: The installation script will check if the game list file already exists. If it exists, it will not be overwritten to preserve user customizations.

### Interactive Control Menu

The module provides an `action.sh` script that supports interactive operations via volume keys:

**Script Functions**:
- **Toggle Game Mode**: Enable or disable game mode, takes effect immediately
- **Control Governor Service**: Start or stop the GPU governor service
- **Set Log Level**: Choose debug, info, warn, or error level
- **View Module Status**: Display module version, running status, and other information
- **Log Management**: Automatic log rotation to prevent log files from becoming too large

**Operation Method**:
- Volume Up Key: Move up in options
- Volume Down Key: Move down in options
- Power Key: Confirm selection

The script automatically detects the current system language and displays the corresponding Chinese or English interface.

**Status Files**:
- Game mode status: `/data/adb/gpu_governor/game/game_mode` (1=enabled, 0=disabled)
- Log level setting: `/data/adb/gpu_governor/log/log_level`

### Log Level Settings

The log level setting is saved in the `/data/adb/gpu_governor/log/log_level` file, with the default being `info` level. It can be set using three methods:
1. Use the interactive menu `./action.sh` to select the log level
2. Adjust it through the settings page in the WebUI interface
3. Directly edit the `/data/adb/gpu_governor/log/log_level` file

Changes to the log level take effect immediately without needing to restart the module.

### Load Threshold Settings

The module implements multi-level load thresholds internally for intelligently adjusting GPU frequency. The system automatically adjusts thresholds based on the current mode:

**Normal Mode** (default load thresholds: 10/30/70/90):
- **Very Low Load**: Below 10%, reduces frequency to save power
- **Low Load**: 10-30%, moderately reduces frequency
- **Medium Load**: 30-70%, maintains balanced frequency
- **High Load**: 70-90%, increases frequency for better performance
- **Very High Load**: Above 90%, uses maximum frequency

**Game Mode** (performance load thresholds: 5/20/60/85):
- **Very Low Load**: Below 5%, minimum frequency
- **Low Load**: 5-20%, lower frequency
- **Medium Load**: 20-60%, medium frequency
- **High Load**: 60-85%, high frequency
- **Very High Load**: Above 85%, maximum frequency

**Advanced Governor Parameters**:
- **Hysteresis Thresholds**: Prevents frequency jitter, game mode 65%/40%, normal mode 75%/30%
- **Debounce Time**: Game mode 10ms/30ms, normal mode 20ms/50ms
- **Adaptive Sampling**: Dynamically adjusts sampling interval based on load, base interval 16ms (approximately 60Hz)
- **Load Trend Analysis**: Detects load increase/decrease trends, optimizes frequency adjustment strategy

## Logging System 📊

Log files are stored in the `/data/adb/gpu_governor/log/` directory, mainly including:

- **gpu_gov.log**: Main log file, recording the GPU governor's running status and frequency adjustment records
- **initsvc.log**: Initialization service log, recording the module startup process

Log file size is limited to 5MB, with automatic rotation when the limit is exceeded to prevent excessive storage space usage. During rotation, the original log file is backed up as a `.bak` file, and a new log file is created. Log content can be viewed through the WebUI interface or directly using a file manager.

### Log Levels

The module supports four log levels, which can be set through the `action.sh` script or WebUI interface:

- **debug**: Debug level, records all detailed information, including frequency adjustments, load monitoring, etc.
- **info**: Information level, records normal operating information, default level
- **warn**: Warning level, only records warning and error information
- **error**: Error level, only records error information

Log level settings are saved in the `/data/adb/gpu_governor/log/log_level` file, with changes taking effect immediately without needing to restart the module.

### Log Rotation Mechanism

To prevent log files from occupying too much storage space, the module implements an automatic log rotation mechanism:

1. When the log file size reaches 80% of the maximum limit (5MB), rotation will automatically occur
2. During rotation, the current log file is backed up as a `.bak` file, and a new empty log file is created
3. The log size is also checked during each module startup, with rotation performed as necessary

## Uninstallation Method 🗑️

Uninstall the module through the root manager, or execute the `uninstall.sh` script to clean up configuration files. The following files will be automatically deleted during uninstallation:

- `/data/gpu_freq_table.conf`
- `/data/adb/gpu_governor/` directory and all its contents

## Supported Devices 📱

Supports most MediaTek processors with Mali GPU, including but not limited to:
- Dimensity series (such as D700/D800/D900/D1000/D8000/D9000, etc.)
- Helio series
- MT6xxx series

The module automatically detects the device model and applies the appropriate configuration.
If your device is not on the support list, the module will use the default configuration. You can also manually edit the configuration file to adapt to your device.

## Acknowledgements 🙏

- **Authors**: Walika @CoolApk, rtools @CoolApk
- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **Testing Feedback**: All members of the beta testing group
- **Configuration Assistance**: Fiagelia @CoolApk, Wangjian @CoolApk

## Precautions ⚠️

- Modifying GPU frequency and voltage may affect device stability
- Improper configuration may lead to device overheating or performance issues
- It is recommended to backup the original configuration file for recovery
- If problems occur, log files can be checked for troubleshooting

## WebUI Interface 🖥️

This module provides a modern WebUI interface based on KernelSU API, using Miuix style design to provide users with an intuitive GPU governor management and monitoring experience.

### Access Methods

#### KernelSU/APatch Users
1. Ensure KernelSU/APatch is installed and WebUI functionality is enabled
2. Click on this module in the KernelSU/APatch manager and select "Open WebUI"

#### Magisk Users
Magisk users can access the WebUI through the following methods:
1. Install the [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) application
2. Or use the [MMRL](https://github.com/MMRLApp/MMRL) application to open the module's WebUI

### Features

#### Core Functions
- **Real-time Status Monitoring**: View module running status, version information, and game mode status
- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supporting adjustment of frequency, voltage, and memory levels
- **Game List Management**: View and edit configured game lists, supporting adding/removing games
- **Log Viewing**: View module operation logs in real-time, supporting selection of different log files and log levels
- **Margin Settings**: Support for adjusting the margin percentage for GPU frequency calculation

#### Interface Features
- **Dark Mode Support**: Automatically adapts to system dark/light mode, with manual toggling also available
- **Multi-language Support**: Support for Chinese and English interfaces, automatically detecting system language settings
- **Voltage Adjuster**: Support for using a rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)
- **Real-time Updates**: Checks for game mode status changes every second and updates the interface
- **Toast Notifications**: Operation feedback and status notifications

### Interface Layout

The WebUI uses a multi-page layout with page switching via the bottom navigation bar:

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

**Q: How do I confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file to confirm normal frequency adjustment records. Or view the module status and logs through the WebUI interface. When working normally, the logs should contain records of GPU load and frequency adjustments.

**Q: How does game mode work?**
A: Game mode has two activation methods: 1) When detecting applications listed in `games.conf` running, it automatically applies game mode; Game mode uses a more aggressive frequency increase strategy (load thresholds at 5/20/60/85), entering high load areas faster to provide a better gaming experience.

**Q: How do I add custom games to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.conf` file and add the game's package name. Or add it through the game list page in the WebUI interface. The module will automatically scan for installed games on the device during installation and generate an initial game list.

**Q: How do I adjust the log level?**
A: There are three methods: 1) Use the interactive menu `./action.sh` to select the log level; 2) Adjust it through the settings page in the WebUI interface; 3) Directly edit the `/data/adb/gpu_governor/log/log_level` file. Adjustments take effect immediately without needing to restart the module.

**Q: How do I use the WebUI?**
A: KernelSU/APatch users can click on this module in the root manager and select "Open WebUI". Magisk users can install the [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [MMRL](https://github.com/MMRLApp/MMRL) applications to access the module's WebUI.

**Q: How do I adjust the margin for GPU frequency calculation?**
A: Add or modify the `Margin=value` line in the `/data/gpu_freq_table.conf` file, where the value represents the margin percentage. This can also be adjusted through the configuration page in the WebUI interface. A larger margin results in higher actual frequency, better performance, but also higher power consumption.
