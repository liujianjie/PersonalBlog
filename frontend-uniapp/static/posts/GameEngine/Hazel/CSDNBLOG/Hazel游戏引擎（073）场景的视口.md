> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目标

  实现像unity的scene一样，可以独立出来的编辑场景的ImGui视口，也可以嵌在窗口中。

- 回顾

  - [048.窗口resize](https://blog.csdn.net/qq_34060370/article/details/131882725)

    为了实现调整<font color="red">**窗口大小**</font>后

    - OpenGL**绘图的区域**也会相应调整

      窗口调为0*0，OpenGL不应该渲染图形了

    - 摄像机也会根据窗口大小的变换，依旧保持正确的**宽高比**

  - 而此节是

    为了实现调整<font color="green">**ImGui视口**</font>大小后

    - **帧缓冲大小**也相应调整（需要重新生成帧缓冲来调整）
    - OpenGL视口也相应改变：**绘图的区域**改变（glviewport函数）
    - 摄像机也（根据ImGui视口大小的变化），依旧保持正确的**宽高比**

# 代码流程

- 主要代码

  ```cpp
  ImVec2 viewportPanelSize = ImGui::GetContentRegionAvail();
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize)) { // 改变了窗口大小
      // 调整帧缓冲区大小
      m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
      // 调整摄像机保持正确的**宽高比**
      m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  // imgui渲染帧缓冲中的东西
  uint32_t textureID = m_Framebuffer->GetColorAttachmentRendererID();
  ImGui::Image((void*)textureID, ImVec2(m_ViewportSize.x, m_ViewportSize.y), ImVec2(0, 1), ImVec2(1, 0));
  ```

  ```cpp
  void OpenGLFramebuffer::Resize(uint32_t width, uint32_t height)
  {
      m_Specification.Width = width;
      m_Specification.Height = height;
  
      Invalidate();// （需要重新生成帧缓冲来调整）
  }
  ```

  ```cpp
  // 在下次帧缓冲被**绑定**时，OpenGL视口大小被设置为imgui视口大小
  void OpenGLFramebuffer::Bind()
  {
      glBindFramebuffer(GL_FRAMEBUFFER, m_RendererID);
      glViewport(0, 0, m_Specification.Width, m_Specification.Height);
  }
  ```

- 讲解流程

  1. 获取imgui视口大小

  2. 判断imgui视口大小是否改变

  3. 设置**帧缓冲大小**为imgui视口大小（需要重新生成帧缓冲来调整）

  4. 记录当前imgui视口大小

  5. 设置摄像机保持正确的**宽高比**

  6. 在下次帧缓冲被**绑定**时，OpenGL视口大小被设置为imgui视口大小

# 测试

测试ImGui视口调整后，帧缓冲大小，OpenGL视口，摄像机宽高比分别启用与关闭造成的效果

- **帧缓冲大小（x），OpenGL视口(x)，摄像机宽高比(x)**

  ```cpp
  void OpenGLFramebuffer::Bind()
  {
      glBindFramebuffer(GL_FRAMEBUFFER, m_RendererID);
      // 关闭调整OpenGL视口
      // glViewport(0, 0, m_Specification.Width, m_Specification.Height);
  }
  ```

  ```cpp
  ImVec2 viewportPanelSize = ImGui::GetContentRegionAvail();
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize))
  {
      // 关闭帧缓冲大小调整
      //m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
      // 摄像机宽高比调整
      //m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  uint32_t textureID = m_Framebuffer->GetColorAttachmentRendererID();
  // 这里m_ViewportSize.x, m_ViewportSize.y
  ImGui::Image((void*)textureID, ImVec2{ m_ViewportSize.x, m_ViewportSize.y }, ImVec2{ 0, 1 }, ImVec2{ 1, 0 });
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307230.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307237.png)

  如上图，窗口 y（高） **缩小**，图像 y（高） 会跟着**缩小**

- **帧缓冲大小（√），OpenGL视口(√)，摄像机宽高比(x)**

  ```cpp
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize))
  {
      m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
      //m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307236.png)

  如上图，窗口 y 缩小，图像 y 会跟着**缩小**, 和第一个差不多

- **帧缓冲大小（√），OpenGL视口(x)，摄像机宽高比(x)**

  ```cpp
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize))
  {
      m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
      //m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  //		glViewport(0, 0, m_Specification.Width, m_Specification.Height);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307239.png)

  如上图，窗口 y 缩小，图像 y **不会**缩小

- **帧缓冲大小（√），OpenGL视口(x)，摄像机宽高比(√)**

  ```c++
  if (m_ViewportSize != *((glm::vec2*)&viewportPanelSize))
  {
      m_Framebuffer->Resize((uint32_t)viewportPanelSize.x, (uint32_t)viewportPanelSize.y);
      m_ViewportSize = { viewportPanelSize.x, viewportPanelSize.y };
     m_CameraController.OnResize(viewportPanelSize.x, viewportPanelSize.y);
  }
  //		glViewport(0, 0, m_Specification.Width, m_Specification.Height);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307602.png)

  如上图，窗口y缩小，图像y会缩小。。

- **帧缓冲大小（√），glviewport(√)，摄像机(√)**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307920.png)

  这就比例正确了，其它均有问题
