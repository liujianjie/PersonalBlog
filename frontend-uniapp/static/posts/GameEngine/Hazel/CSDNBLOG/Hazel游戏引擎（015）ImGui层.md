> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  给窗口添加编辑UI，使用Imgui库来实现编辑UI

# 此节完成后的类结构

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252251767.png)

# 步骤

## 添加Imgui项目

- git添加子模块

  ```cpp
  git submodule add https://github.com/TheCherno/imgui Hazel/vendor/imgui
  ```

  注意：Cherno使用的ImGui是旧版本，请勿直接添加原ImGui仓库为子模块

- 修改解决方案下的premake

  ```cpp
  -- 包含相对解决方案的目录
  IncludeDir = {}
  IncludeDir["GLFW"] = "Hazel/vendor/GLFW/include"
  IncludeDir["Glad"] = "Hazel/vendor/Glad/include"
  IncludeDir["ImGui"] = "Hazel/vendor/imgui"
  
  include "Hazel/vendor/GLFW"
  include "Hazel/vendor/Glad"
  include "Hazel/vendor/imgui"
  project "Hazel"		--Hazel项目
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
  ```

## 使用ImGui

- 复制imgui/backends/imgui_impl_opengl3.h和cpp文件到Platform/OpenGL下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252251784.png)

  并修改文件名为ImGuiOpenGLRenderer.cpp中#include头文件 也要改为ImGuiOpenGLRenderer

- 创建ImGui层

  ```cpp
  #include "Hazel/Layer.h"
  
  namespace Hazel {
  	class HAZEL_API ImGuiLayer : public Layer{
  	public:
  		ImGuiLayer();
  		~ImGuiLayer();
  
  		void OnAttach();
  		void OnDetach();
  		void OnUpdate();
  		void OnEvent(Event& event);
  	private:
  		float m_Time = 0.0f;
  	};
  }
  ```

  ```cpp
  #include "Platform/OpenGL/ImGuiOpenGLRenderer.h"
  #include "GLFW/glfw3.h"
  ......
  void ImGuiLayer::OnAttach(){
      ImGui::CreateContext();
      ImGui::StyleColorsDark();
  
      ImGuiIO& io = ImGui::GetIO();
      io.BackendFlags |= ImGuiBackendFlags_HasMouseCursors;	// 光标
      io.BackendFlags |= ImGuiBackendFlags_HasSetMousePos;
  
      // imgui输入key对应glfw的key，临时的：最终会对应引擎自身的key
      io.KeyMap[ImGuiKey_Tab] = GLFW_KEY_TAB;
      io.KeyMap[ImGuiKey_LeftArrow] = GLFW_KEY_LEFT;
      io.KeyMap[ImGuiKey_RightArrow] = GLFW_KEY_RIGHT;
      io.KeyMap[ImGuiKey_UpArrow] = GLFW_KEY_UP;
      io.KeyMap[ImGuiKey_DownArrow] = GLFW_KEY_DOWN;
      io.KeyMap[ImGuiKey_PageUp] = GLFW_KEY_PAGE_UP;
      io.KeyMap[ImGuiKey_PageDown] = GLFW_KEY_PAGE_DOWN;
      io.KeyMap[ImGuiKey_Home] = GLFW_KEY_HOME;
      io.KeyMap[ImGuiKey_End] = GLFW_KEY_END;
      io.KeyMap[ImGuiKey_Insert] = GLFW_KEY_INSERT;
      io.KeyMap[ImGuiKey_Delete] = GLFW_KEY_DELETE;
      io.KeyMap[ImGuiKey_Backspace] = GLFW_KEY_BACKSPACE;
      io.KeyMap[ImGuiKey_Space] = GLFW_KEY_SPACE;
      io.KeyMap[ImGuiKey_Enter] = GLFW_KEY_ENTER;
      io.KeyMap[ImGuiKey_Escape] = GLFW_KEY_ESCAPE;
      io.KeyMap[ImGuiKey_A] = GLFW_KEY_A;
      io.KeyMap[ImGuiKey_C] = GLFW_KEY_C;
      io.KeyMap[ImGuiKey_V] = GLFW_KEY_V;
      io.KeyMap[ImGuiKey_X] = GLFW_KEY_X;
      io.KeyMap[ImGuiKey_Y] = GLFW_KEY_Y;
      io.KeyMap[ImGuiKey_Z] = GLFW_KEY_Z;
  
      ImGui_ImplOpenGL3_Init("#version 410");
  }
  void ImGuiLayer::OnUpdate(){
      ImGuiIO& io = ImGui::GetIO();
      Application& app = Application::Get();
      io.DisplaySize = ImVec2(app.GetWindow().GetWidth(), app.GetWindow().GetHeight());
  
      float time = (float)glfwGetTime();
      io.DeltaTime = m_Time > 0.0f ? (time - m_Time) : (1.0f / 60.0f);
      m_Time = time;
  
      // 需创建窗口后才执行下面
      ImGui_ImplOpenGL3_NewFrame();
      ImGui::NewFrame();
  
      static bool show = true;
      // 显示ImGui Demo////////////////////////////////////////////
      ImGui::ShowDemoWindow(&show);
      ImGui::Render();
      ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
  }
  ......
  ```

  - 关于在ImGuiLayer类中的OnAttach和OnUpdate函数中的ImGui代码

    都是参考examples\example_glfw_opengl3\\**main**.cpp与imgui_impl_glfw上的例子代码

    ImGuiLayer**对应**main.cpp引入ImGuiOpenGLRenderer.h(imgui_impl_opengl3.h)使用其函数，从而在屏幕上显示ImGui

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252252119.png)

    ImGui的key键值对应GLFW窗口的key键值

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252251829.png)

- SandboxApp

  ```cpp
  class Sandbox : public Hazel::Application
  {
  public:
  	Sandbox()
  	{
  		PushLayer(new ExampleLayer());
  		PushOverlay(new Hazel::ImGuiLayer());// UI层放到最后面显示在屏幕的上方
  	}
  	~Sandbox()
  	{
  	}
  };
  ```


## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306252251850.png)

图中窗口里的Dear ImGui Demo就是ImGui创建的编辑UI

# 记录Bug

- imgui.cpp(3839,25): error C2065: “DC”: 未声明的标识符

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260047886.png)

  注释掉了这几行就行。。。不知道具体解决方法