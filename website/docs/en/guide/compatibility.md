# Device Compatibility

@@include(../_includes/requirements-en.md)

## Supported Devices

Supports most MediaTek processors with Mali GPU:

- Dimensity series (e.g. D1x00/D6080/D7300/D8x00/D9x00, etc.) 0 ≤ x ≤ 4

The module will automatically detect the device model and apply the appropriate configuration.
If your device is not in the adaptation list, the module will use the default configuration.

### Preset Configuration File Support

The module provides dedicated preset configuration files for the following processor series:

- `config/mtd1000.toml` - Dimensity 1000 series
- `config/mtd1100.toml` - Dimensity 1100 series
- `config/mtd1200.toml` - Dimensity 1200 series
- `config/mtd6080.toml` - Dimensity 6080 series
- `config/mtd7300.toml` - Dimensity 7300 series
- `config/mtd8100.toml` - Dimensity 8100 series
- `config/mtd8200.toml` - Dimensity 8200 series
- `config/mtd9000.toml` - Dimensity 9000 series

Different processor series have different frequency ranges and voltage configurations. The module will automatically select the matching frequency table configuration based on the device model.

## Technical Compatibility

### GPUFreq Driver Support

- **Precise Frequency Control**: Fully supports GPUFreq v1/v2 drivers, automatically detects driver version and adapts
- **Intelligent Frequency Writing**: V2 driver optimization mechanism reduces unnecessary frequency write operations
- **Voltage & Memory Linkage**: Supports DDR frequency adjustment, precise mapping between voltage and frequency

### Root Solution Compatibility

- **Magisk**: v20.4+ version support
- **KernelSU**: Fully supported, including WebUI functionality
- **APatch**: Fully supported, including WebUI functionality

## Automatic Device Adaptation

### Adaptation Mechanism

- **Automatic Device Adaptation**: Automatically detects device model during installation and applies the best config file
- **Intelligent Configuration Selection**: Applies optimized configuration for corresponding processor based on detection results
- **Default Configuration Compatibility**: Unadapted devices automatically use generic default configuration

### Automatic Game List Generation

The game list configuration file is located at `/data/adb/gpu_governor/game/games.toml`, containing game package names and corresponding modes. The module will automatically scan installed games on the device and generate this configuration file during installation.

**Note**: The installation script will check if the game list file already exists. If it exists, it will not be overwritten to preserve user game preferences.

## Compatibility Verification

### Verification Methods

After installing the module, you can verify compatibility through:

**Q: How to confirm the module is working properly?**  
A: @@include(../_includes/log-check-en.md)

**Q: How to use WebUI?**  
A: KernelSU/APatch users can click this module in the root manager and select "Open WebUI".   
Magisk users can install [KsuWebUI](https://github.com/5ec1cff/KsuWebUIStandalone) or [SSU](https://ssu.oom-wg.dev/base/install) apps to access the module's WebUI.