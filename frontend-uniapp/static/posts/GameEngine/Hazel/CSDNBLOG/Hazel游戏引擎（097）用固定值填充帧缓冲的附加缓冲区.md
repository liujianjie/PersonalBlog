> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前情提要

  1. 由上节已经可以**读取**鼠标位置的颜色缓冲区的值
  2. 但是当读取不是quad的范围的值是一个**奇怪的数字**
  3. 是因为cpp代码中使用了glClearColor(color.r, color.g, color.b, color.a);将缓冲区**默认**填上了颜色
  4. 这个颜色本来是float值，**转换**为int读取出来则是奇怪的数字

- 此节目的

  读取不是quad的范围的值返回特定的**-1**值

- 如何实现

  使用新的OpenGL函数[glClearTexImage](https://docs.gl/gl4/glClearTexImage)，用**特定值**填充缓冲区

- 实现细节

  1. 由于这个glClearTexImage函数根据是设置为int值，还是float值需要**指定不同参数**
  2. 需要适当考虑**扩展性**，但当前只需要填充int值，所以可以先简单写死，后面有增加则再改。

# 关键代码

- 将缓冲区填上了颜色后，需用**特定值**填充帧缓冲的第二个缓冲区

  ```cpp
  // 将渲染的东西放到帧缓冲中
  m_Framebuffer->Bind();
  RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
  RenderCommand::Clear();
  
  /////////////////////////////////////////////////////////
  // 用-1填充帧缓冲的第二个颜色缓冲区
  m_Framebuffer->ClearAttachment(1, -1);
  ```

- 具体填充函数

  ```cpp
  void OpenGLFramebuffer::ClearAttachment(uint32_t attachmentIndex, int value)
  {
      HZ_CORE_ASSERT(attachmentIndex < m_ColorAttachments.size());
  
      auto& spec = m_ColorAttachmentSpecifications[attachmentIndex];
      ///////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////
      // 使用glClearTexImage函数
      glClearTexImage(m_ColorAttachments[attachmentIndex], 0, 		Utils::FramebufferTextureFormatToGLenum(spec.TextureFormat), GL_INT, &value);
  }
  
  static GLenum FramebufferTextureFormatToGLenum(FramebufferTextureFormat format) {
      switch (format)
      {
          case FramebufferTextureFormat::RGBA8:
              return GL_RGBA8;
          case FramebufferTextureFormat::RED_INTEGER:
              return GL_RED_INTEGER;
      }
      HZ_CORE_ASSERT(false);
      return 0;
  }
  ```

# 效果

​	![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122226303.png)

