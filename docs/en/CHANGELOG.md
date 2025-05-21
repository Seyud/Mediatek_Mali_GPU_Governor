# Dimensity GPU Governor Changelog 📝

## v2.4 → v2.5 (2025.05.19) 🚀

### 🌟 New Features

- 🔄 **Game Mode Real-time Updates**: Detects game mode status changes every second and automatically updates the interface, improving user experience
- 🌐 **Installation Script Multi-language Support**: Installation script now supports bilingual display in Chinese and English, automatically switching based on system language
- 📱 **Device Compatibility Description**: Clearly marks support for MediaTek processors with Mali GPU, including the Dimensity series
- 🔧 **Configuration File Protection Mechanism**: Checks if the game list file already exists during installation, preserving user customizations by not overwriting existing files
- 📊 **Log Rotation Mechanism Optimization**: Detailed explanation of the log rotation mechanism, automatically rotating when log files reach 80% of the maximum limit
- 🔋 **DCS Mechanism Optimization**: Added DCS mechanism, optimizing standby restart issues and improving system stability

### 🛠️ Interface Improvements

- 🎨 **WebUI Interface Optimization**: Improved Miuix style design, enhancing visual experience
- 🌙 **Dark Mode Enhancement**: Optimized display of interface elements in dark mode
- 📱 **Mobile Interaction Optimization**: Improved touch operation experience, especially for voltage adjustment functionality
- 🔤 **Multi-language Support Enhancement**: Improved Chinese-English translation, increasing language switching fluidity

### 🐛 Bug Fixes

- 🔍 **Foreground Application Detection Optimization**: Improved foreground application package name extraction method, increasing detection accuracy
- 🔄 **Configuration File Loading Logic Optimization**: Fixed issues where configuration files couldn't be correctly loaded in specific situations
- 📝 **Logging Improvements**: Added more detailed debugging information for easier problem diagnosis
- 🔧 **Installation Script Robustness Enhancement**: Improved error handling, increasing installation success rate
- 🔌 **Standby Restart Issue Fixed**: Resolved device restart issues after standby on some devices by monitoring device charging status through DCS mechanism

### 📚 Documentation Updates

- 📖 **README Documentation Improvement**: Updated installation requirements and supported device descriptions
- 🔍 **FAQ Supplements**: Added more frequently asked questions and answers
- 📊 **Load Threshold Settings Description**: Detailed explanation of load threshold settings in game mode
- 📝 **Logging System Description Optimization**: Improved explanation of log levels and rotation mechanisms

### 📋 Other Changes

- 🔧 **Internal Code Structure Optimization**: Improved code maintainability and performance
- 🚀 **Startup Speed Optimization**: Reduced startup time, improving response speed