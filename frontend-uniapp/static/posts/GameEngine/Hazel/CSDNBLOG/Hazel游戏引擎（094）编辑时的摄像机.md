> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 目的

  实现像Unity**编辑时**有一个编辑摄像机呈现画面给开发人员，**运行时**有一个主摄像机呈现游戏画面给玩家。

- 如何实现

  使用Cherno写好的EditorCamera类

- 实现细节

  1. 编辑时摄像机是**透视投影**摄像机
  2. 编辑时摄像机缩小**不会透过**实体，这样更简单实现
  3. 编辑时摄像机越**接近**实体，它的放大范围越**小**

# 编辑时摄像机大致运行流程

- 设置好编辑时摄像机参数：宽高比、视角角度、近、远

  ```c++
  m_EditorCamera = EditorCamera(30.0f, 1.778f, 0.1f, 1000.0f);
  ```

- 在EditorLayer中的OnUpdate与OnEvent

  执行编辑时摄像机的OnUpdate，OnEvent，为了因开发人员操作而改变的位置、旋转，从而更新投影、视图矩阵

  ```c++
  // 不需要焦点，每一帧都需要刷新
  m_EditorCamera.OnUpdate(ts);
  
  void EditorLayer::OnEvent(Event& e)
  {
      m_EditorCamera.OnEvent(e);
  ```

- 在EditorLayer中的OnUpdate

  1. 执行Scene的Update时是执行Scene的OnUpdateEditor函数，参数是传入编辑时的摄像机

  2. 在OnUpdateEditor函数中，给渲染类传入**编辑时摄像机**的投影视图矩阵
  3. 在渲染类中上传摄像机的**投影**和视图矩阵给OpenGL，参与运算物体顶点的最终位置

  ```c++
  m_ActiveScene->OnUpdateEditor(ts, m_EditorCamera);
  
  void Scene::OnUpdateEditor(Timestep ts, EditorCamera& camera)
  {
      Renderer2D::BeginScene(camera);
      auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
      for (auto entity : group) {
      auto [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
      Renderer2D::DrawQuad(transform.GetTransform(), sprite.Color);
      }
      Renderer2D::EndScene();
  }
  
  void Renderer2D::BeginScene(const EditorCamera& camera)
  {
      HZ_PROFILE_FUNCTION();
  
      glm::mat4 viewProj = camera.GetViewProjection();
  
      s_Data.TextureShader->Bind();
      s_Data.TextureShader->SetMat4("u_ViewProjection", viewProj);
      StartBatch();
  }
  ```

- 细节：将gizmos关联**编辑时**的摄像机投影与视图矩阵，而不是**运行时**的摄像机

  ```c++
  // Camera - editor 编辑时的摄像机矩阵
  const glm::mat4& cameraProjection = m_EditorCamera.GetProjection();
  glm::mat4 cameraView = m_EditorCamera.GetViewMatrix();
  ......
  // 这里可以说是传入相应参数，得到绘画出来的gizmos
  ImGuizmo::Manipulate(glm::value_ptr(cameraView), glm::value_ptr(cameraProjection),
                       (ImGuizmo::OPERATION)m_GizmoType, ImGuizmo::LOCAL, glm::value_ptr(transform),
                       nullptr, snap ? snapValues : nullptr);
  ```

# 讲解编辑时摄像机 移动与缩放 实现

为什么不讲旋转，不太会，而且此节大都是我自己推的，大概率有误，仅提供参考，忽全信

- 编辑时摄像机参数略讲

  ```c++
  glm::vec3 m_Position = { 0.0f, 0.0f, 10.0f };	// 摄像机的位置
  glm::vec3 m_FocalPoint = { 0.0f, 0.0f, 0.0f }; // 焦点的位置为原点
  
  glm::vec2 m_InitialMousePosition = { 0.0f, 0.0f };// 记录当前鼠标位置，为了计算移动鼠标后焦点的位置
  
  float m_Distance = 10.0f;// 控制摄像机的z位置，为实现缩放效果
  ```

