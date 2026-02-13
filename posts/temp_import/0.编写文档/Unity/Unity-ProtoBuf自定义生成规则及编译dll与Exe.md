# ProtoBuf

## 基本介绍

- 参考文章

  https://fungusfox.gitee.io/protobuf%E7%AC%AC%E4%BA%8C%E5%BC%B9/

- 基本介绍

  **Protocol buffers**是一种可以将自定义的结构体序列化(反序列化)成字符流(byte[])的中间工具。

  对比**Json**、**XML**、**二进制**，在序列化速度上更快，占用内存上更小，但相对而言操作更麻烦。

  由于Proto工具提供的语言支持，支持用户可以在不同的语言中对同样数据结构进行序列化和反序列化。

- 本文目的

  下载Protobuf开源库，编译生成使用**C#语言**序列化和反序列化对应所需的dll（Google.Protobuf.dll）和应用程序（protoc.exe）

## ProtoBuf导入到本地

1. 打开开源地址：https://github.com/protocolbuffers/protobuf/

2. 点击Release

   ![image-20231108212141200](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333058.png)

3. 下载zip

   ![image-20231108212155607](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333894.png)

   ![image-20231108212206671](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334386.png)

4. 本地解压

   ![image-20231108212314588](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334545.png)

# 编译得到Google.Protobuf.dll

1. 进入protobuf-25.0\protobuf-25.0\csharp\src

2. 打开解决方案

   ![image-20231108221139323](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334049.png)

3. 编译生成

   ![image-20231108221600759](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333604.png)

4. 会得到目标dll

   ![image-20231108221650745](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333583.png)

# 编译得到Protoc.exe可执行文件

## CMake编译ProtoBuf成Visual Studio

### 基本配置

1. 本地安装CMake

   https://cmake.org/

   ![image-20231108212525030](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333603.png)

2. 打开CMake，配置ProtoBuf CMake工程路径和要生成的visual studio解决方案路径

   ![image-20231108212732511](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333706.png)

3. 点击Configure，配置要生成的vs解决方案版本，并点击finish

   ![image-20231108212826179](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334826.png)

### 解决Finish后的错误

#### 报错1及解决：googletest

- 报错信息

  ```tex
   Cannot find third_party/googletest directory that's needed to build tests.
    If you use git, make sure you have cloned submodules:
  git submodule update --init --recursive
    If instead you want to skip tests, run cmake with:
      cmake -Dprotobuf_BUILD_TESTS=OFF
  Call Stack (most recent call first):
    CMakeLists.txt:336 (include)
  ```

- 如何解决

  - 编辑根目录下的cmakelists.txt文件

    ![image-20231108214212214](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333618.png)

  - 定位到protobuf_BUILD_TESTS可选项

    ![image-20231108214252006](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333035.png)

  - 将ON改成OFF

    ![image-20231108214312060](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334226.png)

  - 点击CMake的File菜单，删除缓存，再重新生成

    ![image-20231108215145281](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333148.png)

- 说明

  下载的protobuf.zip包中不含googletest子模块，而cmakelist.txt又设置为去编译googletest，简单做法通过宏设置不要编译googletest

#### 报错2及解决：abseil-cpp

- 报错信息

  ```tex
  protobuf_ABSL_PROVIDER is "module" but ABSL_ROOT_DIR is wrong
  Call Stack (most recent call first):
    CMakeLists.txt:294 (include)
  CMake Error at third_party/utf8_range/CMakeLists.txt:31 (add_subdirectory):
    The source directory
      G:/workspace/0.TestProject/protobuf-25.0/protobuf-25.0/third_party/abseil-cpp
    does not contain a CMakeLists.txt file.
  ```

- 如何解决

  - Cmd进入\protobuf-25.0\third_party文件夹下

    ![image-20231108215733744](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333710.png)

  - 输入命令(本机需要有Git)

    ```git
    git clone https://github.com/abseil/abseil-cpp
    ```

    克隆abseil-cpp仓库

    ![image-20231108215920563](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333764.png)

  - 再重新生成即可

- 说明

  编译protobuf的CMake设置变成IDE(Visual studio)的工程，abseil-cpp默认包含在CMake转换目标工程的列表中，但是下载的protobuf zip包中不含这个仓库，所以需要手动下载此仓库

## Visual Studio生成exe基本操作

1. 打开生成的visual studio工程解决方案

   ![image-20231108220454019](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334585.png)

2. 可选：对csharp_reflection_class.cc文件将proto文件生成cs的代码根据需求修改

   ![image-20231108222527467](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333241.png)

3. 对protoc项目进行生成

   ![image-20231108220657421](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333573.png)

   等待3 4分钟左右

   ![image-20231108221334454](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333950.png)

4. 会在解决方案的当前目录生成Debug/exe应用程序

   ![image-20231108221311685](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333023.png)


## 使用Protoc.exe编译Proto文件成C#文件

- 进入protobuf-25.0\Visual studio\Debug文件夹

  新建user.proto文件

  ```protobuf
  syntax = "proto3";//标明proto版本
   
  package protobuf;//包名
  
  message user {
    int32 userid = 1;               
    string name = 2;
    repeated string schools = 4;
  }
  ```

  ![image-20231108223025339](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334178.png)

- cmd.exe执行命令

  ```tex
  protoc.exe user.proto --csharp_out=./
  ```

  ![image-20231108223551298](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333971.png)

- 查看生成的c#文件

  ![image-20231108224156683](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333142.png)

  红框对应第2步：对csharp_reflection_class.cc文件将proto文件生成cs的代码根据需求修改

# 操作过程中的其它报错

- 报错信息

  ```tex
  无法找到 global.json 指定的 .NET SDK 版本“7.0.202”,请检查是否已安装指定的
  ```

- 如何解决

  - cmd 输入dotnet --info

    ![image-20231108213829463](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082334507.png)

  - 打开protobuf文件夹下的global.json

    ![image-20231108213853454](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333728.png)

  - 将里面的版本改成7.0.100

    ![image-20231108213946780](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333744.png)

    改成

    ![image-20231108213956993](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311082333761.png)

    7.0.100对应cmd查看本机的dotnet版本
