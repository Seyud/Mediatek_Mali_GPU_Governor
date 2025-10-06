#!/system/bin/sh
BASEDIR="$(dirname $(readlink -f "$0"))"
. $BASEDIR/pathinfo.sh
. $BASEDIR/libcommon.sh
. $BASEDIR/libsysinfo.sh

# 初始化语言设置
init_language

# $1:error_message_zh $2:error_message_en
abort() {
    echo "❌ $(translate "$1" "$2")"
    echo "❌ $(translate "安装失败。" "Installation failed.")"
    exit 1
}

# $1:file_node $2:owner $3:group $4:permission $5:secontext
set_perm() {
    local con
    chown $2:$3 $1
    chmod $4 $1
    con=$5
    [ -z $con ] && con=u:object_r:system_file:s0
    chcon $con $1
}

# $1:directory $2:owner $3:group $4:dir_permission $5:file_permission $6:secontext
set_perm_recursive() {
    find $1 -type d 2> /dev/null | while read dir; do
        set_perm $dir $2 $3 $4 $6
    done
    find $1 -type f -o -type l 2> /dev/null | while read file; do
        set_perm $file $2 $3 $5 $6
    done
}

set_permissions() {
    set_perm_recursive $BIN_PATH 0 0 0755 0755 u:object_r:system_file:s0
}

