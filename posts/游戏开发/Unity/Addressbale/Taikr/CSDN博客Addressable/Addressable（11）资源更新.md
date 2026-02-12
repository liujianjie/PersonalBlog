# 资源更新

> 此节概要：为实现AB包热更，Addressable提供两种AB包热更策略，此节就探讨这两种方式的优劣与具体实现

## 知识点一：资源更新指的是什么？

- 对于游戏开发者

  当项目正式发布后，对于远程加载的资源，可以通过改变**资源服务器**上的AB包内容来达到更新游戏的目的。

- 对于游戏玩家

  能加载得到游戏开发者更新的最新资源

- 在打包好了的程序，什么代码负责去加载最新资源

  Addressables会自动帮助我们判断哪些资源更新了，并加载最新的内容

## 知识点二：内容更新限制参数回顾

- 位置

  每个组的Inspector窗口的最后一个Content Update Restriction

  ![image-20231123224906538](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172357794.png)

- 参数解析

  - Can Change Post Release

    1. 可以改变发行后内容

    2. 该模式不移动任何资源

    3. 如果此包中的任何资源发生了更改，则重新构建**当前**整个包

       （哪个包资源改变了则重新构建这个AB包，不是所有的AB包）

  - Cannot Change Post Release

    1. 无法改变发布后内容
    2. 如果当前包中任何资源已经改变，则[检查内容更新限制]工具会将其移动到为更新创建的**新组**中。
    3. 在进行更新构建时，从这个新组创建的AssetBundles中的**资产**将**覆盖**现有包中的资产版本。

## （知识点三与四前置操作）

- Demo代码

  ```csharp
          Addressables.LoadAssetsAsync<GameObject>(new List<string>() { "Cube", "SD" }, (obj) =>
          {
              Instantiate(obj, new Vector3(0,0,0), Quaternion.identity);
          }, Addressables.MergeMode.Intersection);
  ```

  把代码类拖到场景的GameObject上

- 开启Addressables Hosting

  ![image-20231124001850584](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172357081.png)

  ![image-20231124001924867](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172357600.png)

## 知识点三：整个AB包更新 Can Change Post Release

### 相关解释

整包更新指，某一个分组里的资源发生变化后，我们需要将其当前整体分组进行打成一个AB包

- 优点

  这种方式比较适用于大范围资源更新时使用

- 坏处

  玩家需要下载一个包含很多的资源的AB包，内容较大，比较耗时耗流量

### 打《底包》步骤

- GameObject分组设置

  ![image-20231124222032065](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358048.png)

  上图：目标GameObject分组

  ![image-20231124002001976](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358512.png)

  上图：设置成加载此分组的资源从远程服务器加载

  ![image-20231124001542024](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358264.png)

  上图：设置更新策略

- 打AB包，运行Default Build Script

  ![image-20231124002259450](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358744.png)

  ![image-20231124223514045](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358929.png)

- **构建应用程序**

  ![image-20231124004014543](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358480.png)

- 运行

  ![image-20231124004018568](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358761.png)

### 打《热更AB包》并加载步骤

- 将GameObject分组中的Cube的胶囊，换成其它

  - 替换前

    ![image-20231124004249050](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358217.png)

  - 替换后

    ![image-20231124224857543](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358449.png)

    将原本加载Capsule.Prefab,替换成加载Sphere.prefab

- 更新资源

  ![image-20231124004552769](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358992.png)

  点击Update a Previous Build后，需要选择上一次打包的信息对比，才能决定哪些是新增的

  ![image-20231124004720288](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358336.png)

  更新GameObject分组的AB包结果如下：

  ![image-20231124223626294](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358689.png)

  - 当前是Unity的模拟服务器（Addressables Hosting）

    不用将新打的各个文件拷贝到某个服务器的位置，因为当前ServerData目录就是Exe程序要访问的服务器位置

  - 如果是真正的远程服务器

    需要将新打的各个文件**拷贝**到服务器的目录

