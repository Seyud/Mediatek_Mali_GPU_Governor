# User Guide

## WebUI Interface

This module provides a modern WebUI interface based on KernelSU API, designed in Miuix style, providing users with intuitive GPU governor management and monitoring experience. WebUI supports configuration hot reload, real-time log viewing, games list and frequency table visual editing, with all changes taking effect immediately.

### Features

#### WebUI Functions

- **Real-time Status Monitoring**: View running status, current mode and version information
- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supports adjusting frequency, voltage and memory levels
- **Custom Configuration**: View and edit current custom configuration, supports global configuration and mode configuration
- **Games List Management**: View and edit configured games list, supports adding/removing games and selecting corresponding modes
- **Log Viewing**: Real-time viewing of module running logs, supports selecting different log files and log levels

#### Interface Features

- **Dark Mode Support**: Automatically adapts to system dark/light mode, can also be manually switched
- **Multi-language Support**: Supports Chinese and English interface, automatically detects system language settings
- **Voltage Adjuster**: Supports using rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)
- **Real-time Updates**: Detects game mode status changes every second and updates interface
- **Toast Notifications**: Operation feedback and status notifications

### Interface Layout

WebUI uses multi-page layout, with page switching through bottom navigation bar.

### How to Access WebUI

- **KernelSU/APatch users**: Click this module in root manager, select "Open WebUI"
- **Magisk users**: Need to install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [SSU](https://ssu.oom-wg.dev/base/install) app first

## Interactive Control Menu

The module provides `action.sh` script, supporting interactive operations through volume keys:

### Script Functions

- **Control Governor Service**: Start or stop GPU governor service
- **Set Log Level**: Select debug, info, warn or error level
- **View Module Status**: Display module version, running status and other information

### Operation Method

- Volume Up Key: Select next option (increment selection in menu)
- Volume Down Key: Confirm selection

The script automatically detects current system language and displays corresponding Chinese or English interface.

### Module Files

- Log level setting: `/data/adb/gpu_governor/log/log_level`
- Games list configuration: `/data/adb/gpu_governor/game/games.toml`
- Process ID management: `/data/adb/gpu_governor/gpu_governor.pid`

## Logging System

Log files are stored in `/data/adb/gpu_governor/log/` directory, mainly including:

- **gpu_gov.log**: Main log file, managed by Rust core uniformly, records GPU governor running status
- **initsvc.log**: Initialization log, records module startup process and script initialization information

Log content can be viewed through WebUI interface, or directly through file manager.

### Log Management

Module's main logs are completely implemented by Rust core uniformly, including:

- Log file creation and writing
- Automatic log rotation and size control
- Real-time monitoring and response to log levels

## Game Mode

### Automatic Game Detection

The module automatically detects game applications configured in `games.toml`, and when games are detected running in foreground, it automatically applies game mode optimization strategies.

### Games List Management

- Module automatically scans installed games on device during installation and generates initial games list
- Can add/remove games through WebUI interface
- Can specify different performance modes for each game
- Games list supports hot reload, changes take effect immediately after modification

### Performance Optimization

Game Mode can apply the following optimizations:

- Use aggressive up-frequency strategy
- Enable special memory optimization for games
- Adjust sampling interval for better responsiveness
- Apply corresponding performance modes based on game requirements