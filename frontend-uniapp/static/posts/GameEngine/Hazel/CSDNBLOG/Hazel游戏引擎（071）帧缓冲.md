> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 简介**帧**缓冲（我的理解）
  1. 可以将OpenGL渲染的场景放在这个帧缓冲中
  2. 然后可以把这个帧缓冲当做是颜色或者纹理采样区（取决于帧缓冲附加的缓冲**附件类型**）
  3. 在别处(Imgui)把这个帧缓冲当做颜色纹理渲染出来，就在ImGui界面上显示了原本应显示在屏幕上的场景
- 帧缓冲参考网址
  - [**CSDN帧缓冲的BLog**](https://blog.csdn.net/qq_34060370/article/details/129507170)
  - [**LearnOpenGL帧缓冲**](https://learnopengl-cn.github.io/04%20Advanced%20OpenGL/05%20Framebuffers/)

# 帧缓冲要点

- 需要**手动创建**帧缓冲的，像创建顶点缓冲区一样

- 创建帧缓冲时需要**附加信息**

  是用来存储颜色纹理、模板还是深度缓冲

  附加缓冲需要附加**缓冲ID**

- 在每帧绑定使用后都得**解绑**

# 代码流程

- 创建帧缓冲并**附加**纹理、深度与模板缓冲纹理

  ```c++
  void OpenGLFramebuffer::Invalidate()
  {
      // 1.创建帧缓冲
      glCreateFramebuffers(1, &m_RendererID);
      glBindFramebuffer(GL_FRAMEBUFFER, m_RendererID); // 绑定这个帧缓冲
  
      // 2.创建纹理
      glCreateTextures(GL_TEXTURE_2D, 1, &m_ColorAttachment);;
      glBindTexture(GL_TEXTURE_2D, m_ColorAttachment);
      // 旧的api吧
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, m_Specification.Width, m_Specification.Height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
      // 这里写错过，将glTexParameteri 写错成glTextureParameteri！！
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  
      // 1.1纹理附加到帧缓冲
      glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, m_ColorAttachment, 0);
  
      // 3.创建深度模板缓冲纹理附加到帧缓冲中
      glCreateTextures(GL_TEXTURE_2D, 1, &m_DepthAttachment);;
      glBindTexture(GL_TEXTURE_2D, m_DepthAttachment);
      // 新api吧
      glTexStorage2D(GL_TEXTURE_2D, 1, GL_DEPTH24_STENCIL8, m_Specification.Width, m_Specification.Height);
      //glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH24_STENCIL8, m_Specification.Width, m_Specification.Height, 0, GL_DEPTH_STENCIL, GL_UNSIGNED_INT_24_8, NULL);
  
      // 1.2深度模板缓冲纹理附加到帧缓冲中
      glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_TEXTURE_2D, m_DepthAttachment, 0);
  
      HZ_CORE_ASSERT(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE, "帧缓冲未创建完成");
  
      glBindFramebuffer(GL_FRAMEBUFFER, 0);// 取消绑定这个帧缓冲,以免不小心渲染到错误的帧缓冲上，比如深度、模板缓冲不会渲染到这里
  }
  ```

- 给创建的帧缓冲写入数据

  1. 绑定自定义的帧缓冲（等于**解绑**到渲染到**默认**的帧缓冲中）
  2. 正常渲染图形（将本由OpenGL渲染在屏幕上的图像写入到自定义的帧缓冲中（不再是**默认的帧缓冲**中））
  3. 解绑帧缓冲

  ```c++
  void Sandbox2D::OnUpdate(Hazel::Timestep ts)
  {
      HZ_PROFILE_FUNCTION();
  
      m_CameraController.OnUpdate(ts);
  
      // 渲染信息初始化
      Hazel::Renderer2D::ResetStats();
      {
          ///////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////
          // 这里
          HZ_PROFILE_SCOPE("Renderer Prep");
          // 1.绑定自定义的帧缓冲（等于解绑到渲染到默认的帧缓冲中）
          m_Framebuffer->Bind();
          // 2.正常渲染图形（将本由OpenGL渲染在屏幕上的图像写入到自定义的帧缓冲中（不再是**默认的帧缓冲**中））
          Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
          Hazel::RenderCommand::Clear();
  		......
          Hazel::Renderer2D::DrawrRotatedQuad({ 1.0f, 0.5f }, { 0.8f, 0.8f },30.0f, m_FlatColor);
          Hazel::Renderer2D::DrawQuad({ -1.0f, 0.0f }, { 0.8f, 0.8f }, m_FlatColor);
         .......
          // 3.解绑帧缓冲
          m_Framebuffer->Unbind();
      }
      ......
  ```

- Imgui渲染自定义的帧缓冲

  ```c++
  ImGui::Begin("Settings");
  auto stats = Hazel::Renderer2D::GetStats();
  ImGui::Text("Renderer2D Stats:");
  ImGui::Text("Draw Calls: %d", stats.DrawCalls);
  ImGui::Text("Quads: %d", stats.QuadCount);
  ImGui::Text("Vertices: %d", stats.GetTotalVertexCount());
  ImGui::Text("Indices: %d", stats.GetTotalIndexCount());
  
  ImGui::ColorEdit4("Square Color", glm::value_ptr(m_FlatColor));
  // 这里/////////////////////////////////////////////////////
  // imgui渲染帧缓冲中的东西(附在帧缓冲上的颜色纹理缓冲)
  uint32_t textureID = m_Framebuffer->GetColorAttachmentRendererID();
  ImGui::Image((void*)textureID, ImVec2{ 1280, 720 });
  
  ImGui::End();
  ```

- 效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307841.png)

# 测试帧缓冲

- 不在每帧**解绑**帧缓冲

  渲染出来的帧缓冲为灰色图像

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307840.png)

- 创建帧缓冲，但是**不附加**深度、模板缓冲纹理

  深度检测**失败**，后绘制的**覆盖**先绘制的

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307410.png)
