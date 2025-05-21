# Dimensity GPU Governor 🚀

[![Discord](https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white)](https://discord.gg/Hk4uzxGfZp) [![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)

## Introduction 📝

Mediatek Mali GPU Governor is a GPU frequency regulation tool designed specifically for MediaTek processors. It intelligently monitors GPU load and dynamically adjusts frequency to provide better gaming experience and power efficiency. Developed in Rust language, it features high efficiency and stability.

## Features ✨

- 🎮 **Game Mode**: Automatically identifies gaming applications and applies optimized GPU frequency settings
- 📊 **Load Monitoring**: Monitors GPU load in real-time and dynamically adjusts frequency based on demand
- ⚡ **Performance Optimization**: Provides high performance when needed, reduces frequency when idle to save power
- 🔧 **Highly Customizable**: Customize GPU frequency and voltage through configuration files
- 📱 **Wide Compatibility**: Supports various MediaTek processor platforms, including Dimensity series
- 🖥️ **WebUI Interface**: Graphical management interface based on KernelSU, supports dark/light mode with Miuix style
- 📝 **Multi-level Logging**: Supports debug, info, warn, error log levels for easier debugging
- 🔄 **Multi-level Load Thresholds**: Intelligent frequency adjustment for five load regions: very low, low, medium, high, very high
- 🌐 **Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings

## Installation Requirements 📋

- Rooted Android device
- Device with MediaTek processor (MTK) supporting Mali GPU
- Magisk v20.4+ or KernelSU or APatch or other root solutions that support modules
- WebUI functionality requires KernelSU, APatch, or installing [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone)/[MMRL](https://github.com/MMRLApp/MMRL) applications

## Installation Method 💻

1. Install this module in Magisk or KernelSU
2. Restart the device
3. The module will automatically configure and start the GPU governor service
4. After installation, the module will automatically recognize the device model and apply appropriate configuration
5. If the device model is not supported, the default configuration file will be used

## Configuration Files ⚙️

### GPU Frequency Table Configuration

The configuration file is located at `/data/gpu_freq_table.conf`, with the following format:

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

- **Freq**: GPU frequency (KHz)
- **Volt**: Voltage (μV)
- **DDR_OPP**: Memory frequency level (999 means no adjustment, 0-3 represents different levels)
- **Margin**: Frequency calculation margin percentage (can be adjusted through WebUI or by directly editing the configuration file)

### Game List Configuration

The game list configuration file is located at `/data/adb/gpu_governor/game/games.conf` and contains package names of applications that should use game mode. The module will automatically scan for installed games on the device during installation and generate this configuration file.

**Note**: The installation script will check if the game list file already exists. If it exists, it will not be overwritten to preserve user customizations.

### Interactive Control Menu

The module provides an `action.sh` script that allows interactive operation via volume keys:

```
# Execute the script directly, no parameters needed
./action.sh
```

The script will display an interactive menu allowing the following operations via volume keys:
- **Toggle Game Mode**: Enable or disable game mode
- **Control Governor Service**: Start or stop the GPU governor service
- **Set Log Level**: Choose debug, info, warn, or error level

The script automatically detects the current system language and displays the corresponding Chinese or English interface.

Game mode status is saved in the `/data/adb/gpu_governor/game/game_mode` file, with a value of `1` indicating enabled and `0` indicating disabled.

### Log Level Settings

The log level setting is saved in the `/data/adb/gpu_governor/log/log_level` file, with the default being `info` level. It can be set using three methods:
1. Use the interactive menu `./action.sh` to select the log level
2. Adjust it through the settings page in the WebUI interface
3. Directly edit the `/data/adb/gpu_governor/log/log_level` file

Changes to the log level take effect immediately without needing to restart the module.

### Load Threshold Settings

The module implements multi-level load thresholds for intelligently adjusting GPU frequency:

- **Very Low Load**: Default below 10%, reduces frequency to save power
- **Low Load**: Default 10-30%, moderately reduces frequency
- **Medium Load**: Default 30-70%, maintains balanced frequency
- **High Load**: Default 70-90%, increases frequency for better performance
- **Very High Load**: Default above 90%, uses maximum frequency

In game mode, a more aggressive frequency increase strategy is used, with load thresholds at 5/20/60/85, entering high load areas faster to provide a better gaming experience. This design allows for quicker response to load changes during gaming, providing a smoother experience.

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

This module provides a KernelSU-based WebUI interface for users to intuitively manage and monitor the GPU governor. The WebUI uses Miuix style design, supporting dark/light modes and multiple languages.

### Access Methods

#### KernelSU/APatch Users
1. Ensure KernelSU/APatch is installed and WebUI functionality is enabled
2. Click on this module in the KernelSU/APatch manager and select "Open WebUI"

#### Magisk Users
Magisk users can access the WebUI through the following methods:
1. Install the [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) application
2. Or use the [MMRL](https://github.com/MMRLApp/MMRL) application to open the module's WebUI

### Features

- **Real-time Status Monitoring**: View module running status, version information, and game mode status
- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supporting adjustment of frequency, voltage, and memory levels
- **Game List Management**: View and edit configured game lists
- **Log Viewing**: View module operation logs in real-time, supporting selection of different log files and log levels
- **Dark Mode Support**: Automatically adapts to system dark/light mode, with manual toggling also available
- **Log Level Settings**: Support for directly setting log levels in the WebUI
- **Multi-language Support**: Support for Chinese and English interfaces, automatically detecting system language settings
- **Voltage Adjustment**: Support for using a rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)
- **Game Mode Real-time Updates**: Checks for game mode status changes every second and updates the interface

### Interface Layout

The WebUI provides a multi-page layout, with page switching via the bottom bar, including the following main sections:

- **Status Page**: Displays module running status, version information, and game mode switch
- **Configuration Page**: Displays and edits current configuration of frequency, voltage, and memory frequency levels, as well as managing game lists and margin settings
- **Log Page**: Displays recent operation logs, supporting selection of different log files and log levels
- **Settings Page**: Provides theme settings, language settings, log level settings, and other options

## Frequently Asked Questions ❓

**Q: How do I confirm the module is working properly?**
A: Check the `/data/adb/gpu_governor/log/gpu_gov.log` log file to confirm normal frequency adjustment records. Or view the module status and logs through the WebUI interface. When working normally, the logs should contain records of GPU load and frequency adjustments.

**Q: How does game mode work?**
A: Game mode has two activation methods: 1) It automatically applies when detecting applications listed in `games.conf` running; 2) It can be manually enabled through the `action.sh` script or WebUI. In game mode, a more aggressive frequency increase strategy is used (load thresholds at 5/20/60/85), entering high load areas faster to provide a better gaming experience.

**Q: How do I add custom games to the list?**
A: Edit the `/data/adb/gpu_governor/game/games.conf` file and add the game's package name. Or add it through the game list page in the WebUI interface. The module will automatically scan for installed games on the device during installation and generate an initial game list.

**Q: How do I adjust the log level?**
A: There are three methods: 1) Use the interactive menu `./action.sh` to select the log level; 2) Adjust it through the settings page in the WebUI interface; 3) Directly edit the `/data/adb/gpu_governor/log/log_level` file. Adjustments take effect immediately without needing to restart the module.

**Q: How do I use the WebUI?**
A: KernelSU/APatch users can click on this module in the root manager and select "Open WebUI". Magisk users can install the [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [MMRL](https://github.com/MMRLApp/MMRL) applications to access the module's WebUI.

**Q: How do I adjust the margin for GPU frequency calculation?**
A: Add or modify the `Margin=value` line in the `/data/gpu_freq_table.conf` file, where the value represents the margin percentage. This can also be adjusted through the configuration page in the WebUI interface. A larger margin results in higher actual frequency, better performance, but also higher power consumption.