# 复制GPU频率表文件的函数
copy_gpu_freq_table() {
    if [ "$cfgname" != "default" ] && [ -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" ]; then
        cp -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" "$GPU_FREQ_TABLE_TOML_FILE"
        chmod 0666 "$GPU_FREQ_TABLE_TOML_FILE"
        echo "$(translate "📈 GPU频率表已创建于" "📈 GPU frequency table created at") $GPU_FREQ_TABLE_TOML_FILE"
    elif [ -f "$MODULE_GPU_FREQ_TABLE_FILE" ]; then
        cp -f "$MODULE_GPU_FREQ_TABLE_FILE" "$GPU_FREQ_TABLE_TOML_FILE"
        chmod 0666 "$GPU_FREQ_TABLE_TOML_FILE"
        echo "$(translate "📈 默认GPU频率表已创建于" "📈 Default GPU frequency table created at") $GPU_FREQ_TABLE_TOML_FILE"
    else
        echo "$(translate "⚠️ GPU频率表文件，跳过创建" "⚠️ GPU frequency table file not found, skipping creation")"
    fi
}

# 生成游戏列表
generate_gamelist() {
    echo "$(translate "🔍 开始搜索已安装游戏并生成游戏列表" "🔍 Starting to search for installed games and generate game list")"
    echo "$(translate "🎯 正在搜索并添加基于Unity和UE4引擎的游戏" "🎯 Searching and adding Unity & UE4 engine based games")"
    pm list packages -3 | grep -v 'mobileqq' | cut -f2 -d ':' | while read package; do
        path=$(pm path $package | cut -f2 -d ':')
        dir=${path%/*}
        libs="$dir/lib/arm64"
        if [[ -d $libs ]]; then
            game_libs=$(ls $libs | grep -E '(libunity.so|libUE3.so|libUE4.so)')
            if [[ "$game_libs" != '' ]]; then
                if ! printf '%s\n' "$preset_games_list" | grep -Fxq "$package"; then
                    echo " + $package"
                    echo "" >> "$GAMES_FILE"
                    echo "[[games]]" >> "$GAMES_FILE"
                    echo "package = \"$package\"" >> "$GAMES_FILE"
                    echo "mode = \"balance\"" >> "$GAMES_FILE"
                fi
            fi
        fi
    done

    scene_games=/data/data/com.omarea.vtools/shared_prefs/games.xml
    if [[ -f $scene_games ]]; then
        echo "$(translate "🎲 添加被SCENE识别的游戏" "🎲 Adding games recognized by SCENE")"
        grep '="true"' "$scene_games" | cut -f2 -d '"' | while read package; do
            r=$(grep $package "$GAME_LIST")
        if [[ "$r" == '' ]]; then
            echo " + $package"
            echo "" >> "$GAME_LIST"
            echo "[[games]]" >> "$GAME_LIST"
            echo "package = \"$package\"" >> "$GAME_LIST"
            echo "mode = \"balance\"" >> "$GAME_LIST"
        fi
        done
    fi
    
    echo "$(translate "📋 添加预设游戏和基准测试应用" "📋 Adding preset games & benchmark applications")"
    preset_games_list="$(cat <<'EOF' | sed 's/^[[:space:]]*//'
        xyz.aethersx2.android
        org.ppsspp.ppsspp
        org.ppsspp.ppssppgold
        skyline.emu
        com.xiaoji.gamesirnsemulator
        com.futuremark.dmandroid.application
        com.glbenchmark.glbenchmark27
        com.antutu.benchmark.full
        com.ioncannon.cpuburn.gpugflops
        com.tencent.tmgp.cod
        com.tencent.tmgp.pubgmhd
        com.tencent.tmgp.pubgmhdce
        com.tencent.ig
        com.tencent.tmgp.sgame
        com.tencent.tmgp.sgamece
        com.tencent.tmgp.speedmobile
        com.tencent.mf.uam
        com.tencent.tmgp.cf
        com.tencent.af
        com.tencent.lolm
        com.tencent.jkchess
        com.miHoYo.Yuanshen
        com.miHoYo.ys.mi
        com.miHoYo.ys.bilibili
        com.miHoYo.GenshinImpact
        com.miHoYo.hkrpg
        com.miHoYo.hkrpg.bilibili
        com.HoYoverse.hkrpgoversea
        com.mihoyo.bh3
        com.mihoyo.bh3.mi
        com.mihoyo.bh3.uc
        com.miHoYo.bh3.wdj
        com.miHoYo.bh3.bilibili
        com.mojang.minecraftpe
        com.tgc.sky.android
        com.kiloo.subwaysurf
        com.taptap
        com.netease.sky
        com.netease.moba.aligames
        com.netease.party
        com.netease.jddsaef
        com.netease.g93na
        com.netease.g93natw
        com.netease.g93nagb
        com.netease.mrzhna
        com.netease.mrzh.nearme.gamecenter
        com.dw.h5yvzr.yt
        com.pwrd.hotta.laohu
        com.hottagames.hotta.bilibili
        com.hottagames.hotta.mi
        com.hottagames.hotta.vivo
        com.kurogame.mingchao
        com.kurogame.wutheringwaves.global
        com.dragonli.projectsnow.lhm
        com.netease.aceracer
        com.netease.race
        com.activision.callofduty.warzone
        com.MadOut.BIG
EOF
)"

    echo "# GPU调速器游戏列表" > "$GAME_LIST"
    echo "" >> "$GAME_LIST"

    printf '%s\n' "$preset_games_list" | while read -r package; do
        [ -z "$package" ] && continue
        printf '[[games]]\n' >> "$GAME_LIST"
        printf 'package = "%s"\n' "$package" >> "$GAME_LIST"
        printf 'mode = "balance"\n\n' >> "$GAME_LIST"
    done
    echo "$(translate "📝 游戏列表已生成：" "📝 Game list generated:") $GAME_LIST"
    echo "$(translate "🎮 GPU调速器可以为游戏列表中的应用启用游戏模式 🎮" "🎮 GPU Governor can enable game mode for applications in the game list 🎮")"
}

install_gov() {
    echo "$(translate "📱 设备平台：" "📱 Device platform:") $(getprop ro.board.platform)"
    echo "$(translate "📱 产品主板：" "📱 Product board:") $(getprop ro.product.board)"

    target="$(getprop ro.board.platform)"
    cfgname="$(get_config_name $target)"

    # 特殊处理mt6893，可能是mt6891或mt6893
    if [ "$target" = "mt6893" ]; then
        # 如果CPU7最大频率小于2700000，则是mt6891
        if [ "$(get_maxfreq 7)" -lt 2700000 ]; then
            echo "$(translate "🔍 检测到mt6893但CPU7频率较低，判断为mt6891" "🔍 Detected mt6893 but CPU7 frequency is lower, identified as mt6891")"
            cfgname="mtd1100"
        else
            echo "$(translate "🔍 检测到mt6893且CPU7频率正常，判断为mt6893" "🔍 Detected mt6893 with normal CPU7 frequency, identified as mt6893")"
            cfgname="mtd1200"
        fi
    fi

    # 特殊处理mt6895，可能是mt6896
    if [ "$target" = "mt6895" ]; then
        if [[ $(getprop ro.soc.model | grep 6896) != '' ]]; then
            echo "$(translate "🔍 检测到mt6895但ro.soc.model包含6896，判断为mt6896" "🔍 Detected mt6895 but ro.soc.model contains 6896, identified as mt6896")"
            cfgname="mtd8200"
        fi
    fi
    
    # 定义GPU频率表模板文件
    GPU_FREQ_TABLE_TEMPLATE_FILE="$MODULE_CONFIG_PATH/$cfgname.toml"

    if [ "$cfgname" = "unsupported" ]; then
        target="$(getprop ro.product.board)"
        cfgname="$(get_config_name "$target")"
    fi
    if [ "$cfgname" = "unsupported" ] || [ ! -f "$GPU_FREQ_TABLE_TEMPLATE_FILE" ]; then
        # 检查是否为MTK设备
        if [ "$(is_mtk)" = "true" ]; then
            echo "$(translate "⚠️ 目标设备 [$target] 是MTK设备但没有专用配置，使用默认配置。" "⚠️ Target [$target] is MTK device but no specific config found, using default configuration.")"
            cfgname="default"
            # 更新GPU频率表模板文件路径变量
            GPU_FREQ_TABLE_TEMPLATE_FILE="$MODULE_PATH/config/$cfgname.toml"
        else
            abort "目标设备 [$target] 不受支持，仅支持联发科(MTK)芯片。" "Target [$target] not supported. Only supports MediaTek(MTK) chips."
        fi
    fi

    mkdir -p "$GPU_LOG"
    mkdir -p "$GPU_GAME"
    mkdir -p "$GPU_CONFIG"
    chmod 0644 "$GPU_LOG"
    chmod 0644 "$GPU_GAME"
    chmod 0644 "$GPU_CONFIG"

    # 处理TOML格式的GPU频率表文件，支持按键选择是否保留旧文件
    if [ -f "$GPU_FREQ_TABLE_TOML_FILE" ]; then
        echo "$(translate "⚠️ 发现已存在的GPU频率表" "⚠️ Found existing GPU frequency table")"
        echo "$(translate "🔄 是否保留旧的频率表？（若不保留则自动备份）" "🔄 Do you want to keep the old frequency table? (If not, it will be automatically backed up)")"
        echo "$(translate "🔊 （音量上键 = 是, 音量下键 = 否，10秒无操作 = 是）" "🔊 (Volume Up = Yes, Volume Down = No, 10s no input = Yes)")"

        TMPDIR="/data/local/tmp"
        mkdir -p "$TMPDIR" 2> /dev/null
        START_TIME=$(date +%s)
        while true; do
            NOW_TIME=$(date +%s)
            timeout 1 getevent -lc 1 2>&1 | grep KEY_VOLUME > "$TMPDIR/events"
            if [ $((NOW_TIME - START_TIME)) -gt 9 ]; then
                echo "$(translate "⏰ 10秒无输入，默认保留旧频率表。" "⏰ No input detected after 10 seconds, defaulting to keep old frequency table.")"
                # 保留旧频率表，不做任何操作
                break
            elif $(cat $TMPDIR/events 2> /dev/null | grep -q KEY_VOLUMEUP); then
                echo "$(translate "🔼 检测到音量上键，保留旧频率表。" "🔼 Volume Up detected, keeping old frequency table.")"
                # 保留旧频率表，不做任何操作
                break
            elif $(cat $TMPDIR/events 2> /dev/null | grep -q KEY_VOLUMEDOWN); then
                echo "$(translate "🔽 检测到音量下键，替换旧频率表。" "🔽 Volume Down detected, replacing old frequency table.")"
                # 备份旧频率表
                cp -f "$GPU_FREQ_TABLE_TOML_FILE" "$GPU_FREQ_TABLE_TOML_FILE.bak"
                echo "$(translate "💾 旧频率表已备份至" "💾 Old frequency table backed up to") $GPU_FREQ_TABLE_TOML_FILE.bak"
                # 复制新的频率表
                copy_gpu_freq_table
                break
            fi
        done
    else
        # 不存在旧文件，直接复制
        copy_gpu_freq_table
    fi

    echo "$(translate "📊 日志将存储在" "📊 Logs will be stored in") $GPU_LOG"

    # 创建日志等级文件，默认为info级别，如果已存在则不创建
    if [ ! -f "$LOG_LEVEL_FILE" ]; then
        echo "info" > "$LOG_LEVEL_FILE"
        chmod 0666 "$LOG_LEVEL_FILE"
        echo "$(translate "📝 日志等级文件已创建于" "📝 Log level file created at") $LOG_LEVEL_FILE $(translate "（默认：info）" "(default: info)")"
    else
        echo "$(translate "📝 日志等级文件已存在于" "📝 Log level file already exists at") $LOG_LEVEL_FILE"
    fi

    # 复制config.toml配置文件
    if [ -f "$CONFIG_TOML_FILE" ]; then
        echo "$(translate "⚙️ 自定义配置已存在于" "⚙️ Custom config file already exists at") $CONFIG_TOML_FILE"
    elif [ -f "$DEFAULT_CONFIG_FILE" ]; then
        cp -f "$DEFAULT_CONFIG_FILE" "$CONFIG_TOML_FILE"
        chmod 0666 "$CONFIG_TOML_FILE"
        echo "$(translate "⚙️ 自定义配置已创建于" "⚙️ Custom config file created at") $CONFIG_TOML_FILE"
    else
        echo "$(translate "⚠️ 默认自定义配置不存在，跳过创建" "⚠️ Default custom config does not exist, skipping creation")"
    fi

    # 检查游戏列表文件是否已存在
    if [ -f "$GAME_LIST" ]; then
        echo "$(translate "🎮 游戏列表已存在，跳过生成" "🎮 Game list already exists, skipping generation") $GAME_LIST"
    else
        # 生成游戏列表文件
        generate_gamelist
    fi
}

# get module version
module_version="$(grep_prop version "$MODULE_PROP")"
# get module name
module_name="$(grep_prop name "$MODULE_PROP")"
# get module id
module_id="$(grep_prop id "$MODULE_PROP")"
# get module author
module_author="$(grep_prop author "$MODULE_PROP")"

echo ""
echo "🚀 $(translate "$module_name" "$module_id")"
echo "$(translate "👨‍💻 作者：$module_author" "👨‍💻 Author: Seyud @GitHub")"
echo "$(translate "📌 版本：" "📌 Version:") $module_version"
echo ""

# 重要警告提示
echo "⚠️ $(translate "如果在使用过程中出现死机，异常卡顿，可能是电压过低导致，请自行修改电压至适合档位" "If you experience crashes or abnormal lag during usage, it may be caused by voltage being too low. Please adjust the voltage to appropriate levels yourself") ⚠️"
echo ""

echo "$(translate "🔄 正在安装..." "🔄 Installing...")"

install_gov
set_permissions

echo ""
echo "$(translate "👉 欢迎加入调速器测试🐧QQ群：719872309 或 TG群组：https://t.me/MTK_GPU" "👉 Join our Telegram channel: https://t.me/Mediatek_Mali_GPU_Governor")"
echo ""
echo "$(translate "✅ 安装完成！" "✅ Installation completed!")"
