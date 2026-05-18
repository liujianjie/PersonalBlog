> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了使用OpenGL，而OpenGL的函数定义在显卡中，大多数函数的**定义位置**都无法在编译时确定下来，所以需要在**运行时**查询，需要使用GLAD库在**运行时**获取OpenGL函数地址并将其保存在函数指针中供程序运行时使用。

- Glad在线服务网址

  [https://glad.dav1d.de/](https://glad.dav1d.de/)

# Glad解读

Glad作用：**运行时**获取OpenGL函数地址并将其保存在函数指针中供以后使用（一个函数对应一个函数指针）。

- glad.h

  以OpenGL的一个glGenBuffers函数举例

  声明函数指针，并用宏定义**重命名**函数指针

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341141.png)

  PFNGLGENBUFFERSPROC是**函数指针名称**

- glad.C

  获取OpenGL函数地址来**定义**函数指针

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341689.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341721.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341739.png)

- 所以使用宏定义glGenBuffers，就相当于调用了在显卡里相对应定义的OpenGL函数

# 步骤

## Glad作为项目配置

- 在线glad选项

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341758.png)

- 下载zip

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341738.png)

- 解压到Hazel/vendor/Glad中

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341710.png)

- 给Glad添加premake

  ```lua
  project "Glad"
  	kind "StaticLib"
  	language "C"
  	staticruntime "off"
  
  	targetdir ("bin/" .. outputdir .. "/%{prj.name}")
  	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")
  
  	files{
  		"include/glad/glad.h",
  		"include/KHR/khrplatform.h",
  		"src/glad.C",
  	}
  	includedirs{
  		"include" -- 为了glad.c直接#include <glad/glad.h>，而不用#include <include/glad/glad.h>
  	}
  
      filter "system:windows"
          systemversion "latest"
          staticruntime "On"
  
      filter { "system:windows", "configurations:Release" }
          buildoptions "/MT"
  
  ```

- 修改解决方案的premake

  ```cpp
  -- 包含相对解决方案的目录
  IncludeDir = {}
  IncludeDir["GLFW"] = "Hazel/vendor/GLFW/include"
  IncludeDir["Glad"] = "Hazel/vendor/Glad/include"
  
  include "Hazel/vendor/GLFW"
  include "Hazel/vendor/Glad"
  project "Hazel"		--Hazel项目
      -- 包含目录
  	includedirs{
  		"%{prj.name}/src",
  		"%{prj.name}/vendor/spdlog/include",
  		"%{IncludeDir.GLFW}",
  		"%{IncludeDir.Glad}"
  	}
  	links { 
  		"GLFW",
  		"Glad",-- Glad.lib库链接到Hazel项目中
  		"opengl32.lib"
  	}
  	-- 如果是window系统
  	filter "system:windows"
  		-- 预处理器定义
  		defines{
  			"HZ_PLATFORM_WINDOWS",
  			"HZ_BUILD_DLL",
  			"HZ_ENABLE_ASSERTS",
  			"GLFW_INCLUDE_NONE" -- 让GLFW不包含OpenGL
  		}
  ```

## 更改项目

- Application

  ```cpp
  // #include <GLFW/glfw3.h>
  #include <glad/glad.h>
  ......
  // run中使用了opengl函数
  glClearColor(1, 0, 1, 1);
  glClear(GL_COLOR_BUFFER_BIT);
  ......
  ```

- WindowsWindow.cpp

  ```cpp
  #include <glad/glad.h>
  static bool s_GLFWInitialized = false;
  void WindowsWindow::Init(const WindowProps& props)
  {
      ......
      // 2.1window创建窗口
      m_Window = glfwCreateWindow((int)props.Width, (int)props.Height, m_Data.Title.c_str(), nullptr, nullptr);
      // 设置glfw当前的上下文
      glfwMakeContextCurrent(m_Window);
      ///////////////////////////////////////////////////////////////////////////////////////////////
      // 重点在这，在运行时获取OpenGL函数地址并将其保存在函数指针中供以后使用//////////////////////////////////
      int status = gladLoadGLLoader((GLADloadproc)glfwGetProcAddress);
      HZ_CORE_ASSERT(status, "初始化Glad失败");
      // 测试使用OpenGL函数
      unsigned int id;
      glGenBuffers(1, &id);
  ```

- 使用OpenGL函数效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306182341732.png)