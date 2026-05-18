> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  由于项目中的头文件或者cpp文件都包含着c++的头文件，有些**重复**，可以将它们包含的c++头文件放在一个头文件内，这样不仅使代码**简洁**，而且预编译头可以**加快编译速度**。

# 如何实现

- src文件夹下创建hzpch类

  hzpch.h

  ```
  #pragma once
  
  #include <iostream>
  #include <memory>
  #include <utility>
  #include <algorithm>
  #include <functional>
  
  #include <string>
  #include <sstream>
  #include <vector>
  #include <unordered_map>
  #include <unordered_set>
  
  #ifdef HZ_PLATFORM_WINDOWS
  #include <Windows.h>
  #endif
  ```

  hzpch.cpp

  ```cpp
  #include "hzpch.h"
  ```

- 修改premake

  ```lua
  project "Hazel"		--Hazel项目
  	location "Hazel"--在sln所属文件夹下的Hazel文件夹
  	kind "SharedLib"--dll动态库
  	language "C++"
  	targetdir ("bin/" .. outputdir .. "/%{prj.name}") -- 输出目录
  	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")-- 中间目录
  
  	-- 预编译头 
  	pchheader "hzpch.h"
  	pchsource "Hazel/src/hzpch.cpp"
  ```

- 在每个cpp文件的顶部引入hzpch.h文件,不然报错

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112012810.png)

- 重新生成后，premake预编译头设置的对应效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112012814.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112012783.png)

  