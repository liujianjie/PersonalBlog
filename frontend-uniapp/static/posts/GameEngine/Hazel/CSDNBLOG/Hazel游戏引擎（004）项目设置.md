> 本人菜鸟，文中若有代码、术语等错误，欢迎指正

我写的项目地址：https://github.com/liujianjie/GameEngineLightWeight（中文的注释适合中国人的你）

[toc]

# 前言

- 此节目的

  新建好Hazel和Sandbox项目，Hazel项目生成为dll，Sandbox项目生成为exe，运行此exe通过动态链接Hazel的dll，可以调用dll定义的函数并输出信息。

- Cherno的Hazel项目地址

  https://github.com/TheCherno/Hazel

# 操作步骤+讲解

## GitHub

- 新建空仓库

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343766.png)

- 本地创建Hazel项目

  注意将解决方案和项目不放在同一目录

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161345508.png)

- Github仓库与本地项目关联

  - cmd输入命令克隆项目

    ```cpp
    git clone https://github.com/u/Hazel2
    ```

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343822.png)

  - 将Hazel2文件夹里的文件都**剪切**到sln文件下的目录，然后删除Hazel2文件夹

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343836.png)

## Hazel项目

### 此项目定位

Hazel是我们的引擎核心库，需生成为**dll**文件

然后创建外部应用程序项目生成为exe文件，将Hazel导出的dll**链接到**exe文件中。

### 项目属性修改

- 删除32位的发布平台

- 设置项目配置类型为**dll**

- 调整输出目录和中间目录

  ```
  $(SolutionDir)\bin\$(Configuration)-$(Platform)\$(ProjectName)\
  $(SolutionDir)\bin-int\$(Configuration)-$(Platform)\$(ProjectName)\
  ```


![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343857.png)中间目录:存储一些obj、二进制文件，生成好dll、exe后可以删除此文件夹

## Sandbox项目

### 此项目定位

是exe应用程序

### 项目属性修改

- 删除32位发布平台
- 调整输出目录和中间目录
- 设置项目配置类型为exe应用程序
- 设置为启动目录

![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343970.png)

- **Sandbox项目引用Hazel项目**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161344153.png)

  - 说明

    此引用将会链接Hazel.lib文件。

    **难点：**可Hazel明明设置为dll为什么还是能生成lib文件，因为lib文件中包含从dll文件中导出的所有函数，这样就不用手动从dll文件加载函数或符号。(不懂这含义)

  - 打开项目属性-链接器可以看到链接命令

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343837.png)

    这是视频里的，我本地却没有这行命令。。。

## 写代码

### Hazel项目

- 代码

  Test.h

  ```cpp
  #pragma once
  namespace Hazel {
  	_declspec(dllexport) void Print();
  }
  ```

  Test.cpp

  ```cpp
  #include "Test.h"
  #include <stdio.h>
  
  namespace Hazel {
  	void Print() {
  		printf("Welcome to Hazel Game Engine!\n");
  	}
  }
  ```

- 项目生成

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161344610.png)

### Sandbox项目

- 代码

  application.cpp

  ```cpp
  namespace Hazel {
  	_declspec(dllimport) void Print();
  }
  void main() {
  	Hazel::Print();
  }
  ```

- 项目生成

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161344242.png)

- 运行报错

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161344245.png)

- 解决bug

  由于Sandbox项目**引用**了Hazel项目，而Hazel又是dll文件，所以会报找不到Hazel.dll

  需要将Hazel.dll文件放到Sandbox.exe文件同目录下才行

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343872.png)

- 正确运行结果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161343830.png)





# C++：静态链接与动态链接

阅读的CSDN博客：https://blog.csdn.net/kang___xi/article/details/80210717?spm=1001.2014.3001.5506

- 静态链接

  - 说明

    使用静态库方式链接，编译后链接时会将使用的库函数对应**所包含库函数定义的.o目标文件**都包含在exe文件中。

  - 优点

    执行速度快：因为可执行文件程序内部包含了所有需要执行的东西

  - 缺点

    浪费空间：因为多个可执行程序对同所需要的目标文件**都有一份副本**

    更新慢：如果有一个.o目标文件发生改变，那么对应的使用这个.o目标文件的多个可执行程序需要重新来一遍链接过程，即链接多个.o目标文件来实现生成可执行文件。

- 动态链接

  - 说明

    使用动态库方式链接，编译后因为推迟链接**不会**将使用的库函数对应的**dll文件**都包含在exe文件中，而是在exe运行的时候将dll加载到内存CPU中再链接。

  - 优点

    节省空间：多个可执行程序对同所需要的库函数**共享一份副本**

    更新快：一个源文件发生改变，只需更新编译成dll文件，不用每个可执行程序需要重新来一遍链接过程，因为多个可执行程序在运行时时链接，且共享一份副本

  - 缺点

    启动速度慢：因为每次执行程序都需要链接

  我对此小知识的思考：

  动态链接dll，是将整个dll都加载到内存中，还是说当前可执行文件使用了哪些库函数，将对应的函数定义加载到CPU中。

  问了同学和交流群的人，他们说是整个dll都加载到内存中。