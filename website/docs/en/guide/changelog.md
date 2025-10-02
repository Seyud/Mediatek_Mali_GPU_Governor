---
layout: doc
---

# 📝 CHANGELOG

## 🚀 v2.9.0 → v2.10.0 (October 3, 2025)

> ⚠️ **Important Notice**
>
> This update contains major architectural changes, it is recommended to backup configurations and perform a fresh installation.

### ✨ New Features

- **Open source core repository** 🔓
  - GPU Governor core code is now fully open source, community contributions welcome.
- **Add VitePress-based official website** 🌐
  - Brand new documentation website built with VitePress, providing more comprehensive documentation and usage guides.
- **Dynamically set OTA repository based on language environment** 🌍
  - Intelligently recognizes system language and automatically switches to corresponding update repository.

### 🔧 Improvements

- **Refactor GPU frequency scaling algorithm to CPFS algorithm model** ⚡
  - Adopts brand new CPFS (Continuous Proportional Frequency Scaling) algorithm, improving frequency scaling precision and efficiency.
- **Optimize precise mode process occupancy** 🎯
  - Significantly reduces system resource usage in precise mode.
- **Optimize custom configuration hot reload** 🔄
  - Configuration changes take effect in real-time without restart.
- **Optimize multi-threading naming** 🧵
  - Standardizes thread naming for easier debugging and monitoring.
- **Optimize invalid frequency level voltage application** ⚡
  - Uses closest frequency voltage values to avoid invalid adjustments.
- **Optimize module script paths** 📂
  - Refactors script path definitions to improve module loading efficiency.
- **Streamline module scripts** 🧹
  - Removes redundant code to improve execution efficiency.
- **Refactor WebUI structure and migrate to TypeScript** 💻
  - Full TypeScript migration to improve code maintainability.
- **Migrate from deprecated mod.rs to new module declaration convention** 📦
  - Follows latest Rust specifications, updates module declaration methods.
- **Update Rust edition from 2021 to 2024** 🦀
  - Adopts latest Rust version features.
- **Update project dependencies** 📚
  - Fully upgrades dependency libraries to ensure security and performance.
- **Optimize log display** 📝
  - Improves log format and readability.
- **Optimize debug log level log rotation mechanism** 🔄
  - Refactors debug log rotation strategy to improve performance.

### 🐛 Bug Fixes

- **Fix WebUI partial internationalization support** 🌏
  - Improves multi-language support and fixes display anomalies.

### 🗑️ Removals/Adjustments

- **Remove frequency reduction counter** ❌
  - Removes outdated frequency reduction mechanism to simplify frequency scaling logic.
- **Remove minimal threshold** 🧹
  - Cleans up no longer used minimal threshold configurations.
- **Streamline core useless code** ✂️
  - Deep cleans redundant code to improve overall performance.

## 🚀 v2.8.0 → v2.9.0 (August 3, 2025)

> ⚠️ **Important Notice**
>
> Due to significant configuration file changes, it is recommended to backup old configuration files, uninstall the module, reboot, and then install.

### ✨ New Features

- **Add custom configuration feature** ⚙️
  - Users can now customize module behavior, providing more personalized options. Details of custom configuration can be found in the module docs folder.
- **Add numerous adjustable configuration items** 🛠️
  - Added a large number of configurable parameters, allowing users to control module functions more precisely.
- **Separate Margin configuration item from frequency table to custom configuration** 📊
  - Margin configuration is now independent of the frequency table, and users can adjust it separately to improve configuration flexibility.

### 🔧 Improvements

- **Optimize welcome message** 👋
  - Improved the display effect of the welcome message during module installation and startup.
- **Optimize log rotation at startup** 📒
  - Improved the efficiency and stability of log rotation at startup.
- **Refactor log rotation function** 🔄
  - Refactored the log rotation mechanism to improve code quality and maintainability.
- **Refactor game detection** 🎮
  - Redesigned game detection logic to improve accuracy.
- **Remove game mode file, add current mode file** 📄
  - Simplified mode management by removing the game mode file and adding a current mode file for unified management.
- **Optimize module scripts** 🧠
  - Optimized module scripts to improve execution efficiency and stability.
- **Refactor game list** 🕹️
  - Redesigned the game list management mechanism to improve maintainability and scalability.
- **Refactor frequency table** 📈
  - Refactored the frequency table structure to optimize data management and access efficiency.
- **Refactor WebUI modular architecture** 🌐
  - The WebUI part has been refactored into a modular architecture to improve code structure and maintainability.

### 🐛 Bug Fixes

- **Fixed some known issues** 🛠️
  - Resolved potential abnormal situations in specific scenarios.

### 🗑️ Removals/Adjustments

- **Adjust configuration file structure** 📁
  - Reorganized the configuration file structure to make it clearer and easier to manage.
