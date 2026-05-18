> 文中若有代码、术语等错误，欢迎指正

[toc]



# 代码维护

## 抽象父类要加虚析构函数

- 简要说明

  因为是shared_ptr是指针，而指针的类型是父类

  若父类未写虚析构函数（程序会给一个默认的析构函数）那么delete时将**不会执行** “运行时”选择派生类的析构函数再运行父类的析构函数功能

  **会直接调用父类的析构函数，忽略子类的析构函数**。

- 例子

  1. 未加virtual 析构函数，只是普通的析构函数

     ```cpp
     #include <iostream>
     using namespace std;
     class Parent {
     public:
     	 ~Parent() {
     		cout << "~Parent()" << endl;
     	}
     };
     class Child : public Parent {
     public:
     	// 写了virtual的话，delete p 会报错。。。不写virtual也能说明问题
     	~Child() {
     		cout << "~Child()" << endl;
     	}
     };
     void main() {
     	Parent* p = new Child;
     	delete p; // 只会执行父类的析构函数
     }
     ```

     ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308310.png)

  2. 加了virtual

     ```cpp
     #include <iostream>
     using namespace std;
     class Parent {
     public:
     	virtual ~Parent() {
     		cout << "~Parent()" << endl;
     	}
     };
     class Child : public Parent {
     public:
     	virtual ~Child() {
     		cout << "~Child()" << endl;
     	}
     };
     void main() {
     	Parent* p = new Child;
     	delete p; // 执行子类再是父类的析构函数
     }
     ```

     ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308316.png)

- 结论

  所以要给：Event、Input、Framebuffer、GraphicsContext、RendererAPI加上虚析构函数。

## input类 修改

- 简要说明

  在某个平台的输入不需要在运行时选择另一个平台输入，不存在这种动态情况

  比如：**我在安卓上不可能存在用window的输入，只有安卓上的输入**。

  但渲染需要运行时选择哪个api，是opengl还是directx、vulkan，因为windows的操作是支**持这三个渲染api的**。

- 当前项目Input的类似结构

  ```c++
  Ref<Input> Input::Create()
  {
      switch (Renderer::GetPlatform())
      {
          case RendererAPI::API::None: HZ_CORE_ASSERT(false, "RendererAPI:None is currently not supported!"); return nullptr;
          case RendererAPI::API::Window: return std::make_shared<WindowInput>();
          case RendererAPI::API::Linux: return std::make_shared<LinuxInput>();
          case RendererAPI::API::Mac: return std::make_shared<MacInput>();
      }
      HZ_CORE_ASSERT(false, "UnKnown RendererAPI!");
      return nullptr;
  }
  ```

  可推：

  一个input.h，一个input.cpp，有windowsinput.cpp、linuxinput.cpp、macinput.cpp文件。

  编译后有：input.obj，windowsinput.obj，linuxinput.obj，macinput.obj

  **是用虚函数，动态运行时使用哪个子类**

- 在项目中修改后Input的类后

  一个input.h，有windowsinput.cpp、linuxinput.cpp、macinput.cpp文件，由**宏**在编译前决定编译哪一个cpp文件

  编译后有：input.obj文件，这样就**减少**了三个cpp的obj文件

  **input中声明静态函数，在其他三个cpp中定义静态函数**

- 例子

  ```c++
  #include <iostream>
  using namespace std;
  
  class Input {
  public: 
  	static void GetMouseX(); // 静态函数 声明
  };
  #if LinuxInput
  using namespace std;
  void Input::GetMouseX() {// Input的GetMouseX函数定义
  	cout << "Windows GetMouseX" << endl;
  }
  #endif
  
  #define WindowsInput 1
  #if WindowsInput
  using namespace std;
  void Input::GetMouseX() {// Input的GetMouseX函数定义
  	cout << "Windows GetMouseX" << endl;
  }
  #endif
  
  void main() {
  	Input::GetMouseX();
  }
  ```

- 项目如何修改

  - 删除input.cpp、windowsinput.h
  - windowsinput.cpp、linuxinput.cpp、macinput.cpp中**定义**input.h声明的函数（当前只支持window，可以不用后两个cpp)

