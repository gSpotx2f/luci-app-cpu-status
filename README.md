# luci-app-cpu-status
CPU utilization info for the LuCI status page (OpenWrt webUI).

OpenWrt >= 21.02.

Lite version: [luci-app-cpu-status-mini](https://github.com/gSpotx2f/luci-app-cpu-status-mini).

## Installation notes

**OpenWrt >= 25.12:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status-0.6.2-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-cpu-status-0.6.2-r1.apk
    apk --allow-untrusted add /tmp/luci-app-cpu-status-0.6.2-r1.apk
    rm /tmp/luci-app-cpu-status-0.6.2-r1.apk
    service rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-ru-0.6.2-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-cpu-status-ru-0.6.2-r1.apk
    apk --allow-untrusted add /tmp/luci-i18n-cpu-status-ru-0.6.2-r1.apk
    rm /tmp/luci-i18n-cpu-status-ru-0.6.2-r1.apk

**OpenWrt <= 24.10:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status_0.6.2-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-cpu-status_0.6.2-r1_all.ipk
    opkg install /tmp/luci-app-cpu-status_0.6.2-r1_all.ipk
    rm /tmp/luci-app-cpu-status_0.6.2-r1_all.ipk
    service rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-ru_0.6.2-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-cpu-status-ru_0.6.2-r1_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-ru_0.6.2-r1_all.ipk
    rm /tmp/luci-i18n-cpu-status-ru_0.6.2-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-status/blob/master/screenshots/01.jpg)

## Related LuCI applications:

CPU performance: [https://github.com/gSpotx2f/luci-app-cpu-perf](https://github.com/gSpotx2f/luci-app-cpu-perf).
