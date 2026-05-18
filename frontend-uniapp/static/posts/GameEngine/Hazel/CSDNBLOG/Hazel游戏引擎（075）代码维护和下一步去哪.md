> 文中若有代码、术语等错误，欢迎指正

[toc]

# 代码维护

## BUG修复

- 说明Bug

  当窗口**最小化**，imgui的viewportsize会是**负值**传入给帧缓冲重新设置大小

  但是帧缓冲的大小参数是**无符号**，所以会转换为一个很大的无符号整数

  帧缓冲的大小就会过大，导致重新最大化窗口时，摄像机投影**会变形**（摄像机的宽高比与帧缓冲的大小不匹配）

- 摄像机变形

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308522.png)

  最小化后，再打开

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302308529.png)

- 尝试修复此Bug

  判断如果**小于0**就**不要重置**帧缓冲大小，并且在帧缓冲大小写**如果过大就不重置**，**双层**保险

  ```cpp
  // EditorLayer.cpp
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize) &&
      viewportPanelSize.x > 0 && viewportPanelSize.y > 0) { // 改变了窗口大小
      // 调整帧缓冲区大小
      m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
      // 调整摄像机投影
      m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  // OpenGLFramebuffer.cpp
  void OpenGLFramebuffer::Resize(uint32_t width, uint32_t height)
  {
      if (width == 0 || height == 0 || width > s_MaxFramebufferSize || height > s_MaxFramebufferSize) {
          HZ_CORE_WARN("试图将frambuffer的大小设为{0} {1}", width, height);
          return;
      }
      m_Specification.Width = width;
      m_Specification.Height = height;
      Invalidate();// 重新生成
  }
  ```

但是结果是：暂时**解决不了**摄像机投影会变形问题（窗口**最小化**事件与窗口**重新调整大小**不是同一个事件）

## 讨论宏

1. 在Core.h中有根据宏来判断选择哪一个平台

2. 这样项目就需在设置-属性 的预编译选项 添加宏

3. 这样每个cpp文件**都有**这个宏并且在最上面（所以cpp文件能直接使用第2步添加的宏）

4. 虽然程序不会奔溃，但是不太好，宏太多了

   这是看视频自动翻译的解释，不知道有没有理解错。。。

# 下一步去哪

- 教人做引擎很困难

  就像教人研发一台汽车，不得不砍掉一些功能

  而开发一些熟悉和感兴趣的功能（渲染、事件）

  其它功能可能会采取**第三方库**的方法（实体组件、物理等）

- 引擎是一种一直要开发和维护的东西，除非人们不在继续开发游戏。

- 下一步会先做实体组件系统，有了实体，可以为其添加组件，然后用脚本控制。
