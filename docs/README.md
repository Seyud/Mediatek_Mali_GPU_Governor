# 天玑 GPU 调速器 🚀

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/Mediatek_Mali_GPU_Governor)
[![Version](https://img.shields.io/badge/Version-v2.7-brightgreen)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor)
[![Language](https://img.shields.io/badge/Language-Rust-orange)](https://www.rust-lang.org/)
[![QQ群](https://img.shields.io/badge/QQ群-719872309-12B7F5?logo=tencentqq&logoColor=white)](https://qun.qq.com/universal-share/share?ac=1&authKey=zwOHClW5YTIZobOTsqvF6lBaACPvS7%2F2Y0s%2FpQadAMss5d2nxcr46fmsm%2FFreVjt&busi_data=eyJncm91cENvZGUiOiI3MTk4NzIzMDkiLCJ0b2tlbiI6IjhQNUhYM1M4NUs4bFVwQmNsODRrUU1Xc0phR3dra1RUYnE0S0tMVFNzV3JUU2s3elgvSFRyUXJQdWtEQ1NVYSsiLCJ1aW4iOiIxMTA1NzgzMDMzIn0%3D&data=VgJU9DuiAPqB3ocg4Zlh8UShvQmDEgEfH4wvqCVXWOD8qcBSzYDPQuwUKVgLOIzZ-CWhtV69fyTHD4Q0GqWWKw&svctype=4&tempid=h5_group_info)

## 简介 📝
**简体中文** | [English](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/en/README.md)

天玑 GPU 调速器（Mediatek Mali GPU Governor）是一个专为联发科处理器设计的先进 GPU 调速器。采用 **Rust 语言** 开发的高性能核心引擎，通过智能监控 GPU 负载并动态调整频率，在游戏体验和功耗平衡之间达到最佳平衡。模块集成了现代化的 **WebUI 管理界面**、**多级负载阈值系统**、**自适应调频算法** 和 **完整的游戏模式检测**，为用户提供专业级的 GPU 调速解决方案。

## 特性 ✨

### 核心功能
- 🎮 **智能游戏模式**：自动检测 `games.conf` 中配置的游戏应用，应用性能优化的 GPU 频率策略
- 📊 **实时负载监控**：基于 Rust 高性能实现，实时监控 GPU 负载
- ⚡ **多级负载阈值**：支持极低(5-10%)、低(20-30%)、中(60-70%)、高(85-90%)、极高(90%+)五个负载区域
- 🔄 **自适应调频算法**：游戏模式使用激进升频策略，普通模式使用节能降频策略
- 🎯 **精确频率控制**：完全支持 GPUFreq v1/v2 驱动，自动检测驱动版本并适配
- 🧠 **负载趋势分析**：基于历史负载数据分析趋势，预测性调整频率
- ⚙️ **智能频率写入**：V2 驱动优化机制，减少不必要的频率写入操作
- 🎛️ **电压与内存联动**：支持 DDR 频率档位调节，电压与频率精确对应

### 用户界面与交互
- 🖥️ **现代化 WebUI**：基于 KernelSU API 的图形化管理界面，使用 Miuix 风格设计
- 🌓 **智能主题系统**：支持深色/浅色/自动模式，自动适应系统设置
- 🌐 **完整多语言支持**：支持中文和英文界面，自动检测系统语言设置
- 📊 **可视化配置编辑**：支持通过 WebUI 直接编辑频率表、电压和游戏列表
- 🔧 **交互式控制脚本**：提供 `action.sh` 音量键控制脚本，支持服务管理和日志等级设置

### 技术特性
- 🦀 **Rust 核心引擎与多线程监控**：使用 Rust 语言开发，保证内存安全、零成本抽象和极致性能。主程序采用多线程架构，分别负责GPU负载监控、前台应用监控、配置文件热更新、游戏模式监控、日志等级监控等，确保调速器实时响应系统状态变化。
- 🔧 **高度可定制化**：通过配置文件自定义 GPU 频率、电压和内存频率档位
- 📱 **广泛设备兼容**：支持 Dimensity、Helio、MT6xxx 等多系列联发科处理器
- 📝 **专业日志系统**：支持 debug/info/warn/error 四级日志
- 🔄 **自动设备适配**：安装时自动检测设备型号并应用最佳配置文件
- ⚡ **滞后与去抖动**：实现频率调整的滞后阈值和去抖动机制，避免频繁跳频。默认采用“超简化90%阈值策略”，即负载高于90%自动升频，低于90%自动降频，用户可通过配置文件和WebUI自定义更细致的多级阈值。
- 🎯 **余量调节系统**：支持 0-100% 的频率计算余量调节，平衡性能与功耗

## 安装要求 📋

### 设备要求
- 已 Root 的 Android 设备
- 搭载联发科处理器（MTK）的设备，支持 Mali GPU
- 支持 GPUFreq v1 或 v2 驱动的设备
- Magisk v20.4+ 或 KernelSU 或 APatch 等支持模块的 Root 方案

### WebUI 功能要求
- 使用 WebUI 功能需要以下任一环境：
  - **KernelSU/APatch 用户**：直接在管理器中点击模块的"打开 WebUI"功能
  - **Magisk 用户**：需要安装以下应用之一
    - [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) - 独立的 WebUI 应用
    - [MMRL](https://github.com/MMRLApp/MMRL) - 模块管理器应用

## 配置文件 ⚙️

### GPU 频率表配置

主配置文件位于 `/data/gpu_freq_table.conf`，模块会根据设备型号自动选择合适的配置文件：

```
# Margin: 调整GPU频率计算的余量百分比
Margin=5
# Freq Volt DDR_OPP
218000 45000 999
280000 46875 999
350000 48750 999
431000 49375 999
471000 50625 999
532000 51875 999
573000 53125 2
634000 55000 1
685000 56875 1
755000 59375 0
853000 60625 0
```

**配置参数说明**：
- **Freq**: GPU 频率 (KHz)
- **Volt**: 电压 (μV)
- **DDR_OPP**: 内存频率档位（999表示不调整，0-3表示不同档位）
- **Margin**: 频率计算余量百分比（可通过 WebUI 或直接编辑配置文件调整）

**预设配置文件**：
- `config/mtd720.conf` - Dimensity 720 系列
- `config/mtd1000.conf` - Dimensity 1000 系列
- `config/mtd1100.conf` - Dimensity 1100 系列
- `config/mtd1200.conf` - Dimensity 1200 系列
- `config/mtd8100.conf` - Dimensity 8100 系列
- `config/mtd8200.conf` - Dimensity 8200 系列
- `config/mtd9000.conf` - Dimensity 9000 系列

### 游戏列表配置

游戏列表配置文件位于 `/data/adb/gpu_governor/game/games.conf`，包含需要应用游戏模式的应用包名。模块会在安装时自动扫描设备上已安装的游戏并生成此配置文件。

**注意**：安装脚本会检查游戏列表文件是否已存在，如果存在则不会覆盖，以保留用户的自定义设置。

### 交互式控制菜单

模块提供了 `action.sh` 脚本，支持通过音量键进行交互式操作：

**脚本功能**：
- **控制调速器服务**：启动或停止 GPU 调速器服务
- **设置日志等级**：选择 debug、info、warn 或 error 级别
- **查看模块状态**：显示模块版本、运行状态等信息
- **日志管理**：自动日志轮转，防止日志文件过大

**重要变更**：从 v2.7 版本开始，`action.sh` 脚本不再支持手动游戏模式切换功能。游戏模式完全依赖自动检测 `games.conf` 中配置的应用包名。

**操作方式**：
- 音量上键：向上选择选项
- 音量下键：向下选择选项
- 电源键：确认选择

脚本会自动检测当前系统语言，并显示相应的中文或英文界面。

**模块文件**：
- 游戏模式状态：`/data/adb/gpu_governor/game/game_mode`（1=开启，0=关闭）
- 日志等级设置：`/data/adb/gpu_governor/log/log_level`
- 游戏列表配置：`/data/adb/gpu_governor/game/games.conf`
- 进程ID管理：`/data/adb/gpu_governor/gpu_governor.pid`

### 日志等级设置

日志等级设置保存在 `/data/adb/gpu_governor/log/log_level` 文件中，默认为 `info` 级别。可以通过以下三种方式进行设置：
1. 使用交互式菜单 `./action.sh` 选择日志等级
2. 通过 WebUI 界面的设置页面进行调整
3. 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件

修改日志等级后立即生效，无需重启模块。

### 负载阈值设置

模块内部实现了智能多级负载阈值系统，用于精确调整 GPU 频率。系统会根据当前模式自动调整阈值：

**普通模式**（默认负载阈值：10/30/70/90）：
- **极低负载**: 10% 以下，降低频率以节省电量，支持深度节能
- **低负载**: 10-30%，适当降低频率，保持基础性能
- **中等负载**: 30-70%，保持平衡的频率，日常使用最佳
- **高负载**: 70-90%，提高频率以提供更好性能
- **极高负载**: 90% 以上，使用最高频率，全力输出

**游戏模式**（性能负载阈值：5/20/60/85）：
- **极低负载**: 5% 以下，最低频率，节省待机功耗
- **低负载**: 5-20%，较低频率，游戏菜单界面
- **中等负载**: 20-60%，中等频率，轻度游戏负载
- **高负载**: 60-85%，高频率，中重度游戏场景
- **极高负载**: 85% 以上，最高频率，极限游戏性能

**高级调速参数**：
- **滞后阈值机制**：游戏模式 65%/40%，普通模式 75%/30%，防止频率抖动
- **去抖动时间控制**：游戏模式 10ms/30ms，普通模式 20ms/50ms，确保调频稳定
- **自适应采样算法**：基础间隔 16ms（约 60Hz），根据负载动态调整 8-100ms
- **负载趋势分析**：检测负载上升/下降趋势，实现预测性频率调整
- **余量调节系统**：支持 0-100% 的频率计算余量

## 日志系统 📊

日志文件存储在 `/data/adb/gpu_governor/log/` 目录下，主要包括：

- **gpu_gov.log**: 主日志文件，由 Rust 核心统一管理，记录 GPU 调速器的运行状态
- **initsvc.log**: 初始化服务日志，记录模块启动过程和脚本初始化信息

日志内容可以通过WebUI界面查看，也可以通过文件管理器直接查看。

### 日志等级

模块支持四个日志等级，可以通过 `action.sh` 脚本或 WebUI 界面进行设置：

- **debug**: 调试级别，记录所有详细信息，包括频率调整、负载监控等
- **info**: 信息级别，记录正常运行信息，默认级别
- **warn**: 警告级别，只记录警告和错误信息
- **error**: 错误级别，只记录错误信息

日志等级设置保存在 `/data/adb/gpu_governor/log/log_level` 文件中，修改后立即生效，无需重启模块。

### 日志管理

模块的主日志已完全由Rust核心统一实现，包括：
- 日志文件的创建和写入
- 自动日志轮转和大小控制
- 日志等级的实时监控和响应


## 支持的设备 📱

支持大多数搭载 Mali GPU 的联发科处理器，包括但不限于：
- Dimensity 系列（如 D700/D800/D900/D1x00/D8x00/D9000 等）  0 ≤ x ≤ 2
- Helio 系列
- MT6xxx 系列

模块会自动检测设备型号并应用适合的配置。
如果您的设备不在支持列表中，模块会使用默认配置

## 致谢 🙏

- **作者**: 瓦力喀 @CoolApk, rtools @CoolApk
- **特别感谢**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **测试反馈**: 内测群组全体群友
- **配置协助**: Fiagelia @CoolApk, 忘渐 @CoolApk

## 注意事项 ⚠️

- 修改 GPU 频率和电压可能会影响设备稳定性
- 不当的配置可能导致设备过热或性能问题
- 建议备份原始配置文件以便恢复
- 如遇到问题，可以查看日志文件进行排查

## WebUI 界面 🖥️

本模块提供了基于 KernelSU API 的现代化 WebUI 界面，基于 Miuix 风格设计，为用户提供直观的 GPU 调速器管理和监控体验。
WebUI 支持配置文件热更新、日志实时查看、游戏列表和频率表可视化编辑，所有更改即时生效。

### 功能特性

#### 核心功能
- **实时状态监控**：查看模块运行状态、版本信息和游戏模式状态
- **GPU 频率配置**：查看和编辑当前 GPU 频率表配置，支持调整频率、电压和内存档位
- **游戏列表管理**：查看和编辑已配置的游戏列表，支持添加/删除游戏
- **日志查看**：实时查看模块运行日志，支持选择不同日志文件和日志等级
- **余量设置**：支持调整 GPU 频率计算的余量百分比

#### 界面特性
- **深色模式支持**：自动适应系统深色/浅色模式，也可手动切换
- **多语言支持**：支持中文和英文界面，自动检测系统语言设置
- **电压调整器**：支持使用旋转选择器进行电压调整，长按可连续调整（每次±625单位）
- **实时更新**：每秒检测游戏模式状态变化并更新界面
- **Toast 提示**：操作反馈和状态提示

### 界面布局

WebUI 采用多页面布局，通过底部导航栏进行页面切换：

#### 📊 状态页面
- 显示模块运行状态和版本信息
- 游戏模式开关控制
- 当前 GPU 频率和负载显示

#### ⚙️ 配置页面
- GPU 频率表配置编辑
- 电压和内存频率档位调整
- 游戏列表管理
- 余量设置调整

#### 📝 日志页面
- 实时日志查看
- 日志文件选择（gpu_gov.log、initsvc.log）
- 日志等级筛选

#### 🔧 设置页面
- 主题设置（深色/浅色/自动）
- 语言设置（中文/英文/自动）
- 日志等级设置
- 其他高级选项

## 常见问题 ❓

### 基础使用问题

**Q: 如何确认模块正常工作？**
A: 查看 `/data/adb/gpu_governor/log/gpu_gov.log` 日志文件，确认有正常的频率调节记录。或者通过 WebUI 界面查看模块状态和日志。正常工作时，日志中应该有 GPU 负载和频率调整的记录。

**Q: 游戏模式如何工作？**
A: 当检测到 `games.conf` 中列出的应用在前台运行时，会自动应用游戏模式；游戏模式下会使用更积极的升频策略（负载阈值为5/20/60/85），在高负载区域，提供更好的游戏体验。

**Q: 如何添加自定义游戏到列表？**
A: 编辑 `/data/adb/gpu_governor/game/games.conf` 文件，添加游戏的包名即可。或者通过 WebUI 界面的游戏列表页面进行添加。模块会在安装时自动扫描设备上已安装的游戏并生成初始游戏列表。

**Q: 如何调整日志等级？**
A: 有三种方式：1) 使用交互式菜单 `./action.sh` 选择日志等级；2) 通过 WebUI 界面的设置页面进行调整；3) 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件。调整后会立即生效，无需重启模块。

**Q: 如何使用 WebUI？**
A: KernelSU/APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [MMRL](https://github.com/MMRLApp/MMRL) 应用来访问模块的 WebUI。

**Q: 如何调整GPU频率计算的余量？**
A: 在 `/data/gpu_freq_table.conf` 文件中添加或修改 `Margin=数值` 行，数值表示余量百分比。也可以通过 WebUI 界面的配置页面进行调整。余量越大，实际频率越高，性能越好但功耗也越高。

**Q: 配置文件和参数修改后需要重启模块吗？**
A: 不需要。模块支持配置文件热更新和多线程监控，所有更改（如频率表、游戏列表、日志等级等）均可实时生效，无需重启。
