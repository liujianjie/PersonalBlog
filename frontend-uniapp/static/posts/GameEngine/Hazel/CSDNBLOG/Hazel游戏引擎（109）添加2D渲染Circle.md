> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  给引擎添加渲染Circle图形

- 如何实现

  对项目来说：用批处理，同quad的顶点坐标与布局，但是**shader的fragment阶段，控制在一个圆圈输出颜色**。

  抛开项目说：用Quad顶点包围一个范围作为画布（Canvas）用glsl控制画出一个圆alpha为1，圆外的范围的alpha为0。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132114674.png)

- 实现细节

  1. 运行时需要拷贝circle组件，序列化和解析yaml-cpp时都得加上circle组件的代码。
  2. circle的shader具有**localposition**顶点属性。

- 如何画圆

  请[点这](https://blog.csdn.net/qq_34060370/article/details/128875403)

# 关键代码+代码流程

## 关键代码

- circle的glsl

  ```cpp
  // Basic Texture Shader
  #type vertex
  #version 450 core
  layout(location = 0) in vec3 a_WorldPosition;
  layout(location = 1) in vec3 a_LocalPosition;// 具有**localposition**顶点属性
  layout(location = 2) in vec4 a_Color;
  layout(location = 3) in float a_Thickness;
  layout(location = 4) in float a_Fade;
  layout(location = 5) in int a_EntityID;
  layout(std140, binding = 0) uniform Camera{
  	mat4 u_ViewProjection;
  };
  struct VertexOutput{
  	vec3 LocalPosition; // 输出这个为了不管处于任何世界坐标，相对于圆心的长度不变
  	vec4 Color;
  	float Thickness;
  	float Fade;
  };
  layout(location = 0) out VertexOutput Output;
  layout(location = 4) out flat int v_EntityID;
  void main(){
  	Output.LocalPosition = a_LocalPosition;
  	Output.Color = a_Color;
  	Output.Thickness = a_Thickness;
  	Output.Fade = a_Fade;
  	v_EntityID = a_EntityID;
  	gl_Position = u_ViewProjection * vec4(a_WorldPosition, 1.0);
  }
  #type fragment
  #version 450 core
  layout(location = 0) out vec4 o_Color;
  layout(location = 1) out int o_EntityID;
  struct VertexOutput{
  	vec3 LocalPosition; // 
  	vec4 Color;
  	float Thickness;
  	float Fade;
  };
  layout(location = 0) in VertexOutput Input;
  layout(location = 4) in flat int v_EntityID;
  void main(){
  		/*
  		函数解释：
  		step(edge0, x); 当x > edge0，返回1，当x < edge0 返回0。阶梯函数
  		smoothstep(edge0, edge1, x);当x > edg1时，返回1，当x < edg0时，返回0，当x在edg0和edg1之间时，返回x。平滑的阶梯函数
  		length(a); 返回向量a的长度。sqrt(x*x, y*y);
  
  		LocalPosition拿圆心(0, 0)、中心点(0, 0.5)、边缘点（0,1）说明
  		Input.Thickness=1; Input.Fade=0
  		LocalPosition(0, 0);
  			distance = 1 - 0 = 1;
  			circle = smoothstep(0, 0, 1) = 1;
  			cirle = cirle * smoothstep(1 + 0, 1, 1) = 1;
  			所以圆心像素显示
  		LocalPosition(0, 0.5);
  			distance = 1 - 0.5 = 0.5;
  			circle = smoothstep(0, 0, 0.5) = 1;
  			cirle = cirle * smoothstep(1 + 0, 1, 1) = 1;
  			所以中间点像素显示
  		LocalPosition(0, 1);
  			distance = 1 - 1 = 0;
  			circle = smoothstep(0, 0, 0) = 0;
  			cirle = cirle * smoothstep(1 + 0, 1, 0) = 0;
  			所以边缘的像素透明不显示
  	*/
  	float distance = 1.0 - length(Input.LocalPosition);// 根据与圆心的距离计算
  	float circle = smoothstep(0.0, Input.Fade, distance);
  	circle *= smoothstep(Input.Thickness + Input.Fade, Input.Thickness, distance);
  	if (circle == 0.0) {
  		discard;
  	}
  	o_Color = Input.Color;
  	o_Color.a *= circle;
  	// EntityID
  	o_EntityID = v_EntityID;
  }
  ```

  - 其中smoothstep很容易误解

    误解1

    - 错误

      smoothstep(0, 0.1, x);以为x小于0的为0，大于0.1的为0.1,其它x在（0,0.1）之间插值

    - 正确

      smoothstep(0, 0.1, x); 是 x小于0的为0，**大于0.1的为1**，其它x在（0,0.1）之间插值

    误解2

    - smoothstep(0.5, 0.2, x);以为x小于0.2的为0，大于0.5的为1，其它x在（0.2，0.5）之间插值
    - smoothstep(0.5, 0.2, x);是x**小于0.2的为1**，**大于0.5的为0**，其它x在（0.2，0.5）之间插值

    小结

    ```cpp
    // 当edge0 < edge1时，当x < edg0时，返回0，当x > edg1时，返回1，当x在edg0和edg1之间时，返回x。
    // 当edge1 < edge0时，当x < edg1时，返回1，当x > edg0时，返回0，当x在edg0和edg1之间时，返回x。
    // 当edge0 = edge1 ,smoothstep退化成step（0除外）
    // 当edge0 = edge1 ,smoothstep退化成step
    // 但当edge0=edge1=0,smoothstep(edge0,edge1,x);无论x是什么都返回0！
    smoothstep(edge0, edge1, x);
    ```

  详细解释如何画的：请[点这](https://blog.csdn.net/qq_34060370/article/details/128875403)

## 代码流程

- 批处理代码加上circle的顶点数组等信息

  circle的顶点数组使用的索引缓冲区是和quad的索引缓冲区一样，所以不需要再建

  ```cpp
  struct CircleVertex {
      glm::vec3 WorldPosition;
      glm::vec3 LocalPosition;
      glm::vec4 Color;
      float Thickness;
      float Fade;
      // Editor-only;
      int EntityID;
  };
  ....
  // circle
  uint32_t CircleIndexCount = 0;
  CircleVertex* CircleVertexBufferBase = nullptr;
  CircleVertex* CircleVertexBufferPtr = nullptr;
  ....
  // 1.1设置顶点数组使用的缓冲区，并且在这个缓冲区中设置布局
  s_Data.CircleVertexArray->AddVertexBuffer(s_Data.CircleVertexBuffer);
  
  // 3.索引缓冲-和quad使用的是同一个，不需要重新建
  
  // 1.2顶点数组设置索引缓冲区
  s_Data.CircleVertexArray->SetIndexBuffer(quadIB); // 这里写错过，s_Data.QuadVertexArray，即没有给circle的顶点数组设置索引
  
  s_Data.CircleShader = Shader::Create("assets/shaders/Renderer2D_Circle.glsl");
  ....
  ```

- 绘画函数使用quad的顶点位置，顶点信息中有**localPosition**

  ```cpp
  void Renderer2D::DrawCircle(const glm::mat4& transform, const glm::vec4& color, float thickness, float fade, int entityID)
  {
      HZ_PROFILE_FUNCTION();
      // 这里注释是因为，circle一般不会超。。。
      //if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {
      //	NextBatch();
      //}
      constexpr size_t quadVertexCount = 4;
      // quad的左下角为起点
      // 使用的是quad顶点信息
      for (size_t i = 0; i < quadVertexCount; i++) {
          s_Data.CircleVertexBufferPtr->WorldPosition = transform * s_Data.QuadVertexPosition[i]; 
          s_Data.CircleVertexBufferPtr->LocalPosition = s_Data.QuadVertexPosition[i] * 2.0f; // 2 * 0.5 = 1
          s_Data.CircleVertexBufferPtr->Color = color;
          s_Data.CircleVertexBufferPtr->Thickness = thickness;
          s_Data.CircleVertexBufferPtr->Fade = fade;
          s_Data.CircleVertexBufferPtr->EntityID = entityID;
          s_Data.CircleVertexBufferPtr++;
      }
      s_Data.CircleIndexCount += 6;// 每一个quad用6个索引
  
      s_Data.Stats.QuadCount++;
  }
  ```

- 写Circle的组件

  ```cpp
  struct CircleRendererComponent {
      glm::vec4 Color{ 1.0f, 1.0f, 1.0f, 1.0f };
      float Thickness = 1.0f;
      float Fade = 0.005f;
  
      CircleRendererComponent() = default;
      CircleRendererComponent(const CircleRendererComponent&) = default;
  };
  ```

- Scene扫描当前场景有**Circle**的组件，遍历然后调用draw绘制

  ```cpp
  void Scene::OnUpdateEditor(Timestep ts, EditorCamera& camera)
  {
      Renderer2D::BeginScene(camera);
      // 绘画sprite
      {
          auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
          for (auto entity : group) {
              // get返回的tuple里本是引用
              auto [tfc, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
              Renderer2D::DrawSprite(tfc.GetTransform(), sprite, (int)entity);
          }
      }
      // 绘画circles
      {
          auto view = m_Registry.view<TransformComponent, CircleRendererComponent>();
          for (auto entity : view) {
              // get返回的tuple里本是引用
              auto [tfc, circle] = view.get<TransformComponent, CircleRendererComponent>(entity);
              Renderer2D::DrawCircle(tfc.GetTransform(), circle.Color, circle.Thickness, circle.Fade, (int)entity);
          }
      }
      Renderer2D::EndScene();
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132114769.png)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132115129.png)

# Bug

- 圆背景黑色

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132115808.png)

  原因：shader代码原因，没有**指定alpha**

  ```cpp
  float distance = 1.0 - length(Input.LocalPosition);
  vec3 color = vec3(smoothstep(0.0, Input.Fade, distance));
  color *= vec3(smoothstep(Input.Thickness + Input.Fade, Input.Thickness, distance));
  
  o_Color = Input.Color;
  o_Color.rgb *= color;// 这里写错，应该为：o_Color.a *= circle;
  ```

- draw没有渲染任何东西

  circle和quad都有自己的顶点数组，若没有**切换绑定**，即会draw没有渲染任何东西

  应在代码加上绑定

  ```cpp
  void OpenGLRendererAPI::DrawIndexed(const Ref<VertexArray>& vertexArray, uint32_t indexCount)
  {
      vertexArray->Bind(); // 加上顶点数组绑定
      uint32_t count = indexCount == 0 ? vertexArray->GetIndexBuffer()->GetCount() : indexCount;
      glDrawElements(GL_TRIANGLES, count, GL_UNSIGNED_INT, nullptr);
  }
  ```

- 当一个Quad和Circle重叠，在Circle的四周无法点击后面Quad的entity

  因为circle是quad形状，四个角范围虽然alpha为0，点击后仍是自己circle的**entityid**。

  在fragment检测到alpha为0，就**丢弃这个像素点**，从而被后面的quad的entityid填充。

  ```cpp
  void main()
  {
  	// 根据与圆心的距离计算
  	float distance = 1.0 - length(Input.LocalPosition);
  	float circle = smoothstep(0.0, Input.Fade, distance);
  	circle *= smoothstep(Input.Thickness + Input.Fade, Input.Thickness, distance);
  	if (circle == 0.0) {
  		discard;// 丢弃
  	}
  ```

# 自己遇到的错

- 报错如下:nvoglv64.dll

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132115881.png)

  写错批处理opengl代码

  ```cpp
  // 1.2顶点数组设置索引缓冲区
  s_Data.CircleVertexArray->SetIndexBuffer(quadIB); // 这里写错过，s_Data.QuadVertexArray，即没有给circle的顶点数组缓存设置索引
  ```

  