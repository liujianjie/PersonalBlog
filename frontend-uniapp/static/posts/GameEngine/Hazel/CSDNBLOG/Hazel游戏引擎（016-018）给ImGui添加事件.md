> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 提醒

  此节所作的是针对旧版的ImGui库写的ImGui事件，但在022节使用新版的ImGui有提供自动处理GLFW事件，此节所作的会被022节替代

- 此节目的

  为了让显示在屏幕上ImGui的UI能接收GLFW窗口事件。

  此节对应008计划窗口事件的Layer层，只不过将Layer层具体化为ImGuiLayer层

- 再次回顾事件流程图示

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252258897.png)

# 如何写ImGui的事件

- 搞清楚原理

  ImGui的事件是来自GLFW窗口的事件

  （GLFW**提供**了函数来捕捉窗口事件，并回调自定义的函数->我们已经实现在回调自定义函数中传递给Application再传给Layer层，在Layer层中进行捕获和处理事件）

- 参考ImGui的imgui_impl_glfw.cpp

  这个cpp里写了imgui实现处理glfw事件的**回调处理事件函数**

  所以参考imgui_impl_glfw.cpp对应的**回调处理事件函数**重写为ImGuiLayer层自己的回调处理函数函数

  - 视频里的回调事件函数

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252258904.png)

  - 新版本的ImGui回调事件函数

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252258902.png)

  由于TheCherno写的时候ImGui的版本是旧版本，所以参考**旧**版本imgui_impl_glfw.cpp所写的回调处理事件函数来**重写我们引擎Hazel中的ImGuiLayer层的处理GLFW窗口事件函数**。

  新版本的imgui的回调处理事件函数，多了封装与重构，但与旧版本的最终代码差不多。

# 项目相关

## 代码

- Event增加接收字符事件

  ```cpp
  class KeyPressedEvent : public KeyEvent// 原本存在
  {
  public:
      KeyPressedEvent(const KeyCode keycode, bool isRepeat = false)
          : KeyEvent(keycode), m_IsRepeat(isRepeat) {}
  
      bool IsRepeat() const { return m_IsRepeat; }
  
      std::string ToString() const override
      {
          std::stringstream ss;
          ss << "KeyPressedEvent: " << m_KeyCode << " (repeat = " << m_IsRepeat << ")";// 输出在窗口
          return ss.str();
      }
      EVENT_CLASS_TYPE(KeyPressed)
  private:
      bool m_IsRepeat;
  };
  class HAZEL_API KeyTypedEvent : public KeyEvent// 增加接收字符事件
  {
      public:
      KeyTypedEvent(int keycode)
          : KeyEvent(keycode) {}
  
      std::string ToString() const override
      {
          std::stringstream ss;
          ss << "KeyTypedEvent: " << m_KeyCode; // 输出在窗口
          return ss.str();
      }
  
      EVENT_CLASS_TYPE(KeyTyped)
  };
  ```

- WindowsWindow.cpp增加接收字符窗口事件并回调给Application

  ```cpp
  // 输入字符事件
  glfwSetKeyCallback(m_Window, [](GLFWwindow* window, unsigned int keycode){
      WindowData& data = *(WindowData*)glfwGetWindowUserPointer(window);
  
      KeyPressedEvent event(keycode);
      data.EventCallback(event);
  });
  // 输入字符事件
  glfwSetCharCallback(m_Window, [](GLFWwindow* window, unsigned int keycode){
      WindowData& data = *(WindowData*)glfwGetWindowUserPointer(window);
  
      KeyTypedEvent event(keycode);
      data.EventCallback(event);
  });
  ```

