> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  1. 上一节已经显示了帧缓冲第二个**颜色纹理**缓冲的颜色
  2. 这节需要把帧缓冲第二个缓冲区改变**类型**，为**有符号整形**对应实体ID。
  3. 并且需要增加获取当前鼠标在viewport视口的**相对位置**，然后读取鼠标位置像素的**帧缓冲中第二个缓冲区（渲染目标）**的数据。

- 如何实现

  - 修改帧缓冲第二个缓冲区类型

    利用上一节已经封装好了的OpenGlframebuffer，只需简单的设置为**GL_RED_INTEGER**

  - 鼠标在viewport视口的相对位置

    鼠标的**绝对**位置是：当前位置距离整个屏幕**左上角(0,0)**的位置

    鼠标的**相对**位置是：ImGui的API，**得到viewport视口左上角的绝对位置**，再鼠标绝对位置**减去**viewport窗口的左上角绝对位置即可

  - 读取缓冲区数据

    用OpenGL的API，**glReadBuffer**、glReadPixels

- 注意细节

  由于ImGui的viewport视口左上角为00，而OpenGL的左下角才是00，所以读取缓冲区数据时候需要**翻转y**（用视口高度**-** 鼠标y**相对位置**即可）。

# 完善代码+代码流程

## 完善代码：修改帧缓冲类

```cpp
// 1.1纹理附加到帧缓冲
switch (m_ColorAttachmentSpecifications[i].TextureFormat)
{
    case FramebufferTextureFormat::RGBA8:
        Utils::AttachColorTextures(m_ColorAttachments[i], m_Specification.Samples, GL_RGBA8, GL_RGBA, m_Specification.Width, m_Specification.Height, i);
        break;
    ////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////
    // 添加整形缓冲区附件
    case FramebufferTextureFormat::RED_INTEGER:
        Utils::AttachColorTextures(m_ColorAttachments[i], m_Specification.Samples, GL_R32I, GL_RED_INTEGER, m_Specification.Width, m_Specification.Height, i);
        break;
}
```

## 代码流程：获取鼠标在viewport视口的相对位置

- 先得到viewport视口左上角的**绝对**位置

  ```cpp
  // 1.先获取Viewport视口左上角与viewport视口标题栏距离的偏移位置（0,24)- 必须放这，因为标题栏后就是视口的左上角
  auto viewportOffset = ImGui::GetCursorPos();
  // 2.获取vieport视口大小 - 包含标题栏的高
  auto windowSize = ImGui::GetWindowSize();
  // 3.获取当前vieport视口标题栏左上角距离当前整个屏幕左上角（0,0）的位置
  ImVec2 minBound = ImGui::GetWindowPos();
  // 4.计算viewport视口的左上角距离当前整个屏幕左上角（0,0）的位置
  minBound.x += viewportOffset.x;
  minBound.y += viewportOffset.y;
  // 5. 计算viewport视口的右下角距离当前整个屏幕左上角（0,0）的位置
  ImVec2 maxBound = { minBound.x + windowSize.x, minBound.y + windowSize.y - viewportOffset.y };
  // 6. 保存左上角和右下角距离整个屏幕左上角的位置
  m_ViewportBounds[0] = { minBound.x, minBound.y };
  m_ViewportBounds[1] = { maxBound.x, maxBound.y };
  ```

  图画解释计算viewport视口的绝对位置（相对于整个屏幕左上角（0，0））

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308062305492.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308022324736.png)

- 鼠标**绝对**位置减去viewport窗口的左上角**绝对**位置

  ```cpp
  // 1.获取当前鼠标距离整个屏幕左上角(0,0)的位置
  auto [mx, my] = ImGui::GetMousePos();
  // 2.鼠标绝对位置减去viewport窗口的左上角绝对位置=鼠标相对于viewport窗口左上角的位置
  mx -= m_ViewportBounds[0].x;
  my -= m_ViewportBounds[0].y;
  
  // 3.viewport窗口的右下角绝对位置-左上角的绝对位置=viewport窗口的大小
  glm::vec2 viewportSize = m_ViewportBounds[1] - m_ViewportBounds[0];
  // 翻转y,使其左下角开始才是(0,0)
  my = viewportSize.y - my;
  int mouseX = (int)mx;
  int mouseY = (int)my;
  
  if (mouseX >= 0 && mouseY >= 0 && mouseX < (int)viewportSize.x && mouseY < (int)viewportSize.y) {
      //HZ_CORE_WARN("Mouse xy = {0} {1}", mouseX, mouseY);
      // 4.读取帧缓冲第二个缓冲区的数据
      int pixelData = m_Framebuffer->ReadPixel(1, mouseX, mouseY);
      HZ_CORE_WARN("Pixel data = {0}", pixelData);
  }
  ```

- 读取鼠标位置像素的**帧缓冲中第二个缓冲区（渲染目标）**的数据

  ```cpp
  int OpenGLFramebuffer::ReadPixel(uint32_t attachmentIndex, int x, int y)
  {
      HZ_CORE_ASSERT(attachmentIndex < m_ColorAttachments.size());
      ////////////////////////////////////////////////////
      // 关键函数glReadBuffer+glReadPixels
      glReadBuffer(GL_COLOR_ATTACHMENT0 + attachmentIndex);// 读取第二个缓冲区
      int pixelData = -1;
      glReadPixels(x, y, 1, 1, GL_RED_INTEGER, GL_INT, &pixelData);// 读取第二个缓冲区中的xy位置的缓冲区值
      return pixelData;
  }
  ```

- 第二个缓冲区（渲染目标）的数据在Glsl的片段着色器中设置

  ```cpp
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  layout(location = 1) out int color2;// 第二个渲染目标(有符号整形)
  
  in vec4 v_Color;
  in vec2 v_TexCoord;
  in float v_TexIndex;
  in float v_TilingFactor;
  
  uniform sampler2D u_Textures[32]; 
  
  void main() {
  	 color = texture(u_Textures[int(v_TexIndex)], v_TexCoord * v_TilingFactor) * v_Color;	// 新
  	 color2 = 50;// 第二个渲染目标(有符号整形的值)设为50
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308062304338.png)

![image-20230802234004210](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308062304351.png)

- 将鼠标放在绘画的图像上

  读取的值为50，是**正确**的

- 但是如果将鼠标放在黑色的区域上

  读取的值为1036831949，是奇怪的

  因为在Cpp代码中使用了glClearColor(color.r, color.g, color.b, color.a);将缓冲区默认填上了颜色，这个颜色本来是float值，转换为int读取出来则是奇怪的数字