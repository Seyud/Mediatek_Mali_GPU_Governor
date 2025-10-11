# WebUI Interface 🖥️

This module provides a modern WebUI interface based on KernelSU API, designed in Miuix style, providing users with an intuitive GPU governor management and monitoring experience.
WebUI supports configuration file hot-reload, real-time log viewing, visual editing of game lists and frequency tables, with all changes taking effect immediately.

## Features

### WebUI Features

- **Real-time Status Monitoring**: View running status, current mode, and version information

- **GPU Frequency Configuration**: View and edit current GPU frequency table configuration, supporting adjustment of frequency, voltage, and memory levels

- **Custom Configuration**: View and edit current custom configuration, supporting global configuration and mode configuration

- **Game List Management**: View and edit configured game list, supporting adding/removing games and selecting corresponding modes

- **Log Viewing**: Real-time viewing of module running logs, supporting selection of different log files and log levels

### UI Features

- **Dark Mode Support**: Automatically adapts to system dark/light mode, can also be manually switched

- **Multi-language Support**: Supports Chinese and English interfaces, automatically detects system language settings

- **Voltage Adjuster**: Supports using rotary selector for voltage adjustment, long press for continuous adjustment (±625 units each time)

- **Real-time Updates**: Detects game mode status changes every second and updates the interface

- **Toast Notifications**: Operation feedback and status tips

## UI Layout

WebUI uses a multi-page layout, switching pages through the bottom navigation bar.
