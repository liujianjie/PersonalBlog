> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 要实现什么

  完善093节的Gizmos，点击场景的物体，即会显示gizmos，而**不用点击**hierarchy的实体才会显示。

- 实现思路

  光栅化输出到界面有**每一个像素对应的实体ID**（这节要实现的）

- 实现要求 (下几节要实现的)

  1. 设计鼠标点击屏幕将鼠标坐标**转换**
  2. 实现能**采样当前像素的值**，从而得到对应hierarchy中对应实体的ID。

- 此节要完成

  由下面的思路三得出：

  1. 修改和优化**帧缓冲**类，**能附加多个不同类别缓冲区**。

  2. 使得帧缓冲区可以附加**两个**颜色纹理，实现一个渲染通道有两个渲染目标，并且imgui可以显示出**第二个**渲染目标

# 如何将实体ID值附加到像素上

## 思路一

- 方法

  使用**Uniform**

- 问题

  当前场景使用批处理，虽然场景显示了3个实体，但实际上调用**一次drawcall**属于一个对象，无法用Uniform确定当前一个整体的分块。

  除非每一个实体调用一个drawcall，这样不使用批处理效率会降低，不行。

## 思路二

- 方法

  将实体ID附加到**顶点**缓冲区中。

- 实现Demo

  在顶点缓冲布局中添加实体ID，这样**每个顶点都有一个自己的EntityID值，再将这个ID值作为像素的颜色值，这样就可以成功在当前实体里的每个像素都有这个ID值**，即在代码位置为:

  ```cpp
  struct QuadVertex {
      glm::vec3 Position;
  	.....
      // Editor-only;
      int EntityID;
  };
  // 2.1设置顶点缓冲区布局
  s_Data.QuadVertexBuffer->SetLayout({
      {Hazel::ShaderDataType::Float3, "a_Position"},
  	.....
      {Hazel::ShaderDataType::int, "a_EntityID"}
  });
  ```

  ```cpp
  void Renderer2D::DrawQuad(const glm::mat4& transform, const glm::vec4& color, const int entityId)
  {
      if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {
          NextBatch();
      }
      constexpr size_t quadVertexCount = 4;
      ......
      // quad的左下角为起点
      for (size_t i = 0; i < quadVertexCount; i++) {
          s_Data.QuadVertexBufferPtr->Position = transform * s_Data.QuadVertexPosition[i];
  		......
          ////////////////////////////////////////////////////////////
          s_Data.QuadVertexBufferPtr->EntityId = entityId;// 在这写
          s_Data.QuadVertexBufferPtr++;
      }
      s_Data.QuadIndexCount += 6;// 每一个quad用6个索引
      s_Data.Stats.QuadCount++;
  }
  ```

- 问题

  由于使用了动态顶点缓冲区，即又要重写RendererAPI，可是本身RendererAPI就有很多代码，若再重写，将会**混乱**

  例如：

  当前项目的结构是，一个渲染通道（drawcall）对应一个渲染目标（帧缓冲的缓冲附件），这个渲染目标（帧缓冲的缓冲附件）已经**输出**了颜色（这个缓冲区只有颜色值），那实体ID值应该渲染到哪个渲染目标上（帧缓冲的缓冲附件）上呢？

# 解决思路二的问题

- 前言

  为实体ID**创建**一个渲染目标（帧缓冲的缓冲附件）

- 方法

  当前项目的渲染目标是**帧缓冲，帧缓冲可以附加多个缓冲区，所以只需要将实体ID缓冲区随已经存在的颜色缓冲区之后附加到帧缓冲即可**

- 结果

  因为帧缓冲可以附加其它缓冲区的性质，**这样一个渲染通道实现了两个渲染目标**（对应标题）

- 如何实现

  修改和优化帧缓冲类，由于附加缓冲区需要指明缓冲区的数据类型和一些参数，在当前项目附加一个颜色缓冲区**写死**了这些参数，所以要修改成动态的，**能附加多个不同类别缓冲区**。

- 回顾开头所说的：此节要完成

  使得帧缓冲区可以附加两个颜色纹理，实现**一**个渲染通道实现**两**个渲染目标，并且imgui可以显示出第二个渲染目标

