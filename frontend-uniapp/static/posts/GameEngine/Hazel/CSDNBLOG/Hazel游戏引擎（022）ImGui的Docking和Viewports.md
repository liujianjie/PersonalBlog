> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了使用imgui的新特性：停靠和多个子UI窗口，需要改变之前015016所做的（自己写关键ImGui的代码具有停靠特性要复杂很多），所以需要使用ImGui已经写好的cpp来直接使用ImGui的新特性。（可能说错了）

- 修改后的类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260027545.png)

  可见ExamplerLayer也依赖ImGUI，因为它也可以有ImGui窗口，每个Layer都可以有**一个或多个**ImGui窗口


# 项目相关

## 代码改变

- 删除

  ImGuiOpenGLRenderer类

- ImGuiBuild

  增加ImGuiBuild.cpp

  ```cpp
  #include "hzpch.h"
  
  #define IMGUI_IMPL_OPENGL_LOADER_GLAD
  #include "backends/imgui_impl_opengl3.cpp"
  #include "backends/imgui_impl_glfw.cpp"
  ```

- Layer修改

  ```cpp
  class HAZEL_API Layer
  {
      public:
      Layer(const std::string& name = "Layer");
      virtual ~Layer();
  
      virtual void OnAttach() {} // 应用添加此层执行
      virtual void OnDetach() {} // 应用分离此层执行
      virtual void OnUpdate() {} // 每层更新
      virtual void OnImGuiRender() {}// 每层都可以拥有自己的UI窗口 !
  ```

- ImGuiLayer

  - 删除**事件处理函数**(016所做)
  - 删除ImGui与GLFW键值对应（OnAttach函数里的代码）
  - 删除OnUpdate与OnEvent函数，不需要
  - 增加OnImGuiRender()、Begin()、End()为了渲染ImGui

  ```cpp
  #include "hzpch.h"
  #include "ImGuiLayer.h"
  #include "imgui.h"
  #include "Hazel/Application.h"
  #include "GLFW/glfw3.h"
  #include "glad/glad.h"
  #include "backends/imgui_impl_glfw.h"
  #include "backends/imgui_impl_opengl3.h"
  namespace Hazel {
  	ImGuiLayer::ImGuiLayer()
  		: Layer("ImGuiLayer"){}
  	ImGuiLayer::~ImGuiLayer(){}
  	// 初始化设置ImGui所有窗口的属性，使ImGui窗口能有停靠、独立的UI窗口特性
  	void ImGuiLayer::OnAttach(){
          // 不需要手动写ImGui的键值对应GLFW的键值、ImGui接收GLFW窗口事件，ImGui自动完成
  		// Setup Dear ImGui context
  		IMGUI_CHECKVERSION();
  		ImGui::CreateContext();
  		ImGuiIO& io = ImGui::GetIO(); (void)io;
  		io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;       // Enable Keyboard Controls
  		//io.ConfigFlags |= ImGuiConfigFlags_NavEnableGamepad;      // Enable Gamepad Controls
  		io.ConfigFlags |= ImGuiConfigFlags_DockingEnable;           // Enable Docking
  		io.ConfigFlags |= ImGuiConfigFlags_ViewportsEnable;         // Enable Multi-Viewport / Platform Windows
  		//io.ConfigFlags |= ImGuiConfigFlags_ViewportsNoTaskBarIcons;
  		//io.ConfigFlags |= ImGuiConfigFlags_ViewportsNoMerge;
  
  		// Setup Dear ImGui style
  		ImGui::StyleColorsDark();
  		//ImGui::StyleColorsClassic();
  		// When viewports are enabled we tweak WindowRounding/WindowBg so platform windows can look identical to regular ones.
  		ImGuiStyle& style = ImGui::GetStyle();
  		if (io.ConfigFlags & ImGuiConfigFlags_ViewportsEnable)
  		{
  			style.WindowRounding = 0.0f;
  			style.Colors[ImGuiCol_WindowBg].w = 1.0f;
  		}
  
  		Application& app = Application::Get();
  		GLFWwindow* window = static_cast<GLFWwindow*>(app.GetWindow().GetNativeWindow());
  
  		// Setup Platform/Renderer bindings
  		ImGui_ImplGlfw_InitForOpenGL(window, true);
  		ImGui_ImplOpenGL3_Init("#version 410");
  	}
  	void ImGuiLayer::OnDetach(){
  		ImGui_ImplOpenGL3_Shutdown();
  		ImGui_ImplGlfw_Shutdown();
  		ImGui::DestroyContext();
  	}
  	void ImGuiLayer::Begin(){
  		ImGui_ImplOpenGL3_NewFrame();
  		ImGui_ImplGlfw_NewFrame();
  		ImGui::NewFrame();
  	}
  	void ImGuiLayer::End(){
  		ImGuiIO& io = ImGui::GetIO();
  		Application& app = Application::Get();
  		io.DisplaySize = ImVec2(app.GetWindow().GetWidth(), app.GetWindow().GetHeight());
  		// Rendering
  		ImGui::Render();
  		ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
  		if (io.ConfigFlags & ImGuiConfigFlags_ViewportsEnable)
  		{
  			GLFWwindow* backup_current_context = glfwGetCurrentContext();
  			ImGui::UpdatePlatformWindows();
  			ImGui::RenderPlatformWindowsDefault();
  			glfwMakeContextCurrent(backup_current_context);
  		}
  	}
  	void ImGuiLayer::OnImGuiRender(){
  		static bool show = true;
  		ImGui::ShowDemoWindow(&show);// 当前OnImGuiRender层显示DemoUI窗口
  	}
  }
  ```

