# Packed Assets打包资源数据配置

## 知识点一：Packed Assets介绍

- 基本介绍

  ![image-20231115201901612](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017988.png)

  打包资源

- 作用

  确定如何处理组中的资源

  比如：可以指定一个组生成AB包的位置和包压缩相关的等等设置

## 知识点二：Packed Assets参数介绍

### Content Packing & Loading

- build * Load Paths

  ![image-20231030220700912](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220018670.png)

  - Build & Load Paths

    当前组从哪里加载和打AB包的位置

  - 设置

    ![image-20231030220757501](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220018294.png)

### 重点：Advanced Options

![image-20231030220935472](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220018573.png)

- Asset Bundle Compression

  AB包的**压缩格式**

  - Uncompressed：不压缩，包体大
  - LZ4：压缩，用什么解压什么，内存占用低
  - LZMA：压缩最小，解压慢，用一个资源要解压所有

- Include in Build（一般勾选）

  构建时，当前分组是否打包到AB包里

- Use Asset bundle cache

  是否缓存远程分发的包

- Asset Bundle CRC

  验证包的完整性

  - 不验证
  - 验证，包括缓存的包
  - 验证，不包括缓存的包

- Include Address in Catalog（一般勾选）

  当前组的资源Addressable的**地址字符串**是否包括在目录中

  如果不使用地址加载资产，可以不包括他们，以减少catalog目录的大小（红框框中的地址）

  ![image-20231030221228452](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017000.png)

- Include GUIDs in Catalog

  是否在catalog目录中包含**GUID字符串**

  - 需要包含的情况

    用AssetReferences或者GUID字符串在组中加载资产

  - 不需要包含的情况

    没有使用AssetReferences或者GUID字符串在组中加载资产，可以不包含以减少catalog目录的大小

- Include Labels in Catalog（一般勾选）

  是否在catalog目录中包含**标签字符串**

  如果不使用标签加载资产，可以不包括标签，来减少catalog目录的大小

  ![image-20231030221454273](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017015.png)

- Internal Asset Naming Mode

  如何在内部命名目录中的资源

  ![image-20231030221720972](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017028.png)

  - Full Path：全路径

    ![image-20231030221829752](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017055.png)

  - Filename：文件名

    ![image-20231030221944421](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220018991.png)

  - GUID：资源的guid字符串

  - Dynamic：Addressables根据组中的资源选择最小的内部名称

- Cache Clear Behavior

  确定安装的应用程序何时从缓存中**清除AB包**

  - Clear When Space Is Needed In Cache：在缓存中需要空间时清除
  - Clear When When new Version Loaded：加载新版本时清除

- Bundle Mode（重要）

  打包模式，如何将此组中的资产打包到AB包中

  - Pack Together：一个组一个包

  - Pack Separately：为组中的每个主要资产创建一个包。

    如组中的精灵图片被包装在一起。

    如组中的GameObject中被包装在一起。

  - Pack Together by Label：为共享相**同标签**组合的资产创建一个包

- Asset Load Mode

  **资源加载模式**

  - Requested Asset And Dependencies：请求的资源和依赖项

    加载一个资源，就只加载这个资源和所依赖的资源

  - All Packed Assets And Dependencies：所有包中的资源和依赖项

    加载一个资源，加载这个资源所在包的所有资源

### Content Update Restriction

- Update Restriction

  - Can Change Post Release

    可以改变发行后内容，该模式不移动任何资源，如果包中的任何资源发生了更改，则**重新构建整个包**

  - Cannot Change Post Release

    无法改变发布后内容，如果包中任何资源已经改变，则[检查内容更新限制]工具会将其移动到**为更新创建的新组中**。

    在进行更新构建时，从这个新组创建的AssetBundles中的资产将**覆盖**现有包中的版本。

    简单理解：比如一个组的名为red的资源被更新，则会把这个red资源打包到单独的包中，而不是重新构建red所在的组的包。

### Add Schema（添加模式）

- 说明

  可以将任意数量的架构模式分配给一个组

- 选项

  - Content Packing Loading：内容打包加载相关
  - Content Update Restriction：内容更新限制
  - Resources and Built In Scenes：在内置数据中显示哪些类型的内置资源，可以选择是否显示 资源和内置场景

我们甚至可以通过继承AddressableAssetGroupSchema定义自己的架构模式

## 知识点三：创建自定义的配置

- 创建空白组模板

  ![image-20231115203445212](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220018974.png)

- 给新创建的模板Add Schema

  ![image-20231115203653514](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017184.png)

- 添加组模板到列表中

  ![image-20231115203601297](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017472.png)

- Addressable窗口新建分组时可选我们创建的分组

  ![image-20231115203735208](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311220017153.png)

## 总结

通过Packed Assets我们可以了解到为每一个组设置打包和加载的路径，远程加载还是本地加载，都在组中进行设置
