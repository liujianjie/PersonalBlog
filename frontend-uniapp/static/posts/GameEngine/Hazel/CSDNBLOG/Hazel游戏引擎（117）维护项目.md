> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  维护项目要完善和修理的地方

# 一些比较重要的完善

- 解决box的包围盒偏移位置物理计算不正确

  原pull request[链接](https://github.com/TheCherno/Hazel/pull/555)

  ```cpp
  void Scene::OnPhysics2DStart(){
      //boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y);
      // 包围盒的计算范围跟随物体的size、偏移位置而变化
      boxShape.SetAsBox(bc2d.Size.x * transform.Scale.x, bc2d.Size.y * transform.Scale.y,
                        b2Vec2(bc2d.Offset.x, bc2d.Offset.y), 0);
  ```

  ```cpp
  void EditorLayer::OnOverlayRender(){	
  for (auto entity : view) {
      auto [tc, bc2d] = view.get<TransformComponent, BoxCollider2DComponent>(entity);
      // 0.001fZ轴偏移量
      glm::vec3 translation = tc.Translation + glm::vec3(bc2d.Offset, 0.001f);
      glm::vec3 scale = tc.Scale * glm::vec3(bc2d.Size * 2.0f, 1.0f); // 注意bc2d.Size需乘以2，以免缩小一半
  
      // 若将偏移位置先和物体的位置相加后再与旋转相乘，会导致包围盒的位置很奇怪，所以不正确!!!!
      //glm::mat4 transform = glm::translate(glm::mat4(1.0f), translation)
      //	* rotation
      //	* glm::scale(glm::mat4(1.0f), scale);
  
      // 应该先物体的位置乘以旋转再乘偏移量才正确
      glm::mat4 transform = glm::translate(glm::mat4(1.0f), tc.Translation)
          * rotation
          * glm::translate(glm::mat4(1.0f), glm::vec3(bc2d.Offset, 0.001f))// 包围盒的位置还需要算上偏移位置
          * glm::scale(glm::mat4(1.0f), scale);
  
      Renderer2D::DrawRect(transform, glm::vec4(0, 1, 0, 1));// 绿色的包围盒
  }
  ```

  具体解释，参考第[112节]()

- 在场景视口点击物体，能显示被点击的物体边框来**标记区分**

  ```cpp
  void EditorLayer::OnOverlayRender(){	
      ......
  	// 绘画选择实体的轮廓
      if (Entity selectEntity = m_SceneHierarchyPanel.GetSelectedEntity()) {
          const TransformComponent& transform = selectEntity.GetComponent<TransformComponent>();
  
          Renderer2D::DrawRect(transform.GetTransform(), glm::vec4(1, 0.5, 0, 1));
      }
  ```

- 设置结构体来**初始化项目**

  - 缘由

    启动旧的Sandbox项目运行会报错，因为imgui设置了字体，但是sandbox当前目录下没有字体文件，字体文件在**hazelnut**（可视化编辑器项目）里。

  - 解决思路

    不想字体文件两个项目路径存在，所以需要**设置Sandbox当前目录为hazelnut的工作目录**，这样就可以读取在hazelnut里的字体文件。

    这个**设置**需要根据sandbox和hazelnut两个不同项目来分别设置，并且还有运行的窗口名称，所以融合在一起成为结构体来初始化项目运行程序。

  ```cpp
  struct ApplicationCommandLineArgs {
      int Count = 0;
      char** Args = nullptr;
  
      const char* operator[](int index) const
      {
          HZ_CORE_ASSERT(index < Count);
          return Args[index];
      }
     /*
      int main(int argc, char** argv)
      属性Count对应argc
      属性Args对应argv
     */
  };
  struct ApplicationSpecification {
      std::string Name = "Game Engine Application"; // 默认运行程序名称
      std::string WorkingDirectory;				// 工作目录
      ApplicationCommandLineArgs CommandLineArgs;
  
  };
  class HAZEL_API Application
  	{
  	public:
  		//Application(const std::string& name = "Game Engine", ApplicationCommandLineArgs args = ApplicationCommandLineArgs());
  		Application(const ApplicationSpecification& specification);
  		virtual ~Application();
  ```

  ```cpp
  class GameEngineEditor : public Application {
      public:
      //GameEngineEditor(ApplicationCommandLineArgs args)
      //	: Application("GameEngine Editor", args)
      GameEngineEditor(const ApplicationSpecification& spec)
          : Application(spec)// 将结构体传给父类
          {
              PushLayer(new EditorLayer());
          }
      ~GameEngineEditor() {
      }
  
  };
  // 定义entryPoint的main函数
  Application* CreateApplication(ApplicationCommandLineArgs args) {
      ApplicationSpecification spec;
      spec.Name = "GameEngine Editor";// 运行窗口名称
      spec.CommandLineArgs = args;
  
      return new GameEngineEditor(spec);
  }
  ```

  ```cpp
  class Sandbox : public Hazel::Application {
  public:
  	Sandbox(const Hazel::ApplicationSpecification& specification)
  		: Hazel::Application(specification) // 将结构体传给父类
  	{
  		PushLayer(new Sandbox2D());
  	}
  	~Sandbox() {
  	}
  
  };
  Hazel::Application* Hazel::CreateApplication(ApplicationCommandLineArgs args) {
  	ApplicationSpecification spec;
  	spec.Name = "Sandbox";	// 运行窗口名称
  	spec.WorkingDirectory = "../GameEngine-Editor";// 工作目录
  	spec.CommandLineArgs = args;
  	return new Sandbox(spec);
  }
  ```

  ```cpp
  Application::Application(const ApplicationSpecification& specification)
      : m_Specification(specification)
      {
          HZ_PROFILE_FUNCTION();
          //HZ_CORE_ASSERT(!s_Instance, "Application already exists!");
          s_Instance = this;
  
          // 设置工作目录
          if (!m_Specification.WorkingDirectory.empty()) {
              std::filesystem::current_path(m_Specification.WorkingDirectory);
          }
          // 创建窗口
          m_Window = Window::Create(WindowProps(m_Specification.Name));
          m_Window->SetEventCallback(BIND_EVENT_FN(OnEvent));
  ```

- Quad纹理图片围成的区域像素点为0，也会阻挡鼠标点击后面的物体

  所以需要像渲染圆形一样，在shader的fragment阶段检测如果alpha为0就丢弃

  ```cpp
  if (texColor.a == 0.0)
      discard;
  ```

- 序列化需保存场景里实体的纹理路径，解析的时候应根据纹理路径加载纹理

  ```cpp
  // 保存
  if (entity.HasComponent<SpriteRendererComponent>()) {
      out << YAML::Key << "SpriteRendererComponent";
      out << YAML::BeginMap;
  
      auto& spriteRendererComponent = entity.GetComponent<SpriteRendererComponent>();
      out << YAML::Key << "Color" << YAML::Value << spriteRendererComponent.Color;
      // 存储纹理路径
      if (spriteRendererComponent.Texture) {
          out << YAML::Key << "TexturePath" << YAML::Value << spriteRendererComponent.Texture->GetPath();
      }
      out << YAML::Key << "TilingFactor" << YAML::Value << spriteRendererComponent.TilingFactor;
      out << YAML::EndMap;
  }
  ```

  ```cpp
  // 解析
  auto spriteRendererComponent = entity["SpriteRendererComponent"];
  if (spriteRendererComponent) {
      auto& src = deserializedEntity.AddComponent<SpriteRendererComponent>();
      src.Color = spriteRendererComponent["Color"].as<glm::vec4>();
      if (spriteRendererComponent["TexturePath"]) {
          /////////////////////////////////////////
          // 加载纹理//////////////////////////////
          src.Texture = Texture2D::Create(spriteRendererComponent["TexturePath"].as<std::string>());
      }
      if (spriteRendererComponent["TilingFactor"]) {
          src.TilingFactor = spriteRendererComponent["TilingFactor"].as<float>();
      }
  }
  ```

- 给渲染Rect添加实体

  ```cpp
  DrawLine(p0, p1, color, entityID);
  DrawLine(p1, p2, color, entityID);
  DrawLine(p2, p3, color, entityID);
  DrawLine(p3, p0, color, entityID);
  ```

  