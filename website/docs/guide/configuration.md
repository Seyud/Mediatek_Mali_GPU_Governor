# 配置指南

## 配置文件结构

天玑 GPU 调速器使用多个配置文件来控制其行为：

- `/data/adb/gpu_governor/config/config.toml` - 自定义配置
- `/data/adb/gpu_governor/config/gpu_freq_table.toml` - GPU 频率表配置
- `/data/adb/gpu_governor/game/games.toml` - 游戏列表配置
- `/data/adb/gpu_governor/log/log_level` - 日志等级设置

## 自定义配置

用户可以通过修改 `/data/adb/gpu_governor/config/config.toml` 文件来自定义 GPU 调速器的行为。配置文件包含全局设置和四种模式（省电、平衡、性能、极速）的详细参数。

### 全局配置

- `mode`: 设置默认模式，可选值为 `powersave`（省电）、`balance`（平衡）、`performance`（性能）、`fast`（极速）
- `idle_threshold`: 空闲阈值（百分比），当 GPU 负载低于此值时认为系统处于空闲状态

### 模式配置

每种模式都有以下可配置参数：

- `margin`: 余量
- `aggressive_down`: 是否使用激进降频策略
- `sampling_interval`: 采样间隔（毫秒）
- `gaming_mode`: 游戏优化，启用游戏特殊内存优化
- `adaptive_sampling`: 是否启用自适应采样
- `min_adaptive_interval`: 自适应采样最小间隔（毫秒）
- `max_adaptive_interval`: 自适应采样最大间隔（毫秒）
- `up_rate_delay`: 升频延迟（毫秒）
- `down_rate_delay`: 降频延迟（毫秒）

## GPU 频率表配置

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

# 更多频率点...
```

**配置参数说明**：

- **freq**: GPU 频率 (kHz)
- **volt**: 电压 (μV)
- **ddr_opp**: DDR OPP档位（999表示不调整，0-3表示不同档位）

## 预设配置文件

模块提供了多个预设配置文件：

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

## 游戏列表配置

游戏列表配置文件位于 `/data/adb/gpu_governor/game/games.toml`，包含游戏包名和对应模式。模块会在安装时自动扫描设备上已安装的游戏并生成此配置文件。

**注意**：安装脚本会检查游戏列表文件是否已存在，如果存在则不会覆盖，以保留用户的游戏偏好。

## 日志等级设置

日志等级设置保存在 `/data/adb/gpu_governor/log/log_level` 文件中，默认为 `info` 级别。可以通过以下三种方式进行设置：

1. 使用交互式菜单 `./action.sh` 选择日志等级
2. 通过 WebUI 界面的设置页面进行调整
3. 直接编辑 `/data/adb/gpu_governor/log/log_level` 文件

修改日志等级保存后立即生效，无需重启模块。

## 配置文件热更新

模块支持配置文件热更新，所有配置更改（如频率表、游戏列表、日志等级等）均可实时生效，无需重启模块。这得益于模块的多线程监控架构。