- Application

  ```cpp
  	private:
  		bool OnWindowClose(WindowCloseEvent& e); // 处理窗口关闭事件的函数
  	private:
  		std::unique_ptr<Window> m_Window;
  		ImGuiLayer* m_ImGuiLayer; // 拥有ImGuiLayer控制权
  		bool m_Running = true;
  		LayerStack m_LayerStack;
  	private:
  		static Application* s_Instance;
  ```

  ```cpp
  Application::Application()
  {
      HZ_CORE_ASSERT(!s_Instance, "引用已经存在");
      s_Instance = this;
  
      // 1.1Application创建窗口
      m_Window = std::unique_ptr<Window>(Window::Create());
      // 1.2Application设置窗口事件的回调函数
      m_Window->SetEventCallback(BIND_EVENT_FN(OnEvent));
  
      // 将ImGui层放在最后
      m_ImGuiLayer = new ImGuiLayer();
      PushOverlay(m_ImGuiLayer);
  }
  void Application::Run()
  {
      while (m_Running)
      {
          glClearColor(1, 0, 1, 1);
          glClear(GL_COLOR_BUFFER_BIT);
  
          // 从前往后顺序更新层
          for (Layer* layer : m_LayerStack)
              layer->OnUpdate();
  		////////////////////////////////////////////////////////////////////
          // 从前往后顺序更新层的ImGui 新增///////////////////////////////////////
          ////////////////////////////////////////////////////////////////////
          m_ImGuiLayer->Begin();
          for (Layer* layer : m_LayerStack)
              layer->OnImGuiRender();、
          m_ImGuiLayer->End();
  
          m_Window->OnUpdate();	// 更新glfw
      }
  }
  ```

## 修复LayerStack的bug

当vector在内存的位置改变后，保存指向vector首部的std::vector<Layer*>::iterator m_LayerInsert;迭代器会失效，所以改用int 插入位置下标，PushLayer函数不再是在最前面插入了，而是在后面

```cpp
		std::vector<Layer*>::iterator end() { return m_Layers.end(); }
	private:
		std::vector<Layer*> m_Layers;
		// std::vector<Layer*>::iterator m_LayerInsert;
		unsigned int m_LayerInsertIndex = 0;
	};
```

```cpp
void LayerStack::PushLayer(Layer* layer)
{
	// m_LayerInsert = m_Layers.emplace(m_LayerInsert, layer);
    // emplace在vector容器指定位置之前插入一个新的元素。返回插入元素的位置
    // 插入 1 2 3，vector是 1 2 3
    m_Layers.emplace(m_Layers.begin() + m_LayerInsertIndex, layer);
    m_LayerInsertIndex++;
}
void LayerStack::PushOverlay(Layer* overlay)
{
    m_Layers.emplace_back(overlay);
}
void LayerStack::PopLayer(Layer* layer)
{
    auto it = std::find(m_Layers.begin(), m_Layers.end(), layer);
    if (it != m_Layers.end())
    {
        m_Layers.erase(it);
		// m_LayerInsert--;
        m_LayerInsertIndex--;
    }
}
```

## 显示DemoUI效果

因为Application中遍历所有Layer的OnImGuiRender函数，而ImGuiLayer的OnImGuiRender显示DemoUI窗口，且ImGuiLayer的OnAttach函数初始化设置ImGui所有窗口的属性，使ImGui窗口能有停靠、独立的UI窗口特性

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260037800.png)

# 家庭作业

- 问题

  虽然ImGui作为**静态**链接到Hazel中，Hazel又作为**dll库**被Sandbox加载，但为什么在Sandbox项目中使用Hazel链接的ImGui函数会报无法找到函数定义？

  ```cpp
  #include <Hazel.h>
  #include "imgui/imgui.h"
  class ExampleLayer : public Hazel::Layer{
  public:
  	ExampleLayer()
  		: Layer("Example"){}
  	void OnUpdate() override{
  		//HZ_INFO("ExampleLayer::Update");
  		if (Hazel::Input::IsKeyPressed(HZ_KEY_A)) {
  			HZ_TRACE("A键按下(poll)");
  		}
  	}
  	void OnEvent(Hazel::Event& event) override{
  		//HZ_TRACE("examplayer:{0}", event);
  		if (event.GetEventType() == Hazel::EventType::KeyPressed) {
  			Hazel::KeyPressedEvent& e = (Hazel::KeyPressedEvent&)event;
  			if (e.GetKeyCode() == HZ_KEY_A) {
  				HZ_TRACE("A键按下(event)");
  			}
  			HZ_TRACE("{0}",(char)e.GetKeyCode());
  		}
  	}
  	// 每个层都可以有自己的UI窗口// 会报错///////////////////////
  	virtual void OnImGuiRender() override{
  		ImGui::Begin("Test");
  		ImGui::Text("Hello World");
  		ImGui::End();
  	}
  };
  ```

- 解答1说法

  - 来自油管视频下方的回答

    ```
    The Symbols from ImGui are not being export from Hazel into Sandbox. adding a defines to premake file of ImGui  `defines { "IMGUI_API=__declspec(dllexport)" }`  should export the symbols from ImGui to Hazel which will export all Hazel and ImGui symbols to Sandbox.
    ```

    ImGui 中的符号不会从 Hazel 导出到 Sandbox 中。 在 ImGui 的预制文件中添加定义 `defines { "IMGUI_API=__declspec(dllexport)" }` 应该将符号从 ImGui **导出**到 Hazel，这会将所有 Hazel 和 ImGui 符号**导出**到 Sandbox。

- 解答2说法

  025节的讲的

  ImGui静态链接到Hazel.dll中，但是Hazel.dll有能力删除ImGui中**没有导出**的函数定义内容，因此如果在链接dll文件的exe文件使用ImGui的内容，就会链接错误。

  简单的说就是：没有导出ImGui的函数定义内容