# 讲解：帧缓冲类修改重点

- 创建纹理

  原先是

  ```cpp
  glCreateTextures(GL_TEXTURE_2D, 1, &m_ColorAttachment);;
  ```

  修改后是

  ```cpp
  // 2.1创建纹理。m_ColorAttachments.data()是地址，可以创建多个缓冲区
  Utils::CreateTextures(multisample, m_ColorAttachments.data(), m_ColorAttachments.size());
  
  static void CreateTextures(bool multisampled, uint32_t* outID, uint32_t count) {// outID 是vector的起始位置
      glCreateTextures(TextureTarget(multisampled), count, outID);;
  }
  ```

  若m_ColorAttachments.size()是2，且m_ColorAttachments[0] = 3, 那么m_ColorAttachments[1] = 4，3和4是**缓冲区ID**

- 颜色纹理附加到帧缓冲

  原先是

  ```cpp
  // 1.1颜色纹理缓冲区附加到帧缓冲
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, m_ColorAttachment, 0);
  ```

  修改后是

  ```cpp
  // 颜色纹理缓冲区附加到帧缓冲：第二个参数重要，可以附加多个颜色纹理缓冲区！**
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0 + index, TextureTarget(multisampled), id, 0);
  ```

- 由于附加多个颜色纹理缓冲区到帧缓冲中，所以要用glDrawBuffers 定义**多个渲染目标**

  ```cpp
  // 新加的！！！指定要Draw的颜色缓冲区列表
  if (m_ColorAttachments.size() > 1) {
      HZ_CORE_ASSERT(m_ColorAttachments.size() <= 4);
      // 这里id对应上面，颜色纹理附加到帧缓冲的ID
      GLenum buffers[4] = {GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1 ,GL_COLOR_ATTACHMENT2 ,GL_COLOR_ATTACHMENT3 };
      // 定义**多个渲染目标**
      glDrawBuffers(m_ColorAttachments.size(), buffers);
  }else if(m_ColorAttachments.empty()){
      // 只有深度缓冲
      glDrawBuffer(GL_NONE);
  }
  ```

  若只使用第一个颜色纹理缓冲区，不用上面代码，但使用第二个颜色纹理缓冲区必须要有

  ```cpp
  // 只使用两个颜色纹理缓冲区可以不用后面两个
  GLenum buffers[] = {GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1}
  ```

- 可以创建多重采样的纹理

  ```cpp
  bool multisampled = samples > 1;
  if (multisampled) {
      glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE, samples, format, width, height, GL_FALSE);
  }
  ```

# 流程：显示第二个渲染目标代码

- 指定要附加**两个**颜色纹理缓冲区给帧缓冲

  ```cpp
  FramebufferSpecification fbSpec;
  fbSpec.Attachments = { FramebufferTextureFormat::RGBA8, FramebufferTextureFormat::RGBA8, FramebufferTextureFormat::Depth};
  fbSpec.Width = 1280;
  fbSpec.Height = 720;
  m_Framebuffer = Framebuffer::Create(fbSpec);
  // 附加的代码都在OpenGlFramebuffer中
  ```

- glsl编写第二个输出的颜色纹理

  ```cpp
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  layout(location = 1) out vec4 color2;// 第二个渲染目标(颜色纹理)的颜色
  
  void main() {
  	 color = texture(u_Textures[int(v_TexIndex)], v_TexCoord * v_TilingFactor) * v_Color;
  	 color2 = vec4(0.9, 0.2, 0.3, 1.0);;// 输出到第二个渲染目标(颜色纹理)中，红色
  }
  ```

- EditorLayer根据**下标**获取第**二**个渲染目标的**缓冲区ID**，Imgui根据缓冲区ID呈现缓冲区的颜色纹理

  ```cpp
  // imgui渲染帧缓冲中的东西。
  // textureID是缓冲区ID
  uint32_t textureID = m_Framebuffer->GetColorAttachmentRendererID(1);
  ImGui::Image((void*)textureID, ImVec2(m_ViewportSize.x, m_ViewportSize.y), ImVec2(0, 1), ImVec2(1, 0));
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308062304633.png)

输出的是第二个缓冲区的颜色：vec4(0.9, 0.2, 0.3, 1.0)

