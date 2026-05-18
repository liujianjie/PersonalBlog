> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 引出

  由于47节，虽然设置了CameraController的窗口resize事件，但是OpenGL并没有改变渲染的位置，依旧是**原先的大小和位置**，所以需要调整OpenGL的渲染视口。

  后期我们需要为引擎实现不依靠停留在窗口也可以渲染的区域，需要用到OpenGL的frame buffer

- 此节目的

  为了实现调整窗口大小后

  - OpenGL**绘图的区域**也会相应调整

    窗口调为0*0，OpenGL不应该渲染图形了

  - 摄像机也会根据窗口大小的变换，依旧保持正确的**宽高比**

# 当窗口大小改变时

原先窗口大小与显示效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307092219220.png)

## 错误例子

- 窗口放大，Opengl渲染区域不变

  如图，依旧是原先那一小块区域：重点观看**黄色块**，发现依旧渲染那么几块。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819536.png)

- 当窗口放大，OpenGL**绘图的区域**相应调整后

  因**未调整摄像机的宽高比**，显示的比例不对

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819330.png)

## 正确的例子

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231818327.png)

# 关键代码

- Application.cpp

  使用事件调度器捕捉响应Window调整大小事件

  ```cpp
  dispatcher.Dispatch<WindowResizeEvent>(BIND_EVENT_FN(OnWindowResize));// 捕捉响应Window调整大小事件
  
  bool Application::OnWindowResize(WindowResizeEvent& e)
  {
      if (e.GetWidth() == 0 || e.GetHeight() == 0) {
          m_Minimized = true;
          return false;
      }
      m_Minimized = false;
      Renderer::OnWindowResize(e.GetWidth(), e.GetHeight());// 在这个函数中，调用OpenGLRendererAPI::SetViewport
      return false;
  }
  
  if (!m_Minimized) {
      // 每一层在update
      for (Layer* layer : m_LayerStack) {
          layer->OnUpdate(timestep);
      }
  }
  ```

- OpenGL改变视口：**绘图的区域**改变

  ```cpp
  void OpenGLRendererAPI::SetViewport(uint32_t x, uint32_t y, uint32_t width, uint32_t height)
  {
  	glViewport(x, y, width, height);
  }
  
  ```

- 窗口大小调整，摄像机需要依旧保持正确的宽高比

  ```cpp
  bool Hazel::OrthographicCameraController::OnWindowResized(WindowResizeEvent& e)
  {
      // 重新计算宽高比
      m_AspectRatio = (float)e.GetWidth() / (float)e.GetHeight();
      m_Camera.SetProjection(-m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel);
      return false;
  }
  ```