- Application把事件传给ImGuiLayer层

  ```cpp
  #include "hzpch.h"
  #include "ImGuiLayer.h"
  
  #include "imgui.h"
  #include "Platform/OpenGL/ImGuiOpenGLRenderer.h"
  #include "Hazel/Application.h"
  
  #include "GLFW/glfw3.h"
  #include "glad/glad.h"
  .......
  // 从Application的Event传递过来的事件
  void ImGuiLayer::OnEvent(Event& event){
      // 用事件调度器拦截ImGuiLayer想要拦截的事件并用本类函数处理
      /* 
      	参考imgui_impl_glfw.cpp对应的回调处理事件函数重写为ImGuiLayer层自己的回调处理函数函数:
      	MouseButtonPressedEvent、OnMouseButtonReleasedEvent、OnMouseMovedEvent
      */
      // 最重要的一点是：ImGui拦截了事件并处理后，不标记为处理过了，而是return false标记为没处理，将其传递给前一个层
      EventDispatcher dispatcher(event);
      dispatcher.Dispatch<MouseButtonPressedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnMouseButtonPressedEvent));
      dispatcher.Dispatch<MouseButtonReleasedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnMouseButtonReleasedEvent));
      dispatcher.Dispatch<MouseMovedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnMouseMovedEvent));
      dispatcher.Dispatch<MouseScrolledEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnMouseScrolledEvent));
      dispatcher.Dispatch<KeyPressedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnKeyPressedEvent));// 区分
      dispatcher.Dispatch<KeyTypedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnKeyTypedEvent));// 区分
      dispatcher.Dispatch<KeyReleasedEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnKeyReleasedEvent));
      dispatcher.Dispatch<WindowResizeEvent>(HZ_BIND_EVENT_FN(ImGuiLayer::OnWindowResizeEvent));
  }
  bool ImGuiLayer::OnMouseButtonPressedEvent(MouseButtonPressedEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      io.MouseDown[e.GetMouseButton()] = true;
  
      return false;// 不标记为处理过了，而是没处理，将其传递给前一个层
  }
  bool ImGuiLayer::OnMouseButtonReleasedEvent(MouseButtonReleasedEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      io.MouseDown[e.GetMouseButton()] = false;
      return false;
  }
  bool ImGuiLayer::OnMouseMovedEvent(MouseMovedEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      io.MousePos = ImVec2(e.GetX(), e.GetY());
      return false;
  }
  bool ImGuiLayer::OnMouseScrolledEvent(MouseScrolledEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      io.MouseWheelH += e.GetXOffset();
      io.MouseWheel += e.GetYOffset();
      return false;
  }
  bool ImGuiLayer::OnKeyPressedEvent(KeyPressedEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      io.KeysDown[e.GetKeyCode()] = true;
  
      io.KeyCtrl = io.KeysDown[GLFW_KEY_LEFT_CONTROL] || io.KeysDown[GLFW_KEY_RIGHT_CONTROL];
      io.KeyShift = io.KeysDown[GLFW_KEY_LEFT_SHIFT] || io.KeysDown[GLFW_KEY_RIGHT_SHIFT];
      io.KeyAlt = io.KeysDown[GLFW_KEY_LEFT_ALT] || io.KeysDown[GLFW_KEY_RIGHT_ALT];
      io.KeySuper = io.KeysDown[GLFW_KEY_LEFT_SUPER] || io.KeysDown[GLFW_KEY_RIGHT_SUPER];
      return false;
  }
  bool ImGuiLayer::OnKeyReleasedEvent(KeyReleasedEvent& e){// 区分
      ImGuiIO& io = ImGui::GetIO();
      io.KeysDown[e.GetKeyCode()] = false;
      return false;
  }
  bool ImGuiLayer::OnKeyTypedEvent(KeyTypedEvent& e){	// 区分
      ImGuiIO& io = ImGui::GetIO();
      int keycode = e.GetKeyCode();
      if (keycode > 0 && keycode < 0x10000)
          io.AddInputCharacter((unsigned short)keycode);
      return false;
  }
  bool ImGuiLayer::OnWindowResizeEvent(WindowResizeEvent& e){
      ImGuiIO& io = ImGui::GetIO();
      // 设置ImGui的渲染窗口参数
      io.DisplaySize = ImVec2(e.GetWidth(), e.GetHeight());
      io.DisplayFramebufferScale = ImVec2(1.0f, 1.0f);
      // 告诉OpenGL渲染窗口的尺寸大小
      glViewport(0, 0, e.GetWidth(), e.GetHeight());
      return false;
  }
  .......
  ```

## 效果

显示在屏幕上的ImGui能接收GLFW窗口事件:在Example:Console窗口的输入框中能得到GLFW窗口得到的按键值

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252258908.png)

至于按下d，KeyPressedEvent（glfw函数是glfwSetKeyCallback）是的code是68，而KeyTypeEvent（glfw函数是glfwSetCharCallback）的是100。

可能：

- glfwSet**Key**Callback

  只是检测键盘字符是否按下、松开与否，不管是大小写字符，默认为大写字符

- glfwSet**Char**Callback

  需要输出显示在屏幕上，所以区分大小写字符

# 水节

## 017.Github与Hazel

