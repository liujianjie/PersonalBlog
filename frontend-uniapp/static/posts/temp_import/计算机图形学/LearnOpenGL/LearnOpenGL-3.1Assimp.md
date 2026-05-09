# 介绍Assimp

- 引入

  3D建模工具(3D Modeling Tool)可以让艺术家创建复杂的形状，并使用一种叫做UV映射(uv-mapping)的手段来应用贴图。

  这些工具将会在导出到模型文件的时候自动生成所有的顶点坐标、顶点法线以及纹理坐标。

- 需要读取这些工具导出的模型文件

  模型的文件格式有很多种，每一种都会以它们自己的方式来导出模型数据，自己写很麻烦。

  有Assimp库专门处理。

## 模型加载库Assimp

![](图片/3.1Assimp/原文/assimp_structure.png)

- 和材质和网格(Mesh)一样，所有的场景/模型数据都包含在Scene对象中。Scene对象也包含了场景根节点的引用。
- 场景的Root node（根节点）可能包含子节点（和其它的节点一样），它会有一系列指向场景对象中mMeshes数组中储存的网格数据的索引。Scene下的mMeshes数组储存了真正的Mesh对象，节点中的mMeshes数组保存的只是场景中网格数组的索引。
- 一个Mesh对象本身包含了渲染所需要的所有相关数据，像是顶点位置、法向量、纹理坐标、面(Face)和物体的材质。
- 一个网格包含了多个面。Face代表的是物体的渲染图元(Primitive)（三角形、方形、点）。一个面包含了组成图元的顶点的索引。由于顶点和索引是分开的，使用一个索引缓冲来渲染是非常简单的。
- 最后，一个网格也包含了一个Material对象，它包含了一些函数能让我们获取物体的材质属性，比如说颜色和纹理贴图（比如漫反射和镜面光贴图）。

> **Mesh网格**
>
> 当使用建模工具对物体建模的时候，艺术家通常不会用单个形状创建出整个模型。通常每个模型都由几个子模型/形状**组合**而成。组合模型的每个**单独的形状**就叫做一个网格(Mesh)。
>
> 比如说有一个人形的角色：艺术家通常会将头部、四肢、衣服、武器建模为分开的组件，并将这些网格组合而成的结果表现为最终的模型。一个网格是我们在OpenGL中绘制物体所需的**最小单位**（顶点数据、索引和材质属性）。一个模型（通常）会包括**多个网格**。

# Assimp生成与使用

## cmake编译assimp

- github网址

  https://github.com/assimp/assimp/tree/v3.3.1

  找到release版本

- 下载安装包

  ![](图片/3.1Assimp/0.1GitHub的release.png)

- 用cmake

  前提得有dx环境

  - 选择源码路径

    选择生成sln项目路径

    配置2019版本

    ![](图片/3.1Assimp/0.2.构建cmake选择版本.png)

  - 点击generate

    ![](图片/3.1Assimp/0.3.构建cmake.png)

  - 打开build文件夹下的sln

    生成解决方案

    ![](图片/3.1Assimp/0.4构建生成.png)

  - 生成**dll与lib**

    ![](图片/3.1Assimp/1.3构建生成dll.png)

    ![](图片/3.1Assimp/1.4构建生成lib.png)

## 其他项目使用assimp库

- 移动assimp的include到项目下vendor/Assimp下

  ![](图片/3.1Assimp/1.5assimp的include.png)

  ![](图片/3.1Assimp/1.5.2移动assimp的include.png)

  

- 项目包含include目录

  ![](图片/3.1Assimp/1.5.3包含assimp的include.png)

- 使用assimp的头文件

  ```cpp
  #include <assimp/Importer.hpp>
  #include <assimp/scene.h>
  #include <assimp/postprocess.h>
  ```

- 运行，报错，缺少文件

  ![](图片/3.1Assimp/1.6assimp的文件需要includeconfig.png)

  进入cmake编译的build文件夹下，找到include/config.h头文件，复制到项目的vendor/assimp/include/assimp下

  ![](图片/3.1Assimp/1.7assimp的includeconfig.png)

- 写入以下代码并运行

  ```cpp
  Assimp::Importer importer;
  const aiScene* scene = importer.ReadFile("assest/model/nanosuit/nanosuit.obj", aiProcess_Triangulate | aiProcess_FlipUVs);
  ```

  报错，无法找到解析符号，因为cpp中使用了assimp头文件中声明的的函数，却没找到**函数的定义**

  ![](图片/3.1Assimp/1.8无法解析.png)

- 将第一步生成的lib文件拷贝到vendor/Assimp/bin下

  ![](图片/3.1Assimp/2.1移动lib.png)

- 项目附加库目录

  ![](图片/3.1Assimp/2.2附加库目录.png)

- 项目附加依赖项

  ![](图片/3.1Assimp/2.3.附加依赖项.png)

- 运行

  会报无法找到dll。因为assimp生成动态库，会生成lib和dll两个文件，lib存的是dll的函数信息以及其在dll的位置

  ![](图片/3.1Assimp/4.0无法找到dll.png)

- 将第一步生成的dll拷贝到exe文件夹下

  ![](图片/3.1Assimp/4.1移动dll.png)


