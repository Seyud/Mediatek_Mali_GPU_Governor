# 📝 CHANGELOG

## ⬆️ v2.10.3 → v2.11.0 (November 30, 2025)

> ⚠️ **Important Notice**
> 
> In the frequency tables of processors that do not support voltage reduction, the voltage field is only a placeholder for alignment with other frequency tables, and the actual voltage reduction function does not take effect.

### ✨ New Features

- **Add Dimensity 6080 frequency table** 📱
  - Added support for Dimensity 6080 chip, expanding device compatibility.
- **Add Dimensity 7300 frequency table** 📱
  - Added support for Dimensity 7300 chip, further expanding device compatibility.
- **WebUI add WebUI-X API support** 🌐
  - Game list supports fetching app icons and names via WebUI-X API, enhancing user experience.
- **WebUI implement multi-level app information retrieval strategy** 🔍
  - Priority use of KernelSU API for app information retrieval, improving accuracy and efficiency.

### 🔧 Improvements

- **Optimize path existence check during initialization** ⚡
  - Improved path checking logic during initialization, enhancing startup efficiency.
- **Optimize file judgment logic** 📁
  - Improved file existence and type judgment logic, enhancing system stability.
- **Format code** 💻
  - Unified code formatting, improving code readability and maintainability.
- **Optimize configuration monitoring and mode writing logic** 🔄
  - Improved configuration monitoring mechanism and mode writing process, enhancing system response speed.
- **Refactor event handling and enhance file monitoring functionality** 📊
  - Redesigned event handling system, enhanced file monitoring capabilities, improving system reliability.
- **Update core dependencies** 📚
  - Fully upgraded core dependency libraries to ensure security and performance.
- **Optimize WebUI styles** 🎨
  - Improved WebUI visual effects, enhancing user experience.
- **Optimize WebUI performance** ⚡
  - Enhanced WebUI loading speed and response performance.
- **Add frosted glass effect to WebUI navigation bar** 🔮
  - Enhanced WebUI visual hierarchy and modern feel.
- **Adjust margin values for performance mode and extreme mode** ⚙️
  - Optimized margin settings for different modes, improving performance.
- **Refactor WebUI toml file parsing** 🔧
  - Improved WebUI's toml file parsing logic, enhancing configuration processing efficiency.
- **Improve action.sh menu interaction interface and navigation logic** 📋
  - Optimized command line menu interaction experience and navigation flow, enhancing user operation convenience.

### 🐛 Bug Fixes

- **Fix handling logic when foreground app package name doesn't change** 🎮
  - Resolved abnormal handling when foreground app package name remains unchanged, ensuring normal app detection.
- **Fix global mode recovery logic when switching from game mode** 🔄
  - Resolved recovery issue when switching from game mode to global mode, ensuring normal mode switching.
- **Fix some processor identification anomalies** 🔧
  - Resolved identification errors for some processor models, improving device compatibility.

## ⬆️ v2.10.0 → v2.10.3 (October 17, 2025)

### ⚠️ Experimental Adaptation Notice

- **Dimensity 8300/9200/9300/9400 Frequency Tables** 📱
  - Experimental chips do not have voltage reduction nodes, so voltage reduction functionality is not effective. The voltage values in their frequency tables are only for alignment with other frequency tables.

### ✨ New Features

- **Add Process Conflict Detection** 🔍
  - Added process conflict detection mechanism to improve system stability.
- **Add Documentation Cleanup Function** 🧹
  - Provides documentation cleanup, automatically selecting required language documentation.
- **Add Multi-language Support for Module Information** 🌍
  - Module information now supports multi-language display, improving internationalization experience.
- **(Experimental addition of Dimensity 8300 frequency table)** 📱
  - Added experimental support for Dimensity 8300 chip, expanding device compatibility.
- **(Experimental addition of Dimensity 9200/9300/9400 frequency tables)** 📱
  - Added experimental support for Dimensity 9200/9300/9400 chips, further expanding device compatibility.

### 🔧 Improvements

- **Optimize Mode Switching Loading** ⚡
  - Improved loading speed and smoothness during mode switching.
- **Optimize DDR Level Write Cache** 💾
  - Improved cache write mechanism for DDR frequency levels, increasing response speed.
- **Optimize V1 Driver Frequency Writing** 🔧
  - Optimized frequency writing method for V1 drivers, improving compatibility.
- **Complete Refactor of Module Scripts** 🔄
  - Comprehensive refactor of module scripts, improving code quality and execution efficiency.
- **Functional Programming Refactor of Module Scripts** 💻
  - Adopted functional programming concepts to refactor module scripts, improving code maintainability.
- **Optimize Module Status Display** 📊
  - Improved display method of module status information, providing clearer status feedback.
- **Refactor Documentation into Multiple Files** 📚
  - Split documentation into multiple files, improving documentation management and reading experience.
- **Optimize WebUI Configuration Writing Method** 🌐
  - Improved WebUI's configuration writing mechanism, enhancing user experience and data consistency.

### 🐛 Bug Fixes

- **Fix Log Rotation** 📝
  - Resolved issues in the log rotation mechanism to ensure normal operation of the logging system.
- **Fix Game List Mode Switching Configuration Hot Reload** 🎮
  - Fixed the issue where configuration could not be hot reloaded when switching modes in the game list.
- **Fix Issue with Frequency Not Being Reduced in Idle State** 😴
  - Resolved the issue where frequency might not be correctly reduced when device is idle, optimizing power management.

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
