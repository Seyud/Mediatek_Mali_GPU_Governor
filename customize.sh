#!/system/bin/sh

on_install() {
    sh "$MODPATH"/script/setup.sh 2>&1
    [ "$?" != "0" ] && abort

    rm "$MODPATH"/script/setup.sh
    rm "$MODPATH"/config/
}
set_permissions() {
    set_perm_recursive "$MODPATH" 0 0 0755 0644
    chmod 755 "$MODPATH"/bin/*
    chmod 755 "$MODPATH"/*.sh
    chmod 755 "$MODPATH"/script/*.sh
}
set_permissions
on_install
