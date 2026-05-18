> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前情提要

  由097节已经可以读取鼠标位置的颜色缓冲区的值，但是quad的范围读取的值是一个**固定**的50数字

- 此节目的

  读取quad实体内的像素在第二个缓冲区的值，会返回**当前实体的ID**

- 如何实现

  见095的思路二中讨论的，在顶点缓冲布局中添加实体ID，这样**每个顶点都有一个自己的EntityID值，再将这个ID值作为第二个缓冲区像素的颜色值，这样就可以成功在当前实体里的每个像素都有这个ID值**

- 实现细节

  重载DrawQuad的API以及相关代码

- 考虑性能

  因为给顶点属性添加一个int的EntityID值，这样会降低性能，但是Cherno说，这是编辑Game时要做的，等到运行打包时可以优化，但现在未到那个时候，所以先不用考虑这种性能问题，先把当前要解决的问题实现再说。

# 修改地方（渲染代码流程）

- 给顶点缓冲区布局添加实体ID

  ```cpp
  struct QuadVertex {
      glm::vec3 Position;
      glm::vec4 Color;
      glm::vec2 TexCoord;
      float TexIndex;
      float TilingFactor;
      // Editor-only;
      int EntityID;
  };
  // 2.1设置顶点缓冲区布局
  s_Data.QuadVertexBuffer->SetLayout({
      {ShaderDataType::Float3, "a_Position"},
      {ShaderDataType::Float4, "a_Color"},
      {ShaderDataType::Float2, "a_TexCoord"},
      {ShaderDataType::Float, "a_TexIndex"},
      {ShaderDataType::Float, "a_TilingFactor"},
      {ShaderDataType::Int, "a_EntityID"}
  });
  ```

- 设置使用的顶点数组缓冲区，并且在这个缓冲区中**设置布局**

  ```cpp
  void OpenGLVertexArray::AddVertexBuffer(const Ref<VertexBuffer>& vertexBuffer)
  {
      HZ_PROFILE_FUNCTION();
      HZ_CORE_ASSERT(vertexBuffer->GetLayout().GetElements().size(), "Vertex Buffer has no layout;!");
      // 各绑各的
      glBindVertexArray(m_RendererID);
      vertexBuffer->Bind();
      // 设置布局
      uint32_t index = 0;
      const auto& layout = vertexBuffer->GetLayout();
      for (const auto& element : layout) {
          // 由于 int float mat不同类型的通用顶点属性数据的数组布局不一样，所以要case分开写
          switch (element.Type)
          {
              case ShaderDataType::Float:
              case ShaderDataType::Float2:
              case ShaderDataType::Float3:
              case ShaderDataType::Float4:
                  {
                      glEnableVertexAttribArray(index);
                      // 定义一个通用顶点属性数据的数组
                      glVertexAttribPointer(index,
                                            element.GetComponentCount(),
                                            ShaderDataTypeToOpenGLBaseType(element.Type),
                                            element.Normalized ? GL_TRUE : GL_FALSE,
                                            layout.GetStride(),
                                            (const void*)element.Offset); // 指明布局。
                      index++;
                      break;
                  }
              case ShaderDataType::Int:
              case ShaderDataType::Int2:
              case ShaderDataType::Int3:
              case ShaderDataType::Int4:
              case ShaderDataType::Bool:
                  {
                      // glVertexAttribIPointer 不同 glVertexAttribPointer
                      glEnableVertexAttribArray(index);// 重点////////////////////////
                      // 定义一个通用顶点属性数据的数组
                      glVertexAttribIPointer(index,
                                             element.GetComponentCount(),
                                             ShaderDataTypeToOpenGLBaseType(element.Type),
                                             layout.GetStride(),
                                             (const void*)element.Offset); // 指明布局。
                      index++;
                      break;
                  }
                  ......
          }
          m_VertexBuffers.push_back(vertexBuffer);
      }
  ```

