> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前一节的bug

  多次加载场景，不会**清空**当前场景，会将新场景的实体和当前场景的实体一起呈现

- 此节目的

  可以有询问**对话框**保存、解析场景

  - 新场景：不绘制的实体，创建一个空白的场景
  - 保存场景：有对话框，问保存到本地哪个位置
  - 加载场景：有对话框，从本地哪个位置加载场景，**重新创建新场景即可解决上一节的bug**

- 实现细节

  Cherno说对话框**不应该依赖ImGUI库**，因为实现稍微麻烦且有点奇怪，在当前平台应用对应当前平台的对话框，比如：在window操作系统上就用win32的对话框，一方面是win32的api 对话框挺方便的。

  需要判断当前是哪个平台，不同平台用不同的窗口API。

- 设计

  此节设计和074的修改input类一样。

  在PlatformUtils.h中**声明静态**的函数

  在WindowsPlatformUtils.cpp中**定义**PlatformUtils的函数、在LinuxPlatformUtils.cpp中**定义**PlatformUtils的函数。。。

  根据宏决定编译哪个cpp

# 关键代码

- 新场景

  ```cpp
  void EditorLayer::NewScene()
  {
      // 创建新场景 ，这段代码可解决 多次加载场景，会将新场景的实体和当前场景的实体一起呈现的bug
      m_ActiveScene = CreateRef<Scene>();
      m_ActiveScene->OnViewportResize((uint32_t)m_ViewportSize.x, (uint32_t)m_ViewportSize.y);
      m_SceneHierarchyPanel.SetContext(m_ActiveScene);
  }
  ```

- 对话框保存文件

  ```cpp
  #include <commdlg.h>
  #include <GLFW/glfw3.h> // 这个是打开了对话框，需要记录父窗口是谁
  #define GLFW_EXPOSE_NATIVE_WIN32
  #include <GLFW/glfw3native.h>
  
  std::string FileDialogs::SaveFile(const char* filter) {
      OPENFILENAME ofn;
      CHAR szFile[260] = { 0 };
      ZeroMemory(&ofn, sizeof(OPENFILENAME));
      ofn.lStructSize = sizeof(OPENFILENAME);
      // 父窗口是谁
      ofn.hwndOwner = glfwGetWin32Window((GLFWwindow*)Application::Get().GetWindow().GetNativeWindow());
      ofn.lpstrFile = szFile;
      ofn.nMaxFile = sizeof(szFile);
      ofn.lpstrFilter = filter;
      ofn.nFilterIndex = 1;
      ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;
      if (GetSaveFileNameA(&ofn) == TRUE) {
          return ofn.lpstrFile;
      }
      return std::string();
  }
  ```

- 对话框加载文件

  ```cpp
  std::string FileDialogs::OpenFile(const char* filter) {
      OPENFILENAME ofn;
      CHAR szFile[260] = { 0 };
      ZeroMemory(&ofn, sizeof(OPENFILENAME));
      ofn.lStructSize = sizeof(OPENFILENAME);
      // 父窗口是谁
      ofn.hwndOwner = glfwGetWin32Window((GLFWwindow*)Application::Get().GetWindow().GetNativeWindow());
      ofn.lpstrFile = szFile;
      ofn.nMaxFile = sizeof(szFile);
      ofn.lpstrFilter = filter;
      ofn.nFilterIndex = 1;
      ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_NOCHANGEDIR;
      if (GetOpenFileNameA(&ofn) == TRUE) {
          return ofn.lpstrFile;
      }
      return std::string();
  }
  ```

- 快捷键功能实现

  不知道为什么只能点击scene的视口才能监听到快捷键事件。。

  ```cpp
  void EditorLayer::OnEvent(Event& e)
  {
      EventDispatcher dispatcher(e);
      dispatcher.Dispatch<KeyPressedEvent>(HZ_BIND_EVENT_FN(EditorLayer::OnKeyPressed));
  }
  
  bool EditorLayer::OnKeyPressed(KeyPressedEvent& e)
  {
      if (e.GetRepeatCount() > 0) {
          return false;
      }
      bool control = Input::IsKeyPressed(Key::LeftControl) || Input::IsKeyPressed(Key::RightControl);
      bool shift = Input::IsKeyPressed(Key::LeftShift) || Input::IsKeyPressed(Key::RightShift);
      switch (e.GetKeyCode()) {
          case Key::N: {
              if (control) {
                  NewScene();
              }
              break;
          }
          case Key::O: {
              if (control) {
                  OpenScene();
              }
              break;
          }
          case Key::S: {
              if (control && shift) {
                  SaveSceneAs();
              }
              // 保存当前场景:要有一个记录当前场景的路径。
              if (control) {
  
              }
              break;
          }
      }
      return false;
  }
  ```

# 实现效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302313377.png)

# Bug记录

- bug1

  选择当前场景的一个实体，然后新建场景，会报错。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302313384.png)

  因为SceneHierarchyPanel绘制UI时候，有一个保存了当前点击了哪个实体的属性，当新建场景清空了这个实体，但这个cpp还引用了这个实体，再绘制就会报错。

  ```cpp
  // 判断当前点击的实体是否存在
  ImGui::Begin("Properties");
  if (m_SelectionContext) { // operator uint32_t() 的是const，不然不会调用operator bool(),而是调用uint32_t()
      DrawComponents(m_SelectionContext);
  }
  ImGui::End();
  ```

  所以应在SetContext中一旦设置了新的场景，说明上一个场景的选择的实体已经被删除，得置为空，这样就不会绘制了。

  ```cpp
  void SceneHierarchyPanel::SetContext(const Ref<Scene>& context)
  {
      m_Context = context;
      m_SelectionContext = {};
  }
  ```


- Bug2

  win32的代码，字符数组赋值时。E0513	不能将 "const char *" 类型的值分配到 "LPCWSTR" 类型的实体

  方法一：添加头文件 #include<tchar.h> ， 对字符串如”I like CSDN”或“上下五千年”，前面加上宏_T，变成_T(”I like CSDN”)或_T(“上下五千年”);

  方法二：点击Visual Stuido菜单  项目-->配置属性-->常规-->字符集，将Unicode字符集改为使用多字节字符集。
  ————————————————
  版权声明：本文为CSDN博主「Elvin_Chen」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
  原文链接：https://blog.csdn.net/whhit111/article/details/69662014
