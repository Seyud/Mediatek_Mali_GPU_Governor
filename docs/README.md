# 天玑 GPU 调速器 🚀

[![Version](https://img.shields.io/badge/Version-v2.8-brightgreen)](https://github.com/Seyud/Mediatek_Mali_GPU_Governor)
[![Language](https://img.shields.io/badge/Language-Rust-orange)](https://www.rust-lang.org/)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?logo=telegram&logoColor=white)](https://t.me/MTK_GPU)
[![QQ群](https://img.shields.io/badge/QQ群-719872309-12B7F5?logo=qq&logoColor=white)](https://qun.qq.com/universal-share/share?ac=1&authKey=zwOHClW5YTIZobOTsqvF6lBaACPvS7%2F2Y0s%2FpQadAMss5d2nxcr46fmsm%2FFreVjt&busi_data=eyJncm91cENvZGUiOiI3MTk4NzIzMDkiLCJ0b2tlbiI6IjhQNUhYM1M4NUs4bFVwQmNsODRrUU1Xc0phR3dra1RUYnE0S0tMVFNzV3JUU2s3elgvSFRyUXJQdWtEQ1NVYSsiLCJ1aW4iOiIxMTA1NzgzMDMzIn0%3D&data=VgJU9DuiAPqB3ocg4Zlh8UShvQmDEgEfH4wvqCVXWOD8qcBSzYDPQuwUKVgLOIzZ-CWhtV69fyTHD4Q0GqWWKw&svctype=4&tempid=h5_group_info)

## 简介 📝
**简体中文** | [English](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/blob/main/docs/en/README.md)

天玑 GPU 调速器（Mediatek Mali GPU Governor）是一个专为联发科处理器设计的先进 GPU 调速器。采用 **Rust 语言** 开发的高性能核心引擎，通过智能监控 GPU 负载并动态调整频率，在游戏体验和功耗平衡之间达到最佳平衡。模块集成了现代化的 **WebUI 管理界面** 和 **完整的游戏模式检测**，为用户提供优秀的 GPU 调速解决方案。

## 特性 ✨

### 核心功能
- 🎮 **智能游戏模式**：自动检测 `games.conf` 中配置的游戏应用，应用性能优化的 GPU 频率策略
- ⚙️ **自定义配置系统**：通过 `config.toml` 配置文件灵活调整调速策略，支持全局配置和四种模式配置项
- 📊 **实时负载监控**：基于 Rust 高性能实现，实时监控 GPU 负载
- 🔄 **自适应调频算法**：游戏模式使用激进升频策略，普通模式使用节能降频策略
- 🎯 **精确频率控制**：完全支持 GPUFreq v1/v2 驱动，自动检测驱动版本并适配
- ⚙️ **智能频率写入**：V2 驱动优化机制，减少不必要的频率写入操作
- 🎛️ **电压与内存联动**：支持 DDR 频率档位调节，电压与频率精确对应

### 用户界面与交互
- 🖥️ **现代化 WebUI**：基于 KernelSU API 的图形化管理界面，使用 Miuix 风格设计
- 🌓 **智能主题系统**：支持深色/浅色/自动模式，自动适应系统设置
- 🌐 **完整多语言支持**：支持中文和英文界面，自动检测系统语言设置
- 📊 **可视化配置编辑**：支持通过 WebUI 直接编辑频率表，自定义配置和游戏列表
- 🔧 **交互式控制脚本**：提供 `action.sh` 音量键控制脚本，支持服务管理和日志等级设置

### 技术特性
- 🦀 **Rust 核心引擎与多线程监控**：使用 Rust 语言开发，保证内存安全、零成本抽象和极致性能。主程序采用多线程架构，分别负责GPU负载监控、前台应用监控、频率表文件热更新、自定义配置监控、日志等级监控等，确保调速器实时响应系统状态变化。
- 🔧 **高度可定制化**：通过配置文件自定义 GPU 频率、电压和内存档位
- 📱 **广泛设备兼容**：支持 Dimensity 系列联发科处理器
- 📝 **专业日志系统**：支持 debug/info/warn/error 四级日志
- 🔄 **自动设备适配**：安装时自动检测设备型号并应用适配模块配置

## 安装要求 📋

### 设备要求
- 已 Root 的 Android 设备
- 搭载联发科处理器（MTK）的设备，支持 Mali GPU
- 支持 GPUFreq v1 或 v2 驱动的设备
- Magisk v20.4+, KernelSU 或 APatch 等支持模块的 Root 方案

### WebUI 功能要求
- 使用 WebUI 功能需要以下任一环境：
  - **KernelSU/APatch 用户**：直接在管理器中点击模块的"打开 WebUI"功能
  - **Magisk 用户**：需要安装以下应用之一
    - [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) - 独立的 WebUI 应用
    - [SSU](https://ssu.oom-wg.dev/base/install) - SSU管理器应用

##### 配置文件 ⚙️

### 自定义配置

用户可以通过修改 `/data/adb/gpu_governor/config/config.toml` 文件来自定义 GPU 调速器的行为。配置文件包含全局设置和四种模式（省电、平衡、性能、极速）的详细参数。

#### 全局配置
- `mode`: 设置默认模式，可选值为 `powersave`（省电）、`balance`（平衡）、`performance`（性能）、`fast`（极速）
- `idle_threshold`: 空闲阈值（百分比），当 GPU 负载低于此值时认为系统处于空闲状态

#### 模式配置
每种模式都有以下可配置参数：
- `ultra_simple_threshold`: 极简阈值（百分比），达到此阈值时升频
- `margin`: 余量，当设置为 N 时，降频阈值为 (100-N)%
- `down_counter_threshold`: 降频计数器配置值，0 表示禁用降频计数器功能
- `aggressive_down`: 是否使用激进降频策略
- `sampling_interval`: 采样间隔（毫秒）
- `gaming_mode`: 游戏优化，启用游戏特殊内存优化
- `adaptive_sampling`: 是否启用自适应采样
- `min_adaptive_interval`: 自适应采样最小间隔（毫秒）
- `max_adaptive_interval`: 自适应采样最大间隔（毫秒）
- `up_rate_delay`: 升频延迟（毫秒）
- `down_rate_delay`: 降频延迟（毫秒）

### GPU 频率表配置

频率表文件位于 `/data/adb/gpu_governor/config/gpu_freq_table.toml`：

```toml
# GPU 频率表
# freq 单位: kHz
# volt 单位: uV
# ddr_opp: DDR OPP 档位

[[freq_table]]
freq = 218000
volt = 45000
ddr_opp = 999

[[freq_table]]
freq = 280000
volt = 46875
ddr_opp = 999

[[freq_table]]
freq = 350000
volt = 48750
ddr_opp = 999

[[freq_table]]
freq = 431000
volt = 49375
ddr_opp = 999

[[freq_table]]
freq = 471000
volt = 50625
ddr_opp = 999

[[freq_table]]
freq = 532000
volt = 51875
ddr_opp = 999

[[freq_table]]
freq = 573000
volt = 53125
ddr_opp = 3

[[freq_table]]
freq = 634000
volt = 55000
ddr_opp = 3

[[freq_table]]
freq = 685000
volt = 56875
ddr_opp = 0

[[freq_table]]
freq = 755000
volt = 59375
ddr_opp = 0

[[freq_table]]
freq = 853000
volt = 60625
ddr_opp = 0
```

**配置参数说明**：
- **freq**: GPU 频率 (kHz)
- **volt**: 电压 (μV)
- **ddr_opp**: DDR OPP档位（999表示不调整，0-3表示不同档位）

**预设配置文件**：
- `config/mtd720.toml` - Dimensity 720 系列
- `config/mtd1000.toml` - Dimensity 1000 系列
- `config/mtd1100.toml` - Dimensity 1100 系列
- `config/mtd1200.toml` - Dimensity 1200 系列
- `config/mtd8100.toml` - Dimensity 8100 系列
- `config/mtd8200.toml` - Dimensity 8200 系列
- `config/mtd9000.toml` - Dimensity 9000 系列

### 预设频率表格式

每个预设配置文件使用TOML数组格式定义特定处理器的频率表：

```toml
freq_table = [
    { freq = 219000, volt = 45000, ddr_opp = 999 },
    { freq = 280000, volt = 46875, ddr_opp = 999 },
    { freq = 351000, volt = 48750, ddr_opp = 999 },
    { freq = 402000, volt = 50000, ddr_opp = 999 },
    { freq = 487000, volt = 52500, ddr_opp = 999 },
    { freq = 555000, volt = 55625, ddr_opp = 0 },
    { freq = 642000, volt = 57500, ddr_opp = 0 },
    { freq = 721000, volt = 58125, ddr_opp = 0 },
    { freq = 800000, volt = 59375, ddr_opp = 0 },
    { freq = 852000, volt = 60000, ddr_opp = 0 }
]
```


不同处理器系列具有不同的频率范围和电压配置，模块会根据设备型号自动选择匹配的频率表配置。

### 游戏列表配置

游戏列表配置文件位于 `/data/adb/gpu_governor/game/games.toml`，包含游戏包名和对应模式。模块会在安装时自动扫描设备上已安装的游戏并生成此配置文件。

**注意**：安装脚本会检查游戏列表文件是否已存在，如果存在则不会覆盖，以保留用户的游戏偏好。

### 交互式控制菜单

模块提供了 `action.sh` 脚本，支持通过音量键进行交互式操作：

**脚本功能**：
- **控制调速器服务**：启动或停止 GPU 调速器服务
- **设置日志等级**：选择 debug、info、warn 或 error 级别
- **查看模块状态**：显示模块版本、运行状态等信息

**操作方式**：
- 音量上键：向下选择选项（在菜单中递增选择项）
- 音量下键：确认选择

脚本会自动检测当前系统语言，并显示相应的中文或英文界面。

**模块文件**：
- 日志等级设置：`/data/adb/gpu_governor/log/log_level`
- 游戏列表配置：`/data/adb/gpu_governor/game/games.toml`
- 进程ID管理：`/data/adb/gpu_governor/gpu_governor.pid`

### 日志等级设置

日志等级设置保存在 `/data/adb/gpu_governor/log/log_level` 文件中，默认为 `info` 级别。可以通过以下三种方式进行设置：
1. 使用交互式菜单 `./action.sh` 选择日志等级
2. 通过 WebUI 界面的设置页面进行调整
3. 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件

修改日志等级保存后立即生效，无需重启模块。

## 日志系统 📊

日志文件存储在 `/data/adb/gpu_governor/log/` 目录下，主要包括：

- **gpu_gov.log**: 主日志文件，由 Rust 核心统一管理，记录 GPU 调速器的运行状态
- **initsvc.log**: 初始化日志，记录模块启动过程和脚本初始化信息

日志内容可以通过WebUI界面查看，也可以通过文件管理器直接查看。

### 日志管理

模块的主日志已完全由Rust核心统一实现，包括：
- 日志文件的创建和写入
- 自动日志轮转和大小控制
- 日志等级的实时监控和响应


## 支持的设备 📱

支持大多数搭载 Mali GPU 的联发科处理器：
- Dimensity 系列（如 D700/D800/D900/D1x00/D8x00/D9000 等）  0 ≤ x ≤ 2

模块会自动检测设备型号并应用适合的配置。
如果您的设备不在适配列表中，模块会使用默认配置

## 致谢 🙏

- **作者**: 瓦力喀 @CoolApk, rtools @CoolApk
- **特别感谢**: HamJin @CoolApk, asto18089 @CoolApk, helloklf @Github
- **测试反馈**: 内测群组全体群友
- **配置协助**: Fiagelia @CoolApk, 忘渐 @CoolApk

## 注意事项 ⚠️

- 修改 GPU 频率和电压可能会影响设备稳定性
- 不当的配置可能导致设备性能或稳定问题
- 如遇到问题，可以查看日志文件进行排查

## WebUI 界面 🖥️

本模块提供了基于 KernelSU API 的现代化 WebUI 界面，基于 Miuix 风格设计，为用户提供直观的 GPU 调速器管理和监控体验。
WebUI 支持配置文件热更新、日志实时查看、游戏列表和频率表可视化编辑，所有更改即时生效。

### 功能特性

#### 核心功能
- **实时状态监控**：查看运行状态、当前模式和版本信息
- **GPU 频率配置**：查看和编辑当前 GPU 频率表配置，支持调整频率、电压和内存档位
- **自定义配置**：查看和编辑当前自定义配置，支持全局配置和模式配置
- **游戏列表管理**：查看和编辑已配置的游戏列表，支持添加/删除游戏和选择对应模式
- **日志查看**：实时查看模块运行日志，支持选择不同日志文件和日志等级

#### 界面特性
- **深色模式支持**：自动适应系统深色/浅色模式，也可手动切换
- **多语言支持**：支持中文和英文界面，自动检测系统语言设置
- **电压调整器**：支持使用旋转选择器进行电压调整，长按可连续调整（每次±625单位）
- **实时更新**：每秒检测游戏模式状态变化并更新界面
- **Toast 提示**：操作反馈和状态提示

### 界面布局

WebUI 采用多页面布局，通过底部导航栏进行页面切换：

## 常见问题 ❓

### 基础使用问题

**Q: 如何确认模块正常工作？**
A: 查看 `/data/adb/gpu_governor/log/gpu_gov.log` 日志文件，或者通过 WebUI 界面查看运行状态和日志，确认无频繁异常报错。

**Q: 游戏模式如何工作？**
A: 当检测到 `games.toml` 中列出的应用在前台运行时，会自动应用游戏模式；游戏模式下会使用游戏列表中对应的模式

**Q: 如何添加自定义游戏到列表？**
A: 编辑 `/data/adb/gpu_governor/game/games.toml` 文件，添加游戏的包名即可。或者通过 WebUI 界面的游戏列表页面进行添加。模块会在安装时自动扫描设备上已安装的游戏并生成初始游戏列表。

**Q: 如何调整日志等级？**
A: 有三种方式：1) 使用交互式菜单 `./action.sh` 选择日志等级；2) 通过 WebUI 界面的设置页面进行调整；3) 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件。调整后会立即生效，无需重启模块。

**Q: 如何使用 WebUI？**
A: KernelSU/APatch 用户可在root管理器中点击本模块，选择"打开 WebUI"。Magisk 用户可安装 [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) 或 [SSU](https://ssu.oom-wg.dev/base/install) 应用来访问模块的 WebUI。

**Q: 配置文件和参数修改后需要重启吗？**
A: 不需要。模块支持配置文件热更新和多线程监控，所有更改（如频率表、游戏列表、日志等级等）均可实时生效，无需重启。
