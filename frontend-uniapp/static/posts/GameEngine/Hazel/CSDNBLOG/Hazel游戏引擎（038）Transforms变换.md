> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  1. 当前实现已经可以在窗口用OpenGL绘制出2D图形，但是这些2D图形始终以屏幕中心为基准点，所以需要实现能改变这些2D图形基准点，也就是改变这些2D图形位置。(2D图形可以等同于3Dmodel模型)
  2. 改变一个图形在世界空间的位置，但是只使用图形的**同一组**顶点数据

- 如何改变这些图形的位置

  使用Model矩阵，在这里被叫做transform矩阵

  transform矩阵 = **平移矩阵\*旋转矩阵\*缩放矩阵\*向量**

- Api设计

  ```cpp
  static void Submit(const std::shared_ptr<Shader>& shader, const std::shared_ptr<VertexArray>& vertexArray, glm::mat4 transform = glm::mat4(1.0f)); 
  ```

  Submit函数添加transform参数，代表当前物体的变换矩阵，即这个图形在世界空间的位置

- 有无给transform矩阵设置值的效果

  ![img](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022045861.png)

  035摄像机的公式：gl_Position=project * view * world(Transform) * verpos

  现在目前有了摄像机的Project、View矩阵，即图形的verpos顶点位置

  - 若**没有**给Transform矩阵设置值（Transform矩阵默认为**单位**矩阵）

    经过**单位**矩阵图形转换到世界空间的位置，默认在世界空间的**原点**

  - 若**有**给Transform矩阵设置值

    经过Transform(Model)矩阵，可以改变物体在世界空间的位置

- 参考Blog文章

  [LearnOpenGL-入门-7.变换](https://blog.csdn.net/qq_34060370/article/details/129257312)

  [LearnOpenGL-入门-8.坐标系统](https://blog.csdn.net/qq_34060370/article/details/129257619)

# 关键代码

```cpp
// 上传矩阵数据到glsl
shader->UploadUniformMat4("u_Transform", transform);
shader->UploadUniformMat4("u_ViewProjection", m_SceneData->ViewProjectionMatrix);
```

```c++
// 着色器
    std::string blueShaderVertexSrc = R"(
                #version 330 core

                layout(location = 0) in vec3 a_Position;
                uniform mat4 u_ViewProjection;
                uniform mat4 u_Transform;// 接收变换矩阵

                out vec3 v_Position;

                void main(){
                    v_Position = a_Position;
                    gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);// 乘以变换矩阵
                }			
            )";
```

# 代码修改

- Renderer

  ```cpp
  static void Submit(const std::shared_ptr<Shader>& shader, const std::shared_ptr<VertexArray>& vertexArray, glm::mat4 transform = glm::mat4(1.0f));
  ```

  ```cpp
  void Renderer::Submit(const std::shared_ptr<Shader>& shader, const std::shared_ptr<VertexArray>& vertexArray, glm::mat4 transform)
  {
      vertexArray->Bind(); // 绑定顶点数组
      shader->Bind();		// 绑定shader
      ////////////////////////////////////////////////////////////////////////////////////
      // 上传矩阵数据到glsl/////////////////////////////////////////////////////////////////
      shader->UploadUniformMat4("u_ViewProjection", m_SceneData->ViewProjectionMatrix);
      shader->UploadUniformMat4("u_Transform", transform);// 上传变换矩阵
      RenderCommand::DrawIndexed(vertexArray);
  }
  ```

- sandboxapp

  ```cpp
  // jkl控制物体的世界矩阵
  if (Hazel::Input::IsKeyPressed(HZ_KEY_I)) {
      m_SquarePosition.y += m_SquareMoveSpeed;
  }
  else if (Hazel::Input::IsKeyPressed(HZ_KEY_K)) {
      m_SquarePosition.y -= m_SquareMoveSpeed;
  }
  if (Hazel::Input::IsKeyPressed(HZ_KEY_J)) {
      m_SquarePosition.x -= m_SquareMoveSpeed;
  }
  else if (Hazel::Input::IsKeyPressed(HZ_KEY_L)) {
      m_SquarePosition.x += m_SquareMoveSpeed;
  }
  
  Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
  Hazel::RenderCommand::Clear();
  
  m_Camera.SetPosition(m_CameraPosition);
  m_Camera.SetRotation(m_CameraRotation);
  Hazel::Renderer::BeginScene(m_Camera);
  
  // 正方形 变换矩阵//////////////////////////////////////////////////////////
  glm::mat4 sqtransfrom = glm::translate(glm::mat4(1.0f), m_SquarePosition);
  Hazel::Renderer::Submit(m_BlueShader, m_SquareVA, sqtransfrom);
  // 渲染一组正方形
  // 缩放
  static glm::mat4 scale = glm::scale(glm::mat4(1.0f), {0.05f, 0.05f, 0.05f});
  for (int i = 0; i < 20; i++) {
      for (int j = 0; j < 20; j++) {
          glm::mat4 smallsqtransfrom = glm::translate(glm::mat4(1.0f), { i * 0.08f, j * 0.08f, 0.0f }) * scale;
          Hazel::Renderer::Submit(m_BlueShader, m_SquareVA, smallsqtransfrom);// 传参：transform
      }
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022045055.png)