- 记录项目修改时的小bug

  error LNK2019: 无法解析的外部符号 "public: static bool __cdecl Hazel::Input::IsKeyPressed(int)

  ```c++
  input.h:
  inline static bool IsKeyPressed(int keycode);
  ```

  ```c++
  WindowsInput.cpp
  bool Input::IsKeyPressed(int keycode)  {
      auto window = static_cast<GLFWwindow*>(Application::Get().GetWindow().GetNativeWindow());
      auto state = glfwGetKey(window, keycode);
      return state == GLFW_PRESS || state == GLFW_REPEAT;
  }
  ```

  因为input.h的IsKeyPressed函数用了**inline**，而WindowsInput.cpp又定义了IsKeyPressed函数，所以报错（需要删除inline声明）。

# Imgui Event

## 当ImGuiLayer没有OnEvent处理事件函数时界面存在bug

- Bug1

  在ImGui的一个视口**wasd**，输出帧缓冲场景的ImGui视口(EditorLayer)也会响应

- Bug2

  在ImGui的一个视口**滚轮滚动**，输出帧缓冲场景的ImGui视口(EditorLayer)也会响应

应该改为只在对应的ImGui视口响应。

- 提下ImGuiLayer的OnEvent

  - 在016节**本来有**OnEvent处理事件的

    旧ImGui版本，所以需要**手动写**捕捉事件处理

  - 但在022节又**删掉**了OnEvent函数

    新ImGui版本，因为**托管给**ImGui去处理事件，不需要手动处理

  - 现在此节又要加上是

    因为如果托管给ImGui自己去处理事件，会造成上述的两个**Bug**，所以有部分事件需要**手动处理**。

### WASD Bug

摄像机的OnUpdate，**是放在update里的，所以每帧都会执行**

因为一直在update，所以不管哪个ImGui视口在wasd 摄像机都会移动的。

```cpp
void EditorLayer::OnUpdate(Timestep ts)
{
    HZ_PROFILE_FUNCTION();
    m_CameraController.OnUpdate(ts);

```

### 滚轮滚动Bug

需要提的是：EditorLayer层在OnImGuiRender函数中渲染了**两个**ImGui视口

- 当两个ImGui视口**都在窗口同一个平面**上会造成此Bug

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308319.png)

  - 文字讲解事件流程

    1. 当用户鼠标滚轮滚动时

    2. 窗口将滚动事件**发给Application**

       （需注意：ImGuiLayer类中注册了**依赖此窗口**，所以也会ImGui视口**不通过**OnEvent函数也可以**接收到窗口事件**（所以在022节删掉了ImGuiLayer类的OnEvent函数，让ImGui自己去处理窗口事件））

    3. Application再给EditorLayer层去处理

    4. 而EditorLayer层的OnEvent中调用摄像机的OnEvent

    5. 摄像机的Event会去捕捉鼠标滚动事件并且处理（更新宽高比）

  - 代码讲解事件流程（复习为了给解决此Bug铺垫）

    1. 层级

       Application的LayerStack m_LayerStack;

       在GameEngineEditorApp.cpp构造函数中PushLayer(new EditorLayer());

       ​	在**前面**插入了EditorLayer层级。

    2. Application.cpp处理事件

       ```cpp
       void Application::OnEvent(Event& e) {
           HZ_PROFILE_FUNCTION();
           ......
               // 从后往前
           for (auto it = m_LayerStack.end(); it != m_LayerStack.begin();) {
               if (e.Handled)
                  break;
                (*--it)->OnEvent(e);
           }
       }
       ```

    3. 在EditorLayer层级类的OnEvent函数中调用了摄像机事件

       ```cpp
       void EditorLayer::OnEvent(Event& event)
       {
           // 摄像机事件
           m_CameraController.OnEvent(event);
       }
       ```

    4. 在OrthographicCameraController类中的OnEvent函数**捕捉鼠标滚轮事件并且处理**

       ```cpp
       void Hazel::OrthographicCameraController::OnEvent(Event& e)
       {
           HZ_PROFILE_FUNCTION();
       
           EventDispatcher dispatcher(e);
           dispatcher.Dispatch<MouseScrolledEvent>(HZ_BIND_EVENT_FN(OrthographicCameraController::OnMouseScrolled));
           dispatcher.Dispatch<WindowResizeEvent>(HZ_BIND_EVENT_FN(OrthographicCameraController::OnWindowResized));
       }
       bool Hazel::OrthographicCameraController::OnMouseScrolled(MouseScrolledEvent& e)
       {
           HZ_PROFILE_FUNCTION();
       
           m_ZoomLevel -= e.GetYOffset() * 0.25f;
           m_ZoomLevel = std::max(m_ZoomLevel, 0.25f);
           CalculateView();
           return false;
       }
       ```

