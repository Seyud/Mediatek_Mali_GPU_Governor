# Installation Guide

@@include(../_includes/requirements-en.md)

## Installation Steps

1. Download [the latest version of the module](https://github.com/Seyud/Mediatek_Mali_GPU_Governor/releases/latest)
2. Install the module in your Root manager
3. Reboot device
4. The module will automatically detect device model and apply adaptive configuration
5. Check logs to confirm the module is working properly

## Verification

After installation, you can verify the module is working properly by:

- @@include(../_includes/log-check-en.md)
- Using `action.sh` script to check module status

### Using action.sh Script

The module provides the `action.sh` script, supporting interactive operations via volume keys:

**Script Features**:

- **Control Governor Service**: Start or stop the GPU governor service
- **Set Log Level**: Choose debug, info, warn, or error level
- **View Module Status**: Display module version, running status, and other information

**Operation**:

- Volume Up Key: Move selection down (increment selection in menu)
- Volume Down Key: Confirm selection

The script will automatically detect the current system language and display the corresponding Chinese or English interface. 

If you encounter issues, please check the log files or contact [technical support](./faq.md#technical-support).