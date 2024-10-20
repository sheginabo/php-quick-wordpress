#!/bin/bash

# 刪除現有的 WordPress 資料夾（如果存在）
rm -rf ./wordpress

# 下載 WordPress 6.6.x
git clone branch 6.6 https://github.com/WordPress/WordPress.git ./wordpress

## 進入 plugins 目錄
#mkdir -p ./wordpress/wp-content/plugins
#cd ./wordpress/wp-content/plugins
#
## 下載 WooCommerce 9.3.3
#git clone --branch 9.3.3 https://github.com/woocommerce/woocommerce.git
#
## 回到根目錄
#cd ../../../

echo "WordPress & WooCommerce have been successfully downloaded and set up in ./wordpress"