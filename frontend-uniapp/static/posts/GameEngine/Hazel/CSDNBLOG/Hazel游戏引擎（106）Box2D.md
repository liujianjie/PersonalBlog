> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 网址

  [Box2D库](https://box2d.org/documentation/index.html)

- 此节目的

  实现2D物理效果

- 如何实现

  使用Box2D库引入项目之中

- 实现细节

  - 实现物体效果需要rigidbody和box2dcollider两个组件
  - 添加了rigidbody和box2dcollider两个组件，需要修改面板以及序列化代码
  - 以后要实现：每次运行结束后可以重置物体的位置

# 运行原理浅谈

- box2D物理

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132111753.png)

  物体附有包围盒、标识什么类型的rigidbody等

  1. 创建一个2D环境(设置重力)
  2. 点击运行
  3. 由定义好的参数box2D计算模拟物体的下一帧的位置
  4. 然后把模拟的位置给物体的transform

- 有脚本的box2D物理运行顺序——有待搞清楚

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130005346.png)

  - Script-Physic-Render顺序

    脚本影响pyhsic然后渲染，**当前帧**得到结果

  - Physic-Script-Render顺序

    先Physic-脚本-渲染，则当前渲染的是**上一帧**的物理模拟计算的结果

# 关键代码+代码流程

- 设置box2D为当前项目的submodule，并重新运行premake程序生成项目

  ```cmd
   git submodule add https://github.com/TheCherno/box2d GameEngineLightWeight/vendor/box2d
  ```

- 设置盒型包围盒组件

  ```cpp
  struct Rigidbody2DComponent {
      enum class BodyType{Static = 0, Dynamic, Kinematic};
      BodyType Type = BodyType::Static;
      bool FixedRotation = false;
  
      // 运行时候物体的物理对象
      void* RuntimeBody = nullptr;
      Rigidbody2DComponent() = default;
      Rigidbody2DComponent(const Rigidbody2DComponent&) = default;
  };
  struct BoxCollider2DComponent {
      glm::vec2 Offset = { 0.0f, 0.0f };
      glm::vec2 Size = { 0.5f,0.5f };
  
      // TODO:移到物理材质
      float Density = 1.0f;           // 密度,0是静态的物理
      float Friction = 0.5f;          // 摩擦力
      float Restitution = 0.0f;       // 弹力，0不会弹跳，1无限弹跳
      float RestitutionThreshold = 0.5f;// 复原速度阈值，超过这个速度的碰撞就会被恢复原状（会反弹）。
  
      // 运行时候由于物理，每一帧的上述参数可能会变，所以保存为对象,但未使用
      void* RuntimeFixture = nullptr;
  
      BoxCollider2DComponent() = default;
      BoxCollider2DComponent(const BoxCollider2DComponent&) = default;
  };
  ```

- 创建Box2D世界、为具有物理组件的实体创建b2Body

  ```cpp
  void Scene::OnRuntimeStart()
  {
      // 1.创建一个物体世界/环境
      m_PhysicsWorld = new b2World({0.0f, -9.8f});// 重力加速度向下
      // 1.1为当前场景所有具有物理组件的实体创建b2Body
      auto view = m_Registry.view<Rigidbody2DComponent>();
      for (auto e : view) {
          Entity entity = { e, this };
          auto& transform = entity.GetComponent<TransformComponent>();
          auto& rb2d = entity.GetComponent<Rigidbody2DComponent>();
          // 2.1 主体定义用来指定动态类型和参数
          b2BodyDef bodyDef;
          bodyDef.type = Rigidbody2DTypeToBox2DBody(rb2d.Type);
          bodyDef.position.Set(transform.Translation.x, transform.Translation.y);
          bodyDef.angle = transform.Rotation.z;   // 绕着z轴旋转
          // 2.2 由b2BodyDef创建主体
          b2Body* body = m_PhysicsWorld->CreateBody(&bodyDef);
          body->SetFixedRotation(rb2d.FixedRotation); // 是否固定旋转
  
          rb2d.RuntimeBody = body;
  
          if (entity.HasComponent<BoxCollider2DComponent>()) {
              auto& bc2d = entity.GetComponent<BoxCollider2DComponent>();
              // 3.1定义盒子包围盒
              b2PolygonShape boxShape;
              boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y);// 包围盒跟随物体的size而变化
              // 3.2定义fixture，fixture包含定义的包围盒
              b2FixtureDef fixtureDef;
              fixtureDef.shape = &boxShape;
              fixtureDef.density = bc2d.Density;
              fixtureDef.friction = bc2d.Friction;
              fixtureDef.restitution = bc2d.Restitution;
              fixtureDef.restitutionThreshold = bc2d.RestitutionThreshold;
              // 3.3定义主体的fixture
              body->CreateFixture(&fixtureDef);
          }
      }
  }
  // 点击运行的时候创建物理世界环境
  void EditorLayer::OnScenePlay()
  {
      m_SceneState = SceneState::Play;
      m_ActiveScene->OnRuntimeStart();
  }
  ```

