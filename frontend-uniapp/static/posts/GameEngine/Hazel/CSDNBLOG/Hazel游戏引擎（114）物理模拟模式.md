> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  - **增加**一个物理模拟运行模式

    来运行给物体添加的物理效果，**摄像机使用编辑模式下的摄像机**。

  - **区分**Play运行模式的物理效果

    这个模式的摄像机会变成场景里的**主摄像机**，而不是当前的**编辑相机**。

  ![2.图标](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132202420.png)

- 关于物理模拟模式

  - 渲染的场景部分

    物理模拟模式下：渲染的场景和**编辑模式**下一样

  - 物理模拟部分

    物理模拟模式下：物理模拟和**Play模式下**的部分一样

  所以物理模拟模式编辑模式和Play模式下的**交集**，物理模拟模式也要复制当前编辑场景。

- 如何实现

  添加一个图标、一个状态来控制

- 实现细节

  1. 物理模拟模式运行时再点击Play模式应无bug
  2. 物理模拟或者Play模式运行时切换Scene应无bug
  3. 空场景点击Play模式和物理模拟模式应无bug

# 关键代码+代码流程

## 代码流程

- 点击物理模拟模式的图标

  ```cpp
  ImGui::SameLine();
  {
      Ref<Texture2D> icon = ( m_SceneState == SceneState::Edit || m_SceneState == SceneState::Play)? m_IconSimulate : m_IconStop;
      if (ImGui::ImageButton((ImTextureID)icon->GetRendererID(), ImVec2(size, size), ImVec2(0, 0), ImVec2(1, 1), 0, ImVec4(0.0f, 0.0f, 0.0f, 0.0f), tintColor) 
          && toolbarEnabled) { // 图标可以换，但是下面的代码不会执行
          if (m_SceneState == SceneState::Edit || m_SceneState == SceneState::Play) {
              OnSceneSimulate();
          }
          else if (m_SceneState == SceneState::Simulate) {
              OnSceneStop();
          }
      }
  }
  ```

- 开始物理模拟模式+场景执行物理模拟

  ```cpp
  void EditorLayer::OnSceneSimulate()// 开始物理模拟模式
  {
      if (m_SceneState == SceneState::Play) {
          OnSceneStop(); // 停止物理
      }
      m_SceneState = SceneState::Simulate;
  
      // 复制新场景给活动场景
      m_ActiveScene = Scene::Copy(m_EditorScene);
      m_ActiveScene->OnSimulationStart(); // 复制完新场景就开始运行。场景执行物理模拟
      // 当前上下文是新场景----------------------------
      m_SceneHierarchyPanel.SetContext(m_ActiveScene);
  }
  void EditorLayer::OnUpdate(Timestep ts)
  {
      // Scene更新
      switch (m_SceneState) {
          case SceneState::Simulate: {
              // 摄像机要更新
              m_EditorCamera.OnUpdate(ts);
              m_ActiveScene->OnUpdateSimulation(ts, m_EditorCamera);
              break;
          }
      }
  ```

- 执行物理计算+渲染场景

  ```cpp
  void Scene::OnUpdateSimulation(Timestep ts, EditorCamera& camera)
  {
      // Physics
      {
          // 先script脚本影响Physics变化再当前帧渲染出来
          // 迭代速度：使用更少的迭代可以提高性能，但准确性会受到影响。使用更多迭代会降低性能但会提高模拟质量
          // 有点不董。。。。说啥：时间步长和迭代次数完全无关。迭代不是子步骤
          // Cherno说迭代速度，多久进行一次计算模拟。好奇这个6，是多少毫秒计算6次吗？
          const int32_t velocityIterations = 6;// 这些参数应该移到编辑器
          const int32_t positionIterations = 2;
          m_PhysicsWorld->Step(ts, velocityIterations, positionIterations);
  
          auto view = m_Registry.view<Rigidbody2DComponent>();
          for (auto e : view) {
              Entity entity = { e, this };
              auto& transform = entity.GetComponent<TransformComponent>();
              auto& rb2d = entity.GetComponent<Rigidbody2DComponent>();
  
              // 获取物理模拟计算后的主体
              b2Body* body = (b2Body*)rb2d.RuntimeBody;
              // 将计算后的值赋予实体
              const auto& position = body->GetPosition();
              transform.Translation.x = position.x;
              transform.Translation.y = position.y;
              transform.Rotation.z = body->GetAngle();// 获取z轴角度
          }
          // 脚本影响Pyhsics再下面渲染出来
      }
  
      // Render 渲染场景
      RenderScene(camera);
  }
  ```

## 代码细节

- 空场景点击Play模式和物理模拟模式应无bug

  1. 切换这两个状态，没有东西渲染，物理世界只会增加点消耗。
  2. Play按钮点击，Play模式下要切换为主摄像机，但当前场景是为空，并没有主摄像机，所以需判空**不执行渲染**，不然会报错。

  ```cpp
  void EditorLayer::OnOverlayRender()
  {	// 两个不同摄像机
      if (m_SceneState == SceneState::Play) {// Play模式下找主摄像机
          Entity camera = m_ActiveScene->GetPrimaryCameraEntity();
          if (!camera) {
              return;	// 找不到就退出
          }
          Renderer2D::BeginScene(camera.GetComponent<CameraComponent>().camera, camera.GetComponent<TransformComponent>().GetTransform());
      }
      else {
          Renderer2D::BeginScene(m_EditorCamera);
      }
  ```

# 效果图

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132202425.png)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132202429.png)

![simulate](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132202431.gif)
