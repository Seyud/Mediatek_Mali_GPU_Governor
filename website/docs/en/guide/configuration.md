# Configuration Guide

## Configuration File Structure

Dimensity GPU Governor uses multiple configuration files to control its behavior:

- `/data/adb/gpu_governor/config/config.toml` - Custom configuration
- `/data/adb/gpu_governor/config/gpu_freq_table.toml` - GPU frequency table configuration
- `/data/adb/gpu_governor/game/games.toml` - Games list configuration
- `/data/adb/gpu_governor/log/log_level` - Log level setting

## Custom Configuration

Users can customize GPU governor behavior by modifying `/data/adb/gpu_governor/config/config.toml`. The configuration file contains global settings and detailed parameters for four modes (powersave, balance, performance, fast).

### Global Configuration

- `mode`: Set default mode, available values: `powersave`, `balance`, `performance`, `fast`
- `idle_threshold`: Idle threshold (percentage), system is considered idle when GPU load is below this value

### Mode Configuration

Each mode has the following configurable parameters:

- `margin`: Margin
- `aggressive_down`: Whether to use aggressive down-frequency strategy
- `sampling_interval`: Sampling interval (milliseconds)
- `gaming_mode`: Gaming optimization, enables special memory optimization for games
- `adaptive_sampling`: Whether to enable adaptive sampling
- `min_adaptive_interval`: Minimum adaptive sampling interval (milliseconds)
- `max_adaptive_interval`: Maximum adaptive sampling interval (milliseconds)
- `up_rate_delay`: Up-frequency delay (milliseconds)
- `down_rate_delay`: Down-frequency delay (milliseconds)

## GPU Frequency Table Configuration

Frequency table file is located at `/data/adb/gpu_governor/config/gpu_freq_table.toml`:

```toml
# GPU Frequency Table
# freq unit: kHz
# volt unit: uV
# ddr_opp: DDR OPP level

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

# More frequency points...
```

**Configuration Parameters**:

- **freq**: GPU frequency (kHz)
- **volt**: Voltage (μV)
- **ddr_opp**: DDR OPP level (999 means no adjustment, 0-3 represents different levels)

## Preset Configuration Files

The module provides multiple preset configuration files:

- `config/mtd1000.toml` - Dimensity 1000 series
- `config/mtd1100.toml` - Dimensity 1100 series
- `config/mtd1200.toml` - Dimensity 1200 series
- `config/mtd6080.toml` - Dimensity 6080 series
- `config/mtd7300.toml` - Dimensity 7300 series
- `config/mtd8100.toml` - Dimensity 8100 series
- `config/mtd8200.toml` - Dimensity 8200 series
- `config/mtd9000.toml` - Dimensity 9000 series

### Preset Frequency Table Format

Each preset configuration file uses TOML array format to define frequency tables for specific processors:

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

Different processor series have different frequency ranges and voltage configurations. The module will automatically select matching frequency table configuration based on device model.

## Games List Configuration

Games list configuration file is located at `/data/adb/gpu_governor/game/games.toml`, containing game package names and corresponding modes. The module will automatically scan installed games on device during installation and generate this configuration file.

**Note**: Installation script will check if games list file already exists, and will not overwrite it if it exists, to preserve user's game preferences.

## Log Level Setting

Log level setting is saved in `/data/adb/gpu_governor/log/log_level` file, default is `info` level. It can be set through three methods:

1. Use interactive menu `./action.sh` to select log level
2. Adjust through WebUI interface settings page
3. Directly edit `/data/adb/gpu_governor/log/log_level` file

Log level changes take effect immediately after saving, no need to restart the module.

## Configuration Hot Reload

The module supports configuration hot reload, all configuration changes (such as frequency table, games list, log level etc.) take effect in real time without restarting the module. This is thanks to the module's multithreaded monitoring architecture.