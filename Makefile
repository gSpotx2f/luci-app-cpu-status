#
# Copyright (C) 2025 gSpot (https://github.com/gSpotx2f/luci-app-cpu-status)
#
# This is free software, licensed under the MIT License.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-cpu-status
PKG_VERSION:=0.6.1
PKG_RELEASE:=1
LUCI_TITLE:=CPU utilization info for the LuCI status page
LUCI_PKGARCH:=all
PKG_LICENSE:=MIT

#include ../../luci.mk
include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