- Script-Physic-Render顺序

  脚本影响pyhsic然后渲染，**当前帧**得到结果

  ```cpp
  void Scene::OnUpdateRuntime(Timestep ts)
  {
      {
          // 先script脚本影响Physics变化再当前帧渲染出来
          // 迭代速度：使用更少的迭代可以提高性能，但准确性会受到影响。使用更多迭代会降低性能但会提高模拟质量
          // 有点不董。。。。说啥：时间步长和迭代次数完全无关。迭代不是子步骤
          // Cherno说迭代速度，多久进行一次计算模拟。好奇这个6，是时间单位吗，毫秒？
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
      if (mainCamera) {
          Renderer2D::BeginScene(*mainCamera, cameraTransform);
          auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
          for (auto entity : group) {
              // get返回的tuple里本是引用
              auto [tfc, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
              Renderer2D::DrawSprite(tfc.GetTransform(), sprite, (int)entity);
          }
          Renderer2D::EndScene();
      }
  ```

- 其它

  - 在属性面板显示物理组件（省略包围盒组件代码）

    ```cpp
    		DrawComponent<Rigidbody2DComponent>("Rigidbody 2D", entity, [](auto& component)
    		{
    			const char* bodyTypeStrings[] = { "Static", "Dynamic", "Kinematic" };
    			const char* currentBodyTypeString = bodyTypeStrings[(int)component.Type];
    			if (ImGui::BeginCombo("Body Type", currentBodyTypeString)) {
    				for (int i = 0; i < 2; i++) {
    					bool isSelected = currentBodyTypeString == bodyTypeStrings[i];
    					if (ImGui::Selectable(bodyTypeStrings[i], isSelected)) {
    						currentBodyTypeString = bodyTypeStrings[i];
    						component.Type = (Rigidbody2DComponent::BodyType)i;
    					}
    					if (isSelected)
    						ImGui::SetItemDefaultFocus();
    				}
    				ImGui::EndCombo();
    			}
    			ImGui::Checkbox("Fixed Rotation", &component.FixedRotation);
    		});
    ```

  - 场景yaml文件需保存和解析物理组件（省略包围盒组件）

    ```cpp
    if (entity.HasComponent<Rigidbody2DComponent>()) {
        out << YAML::Key << "Rigidbody2DComponent";
        out << YAML::BeginMap;
    
        auto& rb2dComponent = entity.GetComponent<Rigidbody2DComponent>();
        out << YAML::Key << "BodyType" << YAML::Value << RigidBody2DBodyTypeToString(rb2dComponent.Type);
        out << YAML::Key << "FixedRotation" << YAML::Value << (rb2dComponent.FixedRotation);
    
        out << YAML::EndMap;
    }
    if (entity.HasComponent<BoxCollider2DComponent>()) {
        out << YAML::Key << "BoxCollider2DComponent";
        out << YAML::BeginMap;
    
        auto& bc2dComponent = entity.GetComponent<BoxCollider2DComponent>();
        out << YAML::Key << "Offset" << YAML::Value << bc2dComponent.Offset;
        out << YAML::Key << "Size" << YAML::Value << bc2dComponent.Size;
        out << YAML::Key << "Density" << YAML::Value << bc2dComponent.Density;
        out << YAML::Key << "Friction" << YAML::Value << bc2dComponent.Friction;
        out << YAML::Key << "Restitution" << YAML::Value << bc2dComponent.Restitution;
        out << YAML::Key << "RestitutionThreshold" << YAML::Value << bc2dComponent.RestitutionThreshold;
    
        out << YAML::EndMap;
    }
    ```

# 效果

![1.xiaoguo](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132111322.gif)