- 但是当两个ImGui视口**<font color = "green">不</font>在窗口同一个平面**上<font color="green">**不**</font>会造成此Bug

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308329.png)

  即当在setting视口上滚动鼠标，Viewport摄像机不会调整宽高比

  - 解释前需要了解

    窗口将滚动事件**发给Application**，虽然没有发送给ImGui

    但是需注意：ImGuiLayer类中注册了**依赖此窗口**，所以也会ImGui视口**不通过**OnEvent函数也可以**接收到窗口事件**

    （所以在022节删掉了ImGuiLayer类的OnEvent函数，让ImGui自己去处理窗口事件）

  - 当把setting与Viewport不在同一个平面时

    1. 用户在setting滚动滚轮，窗口有滚动事件

    2. Setting视口接收窗口滚动事件（ImGui内部实现不清如何传递给ImGui视口）

    3. 在ImGui内部，应该让Setting视口处理此窗口滚动事件

       由于setting与viewport不在同一个平面，所以被内部设置为已处理，没有下一个ImGui视口需要处理，所以不会给Viewport视口（猜测）（可以认为被setting视口**堵塞**此事件）

### 为了解决上述两个Bug所做

- 提前需要了解：层级Application的LayerStack m_LayerStack;

  在构造函数中PushOverlay(m_ImGuiLayer);

  ​	在**末尾**放入了imguilayer

  在GameEngineEditorApp.cpp构造函数中PushLayer(new EditorLayer());

  ​	在**前面**插入了EditorLayer。

- 为了解决上述两个Bug所做：在ImGuiLayer中添加OnEvent函数

  ```cpp
  class HAZEL_API ImGuiLayer :public Layer
  {
      public:
      ImGuiLayer();
      ~ImGuiLayer();
  
      virtual void OnAttach() override;
      virtual void OnDetach() override;
      virtual void OnImGuiRender() override;
      virtual void OnEvent(Event& event) override;// 新添加
  ```

  ```cpp
  void ImGuiLayer::OnEvent(Event& e) {
      ImGuiIO& io = ImGui::GetIO();
      e.Handled |= e.IsInCategory(EventCategoryMouse) & io.WantCaptureMouse; 
      e.Handled |= e.IsInCategory(EventCategoryKeyboard) & io.WantCaptureKeyboard;
  }
  /*
  imgui视口会阻塞鼠标滚轮事件，即ImGuiLayer视口处理了鼠标滚轮事件，不会传入给下一级Layer的OnEvent。
  for (auto it = m_LayerStack.end(); it != m_LayerStack.begin();) {
      if (e.Handled)
      	break;
      (*--it)->OnEvent(e);
  }
  */
  ```

- 添加OnEvent函数的**目的**是

  在setting视口按下wasd键

  1. 窗口发送**滚轮滚动事件**给Application

  2. Application循环LayerStack，执行层级的OnEvent函数

  3. 由于ImGuiLayer层级在最**末尾**，是最**先**处理事件的层级

  4. 在ImGuiLayer层的OnEvent函数中

     e.Handled = e.handled | true & true; 结果为true

     所以上述的Application中循环处理滚轮滚动 event事件会跳出，而**不会执行**EditorLayer的onevent函数

     所以在viewport视口无法接收到滚轮滚动事件，摄像机也不会接收到滚轮滚动事件，调整宽高比。

