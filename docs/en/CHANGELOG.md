# 📝 CHANGELOG

## 🚀 v2.7 → v2.8 (July 12, 2025)

### ✨ New Features

- **Show channel link during module installation** 🎉
  - Added official channel link prompt during installation, making it easier for users to get support and feedback. 📢

### 🔧 Improvements

- **Core code refactored to modular architecture** 🧩
  - Optimized core code structure for better maintainability and scalability.
- **Simplified GPU frequency scaling strategy** ⚡
  - Uses a 90% load threshold, removes complex logic, and improves frequency response efficiency.
- **Optimized thread management of the governor core process** 🤖
  - Improved thread scheduling and resource release for better runtime stability.
- **Refactored core logging system** 📒
  - Added real-time log rotation, improving log management capability.
  - Optimized log initialization process and some log display effects.

### 🐛 Bug Fixes

- **Fixed Dimensity 9000 misidentification and wrong frequency table assignment** 🔍
  - Resolved issue where Dimensity 9000 was misidentified as Dimensity 1200 and loaded the wrong frequency table.
- **Fixed frequency scaling issues for Dimensity 1x00 series** 🛠️
  - Fixed abnormal frequency scaling for Dimensity 1000/1100/1200 chips.
- **Fixed initialization script updating game count in module description** 🎮
  - Ensured the game count in the module description matches the actual number.

### 🗑️ Removals/Adjustments

- **Removed log rotation at module script startup, now handled by the governor core** 🔄
  - Log rotation moved from module script to core program for better efficiency and consistency.
- **Removed main log redirection in module script, now handled by the governor core** ➡️
  - Log redirection logic is now managed by the core code, simplifying script complexity.
- **Margin logic temporarily deprecated due to 90% load-based frequency scaling** 📴
  - Margin-related logic is suspended for now; future optimizations will be announced separately.
