# 理论：资源打包

## 知识点一：资源打包指的是什么

- 原先

  需要手写代码或者工具进行打包

- 现在addressbale

  此打AB包过程自动化了

- 如何使用AB包

  1. 和游戏安装包放一起
  2. 将AB包放远程，发布游戏时只打包必备资源到包中（更好：减小包体，热更新）

## 知识点二：资源打包的模式

一个组有3个模式

1. Pack Together：创建包含组中所有资产的单个包
2. Pack Separately：为组中的每个类型的资源创建一个包。精灵、预制体
3. Pack Together by label：为共享相同标签组合的资产创建一个包

## 知识点三：资源打包的注意事项

- 场景资源始终有自己**单独的包**

  即：一个组中有场景资源和普通资源时，场景资源和其它资源始终被分开打包。

- 资源依赖的注意事项

  1. 资源c被a所在的A、b所在的B包引用
  2. 这样A包有a、c，B包也有b，c，造成资源重复
  3. 好的解决方法是：将**资源c打一个包**

  资源c如果是图集，应该被重视，不同包的内容使用同一个图集中的图片时，需要一个专门的图集包。

# 应用：资源打包(本地 )

## 知识点一：编辑器中资源加载的几种方式

- Use Asset Database（fastest）

  不用打AB包，直接本地加载资源，主要用于开发功能时和学习

- Simulate Groups（advanced）

  - 不用打AB包
  - 通过ResourceManager从资产数据库加载资产，就像通过AB包加载一样，通过引入时间延迟，模拟远程AB包的下载速度和本地AB包加载速度

- Use Existing Build（requires built groups）

  - 需打AB包
  - 会从AB包中加载资源

## 知识点二：本地资源发布

- 代码

  ```c#
      void Start()
      {
          Addressables.LoadAssetsAsync<GameObject>(new List<string>() { "Cube", "SD" }, (obj) =>
          {
              Instantiate(obj);
          }, Addressables.MergeMode.Intersection);
      }
  ```

## 本地发布

组设置

每个组都可以选择打包路径和加载路径

![image-20231120220544322](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110026004.png)

### 打包：使用默认设置

- 说明

  当发布应用程序时，会自动帮我们将AB包放入StreamingAssets文件夹中

- 如下

  ![image-20231120222024350](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110026947.png)

  ![image-20231120221458016](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110026587.png)

  ![image-20231120223441432](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110026980.png)

### 打包：**修改**组的默认的本地构建和加载路径

- 说明

  打包时：不会自动将AB包放入StreamingAssets文件夹中，需要**手动放入**

- 缺少AB包的步骤

  1. 修改组的设置

     ![image-20231120222300915](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027100.png)

     ![image-20231120222310768](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027290.png)

  2. 打AB包

     ![image-20231120222354164](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027058.png)

  3. **重新构建应用程序**

     查看streamingassets

     ![image-20231120222557892](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027331.png)

     （缺少ab包，运行构建的exe程序，加载不了物体，但我测试新版的应该也可以加载）

- 需补充一步

  1. **手动复制AB包**Unity的Project窗口下的StreamingAssets文件夹下

     ![image-20231120223158949](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027635.png)

  2. **重新构建应用程序**

     可以看到生成link.xml、catelog.json、settings.json 3个文件到streamingassets中

     ![image-20231120223249921](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027173.png)

  3. 运行才正确

     ![image-20231120223314120](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202312110027851.png)
