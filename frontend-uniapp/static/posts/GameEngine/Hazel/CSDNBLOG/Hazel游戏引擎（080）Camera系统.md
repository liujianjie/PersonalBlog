> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 上一节的bug

  将Entity的m_EntityHandle初始化为null, 而不是0

  ```c++
  entt::entity m_EntityHandle{ entt::null };
  operator bool() const { return m_EntityHandle != entt::null; }
  ```

- 此节内容

  - 设计一个**Camera组件**

    即一个实体可以用有Camera组件

  - 这个Camera组件需拥有**Camera类**指针

    Camera类拥有的属性与行为

    1. 设置为透视投影projection矩阵还是正交投影projection矩阵（未做）

    2. 是否主相机

    3. 获取projection投影矩阵

    注意区分：Camera组件与Camera类，实体**添加**Camera组件、Camera组件**拥有**Camera类、所以实体能通过组件**获得**Camera

# Camera类与Camera组件设计

- 新添加Camera.h

  ```cpp
  #pragma once
  #include <glm/glm.hpp>
  namespace Hazel {
  	class Camera {
  	public:
  		Camera(const glm::mat4& projection)
  			: m_Projection(projection){}
  		const glm::mat4& GetProjection() const { return m_Projection; }
  		// TOOD:做透视投影
  	private:
  		glm::mat4 m_Projection;
  	};
  }
  ```

- Components.h

  ```cpp
  struct CameraComponent {
      Camera camera;
      bool primary = true;
  
      CameraComponent() = default;
      CameraComponent(const CameraComponent&) = default;
      CameraComponent(const glm::mat4 & projection)
          : camera(projection) {}
  };
  ```

# 场景切换到主摄像机视角代码流程

- EditorLayer层**添加**一个实体

  ```c++
  EditorLayer.h
  Entity m_CameraEntity;			// 摄像机实体
  ```

- 实体**添加**摄像机组件，并**初始化**正交投影矩阵

  ```c++
  EditorLayer.cpp
  // 初始化摄像机实体
  m_CameraEntity = m_ActiveScene->CreateEntity("Camera Entity");
  m_CameraEntity.AddComponent<CameraComponent>(glm::ortho(-16.0f, 16.0f, -9.0f, 9.0f, -1.0f, 1.0f));
  ```

- 在scene onupdate方法中**寻找主摄像机**，以及获取主摄像机的transform用来计算视图矩阵

  ```c++
  Scene.cpp
  void Scene::OnUpdate(Timestep ts)
  {
      // 获取到主摄像机，并且获取到摄像机的位置，用来计算投影矩阵projection
      Camera* mainCamera = nullptr;
      glm::mat4* cameraTransform = nullptr;
      {
          auto group = m_Registry.view<TransformComponent, CameraComponent>();
          for (auto entity : group){
              auto &[transform, camera] = group.get<TransformComponent, CameraComponent>(entity);
  
              if (camera.primary) {
                  mainCamera = &camera.camera;
                  cameraTransform = &transform.Transform;
              }
          }
      }
      ///////////////////////////////////////////////////////////////
      // 注意这，BeginScene中传入主摄像机的投影矩阵与主摄像机的transform矩阵
      if (mainCamera) {
          Renderer2D::BeginScene(mainCamera->GetProjection(), *cameraTransform);
          auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
          for (auto entity : group) {
              auto& [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
              Renderer2D::DrawQuad(transform, sprite.Color);
          }
          Renderer2D::EndScene();
      }
  }
  ```

- 在渲染器的beginscene方法中投影矩阵*视图矩阵，并且上传到opengl中

  ```c++
  Renderer2D.cpp
  void Renderer2D::BeginScene(const Camera& camera, const glm::mat4& transform)
  {
      // 投影矩阵projection * 视图矩阵
      glm::mat4 viewProj = camera.GetProjection() * glm::inverse(transform);
      s_Data.TextureShader->Bind();		// 绑定shader
      s_Data.TextureShader->SetMat4("u_ViewProjection", viewProj);
  ```


# 两个实体，每个实体有Camera组件的效果

- 实体(摄像机)1当作是**主摄像机**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310412.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302309882.png)

- 实体(摄像机)2当作是**主摄像机**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302309883.png)

# 问题

- 问题详情

  为什么修改transform矩阵的**第四列**就能改变场景的**摄像机的位置**

  ```cpp
  /*
  一开始以为：Transform[3]是第四行
  后面查资料才发现Transform[3]应该是第四列
  */ 
  ImGui::DragFloat3("Camera Transform",
  	glm::value_ptr(m_CameraEntity.GetComponent<TransformComponent>().Transform[3]));
  ```

  transform矩阵是平移矩阵\*旋转矩阵\*缩放矩阵的结合，由于没有设置旋转、缩放矩阵，所以

  可以这里可以认为**transform矩阵就是translate平移矩阵**

- translate平移矩阵图[参考资料](https://learnopengl-cn.github.io/01%20Getting%20started/07%20Transformations/#_17)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308062309083.png)

  

  - 其中第四列就是摄像机的位置

  - transform矩阵就是translate平移矩阵

  - 第四列用Transform[3]表示，所以改变Transform[3]就能改变**摄像机的位置**

- 另外讲些原理[参考资料](https://blog.csdn.net/qq_34060370/article/details/129257619)

  1. 由034小节，摄像机左移界面其实显示物体右移

  2. 所以这里改变摄像机的transform的第四列其实并未改变摄像机的位置

  3. 而是在Renderer2D::BeginScene中进行计算摄像机的视图矩阵，与投影矩阵相乘后上传给OpenGL

  4. OpenGL的着色器中用**投影**矩阵\***视图**矩阵\*物体的**顶点位置**

     - 将物体的顶点位置经过视图矩阵变换到**观察空间**

       （物体的顶点位置根据transform矩阵变换到具体位置，此节是顶点根据**translate**矩阵平移到指定位置）

       所以此节修改transform[3]的值会在这里生效

     - 再经过投影矩阵变换到**裁剪空间**、到标准化设备坐标、到屏幕坐标（显示在屏幕上）

  5. 表面上是摄像机在移动，其实是组成物体的所有顶点进行的移动。

  ```c++
  void Renderer2D::BeginScene(const Camera& camera, const glm::mat4& transform){
      // 投影矩阵projection * 视图矩阵
      glm::mat4 viewProj = camera.GetProjection() * glm::inverse(transform);
      s_Data.TextureShader->Bind();		// 绑定shader
      s_Data.TextureShader->SetMat4("u_ViewProjection", viewProj);
  ```



