> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了有窗口效果，但不想使用原生的window32写起，所以用glfw窗口库。

  也为了完成008计划事件系统的**创建窗口**部分

- 图示

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019332.png)

# 步骤

## GIT添加GLFW子模块及编译

- 添加glfw子模块

  ```cpp
  git add submodule https://github.com/TheCherno/glfw Hazel/vendor/GLFW
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019372.png)

- 修改premake

  解决方案下的premake修改

  ```lua
  -- 包含相对解决方案的目录
  IncludeDir = {}
  IncludeDir["GLFW"] = "Hazel/vendor/GLFW/include"
  -- 这个include，相当于把glfw下的premake5.lua内容拷贝到这里
  include "Hazel/vendor/GLFW"
  project "Hazel"		--Hazel项目
  	location "Hazel"--在sln所属文件夹下的Hazel文件夹
  	kind "SharedLib"--dll动态库
  	-- 包含目录
  	includedirs{
  		"%{prj.name}/src",
  		"%{prj.name}/vendor/spdlog/include",
  		"%{IncludeDir.GLFW}"
  	}
  	-- Hazel链接glfw项目
  	links 
  	{ 
  		"GLFW",
  		"opengl32.lib"
  	}
  	filter "system:windows"
  		defines{
  			"HZ_PLATFORM_WINDOWS",
  			"HZ_ENABLE_ASSERTS"
  		}
  ```

- 效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112014714.png)

## Window类

- 目前类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112014719.png)

  Application类可以调用创建窗口函数，而窗口类使用glfw库创建**真正的**窗口。

  窗口类**检测**glfw窗口的事件，并**回调**给Application的处理事件函数。

- 代码

  window.h

  ```cpp
  #pragma once
  #include "hzpch.h"
  #include "Hazel/Core.h"
  #include "Hazel/Events/Event.h"
  namespace Hazel {
  	struct WindowProps{// 窗口初始化设置的内容
  		std::string Title;
  		unsigned int Width;
  		unsigned int Height;
  		WindowProps(const std::string& title = "Hazel Engine",
  			unsigned int width = 1280,
  			unsigned int height = 720)
  			: Title(title), Width(width), Height(height){}
  	};
  	class HAZEL_API Window{
  	public:
  		using EventCallbackFn = std::function<void(Event&)>;
  		virtual ~Window() {}
  		virtual void OnUpdate() = 0;
  		virtual unsigned int GetWidth() const = 0;
  		virtual unsigned int GetHeight() const = 0;
  		// Window attributes
  		virtual void SetEventCallback(const EventCallbackFn& callback) = 0;
  		virtual void SetVSync(bool enabled) = 0;
  		virtual bool IsVSync() const = 0;
          // 在Window父类声明创建函数
  		static Window* Create(const WindowProps& props = WindowProps());
  	};
  }
  ```

  WindowsWindow.h

  ```cpp
  #pragma once
  #include "Hazel/Window.h"
  #include <GLFW/glfw3.h>
  namespace Hazel {
  	class WindowsWindow : public Window{
  	public:
  		WindowsWindow(const WindowProps& props);
  		virtual ~WindowsWindow();
  		void OnUpdate() override;
  		inline unsigned int GetWidth() const override { return m_Data.Width; }
  		inline unsigned int GetHeight() const override { return m_Data.Height; }
  		// 设置Application的回调函数
  		inline void SetEventCallback(const EventCallbackFn& callback) override { m_Data.EventCallback = callback; }
  		void SetVSync(bool enabled) override;
  		bool IsVSync() const override;
  	private:
  		virtual void Init(const WindowProps& props);
  		virtual void Shutdown();
  	private:
  		GLFWwindow* m_Window;
  		struct WindowData{
  			std::string Title;
  			unsigned int Width, Height;
  			bool VSync;
  			EventCallbackFn EventCallback;
  		};
  		WindowData m_Data;
  	};
  }
  ```

  WindowsWindow.cpp

  ```cpp
  #include "hzpch.h"
  #include "WindowsWindow.h"
  
  namespace Hazel {
  	static bool s_GLFWInitialized = false;
      // 在WindowsWindow子类定义在Window父类声明的函数
  	Window* Window::Create(const WindowProps& props){
  		return new WindowsWindow(props);
  	}
  	WindowsWindow::WindowsWindow(const WindowProps& props){
  		Init(props);
  	}
  	void WindowsWindow::Init(const WindowProps& props){
  		m_Data.Title = props.Title;
  		m_Data.Width = props.Width;
  		m_Data.Height = props.Height;
  		HZ_CORE_INFO("Creating window {0} ({1}, {2})", props.Title, props.Width, props.Height);
  		if (!s_GLFWInitialized){
  			// TODO: glfwTerminate on system shutdown
  			int success = glfwInit();
  			HZ_CORE_ASSERT(success, "Could not intialize GLFW!");// 是Core.h里面预处理器指令定义了HZ_CORE_ASSERT
  			s_GLFWInitialized = true;
  		}
  		// 创建窗口//////////////////////////////////////////////
  		m_Window = glfwCreateWindow((int)props.Width, (int)props.Height, m_Data.Title.c_str(), nullptr, nullptr);
  		// 设置glfw当前的上下文
  		glfwMakeContextCurrent(m_Window);
  		/*
  			设置窗口关联的用户数据指针。这里GLFW仅做存储，不做任何的特殊处理和应用。
  			window表示操作的窗口句柄。
  			pointer表示用户数据指针。
  		*/
  		glfwSetWindowUserPointer(m_Window, &m_Data);
  		SetVSync(true);
  	}
  	void WindowsWindow::OnUpdate(){
  		glfwPollEvents();			// 轮询事件	
  		glfwSwapBuffers(m_Window);	// 交换缓冲
  	}
  	.....
  }
  ```

- HZ_CORE_ASSERT

  在Core.h中

  ```cpp
  #ifdef HZ_ENABLE_ASSERTS
  #define HZ_ASSERT(x, ...) { if(!(x)) { HZ_ERROR("Assertion Failed: {0}", __VA_ARGS__); __debugbreak(); } }
  #define HZ_CORE_ASSERT(x, ...) { if(!(x)) { HZ_CORE_ERROR("Assertion Failed: {0}", __VA_ARGS__); __debugbreak(); } }
  #else
  #define HZ_ASSERT(x, ...)
  #define HZ_CORE_ASSERT(x, ...)
  #endif
  ```

  ```cpp
  HZ_CORE_ASSERT(success, "Could not intialize GLFW!");
  // 转换成
  { if(!(success)) { ::Hazel::Log::GetCoreLogger()->error("Assertion Failed: {0}", "Could not intialize GLFW!"); __debugbreak(); } };
  ```

  可见：...当做参数包被\_\_VA\_ARGS\_\_展开；__debugbreak();是在debug模式下的断点

## 其它修改

- Application

  ```cpp
  #pragma once
  #include "Core.h"
  #include "Events/Event.h"
  #include "Window.h"
  namespace Hazel {
  	class HAZEL_API Application{
  	public:
  		Application();
  		virtual ~Application();
  		void Run();
  	private:
  		std::unique_ptr<Window> m_Window;
  		bool m_Running = true;
  	};
  	Application* CreateApplication();
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Application.h"
  #include "Hazel/Events/ApplicationEvent.h" // 包含事件
  #include "Hazel/Log.h"
  #include <GLFW/glfw3.h>
  namespace Hazel {
  	Application::Application(){
  		m_Window = std::unique_ptr<Window>(Window::Create()); // 创建窗口
  	}
  	Application::~Application() {}
  	void Application::Run(){
  		while (m_Running){
              // 清屏
  			glClearColor(1, 0, 1, 1);
  			glClear(GL_COLOR_BUFFER_BIT);
  			m_Window->OnUpdate();	// 更新glfw
  		}
  	}
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112020576.png)

# Bug记录

- glfw找不到函数定义

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019100.png)