- 设置顶点属性的**EntityID**

  ```cpp
  void Renderer2D::DrawQuad(const glm::mat4& transform, const glm::vec4& color, int entityID)
  {
      HZ_PROFILE_FUNCTION();
      if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {
          NextBatch();
      }
      constexpr size_t quadVertexCount = 4;
      const float textureIndex = 0.0f; // 白色纹理
      const float tilingFactor = 1.0f;
      constexpr glm::vec2 textureCoords[] = { {0.0f, 0.0f}, { 1.0f, 0.0f}, {1.0f, 1.0f}, {0.0f, 1.0f} };
      // quad的左下角为起点
      for (size_t i = 0; i < quadVertexCount; i++) {
          s_Data.QuadVertexBufferPtr->Position = transform * s_Data.QuadVertexPosition[i];
          s_Data.QuadVertexBufferPtr->Color = color;
          s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[i];
          s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
          s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
          ///////////////////////////////////////////////////////////////////////////////////////
          ///////////////////////////////////////////////////////////////////////////////////////
          // 在这里！！重点////////////////////////////////////////////////////////////////////////
          s_Data.QuadVertexBufferPtr->EntityID = entityID; 
          s_Data.QuadVertexBufferPtr++;
      }
      s_Data.QuadIndexCount += 6;// 每一个quad用6个索引
      s_Data.Stats.QuadCount++;
  }
  ```

- 在glsl的顶点着色器阶段**获取**对应布局的EntityID，并**输出**到fragment阶段；

  在fragment阶段，给顶点包围的区域每个像素都设置为实体ID

  ```glsl
  #type vertex
  #version 450 core
  
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec4 a_Color;
  layout(location = 2) in vec2 a_TexCoord;
  layout(location = 3) in float a_TexIndex;
  layout(location = 4) in float a_TilingFactor;
  layout(location = 5) in int a_EntityId; // 获取 重点/////////////////////////////////////
  
  uniform mat4 u_ViewProjection;
  
  out vec4 v_Color;
  out vec2 v_TexCoord;
  out float v_TexIndex;
  out float v_TilingFactor;
  out flat int v_EntityId;			// 传递给片段着色器，标记flat意思是不要插值变为float///////////////////////
  
  void main() {
  	v_Color = a_Color;
  	v_TexCoord = a_TexCoord;
  	v_TexIndex = a_TexIndex;
  	v_TilingFactor = a_TilingFactor;
  	v_EntityId = a_EntityId;// 输出给fragment阶段
  	gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
  }
  
  #type fragment
  #version 450 core
  
  layout(location = 0) out vec4 color;
  layout(location = 1) out int color2;
  
  in vec4 v_Color;
  in vec2 v_TexCoord;
  in float v_TexIndex;
  in float v_TilingFactor;
  in flat int v_EntityId; // 接收
  
  uniform sampler2D u_Textures[32]; 
  
  void main() {
  	 color = texture(u_Textures[int(v_TexIndex)], v_TexCoord * v_TilingFactor) * v_Color;	
      //////////////////////////////////////////////////////////////////////////////////////////////
       // 给顶点包围的区域每个像素都设置为实体ID///////////////////////////////////////////////
  	 color2 = v_EntityId;
  }
  ```

- 在Scene.cpp中设置要上传到OpenGL的顶点属性**实参**数据(position，color，**entityID**)

  ```cpp
  void Scene::OnUpdateEditor(Timestep ts, EditorCamera& camera)
  {
      Renderer2D::BeginScene(camera);
      auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
      for (auto entity : group) {
          auto [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
          /////////////////////////////////////////////////////////////////////////
          // 这里///////////////////////////////////////////////////////////////////
          Renderer2D::DrawQuad(transform.GetTransform(), sprite.Color, (int)entity);
      }
      Renderer2D::EndScene();
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132108591.png)

​	

  Camera也有一个实体ID，所以3个Quad中有一个Quad的实体ID是3