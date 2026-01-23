**English** | [简体中文](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/README.md)

# Mediatek Mali GPU Governor 🚀

<img src="https://seyud.github.io/Mediatek_Mali_GPU_Governor/logo.png" style="width: 96px;" alt="logo">

Mediatek Mali GPU Governor is an advanced GPU governor designed specifically for MediaTek processors. Developed in **Rust**, the high-performance core engine intelligently monitors GPU load and dynamically adjusts frequency, achieving the best balance between gaming experience and power consumption. The module integrates a modern **WebUI management interface** and **complete game mode detection**, providing users with an excellent GPU tuning solution.

[![Version](https://img.shields.io/github/v/release/Seyud/Mediatek_Mali_GPU_Governor?logo=github)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases/latest)
[![GitHub Downloads](https://img.shields.io/github/downloads/Seyud/Mediatek_Mali_GPU_Governor/total?logo=github&logoColor=green)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases)
[![Language](https://img.shields.io/badge/language-Rust-orange?logo=rust&logoColor=orange)](https://www.rust-lang.org/)
[![Telegram](https://img.shields.io/badge/channel-Telegram-2CA5E0?logo=telegram&logoColor=87CEEB)](https://t.me/Mediatek_Mali_GPU_Governor)

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

## Documentation Navigation 📚

- [Installation Requirements](installation.md) - Device requirements and WebUI requirements
- [Configuration Files](configuration.md) - Custom configuration, GPU frequency table, game list, and interactive control menu
- [Logging System](logging.md) - Log file description and log management
- [Supported Devices](supported-devices.md) - Compatible device list
- [WebUI Interface](webui.md) - WebUI features and UI layout
- [FAQ](faq.md) - Frequently asked questions

## Acknowledgements 🙏

- **Developers**: Seyud @GitHub, Tools-cx-app @GitHub

- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @GitHub

- **Testing Feedback**: All members of the internal testing group

- **Configuration Assistance**: Fiagelia @CoolApk, Wangjian @CoolApk

## Notes ⚠️

- Modifying GPU frequency and voltage may affect device stability

- Improper configuration may cause device performance or stability issues

- If problems occur, you can check the log files for troubleshooting