- 但具有**新问题**

  - 问题1

    注意上一小点，没有写上按键按下事件是因为，这个在OnUpdate函数中每帧处理，无法通过事件阻止

  - 新问题是

    无论在viewport还是setting视口滚轮滚动，摄像机都不会接收**滚轮滚动事件**，从而调整宽高比

    **因为**被ImGuiLayer的OnEvent函数**堵塞了**滚轮滚动事件，不会传递给EditorLayer层级。

## 解决ImGuiLayer有OnEvent函数后的问题

- 解决思路

  由ImGui视口能获取**焦点**和**鼠标停留**bool值，用这两个bool值来处理新bug和wasd bug。

- 解决新bug具体代码思路

  - 获取焦点和鼠标停留bool，并通过这两个组合来设置是否阻塞事件

    ```c++
    void EditorLayer::OnImGuiRender(){
    ////////////////////////////////////////////////////////////
    // 注意是获取Viewport视口下的bool值，来决定settings视口是否需要堵塞相应事件
    ImGui::Begin("Viewport");
    
    m_ViewportFocused = ImGui::IsWindowFocused();
    m_ViewportHovered = ImGui::IsWindowHovered();
    
    Application::Get().GetImGuiLayer()->BlockEvents(!m_ViewportFocused || !m_ViewportHovered);
    /*
    bool canshu = !m_ViewportFocused || !m_ViewportHovered;
    m_ViewportFocused = true,  m_ViewportHovered = true; canshu = false, m_BlockEvents：false-> viewport视口 能 接收滚轮事件（即用户在settings视口上操作时，viewport视口无法接收事件）
    m_ViewportFocused = false, m_ViewportHovered = true;canshu = true,   m_BlockEvents：true-> viewport视口 不 能接收滚轮事件
    m_ViewportFocused = true,  m_ViewportHovered = true; canshu = true,  m_BlockEvents：true-> viewport视口 不 能接收滚轮事件
    */
    ```

  - 用m_ViewportFocused解决在另外一个窗口wasd，视口也有反应

    ```c++
    void EditorLayer::OnUpdate(Timestep ts)
    {
        HZ_PROFILE_FUNCTION();
        // 当焦点聚焦，才能wasd
        if (m_ViewportFocused) {
            m_CameraController.OnUpdate(ts);
        }
    ```

  - 在ImGuiLayer中

    写是否堵塞鼠标滚动布尔值

    ```c++
    void BlockEvents(bool block) { m_BlockEvents = block; }
    ```

    由这个布尔值来决定窗口是否阻塞滚动事件，即viewport能不能接受事件

    ```c++
    void ImGuiLayer::OnEvent(Event& e) {
        /*
    		m_BlockEvents：false-> settings视口不阻塞事件，viewport面板能接收滚轮事件
    		m_BlockEvents：true->  		   视口阻塞事件，viewport视口不能接收滚轮事件
    	*/
        if (m_BlockEvents) {
            /*
            imgui窗口会阻塞鼠标滚轮事件，即ImGuiLayer窗口处理了鼠标滚轮事件，不会传入给下一级的OnEvent。
            因为Application的onevent处理了窗口滚动，就会跳出
            for (auto it = m_LayerStack.end(); it != m_LayerStack.begin();) {
                if (e.Handled)
                    break;
                (*--it)->OnEvent(e);
            }
            */
            ImGuiIO& io = ImGui::GetIO();
            e.Handled |= e.IsInCategory(EventCategoryMouse) & io.WantCaptureMouse; // e.Handled = e.handled | true & true; 结果为true，所以上述的application 的 event会跳出
            e.Handled |= e.IsInCategory(EventCategoryKeyboard) & io.WantCaptureKeyboard;
        }
    }
    ```

- 解决wasd bug思路

  ```cpp
  void EditorLayer::OnUpdate(Timestep ts)
  {
      HZ_PROFILE_FUNCTION();
      ////////////////////////////////////////////
      // 当焦点聚焦在viewport视口时，摄像机才能OnUpdate
      if (m_ViewportFocused) {
          m_CameraController.OnUpdate(ts);
      }
  ```

  