- 修改premake

  ```cpp
  workspace "Hazel"		-- sln文件名
  	architecture "x64"	
  	configurations{
  		"Debug",
  		"Release",
  		"Dist"
  	}
  	-- 启动项目
  	startproject "Sandbox"
  
  -- https://github.com/premake/premake-core/wiki/Tokens#value-tokens
  -- 组成输出目录:Debug-windows-x86_64
  outputdir = "%{cfg.buildcfg}-%{cfg.system}-%{cfg.architecture}"
  
  -- 包含相对解决方案的目录
  IncludeDir = {}
  IncludeDir["GLFW"] = "Hazel/vendor/GLFW/include"
  IncludeDir["Glad"] = "Hazel/vendor/Glad/include"
  IncludeDir["ImGui"] = "Hazel/vendor/imgui"
  
  include "Hazel/vendor/GLFW"
  include "Hazel/vendor/Glad"
  include "Hazel/vendor/imgui"
  
  project "Hazel"		--Hazel项目
  	location "Hazel"--在sln所属文件夹下的Hazel文件夹
  	kind "SharedLib"--dll动态库
  	language "C++"
  	targetdir ("bin/" .. outputdir .. "/%{prj.name}") -- 输出目录
  	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")-- 中间目录
  	-- On:代码生成的运行库选项是MTD,静态链接MSVCRT.lib库;
  	-- Off:代码生成的运行库选项是MDD,动态链接MSVCRT.dll库;打包后的exe放到另一台电脑上若无这个dll会报错
  	staticruntime "Off"	
  
  	-- 预编译头 
  	pchheader "hzpch.h"
  	pchsource "Hazel/src/hzpch.cpp"
  
  	-- 包含的所有h和cpp文件
  	files{
  		"%{prj.name}/src/**.h",
  		"%{prj.name}/src/**.cpp"
  	}
  	-- 包含目录
  	includedirs{
  		"%{prj.name}/src",
  		"%{prj.name}/vendor/spdlog/include",
  		"%{IncludeDir.GLFW}",
  		"%{IncludeDir.Glad}",
  		"%{IncludeDir.ImGui}"
  	}
  	links { 
  		"GLFW",
  		"Glad",
  		"ImGui",
  		"opengl32.lib"
  	}
  
  	-- 如果是window系统
  	filter "system:windows"
  		cppdialect "C++17"
  		--staticruntime "On"
  		systemversion "latest"	-- windowSDK版本
  		-- 预处理器定义
  		defines{
  			"HZ_PLATFORM_WINDOWS",
  			"HZ_BUILD_DLL",
  			"GLFW_INCLUDE_NONE" -- 让GLFW不包含OpenGL
  		}
  		-- 编译好后移动Hazel.dll文件到Sandbox文件夹下
  		postbuildcommands{
  			("{COPY} %{cfg.buildtarget.relpath} ../bin/" .. outputdir .. "/Sandbox")
  		}
  	-- 不同配置下的预定义不同
  	filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		runtime "Debug"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		runtime "Release"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		runtime "Release"
  		optimize "On"
  
  project "Sandbox"
  	location "Sandbox"
  	kind "ConsoleApp"
  	language "C++"
  	staticruntime "Off"	
  
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
  		systemversion "latest"
  
  		defines{
  			"HZ_PLATFORM_WINDOWS"
  		}
  
  	-- 不同配置下的预定义不同
  	filter "configurations:Debug"
  		defines "HZ_DEBUG"
  		runtime "Debug"
  		symbols "On"
  
  	filter "configurations:Release"
  		defines "HZ_RELEASE"
  		runtime "Release"
  		optimize "On"
  
  	filter "configurations:Dist"
  		defines "HZ_DIST"
  		runtime "Release"
  		optimize "On"
  ```

- 宏定义

  ```cpp
  #ifdef HZ_DEBUG
  	#define HZ_ENABLE_ASSERTS
  #endif
  
  #ifdef HZ_ENABLE_ASSERTS
  #define HZ_ASSERT(x, ...) { if(!(x)) { HZ_ERROR("Assertion Failed: {0}", __VA_ARGS__); __debugbreak(); } }
  #define HZ_CORE_ASSERT(x, ...) { if(!(x)) { HZ_CORE_ERROR("Assertion Failed: {0}", __VA_ARGS__); __debugbreak(); } }
  #else
  #define HZ_ASSERT(x, ...)
  #define HZ_CORE_ASSERT(x, ...)
  #endif
  ```


## 018.合并请求

没啥

