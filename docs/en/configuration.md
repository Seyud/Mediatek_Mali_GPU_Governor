# Configuration Files ⚙️

## Custom Configuration

Users can customize the behavior of the GPU governor by modifying the `/data/adb/gpu_governor/config/config.toml` file. The configuration file contains global settings and detailed parameters for four modes (powersave, balance, performance, fast).

### Global Configuration

- `mode`: Set the default mode, options are `powersave`, `balance`, `performance`, `fast`

- `idle_threshold`: Idle threshold (percentage), the system is considered idle when GPU load is below this value

### Mode Configuration

Each mode has the following configurable parameters:

- `margin`: Margin

- `aggressive_down`: Whether to use aggressive down frequency strategy

- `sampling_interval`: Sampling interval (milliseconds)

- `gaming_mode`: Gaming optimization, enable special memory optimization for games

- `adaptive_sampling`: Whether to enable adaptive sampling

- `min_adaptive_interval`: Minimum adaptive sampling interval (milliseconds)

- `max_adaptive_interval`: Maximum adaptive sampling interval (milliseconds)

- `up_rate_delay`: Frequency increase delay (milliseconds)

- `down_rate_delay`: Frequency decrease delay (milliseconds)

## GPU Frequency Table Configuration

The frequency table file is located at `/data/adb/gpu_governor/config/gpu_freq_table.toml`:

```toml

# GPU frequency table

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

**Configuration Parameter Description**:

- **freq**: GPU frequency (kHz)

- **volt**: Voltage (μV)

- **ddr_opp**: DDR OPP level (999 means no adjustment, 0-3 means different levels)

**Preset Configuration Files**:

- `config/mtd1000.toml` - Dimensity 1000 series

- `config/mtd1100.toml` - Dimensity 1100 series

- `config/mtd1200.toml` - Dimensity 1200 series

- `config/mtd6080.toml` - Dimensity 6080 series

- `config/mtd7300.toml` - Dimensity 7300 series

- `config/mtd8100.toml` - Dimensity 8100 series

- `config/mtd8200.toml` - Dimensity 8200 series

- `config/mtd9000.toml` - Dimensity 9000 series

## Preset Frequency Table Format

Each preset configuration file uses TOML array format to define the frequency table for specific processors:

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

Different processor series have different frequency ranges and voltage configurations. The module will automatically select the matching frequency table configuration based on the device model.

## Game List Configuration

The game list configuration file is located at `/data/adb/gpu_governor/game/games.toml`, containing game package names and corresponding modes. The module will automatically scan installed games on the device and generate this configuration file during installation.

**Note**: The installation script will check if the game list file already exists, and if so, it will not overwrite it to preserve user's game preferences.

## Interactive Control Menu

The module provides the `action.sh` script, supporting interactive operations via volume keys:

**Script Features**:

- **Control Governor Service**: Start or stop the GPU governor service

- **Set Log Level**: Choose debug, info, warn, or error level

- **View Module Status**: Display module version, running status, and other information

**Operation**:

- Volume Up Key: Move selection down (increment selection in menu)

- Volume Down Key: Confirm selection

The script will automatically detect the current system language and display the corresponding Chinese or English interface.

**Module Files**:

- Log level setting: `/data/adb/gpu_governor/log/log_level`

- Game list configuration: `/data/adb/gpu_governor/game/games.toml`

- PID management: `/data/adb/gpu_governor/gpu_governor.pid`

## Log Level Setting

Log level setting is saved in `/data/adb/gpu_governor/log/log_level` file, default is `info` level. It can be set in three ways:

1. Use interactive menu `./action.sh` to select log level

2. Adjust via WebUI settings page

3. Directly edit `/data/adb/gpu_governor/log/log_level` file

Changes to log level take effect immediately after saving, without restarting the module.
