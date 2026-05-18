> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了承上启下，在编辑场景显示实体物理组件的包围盒，更好调整包围盒的参数实现想要的结果。

  此节只完成了在面板上**显示调整包围盒参数**，下一节才渲染了包围盒

- 如何实现

  使用box2D的API，先得到圆形对象，设置半径，再被赋给fixture当参数

- 实现细节

  - 需添加圆形组件
  - 需设置圆形组件的属性面板
  - 圆形组件需被序列化yaml和解析yaml

- 以后要做的

  由于有20左右个组件，若每次添加一个组件都得设置新组件的属性面板有点麻烦，需要考虑建立**一个表**用for循环，简化代码

# 关键代码+代码流程

- 设置圆形包围盒组件

  ```cpp
  // Circle包围盒
  struct CircleCollider2DComponent {
      glm::vec2 Offset = { 0.0f, 0.0f };
      float Radius = 0.5f;
  
      // TODO:移到物理材质
      float Density = 1.0f;           // 密度,0是静态的物理
      float Friction = 0.5f;          // 摩擦力
      float Restitution = 0.0f;       // 弹力，0不会弹跳，1无限弹跳
      float RestitutionThreshold = 0.5f;// 复原速度阈值，超过这个速度的碰撞就会被恢复原状（会反弹）。
  
      // 运行时候由于物理，每一帧的上述参数可能会变，所以保存为对象,但未使用
      void* RuntimeFixture = nullptr;
  
      CircleCollider2DComponent() = default;
      CircleCollider2DComponent(const CircleCollider2DComponent&) = default;
  };
  ```

- 创建Box2D世界、为具有物理组件的实体创建b2Body

  ```cpp
  void Scene::OnRuntimeStart()
  {
      // 1.创建一个物体世界
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
              // 3.1定义Box包围盒
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
          if (entity.HasComponent<CircleCollider2DComponent>()) {
              auto& cc2d = entity.GetComponent<CircleCollider2DComponent>();
              // 3.1定义圆形包围盒
              b2CircleShape circleShape;
              circleShape.m_p.Set(cc2d.Offset.x, cc2d.Offset.y);
              circleShape.m_radius = cc2d.Radius;
              // 3.2定义fixture，fixture包含定义的包围盒
              b2FixtureDef fixtureDef;
              fixtureDef.shape = &circleShape;
              fixtureDef.density = cc2d.Density;
              fixtureDef.friction = cc2d.Friction;
              fixtureDef.restitution = cc2d.Restitution;
              fixtureDef.restitutionThreshold = cc2d.RestitutionThreshold;
              // 3.3定义主体的fixture
              body->CreateFixture(&fixtureDef);
          }
      }
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

  - 在属性面板显示圆形包围盒组件代码

    ```cpp
    		DrawComponent<CircleCollider2DComponent>("Circle Collider 2D", entity, [](auto& component)
    		{
    			ImGui::DragFloat2("Offset", glm::value_ptr(component.Offset));
    			ImGui::DragFloat("Radius", &component.Radius);
    			ImGui::DragFloat("Density", &component.Density, 0.01f, 0.0f, 1.0f);
    			ImGui::DragFloat("Friction", &component.Friction, 0.01f, 0.0f, 1.0f);
    			ImGui::DragFloat("Restitution", &component.Restitution, 0.01f, 0.0f, 1.0f);
    			ImGui::DragFloat("Restitution Threshold", &component.RestitutionThreshold, 0.01f, 0.0f);
    		});
    ```

  - 场景yaml文件需序列化保存和解析包围盒组件

    ```cpp
    // 序列化
    if (entity.HasComponent<CircleCollider2DComponent>()) {
        out << YAML::Key << "CircleCollider2DComponent";
        out << YAML::BeginMap;
    
        auto& cc2dComponent = entity.GetComponent<CircleCollider2DComponent>();
        out << YAML::Key << "Offset" << YAML::Value << cc2dComponent.Offset;
        out << YAML::Key << "Radius" << YAML::Value << cc2dComponent.Radius;
        out << YAML::Key << "Density" << YAML::Value << cc2dComponent.Density;
        out << YAML::Key << "Friction" << YAML::Value << cc2dComponent.Friction;
        out << YAML::Key << "Restitution" << YAML::Value << cc2dComponent.Restitution;
        out << YAML::Key << "RestitutionThreshold" << YAML::Value << cc2dComponent.RestitutionThreshold;
    
        out << YAML::EndMap;
    }
    // 解析
    auto circleColliderComponent = entity["CircleCollider2DComponent"];
    if (circleColliderComponent) {
        auto& bc2d = deserializedEntity.AddComponent<CircleCollider2DComponent>();
        bc2d.Offset = circleColliderComponent["Offset"].as<glm::vec2>();
        bc2d.Radius = circleColliderComponent["Radius"].as<float>();
        bc2d.Density = circleColliderComponent["Density"].as<float>();
        bc2d.Friction = circleColliderComponent["Friction"].as<float>();
        bc2d.Restitution = circleColliderComponent["Restitution"].as<float>();
        bc2d.RestitutionThreshold = circleColliderComponent["RestitutionThreshold"].as<float>();
    }
    ```

# 实现效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132149065.png)

![1.效果2](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132149470.png)

![1.效果3png](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132149883.png)