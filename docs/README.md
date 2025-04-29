# Mediatek Mali GPU Governor 🚀

## 简介 📝

Mediatek Mali GPU Governor 是一个专为联发科处理器设计的 GPU 频率调节工具，通过智能监控 GPU 负载并动态调整频率，提供更好的游戏体验和功耗平衡。

## 特性 ✨

- 🎮 **游戏模式**：自动识别游戏应用并应用优化的 GPU 频率设置
- 📊 **负载监控**：实时监控 GPU 负载并根据需求动态调整频率
- ⚡ **性能优化**：在需要时提供高性能，在空闲时降低频率节省电量
- 🔧 **高度可定制**：通过配置文件自定义 GPU 频率和电压
- 📱 **广泛兼容**：支持多种联发科处理器平台
- 🖥️ **WebUI 界面**：基于 KernelSU 的图形化管理界面，支持 Miuix 风格

## 安装要求 📋

- 已 Root 的 Android 设备
- 搭载联发科处理器（MTK）的设备
- Magisk v20.4+ 或其他支持模块的 Root 方案
- 使用 WebUI 功能需要 KernelSU, APatch 或安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone)/[MMRL](https://github.com/MMRLApp/MMRL) 应用

## 安装方法 💻

1. 在 Magisk Manager 中安装此模块
2. 重启设备
3. 模块将自动配置并启动 GPU 调速服务

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
```

- **Freq**: GPU 频率 (KHz)
- **Volt**: 电压 (μV)
- **DDR_OPP**: 内存频率档位

### 游戏列表配置

游戏列表配置文件位于 `/data/adb/gpu_governor/games.conf`，包含需要应用游戏模式的应用包名。

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

## 日志 📊

日志文件存储在 `/data/adb/gpu_governor/log/` 目录下，可用于调试和性能分析。

## 卸载方法 🗑️

通过 Magisk Manager 卸载模块，或执行 `uninstall.sh` 脚本清理配置文件。

## 支持的设备 📱

支持大多数搭载 Mali GPU 的联发科处理器，包括但不限于：
- Dimensity 系列
- Helio 系列
- MT6xxx 系列

## 致谢 🙏

- **作者**: 瓦力喀 @CoolApk
- **特别感谢**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **配置协助**: Fiagelia @CoolApk, 忘渐 @CoolApk

## 注意事项 ⚠️

- 修改 GPU 频率和电压可能会影响设备稳定性
- 不当的配置可能导致设备过热或性能问题
- 建议备份原始配置文件以便恢复

## WebUI 界面 🖥️

本模块提供了基于 KernelSU 的 WebUI 界面，方便用户直观地管理和监控 GPU 调速器。

### 访问方式

#### KernelSU 用户
1. 确保已安装 KernelSU 并启用了 WebUI 功能
2. 在 KernelSU 管理器中点击本模块，选择"打开 WebUI"

#### Magisk 用户
Magisk 用户可以通过以下方式访问 WebUI：
1. 安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 应用
2. 或使用 [MMRL](https://github.com/MMRLApp/MMRL) 应用打开模块的 WebUI

### 功能特性

- **实时状态监控**：查看模块运行状态和游戏模式状态
- **GPU 频率配置**：查看当前 GPU 频率表配置
- **游戏列表管理**：查看已配置的游戏列表
- **日志查看**：实时查看模块运行日志
- **深色模式支持**：自动适应系统深色/浅色模式
- **Miuix 风格界面**：采用 MIUI 设计风格的界面元素

### 界面预览

WebUI 提供了直观的界面，包括以下几个主要部分：

- 模块状态卡片：显示运行状态和游戏模式开关
- GPU 频率配置卡片：显示当前配置的频率、电压和内存频率档位
- 游戏列表卡片：显示已配置的游戏包名列表
- 日志卡片：显示最近的运行日志

## 常见问题 ❓

**Q: 如何确认模块正常工作？**
A: 查看 `/data/adb/gpu_governor/log/gpu_gov.log` 日志文件，确认有正常的频率调节记录。或者通过 WebUI 界面查看模块状态和日志。

**Q: 游戏模式如何工作？**
A: 当检测到 `games.conf` 中列出的应用运行时，会自动应用优化的 GPU 频率设置。

**Q: 如何添加自定义游戏到列表？**
A: 编辑 `/data/adb/gpu_governor/games.conf` 文件，添加游戏的包名即可。

**Q: 如何使用 WebUI？**
A: KernelSU, APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [MMRL](https://github.com/MMRLApp/MMRL) 应用来访问模块的 WebUI。
