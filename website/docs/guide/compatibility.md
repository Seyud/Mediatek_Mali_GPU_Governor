# 设备兼容性

@@include(../_includes/requirements-zh.md)

## 支持的设备

支持大多数搭载 Mali GPU 的联发科处理器：

- Dimensity 系列（如 D1x00/D6080/D7300/D8x00/D9x00，0 ≤ x ≤ 4）

模块会自动检测设备型号并应用适合的配置。
如果您的设备不在适配列表中，模块会使用默认配置。

### 预设配置文件支持

模块为以下处理器系列提供了专门的预设配置文件：

- `config/mtd1000.toml` - Dimensity 1000 系列
- `config/mtd1100.toml` - Dimensity 1100 系列
- `config/mtd1200.toml` - Dimensity 1200 系列
- `config/mtd6080.toml` - Dimensity 6080 系列
- `config/mtd7300.toml` - Dimensity 7300 系列
- `config/mtd8100.toml` - Dimensity 8100 系列
- `config/mtd8200.toml` - Dimensity 8200 系列
- `config/mtd9000.toml` - Dimensity 9000 系列

不同处理器系列具有不同的频率范围和电压配置，模块会根据设备型号自动选择匹配的频率表配置。

## 技术兼容性

### GPUFreq 驱动支持

- **精确频率控制**：完全支持 GPUFreq v1/v2 驱动，自动检测驱动版本并适配
- **智能频率写入**：V2 驱动优化机制，减少不必要的频率写入操作
- **电压与内存联动**：支持 DDR 频率档位调节，电压与频率精确对应

### Root 方案兼容性

- **Magisk**：v20.4+ 版本支持
- **KernelSU**：完全支持，包括 WebUI 功能
- **APatch**：完全支持，包括 WebUI 功能

## 自动设备适配

### 适配机制

- **自动设备适配**：安装时自动检测设备型号并应用适配模块配置
- **智能配置选择**：根据检测结果应用对应处理器的优化配置
- **默认配置兼容**：未适配设备自动使用通用默认配置

### 游戏列表自动生成

游戏列表配置文件位于 `/data/adb/gpu_governor/game/games.toml`，包含游戏包名和对应模式。模块会在安装时自动扫描设备上已安装的游戏并生成此配置文件。

**注意**：安装脚本会检查游戏列表文件是否已存在，如果存在则不会覆盖，以保留用户的游戏偏好。

## 兼容性验证

### 验证方法

安装模块后可通过以下方式验证兼容性：

**Q: 如何确认模块正常工作？**  
A: @@include(../_includes/log-check-zh.md)

**Q: 如何使用 WebUI？**  
A: KernelSU/APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。  
Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [SSU](https://ssu.oom-wg.dev/base/install) 应用来访问模块的 WebUI。