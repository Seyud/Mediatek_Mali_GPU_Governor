# 天玑 GPU 调速器 🚀

## 简介 📝

天玑 GPU 调速器（Mediatek Mali GPU Governor）是一个专为联发科处理器设计的 GPU 频率调节工具，通过智能监控 GPU 负载并动态调整频率，提供更好的游戏体验和功耗平衡。基于 Rust 语言开发，具有高效、稳定的特点。

## 特性 ✨

- 🎮 **游戏模式**：自动识别游戏应用并应用优化的 GPU 频率设置
- 📊 **负载监控**：实时监控 GPU 负载并根据需求动态调整频率
- ⚡ **性能优化**：在需要时提供高性能，在空闲时降低频率节省电量
- 🔧 **高度可定制**：通过配置文件自定义 GPU 频率和电压
- 📱 **广泛兼容**：支持多种联发科处理器平台
- 🖥️ **WebUI 界面**：基于 KernelSU 的图形化管理界面，支持深色/浅色模式，使用Miuix风格
- 📝 **多级日志**：支持 debug、info、warn、error 四个日志等级，方便调试
- 🔄 **多级负载阈值**：支持极低、低、中、高、极高五个负载区域的智能调频

## 安装要求 📋

- 已 Root 的 Android 设备
- 搭载联发科处理器（MTK）的设备
- Magisk v20.4+ 或其他支持模块的 Root 方案
- 使用 WebUI 功能需要 KernelSU, APatch 或安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone)/[MMRL](https://github.com/MMRLApp/MMRL) 应用

## 安装方法 💻

1. 在 Magisk Manager 中安装此模块
2. 重启设备
3. 模块将自动配置并启动 GPU 调速服务
4. 安装完成后，模块会自动识别设备型号并应用适合的配置

## 配置文件 ⚙️

### GPU 频率表配置

配置文件位于 `/data/gpu_freq_table.conf`，格式如下：

```
# Freq Volt DDR_OPP
350000 55000 999
451000 57500 999
512000 58125 999
614000 60000 2
715000 61875 1
836000 66875 0
# 可选：设置频率计算余量
Margin=10
```

- **Freq**: GPU 频率 (KHz)
- **Volt**: 电压 (μV)
- **DDR_OPP**: 内存频率档位（999表示不调整，0-3表示不同档位）
- **Margin**: 频率计算余量百分比（可选，默认为10%）

### 游戏列表配置

游戏列表配置文件位于 `/data/adb/gpu_governor/games.conf`，包含需要应用游戏模式的应用包名。模块会在安装时自动扫描设备上已安装的游戏并生成此配置文件。

### 游戏模式切换

模块提供了 `action.sh` 脚本用于手动切换游戏模式状态：

```
# 用法: ./action.sh [on|off]
# 如果不提供参数，则切换当前状态
```

- **开启游戏模式**: `./action.sh on`
- **关闭游戏模式**: `./action.sh off`
- **切换当前状态**: `./action.sh`

游戏模式状态保存在 `/data/adb/gpu_governor/game_mode` 文件中，值为 `1` 表示开启，`0` 表示关闭。

### 日志等级设置

模块支持设置不同的日志等级，可以通过以下命令设置：

```
# 用法: ./action.sh log_level [debug|info|warn|error]
```

- **查看当前日志等级**: `./action.sh log_level`
- **设置为调试级别**: `./action.sh log_level debug`
- **设置为信息级别**: `./action.sh log_level info`
- **设置为警告级别**: `./action.sh log_level warn`
- **设置为错误级别**: `./action.sh log_level error`

日志等级设置保存在 `/data/adb/gpu_governor/log_level` 文件中，默认为 `info` 级别。

### 负载阈值设置

模块内部实现了多级负载阈值，用于智能调整GPU频率：

- **极低负载**: 默认10%以下，降低频率以节省电量
- **低负载**: 默认10-30%，适当降低频率
- **中等负载**: 默认30-70%，保持平衡的频率
- **高负载**: 默认70-90%，提高频率以提供更好性能
- **极高负载**: 默认90%以上，使用最高频率

## 日志 📊

日志文件存储在 `/data/adb/gpu_governor/log/` 目录下，主要包括：

- **gpu_gov.log**: 主日志文件，记录 GPU 调速器的运行状态和频率调整记录
- **initsvc.log**: 初始化服务日志，记录模块启动过程

日志文件大小限制为 5MB，超过限制会自动轮转，防止占用过多存储空间。日志内容可以通过WebUI界面查看，也可以通过文件管理器直接查看。

## 卸载方法 🗑️

通过 Magisk Manager 卸载模块，或执行 `uninstall.sh` 脚本清理配置文件。卸载时会自动删除以下文件：

- `/data/gpu_freq_table.conf`
- `/data/adb/gpu_governor/` 目录及其所有内容

## 支持的设备 📱

支持大多数搭载 Mali GPU 的联发科处理器，包括但不限于：
- Dimensity 系列（如 D700/D800/D900/D1000/D8000/D9000 等）
- Helio 系列
- MT6xxx 系列

模块会自动检测设备型号并应用适合的配置。如果您的设备不在支持列表中，模块会使用默认配置。

## 致谢 🙏

- **作者**: 瓦力喀 @CoolApk, rtools @CoolApk
- **特别感谢**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **测试反馈**: 内测群全体群友
- **配置协助**: Fiagelia @CoolApk, 忘渐 @CoolApk

## 注意事项 ⚠️

- 修改 GPU 频率和电压可能会影响设备稳定性
- 不当的配置可能导致设备过热或性能问题
- 建议备份原始配置文件以便恢复
- 如遇到问题，可以查看日志文件进行排查

## WebUI 界面 🖥️

本模块提供了基于 KernelSU 的 WebUI 界面，方便用户直观地管理和监控 GPU 调速器。

### 访问方式

#### KernelSU/APatch 用户
1. 确保已安装 KernelSU/APatch 并启用了 WebUI 功能
2. 在 KernelSU/APatch 管理器中点击本模块，选择"打开 WebUI"

#### Magisk 用户
Magisk 用户可以通过以下方式访问 WebUI：
1. 安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 应用
2. 或使用 [MMRL](https://github.com/MMRLApp/MMRL) 应用打开模块的 WebUI

### 功能特性

- **实时状态监控**：查看模块运行状态、版本信息和游戏模式状态
- **GPU 频率配置**：查看和编辑当前 GPU 频率表配置，支持调整频率、电压和内存档位
- **游戏列表管理**：查看和编辑已配置的游戏列表
- **日志查看**：实时查看模块运行日志，支持选择不同日志文件
- **深色模式支持**：自动适应系统深色/浅色模式，也可手动切换
- **日志等级设置**：支持在WebUI中直接设置日志等级

### 界面布局

WebUI 提供了多页面布局，包括以下几个主要部分：

- **状态页面**：显示模块运行状态、版本信息和游戏模式开关
- **配置页面**：显示和编辑当前配置的频率、电压和内存频率档位，以及管理游戏列表
- **日志页面**：显示最近的运行日志，支持选择不同日志文件
- **设置页面**：提供主题设置和日志等级设置等选项

## 常见问题 ❓

**Q: 如何确认模块正常工作？**
A: 查看 `/data/adb/gpu_governor/log/gpu_gov.log` 日志文件，确认有正常的频率调节记录。或者通过 WebUI 界面查看模块状态和日志。

**Q: 游戏模式如何工作？**
A: 当检测到 `games.conf` 中列出的应用运行时，会自动应用优化的 GPU 频率设置。游戏模式下会使用更积极的升频策略，提供更好的游戏体验。

**Q: 如何添加自定义游戏到列表？**
A: 编辑 `/data/adb/gpu_governor/games.conf` 文件，添加游戏的包名即可。或者通过 WebUI 界面的游戏列表页面进行添加。

**Q: 如何调整日志等级？**
A: 使用命令 `./action.sh log_level [debug|info|warn|error]` 或通过 WebUI 界面的设置页面进行调整。调整后会立即生效，无需重启模块。

**Q: 如何使用 WebUI？**
A: KernelSU/APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [MMRL](https://github.com/MMRLApp/MMRL) 应用来访问模块的 WebUI。

**Q: 模块如何检测前台应用？**
A: 模块使用Android系统的dumpsys命令监控前台应用，支持Android 10及以上系统的前台应用检测方式。
