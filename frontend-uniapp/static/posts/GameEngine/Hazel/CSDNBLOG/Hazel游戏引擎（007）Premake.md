> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  由于之前配置VS项目各项属性需要根据不同平台**手动**一个一个设置，很麻烦，缺乏灵活性。

  用lua脚本配置项目属性，使用premake运行程序**一键生成**VS项目及属性，更灵活简便

# 操作步骤

## premake

- 下载

  github下载网址：https://github.com/premake/premake-core

  点击tag的release，下载zip文件，解压出来是exe文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306111855003.png)

- 移动exe文件到sln文件下的vendor/bin/premake下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306111855652.png)

## 写lua脚本文件

- 关于premake如何使用，可以访问wiki

  https://github.com/premake/premake-core/wiki

- 脚本文件

  在sln文件夹下，新建premake5.lua文件，并写下项目配置

  ```lua
  workspace "Hazel"		-- sln文件名
  	architecture "x64"	
  	configurations{
  		"Debug",
  		"Release",
  		"Dist"
  	}
  -- https://github.com/premake/premake-core/wiki/Tokens#value-tokens
  -- 组成输出目录:Debug-windows-x86_64
  outputdir = "%{cfg.buildcfg}-%{cfg.system}-%{cfg.architecture}"
  
  project "Hazel"		--Hazel项目
  	location "Hazel"--在sln所属文件夹下的Hazel文件夹
  	kind "SharedLib"--dll动态库
  	language "C++"
  	targetdir ("bin/" .. outputdir .. "/%{prj.name}") -- 输出目录
  	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")-- 中间目录
  
  	-- 包含的所有h和cpp文件
  	files{
  		"%{prj.name}/src/**.h",
  		"%{prj.name}/src/**.cpp"
  	}
  	-- 包含目录
  	includedirs{
  		"%{prj.name}/vendor/spdlog/include"
  	}
  	-- 如果是window系统
  	filter "system:windows"
  		cppdialect "C++17"
  		-- On:代码生成的运行库选项是MTD,静态链接MSVCRT.lib库;
  		-- Off:代码生成的运行库选项是MDD,动态链接MSVCRT.dll库;打包后的exe放到另一台电脑上若无这个dll会报错
  		staticruntime "On"	
  		systemversion "latest"	-- windowSDK版本
  		-- 预处理器定义
  		defines{
  			"HZ_PLATFORM_WINDOWS",
  			"HZ_BUILD_DLL"
  		}
  		-- 编译好后移动Hazel.dll文件到Sandbox文件夹下
  		postbuildcommands{
  			("{COPY} %{cfg.buildtarget.relpath} ../bin/" .. outputdir .. "/Sandbox")
  		}
  	-- 不同配置下的预定义不同
  	filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		optimize "On"
  
  project "Sandbox"
  	location "Sandbox"
  	kind "ConsoleApp"
  	language "C++"
  
  	targetdir ("bin/" .. outputdir .. "/%{prj.name}")
  	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")
  
  	files{
  		"%{prj.name}/src/**.h",
  		"%{prj.name}/src/**.cpp"
  	}
  	-- 同样包含spdlog头文件
  	includedirs{
  		"Hazel/vendor/spdlog/include",
  		"Hazel/src"
  	}
  	-- 引用hazel
  	links{
  		"Hazel"
  	}
  
  	filter "system:windows"
  		cppdialect "C++17"
  		staticruntime "On"
  		systemversion "latest"
  
  		defines{
  			"HZ_PLATFORM_WINDOWS"
  		}
  
  	filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		optimize "On"
  ```

## 执行premake.exe文件

- cmd

  ```cmd
  vendor\bin\premake\premake5.exe vs2019
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306111855646.png)

- 写成.bat文件

  新建GenerateProjects.bat文件放在.sln文件同文件夹下

  ```cmd
  call vendor\bin\premake\premake5.exe vs2019
  PAUSE
  ```

  双击运行和cmd一样效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306111855098.png)

## 效果

右键Hazel项目与Sandbox项目属性，能看到都选项都配置好了

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306111855376.png)