- 解决方法一

  修改GLFW的premake

  ```cpp
  filter "configurations:Debug"
      defines "HZ_DEBUG"
      buildoptions "/MTd"
      symbols "On"
  
      filter "configurations:Release"
      defines "HZ_RELEASE"
      buildoptions "/MT"
      symbols "On"
  
      filter "configurations:Dist"
      defines "HZ_DIST"
      buildoptions "/MT"
      symbols "On"
  ```

  使GLFW项目的运行库，只能是**MT**或者**MTD**，**不能**是MD或者MDD

  重新编译才行

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019376.png)

  关于运行库选项：

  ```cpp
  // 运行库选项是MTD,静态链接MSVCRT.lib库;
  // 运行库选项是MDD,动态链接MSVCRT.dll库;打包后的exe放到另一台电脑上若无这个dll会报错
  ```

  - 为什么GLFW要改为MT或者MTD才行

    Hazel是MTD**静态链接**MSVCRT.dll库、而引用GLFW项目却是MDD**动态链接**MSVCRT.dll库，可能不兼容。如下是Hazel项目的运行库选项

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019666.png)

- 解决方法二

  由于Hazel**默认**是MTD，GLFW默认是**MDD**，那么就将Hazel用premake改为MDD动态链接MSVCRT.dll库，符合Hazel作为**dll库**（SharedLib)的方式

  更改解决方案下的premake5.lua文件

  ```cpp
  project "Hazel"
      ......
     filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		buildoptions "/MDd"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		buildoptions "/MD"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		buildoptions "/MD"
  		optimize "On"
  
  project "Sandbox"
  	......
  	filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		buildoptions "/MDd"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		buildoptions "/MD"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		buildoptions "/MD"
  		optimize "On"
  ```

  重新编译后，Hazel的运行库**依旧**是MTd，但是添加了命令行/MDd **会覆盖**/MTd

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112019745.png)

  - 后面017节才发现为什么Hazel**依旧**为MTD，需要添加了命令行/MDd 才会覆盖/MTd

    由于premake设置了**staticruntime**为on

    ```lua
    -- On:代码生成的运行库选项是MTD,静态链接MSVCRT.lib库;
    -- Off:代码生成的运行库选项是MDD,动态链接MSVCRT.dll库;打包后的exe放到另一台电脑上若无这个dll会报错
    staticruntime "On"	
    ```

    只需staticruntime 为**off**即可