# Supported Devices 📱

Supports most MediaTek processors with Mali GPU:

- Dimensity series (e.g. D1x00/D6080/D7300/D8x00/D9x00, etc.) 0 ≤ x ≤ 4

The module will automatically detect the device model and apply the appropriate configuration.
If your device is not in the adaptation list, the module will use the default configuration.

## Voltage Undervolting Support ⚡

Voltage undervolting is only supported on the following chip models:

- **Dimensity 1000 / 1100 / 1200**
- **Dimensity 8100 / 8200**
- **Dimensity 9000**

> **Note**: For processors that do not support undervolting, the voltage fields in the frequency table are for placeholder purposes only, used to maintain format alignment with other frequency tables. The actual undervolting function will not take effect.

### Undervolting Configuration File

The undervolting function is implemented through the `volt` parameter in the frequency table, located at `/data/adb/gpu_governor/config/gpu_freq_table.toml`.

**Usage Instructions:**
- The module will automatically detect the chip model and apply the corresponding undervolting configuration
- Incorrect voltage values may cause system instability
- If adjustment is needed, please refer to the voltage value ranges in `volt_list.txt`
