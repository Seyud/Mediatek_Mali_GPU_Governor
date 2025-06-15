# 📝 CHANGELOG

## 🎯 v2.6 → v2.7 (June 15, 2025)

### ✨ New Features

#### 🎨 WebUI Interface Complete Redesign
- **SVG Vector Icon System**
  - Replaced simple emojis with exquisite SVG vector icons
  - Sun icon features new ray animations and decorative rings
  - Moon icon includes surface textures and star decorations

- **Brand New Tab-style Log Level Selector**
  - Four levels (Debug/Info/Warn/Error) each with dedicated SVG icons
  - Supports real-time preview and visual feedback

- **Multi-tab Log Viewer**
  - Separate display of main log (gpu_gov.log) and initialization log (initsvc.log)
  - Each tab equipped with dedicated icons and status indicators
  - Support for quick switching between tabs

- **Responsive Grid Layout System**
  - Interface layout adapted for different screen sizes

- **User Safety Alert System** ⚠️
  - Added important warning notification feature
  - Reminds users to adjust voltage to prevent crashes and stuttering
  - Enhanced user safety

#### 📱 Chipset Support Expansion
- **New Dimensity 720 Configuration** 🆕
  - Added `mtd720.conf` configuration file, supporting 12 frequency levels
  - Frequency range: 219MHz - 1068MHz
  - Voltage range: 45000μV - 60625μV
  - Optimized DDR setting strategy
  - **Only configuration pre-adaptation, core support awaits future versions**

### 🔧 Feature Improvements

#### 🎯 GPU Frequency Scaling Optimization
- **Warning Rate Limiter Optimization** ⏱️
  - Extended rate limiting time from 30 seconds to 60 seconds
  - Significantly reduced system false positive rate
  - Improved user experience stability

- **Log Display System Enhancement** 📋
  - Optimized log output format and readability
  - Enhanced effectiveness of debug information
  - Improved developer diagnostic efficiency

- **v2 Driver Frequency Writing Mechanism Optimization** ⚡
  - Improved reliability of device frequency writing
  - Enhanced responsiveness of frequency adjustments
  - Increased system compatibility

- **Debug System Improvement** 🔍
  - Main program added `debug` level log support
  - Enhanced usability of developer diagnostic tools

- **Documentation Maintenance Optimization** 📚
  - Removed deprecated Discord channel links from README
  - Cleaned up outdated community contact information
  - Maintained accuracy of documentation information

### 🐛 Bug Fixes

#### 🔄 Driver Compatibility Fixes
- **v1 Driver Idle Mode Handling Fix** 🛠️
  - Fixed device idle mode setting logic
  - Properly restored dynamic frequency scaling functionality
  - Ensured power management in low-load scenarios

- **Dimensity 9000 Frequency Display Fix** 🔧
  - Added DCS Policy status check and disable functionality
  - Fixed stuttering issues caused by two-digit frequencies on Dimensity 9000
  - Improved frequency scaling stability for high-end chipsets
