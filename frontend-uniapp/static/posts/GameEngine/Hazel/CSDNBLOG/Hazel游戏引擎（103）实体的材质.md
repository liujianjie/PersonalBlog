> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前前言

  由于开发引擎，渲染是一部分，所以前期跳过了给实体附加材质功能，从而开发其它比较重要的部分，其它基础功能写好后，再回到渲染部分写好渲染代码是正确的选择。

  由于2D和3D的纹理不一样，所以要设计一个好的纹理系统

- 目的

  为完成101节所说的**拖动**内容面板上的材质给实体，实体表面会显示这个材质

- 如何实现

  同102节实现拖动场景文件到viewport视口一样

  1. 只需要在实体的属性面板上**设置数据源**
  2. 目标**接受拖过来的文件路径**
  3. 然后加载这个材质，再drawcall绘画出来

# 关键代码+代码流程

- 在数据源上设置

  ```cpp
  void ContentBrowserPanel::OnImGuiRender()
  {			
      ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0, 0, 0, 0));// alpha为0 设置背景为无颜色
      ImGui::ImageButton((ImTextureID)icon->GetRendererID(), { thumbnailSize, thumbnailSize }, { 0,1 }, { 1,0 });// 1:ID，2：大小，3、4：左上角和右下角的uv坐标
      if (ImGui::BeginDragDropSource()) {
          ///////////////////////////////////////////////////////////////////////////
          // 数据源///////////////////////////////////////////////////////////////////
          // 这里设置拖动
          const wchar_t* itemPath = relativePath.c_str();
          ImGui::SetDragDropPayload("CONTENT_BROWSER_ITEM", itemPath, (wcslen(itemPath) + 1) * sizeof(wchar_t));
          ImGui::EndDragDropSource();
      }
  ```

- 在拖动目标上设置

  ```cpp
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  	{// 实体SpriteRendererComponent组件		
  		// 完善UI：模板类画组件的ui
  		DrawComponent<SpriteRendererComponent>("Sprite Renderer", entity, [](auto& component)
  		{
  			ImGui::ColorEdit4("Color", glm::value_ptr(component.Color));
  
  			ImGui::Button("Texture", ImVec2(100.0f, 0.0f));
  			if (ImGui::BeginDragDropTarget()) {
  				if (const ImGuiPayload* payload = ImGui::AcceptDragDropPayload("CONTENT_BROWSER_ITEM")) {
  					const wchar_t* path = (const wchar_t*)payload->Data;
  					std::filesystem::path texturePath = std::filesystem::path(g_AssetPath) / path;
  					// 判断是不是纹理？或者创建好后。创建的时候会有断言
  					component.Texture = Texture2D::Create(texturePath.string());
  				}
  			}
  			ImGui::DragFloat("Tiling Factor", &component.TilingFactor, 0.1f, 0.0f, 100.0f);
  		});
  ```

- editorlayer的update当前场景的update

  ```cpp
  void EditorLayer::OnUpdate(Timestep ts)
  {
      m_ActiveScene->OnUpdateEditor(ts, m_EditorCamera);
  ```

- 当前场景的update渲染物体

  ```cpp
  void Scene::OnUpdateEditor(Timestep ts, EditorCamera& camera)
  {
      Renderer2D::BeginScene(camera);
      auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
      for (auto entity : group) {
          auto [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
          //Renderer2D::DrawQuad(transform.GetTransform(), sprite.Color, (int)entity);
          Renderer2D::DrawSprite(transform.GetTransform(), sprite, (int)entity);
      }
      Renderer2D::EndScene();
  }
  ```

- Renderer2D调用drawcall绘制

  ```cpp
  void Renderer2D::DrawSprite(const glm::mat4& transform, SpriteRendererComponent& src, int entityID)
  {
      if (src.Texture) {
          DrawQuad(transform, src.Texture, src.TilingFactor, src.Color, entityID);
      }
      else {
          DrawQuad(transform, src.Color, entityID);
      }
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132110158.png)

# 未来要修改shader系统

- 问题讲述

  目前的shader系统有**缓存**，但是如果修改了glsl代码，系统没有感知源代码已经变了依旧会使用缓存，除非手动删除cache

  所以需要解决此问题

- 解决方法

  将上一个源代码保存为hash存在文件中yaml格式

  当前源代码与保存的hash文件**对比**，如果相同就使用缓存，不相同就重新编译

# Bug

效果图可见（最右边的纹理显示）有bug，批处理出了问题吧。。

- 解决方法

  修改glsl代码，将glsl的接受TexIndex的变量移出struct就行了

  ```glsl
  // Basic Texture Shader
  #type vertex
  #version 450 core
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec4 a_Color;
  layout(location = 2) in vec2 a_TexCoord;
  layout(location = 3) in float a_TexIndex;
  layout(location = 4) in float a_TilingFactor;
  layout(location = 5) in int a_EntityID;
  layout(std140, binding = 0) uniform Camera
  {
  	mat4 u_ViewProjection;
  };
  struct VertexOutput
  {
  	vec4 Color;
  	vec2 TexCoord;
  	//float TexIndex; // 移出struct
  	float TilingFactor;
  };
  layout(location = 0) out VertexOutput Output;
  ////////////////////////////////////////////////
  // 重点/////////////////////////////////////////
  layout(location = 3) out flat float v_TexIndex; // 移到这里
  layout(location = 4) out flat int v_EntityID;
  void main()
  {
  	Output.Color = a_Color;
  	Output.TexCoord = a_TexCoord;
  	//Output.TexIndex = a_TexIndex;
  	v_TexIndex = a_TexIndex;
  	Output.TilingFactor = a_TilingFactor;
  	v_EntityID = a_EntityID;
  	gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
  }
  #type fragment
  #version 450 core
  layout(location = 0) out vec4 color;
  layout(location = 1) out int color2;
  struct VertexOutput
  {
  	vec4 Color;
  	vec2 TexCoord;
  	//float TexIndex;
  	float TilingFactor;
  };
  layout(location = 0) in VertexOutput Input;
  layout(location = 3) in flat float v_TexIndex;
  layout(location = 4) in flat int v_EntityID;
  layout(binding = 0) uniform sampler2D u_Textures[32];
  void main()
  {
  	vec4 texColor = Input.Color;
  
  	//switch (int(Input.TexIndex))
  	switch (int(v_TexIndex))
  	{
  	case  0: texColor *= texture(u_Textures[0], Input.TexCoord * Input.TilingFactor); break;
  	......
  	}
  	color = texColor;
  	color2 = v_EntityID;
  }
  ```

- 为什么

  因为若TexIndex在struct里面，从顶点阶段到fragment阶段，顶点的TexIndex值不变，但是**两个顶点之间**像素点它会成为**线性插值后的值**，如下：

  所以要把TexIndex移出外面用**flat**声明不用线性插值

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130005520.png)

  