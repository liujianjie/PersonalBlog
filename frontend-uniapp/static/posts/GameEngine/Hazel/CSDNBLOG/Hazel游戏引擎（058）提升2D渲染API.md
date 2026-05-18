> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  Cherno在使用目前的hazel做2D小游戏的时候发现有些功能实现起来比较复杂，就是旋转这部分

  所以需要重载DrawQuad方法进行**添加旋转**的功能。

- Cherno提到

  Api的扩展是需要**持续下去**的，扩展的功能特别是在**实际使用中**才能想到。

# 改进地方

- glsl纹理采样坐标从0-1到0-10应由CPP绘图API控制

  ```glsl
  color = texture(u_Texture, v_TexCoord * 10.0) * u_Color;	
  ```

  改为

  ```glsl
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  
  in vec2 v_TexCoord;
  uniform vec4 u_Color;
  uniform float u_TilingFactor;// 由这个控制
  
  uniform sampler2D u_Texture; 
  
  void main() {
  	color = texture(u_Texture, v_TexCoord * u_TilingFactor) * u_Color;	
  }
  ```

- 优化CPP绘图API

  不再是绘制一个纯颜色的图形、一个纯纹理的图形

  **增加了**绘制一个颜色与纹理**混合**的图形

# 代码

- glsl

  ```cpp
  // 纹理的glsl
  #type vertex
  #version 330 core
  
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec2 a_TexCoord;
  
  uniform mat4 u_ViewProjection;
  uniform mat4 u_Transform;
  
  out vec3 v_Position;
  out vec2 v_TexCoord;
  
  void main() {
  	v_TexCoord = a_TexCoord;
  	gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
  }
  
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  
  in vec2 v_TexCoord;
  uniform vec4 u_Color;
  uniform float u_TilingFactor;// 控制纹理坐标
  
  uniform sampler2D u_Texture; 
  
  void main() {
  	color = texture(u_Texture, v_TexCoord * u_TilingFactor) * u_Color;	
  }
  ```

- Renderer2D.cpp

  新增和扩展API

  ```cpp
  void Hazel::Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color){
      DrawQuad({ position.x, position.y, 0.0f }, size, color);
  }
  void Hazel::Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color){
      HZ_PROFILE_FUNCTION();
  
      s_Data->TextureShader->SetFloat4("u_Color", color);
      s_Data->TextureShader->SetFloat("u_TilingFactor", 1.0f);
  
      // 绑定纹理
      s_Data->WhiteTexture->Bind();
  
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  void Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor){
      DrawQuad({ position.x, position.y, 0.0f }, size, texture, tilingFactor, tintColor);
  }
  void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor){
      HZ_PROFILE_FUNCTION();
  
      s_Data->TextureShader->SetFloat4("u_Color", tintColor);
      s_Data->TextureShader->SetFloat("u_TilingFactor", tilingFactor);
      // 绑定纹理
      texture->Bind();
  
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  //////////////////////////////////////////////////////
  // 新增 旋转API 不带纹理////////////////////////////////
  void Renderer2D::DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const glm::vec4& color){
      DrawrRotatedQuad({position.x, position.y, 0.0f}, size, rotation, color);
  }
  void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const glm::vec4& color){
      HZ_PROFILE_FUNCTION();
  
      s_Data->TextureShader->SetFloat4("u_Color", color);
      s_Data->TextureShader->SetFloat("u_TilingFactor", 1.0f);
  
      // 绑定纹理，白色
      s_Data->WhiteTexture->Bind();
  
      // 旋转融入到transform矩阵中/////////////////////////////////////
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::rotate(glm::mat4(1.0f), rotation, { 0.0f, 0.0f, 1.0f }) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  //////////////////////////////////////////////////////
  // 新增 旋转API 带纹理////////////////////////////////
  void Renderer2D::DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
  {
      DrawrRotatedQuad({ position.x, position.y, 0.0f }, size, rotation, texture, tilingFactor, tintColor);
  }
  void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
  {
      HZ_PROFILE_FUNCTION();
  	
      // **增加了**绘制一个颜色与纹理**混合**的图形
      s_Data->TextureShader->SetFloat4("u_Color", tintColor);// 不再是永远的白色
      s_Data->TextureShader->SetFloat("u_TilingFactor", tilingFactor);
      // 绑定纹理
      texture->Bind();
  	
      // 旋转融入到transform矩阵中/////////////////////////////////////
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::rotate(glm::mat4(1.0f), rotation, { 0.0f, 0.0f, 1.0f }) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  ```

- Sandbox2D.cpp

  ```cpp
  {
      HZ_PROFILE_SCOPE("Renderer Draw");
      Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
      //Hazel::Renderer2D::DrawQuad({-1.0f, 0.0f}, {0.8f,0.8f}, m_FlatColor);
      // 旋转角度：+30
      Hazel::Renderer2D::DrawrRotatedQuad({ -1.0f, 0.0f }, { 0.8f,0.8f },glm::radians(30.0f), m_FlatColor);
      Hazel::Renderer2D::DrawQuad({ 0.5f, -0.5f }, { 0.5f, 0.8f }, {0.2f, 0.8f, 0.9f, 1.0f});
      //Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 10.0f, 10.0f }, m_SquareTexture, 10.0f, {1.0f, 0.8f, 0.2f, 1.0f});
      // 旋转角度：-30
      Hazel::Renderer2D::DrawrRotatedQuad({ 0.0f, 0.0f, -0.1f }, { 10.0f, 10.0f }, glm::radians(-30.0f),  m_SquareTexture, 10.0f, { 1.0f, 0.8f, 0.2f, 1.0f });
      Hazel::Renderer2D::EndScene();
  
  ```

# 效果图

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231821871.png)

正30是图形向**左**旋转

负30是图形向**右**旋转

