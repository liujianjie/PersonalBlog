# AddressableAssetSettings数据设置_参数相关

## 知识点一：配置文件有哪些

- AssetGroups

  ![image-20231030212513549](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220013350.png)

  如图所示分组对应

- AssetGroupTemplates

  ![image-20231030212545009](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015269.png)

  资源组的模板

- Window

  ![image-20231030212621805](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015060.png)

  记录保存当前打包AB到指定平台的东西（为了下次打包对比）

- AddressableAssetSettings

## 知识点二：AddressableAssetSettings解释

- Diagnostics

  ![image-20231030212728886](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220016259.png)

  点击第一个SendProfilerEvents，开启

  ![image-20231030212839500](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015280.png)

- Catalog

  ![image-20231030212958185](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015278.png)

  - Player Version Override

    catalog的版本，用来区分

  - Compress local catalog

    是否压缩

  - Optimize catalog size

    优化大小，可能会去除空格换行，降低阅读性

- Downloads

  ![image-20231030214308082](../assets/image-20231030214308082.png)

  Catalog Download Timeout：等待目录文件下载的时间

- Content Update

  ![image-20231030213052850](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015274.png)

  - Build Remote Catalog

    ![image-20231030213117234](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015315.png)

    当AB包被设置成为远端服务器打包和加载此AB包，最好勾上此选项。
    勾选后会打包，除了会生成一个bundleAB包文件，还会生成一个json、一个hash目录来对此bundle进行加载和更新。
    
    - build load paths
    
      打包和加载路径
    
      ![image-20231030213159339](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220016013.png)

- Buid And Play Mode Scripts

  打包、播放时加载的Ab包的脚本

  ![image-20231030213344332](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220015738.png)

- Asset Group Templates

  创建分组时候，选择的打包脚本模板


## 知识点三：总结AddressableAssetSettings 可寻址资源设置

- 简介

  对可寻址相关功能进行设置

- 大概分为

  1. 概述配置——决定了路径配置相关
  2. 诊断相关——决定了调试相关
  3. 目录相关——决定目录后缀等内容
  4. 内容更新相关——决定了更新相关方案
  5. 构建和编辑器模式脚本相关——决定了测试方案
  6. 资源组模板——决定了创建组时的配置模板