- 运行第一步：打《底包》构建好了的exe程序

  - 如果是Unity的模拟服务器

    - 加载成功情况：替换成加载出Sphere.prefab

    - 加载失败情况：不显示

      因为Unity Adressable hosting有坑，如果失败，请看下面替换解决方案

  - 失败的解决方案

    1. 记录Addressable hosting的Ip和端口后关闭

       172.24.16.1:58474

       ![image-20231124012431253](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358832.png)

    2. 在本地用[HFS](https://github.com/rejetto/hfs/releases/tag/v0.49.2)(https://github.com/rejetto/hfs/releases/tag/v0.49.2)搭建一个本地服务器

       上传打的热更AB包，并将访问路径设置为172.24.16.1:58474

       - 设置端口

         ![image-20231124012854548](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358376.png)

       - 设置ip

         ![image-20231124013039990](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358328.png)

       - 上传两次打的AB包及相关文件

         ![image-20231124224137422](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358099.png)

       - 网页访问172.24.16.1:58474，测试是否有上传文件

         ![image-20231124224223600](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172358194.png)

         有，代表上传文件成功

    3. 重新运行应用程序，应能加载成功，加载成Sphere

       ![image-20231124224414451](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359050.png)

## 知识点四：局部更新 Cannot Change Post Release

### 操作相关

在知识点3的基础上使用局部更新打**《热更AB包》**

1. 修改GameObject分组设置

   ![image-20231124224701689](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359404.png)

2. 修改GameObject分组的资源

   - 修改前

     ![image-20231124224901520](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359529.png)

   - 修改后

     ![image-20231124225439727](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359642.png)

3. 生成局部分组

   - 使用工具检查内容更新

     ![image-20231124225513948](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359793.png)

     选择上次打包文件

     ![image-20231124225530690](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359411.png)

   - 选择更新的内容，并应用

     ![image-20231124225617525](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359425.png)

   - 得到Content Update分组

     ![image-20231124225637970](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359306.png)

4. 得到热更AB包

   - 更新前

     ![image-20231124230151241](/PersonalBlog/images/%e6%b8%b8%e6%88%8f%e5%bc%80%e5%8f%91/Unity/Addressbale/Taikr/CSDN%e5%8d%9a%e5%ae%a2Addressable/Addressable%ef%bc%8811%ef%bc%89%e8%b5%84%e6%ba%90%e6%9b%b4%e6%96%b0/image-20231124230151241.png)

   - 选择build-update a preivous build后

     ![image-20240217231229097](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359562.png)

     选择上一次的生成文件

     ![image-20231124230435271](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359477.png)

     选择后

     ![image-20231124230411405](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359758.png)

5. 在Addressables Hosting环境下可以直接运行之前打的exe底包

   ![image-20231124232142406](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359261.png)

### 前辈讲解视频中此更新AB包操作

- 前辈所说

  1. 视频中更新AB包的操作只能适合小型项目，**不适合大型**项目。
  2. 最好不使用Addressable的提供此AB包**局部内容**更新的方式，需要自己写AB包内容更新策略

- 只记得前辈说的缺点

  1. 会新增一个分组

     让项目分组混乱

     ![image-20231124233641918](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202402172359260.png)

  2. 还会搞出其它很多问题

- 前辈所说的自己写AB包内容更新策略方法简略（记不太清了，后续修改）

  1. 不用局部更新，每次都给所有分组打完整的AB包

  2. 有一个版本号来判断玩家应用程序是否需要更新AB包

     用玩家手机上已有的AB包与服务器的所有AB包对比

  3. 当检测到本地**已有**的AB包，就不要下载

  4. 当检测到本地**没有**的AB包，就要下载

## 简单讲解强更与热更

- 引入

  游戏发了一个整包1.0版本，开发者想更新游戏内容。

- 强更

  版本号从1.2（1.x）版本升级到2.0版本

  - 什么情况需要强更（个人拙见，有其它情况未遇到或想到）

    - 当开发者更新的内容涉及主工程代码则必须强更

    - 更新的资源太大必须强更

      以免热更太大，导致玩家等太久或者版本管理混乱。

  - 玩家需要干什么

    玩家需要重新下载完整的安装包(600M)并重新安装游戏

- 热更

  更新的游戏内容只有：资源、热更dll这些资源，这些资源需要重新打热更AB包并同步更新到玩家的手机上

  （而此节所讲的整包更新、局部更新则是应用在这：更新资源改动的AB包并同步给玩家的手机上）

  - 比如要更新的资源

    - 资源

      给游戏添加中秋节活动主题的内容

    - 热更dll

      游戏代码出现小问题，并且此代码处于热更工程。

  - 玩家需要干什么

    玩家手机的应用程序不用重新下载完整的安装包（600M需重新安装游戏），只需由游戏自动下载最新的AB包（10M左右且不用重新安装游戏）即可给玩家手机上实现资源更新和热更代码更新。
