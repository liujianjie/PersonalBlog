> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节所做1：控制图形在屏幕的位置和大小
  1. 在051节，Renderer2D渲染类的DrawQuad方法有position和size两个参数
  2. 这两个参数控制了绘画图形的**位置**和**缩放**，此节要做的就是将其实现。
- 此节所做2：Shader类添加纯虚函数
  1. Renderer2D渲染类中的shader类需要**动态指针**强转成子类（因为子类具有父类没有的函数）
  2. 所以需要在父类上添加对应纯虚函数，让子类去实现
  3. 这样基类类型指针指向子类并调用子类函数时，不需要动态指针强转，通过**动态多态**能执行子类的函数

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819238.png)

# 代码

- Sandbox2D.cpp

  ```cpp
  Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  Hazel::Renderer2D::DrawQuad({-1.0f, 0.0f}, {0.8f,0.8f}, m_FlatColor);
  Hazel::Renderer2D::DrawQuad({ 0.5f, -0.5f }, { 0.5f, 0.8f }, {0.2f, 0.8f, 0.9f, 1.0f});
  Hazel::Renderer2D::EndScene();
  ```

- Renderer2D.cpp

  ```cpp
  void Hazel::Renderer2D::BeginScene(const OrthographicCamera& camera)
  {
    // 上传矩阵数据到glsl
    s_Data->FlatColorShader->SetMat4("u_ViewProjection", camera.GetViewProjectionMatrix());
  }
  
  void Hazel::Renderer2D::EndScene()
  {
  }
  
  void Hazel::Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color)
  {
    DrawQuad({ position.x, position.y, 0.0f }, size, color);
  }
  
  void Hazel::Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color)
  {
    s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
    s_Data->FlatColorShader->Bind();		// 绑定shader
    // 设置transform
    ///////////////////////////////////////////////////////////////////
    // 这里////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////
    glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
     glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
    // shader类不再需要动态指针强转成子类
    // std::dynamic_pointer_cast<OpenGLShader>(s_Data->FlatColorShader)->UploadUniformFloat4("u_Color", color);
    s_Data->FlatColorShader->SetMat4("u_Transform", tranform);// 控制图形在屏幕的位置和大小
    s_Data->FlatColorShader->SetFloat4("u_Color", color);
    RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  ```

- Shader.cpp

  给这个父类添加子类才有的函数，并为纯虚函数，让子类去实现，这样调用子类函数时候，就不需要动态指针强转成子类指针了

  ```cpp
  virtual void SetFloat3(const std::string& name, const glm::vec3& value) = 0;
  virtual void SetFloat4(const std::string& name, const glm::vec4& value) = 0;
  virtual void SetMat4(const std::string& name, const glm::mat4& value) = 0;
  ```

- OpenGLShader.cpp

  去实现父类的虚函数，但是本质还是调用之前设计的UploadUniformFloat3、4函数

  ```cpp
  void OpenGLShader::SetFloat3(const std::string& name, const glm::vec3& value)
  {
      UploadUniformFloat3(name, value);
  }
  void OpenGLShader::SetFloat4(const std::string& name, const glm::vec4& value)
  {
      UploadUniformFloat4(name, value);
  }
  void OpenGLShader::SetMat4(const std::string& name, const glm::mat4& value)
  {
      UploadUniformMat4(name, value);
  }
  // 原本有的
  void OpenGLShader::UploadUniformMat3(const std::string& name, const glm::mat3& matrix)
  {
      GLint location = glGetUniformLocation(m_RendererID, name.c_str());
      glUniformMatrix4fv(location, 1, GL_FALSE, glm::value_ptr(matrix));
  }
  void OpenGLShader::UploadUniformMat4(const std::string& name, const glm::mat4& matrix)
  {
      GLint location = glGetUniformLocation(m_RendererID, name.c_str());
      glUniformMatrix4fv(location, 1, GL_FALSE, glm::value_ptr(matrix));
  }
  ```

- 对应的shader代码：FlatColor.glsl

  ```glsl
  #type vertex
  #version 330 core
  
  layout(location = 0) in vec3 a_Position;
  
  uniform mat4 u_ViewProjection;
  uniform mat4 u_Transform;
  
  void main() {
  	gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
  }
  
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  
  uniform vec4 u_Color;
  
  void main() {
  	color = u_Color;	
  }
  ```

  

