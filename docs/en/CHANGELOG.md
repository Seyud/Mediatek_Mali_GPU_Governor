# 📋 MediaTek Mali GPU Governor Changelog

## 🚀 v2.5 → v2.6 (2025-05-19 → 2025-06-01)

### ✨ Core Feature Additions

#### 🔧 V2 Driver Optimization Mechanism
- ⚡ **Smart Frequency Writing**: When the same frequency is detected continuously, reduce unnecessary write operations through a counter mechanism
- 🔄 **Forced Write Threshold**: Default set to 5 times, when the same frequency count reaches the threshold, force execution of write to ensure system stability

#### 🚀 Startup System Refactoring
- 🌐 **Enhanced Bilingual Support**: Initialization scripts now include complete Chinese-English bilingual support system
- 📝 **Smart Logging Functions**: Added bilingual logging that automatically selects Chinese or English output based on system language
- 🔄 **Dynamic Module Description**: Real-time update of module description status (Starting→Running→Error), providing better user feedback
- 🆔 **PID Management Mechanism**: Added process ID management to prevent duplicate startup
- 📊 **Status Description System**: Support for displaying running, stopped, error, starting and other status
- 🔧 **Module Description Updates**: Dynamic update of module information

### 🔄 Feature Changes and Optimizations

#### 🎮 Interaction Control Simplification
- ❌ **Removed Manual Game Mode Toggle**: `action.sh` script no longer supports manual enable/disable game mode functionality
- 🎯 **Menu Streamlining**: Main menu reduced from 4 options to 3 (Governor Service Control, Log Level Settings, Exit)
- 🤖 **Focus on Auto Detection**: Game mode completely relies on automatic detection of application package names in `games.conf`

#### 📚 Documentation System Expansion
- 🌍 **Complete English Documentation**: Added `docs/en/README.md` providing complete English version documentation
- 🔗 **Community Link Integration**: Added community badges at the top of documentation
- 📖 **Structured Reorganization**: Reorganized documentation content by function type to improve readability
- 🎯 **Feature Classification Optimization**: Categorized features into "Core Functions", "User Interface & Interaction", "Technical Features"

### 🛠️ Technical Improvements

#### 💻 Rust Core Code Optimization
- 🎯 **V2 Driver Write Logic**: Added smart frequency write logic
- 📊 **Counter Mechanism**: When the same frequency is detected, increment counter and force write when threshold is reached
- 🔄 **DCS Mechanism Optimization**: Improved handling logic for standby restart issues

#### 📋 Script System Enhancement
- 🌐 **Language Detection**: Initialization scripts added automatic language detection functionality
- 📝 **Enhanced Logging**: All log outputs support Chinese-English bilingual display

---