- 当鼠标按着**中键**移动。目的是为了移动焦点m_FocalPoint

  1. 用移动后的鼠标坐标**减去**当前的鼠标坐标，得到偏移量是向量且有正负（可以实现斜着移动）
  2. 获取**方向向量**与**偏移量**相乘得到焦点的最终要平移的**数值**delta

  ```c++
  void EditorCamera::OnUpdate(Timestep ts)
  {
      if (Input::IsKeyPressed(Key::LeftAlt)) {
          const glm::vec2& mouse{ Input::GetMouseX(), Input::GetMouseY() };
          /*
  			若鼠标向右移动,mouse{1,0} - m_InitialMousePosition{0,0}= {1,0} 
  		*/ 
          glm::vec2 delta = (mouse - m_InitialMousePosition) * 0.003f;
          m_InitialMousePosition = mouse;
  
          if (Input::IsMouseButtonPressed(Mouse::ButtonMiddle)) {
              MousePan(delta); // 中键平移
          }
          ......
  
  ```

  ```c++
  // 移动焦点，从原点000移动到xy0点
  void EditorCamera::MousePan(const glm::vec2& delta)
  {
  	auto [xSpeed, ySpeed] = PanSpeed();
  	/*
  		加上负号是因为，焦点往右方向(1, 0, 0)移动到(1, 0， 0)点，使得物体左移效果
  				可见焦点移动方向与物体移动方向相反，加上负号才能使得焦点右移时变为向左移到(-1,0，0)，使得物体为右移
  	*/ 
  	/*
  		假设鼠标向右移动,delta{1,0},-GetRight(){ 1,0,0}->{-1,0,0},m_FocalPoint=m_FocalPoint{0,0,0}+{-1,0,0}={-1,0,0}
  				即焦点移动到-1,0,0的位置(左)是使得物体向右移动效果
  		假设鼠标向左移动,delta{-1,0},-GetRigh(){-1,0,0}->{ 1,0,0},m_FocalPoint=m_FocalPoint{0,0,0}+{ 1,0,0}={1,0,0}
  				即焦点移动到 1,0,0的位置(右)是使得物体向左移动效果
  	*/
  	m_FocalPoint += -GetRightDirection() * delta.x * xSpeed * m_Distance;
  	// 不加负号是因为，焦点往上方向(0,1,0)移动到(0,1,0)，使得物体下移效果
  	/*
  		假设鼠标向上移动,delta{ 0,1},GetUpDirection(){ 0,1,0},m_FocalPoint=m_FocalPoint{0,0,0}+{0,1,0}={ 0,1,0}
  				即焦点移动到 0,1,0(上)的位置是使得物体向下移动效果
  		假设鼠标向下移动,delta{0,-1},GetUpDirection(){0,-1,0},m_FocalPoint=m_FocalPoint{0,0,0}+{0,-1,0}={0,-1,0}
  				即焦点移动到0,-1,0(下)的位置是使得物体向上移动效果
  	*/
  	m_FocalPoint += GetUpDirection() * delta.y * ySpeed * m_Distance;
  }
  ```

  ```c++
  // 获得旋转矩阵沿着y轴的向量。
  // 返回vec3(0, 1, 0);或者 vec3(0, -1, 0)得到是往上还是往下的向量
  glm::vec3 EditorCamera::GetUpDirection() const
  {
      return glm::rotate(GetOrientation(), glm::vec3(0.0f, 1.0f, 0.0f));
  }
  // 获得旋转矩阵沿着x轴的向量。
  // 返回vec3(1, 0, 0)(右);或者 vec3(-1, 0, 0)(左)得到是往右还是往左的向量
  glm::vec3 EditorCamera::GetRightDirection() const
  {
      return glm::rotate(GetOrientation(), glm::vec3(1.0f, 0.0f, 0.0f));
  }
  ```

- 得到新的焦点后，计算摄像机的**位置**，再计算投影视图矩阵。

  摄像机的位置是由**焦点**m_FocalPoint和**焦距**m_Distance来决定的，m_Distance控制了摄像机的z位置（控制实现缩放效果）

  ```c++
  void EditorCamera::UpdateView()
  {
      // m_Yaw = m_Pitch = 0.0f; // 锁定摄像机的旋转角度 = 不旋转
      // 焦点沿着向后的方向得到摄像机的位置
      m_Position = CalculatePosition();
  
      glm::quat orientation = GetOrientation();
      m_ViewMatrix = glm::translate(glm::mat4(1.0f), m_Position) * glm::toMat4(orientation); //视图矩阵=位置矩阵*旋转矩阵*(缩放矩阵)
      m_ViewMatrix = glm::inverse(m_ViewMatrix);// 取逆才是物体的视图矩阵
  }
  ```

  ```c++
  // 获得摄像机的位置。m_Distance控制了摄像机的z位置（控制实现缩放效果）
  glm::vec3 EditorCamera::CalculatePosition() const
  {
      // 当m_Pitch、m_Yaw = 0 得到vec3(0,0,-1)向后的向量
      // temp = vec3(0,0,-1) * 10 = vec3(0,0,-10)。
      glm::vec3 temp = GetForwardDirection() * m_Distance;
      /*
  		m_FocalPoint(0,0,0) - temp(0,0,-10) = (0,0,10)
  		焦点向后移动10，得到摄像机的位置！(0,0,10)
  	*/
      return m_FocalPoint - temp;							
      //return m_FocalPoint - GetForwardDirection() * m_Distance;
  }
  ```

# 效果

![editorcamera](../图片/094.编辑时的摄像机/editorcamera.gif)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302313517.png)

Cherno说，由于没有开启裁剪，所以有双面，可以认为是3D。





