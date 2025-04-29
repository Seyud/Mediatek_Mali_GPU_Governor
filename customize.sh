#!/system/bin/sh

on_install() {
    # use universal setup.sh
    sh "$MODPATH"/script/setup.sh 2>&1
    [ "$?" != "0" ] && abort

    # use once
    rm "$MODPATH"/script/setup.sh
    rm "$MODPATH"/customize.sh
}
set_permissions() {
    set_perm_recursive "$MODPATH" 0 0 0755 0644
    chmod 755 "$MODPATH"/bin/*
    chmod 755 "$MODPATH"/*.sh
    chmod 755 "$MODPATH"/script/*.sh
}
set_permissions
on_install
