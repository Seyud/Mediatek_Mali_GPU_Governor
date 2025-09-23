# Introduction

Dimensity GPU Governor (Mediatek Mali GPU Governor) is an advanced GPU governor designed specifically for MediaTek processors. Developed in **Rust**, the high-performance core engine intelligently monitors GPU load and dynamically adjusts frequency, achieving the best balance between gaming experience and power consumption. The module integrates a modern **WebUI management interface** and **complete game mode detection**, providing users with an excellent GPU tuning solution.

## Related Open Source Projects

**Core Source Code Repository**: [GPU-Governor-Core](https://github.com/Seyud/GPU-Governor-Core)

## Features

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
- 🔧 **Highly Customizable**: Custom GPU frequency, voltage and memory settings via configuration files
- 📱 **Wide Device Compatibility**: Supports Dimensity series MediaTek processors  
- 📝 **Professional Logging System**: Supports debug/info/warn/error four-level logging
- 🔄 **Automatic Device Adaptation**: Automatically detects device model and applies adaptive module configuration during installation

## Acknowledgments

- **Developers**: 瓦力喀 @CoolApk, rtools @CoolApk
- **Special Thanks**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github  
- **Testing & Feedback**: All members of the beta testing groups
- **Configuration Assistance**: Fiagelia @CoolApk, 忘渐 @CoolApk

## ⚠️ Warning

You may experience crashes, screen flickering, or sudden stuttering during use, which is usually caused by inappropriate frequency or voltage configurations. If screen artifacts occur frequently, it is recommended to increase the voltage corresponding to each GPU frequency level or set the DDR configuration to 999 for automatic voltage.

Reducing/limiting memory frequency can slightly reduce power consumption, but GPU performance will be severely impaired, and low memory voltage may cause crashes and reboots.